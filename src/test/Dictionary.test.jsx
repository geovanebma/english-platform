import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Dictionary from "../components/Dictionary";

describe("Dictionary", () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      const target = String(url);
      if (target.includes("/api/progress")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            languages: { source_language: "pt-BR", learning_language: "en-US" },
          }),
        });
      }
      if (target.includes("/api/dictionary/words")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            words: ["The", "Then"],
            total: 2,
          }),
        });
      }
      if (target.includes("/api/dictionary/the")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            word: "the",
            ipa: "/ði/",
            audio_url: "",
            meanings: [
              {
                partOfSpeech: "article",
                english: "definite article",
                source: "artigo definido",
              },
            ],
            examples: ["the book"],
            synonyms: [],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("carrega lista e detalhes da palavra", async () => {
    render(<Dictionary setCurrentView={vi.fn()} color="#1a97b8" />);

    const wordBtn = await screen.findByRole("button", { name: "The" });
    fireEvent.click(wordBtn);

    const meaning = await screen.findByText(/definite article/i);
    expect(meaning).toBeInTheDocument();

    const example = await screen.findByText(/the book/i);
    expect(example).toBeInTheDocument();
  });
});
