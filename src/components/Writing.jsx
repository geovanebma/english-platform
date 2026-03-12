import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const WRITING_EXERCISES = [
  {
    id: "w1",
    type: "build",
    level: 1,
    title: "Basic sentence order",
    instruction: "Build a correct sentence with the words below.",
    words: ["I", "go", "to", "work", "by", "bus", "every", "day"],
    answer: "I go to work by bus every day",
    tip: "Use subject + verb + complement order.",
  },
  {
    id: "w2",
    type: "correct",
    level: 2,
    title: "Present simple fix",
    instruction: "Correct the sentence with grammar error.",
    sentenceWithError: "She go to school every morning.",
    answer: "She goes to school every morning.",
    tip: "Use -s in third person singular.",
  },
  {
    id: "w3",
    type: "improve",
    level: 3,
    title: "Vocabulary upgrade",
    instruction: "Rewrite with better vocabulary, same meaning.",
    baseSentence: "The movie was very good and the actors were very good too.",
    answerContains: ["excellent", "performance"],
    sampleBetter: "The movie was excellent, and the actors delivered an excellent performance.",
    tip: "Replace repeated words with precise terms.",
  },
  {
    id: "w4",
    type: "build",
    level: 4,
    title: "Past routine",
    instruction: "Build the sentence in the past.",
    words: ["We", "visited", "our", "grandparents", "last", "weekend"],
    answer: "We visited our grandparents last weekend",
    tip: "Use the past form for finished actions.",
  },
  {
    id: "w5",
    type: "correct",
    level: 5,
    title: "Perfect tense",
    instruction: "Correct the sentence.",
    sentenceWithError: "I have went to the market already.",
    answer: "I have gone to the market already.",
    tip: "In present perfect, use gone as past participle.",
  },
  {
    id: "w6",
    type: "improve",
    level: 6,
    title: "Professional phrasing",
    instruction: "Rewrite in a more professional style.",
    baseSentence: "I need help to finish this thing fast.",
    answerContains: ["assistance", "task"],
    sampleBetter: "I need assistance to complete this task quickly.",
    tip: "Choose formal words: assistance, complete, task.",
  },
];

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureWriting(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.writing) {
    data.modules.writing = {
      completed_exercises: [],
      current_level: 1,
      best_score: 0,
      attempts: 0,
      last_feedback: "",
    };
  }
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to read progress");
  const parsed = await res.json();
  return ensureWriting(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Failed to save progress");
  const parsed = await res.json();
  return ensureWriting(parsed);
}

function validateAnswer(exercise, input) {
  const text = input.trim();
  if (!text) return { correct: false, explanation: "Type an answer before checking." };

  if (exercise.type === "build" || exercise.type === "correct") {
    const ok = normalize(text) === normalize(exercise.answer);
    return {
      correct: ok,
      explanation: ok
        ? "Correct structure. Good writing flow."
        : `Review order and agreement. Expected example: "${exercise.answer}".`,
    };
  }

  if (exercise.type === "improve") {
    const normalized = normalize(text);
    const required = (exercise.answerContains || []).every((w) => normalized.includes(normalize(w)));
    return {
      correct: required,
      explanation: required
        ? "Nice upgrade in vocabulary and context."
        : `Try stronger vocabulary. Example: "${exercise.sampleBetter}".`,
    };
  }

  return { correct: false, explanation: "Invalid exercise type." };
}

function WritingTrailNode({ item, index, unlocked, active, completed, onOpen, color }) {
  const isLast = index === WRITING_EXERCISES.length - 1;
  const iconSrc = isLast
    ? "/img/icons/trofeu.svg"
    : completed
      ? "/img/icons/check.svg"
      : active && unlocked
        ? "/img/icons/haltere.svg"
        : unlocked
          ? "/img/icons/estrela.svg"
          : "/img/icons/haltere.svg";

  const offsetClass = index % 2 === 0 ? "offset-left" : "offset-right";

  return (
    <div className={`writing-node-row ${offsetClass}`}>
      <div className={`writing-node-ring ${active && unlocked ? "is-active" : ""}`}>
        <button
          type="button"
          className={`writing-node-btn ${unlocked ? "is-open" : "is-locked"} ${completed ? "is-complete" : ""} ${active ? "is-active" : ""}`}
          disabled={!unlocked}
          onClick={() => unlocked && onOpen(index)}
          style={{
            "--writing-theme": color,
            "--writing-theme-shadow": "color-mix(in srgb, " + color + " 62%, #000 38%)",
          }}
          title={item.title}
          aria-label={item.title}
        >
          {active && unlocked ? (
            <div className="writing-tooltip-parent" aria-hidden="true">
              <div className="writing-tooltip">COMECAR</div>
            </div>
          ) : null}
          <span className="writing-node-icon">
            <img src={iconSrc} alt="" className="writing-node-imgicon" />
          </span>
        </button>
      </div>
      <div className="writing-node-title">{item.title}</div>
    </div>
  );
}

export default function Writing({ setCurrentView, color = "#085163" }) {
  const [view, setView] = useState("trail");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [bestScore, setBestScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;

        const block = progress.modules.writing;
        const completedSet = new Set(block.completed_exercises || []);
        setCompleted(completedSet);
        setBestScore(Number(block.best_score || 0));
        setAttempts(Number(block.attempts || 0));
        setCurrentLevel(Number(block.current_level || 1));

        const firstPending = WRITING_EXERCISES.findIndex((e) => !completedSet.has(e.id));
        setIndex(firstPending >= 0 ? firstPending : WRITING_EXERCISES.length - 1);
      } catch {
        // no-op
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const exercise = WRITING_EXERCISES[index];
  const total = WRITING_EXERCISES.length;
  const doneCount = completed.size;
  const progressPercent = Math.round((doneCount / total) * 100);

  const unlockedIndex = useMemo(() => {
    const firstPending = WRITING_EXERCISES.findIndex((e) => !completed.has(e.id));
    if (firstPending === -1) return total - 1;
    return firstPending;
  }, [completed, total]);

  const submit = async () => {
    const result = validateAnswer(exercise, answer);
    setFeedback(result);

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    const nextCompleted = new Set(completed);
    if (result.correct) nextCompleted.add(exercise.id);
    setCompleted(nextCompleted);

    const nextScore = Math.round((nextCompleted.size / total) * 100);
    const nextBestScore = Math.max(bestScore, nextScore);
    setBestScore(nextBestScore);

    const highestDoneLevel = WRITING_EXERCISES.reduce((acc, ex) => {
      if (nextCompleted.has(ex.id)) return Math.max(acc, ex.level);
      return acc;
    }, 1);
    const nextLevel = Math.min(total, highestDoneLevel + 1);
    setCurrentLevel(nextLevel);

    try {
      const progress = await readProgress();
      progress.modules.writing = {
        completed_exercises: [...nextCompleted],
        current_level: nextLevel,
        best_score: nextBestScore,
        attempts: nextAttempts,
        last_feedback: result.explanation,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  const goNext = () => {
    const next = Math.min(total - 1, index + 1);
    setIndex(next);
    setAnswer("");
    setFeedback(null);
  };

  const goPrev = () => {
    const prev = Math.max(0, index - 1);
    setIndex(prev);
    setAnswer("");
    setFeedback(null);
  };

  return (
    <section className="writing-page-shell" style={{ "--writing-theme": color }}>
      <header className="writing-header-card">
        <button
          type="button"
          className="duo-back-btn"
          onClick={() => {
            if (view === "exercise") {
              setView("trail");
              return;
            }
            setCurrentView("initial");
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div className="writing-header-main">
          <div className="writing-kicker">A1 - WRITING TRAIL</div>
          <h1>Current writing content: A1</h1>
        </div>
              <ModuleGuideButton moduleKey="writing" color={color} />
</header>

      {view === "trail" ? (
        <>
          <div className="writing-trail-summary">Progress: {doneCount}/{total} exercises completed</div>
          <div className="writing-trail">
            {WRITING_EXERCISES.map((item, nodeIndex) => {
              const unlocked = nodeIndex <= unlockedIndex;
              const completedNode = completed.has(item.id);
              const active = nodeIndex === unlockedIndex;

              return (
                <WritingTrailNode
                  key={item.id}
                  item={item}
                  index={nodeIndex}
                  unlocked={unlocked}
                  active={active}
                  completed={completedNode}
                  onOpen={(i) => {
                    setIndex(i);
                    setAnswer("");
                    setFeedback(null);
                    setView("exercise");
                  }}
                  color={color}
                />
              );
            })}
          </div>
        </>
      ) : (
        <article className="writing-card">
          <div className="writing-progress-wrap">
            <div className="writing-progress-track">
              <div className="writing-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span>
              {doneCount}/{total}
            </span>
          </div>

          <div className="writing-meta">
            <span>Level {exercise.level}</span>
            <span>Best: {bestScore}%</span>
            <span>Current: {currentLevel}</span>
            <span>Attempts: {attempts}</span>
          </div>

          <h2>{exercise.title}</h2>
          <p>{exercise.instruction}</p>

          {exercise.type === "build" && (
            <div className="writing-helper-box">
              {exercise.words.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
          )}

          {exercise.type === "correct" && (
            <div className="writing-helper-box">
              <span>{exercise.sentenceWithError}</span>
            </div>
          )}

          {exercise.type === "improve" && (
            <div className="writing-helper-box">
              <span>{exercise.baseSentence}</span>
            </div>
          )}

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer..."
          />

          {feedback && (
            <div className={`writing-feedback ${feedback.correct ? "is-ok" : "is-bad"}`}>
              {feedback.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span>{feedback.explanation}</span>
            </div>
          )}

          <div className="writing-tip">Tip: {exercise.tip}</div>

          <div className="writing-actions">
            <button type="button" className="writing-secondary-btn" onClick={goPrev} disabled={index === 0}>
              Previous
            </button>
            <button type="button" className="writing-primary-btn" onClick={submit}>
              Check
            </button>
            <button type="button" className="writing-secondary-btn" onClick={goNext} disabled={index === total - 1}>
              Next
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
