const LOCAL_PROGRESS_KEY = "ep_progress_local";
const LOCAL_PROGRESS_DIRTY_KEY = "ep_progress_local_dirty";

export function readLocalProgress() {
  try {
    const raw = window.localStorage.getItem(LOCAL_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeLocalProgress(progress, { markDirty = true } = {}) {
  try {
    window.localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress || {}));
    if (markDirty) {
      window.localStorage.setItem(LOCAL_PROGRESS_DIRTY_KEY, new Date().toISOString());
    }
  } catch {
    // no-op
  }
}

export function isLocalProgressDirty() {
  return Boolean(window.localStorage.getItem(LOCAL_PROGRESS_DIRTY_KEY));
}

export function clearLocalProgressDirty() {
  window.localStorage.removeItem(LOCAL_PROGRESS_DIRTY_KEY);
}

export function applyVocabularyUpdate(progress, payload) {
  const base = progress && typeof progress === "object" ? progress : {};
  const learnedIds = Array.isArray(payload?.learned_word_ids)
    ? payload.learned_word_ids.map(Number).filter(Number.isFinite).sort((a, b) => a - b)
    : [];
  const learnedCsv = typeof payload?.learned_words_csv === "string" ? payload.learned_words_csv : "";

  const sourceBlock = base.my_vocabulary || base.modules?.my_vocabulary || {};
  const block = {
    ...sourceBlock,
    learned_word_ids: learnedIds,
    learned_word_ranks: learnedIds,
    learned_words: learnedIds.length,
    saved_words: learnedIds.length,
    learned_words_csv: learnedCsv,
    last_page: Number(payload?.last_page || sourceBlock.last_page || 1),
    last_sort: payload?.last_sort || sourceBlock.last_sort || "rank",
    last_filter: payload?.last_filter || sourceBlock.last_filter || "both",
    last_search: typeof payload?.last_search === "string" ? payload.last_search : sourceBlock.last_search || "",
  };

  return {
    ...base,
    my_vocabulary: { ...block },
    modules: {
      ...(base.modules || {}),
      my_vocabulary: { ...block },
    },
  };
}

