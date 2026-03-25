import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import App from "../App";

vi.mock("../lib/authClient", () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error("no auth")),
  completeProfileSetup: vi.fn(),
  logoutAccount: vi.fn(),
  upgradeSubscription: vi.fn(),
  getOnboardingCatalog: vi.fn().mockResolvedValue({
    site_languages: [{ code: "pt-BR", label: "Português", available_count: 8 }],
  }),
}));

describe("App smoke", () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      const target = String(url);
      if (target.includes("/api/progress")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            app_navigation: { root_view: "welcome" },
            languages: { source_language: "pt-BR", learning_language: "en-US" },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza a landing page", async () => {
    render(<App />);
    const cta = await screen.findByRole("button", { name: /COMECE AGORA/i });
    expect(cta).toBeInTheDocument();
  });
});
