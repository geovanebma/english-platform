import React, { useEffect, useMemo, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, CheckCircle2, XCircle, Sparkles, BrainCircuit } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const AI_ENDPOINT = import.meta.env.VITE_TRANSLATION_API_URL || "";

const TRANSLATION_ITEMS = [
  { id: "t1", level: 1, from: "en", source: "Good morning", target: "Bom dia", accepted: ["Bom dia!"], notes: ["greeting"] },
  {
    id: "t2",
    level: 1,
    from: "pt",
    source: "Boa noite",
    target: "Good evening",
    accepted: ["Good night"],
    contextHint: "Both 'good evening' and 'good night' can be correct depending on context.",
    notes: ["greeting", "contextual"],
  },
  { id: "t3", level: 1, from: "en", source: "I am ready", target: "Eu estou pronto", accepted: ["Estou pronto", "Eu to pronto"], notes: ["state"] },
  { id: "t4", level: 2, from: "pt", source: "Eu preciso de ajuda", target: "I need help", accepted: ["I need some help", "I need your help"], notes: ["need"] },
  { id: "t5", level: 2, from: "en", source: "She studies every day", target: "Ela estuda todos os dias", accepted: ["Ela estuda diariamente"], notes: ["routine"] },
  { id: "t6", level: 2, from: "pt", source: "Nos chegamos cedo", target: "We arrived early", accepted: ["We got here early", "We came early"], notes: ["past"] },
  {
    id: "t7",
    level: 3,
    from: "en",
    source: "Could you explain this sentence?",
    target: "Voce poderia explicar esta frase?",
    accepted: ["Voce pode explicar esta frase?", "Poderia explicar essa frase?"],
    notes: ["polite request"],
  },
  { id: "t8", level: 3, from: "pt", source: "Eu vou confirmar os detalhes depois", target: "I will confirm the details later", accepted: ["I'll confirm the details later"], notes: ["future"] },
  { id: "t9", level: 3, from: "en", source: "Their presentation was very clear", target: "A apresentacao deles foi muito clara", accepted: ["A apresentacao deles estava muito clara"], notes: ["work"] },
  {
    id: "t10",
    level: 4,
    from: "pt",
    source: "Apesar do atraso, terminamos o projeto",
    target: "Despite the delay, we finished the project",
    accepted: ["In spite of the delay, we finished the project"],
    notes: ["connector", "work"],
  },
  {
    id: "t11",
    level: 4,
    from: "en",
    source: "He suggested a more efficient approach",
    target: "Ele sugeriu uma abordagem mais eficiente",
    accepted: ["Ele sugeriu uma forma mais eficiente de abordar"],
    notes: ["work", "vocabulary"],
  },
  {
    id: "t12",
    level: 4,
    from: "pt",
    source: "A reuniao foi adiada para amanha",
    target: "The meeting was postponed until tomorrow",
    accepted: ["The meeting was postponed to tomorrow", "The meeting got postponed until tomorrow"],
    notes: ["work", "passive"],
  },
  {
    id: "t13",
    level: 5,
    from: "en",
    source: "I would rather wait for a clearer answer",
    target: "Eu preferiria esperar por uma resposta mais clara",
    accepted: ["Eu prefiro esperar por uma resposta mais clara", "Eu preferia esperar por uma resposta mais clara"],
    notes: ["preference", "clarity"],
  },
  {
    id: "t14",
    level: 5,
    from: "pt",
    source: "Se eu tivesse mais tempo, revisaria tudo de novo",
    target: "If I had more time, I would review everything again",
    accepted: ["If I had more time, I'd review everything again"],
    notes: ["conditional"],
  },
  {
    id: "t15",
    level: 5,
    from: "en",
    source: "Her explanation made the process less confusing",
    target: "A explicacao dela tornou o processo menos confuso",
    accepted: ["A explicacao dela deixou o processo menos confuso"],
    notes: ["cause effect"],
  },
  {
    id: "t16",
    level: 6,
    from: "pt",
    source: "Embora os resultados parecam bons, precisamos validar os dados",
    target: "Although the results seem good, we need to validate the data",
    accepted: ["Even though the results seem good, we need to validate the data"],
    notes: ["academic", "connector"],
  },
  {
    id: "t17",
    level: 6,
    from: "en",
    source: "They handled the conflict with unusual maturity",
    target: "Eles lidaram com o conflito com maturidade incomum",
    accepted: ["Eles resolveram o conflito com maturidade incomum"],
    notes: ["nuance", "vocabulary"],
  },
  {
    id: "t18",
    level: 6,
    from: "pt",
    source: "Nao faz sentido insistir sem entender o contexto",
    target: "It makes no sense to insist without understanding the context",
    accepted: ["There is no point in insisting without understanding the context"],
    notes: ["context", "logic"],
  },
];

const SEMANTIC_GROUPS = {
  "good evening": ["good night"],
  postponed: ["put off", "delayed"],
  validate: ["check", "confirm"],
  clear: ["clearer", "easy to understand"],
  help: ["assistance", "support"],
};

const TRANSLATION_NOTE_KEYS = {
  greeting: "translation.note.greeting",
  contextual: "translation.note.contextual",
  state: "translation.note.state",
  need: "translation.note.need",
  routine: "translation.note.routine",
  past: "translation.note.past",
  "polite request": "translation.note.polite_request",
  future: "translation.note.future",
  work: "translation.note.work",
  connector: "translation.note.connector",
  passive: "translation.note.passive",
  preference: "translation.note.preference",
  clarity: "translation.note.clarity",
  conditional: "translation.note.conditional",
  "cause effect": "translation.note.cause_effect",
  academic: "translation.note.academic",
  nuance: "translation.note.nuance",
  vocabulary: "translation.note.vocabulary",
  context: "translation.note.context",
  logic: "translation.note.logic",
};

function normalizeBase(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/["'`´]/g, "")
    .replace(/[^\w\s?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandEnglishContractions(text) {
  return text
    .replace(/\bi\s*m\b/g, "i am")
    .replace(/\bwe\s*re\b/g, "we are")
    .replace(/\byou\s*re\b/g, "you are")
    .replace(/\bthey\s*re\b/g, "they are")
    .replace(/\bhe\s*s\b/g, "he is")
    .replace(/\bshe\s*s\b/g, "she is")
    .replace(/\bit\s*s\b/g, "it is")
    .replace(/\bthat\s*s\b/g, "that is")
    .replace(/\bthere\s*s\b/g, "there is")
    .replace(/\bwhat\s*s\b/g, "what is")
    .replace(/\bwho\s*s\b/g, "who is")
    .replace(/\bdo\s*nt\b/g, "do not")
    .replace(/\bdoes\s*nt\b/g, "does not")
    .replace(/\bdid\s*nt\b/g, "did not")
    .replace(/\bcant\b/g, "can not")
    .replace(/\bwon\s*t\b/g, "will not")
    .replace(/\bshould\s*nt\b/g, "should not")
    .replace(/\bcould\s*nt\b/g, "could not")
    .replace(/\bwould\s*nt\b/g, "would not")
    .replace(/\bhas\s*nt\b/g, "has not")
    .replace(/\bhave\s*nt\b/g, "have not")
    .replace(/\bhad\s*nt\b/g, "had not")
    .replace(/\bll\b/g, " will")
    .replace(/\bve\b/g, " have");
}

function canonicalize(text, lang) {
  let value = normalizeBase(text);
  if (lang === "en") value = expandEnglishContractions(value);
  return value
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\b(o|a|os|as|um|uma|uns|umas)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text) {
  return new Set(text.split(" ").filter(Boolean));
}

function jaccard(a, b) {
  const sa = tokenSet(a);
  const sb = tokenSet(b);
  if (!sa.size && !sb.size) return 1;
  let inter = 0;
  sa.forEach((t) => {
    if (sb.has(t)) inter += 1;
  });
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : inter / union;
}

function semanticBoost(answerNorm, candidateNorm) {
  let boosted = candidateNorm;
  Object.entries(SEMANTIC_GROUPS).forEach(([base, synonyms]) => {
    if (answerNorm.includes(base)) {
      synonyms.forEach((syn) => {
        boosted = boosted.replace(new RegExp(`\\b${syn}\\b`, "g"), base);
      });
    }
  });
  return jaccard(answerNorm, boosted);
}

async function fetchAiValidation(item, answer) {
  if (!AI_ENDPOINT) return null;
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, answer }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.correct !== "boolean") return null;
    return data;
  } catch {
    return null;
  }
}

async function evaluateTranslation(item, input) {
  const answerRaw = (input || "").trim();
  const answerNorm = canonicalize(answerRaw, item.from === "pt" ? "en" : "pt");

  const variants = [item.target, ...(item.accepted || [])];
  const normalizedVariants = variants.map((v) => canonicalize(v, item.from === "pt" ? "en" : "pt"));

  if (normalizedVariants.includes(answerNorm)) {
    return {
      correct: true,
      message: item.contextHint || getUiLabel("translation.feedback.correct", "Correct. Nice translation."),
      acceptedVariants: variants,
      confidence: 1,
    };
  }

  const bestSimilarity = normalizedVariants.reduce((best, candidate) => {
    const sim = Math.max(jaccard(answerNorm, candidate), semanticBoost(answerNorm, candidate));
    return sim > best ? sim : best;
  }, 0);

  if (bestSimilarity >= 0.82) {
    return {
      correct: true,
      message:
        item.contextHint ||
        getUiLabel("translation.feedback.contextual_correct", "Very close and equivalent by context. Considered correct."),
      acceptedVariants: variants,
      confidence: Number(bestSimilarity.toFixed(2)),
    };
  }

  const aiResult = await fetchAiValidation(item, answerRaw);
  if (aiResult) {
    return {
      correct: Boolean(aiResult.correct),
      message:
        aiResult.message ||
        (aiResult.correct
          ? getUiLabel("translation.feedback.accepted_by_ai", "Accepted by contextual analysis.")
          : getUiLabel("translation.feedback.expected_answer", 'Expected answer: "{answer}"').replace("{answer}", item.target)),
      acceptedVariants: Array.isArray(aiResult.acceptedVariants) ? aiResult.acceptedVariants : variants,
      confidence: Number(aiResult.confidence || bestSimilarity || 0),
    };
  }

  return {
    correct: false,
    message: getUiLabel("translation.feedback.expected_answer", 'Expected answer: "{answer}"').replace("{answer}", item.target),
    acceptedVariants: variants,
    confidence: Number(bestSimilarity.toFixed(2)),
  };
}

function getDirectionLabel(from) {
  return from === "en"
    ? getUiLabel("translation.direction.en_to_pt", "EN -> PT")
    : getUiLabel("translation.direction.pt_to_en", "PT -> EN");
}

function getNoteLabel(note) {
  const key = TRANSLATION_NOTE_KEYS[note];
  return key ? getUiLabel(key, note) : note;
}

function ensureTranslation(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.translation_practice) {
    data.modules.translation_practice = {
      correct_count: 0,
      wrong_count: 0,
      completed_ids: [],
      current_level: 1,
      total_attempts: 0,
      last_item_id: null,
      ai_validation_enabled: Boolean(AI_ENDPOINT),
      level_stats: {},
    };
  }
  if (typeof data.modules.translation_practice.ai_validation_enabled !== "boolean") {
    data.modules.translation_practice.ai_validation_enabled = Boolean(AI_ENDPOINT);
  }
  if (!data.modules.translation_practice.level_stats) data.modules.translation_practice.level_stats = {};
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to read progress");
  const parsed = await res.json();
  return ensureTranslation(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Failed to save progress");
  const parsed = await res.json();
  return ensureTranslation(parsed);
}

function TranslationTrailNode({ item, index, unlocked, active, completed, onOpen, color }) {
  const isLast = index === TRANSLATION_ITEMS.length - 1;
  const iconLabel = isLast ? "T" : completed ? "OK" : active && unlocked ? "GO" : unlocked ? "LV" : "..";
  const offsetClass = index % 2 === 0 ? "offset-left" : "offset-right";

  return (
    <div className={`translation-node-row ${offsetClass}`}>
      <div className={`translation-node-ring ${active && unlocked ? "is-active" : ""}`}>
        <button
          type="button"
          className={`translation-node-btn ${unlocked ? "is-open" : "is-locked"} ${completed ? "is-complete" : ""} ${active ? "is-active" : ""}`}
          disabled={!unlocked}
          onClick={() => unlocked && onOpen(index)}
          style={{
            "--translation-theme": color,
            "--translation-theme-shadow": "color-mix(in srgb, " + color + " 62%, #000 38%)",
          }}
          title={item.source}
          aria-label={item.source}
        >
          {active && unlocked ? (
            <div className="translation-tooltip-parent" aria-hidden="true">
              <div className="translation-tooltip">{getUiLabel("translation.start", "START")}</div>
            </div>
          ) : null}
          <span className="translation-node-icon translation-node-letter">{iconLabel}</span>
        </button>
      </div>
      <div className="translation-node-title">{item.source}</div>
    </div>
  );
}

export default function TranslationPractice({ setCurrentView, color = "#573a22" }) {
  const [view, setView] = useState("trail");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [currentLevel, setCurrentLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [aiValidationEnabled, setAiValidationEnabled] = useState(Boolean(AI_ENDPOINT));
  const [levelStats, setLevelStats] = useState({});
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;

        const block = progress.modules.translation_practice;
        setCorrectCount(Number(block.correct_count || 0));
        setWrongCount(Number(block.wrong_count || 0));

        const done = new Set(block.completed_ids || []);
        setCompletedIds(done);
        setCurrentLevel(Number(block.current_level || 1));
        setAiValidationEnabled(Boolean(block.ai_validation_enabled));
        setLevelStats(block.level_stats || {});

        const firstPending = TRANSLATION_ITEMS.findIndex((i) => !done.has(i.id));
        setIndex(firstPending >= 0 ? firstPending : 0);
      } catch {
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const item = TRANSLATION_ITEMS[index];
  const total = TRANSLATION_ITEMS.length;
  const progressPercent = Math.round((completedIds.size / total) * 100);

  const unlockedIndex = useMemo(() => {
    const firstPending = TRANSLATION_ITEMS.findIndex((i) => !completedIds.has(i.id));
    if (firstPending === -1) return total - 1;
    return firstPending;
  }, [completedIds, total]);

  const directionLabel = useMemo(() => getDirectionLabel(item.from), [item]);
  const levelSummary = useMemo(() => {
    const stats = levelStats[item.level] || { total: 0, correct: 0 };
    const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    return { ...stats, accuracy };
  }, [item.level, levelStats]);

  const persistToggle = async (enabled) => {
    try {
      const progress = await readProgress();
      progress.modules.translation_practice = {
        ...progress.modules.translation_practice,
        ai_validation_enabled: enabled,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  const verify = async () => {
    setChecking(true);
    const result = await evaluateTranslation(item, answer);

    const nextCompleted = new Set(completedIds);
    nextCompleted.add(item.id);
    setCompletedIds(nextCompleted);

    const nextCorrect = correctCount + (result.correct ? 1 : 0);
    const nextWrong = wrongCount + (result.correct ? 0 : 1);
    setCorrectCount(nextCorrect);
    setWrongCount(nextWrong);

    const variantsLabel =
      result.acceptedVariants.length > 1
        ? ` ${getUiLabel("translation.feedback.accepted_variants", 'Accepted variants: {variants}')
            .replace("{variants}", result.acceptedVariants.map((v) => `"${v}"`).join(" | "))}`
        : "";

    setFeedback({
      correct: result.correct,
      text: `${result.message}${variantsLabel}`,
      confidence: result.confidence,
    });

    const unlockedLevel = TRANSLATION_ITEMS.reduce((acc, ex) => {
      if (nextCompleted.has(ex.id)) return Math.max(acc, ex.level);
      return acc;
    }, 1);
    const nextLevel = Math.min(6, unlockedLevel + 1);
    setCurrentLevel(nextLevel);

    const nextLevelStats = {
      ...levelStats,
      [item.level]: {
        total: Number(levelStats[item.level]?.total || 0) + 1,
        correct: Number(levelStats[item.level]?.correct || 0) + (result.correct ? 1 : 0),
      },
    };
    setLevelStats(nextLevelStats);

    try {
      const progress = await readProgress();
      progress.modules.translation_practice = {
        correct_count: nextCorrect,
        wrong_count: nextWrong,
        completed_ids: [...nextCompleted],
        current_level: nextLevel,
        total_attempts: Number(progress.modules.translation_practice.total_attempts || 0) + 1,
        last_item_id: item.id,
        ai_validation_enabled: aiValidationEnabled,
        level_stats: nextLevelStats,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    } finally {
      setChecking(false);
    }
  };

  const nextItem = () => {
    setIndex((i) => (i + 1) % total);
    setAnswer("");
    setFeedback(null);
  };

  const prevItem = () => {
    setIndex((i) => (i - 1 + total) % total);
    setAnswer("");
    setFeedback(null);
  };

  return (
    <section className="translation-page-shell" style={{ "--translation-theme": color }}>
      <header className="translation-header-card">
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
          {getUiLabel("common.back", "Back")}
        </button>
        <div className="translation-header-main">
          <div className="translation-kicker">{getUiLabel("translation.kicker", "TRANSLATION TRAIL")}</div>
          <h1>{getUiLabel("translation.current_content", "Current translation content")}: A{Math.min(currentLevel, 6)}</h1>
        </div>
        <ModuleGuideButton moduleKey="translation" color={color} />
      </header>

      {loading ? (
        <div className="translation-empty">{getUiLabel("translation.loading", "Loading...")}</div>
      ) : view === "trail" ? (
        <>
          <div className="translation-trail-summary">{getUiLabel("translation.progress_summary", "Progress: {done}/{total} exercises completed").replace("{done}", completedIds.size).replace("{total}", total)}</div>
          <div className="translation-top-pills">
            <span><Sparkles size={14} /> {getUiLabel("translation.unlocked_level", "Unlocked level")}: {currentLevel}</span>
            <span><BrainCircuit size={14} /> {getUiLabel("translation.contextual_ai", "Contextual AI")}: {aiValidationEnabled ? getUiLabel("flash.toggle.on", "ON") : getUiLabel("flash.toggle.off", "OFF")}</span>
          </div>
          <div className="translation-trail">
            {TRANSLATION_ITEMS.map((trailItem, nodeIndex) => {
              const unlocked = nodeIndex <= unlockedIndex;
              const completedNode = completedIds.has(trailItem.id);
              const active = nodeIndex === unlockedIndex;

              return (
                <TranslationTrailNode
                  key={trailItem.id}
                  item={trailItem}
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
        <article className="translation-card">
          <div className="translation-top-stats">
            <span>{getUiLabel("translation.current_level", "Current level")}: {currentLevel}</span>
            <span>{getUiLabel("translation.correct", "Correct")}: {correctCount}</span>
            <span>{getUiLabel("translation.wrong", "Wrong")}: {wrongCount}</span>
          </div>

          <div className="translation-progress">
            <div className="translation-progress-track">
              <div className="translation-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <strong>{completedIds.size}/{total}</strong>
          </div>

          <div className="translation-ai-toggle-row">
            <button
              type="button"
              className={`translation-ai-toggle ${aiValidationEnabled ? "is-on" : ""}`}
              onClick={() => {
                const next = !aiValidationEnabled;
                setAiValidationEnabled(next);
                void persistToggle(next);
              }}
            >
              {getUiLabel("translation.contextual_ai", "Contextual AI")} {aiValidationEnabled ? getUiLabel("flash.toggle.on", "ON") : getUiLabel("flash.toggle.off", "OFF")}
            </button>
            <span>{getUiLabel("translation.level_accuracy", "Level accuracy")}: {levelSummary.accuracy}%</span>
          </div>

          <div className="translation-question">
            <span className="translation-direction">{directionLabel}</span>
            <p>{item.source}</p>
            <div className="translation-note-row">
              {(item.notes || []).map((note) => (
                <span key={note} className="translation-note-chip">{getNoteLabel(note)}</span>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !feedback) void verify();
            }}
            placeholder={getUiLabel("translation.placeholder", "Type the translation...")}
            disabled={Boolean(feedback)}
          />

          {feedback && (
            <div className={`translation-feedback ${feedback.correct ? "is-ok" : "is-bad"}`}>
              {feedback.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <div>
                <span>{feedback.text}</span>
                <em>{getUiLabel("translation.confidence", "Confidence")}: {Math.round(Number(feedback.confidence || 0) * 100)}%</em>
              </div>
            </div>
          )}

          <div className="translation-actions">
            <button type="button" className="translation-secondary-btn" onClick={prevItem}>
              {getUiLabel("common.previous", "Previous")}
            </button>
            {!feedback ? (
              <button type="button" className="translation-primary-btn" onClick={() => void verify()} disabled={!answer.trim() || checking}>
                {checking ? getUiLabel("translation.checking", "Checking...") : getUiLabel("translation.check", "Check")}
              </button>
            ) : (
              <button type="button" className="translation-primary-btn" onClick={nextItem}>
                {getUiLabel("common.next", "Next")}
              </button>
            )}
          </div>
        </article>
      )}
    </section>
  );
}



