import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

const WRITING_EXERCISES = [
  {
    id: "w1",
    type: "build",
    level: 1,
    title: "Montar frase",
    instruction: "Monte uma frase correta com as palavras abaixo.",
    words: ["I", "go", "to", "work", "by", "bus", "every", "day"],
    answer: "I go to work by bus every day",
    tip: "Mantenha ordem básica: sujeito + verbo + complemento.",
  },
  {
    id: "w2",
    type: "correct",
    level: 2,
    title: "Corrigir frase",
    instruction: "Corrija a frase com erro gramatical.",
    sentenceWithError: "She go to school every morning.",
    answer: "She goes to school every morning.",
    tip: "No present simple, he/she/it pedem verbo com -s.",
  },
  {
    id: "w3",
    type: "improve",
    level: 3,
    title: "Melhorar vocabulário",
    instruction: "Reescreva a frase com vocabulário melhor, mantendo o sentido.",
    baseSentence: "The movie was very good and the actors were very good too.",
    answerContains: ["excellent", "performance"],
    sampleBetter: "The movie was excellent, and the actors delivered an excellent performance.",
    tip: "Troque repetições por palavras mais específicas.",
  },
  {
    id: "w4",
    type: "build",
    level: 4,
    title: "Montar frase",
    instruction: "Monte a frase no passado.",
    words: ["We", "visited", "our", "grandparents", "last", "weekend"],
    answer: "We visited our grandparents last weekend",
    tip: "Use verbo no passado para ações concluídas.",
  },
  {
    id: "w5",
    type: "correct",
    level: 5,
    title: "Corrigir frase",
    instruction: "Corrija a frase.",
    sentenceWithError: "I have went to the market already.",
    answer: "I have gone to the market already.",
    tip: "No present perfect, use gone (particípio), não went.",
  },
  {
    id: "w6",
    type: "improve",
    level: 6,
    title: "Melhorar vocabulário",
    instruction: "Reescreva com vocabulário mais natural em contexto profissional.",
    baseSentence: "I need help to finish this thing fast.",
    answerContains: ["assistance", "task"],
    sampleBetter: "I need assistance to complete this task quickly.",
    tip: "Use palavras profissionais: assistance, complete, task.",
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
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureWriting(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureWriting(parsed);
}

function validateAnswer(exercise, input) {
  const text = input.trim();
  if (!text) return { correct: false, explanation: "Digite uma resposta para verificar." };

  if (exercise.type === "build" || exercise.type === "correct") {
    const ok = normalize(text) === normalize(exercise.answer);
    return {
      correct: ok,
      explanation: ok
        ? "Estrutura correta. Boa construção de frase."
        : `Revise a ordem e a concordância. Exemplo esperado: "${exercise.answer}".`,
    };
  }

  if (exercise.type === "improve") {
    const normalized = normalize(text);
    const required = (exercise.answerContains || []).every((w) => normalized.includes(normalize(w)));
    return {
      correct: required,
      explanation: required
        ? "Boa melhoria de vocabulário e contexto."
        : `Melhore a frase com vocabulário mais preciso. Exemplo: "${exercise.sampleBetter}".`,
    };
  }

  return { correct: false, explanation: "Tipo de exercício inválido." };
}

export default function Writing({ setCurrentView, color = "#085163" }) {
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

  const levelLabel = useMemo(() => `Nível ${exercise.level}`, [exercise.level]);

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
    setIndex((i) => Math.min(total - 1, i + 1));
    setAnswer("");
    setFeedback(null);
  };

  const goPrev = () => {
    setIndex((i) => Math.max(0, i - 1));
    setAnswer("");
    setFeedback(null);
  };

  return (
    <section className="writing-shell" style={{ "--writing-theme": color }}>
      <header className="writing-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div>
          <div className="writing-kicker">WRITING METHOD</div>
          <h1>Writing</h1>
        </div>
      </header>

      <div className="writing-progress-wrap">
        <div className="writing-progress-track">
          <div className="writing-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span>{doneCount}/{total}</span>
      </div>

      <article className="writing-card">
        <div className="writing-meta">
          <span>{levelLabel}</span>
          <span>Best: {bestScore}%</span>
          <span>Atual: {currentLevel}</span>
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
          placeholder="Escreva sua resposta..."
        />

        {feedback && (
          <div className={`writing-feedback ${feedback.correct ? "is-ok" : "is-bad"}`}>
            {feedback.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{feedback.explanation}</span>
          </div>
        )}

        <div className="writing-actions">
          <button type="button" className="writing-secondary-btn" onClick={goPrev} disabled={index === 0}>
            Anterior
          </button>
          <button type="button" className="writing-primary-btn" onClick={submit}>
            Verificar
          </button>
          <button type="button" className="writing-secondary-btn" onClick={goNext} disabled={index === total - 1}>
            Próxima
          </button>
        </div>
      </article>
    </section>
  );
}
