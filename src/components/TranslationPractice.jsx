import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

const TRANSLATION_ITEMS = [
  {
    id: "t1",
    level: 1,
    from: "en",
    source: "Good morning",
    target: "Bom dia",
    accepted: ["Bom dia!"],
  },
  {
    id: "t2",
    level: 1,
    from: "pt",
    source: "Boa noite",
    target: "Good evening",
    accepted: ["Good night"],
    contextHint: "Tanto \"good evening\" quanto \"good night\" podem estar corretos dependendo do contexto.",
  },
  {
    id: "t3",
    level: 1,
    from: "en",
    source: "I am ready",
    target: "Eu estou pronto",
    accepted: ["Estou pronto", "Eu tô pronto"],
  },
  {
    id: "t4",
    level: 2,
    from: "pt",
    source: "Eu preciso de ajuda",
    target: "I need help",
    accepted: ["I need some help", "I need your help"],
  },
  {
    id: "t5",
    level: 2,
    from: "en",
    source: "She studies every day",
    target: "Ela estuda todos os dias",
    accepted: ["Ela estuda diariamente"],
  },
  {
    id: "t6",
    level: 2,
    from: "pt",
    source: "Nós chegamos cedo",
    target: "We arrived early",
    accepted: ["We got here early", "We came early"],
  },
  {
    id: "t7",
    level: 3,
    from: "en",
    source: "Could you explain this sentence?",
    target: "Você poderia explicar esta frase?",
    accepted: ["Você pode explicar esta frase?", "Poderia explicar essa frase?"],
  },
  {
    id: "t8",
    level: 3,
    from: "pt",
    source: "Eu vou confirmar os detalhes depois",
    target: "I will confirm the details later",
    accepted: ["I'll confirm the details later"],
  },
  {
    id: "t9",
    level: 3,
    from: "en",
    source: "Their presentation was very clear",
    target: "A apresentação deles foi muito clara",
    accepted: ["A apresentação deles estava muito clara"],
  },
  {
    id: "t10",
    level: 4,
    from: "pt",
    source: "Apesar do atraso, terminamos o projeto",
    target: "Despite the delay, we finished the project",
    accepted: ["In spite of the delay, we finished the project"],
  },
  {
    id: "t11",
    level: 4,
    from: "en",
    source: "He suggested a more efficient approach",
    target: "Ele sugeriu uma abordagem mais eficiente",
    accepted: ["Ele sugeriu uma forma mais eficiente de abordar"],
  },
  {
    id: "t12",
    level: 4,
    from: "pt",
    source: "A reunião foi adiada para amanhã",
    target: "The meeting was postponed until tomorrow",
    accepted: ["The meeting was postponed to tomorrow", "The meeting got postponed until tomorrow"],
  },
];

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

  value = value
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\b(o|a|os|as|um|uma|uns|umas)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return value;
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

function evaluateTranslation(item, input) {
  const answerRaw = (input || "").trim();
  const answerNorm = canonicalize(answerRaw, item.from === "pt" ? "en" : "pt");

  const variants = [item.target, ...(item.accepted || [])];
  const normalizedVariants = variants.map((v) => canonicalize(v, item.from === "pt" ? "en" : "pt"));

  const exactMatch = normalizedVariants.includes(answerNorm);
  if (exactMatch) {
    return {
      correct: true,
      message: item.contextHint || "Correto! Boa tradução.",
      acceptedVariants: variants,
    };
  }

  const bestSimilarity = normalizedVariants.reduce((best, candidate) => {
    const sim = jaccard(answerNorm, candidate);
    return sim > best ? sim : best;
  }, 0);

  if (bestSimilarity >= 0.82) {
    return {
      correct: true,
      message: "Muito perto e semanticamente equivalente. Considerado correto.",
      acceptedVariants: variants,
    };
  }

  return {
    correct: false,
    message: `Resposta esperada: \"${item.target}\"`,
    acceptedVariants: variants,
  };
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
    };
  }
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureTranslation(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureTranslation(parsed);
}

export default function TranslationPractice({ setCurrentView, color = "#573a22" }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [currentLevel, setCurrentLevel] = useState(1);
  const [loading, setLoading] = useState(true);

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

  const directionLabel = useMemo(() => (item.from === "en" ? "EN -> PT" : "PT -> EN"), [item]);

  const verify = async () => {
    const result = evaluateTranslation(item, answer);

    const nextCompleted = new Set(completedIds);
    nextCompleted.add(item.id);
    setCompletedIds(nextCompleted);

    const nextCorrect = correctCount + (result.correct ? 1 : 0);
    const nextWrong = wrongCount + (result.correct ? 0 : 1);
    setCorrectCount(nextCorrect);
    setWrongCount(nextWrong);

    const variantsLabel = result.acceptedVariants.length > 1
      ? ` Variações aceitas: ${result.acceptedVariants.map((v) => `\"${v}\"`).join(" | ")}`
      : "";

    setFeedback({
      correct: result.correct,
      text: `${result.message}${variantsLabel}`,
    });

    const unlockedLevel = TRANSLATION_ITEMS.reduce((acc, ex) => {
      if (nextCompleted.has(ex.id)) return Math.max(acc, ex.level);
      return acc;
    }, 1);
    const nextLevel = Math.min(4, unlockedLevel + 1);
    setCurrentLevel(nextLevel);

    try {
      const progress = await readProgress();
      progress.modules.translation_practice = {
        correct_count: nextCorrect,
        wrong_count: nextWrong,
        completed_ids: [...nextCompleted],
        current_level: nextLevel,
        total_attempts: Number(progress.modules.translation_practice.total_attempts || 0) + 1,
        last_item_id: item.id,
      };
      await writeProgress(progress);
    } catch {
      // no-op
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
    <section className="translation-shell" style={{ "--translation-theme": color }}>
      <header className="translation-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div>
          <div className="translation-kicker">TRANSLATION PRACTICE</div>
          <h1>Translation</h1>
        </div>
      </header>

      {loading ? (
        <div className="translation-empty">Carregando...</div>
      ) : (
        <article className="translation-card">
          <div className="translation-top-stats">
            <span>Nível atual: {currentLevel}</span>
            <span>Acertos: {correctCount}</span>
            <span>Erros: {wrongCount}</span>
          </div>

          <div className="translation-progress">
            <div className="translation-progress-track">
              <div className="translation-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <strong>{completedIds.size}/{total}</strong>
          </div>

          <div className="translation-question">
            <span className="translation-direction">{directionLabel}</span>
            <p>{item.source}</p>
          </div>

          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !feedback) verify();
            }}
            placeholder="Digite a tradução..."
            disabled={!!feedback}
          />

          {feedback && (
            <div className={`translation-feedback ${feedback.correct ? "is-ok" : "is-bad"}`}>
              {feedback.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="translation-actions">
            <button type="button" className="translation-secondary-btn" onClick={prevItem}>
              Anterior
            </button>
            {!feedback ? (
              <button
                type="button"
                className="translation-primary-btn"
                onClick={verify}
                disabled={!answer.trim()}
              >
                Verificar
              </button>
            ) : (
              <button type="button" className="translation-primary-btn" onClick={nextItem}>
                Próxima
              </button>
            )}
          </div>
        </article>
      )}
    </section>
  );
}
