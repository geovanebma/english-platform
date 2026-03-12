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

function buildSrsOrder(deck, deckId, srsCards = {}) {
  const now = Date.now();
  const withMeta = deck.map((card) => {
    const key = `${deckId}:${card.id}`;
    const entry = srsCards[key];
    const dueAt = toTimestamp(entry?.due_at);
    const reviews = Number(entry?.reviews || 0);
    const isSeen = reviews > 0;
    const isDue = isSeen && dueAt <= now;
    return { card, dueAt, reviews, isSeen, isDue };
  });

  const dueCards = withMeta
    .filter((item) => item.isDue)
    .sort((a, b) => a.dueAt - b.dueAt || a.reviews - b.reviews);
  const unseenCards = withMeta.filter((item) => !item.isSeen);
  const laterCards = withMeta
    .filter((item) => item.isSeen && !item.isDue)
    .sort((a, b) => a.dueAt - b.dueAt);

  return [...dueCards, ...unseenCards, ...laterCards].map((item) => item.card.id);
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
  const prevInterval = Math.max(0, Number(prevEntry?.interval_days || 0));
  const prevReviews = Number(prevEntry?.reviews || 0);
  const prevLapses = Number(prevEntry?.lapses || 0);

  let nextEase = prevEase;
  let nextInterval = prevInterval;

  if (rating === "again") {
    nextEase = Math.max(1.3, prevEase - 0.2);
    nextInterval = 0.5;
  } else if (rating === "hard") {
    nextEase = Math.max(1.3, prevEase - 0.1);
    nextInterval = prevInterval <= 0 ? 1 : Math.max(1, Math.round(prevInterval * 1.2));
  } else if (rating === "good") {
    nextEase = Math.min(2.8, prevEase + 0.05);
    nextInterval = prevInterval <= 0 ? 2 : Math.max(1, Math.round(prevInterval * nextEase));
  } else {
    nextEase = Math.min(3.0, prevEase + 0.15);
    nextInterval = prevInterval <= 0 ? 4 : Math.max(2, Math.round(prevInterval * (nextEase + 0.2)));
  }

  const dueAt = new Date(reviewedAt + nextInterval * 24 * 60 * 60 * 1000).toISOString();
  return {
    ease: Number(nextEase.toFixed(2)),
    interval_days: Number(nextInterval.toFixed(2)),
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
      finished_at: finishedAt,
      completed: true,
      completed_day: day,
      focus_cards_count: focusIds.length,
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











