import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Chrome,
  Facebook,
  GraduationCap,
  HeartHandshake,
  Lock,
  Mail,
  SearchCheck,
  UserRound,
} from "lucide-react";
import { registerAccount, startOAuth } from "../lib/authClient";
import { getUiLabel } from "../lib/uiLabels";

const GOAL_OPTIONS = [
  { value: "travel", labelKey: "signup.goal.travel", label: "Travel", icon: "??" },
  { value: "work", labelKey: "signup.goal.work", label: "Advance my career", icon: "??" },
  { value: "study", labelKey: "signup.goal.study", label: "Progress in studies", icon: "??" },
  { value: "fun", labelKey: "signup.goal.fun", label: "Have fun", icon: "??" },
  { value: "people", labelKey: "signup.goal.people", label: "Connect with people", icon: "??" },
  { value: "other", labelKey: "signup.goal.other", label: "Other", icon: "?" },
];

const REFERRAL_OPTIONS = [
  { value: "Instagram", labelKey: "signup.ref.instagram", label: "Instagram" },
  { value: "TikTok", labelKey: "signup.ref.tiktok", label: "TikTok" },
  { value: "Google", labelKey: "signup.ref.google", label: "Google" },
  { value: "YouTube", labelKey: "signup.ref.youtube", label: "YouTube" },
  { value: "Amigo(a)", labelKey: "signup.ref.friend", label: "Friend" },
  { value: "Professor(a)", labelKey: "signup.ref.teacher", label: "Teacher" },
  { value: "LinkedIn", labelKey: "signup.ref.linkedin", label: "LinkedIn" },
  { value: "Outro", labelKey: "signup.ref.other", label: "Other" },
];

const PROFICIENCY_OPTIONS = [
  { value: "nenhum", labelKey: "signup.proficiency.none", label: "Starting from scratch" },
  { value: "iniciante", labelKey: "signup.proficiency.beginner", label: "I have seen the basics" },
  { value: "basico", labelKey: "signup.proficiency.basic", label: "I can understand simple sentences" },
  { value: "intermediario", labelKey: "signup.proficiency.intermediate", label: "I can handle conversations" },
  { value: "avancado", labelKey: "signup.proficiency.advanced", label: "I want to polish fluency" },
];

const DAILY_GOALS = [5, 10, 15, 20, 30, 45];

function persistDraft(draft) {
  window.localStorage.setItem("ep_onboarding_draft", JSON.stringify(draft));
}

function OnboardingSignup({
  siteLanguage,
  selectedLanguage,
  onBack,
  switchToLogin,
  onAuthSuccess,
}) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("travel");
  const [referralSource, setReferralSource] = useState("Instagram");
  const [proficiency, setProficiency] = useState("nenhum");
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(15);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [startMode, setStartMode] = useState("zero");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [providerMessage, setProviderMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onboardingPayload = useMemo(
    () => ({
      site_language: siteLanguage,
      learning_language: selectedLanguage?.code || "en-US",
      learning_label: selectedLanguage?.label || "Ingles",
      goal,
      referral_source: referralSource,
      proficiency,
      daily_goal_minutes: Number(dailyGoalMinutes || 15),
      notifications_enabled: Boolean(notificationsEnabled),
      start_mode: startMode,
    }),
    [siteLanguage, selectedLanguage, goal, referralSource, proficiency, dailyGoalMinutes, notificationsEnabled, startMode]
  );

  const currentStepTitle = useMemo(() => {
    if (step === 0) {
      const template = getUiLabel("signup.title.step0", "You want to learn {language} to...");
      const languageLabel = selectedLanguage?.label || getUiLabel("language.unknown", "this language");
      return template.replace("{language}", String(languageLabel).toLowerCase());
    }
    if (step === 1) return getUiLabel("signup.title.step1", "Before building your path, we want to know you better.");
    return getUiLabel("signup.title.step2", "Now we will create your profile.");
  }, [step, selectedLanguage]);

  const handleSocial = (provider) => {
    setMessage("");
    const template = getUiLabel("signup.oauth.prep", "Preparing {provider} sign-up...");
    setProviderMessage(template.replace("{provider}", provider));
    persistDraft(onboardingPayload);
    startOAuth(provider.toLowerCase());
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setProviderMessage("");
    setLoading(true);
    try {
      const response = await registerAccount({
        name,
        email,
        password,
        onboarding: onboardingPayload,
      });
      window.localStorage.removeItem("ep_onboarding_draft");
      const template = getUiLabel("signup.auth.success", "Account created for {name}.");
      setMessage(template.replace("{name}", response.user.name));
      await onAuthSuccess?.();
    } catch (error) {
      setMessage(error?.response?.data?.error || getUiLabel("signup.auth.error", "We couldn't create the account right now."));
    } finally {
      setLoading(false);
    }
  };

  const goalOption = GOAL_OPTIONS.find((item) => item.value === goal);
  const proficiencyOption = PROFICIENCY_OPTIONS.find((item) => item.value === proficiency);
  const dailyGoalLabel = getUiLabel("signup.daily_goal_minutes", "{minutes} min").replace("{minutes}", String(dailyGoalMinutes));
  const startModeLabel = startMode === "level_check"
    ? getUiLabel("signup.find_level", "Find my level")
    : getUiLabel("signup.start_zero", "Start from zero");

  return (
    <section className="duo-onboarding-shell">
      <header className="duo-onboarding-topbar">
        <button type="button" className="duo-public-back is-inline" onClick={step === 0 ? onBack : () => setStep(step - 1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="duo-onboarding-progress">
          <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>
      </header>

      <div className="duo-onboarding-stage">
        <div className="duo-onboarding-hero">
          <div className="duo-onboarding-mascot">
            <img src="/img/persons/duo.png" alt="Duo" />
          </div>
          <div className="duo-onboarding-bubble">{currentStepTitle}</div>
        </div>

        {step === 0 ? (
          <div className="duo-choice-grid">
            {GOAL_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`duo-choice-card ${goal === item.value ? "is-selected" : ""}`}
                onClick={() => setGoal(item.value)}
              >
                <span>{item.icon}</span>
                <strong>{getUiLabel(item.labelKey, item.label)}</strong>
              </button>
            ))}
            <div className="duo-onboarding-footer">
              <button type="button" className="duo-onboarding-next" onClick={() => setStep(1)}>
                {getUiLabel("common.continue", "Continue")}
              </button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="duo-onboarding-form-card">
            <div className="duo-onboarding-grid">
              <label className="duo-onboarding-field">
                <span>{getUiLabel("signup.referral", "Who recommended Duolingo?")}</span>
                <select value={referralSource} onChange={(e) => setReferralSource(e.target.value)}>
                  {REFERRAL_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {getUiLabel(item.labelKey, item.label || item.value)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="duo-onboarding-field">
                <span>{getUiLabel("signup.proficiency", "How much do you understand?")}</span>
                <select value={proficiency} onChange={(e) => setProficiency(e.target.value)}>
                  {PROFICIENCY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {getUiLabel(item.labelKey, item.label)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="duo-onboarding-field">
                <span>{getUiLabel("signup.daily_goal", "Daily goal")}</span>
                <select value={dailyGoalMinutes} onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}>
                  {DAILY_GOALS.map((item) => (
                    <option key={item} value={item}>
                      {getUiLabel("signup.daily_goal_minutes", "{minutes} min").replace("{minutes}", String(item))}
                    </option>
                  ))}
                </select>
              </label>

              <div className="duo-onboarding-field is-toggle">
                <span>{getUiLabel("signup.notifications", "Allow notifications")}</span>
                <button
                  type="button"
                  className={`duo-toggle-btn ${notificationsEnabled ? "is-on" : ""}`}
                  onClick={() => setNotificationsEnabled((current) => !current)}
                >
                  <Bell size={16} />
                  {notificationsEnabled
                    ? getUiLabel("signup.toggle_on", "Enabled")
                    : getUiLabel("signup.toggle_off", "Disabled")}
                </button>
              </div>
            </div>

            <div className="duo-start-mode-row">
              <button
                type="button"
                className={`duo-start-mode-card ${startMode === "zero" ? "is-selected" : ""}`}
                onClick={() => setStartMode("zero")}
              >
                <GraduationCap size={18} />
                <strong>{getUiLabel("signup.start_zero", "Start from zero")}</strong>
                <span>{getUiLabel("signup.start_zero_desc", "We will build a guided path for you.")}</span>
              </button>
              <button
                type="button"
                className={`duo-start-mode-card ${startMode === "level_check" ? "is-selected" : ""}`}
                onClick={() => setStartMode("level_check")}
              >
                <SearchCheck size={18} />
                <strong>{getUiLabel("signup.find_level", "Find my level")}</strong>
                <span>{getUiLabel("signup.find_level_desc", "We will prioritize assessments and diagnostic modules.")}</span>
              </button>
            </div>

            <div className="duo-onboarding-footer">
              <button type="button" className="duo-onboarding-next" onClick={() => setStep(2)}>
                {getUiLabel("common.continue", "Continue")}
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="duo-onboarding-register">
            <div className="duo-onboarding-summary-card">
              <h2>{getUiLabel("signup.summary_title", "Your plan summary")}</h2>
              <div className="duo-onboarding-summary-grid">
                <article>
                  <Briefcase size={18} />
                  <span>{getUiLabel("signup.summary_goal", "Goal")}</span>
                  <strong>{goalOption ? getUiLabel(goalOption.labelKey, goalOption.label) : ""}</strong>
                </article>
                <article>
                  <HeartHandshake size={18} />
                  <span>{getUiLabel("signup.summary_level", "Current level")}</span>
                  <strong>{proficiencyOption ? getUiLabel(proficiencyOption.labelKey, proficiencyOption.label) : ""}</strong>
                </article>
                <article>
                  <Bell size={18} />
                  <span>{getUiLabel("signup.summary_daily", "Daily goal")}</span>
                  <strong>{dailyGoalLabel}</strong>
                </article>
                <article>
                  <SearchCheck size={18} />
                  <span>{getUiLabel("signup.summary_start_mode", "Start mode")}</span>
                  <strong>{startModeLabel}</strong>
                </article>
              </div>
            </div>

            <div className="duo-onboarding-auth-card">
              <div className="auth-social-stack is-compact">
                <button type="button" className="auth-social-btn is-google" onClick={() => handleSocial("Google")}>
                  <Chrome size={18} />
                  {getUiLabel("signup.oauth.google", "Continue with Google")}
                </button>
                <button type="button" className="auth-social-btn is-facebook" onClick={() => handleSocial("Facebook")}>
                  <Facebook size={18} />
                  {getUiLabel("signup.oauth.facebook", "Continue with Facebook")}
                </button>
              </div>

              <div className="auth-divider"><span>{getUiLabel("signup.auth.or_create", "or create your account")}</span></div>

              <form className="auth-form" onSubmit={handleRegister}>
                <label className="auth-field">
                  <span>{getUiLabel("signup.auth.name", "Name")}</span>
                  <div className="auth-input-wrap">
                    <UserRound size={16} />
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder={getUiLabel("signup.auth.name_placeholder", "Your name")} required />
                  </div>
                </label>
                <label className="auth-field">
                  <span>{getUiLabel("signup.auth.email", "Email")}</span>
                  <div className="auth-input-wrap">
                    <Mail size={16} />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={getUiLabel("signup.auth.email_placeholder", "you@example.com")} required />
                  </div>
                </label>
                <label className="auth-field">
                  <span>{getUiLabel("signup.auth.password", "Password")}</span>
                  <div className="auth-input-wrap">
                    <Lock size={16} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={getUiLabel("signup.auth.password_placeholder", "Create a password")} required />
                  </div>
                </label>

                <button type="submit" className="auth-primary-btn" disabled={loading}>
                  {loading ? getUiLabel("signup.auth.creating", "Creating profile...") : getUiLabel("signup.auth.create", "Create profile")}
                </button>
              </form>

              {message ? <p className="auth-feedback">{message}</p> : null}
              {providerMessage ? <p className="auth-feedback is-soft">{providerMessage}</p> : null}

              <p className="auth-switch-copy">
                {getUiLabel("signup.auth.has_account", "Already have an account?")}{" "}
                <button type="button" onClick={switchToLogin}>
                  {getUiLabel("signup.auth.login_now", "Login now")}
                </button>
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default OnboardingSignup;
