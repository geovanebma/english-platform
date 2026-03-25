import React, { useEffect, useRef, useState } from "react";

import { ArrowLeft, Search, Volume2 } from "lucide-react";

import ModuleGuideButton from "./ModuleGuideButton";
import { getUiLabel } from "../lib/uiLabels";
import { trackEvent } from "../lib/telemetry";

const PAGE_SIZE = 100;

const SOURCE_LANG_LABELS = {
  "pt-br": "Portugues (Brasil)",
  pt: "Portugues",
  en: "English",
  "en-us": "English (US)",
  es: "Espanol",
  fr: "Francais",
  de: "Deutsch",
  it: "Italiano",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
};

const PART_OF_SPEECH_LABELS = {
  noun: "noun",
  verb: "verb",
  adjective: "adjective",
  adverb: "adverb",
  pronoun: "pronoun",
  preposition: "preposition",
  conjunction: "conjunction",
  interjection: "interjection",
  determiner: "determiner",
  article: "article",
  auxiliary: "auxiliary",
  modal: "modal",
  phrase: "phrase",
  unknown: "unknown",
};

function hexToRgb(hex) {
  const cleaned = (hex || "#1a97b8").replace("#", "");
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const int = Number.parseInt(normalized, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function alpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferPartOfSpeech(word, englishDefinition = "") {
  const normalizedWord = String(word || "").toLowerCase();
  const normalizedDefinition = String(englishDefinition || "").toLowerCase();

  const verbWords = new Set([
    "be",
    "am",
    "is",
    "are",
    "was",
    "were",
    "been",
    "being",
    "do",
    "does",
    "did",
    "have",
    "has",
    "had",
    "go",
    "goes",
    "went",
    "gone",
    "make",
    "take",
    "say",
    "know",
    "think",
    "see",
    "come",
    "want",
    "look",
    "use",
    "find",
    "give",
    "tell",
    "work",
    "call",
    "try",
    "ask",
    "need",
    "feel",
    "become",
    "leave",
  ]);

  const pronounWords = new Set([
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "their",
    "our",
    "mine",
    "yours",
    "hers",
    "theirs",
  ]);

  const determinerWords = new Set([
    "a",
    "an",
    "the",
    "this",
    "that",
    "these",
    "those",
    "some",
    "any",
    "each",
    "every",
    "much",
    "many",
  ]);

  const prepositionWords = new Set([
    "in",
    "on",
    "at",
    "by",
    "for",
    "with",
    "from",
    "to",
    "into",
    "about",
    "after",
    "before",
    "under",
    "over",
    "between",
  ]);

  const conjunctionWords = new Set([
    "and",
    "or",
    "but",
    "because",
    "although",
    "though",
    "while",
    "if",
    "unless",
  ]);

  const modalWords = new Set(["can", "could", "may", "might", "must", "should", "would", "shall", "will"]);

  if (pronounWords.has(normalizedWord)) return "pronoun";

  if (determinerWords.has(normalizedWord)) {
    return normalizedWord === "a" || normalizedWord === "an" || normalizedWord === "the"
      ? "article"
      : "determiner";
  }

  if (prepositionWords.has(normalizedWord)) return "preposition";

  if (conjunctionWords.has(normalizedWord)) return "conjunction";

  if (modalWords.has(normalizedWord)) return "modal";

  if (verbWords.has(normalizedWord)) return "verb";

  if (normalizedDefinition.startsWith("to ")) return "verb";

  if (normalizedWord.endsWith("ly")) return "adverb";

  if (/(tion|sion|ness|ment|ship|hood|ism|ist|ity|er|or)$/.test(normalizedWord)) return "noun";

  if (/(able|ible|ous|ful|less|al|ive|ic|ish|ary)$/.test(normalizedWord)) return "adjective";

  if (normalizedWord.includes(" ")) return "phrase";

  return "noun";
}

function normalizePartOfSpeech(partOfSpeech, word, englishDefinition) {
  const normalized = String(partOfSpeech || "").trim().toLowerCase();
  if (normalized && normalized !== "unknown") return PART_OF_SPEECH_LABELS[normalized] || normalized;
  return inferPartOfSpeech(word, englishDefinition);
}

function getLangCode(langTag, fallback = "en") {
  if (!langTag || typeof langTag !== "string") return fallback;
  return langTag.toLowerCase();
}

function getBaseLang(langTag, fallback = "en") {
  const normalized = getLangCode(langTag, fallback);
  return normalized.split("-")[0] || fallback;
}

function getSourceLabel(langTag) {
  const normalized = getLangCode(langTag, "pt-br");
  return SOURCE_LANG_LABELS[normalized] || SOURCE_LANG_LABELS[getBaseLang(normalized)] || normalized;
}

async function readProgressLanguages() {
  try {
    const res = await fetch("/api/progress", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao ler progresso");
    const data = await res.json();
    return {
      source: data?.languages?.source_language || "pt-BR",
      learning: data?.languages?.learning_language || "en-US",
    };
  } catch {
    return { source: "pt-BR", learning: "en-US" };
  }
}

async function readDictionaryWordsPage(page, pageSize, searchTerm = "") {
  try {
    const term = normalizeSearchText(searchTerm);
    const res = await fetch(
      `/api/dictionary/words?page=${page}&limit=${pageSize}&search=${encodeURIComponent(term)}`
    );
    if (!res.ok) throw new Error("Falha ao carregar lista");
    const data = await res.json();
    const words = Array.isArray(data?.words) ? data.words : [];
    const total = Number(data?.total || words.length || 0);
    return { words, total };
  } catch {
    return { words: [], total: 0 };
  }
}

async function fetchWordDetail(word, learningLanguage, sourceLanguage) {
  const sourceBase = getBaseLang(sourceLanguage, "pt");
  let phonetic = "/";
  let phoneticVariants = [];
  let synonyms = [];
  let meanings = [];
  let examples = [];

  try {
    const res = await fetch(
      `/api/dictionary/${encodeURIComponent(word.toLowerCase())}?source=${encodeURIComponent(sourceBase)}`
    );

    if (res.ok) {
      const data = await res.json();
      phonetic = data?.ipa || "/";
      if (data?.ipa || data?.audio_url) {
        phoneticVariants = [
          {
            id: `ipa-${word}`,
            label: "IPA",
            text: data.ipa || phonetic,
            audio: data.audio_url || "",
          },
        ];
      }

      let rawMeanings = data?.meanings;
      if (typeof rawMeanings === "string") {
        try {
          rawMeanings = JSON.parse(rawMeanings);
        } catch {
          rawMeanings = [];
        }
      }
      if (!Array.isArray(rawMeanings)) rawMeanings = [];

      let rawExamples = data?.examples;
      if (typeof rawExamples === "string") {
        try {
          rawExamples = JSON.parse(rawExamples);
        } catch {
          rawExamples = [];
        }
      }
      if (!Array.isArray(rawExamples)) rawExamples = [];

      let rawSynonyms = data?.synonyms;
      if (typeof rawSynonyms === "string") {
        try {
          rawSynonyms = JSON.parse(rawSynonyms);
        } catch {
          rawSynonyms = [];
        }
      }
      if (!Array.isArray(rawSynonyms)) rawSynonyms = [];

      synonyms = rawSynonyms;
      examples = rawExamples;
      meanings = rawMeanings.map((item) => ({
        partOfSpeech: normalizePartOfSpeech(item?.partOfSpeech, word, item?.english || ""),
        english: item?.english || "Meaning not found.",
        source: item?.source || "Significado nao encontrado.",
      }));
    }
  } catch {
    // fallback below
  }

  if (!meanings.length) {
    meanings = [
      {
        partOfSpeech: normalizePartOfSpeech("", word, ""),
        english: "Meaning not found.",
        source: "Significado nao encontrado.",
      },
    ];
  }

  return {
    word,
    phonetic,
    phoneticVariants,
    meanings,
    synonyms,
    examples,
  };
}

function speakText(text, lang) {
  if (!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang || "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export default function Dictionary({ setCurrentView, color = "#1a97b8" }) {
  const [wordsPage, setWordsPage] = useState([]);
  const [totalWords, setTotalWords] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sourceLanguage, setSourceLanguage] = useState("pt-BR");
  const [learningLanguage, setLearningLanguage] = useState("en-US");
  const [selectedWord, setSelectedWord] = useState("");
  const [wordDetail, setWordDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const listCacheRef = useRef(new Map());
  const wordCacheRef = useRef(new Map());

  useEffect(() => {
    let mounted = true;

    (async () => {
      const langs = await readProgressLanguages();
      if (!mounted) return;
      setSourceLanguage(langs.source);
      setLearningLanguage(langs.learning);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const normalizedSearch = normalizeSearchText(search);
    const cacheKey = `${page}|${normalizedSearch}`;
    const cached = listCacheRef.current.get(cacheKey);

    if (cached) {
      setWordsPage(cached.words);
      setTotalWords(cached.total);
      setLoadingList(false);
      return () => {
        mounted = false;
      };
    }

    setLoadingList(true);

    (async () => {
      const data = await readDictionaryWordsPage(page, PAGE_SIZE, search);
      if (!mounted) return;
      listCacheRef.current.set(cacheKey, data);
      setWordsPage(data.words);
      setTotalWords(data.total);
      setLoadingList(false);
    })();

    return () => {
      mounted = false;
    };
  }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(totalWords / PAGE_SIZE));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const openWord = async (word) => {
    const cacheKey = String(word || "").toLowerCase();
    setSelectedWord(word);

    const cached = wordCacheRef.current.get(cacheKey);
    if (cached) {
      setWordDetail(cached);
      setLoadingDetail(false);
      trackEvent("dictionary_lookup", { word, cached: true }, { moduleKey: "dictionary" });
      return;
    }

    setWordDetail(null);
    setLoadingDetail(true);
    const detail = await fetchWordDetail(word, learningLanguage, sourceLanguage);
    wordCacheRef.current.set(cacheKey, detail);
    setWordDetail(detail);
    setLoadingDetail(false);
    trackEvent("dictionary_lookup", { word, cached: false }, { moduleKey: "dictionary" });
  };

  return (
    <section
      className="dictionary-shell"
      style={{
        "--dictionary-theme": color,
        "--dictionary-theme-soft": alpha(color, 0.18),
      }}
    >
      <header className="dictionary-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}
        >
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="dictionary-kicker">DICTIONARY</div>
          <h1>Dictionary</h1>
          <p>
{getUiLabel("dictionary.origin", "Source")}: {getSourceLabel(sourceLanguage)} | {getUiLabel("dictionary.learning", "Learning")}: {getSourceLabel(learningLanguage)}
          </p>
        </div>
        <ModuleGuideButton moduleKey="dictionary" color={color} />
      </header>

      <section className="dictionary-toolbar">
        <label className="dictionary-search">
          <Search size={18} />
          <input
            type="text"
            aria-label={getUiLabel("dictionary.search_placeholder", "Search word...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={getUiLabel("dictionary.search_placeholder", "Search word...")}
          />
        </label>
      </section>

      <div className="dictionary-grid">
        <section className="dictionary-list-card">
          <div className="dictionary-list-head">{getUiLabel("dictionary.list_title", "Words (alphabetical order)")}</div>
          {loadingList ? (
            <div className="dictionary-empty" role="status" aria-live="polite">{getUiLabel("dictionary.loading_list", "Loading list...")}</div>
          ) : wordsPage.length === 0 ? (
            <div className="dictionary-empty">{getUiLabel("dictionary.empty_list", "No words found.")}</div>
          ) : (
            <ul className="dictionary-list">
              {wordsPage.map((word) => (
                <li key={word}>
                  <button
                    type="button"
                    className={`dictionary-word-btn ${selectedWord === word ? "is-active" : ""}`}
                    onClick={() => openWord(word)}
                  >
                    {word}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <footer className="dictionary-pagination">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            >
              {getUiLabel("common.previous", "Previous")}
            </button>
            <span>
{getUiLabel("dictionary.page", "Page {page} of {total}").replace("{page}", page).replace("{total}", totalPages)}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              {getUiLabel("common.next", "Next")}
            </button>
          </footer>
        </section>

        <section className="dictionary-detail-card">
          {!selectedWord ? (
            <div className="dictionary-empty">{getUiLabel("dictionary.select_word", "Select a word to see details.")}</div>
          ) : loadingDetail ? (
            <div className="dictionary-empty" role="status" aria-live="polite">{getUiLabel("dictionary.loading_detail", "Loading details for \"{word}\"...").replace("{word}", selectedWord)}</div>
          ) : wordDetail ? (
            <div className="dictionary-detail">
              <div className="dictionary-detail-top">
                <h2>{wordDetail.word}</h2>
                <button
                  type="button"
                  className="dictionary-listen-btn"
                  onClick={() => speakText(wordDetail.word, learningLanguage)}
                  title={getUiLabel("dictionary.listen", "Listen pronunciation")}
                >
                  <Volume2 size={20} />
                </button>
              </div>
              <p className="dictionary-phonetic">{wordDetail.phonetic}</p>

              {wordDetail.phoneticVariants?.length ? (
                <div className="dictionary-pronunciation-list">
                  {wordDetail.phoneticVariants.map((variant) => (
                    <div key={variant.id} className="dictionary-pronunciation-chip">
                      <span>{variant.label}</span>
                      <strong>{variant.text || wordDetail.phonetic}</strong>
                      {variant.audio ? (
                        <button
                          type="button"
                          className="dictionary-mini-listen"
                          onClick={() => {
                            const audio = new Audio(variant.audio);
                            audio.play().catch(() => speakText(wordDetail.word, learningLanguage));
                          }}
                        >
                          {getUiLabel("dictionary.listen", "Listen")}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="dictionary-detail-block">
                <h3>{getUiLabel("dictionary.meanings", "Meanings")}</h3>
                <ul className="dictionary-meaning-list">
                  {(wordDetail.meanings || []).map((item, idx) => (
                    <li key={`${item.partOfSpeech}-${idx}`} className="dictionary-meaning-item">
                      <div className="dictionary-meaning-head">
                        <span className="dictionary-meaning-pos">{item.partOfSpeech}</span>
                      </div>
                      <p>
                        <strong>EN:</strong> {item.english}
                      </p>
                      <p>
                        <strong>{getSourceLabel(sourceLanguage)}:</strong> {item.source}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dictionary-detail-block">
                <h3>{getUiLabel("dictionary.examples", "Examples")}</h3>
                {(wordDetail.examples || []).length ? (
                  <ul className="dictionary-example-list">
                    {wordDetail.examples.map((example, idx) => (
                      <li key={`${example}-${idx}`}>{example}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{getUiLabel("dictionary.examples_empty", "Examples not found.")}</p>
                )}
              </div>

              <div className="dictionary-detail-block">
                <h3>{getUiLabel("dictionary.synonyms", "Synonyms")}</h3>
                <p>{wordDetail.synonyms.length ? wordDetail.synonyms.join(", ") : getUiLabel("dictionary.synonyms_empty", "No synonyms found.")}</p>
              </div>
            </div>
          ) : (
            <div className="dictionary-empty">{getUiLabel("dictionary.failed_detail", "Unable to load details.")}</div>
          )}
        </section>
      </div>
    </section>
  );
}



