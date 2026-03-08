import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Heart, Volume2, X } from "lucide-react";

const BASE_EXERCISE_UNITS = [
  {
    id: "u1",
    title: "Good morning / afternoon / evening",
    lessons: [
      {
        id: "greet-1",
        type: "choice",
        prompt: "Selecione a traducao correta para 'Good morning'.",
        options: ["Boa noite", "Bom dia", "Boa tarde"],
        answer: "Bom dia",
      },
      {
        id: "greet-2",
        type: "order",
        prompt: "Monte a frase: 'Good evening, Maria.'",
        answerTokens: ["Boa", "noite,", "Maria."],
        bank: ["Maria.", "Boa", "tarde", "noite,", "Bom"],
      },
      {
        id: "greet-3",
        type: "text",
        prompt: "Escreva em portugues: 'Good afternoon, teacher.'",
        answer: "Boa tarde, professor.",
      },
    ],
  },
  {
    id: "u2",
    title: "Asking and saying the name",
    lessons: [
      {
        id: "name-1",
        type: "choice",
        prompt: "Qual frase significa 'Qual e o seu nome?'",
        options: ["Where are you?", "What is your name?", "How old are you?"],
        answer: "What is your name?",
      },
      {
        id: "name-2",
        type: "order",
        prompt: "Monte a resposta em ingles para 'Meu nome e Julia'.",
        answerTokens: ["My", "name", "is", "Julia."],
        bank: ["My", "is", "Julia.", "name", "your"],
      },
    ],
  },
  {
    id: "u3",
    title: "Nice to meet you",
    lessons: [
      {
        id: "meet-1",
        type: "choice",
        prompt: "Escolha a traducao de 'Nice to meet you'.",
        options: ["Prazer em conhecer voce", "Vejo voce amanha", "Com licenca"],
        answer: "Prazer em conhecer voce",
      },
      {
        id: "meet-2",
        type: "text",
        prompt: "Escreva em ingles: 'Prazer em conhecer voce tambem.'",
        answer: "Nice to meet you too.",
      },
    ],
  },
  {
    id: "u4",
    title: "How are you?",
    lessons: [
      {
        id: "hru-1",
        type: "choice",
        prompt: "Escolha a melhor resposta para 'How are you?'",
        options: ["I am fine, thanks.", "My name is Ana.", "Good night."],
        answer: "I am fine, thanks.",
      },
    ],
  },
  {
    id: "u5",
    title: "Verb to be - affirmative",
    lessons: [
      {
        id: "be-1",
        type: "choice",
        prompt: "Complete: 'I ___ a student.'",
        options: ["am", "is", "are"],
        answer: "am",
      },
    ],
  },
  {
    id: "u6",
    title: "Numbers 0-10",
    lessons: [
      {
        id: "num-1",
        type: "choice",
        prompt: "Qual e o numero 'seven'?",
        options: ["5", "7", "9"],
        answer: "7",
      },
    ],
  },
  {
    id: "u7",
    title: "Daily routines",
    lessons: [
      {
        id: "routine-1",
        type: "choice",
        prompt: "Escolha a traducao correta para 'I brush my teeth'.",
        options: ["Eu escovo meus dentes", "Eu vou para escola", "Eu faco jantar"],
        answer: "Eu escovo meus dentes",
      },
      {
        id: "routine-2",
        type: "text",
        prompt: "Escreva em ingles: 'Eu acordo as sete.'",
        answer: "I wake up at seven.",
      },
    ],
  },
  {
    id: "u8",
    title: "Food and restaurant",
    lessons: [
      {
        id: "food-1",
        type: "choice",
        prompt: "Complete: 'I would like ___ pizza, please.'",
        options: ["a", "an", "the"],
        answer: "a",
      },
      {
        id: "food-2",
        type: "order",
        prompt: "Monte: 'Can I see the menu?'",
        answerTokens: ["Can", "I", "see", "the", "menu?"],
        bank: ["menu?", "I", "Can", "see", "the", "you"],
      },
    ],
  },
];

const ROLEPLAY_SCENARIOS = [
  {
    id: "c1",
    title: "Scenario: The Pizza Critic",
    scenarioTitle: "The Pizza Critic",
    context:
      "Oscar is preparing his classroom for an art exhibition. Eddy arrives carrying a pizza box.",
    dialogue: [
      { speaker: "Eddy", text: "Hey Oscar! I brought you lunch! Pizza always helps me when I am nervous." },
      { speaker: "Oscar", text: "I do not eat pizza, Eddy. And I am not nervous. I expect great things today." },
    ],
    question: "What does Eddy bring?",
    options: ["A pizza", "A notebook", "A coffee"],
    answer: "A pizza",
  },
  {
    id: "c2",
    title: "Scenario: Hotel Check-in",
    scenarioTitle: "Hotel Check-in",
    context: "You arrive at a hotel late at night and need to confirm your reservation quickly.",
    dialogue: [
      { speaker: "Guest", text: "Good evening. I have a reservation under Maria Silva." },
      { speaker: "Reception", text: "Welcome, Maria. May I see your passport, please?" },
    ],
    question: "What does the receptionist ask for?",
    options: ["A passport", "A pizza menu", "A taxi number"],
    answer: "A passport",
  },
  {
    id: "c3",
    title: "Scenario: Job Interview",
    scenarioTitle: "Job Interview",
    context: "A recruiter asks you about your strengths and teamwork experience.",
    dialogue: [
      { speaker: "Recruiter", text: "Can you tell me one of your strengths?" },
      { speaker: "Candidate", text: "I communicate clearly and I like solving problems with the team." },
    ],
    question: "Which strength is mentioned?",
    options: ["Communication", "Cooking", "Driving"],
    answer: "Communication",
  },
  {
    id: "c4",
    title: "Scenario: Team Meeting",
    scenarioTitle: "Team Meeting",
    context: "You need to align priorities and delivery dates with your team.",
    dialogue: [
      { speaker: "Lead", text: "Can we prioritize the login feature for this sprint?" },
      { speaker: "Developer", text: "Yes, I can deliver it by Friday if we reduce scope on reports." },
    ],
    question: "What is the proposed condition?",
    options: ["Reduce report scope", "Hire more people", "Change product name"],
    answer: "Reduce report scope",
  },
];

function buildGrammarUnits() {
  const roleplayEvery = 3;
  const units = [];
  let exerciseCount = 0;
  let scenarioCursor = 0;

  BASE_EXERCISE_UNITS.forEach((exerciseUnit, index) => {
    units.push({
      ...exerciseUnit,
      mode: "exercise",
      completed: index < 2,
    });

    exerciseCount += 1;
    const shouldInsertScenario = exerciseCount % roleplayEvery === 0 && scenarioCursor < ROLEPLAY_SCENARIOS.length;

    if (shouldInsertScenario) {
      const scenario = ROLEPLAY_SCENARIOS[scenarioCursor++];
      units.push({
        id: scenario.id,
        title: scenario.title,
        completed: false,
        mode: "conversation",
        lessons: [
          {
            id: `${scenario.id}-roleplay`,
            type: "roleplay",
            ...scenario,
          },
        ],
      });
    }
  });

  return units;
}

const GRAMMAR_UNITS = buildGrammarUnits();

function ensureGrammar(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.grammar) {
    data.modules.grammar = {
      completed_units: [],
      last_unit: null,
    };
  }
  if (!Array.isArray(data.modules.grammar.completed_units)) {
    data.modules.grammar.completed_units = [];
  }
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureGrammar(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureGrammar(parsed);
}

function themeVars(color = "#58cc02") {
  return {
    "--grammar-theme": color,
    "--grammar-theme-shadow": darken(color, 28),
    "--grammar-theme-soft": alpha(color, 0.2),
    "--grammar-theme-border": alpha(color, 0.35),
  };
}

function hexToRgb(hex) {
  const cleaned = hex.replace("#", "");
  const int = Number.parseInt(cleaned.length === 3 ? cleaned.split("").map((c) => c + c).join("") : cleaned, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function alpha(hex, value) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${value})`;
}

function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.max(0, r - amount)}, ${Math.max(0, g - amount)}, ${Math.max(0, b - amount)})`;
}

function speakText(text, lang = "en-US") {
  if (!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function NodeButton({ item, index, unlocked, active, isLast, onClick }) {
  const offsetClass = index % 2 === 0 ? "offset-left" : "offset-right";
  const iconSrc = isLast
    ? "/img/icons/trofeu.svg"
    : item.completed
      ? "/img/icons/check.svg"
      : item.mode === "conversation"
        ? "/img/icons/book.svg"
        : active && unlocked
          ? "/img/icons/haltere.svg"
          : "/img/icons/estrela.svg";

  return (
    <div className={`grammar-node-row ${offsetClass}`}>
      <button
        type="button"
        className={`grammar-node-btn ${item.completed ? "is-complete" : ""} ${active ? "is-active" : ""} ${unlocked ? "is-open" : "is-locked"} ${item.mode === "conversation" ? "is-conversation" : ""}`}
        disabled={!unlocked}
        onClick={() => unlocked && onClick(item.id)}
        title={item.title}
        aria-label={item.title}
      >
        {active && unlocked ? (
          <div className="grammar-tooltip-parent" aria-hidden="true">
            <div className="grammar-tooltip">COMECAR</div>
          </div>
        ) : null}
        <span className="grammar-node-icon">
          <img src={iconSrc} alt="" className="grammar-node-imgicon" />
        </span>
      </button>
      <div className="grammar-node-title">{item.title}</div>
    </div>
  );
}

function OrderQuestion({ question, onSubmit, disabled }) {
  const [selected, setSelected] = useState([]);
  const remaining = useMemo(() => {
    const selectedIndexes = selected.map((s) => s.originalIndex).filter((v) => Number.isInteger(v));
    return question.bank.filter((token, idx) => !selectedIndexes.includes(idx));
  }, [question.bank, selected]);

  const addToken = (token) => {
    const index = question.bank.findIndex((t, i) => t === token && !selected.some((s) => s.originalIndex === i));
    if (index >= 0) setSelected((prev) => [...prev, { text: token, originalIndex: index }]);
  };

  const removeToken = (position) => {
    setSelected((prev) => prev.filter((_, i) => i !== position));
  };

  const canCheck = selected.length > 0;
  const isCorrect = selected.map((t) => t.text).join(" ") === question.answerTokens.join(" ");

  return (
    <div className="grammar-question-card">
      <p className="grammar-question-prompt">{question.prompt}</p>
      <div className="grammar-answer-zone">
        {selected.length === 0 ? (
          <span className="grammar-answer-placeholder">Toque nas palavras abaixo</span>
        ) : (
          selected.map((token, idx) => (
            <button
              key={`${token.text}-${idx}`}
              type="button"
              className="grammar-chip selected"
              onClick={() => !disabled && removeToken(idx)}
              disabled={disabled}
            >
              {token.text}
            </button>
          ))
        )}
      </div>

      <div className="grammar-chip-bank">
        {remaining.map((token, idx) => (
          <button
            key={`${token}-${idx}`}
            type="button"
            className="grammar-chip"
            onClick={() => !disabled && addToken(token)}
            disabled={disabled}
          >
            {token}
          </button>
        ))}
      </div>

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit(canCheck && isCorrect)} disabled={disabled || !canCheck}>
        Verificar
      </button>
    </div>
  );
}

function ChoiceQuestion({ question, onSubmit, disabled }) {
  const [selected, setSelected] = useState("");
  return (
    <div className="grammar-question-card">
      <p className="grammar-question-prompt">{question.prompt}</p>
      <div className="grammar-choice-list">
        {question.options.map((option, idx) => (
          <button
            key={option}
            type="button"
            className={`grammar-choice ${selected === option ? "is-selected" : ""}`}
            onClick={() => !disabled && setSelected(option)}
            disabled={disabled}
          >
            <span className="grammar-choice-index">{idx + 1}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>
      <button type="button" className="grammar-check-btn" onClick={() => onSubmit(selected === question.answer)} disabled={disabled || !selected}>
        Verificar
      </button>
    </div>
  );
}

function TextQuestion({ question, onSubmit, disabled }) {
  const [value, setValue] = useState("");
  return (
    <div className="grammar-question-card">
      <p className="grammar-question-prompt">{question.prompt}</p>
      <textarea
        className="grammar-textarea"
        placeholder="Digite sua resposta..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => onSubmit(value.trim().toLowerCase() === question.answer.trim().toLowerCase())}
        disabled={disabled || !value.trim()}
      >
        Verificar
      </button>
    </div>
  );
}

function RolePlayQuestion({ question, onSubmit, disabled }) {
  const [selected, setSelected] = useState("");

  return (
    <div className="grammar-question-card grammar-roleplay-card">
      <div className="grammar-roleplay-cover">
        <img src="/img/icons/book.svg" alt="" />
        <strong>{question.scenarioTitle}</strong>
      </div>

      <p className="grammar-roleplay-context">
        <Volume2 size={15} />
        {question.context}
      </p>

      <div className="grammar-roleplay-dialogue">
        {question.dialogue.map((line, idx) => (
          <article key={`${line.speaker}_${idx}`} className="grammar-roleplay-line">
            <button type="button" onClick={() => speakText(line.text)} aria-label={`Ouvir fala de ${line.speaker}`}>
              <Volume2 size={14} />
            </button>
            <div>
              <strong>{line.speaker}</strong>
              <p>{line.text}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="grammar-question-prompt">{question.question}</p>
      <div className="grammar-choice-list">
        {question.options.map((option, idx) => (
          <button
            key={option}
            type="button"
            className={`grammar-choice ${selected === option ? "is-selected" : ""}`}
            onClick={() => !disabled && setSelected(option)}
            disabled={disabled}
          >
            <span className="grammar-choice-index">{idx + 1}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit(selected === question.answer)} disabled={disabled || !selected}>
        Verificar
      </button>
    </div>
  );
}

function LessonRunner({ unit, onClose, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [lives, setLives] = useState(5);
  const [status, setStatus] = useState("idle");

  const step = unit.lessons[stepIndex];
  const progress = ((stepIndex + (status === "correct" ? 1 : 0)) / unit.lessons.length) * 100;

  const handleSubmit = (correct) => {
    if (correct) {
      if (stepIndex === unit.lessons.length - 1) {
        setStatus("finished");
        onComplete(unit.id);
        return;
      }
      setStatus("correct");
      window.setTimeout(() => {
        setStepIndex((prev) => prev + 1);
        setStatus("idle");
      }, 700);
      return;
    }

    setLives((prev) => Math.max(0, prev - 1));
    setStatus("wrong");
    window.setTimeout(() => setStatus("idle"), 700);
  };

  let questionNode;
  if (step.type === "choice") {
    questionNode = <ChoiceQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
  } else if (step.type === "order") {
    questionNode = <OrderQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
  } else if (step.type === "text") {
    questionNode = <TextQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
  } else {
    questionNode = <RolePlayQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
  }

  return (
    <div className="grammar-lesson-shell">
      <div className="grammar-lesson-topbar">
        <button type="button" className="grammar-close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="grammar-lesson-progress">
          <div className="grammar-lesson-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <div className="grammar-hearts">
          <Heart size={18} />
          <span>{lives}</span>
        </div>
      </div>

      <div className="grammar-lesson-content">
        <h2>{unit.title}</h2>
        <div className="grammar-audio-line">
          <button type="button" className="grammar-audio-btn" onClick={() => speakText(unit.title)}>
            <Volume2 size={22} />
          </button>
          <span>{unit.mode === "conversation" ? "Cenario guiado: escute e responda o contexto." : "Ouca o tema e responda as atividades abaixo"}</span>
        </div>

        {status === "finished" ? (
          <div className="grammar-finish-card">
            <div className="grammar-finish-title">Licao concluida!</div>
            <p>O proximo topico foi desbloqueado na trilha.</p>
            <button type="button" className="grammar-check-btn" onClick={onClose}>
              Voltar para trilha
            </button>
          </div>
        ) : (
          questionNode
        )}
      </div>

      {status === "correct" && <div className="grammar-feedback correct">Correto!</div>}
      {status === "wrong" && <div className="grammar-feedback wrong">Tente novamente.</div>}
    </div>
  );
}

export default function GrammarPage({ setCurrentView, color = "#58cc02" }) {
  const defaultCompleted = useMemo(() => GRAMMAR_UNITS.filter((u) => u.completed).map((u) => u.id), []);
  const [completedIds, setCompletedIds] = useState(defaultCompleted);
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const persisted = progress.modules.grammar.completed_units || [];
        const valid = persisted.filter((id) => GRAMMAR_UNITS.some((unit) => unit.id === id));
        if (valid.length > 0) setCompletedIds(valid);
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

  const units = useMemo(
    () =>
      GRAMMAR_UNITS.map((u) => ({
        ...u,
        completed: completedIds.includes(u.id),
      })),
    [completedIds]
  );

  const activeUnit = units.find((u) => u.id === activeUnitId) || null;
  const completedCount = units.filter((u) => u.completed).length;
  const isUnlocked = (index) => index === 0 || units[index - 1]?.completed;

  const handleCompleteUnit = async (unitId) => {
    const nextIds = completedIds.includes(unitId) ? completedIds : [...completedIds, unitId];
    setCompletedIds(nextIds);
    try {
      const progress = await readProgress();
      progress.modules.grammar = {
        ...(progress.modules.grammar || {}),
        completed_units: nextIds,
        last_unit: unitId,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  if (activeUnit) {
    return (
      <section className="grammar-page-shell" style={themeVars(color)}>
        <LessonRunner unit={activeUnit} onClose={() => setActiveUnitId(null)} onComplete={handleCompleteUnit} />
      </section>
    );
  }

  if (loading) {
    return (
      <section className="grammar-page-shell" style={themeVars(color)}>
        <div className="grammar-progress-copy">Carregando progresso...</div>
      </section>
    );
  }

  return (
    <section className="grammar-page-shell" style={themeVars(color)}>
      <div className="grammar-header-card">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView?.("initial")}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div className="grammar-header-content">
          <div className="grammar-header-kicker">SECAO 6, UNIDADE 1</div>
          <h1>Gratidao: Agradeca por uma ajuda</h1>
          <button type="button" className="grammar-guide-btn">
            <BookOpen size={18} />
            GUIA
          </button>
        </div>
      </div>

      <div className="grammar-progress-copy">Progresso: {completedCount}/{units.length} materias concluidas</div>

      <div className="grammar-stage">
        <div className="grammar-trail">
          {units.map((item, index) => (
            <NodeButton
              key={item.id}
              item={item}
              index={index}
              unlocked={isUnlocked(index)}
              active={index === completedCount && isUnlocked(index)}
              isLast={index === units.length - 1}
              onClick={setActiveUnitId}
            />
          ))}
        </div>
        <aside className="grammar-side-illustration">
          <img src="/img/duolingo.png" alt="Duolingo mascot" className="grammar-side-image" />
        </aside>
      </div>
    </section>
  );
}
