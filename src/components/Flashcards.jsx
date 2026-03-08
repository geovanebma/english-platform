import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CreditCard, Lock } from "lucide-react";
import { A1_FLASHCARDS } from "../data/flashcardsData";
import FlashcardSession from "./FlashcardSession";
import SessionResults from "./FlashcardsSessionResults";

const DECKS = [
  { id: "A1", name: "Saudacoes e introducoes", data: A1_FLASHCARDS, available: true },
  { id: "A2", name: "Conversas do dia a dia", data: [], available: false },
  { id: "B1", name: "Revisao de contexto", data: [], available: false },
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
    };
  }
  if (!base.modules.flashcards.srs_cards) {
    base.modules.flashcards.srs_cards = {};
  }
  return base;
}

function TrailNode({ deck, index, isUnlocked, isActive, isCompleted, onClick, themeColor }) {
  const offsetClass = index % 2 === 0 ? "offset-left" : "offset-right";
  return (
    <div className={`flash-trail-node-row ${offsetClass}`}>
      <button
        type="button"
        className={`flash-trail-node ${isUnlocked ? "is-open" : "is-locked"} ${isActive ? "is-active" : ""} ${isCompleted ? "is-complete" : ""}`}
        onClick={() => isUnlocked && onClick(deck)}
        disabled={!isUnlocked}
        style={{
          "--flash-theme": themeColor,
          "--flash-theme-shadow": darken(themeColor, 28),
        }}
      >
        <span className="flash-node-icon">
          {isUnlocked ? (isCompleted ? <Check size={21} /> : <CreditCard size={21} />) : <Lock size={21} />}
        </span>
        {isActive ? <span className="flash-node-badge">COMECAR</span> : null}
      </button>
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
        // Mantem estado salvo, mas abre sempre na trilha para o usuario escolher o deck.
        if (flash?.session && flash.session.completed !== true) {
          setSessionState(flash.session);
        } else if (flash?.last_results) {
          setSessionResults(flash.last_results);
        }
      } catch {
        // no-op: fallback local state
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
    await writeProgress(next);
  };

  const startDeck = async (deck) => {
    const canResume =
      sessionState &&
      sessionState.completed !== true &&
      sessionState.deck_id === deck.id &&
      Array.isArray(sessionState.card_order) &&
      sessionState.card_order.length > 0;
    const progressSnapshot = ensureFlashcardsModule(await readProgress());
    const session = canResume
      ? {
          ...sessionState,
          updated_at: new Date().toISOString(),
        }
      : {
          deck_id: deck.id,
          card_order: buildSrsOrder(deck.data, deck.id, progressSnapshot.modules.flashcards.srs_cards),
          current_index: 0,
          is_flipped: false,
          answers: [],
          completed: false,
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
    const nextResults = {
      ...resultsPayload,
      deck_id: selectedDeck.id,
      deck_name: selectedDeck.name,
      finished_at: new Date().toISOString(),
      completed: true,
    };
    setSessionResults(nextResults);
    setView("results");
    setSessionState(null);

    await persistFlashcards((progress) => {
      const flash = progress.modules.flashcards;
      const answers = Array.isArray(resultsPayload?.answers) ? resultsPayload.answers : [];
      const reviewedAt = nextResults.finished_at;
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
          ...computeSrsUpdate(prevEntry, rating, reviewedAt),
        };
      }
      progress.modules.flashcards.active_deck_id = selectedDeck.id;
      progress.modules.flashcards.session = { completed: true };
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
      </div>

      <div className="flash-trail">
        {DECKS.map((deck, index) => {
          const isUnlocked = index === 0 || DECKS[index - 1].available;
          const isCompleted = Boolean(
            sessionResults?.deck_id === deck.id &&
              Array.isArray(sessionResults?.answers) &&
              sessionResults.answers.length > 0
          );
          const isActive = deck.id === selectedDeck.id && deck.available;
          return (
            <TrailNode
              key={deck.id}
              deck={deck}
              index={index}
              isUnlocked={isUnlocked && deck.available}
              isActive={isActive}
              isCompleted={isCompleted}
              onClick={startDeck}
              themeColor={color}
            />
          );
        })}
      </div>
    </section>
  );
}
