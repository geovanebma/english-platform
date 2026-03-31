import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  History,
  Search,
  Star,
  Target,
  Trophy,
  Volume2,
} from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const PAGE_SIZE = 25;
const RECENT_LIMIT = 8;
const CUSTOM_LIMIT = 8;
const GLOBAL_REVIEW_PREVIEW_LIMIT = 5;

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
  const cleaned = (hex || "#085163").replace("#", "");
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

function capitalizeWord(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
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

function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function parseWikiWords(rawText) {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/);
  const cleaned = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((word) => capitalizeWord(word));
  return cleaned.map((word, index) => ({
    id: index + 1,
    rank: index + 1,
    word,
  }));
}

async function readWikiWordsText() {
  const candidates = ["/wiki-100k.txt", "/src/data/wiki-100k.txt"];
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      if (text?.trim()) return text;
    } catch {
      // try next source
    }
  }
  return "";
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(baseIso, amount) {
  const base = new Date(`${baseIso}T00:00:00`);
  base.setDate(base.getDate() + amount);
  return base.toISOString().slice(0, 10);
}

function ensureGlobalReview(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.srs_global) {
    data.modules.srs_global = {
      queue: [],
      completed_today: 0,
      total_reviews: 0,
      last_generated_date: null,
      next_item_id: 1,
    };
  }
  if (!Array.isArray(data.modules.srs_global.queue)) data.modules.srs_global.queue = [];
  if (!Number.isFinite(Number(data.modules.srs_global.next_item_id))) {
    data.modules.srs_global.next_item_id = 1;
  }
  return data;
}

function ensureMyVocabulary(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  const defaultVocabulary = {
    saved_words: 0,
    learned_words: 0,
    learned_word_ids: [],
    learned_word_ranks: [],
    learned_words_csv: "",
    favorite_word_ids: [],
    recent_word_ids: [],
    global_review_word_ids: [],
    saved_words_custom: [],
    last_page: 1,
    last_sort: "rank",
    last_filter: "both",
    last_search: "",
  };

  if (!data.modules.my_vocabulary) {
    data.modules.my_vocabulary = { ...defaultVocabulary };
  }
  if (!data.my_vocabulary) {
    data.my_vocabulary = { ...data.modules.my_vocabulary };
  }
  return data;
}

function getMyVocabularyBlock(progress) {
  const rootBlock = progress?.my_vocabulary || {};
  const moduleBlock = progress?.modules?.my_vocabulary || {};
  const rootIds = Array.isArray(rootBlock.learned_word_ids) ? rootBlock.learned_word_ids : [];
  const moduleIds = Array.isArray(moduleBlock.learned_word_ids) ? moduleBlock.learned_word_ids : [];
  const mergedIds = [...new Set([...rootIds, ...moduleIds])]
    .map((id) => Number(id))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const mergedFavorites = [
    ...(Array.isArray(moduleBlock.favorite_word_ids) ? moduleBlock.favorite_word_ids : []),
    ...(Array.isArray(rootBlock.favorite_word_ids) ? rootBlock.favorite_word_ids : []),
  ]
    .map((id) => Number(id))
    .filter(Number.isFinite);

  const mergedRecent = [
    ...(Array.isArray(moduleBlock.recent_word_ids) ? moduleBlock.recent_word_ids : []),
    ...(Array.isArray(rootBlock.recent_word_ids) ? rootBlock.recent_word_ids : []),
  ]
    .map((id) => Number(id))
    .filter(Number.isFinite);

  const mergedReviewIds = [
    ...(Array.isArray(moduleBlock.global_review_word_ids) ? moduleBlock.global_review_word_ids : []),
    ...(Array.isArray(rootBlock.global_review_word_ids) ? rootBlock.global_review_word_ids : []),
  ]
    .map((id) => Number(id))
    .filter(Number.isFinite);

  const mergedCustom = [
    ...(Array.isArray(moduleBlock.saved_words_custom) ? moduleBlock.saved_words_custom : []),
    ...(Array.isArray(rootBlock.saved_words_custom) ? rootBlock.saved_words_custom : []),
  ];
  const customMap = new Map();
  mergedCustom.forEach((entry) => {
    const word = String(entry?.word || "").trim();
    if (!word) return;
    const key = `${word.toLowerCase()}|${entry?.source || ""}`;
    if (!customMap.has(key)) customMap.set(key, entry);
  });

  return {
    ...moduleBlock,
    ...rootBlock,
    learned_word_ids: mergedIds,
    learned_word_ranks: mergedIds,
    learned_words: mergedIds.length,
    saved_words: mergedIds.length,
    favorite_word_ids: [...new Set(mergedFavorites)],
    recent_word_ids: [...new Set(mergedRecent)].slice(0, RECENT_LIMIT),
    global_review_word_ids: [...new Set(mergedReviewIds)],
    saved_words_custom: [...customMap.values()].slice(0, 500),
  };
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureGlobalReview(ensureMyVocabulary(parsed));
}

async function saveMyVocabularyBlock(payload) {
  const res = await fetch("/api/progress/my-vocabulary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso do vocabulario");
  return res.json();
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
  let meanings = [];
  let example = "Example unavailable.";

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/${dictLang}/${encodeURIComponent(word.toLowerCase())}`
    );
    if (res.ok) {
      const json = await res.json();
      const first = Array.isArray(json) ? json[0] : null;
      phonetic = getPhoneticFromApi(first);
      const rawMeanings = first?.meanings || [];

      const topDefinitions = rawMeanings
        .flatMap((meaning) => {
          const part = meaning?.partOfSpeech || "unknown";
          return (meaning?.definitions || []).slice(0, 3).map((def) => ({
            partOfSpeech: part,
            english: def?.definition || "Meaning not found.",
            example: def?.example || "",
          }));
        })
        .filter((item) => item.english && item.english !== "Meaning not found.")
        .slice(0, 4);

      if (topDefinitions.length > 0) {
        meanings = await Promise.all(
          topDefinitions.map(async (item) => ({
            ...item,
            source: await translateText(item.english, sourceLanguage),
          }))
        );
      }

      const exampleCandidate = topDefinitions.find((item) => item.example)?.example;
      if (exampleCandidate) example = exampleCandidate;
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
    example,
  };
}

function speakWord(word, lang = "en-US") {
  if (!window.speechSynthesis || !word) return;
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function buildRecentIds(list, id) {
  return [id, ...list.filter((current) => current !== id)].slice(0, RECENT_LIMIT);
}

function buildVocabularyReviewItem(item, detail, sourceLanguage, nextId) {
  const today = todayIso();
  const primaryMeaning = Array.isArray(detail?.meanings) ? detail.meanings[0] : null;
  const meaningLine = primaryMeaning?.source || primaryMeaning?.english || `Revise a palavra ${item.word}.`;
  const partOfSpeech = primaryMeaning?.partOfSpeech || "unknown";
  return {
    id: nextId,
    key: `my_vocabulary:${item.id}`,
    module: "my_vocabulary",
    title: item.word,
    prompt: `${item.word} -> ${meaningLine}`,
    due_date: today,
    interval_days: 1,
    status: "due",
    created_at: new Date().toISOString(),
    source_word_id: item.id,
    word: item.word,
    part_of_speech: partOfSpeech,
    source_label: getSourceLabel(sourceLanguage),
    source_module: "my_vocabulary",
  };
}

export default function MyVocabulary({ setCurrentView, color = "#085163" }) {
  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [learnedIds, setLearnedIds] = useState(new Set());
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [recentIds, setRecentIds] = useState([]);
  const [globalReviewIds, setGlobalReviewIds] = useState(new Set());
  const [srsQueue, setSrsQueue] = useState([]);
  const [savedCustomWords, setSavedCustomWords] = useState([]);
  const [sortBy, setSortBy] = useState("rank");
  const [statusFilter, setStatusFilter] = useState("both");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [learningLanguage, setLearningLanguage] = useState("en-US");
  const [sourceLanguage, setSourceLanguage] = useState("pt-BR");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedWordId, setExpandedWordId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [loadingDetailId, setLoadingDetailId] = useState(null);
  const saveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rawText = await readWikiWordsText();
        const parsedWords = parseWikiWords(rawText);
        if (!mounted) return;
        setAllWords(parsedWords);

        let progress = ensureMyVocabulary({});
        try {
          progress = await readProgress();
        } catch {
          progress = ensureMyVocabulary({});
        }

        const myVocab = getMyVocabularyBlock(progress);
        const ids = Array.isArray(myVocab.learned_word_ids) ? myVocab.learned_word_ids : [];
        const favorites = Array.isArray(myVocab.favorite_word_ids) ? myVocab.favorite_word_ids : [];
        const recents = Array.isArray(myVocab.recent_word_ids) ? myVocab.recent_word_ids : [];
        const reviewIds = Array.isArray(myVocab.global_review_word_ids) ? myVocab.global_review_word_ids : [];
        const customWords = Array.isArray(myVocab.saved_words_custom) ? myVocab.saved_words_custom : [];
        setLearnedIds(new Set(ids.map((id) => Number(id)).filter(Number.isFinite)));
        setFavoriteIds(new Set(favorites.map((id) => Number(id)).filter(Number.isFinite)));
        setRecentIds(recents.map((id) => Number(id)).filter(Number.isFinite));
        setGlobalReviewIds(new Set(reviewIds.map((id) => Number(id)).filter(Number.isFinite)));
        setSrsQueue(Array.isArray(progress?.modules?.srs_global?.queue) ? progress.modules.srs_global.queue : []);
        setSavedCustomWords(customWords);
        setSortBy(myVocab.last_sort || "rank");
        setStatusFilter(myVocab.last_filter || "both");
        setSearch(myVocab.last_search || "");
        setPage(Math.max(1, Number(myVocab.last_page || 1)));
        setLearningLanguage(progress?.languages?.learning_language || "en-US");
        setSourceLanguage(progress?.languages?.source_language || "pt-BR");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredWords = useMemo(() => {
    const withStatus = allWords.filter((item) => {
      const isLearned = learnedIds.has(item.id);
      if (statusFilter === "learned") return isLearned;
      if (statusFilter === "unlearned") return !isLearned;
      return true;
    });

    const normalizedQuery = normalizeSearchText(search);
    const compactQuery = compactSearchText(search);
    const queryTokens = normalizedQuery ? normalizedQuery.split(" ").filter(Boolean) : [];

    const withSearch = !normalizedQuery
      ? withStatus
      : withStatus.filter((item) => {
          const normalizedWord = normalizeSearchText(item.word);
          const compactWord = compactSearchText(item.word);
          if (!normalizedWord) return false;

          if (normalizedWord === normalizedQuery || compactWord === compactQuery) return true;
          if (normalizedWord.startsWith(normalizedQuery) || compactWord.startsWith(compactQuery)) return true;
          if (normalizedWord.includes(normalizedQuery) || compactWord.includes(compactQuery)) return true;
          if (!queryTokens.length) return false;
          return queryTokens.every(
            (token) => normalizedWord.includes(token) || compactWord.includes(token)
          );
        });

    const sorted = [...withSearch];
    if (normalizedQuery) {
      sorted.sort((a, b) => {
        const aWord = normalizeSearchText(a.word);
        const bWord = normalizeSearchText(b.word);
        const aCompact = compactSearchText(a.word);
        const bCompact = compactSearchText(b.word);
        const scoreFor = (word, compact) => {
          if (word === normalizedQuery || compact === compactQuery) return 0;
          if (word.startsWith(normalizedQuery) || compact.startsWith(compactQuery)) return 1;
          if (word.includes(normalizedQuery) || compact.includes(compactQuery)) return 2;
          return 3;
        };
        const scoreDiff = scoreFor(aWord, aCompact) - scoreFor(bWord, bCompact);
        if (scoreDiff !== 0) return scoreDiff;
        return a.rank - b.rank;
      });
    } else if (sortBy === "alpha") {
      sorted.sort((a, b) => a.word.localeCompare(b.word));
    } else {
      sorted.sort((a, b) => a.rank - b.rank);
    }
    return sorted;
  }, [allWords, learnedIds, search, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedWords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredWords.slice(start, start + PAGE_SIZE);
  }, [filteredWords, page]);

  const recentWords = useMemo(
    () => recentIds.map((id) => allWords.find((item) => item.id === id)).filter(Boolean),
    [recentIds, allWords]
  );

  const saveMyVocabularyProgress = ({
    learnedIdsSet = learnedIds,
    favoriteIdsSet = favoriteIds,
    recentWordIds = recentIds,
    globalReviewIdsSet = globalReviewIds,
    overrides = {},
  } = {}) => {
    const snapshotLearned = new Set(learnedIdsSet);
    const snapshotFavorites = new Set(favoriteIdsSet);
    const snapshotRecent = [...recentWordIds].map(Number).filter(Number.isFinite).slice(0, RECENT_LIMIT);
    const snapshotReviewIds = [...globalReviewIdsSet].map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    const snapshot = {
      page: overrides.page ?? page,
      sortBy: overrides.sortBy ?? sortBy,
      statusFilter: overrides.statusFilter ?? statusFilter,
      search: overrides.search ?? search,
    };

    saveQueueRef.current = saveQueueRef.current
      .then(async () => {
        setIsSaving(true);
        const progress = await readProgress();
        const learnedRanksSorted = [...snapshotLearned].sort((a, b) => a - b);
        const favoriteIdsSorted = [...snapshotFavorites].sort((a, b) => a - b);
        const learnedWordsCsv = learnedRanksSorted
          .map((rank) => allWords.find((w) => w.id === rank)?.word)
          .filter(Boolean)
          .join(",");

        const current = getMyVocabularyBlock(progress);
        const nextMyVocabulary = {
          ...current,
          learned_word_ids: learnedRanksSorted,
          learned_word_ranks: learnedRanksSorted,
          learned_words: learnedRanksSorted.length,
          saved_words: learnedRanksSorted.length,
          learned_words_csv: learnedWordsCsv,
          favorite_word_ids: favoriteIdsSorted,
          recent_word_ids: snapshotRecent,
          global_review_word_ids: snapshotReviewIds,
          saved_words_custom: savedCustomWords,
          last_page: snapshot.page,
          last_sort: snapshot.sortBy,
          last_filter: snapshot.statusFilter,
          last_search: snapshot.search,
        };

        await saveMyVocabularyBlock(nextMyVocabulary);
      })
      .finally(() => {
        setIsSaving(false);
      });

    return saveQueueRef.current;
  };

  const toggleLearned = async (id) => {
    const next = new Set(learnedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLearnedIds(next);
    await saveMyVocabularyProgress({ learnedIdsSet: next });
  };

  const toggleFavorite = async (id) => {
    const next = new Set(favoriteIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavoriteIds(next);
    await saveMyVocabularyProgress({ favoriteIdsSet: next });
  };

  const registerRecentWord = async (id) => {
    const nextRecent = buildRecentIds(recentIds, id);
    setRecentIds(nextRecent);
    await saveMyVocabularyProgress({ recentWordIds: nextRecent });
  };

  const toggleGlobalReview = async (item) => {
    const nextReviewIds = new Set(globalReviewIds);
    const alreadyTracked = nextReviewIds.has(item.id);
    if (alreadyTracked) nextReviewIds.delete(item.id);
    else nextReviewIds.add(item.id);
    setGlobalReviewIds(nextReviewIds);

    saveQueueRef.current = saveQueueRef.current
      .then(async () => {
        setIsSaving(true);
        const progress = await readProgress();
        ensureGlobalReview(progress);
        const current = getMyVocabularyBlock(progress);
        const queue = Array.isArray(progress?.modules?.srs_global?.queue) ? progress.modules.srs_global.queue : [];
        let nextQueue = [...queue];
        let nextItemId = Number(progress.modules.srs_global.next_item_id || 1);
        const queueKey = `my_vocabulary:${item.id}`;

        if (alreadyTracked) {
          nextQueue = nextQueue.filter((entry) => entry.key !== queueKey);
        } else {
          const cachedDetail = detailCache[item.id] || (await fetchWordDetail(item.word, learningLanguage, sourceLanguage));
          if (!detailCache[item.id]) {
            setDetailCache((prev) => ({ ...prev, [item.id]: cachedDetail }));
          }
          const existing = nextQueue.find((entry) => entry.key === queueKey);
          if (!existing) {
            nextQueue.push(buildVocabularyReviewItem(item, cachedDetail, sourceLanguage, nextItemId));
            nextItemId += 1;
          } else {
            nextQueue = nextQueue.map((entry) =>
              entry.key === queueKey
                ? {
                    ...entry,
                    status: "due",
                    due_date: todayIso(),
                    interval_days: 1,
                  }
                : entry
            );
          }
        }

        const reviewIdsSorted = [...nextReviewIds].map(Number).filter(Number.isFinite).sort((a, b) => a - b);
        const nextMyVocabulary = {
          ...current,
          global_review_word_ids: reviewIdsSorted,
        };

        await saveMyVocabularyBlock(nextMyVocabulary);
        await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...progress,
            modules: {
              ...progress.modules,
              srs_global: {
                ...progress.modules.srs_global,
                queue: nextQueue,
                next_item_id: nextItemId,
              },
            },
          }),
        });
        setSrsQueue(nextQueue);
      })
      .finally(() => {
        setIsSaving(false);
      });

    await saveQueueRef.current;
  };

  const toggleWordDetail = async (item) => {
    if (expandedWordId === item.id) {
      setExpandedWordId(null);
      return;
    }

    setExpandedWordId(item.id);
    await registerRecentWord(item.id);
    if (detailCache[item.id]) return;

    setLoadingDetailId(item.id);
    try {
      const detail = await fetchWordDetail(item.word, learningLanguage, sourceLanguage);
      setDetailCache((prev) => ({ ...prev, [item.id]: detail }));
    } finally {
      setLoadingDetailId(null);
    }
  };

  const openRecentWord = async (item) => {
    if (!item) return;
    if (page !== Math.ceil(item.rank / PAGE_SIZE)) {
      const nextPage = Math.ceil(item.rank / PAGE_SIZE);
      setPage(nextPage);
      await saveMyVocabularyProgress({ recentWordIds: buildRecentIds(recentIds, item.id), overrides: { page: nextPage } });
      setRecentIds(buildRecentIds(recentIds, item.id));
    } else {
      await registerRecentWord(item.id);
    }
    setExpandedWordId(item.id);
    if (!detailCache[item.id]) {
      setLoadingDetailId(item.id);
      try {
        const detail = await fetchWordDetail(item.word, learningLanguage, sourceLanguage);
        setDetailCache((prev) => ({ ...prev, [item.id]: detail }));
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  const learnedCount = learnedIds.size;
  const favoriteCount = favoriteIds.size;
  const visibleCount = filteredWords.length;
  const remainingCount = Math.max(0, allWords.length - learnedCount);
  const coveragePercent = allWords.length ? Math.round((learnedCount / allWords.length) * 100) : 0;
  const importedCount = savedCustomWords.length;
  const importedPreview = savedCustomWords.slice(0, CUSTOM_LIMIT);
  const globalReviewCount = globalReviewIds.size;
  const globalReviewQueue = useMemo(
    () => (Array.isArray(srsQueue) ? srsQueue.filter((entry) => entry.module === "my_vocabulary") : []),
    [srsQueue]
  );
  const globalReviewDueToday = useMemo(() => {
    const today = todayIso();
    return globalReviewQueue.filter((entry) => entry.status !== "done" && entry.due_date === today).length;
  }, [globalReviewQueue]);
  const globalReviewPreview = useMemo(
    () =>
      globalReviewQueue
        .slice(0, GLOBAL_REVIEW_PREVIEW_LIMIT)
        .map((entry) => entry.word || entry.title)
        .filter(Boolean),
    [globalReviewQueue]
  );

  return (
    <section
      className="vocab-shell"
      style={{
        "--vocab-theme": color,
        "--vocab-theme-soft": alpha(color, 0.18),
      }}
    >
      <header className="vocab-head">
        <button
          type="button"
          className="duo-back-btn"
          onClick={async () => {
            await saveMyVocabularyProgress();
            setCurrentView("initial");
          }}
        >
          <ArrowLeft size={18} />
          {isSaving ? getUiLabel("vocab.saving", "Saving...") : getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="vocab-kicker">{getUiLabel("vocab.kicker", "VOCABULARY TRAINING")}</div>
          <h1>{getUiLabel("module.my_vocabulary", "My Vocabulary")}</h1>
          <p>
            {getUiLabel("vocab.learned_of", "{learned} learned of {total}").replace("{learned}", learnedCount).replace("{total}", allWords.length)}
          </p>
        </div>
        <ModuleGuideButton moduleKey="my_vocabulary" color={color} />
      </header>

      <section className="vocab-overview-grid">
        <article className="vocab-overview-card">
          <div className="vocab-overview-icon is-favorite">
            <Star size={18} />
          </div>
          <div>
            <span>{getUiLabel("vocab.favorites", "Favorites")}</span>
            <strong>{favoriteCount}</strong>
          </div>
        </article>
        <article className="vocab-overview-card">
          <div className="vocab-overview-icon is-progress">
            <Target size={18} />
          </div>
          <div>
            <span>{getUiLabel("vocab.coverage", "Coverage")}</span>
            <strong>{coveragePercent}%</strong>
            <p>{getUiLabel("vocab.remaining", "{count} words not marked yet.").replace("{count}", remainingCount)}</p>
          </div>
        </article>
        <article className="vocab-overview-card">
          <div className="vocab-overview-icon is-learned">
            <Trophy size={18} />
          </div>
          <div>
            <span>{getUiLabel("vocab.visible_now", "Visible now")}</span>
            <strong>{visibleCount}</strong>
            <p>{getUiLabel("vocab.filtered_result", "Current result with filters applied.")}</p>
          </div>
        </article>
        <article className="vocab-overview-card vocab-overview-recents">
          <div className="vocab-overview-icon is-recent">
            <History size={18} />
          </div>
          <div className="vocab-overview-content">
            <span>{getUiLabel("vocab.recents", "Recents")}</span>
            {recentWords.length ? (
              <div className="vocab-recent-list">
                {recentWords.slice(0, 5).map((item) => (
                  <button
                    key={`recent-${item.id}`}
                    type="button"
                    className="vocab-recent-chip"
                    onClick={() => openRecentWord(item)}
                  >
                    {item.word}
                  </button>
                ))}
              </div>
            ) : (
              <p>{getUiLabel("vocab.no_recent", "No words opened yet.")}</p>
            )}
          </div>
        </article>
        <article className="vocab-overview-card vocab-overview-imported">
          <div className="vocab-overview-icon is-imported">
            <BookOpen size={18} />
          </div>
          <div className="vocab-overview-content">
            <span>{getUiLabel("vocab.imported", "Imported")}</span>
            <strong>{importedCount}</strong>
            {importedPreview.length ? (
              <div className="vocab-recent-list">
                {importedPreview.map((entry, index) => (
                  <span key={`${entry.word}-${index}`} className="vocab-recent-chip is-static">
                    {entry.word}
                  </span>
                ))}
              </div>
            ) : (
              <p>{getUiLabel("vocab.no_imported", "No words imported yet.")}</p>
            )}
          </div>
        </article>
        <article className="vocab-overview-card vocab-overview-global">
          <div className="vocab-overview-icon is-global">
            <BookOpen size={18} />
          </div>
          <div className="vocab-overview-content">
            <span>{getUiLabel("vocab.global_review", "Global review")}</span>
            <strong>{globalReviewCount}</strong>
            <p>{getUiLabel("vocab.due_today", "{count} words due today.").replace("{count}", globalReviewDueToday)}</p>
            {globalReviewPreview.length ? (
              <div className="vocab-recent-list">
                {globalReviewPreview.map((word, index) => (
                  <span key={`${word}-${index}`} className="vocab-recent-chip is-static">
                    {word}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="vocab-filters">
        <label className="vocab-search-wrap">
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              const nextSearch = e.target.value;
              setSearch(nextSearch);
              setPage(1);
              saveMyVocabularyProgress({ overrides: { page: 1, search: nextSearch } });
            }}
            placeholder={getUiLabel("vocab.search_placeholder", "Search word...")}
          />
        </label>

        <select
          value={sortBy}
          onChange={(e) => {
            const nextSortBy = e.target.value;
            setSortBy(nextSortBy);
            setPage(1);
            saveMyVocabularyProgress({ overrides: { page: 1, sortBy: nextSortBy } });
          }}
        >
          <option value="rank">{getUiLabel("vocab.sort_rank", "Rank (most used)")}</option>
          <option value="alpha">{getUiLabel("vocab.sort_alpha", "Alphabetical order")}</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            const nextStatusFilter = e.target.value;
            setStatusFilter(nextStatusFilter);
            setPage(1);
            saveMyVocabularyProgress({ overrides: { page: 1, statusFilter: nextStatusFilter } });
          }}
        >
          <option value="both">{getUiLabel("vocab.filter_both", "Both")}</option>
          <option value="learned">{getUiLabel("vocab.filter_learned", "Learned")}</option>
          <option value="unlearned">{getUiLabel("vocab.filter_unlearned", "Not learned")}</option>
        </select>
      </section>

      <section className="vocab-table-wrap">
        <table className="vocab-table">
          <thead>
            <tr>
              <th>{getUiLabel("vocab.table.rank", "Rank")}</th>
              <th>{getUiLabel("vocab.table.word", "Word")}</th>
              <th>{getUiLabel("vocab.table.listen", "Listen")}</th>
              <th>{getUiLabel("vocab.table.learned", "Learned")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>{getUiLabel("vocab.loading", "Loading...")}</td>
              </tr>
            ) : pagedWords.length === 0 ? (
              <tr>
                <td colSpan={4}>{getUiLabel("vocab.empty_list", "No words found.")}</td>
              </tr>
            ) : (
              pagedWords.flatMap((item) => {
                const isExpanded = expandedWordId === item.id;
                const detail = detailCache[item.id];
                const isDetailLoading = loadingDetailId === item.id;
                const isFavorite = favoriteIds.has(item.id);
                const isGlobalReview = globalReviewIds.has(item.id);
                return [
                  <tr key={item.id} className={isExpanded ? "is-expanded" : ""}>
                    <td>#{item.rank}</td>
                    <td className="vocab-word-cell">
                      <div className="vocab-word-main">
                        <span>{item.word}</span>
                        <div className="vocab-word-actions">
                          <button
                            type="button"
                            className={`vocab-favorite-btn ${isFavorite ? "is-active" : ""}`}
                            onClick={() => toggleFavorite(item.id)}
                            title={isFavorite ? getUiLabel("vocab.remove_favorite", "Remove from favorites") : getUiLabel("vocab.add_favorite", "Add to favorites")}
                            aria-label={getUiLabel("vocab.favorite_word", "Favorite {word}").replace("{word}", item.word)}
                          >
                            <Star size={16} fill={isFavorite ? "currentColor" : "none"} />
                          </button>
                          <button
                            type="button"
                            className={`vocab-inline-btn ${isExpanded ? "is-open" : ""}`}
                            onClick={() => toggleWordDetail(item)}
                            title={getUiLabel("vocab.view_meaning", "View meaning")}
                            aria-label={getUiLabel("vocab.view_details", "View details of {word}").replace("{word}", item.word)}
                          >
                            <BookOpen size={16} />
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="vocab-listen-btn"
                        onClick={() => speakWord(item.word, learningLanguage)}
                        title={getUiLabel("vocab.listen_word", "Listen word")}
                      >
                        <Volume2 size={18} />
                      </button>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={learnedIds.has(item.id)}
                        onChange={() => toggleLearned(item.id)}
                      />
                    </td>
                  </tr>,
                  isExpanded ? (
                    <tr key={`${item.id}-detail`} className="vocab-detail-row">
                      <td colSpan={4}>
                        <div className="vocab-inline-panel">
                          {isDetailLoading ? (
                            <div className="vocab-inline-loading">{getUiLabel("vocab.loading_detail", "Loading details...")}</div>
                          ) : detail ? (
                            <>
                              <div className="vocab-inline-top">
                                <div>
                                  <strong>{detail.word}</strong>
                                  <span>{detail.phonetic}</span>
                                </div>
                                <div className="vocab-inline-actions">
                                  <button
                                    type="button"
                                    className={`vocab-inline-review ${isGlobalReview ? "is-active" : ""}`}
                                    onClick={() => toggleGlobalReview(item)}
                                  >
                                    <BookOpen size={16} />
                                    {isGlobalReview ? getUiLabel("vocab.global_remove", "Remove from global review") : getUiLabel("vocab.global_add", "Send to global review")}
                                  </button>
                                  <button
                                    type="button"
                                    className="vocab-inline-speak"
                                    onClick={() => speakWord(detail.word, learningLanguage)}
                                  >
                                    <Volume2 size={16} />
                                    {getUiLabel("dictionary.listen", "Listen")}
                                  </button>
                                </div>
                              </div>
                              <div className="vocab-inline-meanings">
                                {detail.meanings.map((meaning, idx) => (
                                  <article key={`${item.id}-meaning-${idx}`} className="vocab-inline-meaning-card">
                                    <div className="vocab-inline-meaning-head">
                                      <span className="vocab-inline-pos">{meaning.partOfSpeech}</span>
                                    </div>
                                    <p>
                                      <strong>EN:</strong> {meaning.english}
                                    </p>
                                    <p>
                                      <strong>{getSourceLabel(sourceLanguage)}:</strong> {meaning.source}
                                    </p>
                                  </article>
                                ))}
                              </div>
                              <div className="vocab-inline-example">
                                <strong>{getUiLabel("vocab.example", "Example")}</strong>
                                <p>{detail.example}</p>
                              </div>
                            </>
                          ) : (
                            <div className="vocab-inline-loading">{getUiLabel("vocab.failed_detail", "Could not load details.")}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : null,
                ].filter(Boolean);
              })
            )}
          </tbody>
        </table>
      </section>

      <footer className="vocab-pagination">
        <button
          type="button"
          onClick={() => {
            const nextPage = Math.max(1, page - 1);
            setPage(nextPage);
            saveMyVocabularyProgress({ overrides: { page: nextPage } });
          }}
          disabled={page <= 1}
        >
          {getUiLabel("common.previous", "Previous")}
        </button>
        <span>
          {getUiLabel("dictionary.page", "Page {page} of {total}").replace("{page}", page).replace("{total}", totalPages)}
        </span>
        <button
          type="button"
          onClick={() => {
            const nextPage = Math.min(totalPages, page + 1);
            setPage(nextPage);
            saveMyVocabularyProgress({ overrides: { page: nextPage } });
          }}
          disabled={page >= totalPages}
        >
          {getUiLabel("common.next", "Next")}
        </button>
      </footer>
    </section>
  );
}



