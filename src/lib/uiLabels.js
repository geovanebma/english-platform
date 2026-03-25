const LABELS_STORAGE_KEY = "ep_ui_labels_cache";
const LOCALE_STORAGE_KEY = "ep_ui_labels_locale";

export function getUiLabel(key, fallback = "") {
  const labels = window.__uiLabels || {};
  return labels[key] || fallback;
}

export function setUiLabels(locale, labels) {
  window.__uiLabels = labels || {};
  window.__uiLocale = locale || "pt-BR";
  try {
    window.localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(labels || {}));
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale || "pt-BR");
  } catch {
    // no-op
  }
}

export function hydrateUiLabelsFromCache() {
  if (window.__uiLabels && Object.keys(window.__uiLabels).length) return;
  try {
    const raw = window.localStorage.getItem(LABELS_STORAGE_KEY);
    const locale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw) {
      window.__uiLabels = JSON.parse(raw);
      window.__uiLocale = locale || "pt-BR";
    }
  } catch {
    // no-op
  }
}

