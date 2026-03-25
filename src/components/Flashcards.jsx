import React, { useEffect, useMemo, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft } from "lucide-react";
import { A1_FLASHCARDS, A2_FLASHCARDS, B1_FLASHCARDS } from "../data/flashcardsData";
import FlashcardSession from "./FlashcardSession";
import SessionResults from "./FlashcardsSessionResults";
import ModuleGuideButton from "./ModuleGuideButton";

const DECKS = [
  { id: "A1", name: "Saudacoes e introducoes", labelKey: "flash.deck.a1", data: A1_FLASHCARDS, available: true },
  { id: "A2", name: "Conversas do dia a dia", labelKey: "flash.deck.a2", data: A2_FLASHCARDS, available: true },
  { id: "B1", name: "Revisao de contexto", labelKey: "flash.deck.b1", data: B1_FLASHCARDS, available: true },
];

const VOCAB_SYNC_STOPWORDS = new Set([
  "the", "and", "for", "are", "you", "your", "with", "this", "that", "have", "has", "had",
  "was", "were", "from", "into", "they", "them", "there", "here", "what", "when", "where",
  "who", "why", "how", "can", "could", "would", "should", "will", "shall", "our", "their",
  "his", "her", "its", "not", "but", "let", "lets", "just", "very", "more", "some", "please",
]);

const DIFFICULT_CARD_THRESHOLD = 6.2;
const LEARNING_STEPS_MINUTES = [1, 10];
const RELEARNING_STEPS_MINUTES = [10, 60];
const DESIRED_RETENTION = 0.88;

function hexToRgb(hex) {
  const cleaned = (hex || "#096105").replace("#", "");
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

function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.max(0, r - amount)}, ${Math.max(0, g - amount)}, ${Math.max(0, b - amount)})`;
}

function uniqueIds(list) {
  return [...new Set((list || []).filter((v) => v != null))];
}

function normalizeWord(raw) {
  return String(raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z']/g, "");
}

function tokenizeVocabulary(text) {
  const matches = String(text || "").match(/[A-Za-z']+/g) || [];
  return matches
    .map((token) => normalizeWord(token))
    .map((token) => token.replace(/^'+|'+$/g, ""))
    .filter((token) => token.length >= 3 && !VOCAB_SYNC_STOPWORDS.has(token));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function buildDeckFromOrder(deck, orderIds) {
  const map = new Map(deck.map((card) => [card.id, card]));
  const ordered = orderIds.map((id) => map.get(id)).filter(Boolean);
  if (ordered.length === orderIds.length && ordered.length > 0) return ordered;
  return deck;
}

function toTimestamp(value) {
  if (!value) return 0;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : 0;
}

function diffInDays(fromIso, toMs) {
  const fromMs = toTimestamp(fromIso);
  if (!fromMs) return 0;
  return Math.max(0, (toMs - fromMs) / (24 * 60 * 60 * 1000));
}

function addMinutesIso(baseMs, minutes) {
  return new Date(baseMs + minutes * 60 * 1000).toISOString();
}

function getSrsState(entry) {
  return entry?.srs_state || (Number(entry?.reviews || 0) > 0 ? "review" : "new");
}

function computeRetrievability(entry, now) {
  const stability = Math.max(0.25, Number(entry?.stability_days || entry?.interval_days || 0.5));
  const elapsedDays = diffInDays(entry?.last_reviewed_at, now);
  if (elapsedDays <= 0) return 1;
  return Math.exp(-elapsedDays / stability);
}

function buildSrsOrder(deck, deckId, srsCards = {}) {
  const now = Date.now();
  const withMeta = deck.map((card) => {
    const key = `${deckId}:${card.id}`;
    const entry = srsCards[key] || null;
    const dueAt = toTimestamp(entry?.due_at);
    const reviews = Number(entry?.reviews || 0);
    const lapses = Number(entry?.lapses || 0);
    const difficulty = Number(entry?.difficulty || 5);
    const stability = Math.max(0.25, Number(entry?.stability_days || entry?.interval_days || 0.5));
    const retrievability = computeRetrievability(entry, now);
    const srsState = getSrsState(entry);
    const isSeen = reviews > 0;
    const isDue = !isSeen || dueAt <= now;
    const overdueDays = dueAt ? Math.max(0, (now - dueAt) / (24 * 60 * 60 * 1000)) : 0;
    const urgency =
      (srsState === "relearning" ? 180 : srsState === "learning" ? 130 : 0) +
      (isSeen ? 0 : 120) +
      (isDue ? 60 : 0) +
      overdueDays * 18 +
      lapses * 12 +
      difficulty * 5 +
      (1 - retrievability) * 50 -
      stability * 2;
    return { card, dueAt, reviews, isSeen, isDue, urgency, srsState };
  });

  const dueCards = withMeta
    .filter((item) => item.isDue)
    .sort((a, b) => b.urgency - a.urgency || a.dueAt - b.dueAt);

  const laterCards = withMeta
    .filter((item) => item.isSeen && !item.isDue)
    .sort((a, b) => a.dueAt - b.dueAt || b.urgency - a.urgency);

  const targetSize = Math.min(deck.length, Math.max(12, dueCards.length || 0));
  return [...dueCards, ...laterCards].slice(0, targetSize).map((item) => item.card.id);
}

function buildDifficultOrder(deck, deckId, srsCards = {}) {
  const now = Date.now();
  const difficult = deck
    .map((card) => {
      const key = `${deckId}:${card.id}`;
      const entry = srsCards[key] || null;
      if (!entry) return null;
      const srsState = getSrsState(entry);
      const difficulty = Number(entry?.difficulty || 0);
      const lapses = Number(entry?.lapses || 0);
      const forgetting = Number(entry?.forgetting_index || 0);
      const retrievability = computeRetrievability(entry, now);
      const dueAt = toTimestamp(entry?.due_at);
      const dueWeight = dueAt && dueAt <= now ? 18 : 0;
      const score =
        difficulty * 6 +
        lapses * 14 +
        forgetting * 100 +
        (1 - retrievability) * 40 +
        dueWeight +
        (srsState === "relearning" ? 25 : srsState === "learning" ? 12 : 0);
      const qualifies =
        srsState === "learning" ||
        srsState === "relearning" ||
        lapses > 0 ||
        forgetting >= 0.16 ||
        difficulty >= DIFFICULT_CARD_THRESHOLD ||
        retrievability <= 0.72;
      if (!qualifies) return null;
      return { cardId: card.id, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.cardId);

  return difficult.length ? difficult : buildSrsOrder(deck, deckId, srsCards).slice(0, Math.min(10, deck.length));
}

function computeDeckScheduleStats(deck, deckId, srsCards = {}) {
  const now = Date.now();
  const today = todayKey();
  let dueToday = 0;
  let difficult = 0;
  let nextDueAt = null;

  deck.forEach((card) => {
    const entry = srsCards?.[`${deckId}:${card.id}`];
    if (!entry) {
      dueToday += 1;
      return;
    }

    const dueAt = toTimestamp(entry?.due_at);
    const dueDate = entry?.due_at ? String(entry.due_at).slice(0, 10) : today;
    const isDue = !dueAt || dueAt <= now || dueDate <= today;
    if (isDue) {
      dueToday += 1;
    } else if (!nextDueAt || dueAt < nextDueAt) {
      nextDueAt = dueAt;
    }

    const difficulty = Number(entry?.difficulty || 0);
    const lapses = Number(entry?.lapses || 0);
    const forgetting = Number(entry?.forgetting_index || 0);
    const retrievability = computeRetrievability(entry, now);
    const srsState = getSrsState(entry);
    if (
      srsState === "learning" ||
      srsState === "relearning" ||
      lapses > 0 ||
      forgetting >= 0.16 ||
      difficulty >= DIFFICULT_CARD_THRESHOLD ||
      retrievability <= 0.72
    ) {
      difficult += 1;
    }
  });

  return {
    dueToday,
    difficult,
    nextDueAt,
  };
}
function buildDailyFocusOrder(deck, deckId, flashModule, day) {
  const daily = flashModule?.daily_deck_status?.[deckId];
  if (!daily?.last_completed_date || daily.last_completed_date === day) return null;
  const focus = uniqueIds(daily.focus_ids || []);
  if (!focus.length) return null;
  const deckSet = new Set(deck.map((card) => card.id));
  const valid = focus.filter((id) => deckSet.has(id));
  return valid.length ? valid : null;
}

function computeSrsUpdate(prevEntry, rating, reviewedAtIso) {
  const reviewedAt = Date.parse(reviewedAtIso);
  const prevState = getSrsState(prevEntry);
  const prevStep = Math.max(0, Number(prevEntry?.step_index || 0));
  const prevEase = Math.max(1.3, Number(prevEntry?.ease || 2.5));
  const prevInterval = Math.max(0.25, Number(prevEntry?.interval_days || 0.5));
  const prevReviews = Number(prevEntry?.reviews || 0);
  const prevLapses = Number(prevEntry?.lapses || 0);
  const prevDifficulty = Math.max(1, Math.min(10, Number(prevEntry?.difficulty || 5)));
  const prevStability = Math.max(0.25, Number(prevEntry?.stability_days || prevInterval || 0.5));
  const prevForgetting = Math.max(0, Number(prevEntry?.forgetting_index || 0));
  const elapsedDays = diffInDays(prevEntry?.last_reviewed_at, reviewedAt);
  const retrievability = computeRetrievability(prevEntry, reviewedAt);

  const ratingConfig = {
    again: { easeDelta: -0.25, difficultyDelta: 0.55, stabilityFactor: 0.38, intervalFactor: 0.35, forgettingDelta: 0.22 },
    hard: { easeDelta: -0.1, difficultyDelta: 0.22, stabilityFactor: 1.08, intervalFactor: 0.82, forgettingDelta: 0.1 },
    good: { easeDelta: 0.05, difficultyDelta: -0.08, stabilityFactor: 1.65, intervalFactor: 1.28, forgettingDelta: -0.08 },
    easy: { easeDelta: 0.12, difficultyDelta: -0.16, stabilityFactor: 2.25, intervalFactor: 1.85, forgettingDelta: -0.14 },
  }[rating] || { easeDelta: 0, difficultyDelta: 0, stabilityFactor: 1, intervalFactor: 1, forgettingDelta: 0 };

  const overduePressure = elapsedDays > prevStability ? Math.min(1.8, elapsedDays / prevStability) : 1;
  const nextEase = Math.max(1.3, Math.min(3, prevEase + ratingConfig.easeDelta));
  const nextDifficulty = Math.max(1, Math.min(10, prevDifficulty + ratingConfig.difficultyDelta + (retrievability < 0.55 ? 0.18 : 0)));
  const nextForgetting = Math.max(
    0,
    Math.min(1, prevForgetting + ratingConfig.forgettingDelta + (rating === "again" ? 0.12 : 0) - (rating === "easy" ? 0.04 : 0))
  );

  const graduateToReview = (baseIntervalDays) => {
    const desiredRetentionFactor = Math.max(0.78, Math.min(0.97, DESIRED_RETENTION));
    const stabilitySeed =
      rating === "easy"
        ? Math.max(2.4, prevStability * 1.9)
        : Math.max(1.2, prevStability * 1.35);
    const intervalDays = Math.max(
      baseIntervalDays,
      Number((stabilitySeed * (1 + (desiredRetentionFactor - 0.8) * 1.5)).toFixed(2))
    );
    return {
      srs_state: "review",
      step_index: 0,
      next_step_minutes: null,
      interval_days: intervalDays,
      stability_days: Number(stabilitySeed.toFixed(2)),
      due_at: new Date(reviewedAt + intervalDays * 24 * 60 * 60 * 1000).toISOString(),
    };
  };

  if (prevState === "new" || prevState === "learning" || prevState === "relearning") {
    const steps = prevState === "relearning" ? RELEARNING_STEPS_MINUTES : LEARNING_STEPS_MINUTES;

    if (rating === "again") {
      return {
        ease: Number(Math.max(1.3, prevEase - 0.15).toFixed(2)),
        interval_days: Number((steps[0] / 1440).toFixed(3)),
        stability_days: Number(Math.max(0.2, prevStability * 0.45).toFixed(2)),
        difficulty: Number(Math.min(10, prevDifficulty + 0.45).toFixed(2)),
        retrievability: Number(Math.max(0.08, retrievability * 0.55).toFixed(3)),
        forgetting_index: Number(Math.min(1, prevForgetting + 0.24).toFixed(3)),
        due_at: addMinutesIso(reviewedAt, steps[0]),
        reviews: prevReviews + 1,
        lapses: prevLapses + 1,
        last_rating: rating,
        last_reviewed_at: reviewedAtIso,
        srs_state: prevReviews > 0 ? "relearning" : "learning",
        step_index: 0,
        next_step_minutes: steps[0],
        desired_retention: DESIRED_RETENTION,
      };
    }

    if (rating === "hard") {
      const hardStep = steps[Math.min(prevStep, steps.length - 1)];
      return {
        ease: Number(Math.max(1.3, prevEase - 0.05).toFixed(2)),
        interval_days: Number((hardStep / 1440).toFixed(3)),
        stability_days: Number(Math.max(0.35, prevStability * 0.9).toFixed(2)),
        difficulty: Number(Math.min(10, prevDifficulty + 0.14).toFixed(2)),
        retrievability: Number(Math.max(0.1, retrievability * 0.8).toFixed(3)),
        forgetting_index: Number(Math.min(1, prevForgetting + 0.08).toFixed(3)),
        due_at: addMinutesIso(reviewedAt, hardStep),
        reviews: prevReviews + 1,
        lapses: prevLapses,
        last_rating: rating,
        last_reviewed_at: reviewedAtIso,
        srs_state: prevReviews > 0 ? prevState : "learning",
        step_index: Math.min(prevStep, steps.length - 1),
        next_step_minutes: hardStep,
        desired_retention: DESIRED_RETENTION,
      };
    }

    if (rating === "good") {
      const nextStep = prevStep + 1;
      if (nextStep >= steps.length) {
        const graduated = graduateToReview(prevState === "relearning" ? 1 : 1.5);
        return {
          ease: Number((prevEase + 0.04).toFixed(2)),
          difficulty: Number(Math.max(1, prevDifficulty - 0.08).toFixed(2)),
          retrievability: Number(Math.max(0.12, retrievability).toFixed(3)),
          forgetting_index: Number(Math.max(0, prevForgetting - 0.08).toFixed(3)),
          reviews: prevReviews + 1,
          lapses: prevLapses,
          last_rating: rating,
          last_reviewed_at: reviewedAtIso,
          desired_retention: DESIRED_RETENTION,
          ...graduated,
        };
      }
      const nextMinutes = steps[nextStep];
      return {
        ease: Number((prevEase + 0.03).toFixed(2)),
        interval_days: Number((nextMinutes / 1440).toFixed(3)),
        stability_days: Number(Math.max(0.45, prevStability * 1.05).toFixed(2)),
        difficulty: Number(Math.max(1, prevDifficulty - 0.06).toFixed(2)),
        retrievability: Number(Math.max(0.12, retrievability).toFixed(3)),
        forgetting_index: Number(Math.max(0, prevForgetting - 0.06).toFixed(3)),
        due_at: addMinutesIso(reviewedAt, nextMinutes),
        reviews: prevReviews + 1,
        lapses: prevLapses,
        last_rating: rating,
        last_reviewed_at: reviewedAtIso,
        srs_state: prevState === "relearning" ? "relearning" : "learning",
        step_index: nextStep,
        next_step_minutes: nextMinutes,
        desired_retention: DESIRED_RETENTION,
      };
    }

    if (rating === "easy") {
      const graduated = graduateToReview(prevState === "relearning" ? 2 : 4);
      return {
        ease: Number((prevEase + 0.12).toFixed(2)),
        difficulty: Number(Math.max(1, prevDifficulty - 0.16).toFixed(2)),
        retrievability: Number(Math.max(0.2, retrievability).toFixed(3)),
        forgetting_index: Number(Math.max(0, prevForgetting - 0.12).toFixed(3)),
        reviews: prevReviews + 1,
        lapses: prevLapses,
        last_rating: rating,
        last_reviewed_at: reviewedAtIso,
        desired_retention: DESIRED_RETENTION,
        ...graduated,
      };
    }
  }

  let nextStability;
  if (rating === "again") {
    nextStability = Math.max(0.33, prevStability * ratingConfig.stabilityFactor);
  } else {
    const retentionBoost = 1 + retrievability * 0.7;
    const difficultyPenalty = 1 - (nextDifficulty - 1) / 18;
    nextStability = Math.max(
      0.75,
      prevStability * ratingConfig.stabilityFactor * retentionBoost * difficultyPenalty * Math.min(1.2, overduePressure)
    );
  }

  const nextInterval = Math.max(
    rating === "again" ? 0.2 : 0.75,
    Number((nextStability * ratingConfig.intervalFactor * (1 - nextForgetting * 0.35)).toFixed(2))
  );

  const dueAt = new Date(reviewedAt + nextInterval * 24 * 60 * 60 * 1000).toISOString();
  return {
    ease: Number(nextEase.toFixed(2)),
    interval_days: Number(nextInterval.toFixed(2)),
    stability_days: Number(nextStability.toFixed(2)),
    difficulty: Number(nextDifficulty.toFixed(2)),
    retrievability: Number(Math.max(0.05, retrievability).toFixed(3)),
    forgetting_index: Number(nextForgetting.toFixed(3)),
    due_at: dueAt,
    reviews: prevReviews + 1,
    lapses: rating === "again" ? prevLapses + 1 : prevLapses,
    last_rating: rating,
    last_reviewed_at: reviewedAtIso,
    srs_state: rating === "again" ? "relearning" : "review",
    step_index: rating === "again" ? 0 : 0,
    next_step_minutes: rating === "again" ? RELEARNING_STEPS_MINUTES[0] : null,
    desired_retention: DESIRED_RETENTION,
  };
}
async function readProgress() {
  const res = await fetch("/api/progress");
  if (!res.ok) throw new Error("Falha ao ler progresso");
  return res.json();
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  return res.json();
}

function ensureFlashcardsModule(progress) {
  const base = progress || {};
  if (!base.modules) base.modules = {};
  if (!base.modules.flashcards) {
    base.modules.flashcards = {
      active_deck_id: null,
      session: null,
      last_results: null,
      srs_cards: {},
      daily_deck_status: {},
      sync_to_vocabulary: true,
      difficult_only_mode: false,
      deck_history: {},
      global_review_cards: [],
    };
  }
  if (!base.modules.flashcards.srs_cards) base.modules.flashcards.srs_cards = {};
  if (!base.modules.flashcards.daily_deck_status) base.modules.flashcards.daily_deck_status = {};
  if (!base.modules.flashcards.deck_history) base.modules.flashcards.deck_history = {};
  if (!Array.isArray(base.modules.flashcards.global_review_cards)) {
    base.modules.flashcards.global_review_cards = [];
  }
  if (typeof base.modules.flashcards.sync_to_vocabulary !== "boolean") {
    base.modules.flashcards.sync_to_vocabulary = true;
  }
  if (typeof base.modules.flashcards.difficult_only_mode !== "boolean") {
    base.modules.flashcards.difficult_only_mode = false;
  }
  if (!base.modules.my_vocabulary && !base.my_vocabulary) {
    base.modules.my_vocabulary = {
      saved_words: 0,
      learned_words: 0,
      learned_word_ids: [],
      learned_word_ranks: [],
      learned_words_csv: "",
      favorite_word_ids: [],
      recent_word_ids: [],
      last_page: 1,
      last_sort: "rank",
      last_filter: "both",
      last_search: "",
      saved_words_custom: [],
    };
    base.my_vocabulary = { ...base.modules.my_vocabulary };
  } else if (!base.modules.my_vocabulary && base.my_vocabulary) {
    base.modules.my_vocabulary = { ...base.my_vocabulary };
  } else if (!base.my_vocabulary && base.modules.my_vocabulary) {
    base.my_vocabulary = { ...base.modules.my_vocabulary };
  }
  if (!Array.isArray(base.modules.my_vocabulary.saved_words_custom)) {
    base.modules.my_vocabulary.saved_words_custom = [];
  }
  if (!Array.isArray(base.modules.my_vocabulary.recent_word_ids)) {
    base.modules.my_vocabulary.recent_word_ids = [];
  }
  if (!Array.isArray(base.my_vocabulary.saved_words_custom)) {
    base.my_vocabulary.saved_words_custom = [...base.modules.my_vocabulary.saved_words_custom];
  }
  if (!Array.isArray(base.my_vocabulary.recent_word_ids)) {
    base.my_vocabulary.recent_word_ids = [...base.modules.my_vocabulary.recent_word_ids];
  }
  return base;
}

function TrailNode({
  deck,
  index,
  isUnlocked,
  canStart,
  isActive,
  isCompleted,
  isDoneToday,
  isLast,
  badgeLabel,
  deckLabel,
  onClick,
  themeColor,
  scheduleStats,
  sourceLanguage,
}) {
  const iconSrc = isLast
    ? "/img/icons/trofeu.svg"
    : isCompleted || isDoneToday
      ? "/img/icons/check.svg"
      : isActive && canStart
        ? "/img/icons/haltere.svg"
        : isUnlocked
          ? "/img/icons/estrela.svg"
          : "/img/icons/haltere.svg";
  const offsetClass = index % 2 === 0 ? "offset-left" : "offset-right";
  return (
    <div className={`flash-trail-node-row ${offsetClass}`}>
      <div className={`flash-node-ring ${isActive ? "is-active" : ""}`}>
        <button
          type="button"
          className={`flash-trail-node ${isUnlocked ? "is-open" : "is-locked"} ${isActive ? "is-active" : ""} ${isCompleted ? "is-complete" : ""} ${isDoneToday ? "is-done-today" : ""} ${!canStart ? "is-disabled" : ""}`}
          onClick={() => canStart && onClick(deck)}
          disabled={!canStart}
          style={{
            "--flash-theme": themeColor,
            "--flash-theme-shadow": darken(themeColor, 28),
          }}
        >
          <span className="flash-node-icon">
            <img src={iconSrc} alt="" className="flash-node-imgicon" />
          </span>
          {badgeLabel ? <span className={`flash-node-badge ${isDoneToday ? "is-done-today" : ""}`}>{badgeLabel}</span> : null}
        </button>
      </div>
      <div className="flash-node-title">{deckLabel}</div>
      <div className="flash-node-meta">
        {isDoneToday ? (
          <span>{getUiLabel("flash.node.done_today", "Done today • back tomorrow")}</span>
        ) : (
          <span>
            {getUiLabel("flash.node.today_difficult", "{today} today • {difficult} difficult").replace("{today}", String(scheduleStats?.dueToday || 0)).replace("{difficult}", String(scheduleStats?.difficult || 0))}
          </span>
        )}
        {!isDoneToday ? <small>{getUiLabel("flash.node.next_window", "Next window")}: {scheduleStats?.nextDueAt ? new Date(scheduleStats.nextDueAt).toLocaleDateString(sourceLanguage || "pt-BR") : getUiLabel("flash.today", "Today")}</small> : null}
      </div>
    </div>
  );
}

export default function Flashcards({ setCurrentView, color = "#096105" }) {
  const [view, setView] = useState("trail");
  const [loading, setLoading] = useState(true);
  const [selectedDeckId, setSelectedDeckId] = useState("A1");
  const [sessionState, setSessionState] = useState(null);
  const [sessionResults, setSessionResults] = useState(null);
  const [dailyStatusByDeck, setDailyStatusByDeck] = useState({});
  const [syncToVocabulary, setSyncToVocabulary] = useState(true);
  const [difficultOnlyMode, setDifficultOnlyMode] = useState(false);
  const [srsCards, setSrsCards] = useState({});
  const [deckHistory, setDeckHistory] = useState({});
  const [sourceLanguage, setSourceLanguage] = useState("pt-BR");

  const selectedDeck = useMemo(
    () => DECKS.find((d) => d.id === selectedDeckId) || DECKS[0],
    [selectedDeckId]
  );

  const getDeckLabel = (deck) => getUiLabel(deck?.labelKey || "", deck?.name || "");

  const persistedDeck = useMemo(() => {
    if (!sessionState?.card_order?.length) return selectedDeck.data;
    return buildDeckFromOrder(selectedDeck.data, sessionState.card_order);
  }, [selectedDeck, sessionState]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = ensureFlashcardsModule(await readProgress());
        const flash = progress.modules.flashcards;
        if (!mounted) return;
        setSourceLanguage(progress?.languages?.source_language || "pt-BR");
        if (flash?.active_deck_id) setSelectedDeckId(flash.active_deck_id);
        setDailyStatusByDeck(flash?.daily_deck_status || {});
        setSyncToVocabulary(typeof flash?.sync_to_vocabulary === "boolean" ? flash.sync_to_vocabulary : true);
        setDifficultOnlyMode(Boolean(flash?.difficult_only_mode));
        setSrsCards(flash?.srs_cards || {});
        setDeckHistory(flash?.deck_history || {});
        if (flash?.session && flash.session.completed !== true) {
          setSessionState(flash.session);
        } else if (flash?.last_results) {
          setSessionResults(flash.last_results);
        }
      } catch {
        // no-op
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persistFlashcards = async (updater) => {
    const current = ensureFlashcardsModule(await readProgress());
    const next = updater(current);
    const saved = await writeProgress(next);
    const normalized = ensureFlashcardsModule(saved);
    setDailyStatusByDeck(normalized.modules.flashcards.daily_deck_status || {});
    setSrsCards(normalized.modules.flashcards.srs_cards || {});
    setDeckHistory(normalized.modules.flashcards.deck_history || {});
    setSyncToVocabulary(
      typeof normalized.modules.flashcards.sync_to_vocabulary === "boolean"
        ? normalized.modules.flashcards.sync_to_vocabulary
        : true
    );
    setDifficultOnlyMode(Boolean(normalized.modules.flashcards.difficult_only_mode));
    return normalized;
  };

  const toggleVocabularySync = async () => {
    const nextValue = !syncToVocabulary;
    setSyncToVocabulary(nextValue);
    await persistFlashcards((progress) => {
      progress.modules.flashcards.sync_to_vocabulary = nextValue;
      return progress;
    });
  };

  const toggleDifficultOnlyMode = async () => {
    const nextValue = !difficultOnlyMode;
    setDifficultOnlyMode(nextValue);
    await persistFlashcards((progress) => {
      progress.modules.flashcards.difficult_only_mode = nextValue;
      return progress;
    });
  };

  const startDeck = async (deck) => {
    const day = todayKey();
    const canResume =
      sessionState &&
      sessionState.completed !== true &&
      sessionState.deck_id === deck.id &&
      Array.isArray(sessionState.card_order) &&
      sessionState.card_order.length > 0;

    const progressSnapshot = ensureFlashcardsModule(await readProgress());
    const flash = progressSnapshot.modules.flashcards;
    const dailyInfo = flash.daily_deck_status?.[deck.id];
    const isDoneToday = dailyInfo?.last_completed_date === day;

    if (isDoneToday) {
      setSelectedDeckId(deck.id);
      return;
    }

    const focusOrder = buildDailyFocusOrder(deck.data, deck.id, flash, day);
    const difficultOrder = difficultOnlyMode ? buildDifficultOrder(deck.data, deck.id, flash.srs_cards) : null;

    const session = canResume
      ? {
          ...sessionState,
          updated_at: new Date().toISOString(),
        }
      : {
          deck_id: deck.id,
          started_at: new Date().toISOString(),
          card_order: difficultOrder || focusOrder || buildSrsOrder(deck.data, deck.id, flash.srs_cards),
          current_index: 0,
          is_flipped: false,
          answers: [],
          completed: false,
          study_date: day,
          focus_mode: difficultOnlyMode ? "difficult_only" : Boolean(focusOrder),
          updated_at: new Date().toISOString(),
        };

    setSelectedDeckId(deck.id);
    setSessionState(session);
    setSessionResults(null);
    setView("session");
    await persistFlashcards((progress) => {
      progress.modules.flashcards.active_deck_id = deck.id;
      progress.modules.flashcards.session = session;
      progress.modules.flashcards.last_results = null;
      return progress;
    });
  };

  const saveSessionProgress = async (nextSessionState) => {
    setSessionState(nextSessionState);
    await persistFlashcards((progress) => {
      progress.modules.flashcards.active_deck_id = nextSessionState.deck_id;
      progress.modules.flashcards.session = nextSessionState;
      return progress;
    });
  };

  const handleSessionComplete = async (resultsPayload) => {
    const finishedAt = new Date().toISOString();
    const day = todayKey();
    const answers = Array.isArray(resultsPayload?.answers) ? resultsPayload.answers : [];
    const startedAt = sessionState?.started_at || finishedAt;
    const durationSeconds = Math.max(1, Math.round((Date.parse(finishedAt) - Date.parse(startedAt)) / 1000));
    const uniqueReviewedCards = [...new Set(answers.map((item) => item?.cardId).filter(Boolean))].length;
    const cardsPerMinute = uniqueReviewedCards > 0 ? Number(((uniqueReviewedCards / durationSeconds) * 60).toFixed(1)) : 0;
    const accuracy = uniqueReviewedCards > 0
      ? Math.round((((resultsPayload?.summary?.easy || 0) + (resultsPayload?.summary?.good || 0)) / uniqueReviewedCards) * 100)
      : 0;
    const priority = { again: 0, hard: 1, good: 2, easy: 3 };
    const focusIds = uniqueIds(
      answers
        .filter((item) => ["again", "hard", "good"].includes(item?.rating))
        .sort((a, b) => (priority[a.rating] ?? 99) - (priority[b.rating] ?? 99))
        .map((item) => item.cardId)
    );

    const deckMap = new Map(selectedDeck.data.map((card) => [card.id, card]));
    const updatedSrsEntries = [];

    const nextResults = {
      ...resultsPayload,
      deck_id: selectedDeck.id,
      deck_name: getDeckLabel(selectedDeck),
      started_at: startedAt,
      finished_at: finishedAt,
      duration_seconds: durationSeconds,
      completed: true,
      completed_day: day,
      focus_cards_count: focusIds.length,
      unique_reviewed_cards: uniqueReviewedCards,
      cards_per_minute: cardsPerMinute,
      accuracy,
    };

    setView("results");
    setSessionState(null);

    await persistFlashcards((progress) => {
        const flash = progress.modules.flashcards;

        for (const answer of answers) {
          const cardId = answer?.cardId;
          const rating = answer?.rating;
          if (cardId == null || !rating) continue;
          const key = `${selectedDeck.id}:${cardId}`;
          const prevEntry = flash.srs_cards[key] || { deck_id: selectedDeck.id, card_id: cardId };
          const nextEntry = {
            ...prevEntry,
            deck_id: selectedDeck.id,
            card_id: cardId,
            ...computeSrsUpdate(prevEntry, rating, finishedAt),
          };
          flash.srs_cards[key] = nextEntry;
          updatedSrsEntries.push({
            ...nextEntry,
            rating,
            front: deckMap.get(cardId)?.front || `Card ${cardId}`,
            back: deckMap.get(cardId)?.back || "",
          });
        }

        const weakestCards = updatedSrsEntries
          .sort((a, b) => {
            const aWeight = (priority[a.rating] ?? 99) * 100 + Number(a.difficulty || 0) * 10 + Number(a.forgetting_index || 0) * 100;
            const bWeight = (priority[b.rating] ?? 99) * 100 + Number(b.difficulty || 0) * 10 + Number(b.forgetting_index || 0) * 100;
            return aWeight - bWeight;
          })
          .slice(0, 6)
          .map((item) => ({
            card_id: item.card_id,
            front: item.front,
            back: item.back,
            rating: item.rating,
            difficulty: item.difficulty,
            stability_days: item.stability_days,
            due_at: item.due_at,
          }));

        const nextDueAt = updatedSrsEntries
          .map((item) => item.due_at)
          .filter(Boolean)
          .sort()[0] || null;

        nextResults.weakest_cards = weakestCards;
        nextResults.next_due_at = nextDueAt;
        nextResults.due_within_24h = updatedSrsEntries.filter(
          (item) => item.due_at && Date.parse(item.due_at) <= Date.now() + 24 * 60 * 60 * 1000
        ).length;

        const globalReviewCards = weakestCards.slice(0, 4).map((item) => ({
          key: `flashcards:${selectedDeck.id}:${item.card_id}`,
          module: "Flashcards",
          title: `${getDeckLabel(selectedDeck)} • ${getUiLabel("flash.review_card", "review card")}`,
          prompt: `${item.front} -> ${item.back || getUiLabel("flash.remember_meaning", "Remember the meaning")}`,
          card_id: item.card_id,
          deck_id: selectedDeck.id,
          deck_name: getDeckLabel(selectedDeck),
          due_date: day,
          interval_days: 1,
          status: "due",
        }));

        flash.daily_deck_status[selectedDeck.id] = {
          ...(flash.daily_deck_status[selectedDeck.id] || {}),
          deck_id: selectedDeck.id,
          deck_name: getDeckLabel(selectedDeck),
          last_completed_date: day,
          last_completed_at: finishedAt,
          completed_today: true,
          last_total_cards: Number(resultsPayload?.total_cards || 0),
          last_summary: nextResults.summary || {},
          focus_ids: focusIds,
          next_due_at: nextResults.next_due_at,
          due_within_24h: nextResults.due_within_24h,
          difficult_mode_last_run: sessionState?.focus_mode === "difficult_only",
        };

        flash.global_review_cards = globalReviewCards;

        const currentHistory = Array.isArray(flash.deck_history?.[selectedDeck.id])
          ? flash.deck_history[selectedDeck.id]
          : [];
        const historyEntry = {
          completed_at: finishedAt,
          completed_day: day,
          duration_seconds: durationSeconds,
          accuracy,
          unique_reviewed_cards: uniqueReviewedCards,
          cards_per_minute: cardsPerMinute,
          summary: nextResults.summary || {},
          difficult_mode: sessionState?.focus_mode === "difficult_only",
          focus_cards_count: focusIds.length,
        };
        flash.deck_history[selectedDeck.id] = [historyEntry, ...currentHistory].slice(0, 30);

        if (!progress.modules.srs_global) {
          progress.modules.srs_global = {
            queue: [],
            completed_today: 0,
            total_reviews: 0,
            last_generated_date: day,
            next_item_id: 1,
          };
        }

        const existingQueue = Array.isArray(progress.modules.srs_global.queue)
          ? progress.modules.srs_global.queue
          : [];
        const withoutCurrentFlashcards = existingQueue.filter(
          (entry) => !(entry?.module === "Flashcards" && String(entry?.key || "").startsWith("flashcards:"))
        );
        let nextItemId = Number(progress.modules.srs_global.next_item_id || 1);
        const appendedFlashcardsQueue = globalReviewCards.map((entry) => ({
          id: nextItemId++,
          ...entry,
        }));
        progress.modules.srs_global = {
          ...progress.modules.srs_global,
          queue: [...withoutCurrentFlashcards, ...appendedFlashcardsQueue],
          next_item_id: nextItemId,
          last_generated_date: progress.modules.srs_global.last_generated_date || day,
        };

      if (flash.sync_to_vocabulary) {
        const vocabModule = progress.modules.my_vocabulary || {};
        const vocabRoot = progress.my_vocabulary || {};
        const currentRecent = Array.isArray(vocabModule.recent_word_ids)
          ? vocabModule.recent_word_ids.map((id) => Number(id)).filter(Number.isFinite)
          : [];
        const currentCustom = Array.isArray(vocabModule.saved_words_custom) ? vocabModule.saved_words_custom : [];
        const existingCustomKeys = new Set(
          currentCustom.map((entry) => `${normalizeWord(entry.word)}|${entry.source || ""}`)
        );
        const nextCustom = [...currentCustom];

        const importTokens = uniqueIds(
          answers
            .map((answer) => deckMap.get(answer?.cardId))
            .filter(Boolean)
            .flatMap((card) => tokenizeVocabulary(`${card.front} ${card.topic || ""}`))
        );

        importTokens.forEach((token) => {
          const key = `${normalizeWord(token)}|flashcards`;
          if (!existingCustomKeys.has(key)) {
            existingCustomKeys.add(key);
            nextCustom.unshift({
              word: token.charAt(0).toUpperCase() + token.slice(1),
              source: "flashcards",
              deck_id: selectedDeck.id,
              deck_name: getDeckLabel(selectedDeck),
              added_at: finishedAt,
            });
          }
        });

        const nextVocabulary = {
          ...vocabRoot,
          ...vocabModule,
          saved_words_custom: nextCustom.slice(0, 500),
          recent_word_ids: currentRecent.slice(0, 12),
        };
        progress.modules.my_vocabulary = { ...nextVocabulary };
        progress.my_vocabulary = { ...nextVocabulary };
      }

      progress.modules.flashcards.active_deck_id = selectedDeck.id;
      progress.modules.flashcards.session = { completed: true, completed_day: day };
      progress.modules.flashcards.last_results = nextResults;
      return progress;
    });

    setSessionResults({ ...nextResults });
  };

  const handleBackToTrail = async () => {
    setView("trail");
    await persistFlashcards((progress) => {
      progress.modules.flashcards.last_results = null;
      return progress;
    });
  };

  const today = todayKey();
  const hasInProgressSession =
    sessionState &&
    sessionState.completed !== true &&
    sessionState.deck_id &&
    Array.isArray(sessionState.card_order) &&
    sessionState.card_order.length > 0;

  const inProgressDeckId = hasInProgressSession ? sessionState.deck_id : null;

  const completedHistoryByDeck = DECKS.map((deck) => {
    const dailyInfo = dailyStatusByDeck?.[deck.id] || null;
    const doneByDailyHistory = Boolean(dailyInfo?.last_completed_date);
    const doneByResults = sessionResults?.deck_id === deck.id;
    return doneByDailyHistory || doneByResults;
  });

  const firstPendingIndex = completedHistoryByDeck.findIndex((done) => !done);

  const nextDeckId = inProgressDeckId
    ? inProgressDeckId
    : (firstPendingIndex >= 0 ? DECKS[firstPendingIndex].id : null);

  const selectedDeckDifficultCount = useMemo(
    () => buildDifficultOrder(selectedDeck.data, selectedDeck.id, srsCards).length,
    [selectedDeck, srsCards]
  );

  const selectedDeckDueCount = useMemo(() => {
    const now = Date.now();
    return selectedDeck.data.filter((card) => {
      const entry = srsCards?.[`${selectedDeck.id}:${card.id}`];
      if (!entry) return true;
      const dueAt = toTimestamp(entry?.due_at);
      return !dueAt || dueAt <= now;
    }).length;
  }, [selectedDeck, srsCards]);

  const selectedDeckHistory = useMemo(
    () => (Array.isArray(deckHistory?.[selectedDeck.id]) ? deckHistory[selectedDeck.id] : []),
    [deckHistory, selectedDeck.id]
  );

  const selectedDeckHistoryStats = useMemo(() => {
    if (!selectedDeckHistory.length) {
      return {
        sessions: 0,
        averageAccuracy: 0,
        averageDuration: 0,
        bestAccuracy: 0,
        totalReviewedCards: 0,
        lastRunLabel: getUiLabel("flash.history.none", "No history"),
      };
    }
    const sessions = selectedDeckHistory.length;
    const totalAccuracy = selectedDeckHistory.reduce((sum, item) => sum + Number(item.accuracy || 0), 0);
    const totalDuration = selectedDeckHistory.reduce((sum, item) => sum + Number(item.duration_seconds || 0), 0);
    const totalReviewedCards = selectedDeckHistory.reduce((sum, item) => sum + Number(item.unique_reviewed_cards || 0), 0);
    const bestAccuracy = Math.max(...selectedDeckHistory.map((item) => Number(item.accuracy || 0)));
    const lastRun = selectedDeckHistory[0]?.completed_at;
    return {
      sessions,
      averageAccuracy: Math.round(totalAccuracy / sessions),
      averageDuration: Math.round(totalDuration / sessions),
      bestAccuracy,
      totalReviewedCards,
      lastRunLabel: lastRun ? new Date(lastRun).toLocaleDateString(sourceLanguage || "pt-BR") : getUiLabel("flash.history.none", "No history"),
    };
  }, [selectedDeckHistory, sourceLanguage]);

  const formatDurationCompact = (seconds) => {
    const totalSeconds = Math.max(0, Number(seconds || 0));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins <= 0) return `${secs}s`;
    return `${mins}m ${String(secs).padStart(2, "0")}s`;
  };

  if (loading) {
    return (
      <section className="flash-shell" style={{ "--flash-theme": color }}>
        <div className="flash-loading">{getUiLabel("flash.loading", "Loading flashcards...")}</div>
      </section>
    );
  }

  if (view === "session") {
    return (
      <FlashcardSession
        deck={persistedDeck}
        deckId={selectedDeck.id}
        deckName={getDeckLabel(selectedDeck)}
        srsCards={srsCards}
        onSessionComplete={handleSessionComplete}
        onProgress={saveSessionProgress}
        onExit={() => setCurrentView("initial")}
        initialSession={sessionState}
        color={color}
      />
    );
  }

  if (view === "results" && sessionResults) {
    return (
      <SessionResults
        results={sessionResults}
        deckName={getDeckLabel(selectedDeck)}
        color={color}
        sourceLanguage={sourceLanguage}
        onBack={handleBackToTrail}
      />
    );
  }

  return (
    <section
      className="flash-shell"
      style={{
        "--flash-theme": color,
        "--flash-theme-soft": alpha(color, 0.22),
        "--flash-theme-shadow": darken(color, 28),
      }}
    >
      <div className="flash-header-card">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div className="flash-header-content">
          <div className="flash-kicker">{getUiLabel("flash.kicker", "FLASHCARDS")}</div>
          <h1>{getUiLabel("flash.title", "Trail review")}</h1>
        </div>
        <ModuleGuideButton moduleKey="flashcards" color={color} />
      </div>

      <section className="flash-sync-card">
        <div className="flash-sync-copy">
          <div className="flash-sync-kicker">{getUiLabel("flash.sync.kicker", "MY VOCABULARY")}</div>
          <strong>{getUiLabel("flash.sync.title", "Sync vocabulary with flashcards")}</strong>
          <p>{getUiLabel("flash.sync.desc", "When enabled, reviewed words in this track are saved to your vocabulary for future study.")}</p>
        </div>
        <button
          type="button"
          className={`flash-sync-toggle ${syncToVocabulary ? "is-on" : "is-off"}`}
          onClick={toggleVocabularySync}
          aria-pressed={syncToVocabulary}
        >
          <span className="flash-sync-track">
            <span className="flash-sync-thumb" />
          </span>
          <span>{syncToVocabulary ? getUiLabel("flash.toggle.on", "ON") : getUiLabel("flash.toggle.off", "OFF")}</span>
        </button>
      </section>

      <section className="flash-sync-card flash-mode-card">
        <div className="flash-sync-copy">
          <div className="flash-sync-kicker">{getUiLabel("flash.mode.kicker", "REVIEW MODE")}</div>
          <strong>{getUiLabel("flash.mode.only_difficult", "Only difficult cards")}</strong>
          <p>{getUiLabel("flash.mode.desc", "When enabled, the session prioritizes the most fragile cards. There are {difficult} difficult cards and {due} due items in {deck}.").replace("{difficult}", String(selectedDeckDifficultCount)).replace("{due}", String(selectedDeckDueCount)).replace("{deck}", getDeckLabel(selectedDeck))}</p>
        </div>
        <button
          type="button"
          className={`flash-sync-toggle ${difficultOnlyMode ? "is-on" : "is-off"}`}
          onClick={toggleDifficultOnlyMode}
          aria-pressed={difficultOnlyMode}
        >
          <span className="flash-sync-track">
            <span className="flash-sync-thumb" />
          </span>
          <span>{difficultOnlyMode ? getUiLabel("flash.mode.only", "ONLY DIFFICULT") : getUiLabel("flash.mode.all", "ALL CARDS")}</span>
        </button>
      </section>

      <section className="flash-history-grid">
        <article className="flash-history-card">
          <small>{getUiLabel("flash.history.sessions", "Sessions in {deck}").replace("{deck}", getDeckLabel(selectedDeck))}</small>
          <strong>{selectedDeckHistoryStats.sessions}</strong>
          <span>{getUiLabel("flash.history.last", "Last on {date}").replace("{date}", selectedDeckHistoryStats.lastRunLabel)}</span>
        </article>
        <article className="flash-history-card">
          <small>{getUiLabel("flash.history.accuracy", "Average accuracy")}</small>
          <strong>{selectedDeckHistoryStats.averageAccuracy}%</strong>
          <span>{getUiLabel("flash.history.best", "Best result: {value}%").replace("{value}", selectedDeckHistoryStats.bestAccuracy)}</span>
        </article>
        <article className="flash-history-card">
          <small>{getUiLabel("flash.history.time", "Average time")}</small>
          <strong>{formatDurationCompact(selectedDeckHistoryStats.averageDuration)}</strong>
          <span>{getUiLabel("flash.history.based_on", "Based on your latest saved sessions.")}</span>
        </article>
        <article className="flash-history-card">
          <small>{getUiLabel("flash.history.reviewed", "Cards reviewed")}</small>
          <strong>{selectedDeckHistoryStats.totalReviewedCards}</strong>
          <span>{getUiLabel("flash.history.total", "Total accumulated in the recent deck history.")}</span>
        </article>
      </section>

      <div className="flash-trail">
        {DECKS.map((deck, index) => {
          const scheduleStats = computeDeckScheduleStats(deck.data, deck.id, srsCards);
          const dailyInfo = dailyStatusByDeck?.[deck.id] || null;
          const doneByDaily = dailyInfo?.last_completed_date === today;
          const doneByResults =
            sessionResults?.deck_id === deck.id &&
            sessionResults?.completed_day === today;
          const isDoneToday = doneByDaily || doneByResults;

          const isCompleted = completedHistoryByDeck[index];
          const isNextDeck = deck.id === nextDeckId;

          const isUnlocked = isCompleted || isNextDeck;
          const canStart = isUnlocked && deck.available && !isDoneToday;
          const isActive = isNextDeck && canStart;

          const hasOpenSession =
            sessionState &&
            sessionState.completed !== true &&
            sessionState.deck_id === deck.id &&
            Array.isArray(sessionState.card_order) &&
            sessionState.card_order.length > 0;

          let badgeLabel = null;
          if (!isDoneToday && hasOpenSession && deck.id === inProgressDeckId) badgeLabel = getUiLabel("flash.start", "START");
          else if (!isDoneToday && !hasInProgressSession && isNextDeck && canStart) badgeLabel = getUiLabel("flash.start", "START");

          const isLast = index === DECKS.length - 1;

          return (
            <TrailNode
              key={deck.id}
              deck={deck}
              deckLabel={getDeckLabel(deck)}
              index={index}
              isUnlocked={isUnlocked && deck.available}
              canStart={canStart}
              isActive={isActive}
              isCompleted={isCompleted}
              isDoneToday={isDoneToday}
              isLast={isLast}
              badgeLabel={badgeLabel}
              onClick={startDeck}
              themeColor={color}
              scheduleStats={scheduleStats}
              sourceLanguage={sourceLanguage}
            />
          );
        })}
      </div>
    </section>
  );
}










