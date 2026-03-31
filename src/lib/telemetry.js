const ANON_KEY = "ep_anon_id";

function getAnonId() {
  let value = window.localStorage.getItem(ANON_KEY);
  if (!value) {
    value = `anon_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(ANON_KEY, value);
  }
  return value;
}

export async function trackEvent(name, payload = {}, options = {}) {
  if (!name) return;
  const body = {
    name,
    payload,
    moduleKey: options.moduleKey || null,
    screen: options.screen || null,
    anonId: getAnonId(),
    occurredAt: new Date().toISOString(),
  };

  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // no-op
  }
}
