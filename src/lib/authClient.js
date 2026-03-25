import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me", {
    validateStatus: (status) => status >= 200 && status < 500,
  });
  return data;
}

export async function registerAccount(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginAccount(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function logoutAccount() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function getSubscription() {
  const { data } = await api.get("/subscription/me");
  return data;
}

export async function upgradeSubscription(plan = "premium") {
  const { data } = await api.post("/subscription/mock-upgrade", { plan });
  return data;
}

export function startOAuth(provider) {
  window.location.href = `/api/auth/oauth/${provider}/start`;
}

const FALLBACK_LANGUAGE_CATALOG = {
  site_languages: [
    { code: "pt-BR", label: "Português", available_count: 8 },
    { code: "en-US", label: "English", available_count: 20 },
  ],
  languagesBySite: {
    "pt-BR": [
      { code: "en-US", label: "Inglês", native_label: "English", flag: "🇺🇸", learners_display: "24 mi alunos" },
      { code: "es-ES", label: "Espanhol", native_label: "Español", flag: "🇪🇸", learners_display: "6,21 mi alunos" },
      { code: "fr-FR", label: "Francês", native_label: "Français", flag: "🇫🇷", learners_display: "3,17 mi alunos" },
      { code: "it-IT", label: "Italiano", native_label: "Italiano", flag: "🇮🇹", learners_display: "2,38 mi alunos" },
      { code: "de-DE", label: "Alemão", native_label: "Deutsch", flag: "🇩🇪", learners_display: "1,38 mi alunos" },
      { code: "ja-JP", label: "Japonês", native_label: "日本語", flag: "🇯🇵", learners_display: "477 mil alunos" },
      { code: "ko-KR", label: "Coreano", native_label: "한국어", flag: "🇰🇷", learners_display: "380 mil alunos" },
      { code: "zh-CN", label: "Chinês", native_label: "中文", flag: "🇨🇳", learners_display: "177 mil alunos" },
    ],
    "en-US": [
      { code: "es-ES", label: "Spanish", native_label: "Español", flag: "🇪🇸", learners_display: "28M learners" },
      { code: "fr-FR", label: "French", native_label: "Français", flag: "🇫🇷", learners_display: "17M learners" },
      { code: "de-DE", label: "German", native_label: "Deutsch", flag: "🇩🇪", learners_display: "15M learners" },
      { code: "it-IT", label: "Italian", native_label: "Italiano", flag: "🇮🇹", learners_display: "12M learners" },
      { code: "pt-BR", label: "Portuguese", native_label: "Português", flag: "🇧🇷", learners_display: "11M learners" },
      { code: "ja-JP", label: "Japanese", native_label: "日本語", flag: "🇯🇵", learners_display: "9M learners" },
      { code: "ko-KR", label: "Korean", native_label: "한국어", flag: "🇰🇷", learners_display: "8M learners" },
      { code: "zh-CN", label: "Chinese", native_label: "中文", flag: "🇨🇳", learners_display: "8M learners" },
    ],
  },
};

export async function getOnboardingCatalog(siteLanguage = "pt-BR") {
  try {
    const { data } = await api.get("/onboarding/catalog", {
      params: { siteLanguage },
      validateStatus: (status) => status >= 200 && status < 500,
    });
    if (data?.languages?.length) return data;
  } catch {
    // fallback below
  }

  return {
    site_languages: FALLBACK_LANGUAGE_CATALOG.site_languages,
    languages: FALLBACK_LANGUAGE_CATALOG.languagesBySite[siteLanguage] || FALLBACK_LANGUAGE_CATALOG.languagesBySite["pt-BR"],
  };
}

export async function completeProfileSetup(payload) {
  const { data } = await api.post("/profile/setup", payload);
  return data;
}
