import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, Volume2 } from "lucide-react";

const RATINGS = [
  { key: "easy", labelKey: "flash.rate.easy", fallback: "Easy" },
  { key: "good", labelKey: "flash.rate.good", fallback: "Good" },
  { key: "hard", labelKey: "flash.rate.hard", fallback: "Hard" },
  { key: "again", labelKey: "flash.rate.again", fallback: "Again" },
];

function speakText(text, lang = "en-US", rate = 1) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = rate;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export default function FlashcardSession({
  deck,
  deckId = "A1",
  deckName,
  srsCards = {},
  onSessionComplete,
  onProgress,
  onExit,
  initialSession,
  color = "#096105",
}) {
  const [currentIndex, setCurrentIndex] = useState(initialSession?.current_index ?? 0);
  const [isFlipped, setIsFlipped] = useState(Boolean(initialSession?.is_flipped));
  const [answers, setAnswers] = useState(initialSession?.answers || []);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [sourceLanguage, setSourceLanguage] = useState("pt-BR");
  const [learningLanguage, setLearningLanguage] = useState("en-US");
  const lastProgressSnapshotRef = useRef("");
  const startedAtRef = useRef(initialSession?.started_at || new Date().toISOString());

  const currentCard = deck[currentIndex];
  const total = deck.length || 1;
  const progress = ((currentIndex + 1) / total) * 100;
  const currentSrsEntry = currentCard ? srsCards?.[`${deckId}:${currentCard.id}`] : null;

  const mastery = useMemo(() => {
    if (!currentSrsEntry) {
      return {
        label: getUiLabel("flash.mastery.new", "New card"),
        tone: "new",
        note: getUiLabel("flash.mastery.new_note", "No history yet."),
      };
    }
    const srsState = currentSrsEntry?.srs_state || "review";
    const difficulty = Number(currentSrsEntry?.difficulty || 0);
    const lapses = Number(currentSrsEntry?.lapses || 0);
    const reviews = Number(currentSrsEntry?.reviews || 0);
    const stability = Number(currentSrsEntry?.stability_days || 0);
    const nextStepMinutes = Number(currentSrsEntry?.next_step_minutes || 0);
    if (srsState === "learning") {
      return {
        label: getUiLabel("flash.mastery.learning", "Learning"),
        tone: "mid",
        note: nextStepMinutes
          ? getUiLabel("flash.mastery.learning_note", "Next step in {minutes} min.").replace("{minutes}", String(nextStepMinutes))
          : getUiLabel("flash.mastery.learning_short", "Still in short learning steps."),
      };
    }
    if (srsState === "relearning") {
      return {
        label: getUiLabel("flash.mastery.relearning", "Active reinforcement"),
        tone: "fragile",
        note: nextStepMinutes
          ? getUiLabel("flash.mastery.relearning_note", "Returns in {minutes} min if missed again.").replace("{minutes}", String(nextStepMinutes))
          : getUiLabel("flash.mastery.relearning_short", "Card returned to relearning."),
      };
    }
    if (lapses >= 2 || difficulty >= 7.4) {
      return {
        label: getUiLabel("flash.mastery.fragile", "Fragile"),
        tone: "fragile",
        note: getUiLabel("flash.mastery.fragile_note", "{count} reviews, needs reinforcement.").replace("{count}", String(reviews)),
      };
    }
    if (stability >= 5 && difficulty <= 5.4) {
      return {
        label: getUiLabel("flash.mastery.mastered", "Mastered"),
        tone: "strong",
        note: getUiLabel("flash.mastery.mastered_note", "{count} reviews, good stability.").replace("{count}", String(reviews)),
      };
    }
    return {
      label: getUiLabel("flash.mastery.consolidating", "Consolidating"),
      tone: "mid",
      note: getUiLabel("flash.mastery.consolidating_note", "{count} reviews, keeping the pace.").replace("{count}", String(reviews)),
    };
  }, [currentSrsEntry]);

  useEffect(() => {
    const progressPayload = {
      deck_id: initialSession?.deck_id || deckId,
      started_at: startedAtRef.current,
      card_order: deck.map((c) => c.id),
      current_index: currentIndex,
      is_flipped: isFlipped,
      answers,
      completed: false,
    };

    const snapshot = JSON.stringify(progressPayload);
    if (lastProgressSnapshotRef.current === snapshot) return;
    lastProgressSnapshotRef.current = snapshot;

    onProgress?.({
      ...progressPayload,
      updated_at: new Date().toISOString(),
    });
  }, [answers, currentIndex, deck, deckId, initialSession?.deck_id, isFlipped]);

  useEffect(() => {
    if (!window.speechSynthesis) return undefined;
    window.speechSynthesis.cancel();
    return () => window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/progress");
        if (!res.ok) return;
        const progress = await res.json();
        if (!mounted) return;
        setSourceLanguage(progress?.languages?.source_language || "pt-BR");
        setLearningLanguage(progress?.languages?.learning_language || "en-US");
      } catch {
        // fallback defaults
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Autoplay: sempre que iniciar a sessao ou avancar para o proximo card, fala a frente em ingles.
  useEffect(() => {
    if (!currentCard?.front) return;
    const timer = window.setTimeout(() => {
      speakText(currentCard.front, learningLanguage, playbackRate);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [currentIndex, currentCard?.front, learningLanguage, playbackRate]);

  const summary = useMemo(
    () =>
      answers.reduce((acc, answer) => {
        acc[answer.rating] = (acc[answer.rating] || 0) + 1;
        return acc;
      }, {}),
    [answers]
  );

  const handleRate = (rating) => {
    const nextAnswers = [...answers, { cardId: currentCard.id, rating }];
    if (currentIndex >= total - 1) {
      onSessionComplete({
        answers: nextAnswers,
        total_cards: total,
        summary: {
          easy: summary.easy || 0,
          good: summary.good || 0,
          hard: summary.hard || 0,
          again: summary.again || 0,
          [rating]: (summary[rating] || 0) + 1,
        },
      });
      return;
    }
    setAnswers(nextAnswers);
    setCurrentIndex((prev) => prev + 1);
    setIsFlipped(false);
  };

  const toggleSpeed = () => {
    const next = playbackRate >= 1.5 ? 0.75 : Number((playbackRate + 0.25).toFixed(2));
    setPlaybackRate(next);
    const text = isFlipped ? currentCard?.back : currentCard?.front;
    const lang = isFlipped ? sourceLanguage : learningLanguage;
    if (text) speakText(text, lang, next);
  };

  if (!currentCard) return null;

  return (
    <section
      className="flash-session-shell"
      style={{
        "--flash-theme": color,
        "--flash-theme-shadow": "color-mix(in srgb, var(--flash-theme) 68%, #000 32%)",
      }}
    >
      <header className="flash-session-topbar">
        <button type="button" className="duo-back-btn" onClick={onExit}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <h1>{deckName}</h1>
        <button type="button" className="duo-back-btn" onClick={onExit}>
          {getUiLabel("flash.exit", "Exit")}
        </button>
      </header>

      <div className="flash-session-progress-wrap">
        <span>{Math.round(progress)}%</span>
        <div className="flash-session-progress">
          <div className="flash-session-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>
          {currentIndex + 1}/{total}
        </span>
      </div>

        <div className="flash-card-stage">
          <div
            className={`flash-card-3d ${isFlipped ? "is-flipped" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => setIsFlipped((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsFlipped((prev) => !prev);
              }
            }}
          >
          <div className="flash-card-face flash-card-front">
            <div className="flash-card-face-head">
              <div className="flash-card-face-kicker">{getUiLabel("flash.face.front", "Front")}</div>
              <div className={`flash-card-mastery is-${mastery.tone}`}>
                <strong>{mastery.label}</strong>
                <span>{mastery.note}</span>
              </div>
            </div>
            <div className="flash-card-main">{currentCard.front}</div>
            <div className="flash-card-controls">
              <button
                type="button"
                className="flash-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(currentCard.front, learningLanguage, playbackRate);
                }}
                aria-label={getUiLabel("flash.listen_front", "Listen to front")}
              >
                <Volume2 size={22} />
              </button>
              <button
                type="button"
                className="flash-speed-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSpeed();
                }}
              >
                {playbackRate.toFixed(2)}x
              </button>
            </div>
          </div>

          <div className="flash-card-face flash-card-back">
            <div className="flash-card-face-head">
              <div className="flash-card-face-kicker">{getUiLabel("flash.face.back", "Back")}</div>
              <div className={`flash-card-mastery is-${mastery.tone}`}>
                <strong>{mastery.label}</strong>
                <span>{mastery.note}</span>
              </div>
            </div>
            <div className="flash-card-main">{currentCard.back}</div>
            <div className="flash-card-controls">
              <button
                type="button"
                className="flash-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(currentCard.back, sourceLanguage, playbackRate);
                }}
                aria-label={getUiLabel("flash.listen_back", "Listen to translation")}
              >
                <Volume2 size={22} />
              </button>
                <button
                  type="button"
                  className="flash-speed-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSpeed();
                  }}
                >
                  {playbackRate.toFixed(2)}x
                </button>
              </div>
            </div>
          </div>
        </div>

      {isFlipped ? (
        <div className="flash-rate-row">
          {RATINGS.map((rating) => (
            <button key={rating.key} type="button" className="flash-rate-btn" onClick={() => handleRate(rating.key)}>
              {getUiLabel(rating.labelKey, rating.fallback)}
            </button>
          ))}
        </div>
      ) : (
        <div className="flash-tap-hint">{getUiLabel("flash.tap_flip", "Tap the card to flip")}</div>
      )}
    </section>
  );
}



