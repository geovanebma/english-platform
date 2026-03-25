import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Headphones,
  MessageCircleMore,
  PenSquare,
  Volume2,
  X,
} from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const BASE_EXERCISE_UNITS = [
  {

    id: "u1",

    title: "Good morning / afternoon / evening",

    summary: "Cumprimentos basicos em diferentes momentos do dia, com foco em contexto e naturalidade.",

    focusSkills: ["greeting", "listening", "translation"],

    guidePoints: [
      "Use good morning ate o inicio da tarde.",
      "Good afternoon cobre a tarde.",
      "Good evening costuma ser usado ao chegar ou cumprimentar a noite.",
    ],

    masterySignal: "Voce escolhe o cumprimento correto sem depender de traducao literal.",

    conceptKey: "greetings_time_of_day",

    lessons: [

      {

        id: "greet-1",

        type: "choice",

        prompt: "Selecione a traducao correta para 'Good morning'.",

        options: ["Boa noite", "Bom dia", "Boa tarde"],

        answer: "Bom dia",

        explanation: "Good morning corresponde ao cumprimento usado pela manha.",

        conceptKey: "greetings_time_of_day",

      },

      {

        id: "greet-2",

        type: "listen_choice",

        prompt: "Toque no que voce escutar.",

        audioText: "Good evening, Maria.",

        options: ["Boa tarde, Maria.", "Boa noite, Maria.", "Bom dia, Maria."],

        answer: "Boa noite, Maria.",

        explanation: "Neste contexto, good evening aponta para um cumprimento noturno.",

        conceptKey: "greetings_time_of_day",

      },

      {

        id: "greet-3",

        type: "order",

        prompt: "Monte a frase: 'Good evening, Maria.'",

        answerTokens: ["Boa", "noite,", "Maria."],

        bank: ["Maria.", "Boa", "tarde", "noite,", "Bom"],

        explanation: "A ordem correta reforca a traducao completa da saudacao.",

        conceptKey: "greetings_time_of_day",

      },

      {

        id: "greet-4",

        type: "cloze",

        prompt: "Complete a frase com a melhor opcao.",

        sentence: "When I arrive at the office at 8 a.m., I say ___ to everyone.",

        options: ["good morning", "good evening", "good night"],

        answer: "good morning",

        explanation: "A manha pede good morning, nao evening nem night.",

        conceptKey: "greetings_time_of_day",

      },

      {

        id: "greet-5",

        type: "text",

        prompt: "Escreva em portugues: 'Good afternoon, teacher.'",

        answer: "Boa tarde, professor.",

        acceptedAnswers: ["Boa tarde, professora."],

        explanation: "Good afternoon e usado na parte da tarde.",

        conceptKey: "greetings_time_of_day",

      },

      {

        id: "greet-6",

        type: "speech",

        prompt: "Fale em ingles: 'Good morning, everyone.'",

        audioText: "Good morning, everyone.",

        answer: "Good morning, everyone.",

        acceptedAnswers: ["good morning everyone"],

        explanation: "Repita a saudacao completa em voz alta para consolidar a pronuncia.",

        conceptKey: "greetings_time_of_day",

      },

    ],

  },

  {

    id: "u2",

    title: "Asking and saying the name",

    summary: "Perguntar e responder nomes com estrutura simples e educada.",

    focusSkills: ["introduction", "question forms"],

    conceptKey: "asking_names",

    lessons: [

      {

        id: "name-1",

        type: "choice",

        prompt: "Qual frase significa 'Qual e o seu nome?'",

        options: ["Where are you?", "What is your name?", "How old are you?"],

        answer: "What is your name?",

        explanation: "What is your name e a forma padrao para perguntar o nome de alguem.",

        conceptKey: "asking_names",

      },

      {

        id: "name-2",

        type: "error_spot",

        prompt: "Qual opcao corrige a frase abaixo?",

        sentence: "My name are Julia.",

        options: ["My name is Julia.", "My name am Julia.", "My name be Julia."],

        answer: "My name is Julia.",

        explanation: "Com my name, o verbo correto e is.",

        conceptKey: "asking_names",

      },

      {

        id: "name-3",

        type: "order",

        prompt: "Monte a resposta em ingles para 'Meu nome e Julia'.",

        answerTokens: ["My", "name", "is", "Julia."],

        bank: ["My", "is", "Julia.", "name", "your"],

        explanation: "A estrutura completa da resposta e My name is Julia.",

        conceptKey: "asking_names",

      },

      {

        id: "name-4",

        type: "cloze_text",

        prompt: "Complete em ingles com sua propria resposta.",

        sentence: "My name ___ Julia.",

        answer: "is",

        acceptedAnswers: ["'s"],

        explanation: "A lacuna exige a forma correta do verbo to be para apresentacao.",

        conceptKey: "asking_names",

      },

    ],

  },

  {

    id: "u3",

    title: "Nice to meet you",

    summary: "Introducoes sociais com resposta curta, escuta e escrita guiada.",

    focusSkills: ["social", "response", "writing"],

    conceptKey: "meeting_people",

    lessons: [

      {

        id: "meet-1",

        type: "choice",

        prompt: "Escolha a traducao de 'Nice to meet you'.",

        options: ["Prazer em conhecer voce", "Vejo voce amanha", "Com licenca"],

        answer: "Prazer em conhecer voce",

        explanation: "A expressao indica prazer ao conhecer alguem.",

        conceptKey: "meeting_people",

      },

      {

        id: "meet-2",

        type: "listen_choice",

        prompt: "Escute e selecione a melhor resposta em portugues.",

        audioText: "Nice to meet you too.",

        options: ["Prazer em conhecer voce tambem.", "Ate amanha.", "Eu estou bem."],

        answer: "Prazer em conhecer voce tambem.",

        explanation: "O too indica reciprocidade: tambem.",

        conceptKey: "meeting_people",

      },

      {

        id: "meet-3",

        type: "text",

        prompt: "Escreva em ingles: 'Prazer em conhecer voce tambem.'",

        answer: "Nice to meet you too.",

        acceptedAnswers: ["Nice to meet you, too."],

        explanation: "A resposta padrao usa too ao final.",

        conceptKey: "meeting_people",

      },

      {

        id: "meet-4",

        type: "speech",

        prompt: "Fale a resposta em ingles para 'Prazer em conhecer voce tambem.'",

        audioText: "Nice to meet you too.",

        answer: "Nice to meet you too.",

        acceptedAnswers: ["nice to meet you, too"],

        explanation: "A resposta falada ajuda a automatizar a troca social completa.",

        conceptKey: "meeting_people",

      },

    ],

  },

  {

    id: "u4",

    title: "How are you?",

    summary: "Respostas curtas para perguntar e responder como alguem esta.",

    focusSkills: ["conversation", "listening", "response"],

    conceptKey: "basic_wellbeing_responses",

    lessons: [

      {

        id: "hru-1",

        type: "choice",

        prompt: "Escolha a melhor resposta para 'How are you?'",

        options: ["I am fine, thanks.", "My name is Ana.", "Good night."],

        answer: "I am fine, thanks.",

        explanation: "A resposta adequada informa como voce esta e pode incluir um agradecimento.",

        conceptKey: "basic_wellbeing_responses",

      },

      {

        id: "hru-2",

        type: "dictation",

        prompt: "Escreva exatamente o que voce escutar.",

        audioText: "I am fine, thanks.",

        answer: "I am fine, thanks.",

        acceptedAnswers: ["I am fine thanks"],

        explanation: "A frase usa uma resposta curta e natural para how are you.",

        conceptKey: "basic_wellbeing_responses",

      },

    ],

  },

  {

    id: "u5",

    title: "Verb to be - affirmative",

    summary: "Afirmacoes basicas com am, is e are em contexto simples.",

    focusSkills: ["verb to be", "accuracy"],

    conceptKey: "verb_to_be_affirmative",

    lessons: [

      {

        id: "be-1",

        type: "choice",

        prompt: "Complete: 'I ___ a student.'",

        options: ["am", "is", "are"],

        answer: "am",

        explanation: "Com I, usamos am.",

        conceptKey: "verb_to_be_affirmative",

      },

      {

        id: "be-2",

        type: "cloze",

        prompt: "Escolha a forma correta do verbo.",

        sentence: "She ___ my teacher.",

        options: ["am", "is", "are"],

        answer: "is",

        explanation: "Com she, a forma correta e is.",

        conceptKey: "verb_to_be_affirmative",

      },

      {

        id: "be-3",

        type: "fix_fragment",

        prompt: "Corrija o trecho errado da frase.",

        before: "They ",

        wrongFragment: "is",

        after: " ready for class.",

        options: ["am", "is", "are"],

        answer: "are",

        explanation: "Com they, usamos are.",

        conceptKey: "verb_to_be_affirmative",

      },

    ],

  },

  {

    id: "u6",

    title: "Numbers 0-10",

    summary: "Numeros basicos para idade, telefone, quarto de hotel e horario.",

    focusSkills: ["numbers", "listening"],

    conceptKey: "numbers_zero_ten",

    lessons: [

      {

        id: "num-1",

        type: "choice",

        prompt: "Qual e o numero 'seven'?",

        options: ["5", "7", "9"],

        answer: "7",

        explanation: "Seven corresponde ao numero 7.",

        conceptKey: "numbers_zero_ten",

      },

      {

        id: "num-2",

        type: "listen_choice",

        prompt: "Escute o numero e selecione a opcao correta.",

        audioText: "ten",

        options: ["2", "8", "10"],

        answer: "10",

        explanation: "Ten corresponde ao numero 10.",

        conceptKey: "numbers_zero_ten",

      },

      {

        id: "num-3",

        type: "listen_variation",

        prompt: "Ouça em velocidades diferentes e selecione o numero correto.",

        audioText: "seven",

        options: ["7", "6", "9"],

        answer: "7",

        explanation: "A mesma palavra deve ser reconhecida mesmo com variacao de velocidade.",

        conceptKey: "numbers_zero_ten",

      },

    ],

  },

  {

    id: "u7",

    title: "Daily routines",

    summary: "Rotina diaria com verbos frequentes e horarios simples.",

    focusSkills: ["routine", "writing", "translation"],

    conceptKey: "daily_routines",

    lessons: [

      {

        id: "routine-1",

        type: "choice",

        prompt: "Escolha a traducao correta para 'I brush my teeth'.",

        options: ["Eu escovo meus dentes", "Eu vou para escola", "Eu faco jantar"],

        answer: "Eu escovo meus dentes",

        explanation: "Brush my teeth indica a acao de escovar os dentes.",

        conceptKey: "daily_routines",

      },

      {

        id: "routine-2",

        type: "text",

        prompt: "Escreva em ingles: 'Eu acordo as sete.'",

        answer: "I wake up at seven.",

        acceptedAnswers: ["I wake up at 7."],

        explanation: "Wake up e a estrutura esperada para acordar.",

        conceptKey: "daily_routines",

      },

      {

        id: "routine-3",

        type: "error_spot",

        prompt: "Escolha a frase correta.",

        sentence: "She wake up at six every day.",

        options: ["She wakes up at six every day.", "She waking up at six every day.", "She wake at six every day."],

        answer: "She wakes up at six every day.",

        explanation: "Na terceira pessoa do singular, o verbo recebe s.",

        conceptKey: "daily_routines",

      },

      {

        id: "routine-4",

        type: "dictation",

        prompt: "Escreva o que voce escutar sobre rotina.",

        audioText: "She wakes up at six every day.",

        answer: "She wakes up at six every day.",

        acceptedAnswers: ["She wakes up at 6 every day."],

        explanation: "O ditado reforca a terceira pessoa e o horario na frase completa.",

        conceptKey: "daily_routines",

      },

    ],

  },

  {

    id: "u8",

    title: "Food and restaurant",

    summary: "Pedidos simples em restaurante, menu e preferencia de comida.",

    focusSkills: ["restaurant", "ordering", "conversation"],

    conceptKey: "food_restaurant",

    lessons: [

      {

        id: "food-1",

        type: "choice",

        prompt: "Complete: 'I would like ___ pizza, please.'",

        options: ["a", "an", "the"],

        answer: "a",

        explanation: "Pizza e contavel aqui, entao usamos a.",

        conceptKey: "food_restaurant",

      },

      {

        id: "food-2",

        type: "order",

        prompt: "Monte: 'Can I see the menu?'",

        answerTokens: ["Can", "I", "see", "the", "menu?"],

        bank: ["menu?", "I", "Can", "see", "the", "you"],

        explanation: "A estrutura educada para pedir o menu comeca com Can I see...",

        conceptKey: "food_restaurant",

      },

      {

        id: "food-3",

        type: "roleplay",

        scenarioTitle: "Cafe order",

        context: "You are ordering in a cafe and want something simple and polite.",

        dialogue: [
          { speaker: "Server", text: "Good afternoon. What would you like?" },
          { speaker: "Customer", text: "I would like a sandwich and a coffee, please." },
          { speaker: "Server", text: "Sure. Would you like anything else?" },
        ],

        question: "What does the customer order first?",

        options: ["A sandwich and a coffee", "A pizza and water", "Only dessert"],

        answer: "A sandwich and a coffee",

        explanation: "A fala do cliente informa claramente os dois itens pedidos.",

        conceptKey: "food_restaurant",

      },

      {

        id: "food-4",

        type: "cloze_text",

        prompt: "Complete a lacuna com a palavra correta em ingles.",

        sentence: "Can I see the ___?",

        answer: "menu",

        acceptedAnswers: ["menu?"],

        explanation: "A palavra-chave do pedido continua sendo menu.",

        conceptKey: "food_restaurant",

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

function buildLevelUnits(levelId, topics) {
  return topics.map((topic, index) => ({
    id: `${levelId.toLowerCase()}-u${index + 1}`,
    title: topic,
    mode: index % 3 === 2 ? "conversation" : "exercise",
    completed: false,
    lessons: [
      {
        id: `${levelId.toLowerCase()}-${index + 1}-1`,
        type: "choice",
        prompt: `Tema ${levelId}: ${topic}. Qual opcao representa o foco correto da licao?`,
        options: ["Uso em contexto real", "Memorizacao isolada", "Traducao literal sem contexto"],
        answer: "Uso em contexto real",
      },
    ],
  }));
}

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_UNIT_MAP = {
  A1: GRAMMAR_UNITS,
  A2: buildLevelUnits("A2", [
    "Simple present review",
    "Questions with do/does",
    "Time and frequency adverbs",
    "Travel basics and directions",
    "Daily life conversations",
    "Future plans with going to",
  ]),
  B1: buildLevelUnits("B1", [
    "Past simple vs present perfect",
    "Comparatives and superlatives",
    "Workplace communication",
    "Problem solving dialogues",
    "Conditionals type 1 and 2",
    "Opinion and argument structure",
  ]),
  B2: buildLevelUnits("B2", [
    "Passive voice in context",
    "Reported speech",
    "Formal email and meetings",
    "Negotiation roleplay",
    "Advanced connectors",
    "Cause and consequence language",
  ]),
  C1: buildLevelUnits("C1", [
    "Nuanced meaning and tone",
    "Inversion and emphasis",
    "Academic style responses",
    "Complex discussion roleplay",
    "Idiomatic fluency",
    "Precision in argumentation",
  ]),
  C2: buildLevelUnits("C2", [
    "Near-native reformulation",
    "Advanced discourse markers",
    "Pragmatics and intent",
    "Leadership communication roleplay",
    "High-level writing accuracy",
    "C2 mastery consolidation",
  ]),
};

function ensureGrammar(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.grammar) {
    data.modules.grammar = {
      completed_units: [],
      completed_units_by_level: {},
      current_level: "A1",
      last_unit: null,

      concept_scores: {},

      lesson_history: [],

      unit_attempts: {},

      weak_concepts: [],

      session_resume: null,

      recommended_review_unit: null,
    };
  }
  if (!Array.isArray(data.modules.grammar.completed_units)) {
    data.modules.grammar.completed_units = [];
  }
  if (!data.modules.grammar.completed_units_by_level || typeof data.modules.grammar.completed_units_by_level !== "object") {
    data.modules.grammar.completed_units_by_level = {};
  }
  if (!data.modules.grammar.concept_scores || typeof data.modules.grammar.concept_scores !== "object") {

    data.modules.grammar.concept_scores = {};

  }

  if (!Array.isArray(data.modules.grammar.lesson_history)) {

    data.modules.grammar.lesson_history = [];

  }

  if (!data.modules.grammar.unit_attempts || typeof data.modules.grammar.unit_attempts !== "object") {

    data.modules.grammar.unit_attempts = {};

  }

  if (!Array.isArray(data.modules.grammar.weak_concepts)) {

    data.modules.grammar.weak_concepts = [];

  }

  if (!data.modules.grammar.session_resume || typeof data.modules.grammar.session_resume !== "object") {

    data.modules.grammar.session_resume = null;

  }

  if (!data.modules.grammar.recommended_review_unit) {

    data.modules.grammar.recommended_review_unit = null;

  }

  if (!data.modules.grammar.current_level) data.modules.grammar.current_level = "A1";
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

function speakText(text, lang = "en-US", options = {}) {
  if (!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = options.rate || 0.95;
  utter.pitch = options.pitch || 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function normalize(text) {

  return (text || "")

    .toLowerCase()

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .replace(/[^a-z0-9\s]/g, " ")

    .replace(/\s+/g, " ")

    .trim();

}



function formatConceptLabel(key) {

  return (key || "grammar").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

}



function computeConceptStatus(score = 0) {

  if (score >= 80) return "stable";

  if (score >= 55) return "attention";

  return "weak";

}



function buildQuestionFeedback(question, isCorrect, submittedValue) {

  const answerSource =

    question.acceptedAnswers?.[0] ||

    question.answerTokens?.join(" ") ||

    question.answer ||

    question.correction ||

    "";



  if (isCorrect) {

    return {

      tone: "correct",

      title: "Boa resposta",

      summary: question.explanation || "Resposta consistente com o conceito desta etapa.",

      correctAnswer: answerSource,

      microRule: `Conceito: ${formatConceptLabel(question.conceptKey)}`,

    };

  }



  return {

    tone: "wrong",

    title: "Resposta incorreta",

    summary: question.explanation || "Revise a regra principal antes de continuar.",

    correctAnswer: answerSource,

    submittedValue,

    microRule: `Reforce: ${formatConceptLabel(question.conceptKey)}`,

  };

}



function buildReviewUnits(units, conceptScores) {

  const weak = Object.entries(conceptScores || {})

    .filter(([, value]) => Number(value || 0) < 55)

    .slice(0, 2)

    .map(([conceptKey], index) => ({

      id: `review-${conceptKey}-${index + 1}`,

      title: `Review: ${formatConceptLabel(conceptKey)}`,

      concept: formatConceptLabel(conceptKey),

      summary: "Short targeted review based on your recent errors.",

      focusSkills: ["review", "accuracy"],

      guidePoints: [

        "This review was generated from weak performance in a recent lesson.",

        "Focus on the correct pattern and one contextual example.",

      ],

      masterySignal: "You can answer this concept without hesitation after review.",

      mode: "exercise",

      lessons: [

        {

          id: `review-${conceptKey}-1`,

          type: "choice",

          prompt: `Quick review: which option best matches ${formatConceptLabel(conceptKey)}?`,

          options: ["Correct usage in context", "Literal translation only", "Random memorization"],

          answer: "Correct usage in context",

          explanation: "The review reinforces contextual use of the weak concept.",

          conceptKey,

        },

      ],

    }));



  return [...weak, ...units];

}

function slugify(value) {

  return normalize(value).replace(/\s+/g, "_") || "grammar";

}

function enrichLesson(lesson, unit) {

  return {

    explanation: lesson.explanation || `Revise o padrao principal de ${unit.title.toLowerCase()}.`,

    conceptKey: lesson.conceptKey || unit.conceptKey || slugify(unit.title),

    acceptedAnswers: lesson.acceptedAnswers || [],

    ...lesson,

  };

}

function enrichUnit(unit) {

  const conceptKey = unit.conceptKey || slugify(unit.title);

  return {

    summary: unit.summary || `Pratique ${unit.title.toLowerCase()} em frases curtas, audio e contexto real.`,

    focusSkills: unit.focusSkills || (unit.mode === "conversation" ? ["listening", "dialogue"] : ["grammar", "accuracy"]),

    guidePoints:

      unit.guidePoints || [

        "Leia a estrutura principal antes de responder.",

        "Observe como o conceito aparece em contexto real.",

      ],

    masterySignal: unit.masterySignal || "Voce responde sem hesitar e reconhece o padrao em novas frases.",

    conceptKey,

    ...unit,

    lessons: (unit.lessons || []).map((lesson) => enrichLesson(lesson, { ...unit, conceptKey })),

  };

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
      <div className={`grammar-node-ring ${active && unlocked ? "is-active" : ""}`}>
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
      </div>
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
  const submittedValue = selected.map((t) => t.text).join(" ");

  const isCorrect = submittedValue === question.answerTokens.join(" ");

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

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: canCheck && isCorrect, submittedValue })} disabled={disabled || !canCheck}>
        Verificar
      </button>
    </div>
  );
}

function ChoiceQuestion({ question, onSubmit, disabled, status = "idle" }) {
  const [selected, setSelected] = useState("");
  return (
    <div className="grammar-question-card">
      <p className="grammar-question-prompt">{question.prompt}</p>
      <div className="grammar-choice-list">
        {question.options.map((option, idx) => (
          <button
            key={option}
            type="button"
            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}
            onClick={() => !disabled && setSelected(option)}
            disabled={disabled}
          >
            <span className="grammar-choice-index">{idx + 1}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>
      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })} disabled={disabled || !selected}>
        Verificar
      </button>
    </div>
  );
}

function TextQuestion({ question, onSubmit, disabled }) {
  const [value, setValue] = useState("");

  const acceptedAnswers = [question.answer, ...(question.acceptedAnswers || [])].map(normalize);
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
        onClick={() => onSubmit({ correct: acceptedAnswers.includes(normalize(value)), submittedValue: value })}
        disabled={disabled || !value.trim()}
      >
        Verificar
      </button>
    </div>
  );
}

function ClozeQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");

  const [before, after] = question.sentence.split("___");



  return (

    <div className="grammar-question-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-cloze-sentence">

        {before}

        <span className={`grammar-inline-gap ${selected ? "is-filled" : ""}`}>{selected || "______"}</span>

        {after}

      </div>

      <div className="grammar-choice-list compact">

        {question.options.map((option, idx) => (

          <button

            key={option}

            type="button"

            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}

            onClick={() => !disabled && setSelected(option)}

            disabled={disabled}

          >

            <span className="grammar-choice-index">{idx + 1}</span>

            <span>{option}</span>

          </button>

        ))}

      </div>

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })} disabled={disabled || !selected}>

        Verificar

      </button>

    </div>

  );

}



function ListenChoiceQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");



  return (

    <div className="grammar-question-card grammar-listen-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <button type="button" className="grammar-listen-action" onClick={() => speakText(question.audioText)}>

        <Headphones size={20} />

        Ouvir audio

      </button>

      <div className="grammar-choice-list">

        {question.options.map((option, idx) => (

          <button

            key={option}

            type="button"

            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}

            onClick={() => !disabled && setSelected(option)}

            disabled={disabled}

          >

            <span className="grammar-choice-index">{idx + 1}</span>

            <span>{option}</span>

          </button>

        ))}

      </div>

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })} disabled={disabled || !selected}>

        Verificar

      </button>

    </div>

  );

}



function ErrorSpotQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");



  return (

    <div className="grammar-question-card grammar-error-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-error-sentence">{question.sentence}</div>

      <div className="grammar-choice-list compact">

        {question.options.map((option, idx) => (

          <button

            key={option}

            type="button"

            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}

            onClick={() => !disabled && setSelected(option)}

            disabled={disabled}

          >

            <span className="grammar-choice-index">{idx + 1}</span>

            <span>{option}</span>

          </button>

        ))}

      </div>

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })} disabled={disabled || !selected}>

        Verificar

      </button>

    </div>

  );

}



function DictationQuestion({ question, onSubmit, disabled }) {

  const [value, setValue] = useState("");
  const acceptedAnswers = [question.answer, ...(question.acceptedAnswers || [])].map(normalize);

  return (

    <div className="grammar-question-card grammar-dictation-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <button type="button" className="grammar-listen-action" onClick={() => speakText(question.audioText || question.answer)}>
        <Headphones size={20} />
        Ouvir novamente
      </button>

      <textarea
        className="grammar-textarea"
        rows={4}
        placeholder={question.placeholder || "Digite exatamente o que voce escutou"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
      />

      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => onSubmit({ correct: acceptedAnswers.includes(normalize(value)), submittedValue: value })}
        disabled={disabled || !value.trim()}
      >
        Verificar
      </button>

    </div>

  );

}



function FreeInputClozeQuestion({ question, onSubmit, disabled }) {

  const [value, setValue] = useState("");
  const [before, after] = question.sentence.split("___");
  const acceptedAnswers = [question.answer, ...(question.acceptedAnswers || [])].map(normalize);

  return (

    <div className="grammar-question-card grammar-cloze-free-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-cloze-free-sentence">
        <span>{before}</span>
        <input
          type="text"
          className="grammar-inline-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
          placeholder={question.placeholder || "complete"}
        />
        <span>{after}</span>
      </div>

      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => onSubmit({ correct: acceptedAnswers.includes(normalize(value)), submittedValue: value })}
        disabled={disabled || !value.trim()}
      >
        Verificar
      </button>

    </div>

  );

}



function ListenVariationQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");
  const play = (rate) => speakText(question.audioText, question.lang || "en-US", { rate });

  return (

    <div className="grammar-question-card grammar-listen-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-listen-variation-actions">
        <button type="button" className="grammar-listen-action" onClick={() => play(0.78)}>
          <Headphones size={18} />
          Lento
        </button>
        <button type="button" className="grammar-listen-action" onClick={() => play(0.95)}>
          <Headphones size={18} />
          Normal
        </button>
        <button type="button" className="grammar-listen-action" onClick={() => play(1.08)}>
          <Headphones size={18} />
          Rapido
        </button>
      </div>

      <div className="grammar-choice-list">
        {question.options.map((option, idx) => (
          <button
            key={option}
            type="button"
            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}
            onClick={() => !disabled && setSelected(option)}
            disabled={disabled}
          >
            <span className="grammar-choice-index">{idx + 1}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })}
        disabled={disabled || !selected}
      >
        Verificar
      </button>

    </div>

  );

}



function FixFragmentQuestion({ question, onSubmit, disabled, status = "idle" }) {

  const [selected, setSelected] = useState("");

  return (

    <div className="grammar-question-card grammar-fix-fragment-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <div className="grammar-fix-sentence">
        <span>{question.before}</span>
        <span className="grammar-inline-gap is-filled is-wrong">{question.wrongFragment}</span>
        <span>{question.after}</span>
      </div>

      <div className="grammar-choice-list compact">
        {question.options.map((option, idx) => (
          <button
            key={option}
            type="button"
            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}
            onClick={() => !disabled && setSelected(option)}
            disabled={disabled}
          >
            <span className="grammar-choice-index">{idx + 1}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })}
        disabled={disabled || !selected}
      >
        Verificar
      </button>

    </div>

  );

}



function SpeakingQuestion({ question, onSubmit, disabled }) {

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const [speechSupported] = useState(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognitionRef = useRef(null);
  const acceptedAnswers = [question.answer, ...(question.acceptedAnswers || [])].map(normalize);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // no-op
        }
      }
    };
  }, []);

  const stopPreviousRecognition = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    } catch {
      // no-op
    }
    recognitionRef.current = null;
  };

  const startListening = async () => {
    const SpeechApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechApi || isListening) return;

    setSpeechStatus("");
    setTranscript("");

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        setSpeechStatus("Permita o microfone no navegador para transcrever sua fala.");
        return;
      }
    }

    stopPreviousRecognition();

    const recognition = new SpeechApi();
    recognitionRef.current = recognition;
    recognition.lang = question.lang || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setSpeechStatus("Ouvindo sua fala...");

    recognition.onstart = () => {
      setSpeechStatus("Microfone ativo. Fale agora.");
    };

    recognition.onresult = (event) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i += 1) {
        combined += `${event.results[i][0]?.transcript || ""} `;
      }
      const cleaned = combined.trim();
      setTranscript(cleaned);
      setSpeechStatus(cleaned ? "Fala capturada. Revise abaixo se necessario." : "Ouvindo sua fala...");
    };

    recognition.onerror = (event) => {
      const errorMap = {
        'not-allowed': 'O navegador bloqueou o microfone.',
        'audio-capture': 'Nenhum microfone foi detectado.',
        'network': 'Falha de rede durante a transcricao.',
        'no-speech': 'Nenhuma fala foi detectada. Tente novamente.',
        'aborted': 'Captura interrompida.',
      };
      setSpeechStatus(errorMap[event?.error] || 'Nao foi possivel transcrever sua fala.');
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      setSpeechStatus((current) => current || 'Captura encerrada.');
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechStatus('Nao foi possivel iniciar a captura de voz.');
      recognitionRef.current = null;
    }
  };

  return (

    <div className="grammar-question-card grammar-speaking-card">

      <p className="grammar-question-prompt">{question.prompt}</p>

      <button type="button" className="grammar-listen-action" onClick={() => speakText(question.audioText || question.answer, question.lang || "en-US")}>
        <Headphones size={18} />
        Ouvir modelo
      </button>

      <button type="button" className="grammar-speak-action" onClick={startListening} disabled={disabled || !speechSupported || isListening}>
        <MessageCircleMore size={18} />
        {speechSupported ? (isListening ? "Ouvindo..." : "Falar agora") : "Microfone indisponivel"}
      </button>

      {speechStatus ? <p className="grammar-speech-status">{speechStatus}</p> : null}

      <textarea
        className="grammar-textarea"
        rows={3}
        value={transcript}
        onChange={(event) => setTranscript(event.target.value)}
        disabled={disabled}
        placeholder="Sua fala aparece aqui. Se precisar, voce pode ajustar manualmente."
      />

      <button
        type="button"
        className="grammar-check-btn"
        onClick={() => onSubmit({ correct: acceptedAnswers.includes(normalize(transcript)), submittedValue: transcript })}
        disabled={disabled || !transcript.trim()}
      >
        Verificar
      </button>

    </div>

  );

}


function RolePlayQuestion({ question, onSubmit, disabled, status = "idle" }) {
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
            className={`grammar-choice ${selected === option ? "is-selected" : ""} ${status === "wrong" && selected === option ? "is-wrong" : ""} ${status === "correct" && selected === option ? "is-correct" : ""}`}
            onClick={() => !disabled && setSelected(option)}
            disabled={disabled}
          >
            <span className="grammar-choice-index">{idx + 1}</span>
            <span>{option}</span>
          </button>
        ))}
      </div>

      <button type="button" className="grammar-check-btn" onClick={() => onSubmit({ correct: selected === question.answer, submittedValue: selected })} disabled={disabled || !selected}>
        Verificar
      </button>
    </div>
  );
}

function LessonRunner({ unit, onClose, onComplete, resumeState, onSaveSession }) {

  const initialSummary = resumeState?.unitId === unit.id
    ? resumeState.summary || { correct: 0, wrong: 0 }
    : { correct: 0, wrong: 0 };

  const [phase, setPhase] = useState(resumeState?.unitId === unit.id ? resumeState.phase || "intro" : "intro");
  const [stepIndex, setStepIndex] = useState(resumeState?.unitId === unit.id ? resumeState.stepIndex || 0 : 0);
  const [lives, setLives] = useState(resumeState?.unitId === unit.id ? resumeState.lives || 5 : 5);
  const [status, setStatus] = useState("idle");
  const [summary, setSummary] = useState(initialSummary);
  const [feedback, setFeedback] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [attemptLog, setAttemptLog] = useState(
    resumeState?.unitId === unit.id && Array.isArray(resumeState.attemptLog) ? resumeState.attemptLog : []
  );

  const step = unit.lessons[stepIndex];
  const completedSteps = phase === "summary" ? unit.lessons.length : stepIndex;
  const progress = (completedSteps / Math.max(unit.lessons.length, 1)) * 100;

  useEffect(() => {
    if (!onSaveSession) return;

    if (phase === "summary") {
      onSaveSession(null);
      return;
    }

    onSaveSession({
      unitId: unit.id,
      phase,
      stepIndex,
      lives,
      summary,
      attemptLog,
      updatedAt: new Date().toISOString(),
    });
  }, [attemptLog, lives, onSaveSession, phase, stepIndex, summary, unit.id]);

  useEffect(() => {
    if (phase !== "lesson" || !step) return;

    const textToSpeak = step.audioText || step.prompt || unit.title;
    const timer = window.setTimeout(() => {
      speakText(textToSpeak);
    }, 280);

    return () => window.clearTimeout(timer);
  }, [phase, step, unit.title]);

  const handleSubmit = (result) => {
    const correct = typeof result === "boolean" ? result : Boolean(result?.correct);
    const submittedValue = typeof result === "object" ? result?.submittedValue : "";
    const nextAttempt = {
      lessonId: step.id,
      conceptKey: step.conceptKey || unit.conceptKey || slugify(unit.title),
      correct,
      submittedValue,
    };

    setAttemptLog((prev) => [...prev, nextAttempt]);
    setFeedback(buildQuestionFeedback(step, correct, submittedValue));

    if (correct) {
      const nextSummary = { ...summary, correct: summary.correct + 1 };
      const nextLog = [...attemptLog, nextAttempt];
      setSummary(nextSummary);
      if (stepIndex === unit.lessons.length - 1) {
        setPhase("summary");
        onComplete({
          unitId: unit.id,
          summary: nextSummary,
          attemptLog: nextLog,
          livesRemaining: lives,
        });
        return;
      }
      setStatus("correct");
      return;
    }

    setLives((prev) => Math.max(0, prev - 1));
    setSummary((prev) => ({ ...prev, wrong: prev.wrong + 1 }));
    setStatus("wrong");
  };

  const handleContinue = () => {
    if (phase === "summary") {
      onClose();
      return;
    }

    if (status === "correct") {
      setStepIndex((prev) => prev + 1);
    }

    setStatus("idle");
    setFeedback(null);
  };

  let questionNode = null;

  if (phase === "lesson") {
    if (step.type === "choice") {
      questionNode = <ChoiceQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "order") {
      questionNode = <OrderQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
    } else if (step.type === "text") {
      questionNode = <TextQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
    } else if (step.type === "cloze") {
      questionNode = <ClozeQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "listen_choice") {
      questionNode = <ListenChoiceQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "error_spot") {
      questionNode = <ErrorSpotQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "dictation") {
      questionNode = <DictationQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
    } else if (step.type === "cloze_text") {
      questionNode = <FreeInputClozeQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
    } else if (step.type === "listen_variation") {
      questionNode = <ListenVariationQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "fix_fragment") {
      questionNode = <FixFragmentQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    } else if (step.type === "speech") {
      questionNode = <SpeakingQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} />;
    } else {
      questionNode = <RolePlayQuestion question={step} onSubmit={handleSubmit} disabled={status !== "idle"} status={status} />;
    }
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
          <span className="grammar-heart-badge" aria-hidden="true">&hearts;</span>
          <span>{lives}</span>
        </div>

        <button type="button" className="grammar-unit-guide-toggle" onClick={() => setShowGuide((prev) => !prev)}>
          Guia da unidade
        </button>
      </div>

      {showGuide ? (
        <aside className="grammar-unit-guide-panel">
          <strong>{unit.title}</strong>
          <p>{unit.summary}</p>
          <ul>
            {(unit.guidePoints || []).map((point) => <li key={point}>{point}</li>)}
          </ul>
          <span>{unit.masterySignal}</span>
        </aside>
      ) : null}

      {phase === "intro" ? (
        <div className="grammar-lesson-intro">
          <div className="grammar-intro-icon">
            {unit.mode === "conversation" ? <MessageCircleMore size={34} /> : <PenSquare size={34} />}
          </div>
          <p className="grammar-intro-kicker">{formatConceptLabel(unit.conceptKey)}</p>
          <h1>{unit.title}</h1>
          <p className="grammar-intro-summary">{unit.summary}</p>
          <div className="grammar-intro-tags">
            {(unit.focusSkills || []).map((skill) => (
              <span key={skill} className="grammar-intro-tag">{skill}</span>
            ))}
          </div>
          <ul className="grammar-intro-points">
            {(unit.guidePoints || []).map((point) => <li key={point}>{point}</li>)}
          </ul>
          <div className="grammar-intro-signal">
            <CheckCircle2 size={18} />
            <span>{unit.masterySignal}</span>
          </div>
          <button type="button" className="grammar-finish-btn" onClick={() => setPhase("lesson")}>Comecar</button>
        </div>
      ) : null}

      {phase === "lesson" ? (
        <div className="grammar-lesson-body">
          <h1>{unit.title}</h1>
          <div className="grammar-audio-row">
            <button type="button" className="grammar-sound-btn" onClick={() => speakText(step.audioText || step.prompt || unit.title)}>
              <Volume2 size={24} />
            </button>
            <p>{step.supportingCopy || "Ouça o tema e responda as atividades abaixo"}</p>
          </div>
          {questionNode}
        </div>
      ) : null}

      {phase === "summary" ? (
        <div className="grammar-finish-card">
          <h2>Licao concluida</h2>
          <p>Acertos: {summary.correct}</p>
          <p>Erros: {summary.wrong}</p>
          <p>Coracoes restantes: {lives}</p>
          <p className="grammar-finish-note">
            {summary.wrong === 0
              ? "Excelente consistencia. Continue avancando."
              : "Bom trabalho. Revise os conceitos destacados e retorne para consolidar."}
          </p>
          {feedback ? (
            <div className={`grammar-feedback-panel is-${feedback.tone}`}>
              <strong>{feedback.title}</strong>
              <p>{feedback.summary}</p>
              <span>{feedback.microRule}</span>
            </div>
          ) : null}
          <button type="button" className="grammar-finish-btn" onClick={handleContinue}>Continuar</button>
        </div>
      ) : null}

      {phase === "lesson" && feedback ? (
        <div className={`grammar-feedback-bar is-${feedback.tone}`}>
          <div className="grammar-feedback-copy">
            <strong>{feedback.title}</strong>
            <p>{feedback.summary}</p>
            {feedback.correctAnswer ? <span>Resposta esperada: {feedback.correctAnswer}</span> : null}
            <small>{feedback.microRule}</small>
          </div>
          <button type="button" className="grammar-feedback-continue" onClick={handleContinue}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function GrammarPage({ setCurrentView, color = "#58cc02" }) {
  const defaultCompletedByLevel = useMemo(() => {
    const byLevel = {};
    LEVEL_ORDER.forEach((levelId) => {
      byLevel[levelId] =
        levelId === "A1" ? LEVEL_UNIT_MAP[levelId].filter((u) => u.completed).map((u) => u.id) : [];
    });
    return byLevel;
  }, []);
  const [currentLevel, setCurrentLevel] = useState("A1");
  const [completedByLevel, setCompletedByLevel] = useState(defaultCompletedByLevel);
  const [activeUnitId, setActiveUnitId] = useState(null);

  const [conceptScores, setConceptScores] = useState({});

  const [weakConcepts, setWeakConcepts] = useState([]);

  const [sessionResume, setSessionResume] = useState(null);

  const [recommendedReviewUnit, setRecommendedReviewUnit] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const grammar = progress.modules.grammar || {};
        const persistedByLevel = grammar.completed_units_by_level || {};
        const merged = { ...defaultCompletedByLevel };
        LEVEL_ORDER.forEach((levelId) => {
          const levelUnits = LEVEL_UNIT_MAP[levelId] || [];
          const sourceIds =
            Array.isArray(persistedByLevel[levelId])
              ? persistedByLevel[levelId]
              : levelId === "A1"
                ? grammar.completed_units || []
                : [];
          merged[levelId] = sourceIds.filter((id) => levelUnits.some((unit) => unit.id === id));
        });
        setCompletedByLevel(merged);

        setConceptScores(grammar.concept_scores || {});

        setWeakConcepts(Array.isArray(grammar.weak_concepts) ? grammar.weak_concepts : []);

        setSessionResume(grammar.session_resume || null);

        setRecommendedReviewUnit(grammar.recommended_review_unit || null);

        const persistedLevel = LEVEL_ORDER.includes(grammar.current_level) ? grammar.current_level : "A1";
        const persistedIndex = LEVEL_ORDER.indexOf(persistedLevel);
        const canUsePersisted =
          persistedIndex <= 0 ||
          (() => {
            const previousLevel = LEVEL_ORDER[persistedIndex - 1];
            const previousUnits = LEVEL_UNIT_MAP[previousLevel] || [];
            const previousCompleted = merged[previousLevel] || [];
            return previousCompleted.length >= previousUnits.length;
          })();
        setCurrentLevel(canUsePersisted ? persistedLevel : "A1");

        if (grammar.session_resume?.unitId) {
          setActiveUnitId(grammar.session_resume.unitId);
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

  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        const progress = await readProgress();
        progress.modules.grammar = {
          ...(progress.modules.grammar || {}),
          current_level: currentLevel,
        };
        await writeProgress(progress);
      } catch {
        // no-op
      }
    })();
  }, [currentLevel, loading]);

  const completedIds = useMemo(() => completedByLevel[currentLevel] || [], [completedByLevel, currentLevel]);

  const units = useMemo(() => {

    const base = LEVEL_UNIT_MAP[currentLevel] || [];

    return base.map((u) => enrichUnit({

      ...u,

      completed: completedIds.includes(u.id),

    }));

  }, [completedIds, currentLevel]);

  const reviewUnit = useMemo(() => buildReviewUnits([], conceptScores)[0] || null, [conceptScores]);

  const availableUnits = useMemo(() => (reviewUnit ? [enrichUnit(reviewUnit), ...units] : units), [reviewUnit, units]);

  const activeUnit = availableUnits.find((u) => u.id === activeUnitId) || null;

  const completedCount = units.filter((u) => u.completed).length;

  const isUnlocked = (index) => index === 0 || units[index - 1]?.completed;

  const conceptDashboard = useMemo(
    () =>
      Object.entries(conceptScores || {})
        .sort((a, b) => Number(a[1] || 0) - Number(b[1] || 0))
        .slice(0, 4),
    [conceptScores]
  );

  const saveSessionResume = useCallback(async (resumePayload) => {
    setSessionResume(resumePayload);
    try {
      const progress = await readProgress();
      progress.modules.grammar = {
        ...(progress.modules.grammar || {}),
        session_resume: resumePayload,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  }, []);

  const handleCompleteUnit = async (payload) => {

    const unitId = typeof payload === "string" ? payload : payload?.unitId;

    const nextIds = completedIds.includes(unitId) ? completedIds : [...completedIds, unitId];

    const attemptLog = Array.isArray(payload?.attemptLog) ? payload.attemptLog : [];

    const nextConceptScores = { ...conceptScores };
    attemptLog.forEach((attempt) => {
      const key = attempt.conceptKey || "grammar";
      const current = Number(nextConceptScores[key] || 50);
      nextConceptScores[key] = Math.max(0, Math.min(100, current + (attempt.correct ? 8 : -14)));
    });
    const nextWeakConcepts = Object.entries(nextConceptScores)
      .filter(([, value]) => Number(value || 0) < 55)
      .map(([key]) => key);
    const nextReviewUnit = buildReviewUnits([], nextConceptScores)[0] || null;

    const nextByLevel = {

      ...completedByLevel,

      [currentLevel]: nextIds,

    };

    setCompletedByLevel(nextByLevel);
    setConceptScores(nextConceptScores);
    setWeakConcepts(nextWeakConcepts);
    setRecommendedReviewUnit(nextReviewUnit);
    setSessionResume(null);

    try {

      const progress = await readProgress();

      progress.modules.grammar = {

        ...(progress.modules.grammar || {}),

        completed_units: nextByLevel.A1 || [],

        completed_units_by_level: nextByLevel,

        current_level: currentLevel,

        last_unit: unitId,

        concept_scores: nextConceptScores,

        weak_concepts: nextWeakConcepts,

        session_resume: null,

        recommended_review_unit: nextReviewUnit,

        lesson_history: [
          ...(Array.isArray(progress.modules.grammar?.lesson_history) ? progress.modules.grammar.lesson_history : []),
          {
            unit_id: unitId,
            level: currentLevel,
            summary: payload?.summary || { correct: 0, wrong: 0 },
            completed_at: new Date().toISOString(),
          },
        ].slice(-40),

        unit_attempts: {
          ...(progress.modules.grammar?.unit_attempts || {}),
          [unitId]: {
            attempts: attemptLog.length,
            correct: payload?.summary?.correct || 0,
            wrong: payload?.summary?.wrong || 0,
            updated_at: new Date().toISOString(),
          },
        },

      };

      await writeProgress(progress);

    } catch {

      // no-op

    }

  };

  if (activeUnit) {
    return (
      <section className="grammar-page-shell" style={themeVars(color)}>
        <LessonRunner
          unit={activeUnit}
          resumeState={sessionResume}
          onClose={() => {
            setActiveUnitId(null);
            saveSessionResume(null);
          }}
          onSaveSession={saveSessionResume}
          onComplete={handleCompleteUnit}
        />
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
          <div className="grammar-header-kicker">{currentLevel} • TRILHA DE GRAMMAR</div>
          <h1>{currentLevel === "A1" ? "Conteudo atual: A1" : `Nivel ${currentLevel} desbloqueado`}</h1>
        </div>
        <ModuleGuideButton moduleKey="grammar" color={color} className="grammar-guide-btn" />
      </div>

      <div className="grammar-progress-copy">Progresso: {completedCount}/{units.length} materias concluidas</div>

      {conceptDashboard.length ? (
        <div className="grammar-concept-board">
          {conceptDashboard.map(([conceptKey, score]) => (
            <article key={conceptKey} className={`grammar-concept-card is-${computeConceptStatus(score)}`}>
              <strong>{formatConceptLabel(conceptKey)}</strong>
              <span>{Math.round(score)}%</span>
            </article>
          ))}
        </div>
      ) : null}

      {reviewUnit ? (
        <div className="grammar-review-banner">
          <div>
            <p>Revisao recomendada</p>
            <strong>{reviewUnit.title}</strong>
            <span>Conceitos fracos: {weakConcepts.length ? weakConcepts.map(formatConceptLabel).join(", ") : "nenhum"}</span>
          </div>
          <button type="button" className="grammar-review-btn" onClick={() => setActiveUnitId(reviewUnit.id)}>
            Revisar agora
          </button>
        </div>
      ) : null}

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
          <div className="grammar-side-image grammar-side-insight">
            <AlertTriangle size={28} />
            <strong>Foque nos erros mais recorrentes</strong>
            <p>O modulo agora prioriza conceitos instaveis antes de liberar revisoes mais profundas.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

























