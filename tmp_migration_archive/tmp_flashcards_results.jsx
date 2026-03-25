import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { A1_FLASHCARDS, A2_FLASHCARDS, B1_FLASHCARDS } from "../data/flashcardsData";
import FlashcardSession from "./FlashcardSession";
import SessionResults from "./FlashcardsSessionResults";
import ModuleGuideButton from "./ModuleGuideButton";

const DECKS = [
  { id: "A1", name: "Saudacoes e introducoes", data: A1_FLASHCARDS, available: true },
  { id: "A2", name: "Conversas do dia a dia", data: A2_FLASHCARDS, available: true },
  { id: "B1", name: "Revisao de contexto", data: B1_FLASHCARDS, available: true },
];

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
    const isSeen = reviews > 0;
    const isDue = !isSeen || dueAt <= now;
    const overdueDays = dueAt ? Math.max(0, (now - dueAt) / (24 * 60 * 60 * 1000)) : 0;
    const urgency =
      (isSeen ? 0 : 120) +
      (isDue ? 60 : 0) +
      overdueDays * 18 +
      lapses * 12 +
      difficulty * 5 +
      (1 - retrievability) * 50 -
      stability * 2;
    return { card, dueAt, reviews, isSeen, isDue, urgency };
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
    };
  }
  if (!base.modules.flashcards.srs_cards) base.modules.flashcards.srs_cards = {};
  if (!base.modules.flashcards.daily_deck_status) base.modules.flashcards.daily_deck_status = {};
  return base;
}

function TrailNode({ deck, index, isUnlocked, canStart, isActive, isCompleted, isDoneToday, isLast, badgeLabel, onClick, themeColor }) {
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
      <div className="flash-node-title">{deck.name}</div>
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

  const selectedDeck = useMemo(
    () => DECKS.find((d) => d.id === selectedDeckId) || DECKS[0],
    [selectedDeckId]
  );

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
        if (flash?.active_deck_id) setSelectedDeckId(flash.active_deck_id);
        setDailyStatusByDeck(flash?.daily_deck_status || {});
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
    return normalized;
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

    const session = canResume
      ? {
          ...sessionState,
          updated_at: new Date().toISOString(),
        }
      : {
          deck_id: deck.id,
          started_at: new Date().toISOString(),
          card_order: focusOrder || buildSrsOrder(deck.data, deck.id, flash.srs_cards),
          current_index: 0,
          is_flipped: false,
          answers: [],
          completed: false,
          study_date: day,
          focus_mode: Boolean(focusOrder),
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

    const nextResults = {
      ...resultsPayload,
      deck_id: selectedDeck.id,
      deck_name: selectedDeck.name,
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

    setSessionResults(nextResults);
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
        flash.srs_cards[key] = {
          ...prevEntry,
          deck_id: selectedDeck.id,
          card_id: cardId,
          ...computeSrsUpdate(prevEntry, rating, finishedAt),
        };
      }

      flash.daily_deck_status[selectedDeck.id] = {
        ...(flash.daily_deck_status[selectedDeck.id] || {}),
        deck_id: selectedDeck.id,
        deck_name: selectedDeck.name,
        last_completed_date: day,
        last_completed_at: finishedAt,
        completed_today: true,
        last_total_cards: Number(resultsPayload?.total_cards || 0),
        last_summary: nextResults.summary || {},
        focus_ids: focusIds,
      };

      progress.modules.flashcards.active_deck_id = selectedDeck.id;
      progress.modules.flashcards.session = { completed: true, completed_day: day };
      progress.modules.flashcards.last_results = nextResults;
      return progress;
    });
  };

  const handleBackToTrail = async () => {
    setView("trail");
    await persistFlashcards((progress) => {
      progress.modules.flashcards.last_results = null;
      return progress;
    });
  };

  if (loading) {
    return (
      <section className="flash-shell" style={{ "--flash-theme": color }}>
        <div className="flash-loading">Carregando flashcards...</div>
      </section>
    );
  }

  if (view === "session") {
    return (
      <FlashcardSession
        deck={persistedDeck}
        deckId={selectedDeck.id}
        deckName={selectedDeck.name}
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
        deckName={selectedDeck.name}
        color={color}
        onBack={handleBackToTrail}
      />
    );
  }

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
          Voltar
        </button>
        <div className="flash-header-content">
          <div className="flash-kicker">FLASHCARDS</div>
          <h1>Revisao por trilha</h1>
        </div>
        <ModuleGuideButton moduleKey="flashcards" color={color} />
      </div>

      <div className="flash-trail">
        {DECKS.map((deck, index) => {
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
          if (!isDoneToday && hasOpenSession && deck.id === inProgressDeckId) badgeLabel = "COMECAR";
          else if (!isDoneToday && !hasInProgressSession && isNextDeck && canStart) badgeLabel = "COMECAR";

          const isLast = index === DECKS.length - 1;

          return (
            <TrailNode
              key={deck.id}
              deck={deck}
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
            />
          );
        })}
      </div>
    </section>
  );
}










