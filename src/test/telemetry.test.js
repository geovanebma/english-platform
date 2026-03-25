import { vi } from "vitest";
import { trackEvent } from "../lib/telemetry";

describe("telemetry", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envia evento com payload", async () => {
    await trackEvent("screen_view", { view: "welcome" }, { screen: "welcome" });
    expect(global.fetch).toHaveBeenCalled();
  });
});
