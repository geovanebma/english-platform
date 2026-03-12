import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search, Volume2 } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const PAGE_SIZE = 25;

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

function ensureMyVocabulary(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  const defaultVocabulary = {
      saved_words: 0,
      learned_words: 0,
      learned_word_ids: [],
      learned_word_ranks: [],
      learned_words_csv: "",
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

  return {
    ...moduleBlock,
    ...rootBlock,
    learned_word_ids: mergedIds,
    learned_word_ranks: mergedIds,
    learned_words: mergedIds.length,
    saved_words: mergedIds.length,
  };
}

function setMyVocabularyBlock(progress, nextBlock) {
  if (!progress.modules) progress.modules = {};
  progress.modules.my_vocabulary = { ...nextBlock };
  progress.my_vocabulary = { ...nextBlock };
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureMyVocabulary(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureMyVocabulary(parsed);
}

async function saveMyVocabularyBlock(payload) {
  const res = await fetch("/api/progress/my-vocabulary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao salvar learned_word_ids");
  return res.json();
}

function speakWord(word, lang = "en-US") {
  if (!window.speechSynthesis || !word) return;
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export default function MyVocabulary({ setCurrentView, color = "#085163" }) {
  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [learnedIds, setLearnedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState("rank");
  const [statusFilter, setStatusFilter] = useState("both");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [learningLanguage, setLearningLanguage] = useState("en-US");
  const [isSaving, setIsSaving] = useState(false);
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
        } catch (error) {
          console.error("Erro ao ler /api/progress no MyVocabulary", error);
          progress = ensureMyVocabulary({});
        }

        const myVocab = getMyVocabularyBlock(progress);
        const ids = Array.isArray(myVocab.learned_word_ids)
          ? myVocab.learned_word_ids
          : [];
        setLearnedIds(new Set(ids.map((id) => Number(id)).filter(Number.isFinite)));
        setSortBy(myVocab.last_sort || "rank");
        setStatusFilter(myVocab.last_filter || "both");
        setSearch(myVocab.last_search || "");
        setPage(Math.max(1, Number(myVocab.last_page || 1)));
        setLearningLanguage(progress?.languages?.learning_language || "en-US");
      } catch (error) {
        console.error("Erro ao inicializar MyVocabulary", error);
        if (!mounted) return;
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

    const withSearch = withStatus.filter((item) =>
      item.word.toLowerCase().includes(search.trim().toLowerCase())
    );

    const sorted = [...withSearch];
    if (sortBy === "alpha") {
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

  const saveMyVocabularyProgress = (nextIdsSet, overrides = {}) => {
    const snapshotIds = new Set(nextIdsSet);
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
        const learnedRanksSorted = [...snapshotIds].sort((a, b) => a - b);
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
          last_page: snapshot.page,
          last_sort: snapshot.sortBy,
          last_filter: snapshot.statusFilter,
          last_search: snapshot.search,
        };

        await saveMyVocabularyBlock(nextMyVocabulary);
      })
      .catch((error) => {
        console.error("Erro ao salvar my_vocabulary em progress.json", error);
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
    await saveMyVocabularyProgress(next);
  };

  const learnedCount = learnedIds.size;

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
            await saveMyVocabularyProgress(learnedIds);
            setCurrentView("initial");
          }}
        >
          <ArrowLeft size={18} />
          {isSaving ? "Salvando..." : "Voltar"}
        </button>
        <div>
          <div className="vocab-kicker">VOCABULARY TRAINING</div>
          <h1>My Vocabulary</h1>
          <p>
            {learnedCount} aprendidas de {allWords.length}
          </p>
        </div>
              <ModuleGuideButton moduleKey="my_vocabulary" color={color} />
</header>

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
              saveMyVocabularyProgress(learnedIds, { page: 1, search: nextSearch });
            }}
            placeholder="Buscar palavra..."
          />
        </label>

        <select
          value={sortBy}
          onChange={(e) => {
            const nextSortBy = e.target.value;
            setSortBy(nextSortBy);
            setPage(1);
            saveMyVocabularyProgress(learnedIds, { page: 1, sortBy: nextSortBy });
          }}
        >
          <option value="rank">Rank (mais usadas)</option>
          <option value="alpha">Ordem alfabetica</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            const nextStatusFilter = e.target.value;
            setStatusFilter(nextStatusFilter);
            setPage(1);
            saveMyVocabularyProgress(learnedIds, { page: 1, statusFilter: nextStatusFilter });
          }}
        >
          <option value="both">Both</option>
          <option value="learned">Learned</option>
          <option value="unlearned">Don&apos;t learned</option>
        </select>
      </section>

      <section className="vocab-table-wrap">
        <table className="vocab-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Word</th>
              <th>Listen</th>
              <th>Learned</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Carregando...</td>
              </tr>
            ) : pagedWords.length === 0 ? (
              <tr>
                <td colSpan={4}>Nenhuma palavra encontrada.</td>
              </tr>
            ) : (
              pagedWords.map((item) => (
                <tr key={item.id}>
                  <td>#{item.rank}</td>
                  <td className="vocab-word-cell">{item.word}</td>
                  <td>
                    <button
                      type="button"
                      className="vocab-listen-btn"
                      onClick={() => speakWord(item.word, learningLanguage)}
                      title="Ouvir palavra"
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <footer className="vocab-pagination">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Anterior
        </button>
        <span>
          Pagina {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => {
            const nextPage = Math.min(totalPages, page + 1);
            setPage(nextPage);
            saveMyVocabularyProgress(learnedIds, { page: nextPage });
          }}
          disabled={page >= totalPages}
        >
          Proxima
        </button>
      </footer>
    </section>
  );
}
