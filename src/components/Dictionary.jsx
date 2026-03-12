import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Volume2 } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const PAGE_SIZE = 30;

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

const LEARNING_TO_DICTIONARY = {
  en: "en",
  "en-us": "en",
  "en-gb": "en",
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

function normalizeWord(word) {
  if (!word) return "";
  const base = word.trim();
  if (!base) return "";
  return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
}

function parseWordFile(rawText) {
  if (!rawText) return [];
  const all = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => normalizeWord(line));

  return [...new Set(all)].sort((a, b) => a.localeCompare(b));
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

async function readDictionaryWords() {
  const candidates = ["/wiki-100k2.txt", "/wiki-100k.txt"];
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      const parsed = parseWordFile(text);
      if (parsed.length > 0) return parsed;
    } catch {
      // try next source
    }
  }
  return [];
}

function getPhoneticFromApi(data) {
  const phonetic = data?.phonetic;
  if (phonetic) return phonetic;
  const fromList = (data?.phonetics || []).find((p) => p?.text)?.text;
  return fromList || "/";
}

async function translateText(text, sourceLanguage) {
  if (!text) return "Translation unavailable.";
  try {
    const sourceBase = getBaseLang(sourceLanguage, "pt");
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${sourceBase}`
    );
    if (!res.ok) return "Translation unavailable.";
    const json = await res.json();
    const translated = json?.responseData?.translatedText;
    if (translated && typeof translated === "string") return translated;
    return "Translation unavailable.";
  } catch {
    return "Translation unavailable.";
  }
}

async function fetchWordDetail(word, learningLanguage, sourceLanguage) {
  const learningBase = getBaseLang(learningLanguage, "en");
  const dictLang = LEARNING_TO_DICTIONARY[getLangCode(learningLanguage)] || learningBase || "en";

  let phonetic = "/";
  let synonyms = [];
  let meanings = [];

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${dictLang}/${encodeURIComponent(word.toLowerCase())}`
    );
    if (res.ok) {
      const json = await res.json();
      const first = Array.isArray(json) ? json[0] : null;
      phonetic = getPhoneticFromApi(first);

      const syns = new Set();
      const rawMeanings = first?.meanings || [];

      rawMeanings.forEach((meaning) => {
        (meaning?.synonyms || []).forEach((s) => syns.add(s));
        (meaning?.definitions || []).forEach((d) => {
          (d?.synonyms || []).forEach((s) => syns.add(s));
        });
      });
      synonyms = [...syns].slice(0, 10);

      const topDefinitions = rawMeanings
        .flatMap((meaning) => {
          const part = meaning?.partOfSpeech || "unknown";
          return (meaning?.definitions || []).slice(0, 2).map((def) => ({
            partOfSpeech: part,
            english: def?.definition || "Meaning not found.",
          }));
        })
        .filter((item) => item.english && item.english !== "Meaning not found.")
        .slice(0, 8);

      if (topDefinitions.length > 0) {
        meanings = await Promise.all(
          topDefinitions.map(async (item) => ({
            ...item,
            source: await translateText(item.english, sourceLanguage),
          }))
        );
      }
    }
  } catch {
    // keep fallback
  }

  if (!meanings.length) {
    meanings = [
      {
        partOfSpeech: "unknown",
        english: "Meaning not found.",
        source: "Significado nao encontrado.",
      },
    ];
  }

  return {
    word,
    phonetic,
    meanings,
    synonyms,
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
  const [words, setWords] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sourceLanguage, setSourceLanguage] = useState("pt-BR");
  const [learningLanguage, setLearningLanguage] = useState("en-US");
  const [selectedWord, setSelectedWord] = useState("");
  const [wordDetail, setWordDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [langs, loadedWords] = await Promise.all([readProgressLanguages(), readDictionaryWords()]);
      if (!mounted) return;
      setSourceLanguage(langs.source);
      setLearningLanguage(langs.learning);
      setWords(loadedWords);
      setLoadingList(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredWords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return words;
    return words.filter((word) => word.toLowerCase().includes(term));
  }, [words, search]);

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedWords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredWords.slice(start, start + PAGE_SIZE);
  }, [filteredWords, page]);

  const openWord = async (word) => {
    setSelectedWord(word);
    setWordDetail(null);
    setLoadingDetail(true);
    const detail = await fetchWordDetail(word, learningLanguage, sourceLanguage);
    setWordDetail(detail);
    setLoadingDetail(false);
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
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div>
          <div className="dictionary-kicker">DICTIONARY</div>
          <h1>Dictionary</h1>
          <p>
            Origem: {getSourceLabel(sourceLanguage)} | Aprendendo: {getSourceLabel(learningLanguage)}
          </p>
        </div>
              <ModuleGuideButton moduleKey="dictionary" color={color} />
</header>

      <section className="dictionary-toolbar">
        <label className="dictionary-search">
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar palavra..."
          />
        </label>
      </section>

      <div className="dictionary-grid">
        <section className="dictionary-list-card">
          <div className="dictionary-list-head">Palavras (ordem alfabetica)</div>
          {loadingList ? (
            <div className="dictionary-empty">Carregando lista...</div>
          ) : pagedWords.length === 0 ? (
            <div className="dictionary-empty">Nenhuma palavra encontrada.</div>
          ) : (
            <ul className="dictionary-list">
              {pagedWords.map((word) => (
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
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Anterior
            </button>
            <span>
              Pagina {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Proxima
            </button>
          </footer>
        </section>

        <section className="dictionary-detail-card">
          {!selectedWord ? (
            <div className="dictionary-empty">Selecione uma palavra para ver os detalhes.</div>
          ) : loadingDetail ? (
            <div className="dictionary-empty">Carregando detalhes de "{selectedWord}"...</div>
          ) : wordDetail ? (
            <div className="dictionary-detail">
              <div className="dictionary-detail-top">
                <h2>{wordDetail.word}</h2>
                <button
                  type="button"
                  className="dictionary-listen-btn"
                  onClick={() => speakText(wordDetail.word, learningLanguage)}
                  title="Ouvir pronuncia"
                >
                  <Volume2 size={20} />
                </button>
              </div>
              <p className="dictionary-phonetic">{wordDetail.phonetic}</p>

              <div className="dictionary-detail-block">
                <h3>Significados</h3>
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
                <h3>Sinonimos</h3>
                <p>{wordDetail.synonyms.length ? wordDetail.synonyms.join(", ") : "No synonyms found."}</p>
              </div>
            </div>
          ) : (
            <div className="dictionary-empty">Nao foi possivel carregar os detalhes.</div>
          )}
        </section>
      </div>
    </section>
  );
}
