import React, { Suspense, useCallback, useEffect, useState } from "react";
import { completeProfileSetup, getCurrentUser, logoutAccount, upgradeSubscription } from "./lib/authClient";
import { trackEvent } from "./lib/telemetry";
import { clearLocalProgressDirty, isLocalProgressDirty, readLocalProgress } from "./lib/progressLocal";
import { hydrateUiLabelsFromCache, setUiLabels } from "./lib/uiLabels";

const LoginPage = React.lazy(() => import("./components/Login"));
const RegisterPage = React.lazy(() => import("./components/Register"));
const Initial = React.lazy(() => import("./components/Initial"));
const WelcomeLanding = React.lazy(() => import("./components/WelcomeLanding"));
const LanguageSelection = React.lazy(() => import("./components/LanguageSelection"));
const OnboardingSignup = React.lazy(() => import("./components/OnboardingSignup"));

function ensureAppNavigation(progress) {
  const data = progress || {};
  if (!data.app_navigation) {
    data.app_navigation = {
      root_view: "welcome",
    };
  }
  return data;
}

async function readAppNavigation() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  return ensureAppNavigation(await res.json());
}

async function writeAppNavigation(rootView) {
  const progress = await readAppNavigation();
  progress.app_navigation = {
    ...(progress.app_navigation || {}),
    root_view: rootView,
  };

  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(progress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
}

function App() {
  const [view, setView] = useState("welcome");
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [siteLanguage, setSiteLanguage] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return window.localStorage.getItem("ep_site_language") || "pt-BR";
      } catch {
        // no-op
      }
    }
    return "pt-BR";
  });
  const [selectedLearningLanguage, setSelectedLearningLanguage] = useState(null);
  const [uiLocale, setUiLocale] = useState("pt-BR");
  const [labelsVersion, setLabelsVersion] = useState(0);

  const handleSiteLanguageChange = useCallback((value) => {
    setSiteLanguage(value);
    try {
      window.localStorage.setItem("ep_site_language", value);
    } catch {
      // no-op
    }
  }, []);

  const applyPendingOnboardingDraft = useCallback(async () => {
    const draft = window.localStorage.getItem("ep_onboarding_draft");
    if (!draft) return false;

    try {
      await completeProfileSetup(JSON.parse(draft));
      window.localStorage.removeItem("ep_onboarding_draft");
      return true;
    } catch {
      return false;
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const payload = await getCurrentUser();
      const user = payload.user || null;
      setAuthUser(user);
      return user;
    } catch {
      setAuthUser(null);
      return null;
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      let restoredView = "welcome";
      try {
        const progress = await readAppNavigation();
        restoredView = progress?.app_navigation?.root_view || "welcome";
      } catch {
        // no-op
      }

      const user = await refreshAuth();
      if (!mounted) return;

      if (user) {
        await applyPendingOnboardingDraft();
        setView("initial");
        return;
      }

      setView(["welcome", "language", "onboarding", "login", "register"].includes(restoredView) ? restoredView : "welcome");
    })();

    return () => {
      mounted = false;
    };
  }, [refreshAuth]);

  useEffect(() => {
    if (!authReady) return;

    const persistedView =
      authUser ? "initial" : ["welcome", "language", "onboarding", "login", "register"].includes(view) ? view : "welcome";
    void writeAppNavigation(persistedView).catch(() => {
      // no-op
    });
  }, [view, authReady, authUser]);

  useEffect(() => {
    if (!authReady) return;
    trackEvent("screen_view", { view }, { screen: view });
  }, [view, authReady]);

  useEffect(() => {
    hydrateUiLabelsFromCache();
  }, []);

  useEffect(() => {
    const nextLocale =
      authUser?.profile?.source_language || authUser?.profile?.ui_language || siteLanguage || "pt-BR";
    setUiLocale(nextLocale);
  }, [authUser, siteLanguage]);

  useEffect(() => {
    if (!uiLocale) return;
    fetch(`/api/i18n/labels?locale=${encodeURIComponent(uiLocale)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.labels) {
          setUiLabels(uiLocale, data.labels);
          setLabelsVersion((prev) => prev + 1);
        }
      })
      .catch(() => {
        // no-op
      });
  }, [uiLocale]);

  useEffect(() => {
    if (!authReady || !authUser) return;
    if (!isLocalProgressDirty()) return;
    const localProgress = readLocalProgress();
    if (!localProgress || Object.keys(localProgress).length === 0) return;

    fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(localProgress),
    })
      .then((res) => {
        if (res.ok) clearLocalProgressDirty();
      })
      .catch(() => {
        // no-op
      });
  }, [authReady, authUser]);

  const switchToLogin = (e) => {
    if (e) e.preventDefault();
    setView("login");
  };

  const switchToRegister = (e) => {
    if (e) e.preventDefault();
    setView("register");
  };

  const switchToInitial = (e) => {
    if (e) e.preventDefault();
    setView(authUser ? "initial" : "welcome");
  };

  const switchToWelcome = (e) => {
    if (e) e.preventDefault();
    setView("welcome");
  };

  const handleAuthSuccess = async () => {
    await refreshAuth();
    await applyPendingOnboardingDraft();
    setView("initial");
  };

  const handleLogout = async () => {
    try {
      await logoutAccount();
    } finally {
      await refreshAuth();
      setSelectedLearningLanguage(null);
      setView("welcome");
    }
  };

  const handleUpgradePlan = async () => {
    try {
      await upgradeSubscription("premium");
      await refreshAuth();
    } catch {
      // no-op
    }
  };

  if (!authReady) {
    return <div className="App" role="status" aria-live="polite" />;
  }

  return (
    <div className="App">
      <Suspense
        fallback={
          <div className="app-loading" role="status" aria-live="polite">
            Carregando...
          </div>
        }
      >
        {view === "welcome" && (
          <WelcomeLanding
            siteLanguage={siteLanguage}
            onSiteLanguageChange={handleSiteLanguageChange}
            onStart={() => setView("language")}
            onLogin={switchToLogin}
            labelsVersion={labelsVersion}
          />
        )}
        {view === "language" && (
          <LanguageSelection
            siteLanguage={siteLanguage}
            onSiteLanguageChange={handleSiteLanguageChange}
            onBack={switchToWelcome}
            onSelectLanguage={(language) => {
              setSelectedLearningLanguage(language);
              setView("onboarding");
            }}
            labelsVersion={labelsVersion}
          />
        )}
        {view === "onboarding" && (
          <OnboardingSignup
            siteLanguage={siteLanguage}
            selectedLanguage={selectedLearningLanguage}
            onBack={() => setView("language")}
            switchToLogin={switchToLogin}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
        {view === "initial" && (
          <Initial
            switchToRegister={switchToRegister}
            switchToLogin={switchToLogin}
            authUser={authUser}
            authReady={authReady}
            onLogout={handleLogout}
            onUpgradePlan={handleUpgradePlan}
          />
        )}
        {view === "login" && (
          <LoginPage
            switchToRegister={switchToRegister}
            switchToInitial={switchToWelcome}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
        {view === "register" && (
          <RegisterPage
            switchToLogin={switchToLogin}
            switchToInitial={switchToWelcome}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;

