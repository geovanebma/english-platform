import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const GRAMMAR_SOURCE_PATH = path.resolve(SERVER_DIR, "..", "src", "components", "Grammar.jsx");
const ROLEPLAY_INSERT_INTERVAL = 3;

const LEVEL_TOPICS = {
  A2: [
    "Simple present review",
    "Questions with do/does",
    "Time and frequency adverbs",
    "Travel basics and directions",
    "Daily life conversations",
    "Future plans with going to",
  ],
  B1: [
    "Past simple vs present perfect",
    "Comparatives and superlatives",
    "Workplace communication",
    "Problem solving dialogues",
    "Conditionals type 1 and 2",
    "Opinion and argument structure",
  ],
  B2: [
    "Passive voice in context",
    "Reported speech",
    "Formal email and meetings",
    "Negotiation roleplay",
    "Advanced connectors",
    "Cause and consequence language",
  ],
  C1: [
    "Nuanced meaning and tone",
    "Inversion and emphasis",
    "Academic style responses",
    "Complex discussion roleplay",
    "Idiomatic fluency",
    "Precision in argumentation",
  ],
  C2: [
    "Near-native reformulation",
    "Advanced discourse markers",
    "Pragmatics and intent",
    "Leadership communication roleplay",
    "High-level writing accuracy",
    "C2 mastery consolidation",
  ],
};

const LEVEL_PROMPT_TRANSLATIONS = {
  "pt-BR": (level, topic) => `Tema ${level}: ${topic}. Qual opcao representa o foco correto da licao?`,
  "en-US": (level, topic) => `Theme ${level}: ${topic}. Which option represents the lesson focus?`,
  "es-ES": (level, topic) => `Tema ${level}: ${topic}. ¿Qué opción representa el enfoque correcto de la lección?`,
  "fr-FR": (level, topic) => `Thème ${level} : ${topic}. Quelle option représente le bon objectif de la leçon ?`,
  "zh-CN": (level, topic) => `主题 ${level}：${topic}。哪个选项最符合本课重点？`,
  "hi-IN": (level, topic) => `विषय ${level}: ${topic}. कौन सा विकल्प इस पाठ के सही फोकस को दिखाता है?`,
  "ar-SA": (level, topic) => `موضوع ${level}: ${topic}. أي خيار يعبّر عن تركيز الدرس بشكل صحيح؟`,
  "bn-BD": (level, topic) => `বিষয় ${level}: ${topic}. কোন অপশনটি পাঠের সঠিক ফোকাস দেখায়?`,
  "ru-RU": (level, topic) => `Тема ${level}: ${topic}. Какой вариант лучше всего отражает фокус урока?`,
  "ur-PK": (level, topic) => `موضوع ${level}: ${topic}. کون سا آپشن سبق کے درست فوکس کی نمائندگی کرتا ہے؟`,
};

const LEVEL_OPTION_TRANSLATIONS = {
  "pt-BR": ["Uso em contexto real", "Memorizacao isolada", "Traducao literal sem contexto"],
  "en-US": ["Use in real context", "Isolated memorization", "Literal translation without context"],
  "es-ES": ["Uso en contexto real", "Memorización aislada", "Traducción literal sin contexto"],
  "fr-FR": ["Utilisation en contexte réel", "Mémorisation isolée", "Traduction littérale sans contexte"],
  "zh-CN": ["在真实语境中使用", "孤立记忆", "脱离语境的直译"],
  "hi-IN": ["वास्तविक संदर्भ में उपयोग", "अलग-थलग याद करना", "बिना संदर्भ के शाब्दिक अनुवाद"],
  "ar-SA": ["الاستخدام في سياق حقيقي", "حفظ معزول", "ترجمة حرفية بلا سياق"],
  "bn-BD": ["বাস্তব প্রেক্ষাপটে ব্যবহার", "আলাদা করে মুখস্থ করা", "প্রেক্ষাপট ছাড়া আক্ষরিক অনুবাদ"],
  "ru-RU": ["Использование в реальном контексте", "Изолированное запоминание", "Буквальный перевод без контекста"],
  "ur-PK": ["حقیقی سیاق میں استعمال", "الگ تھلگ یاد کرنا", "سیاق کے بغیر لفظی ترجمہ"],
};

const PT_TEXT_CANONICAL_EN = {
  "Bom dia": "Good morning",
  "Boa tarde": "Good afternoon",
  "Boa noite": "Good evening",
  "Bom dia, Maria.": "Good morning, Maria.",
  "Boa tarde, Maria.": "Good afternoon, Maria.",
  "Boa noite, Maria.": "Good evening, Maria.",
  "Boa tarde, professor.": "Good afternoon, teacher.",
  "Boa tarde, professora.": "Good afternoon, teacher.",
  "Prazer em conhecer voce": "Nice to meet you",
  "Prazer em conhecer voce tambem.": "Nice to meet you too.",
  "Eu estou bem.": "I am fine.",
  "Qual e o seu nome?": "What is your name?",
  "Com licenca": "Excuse me",
  "Vejo voce amanha": "See you tomorrow",
  "Ate amanha.": "See you tomorrow.",
  "Eu escovo meus dentes": "I brush my teeth",
  "Eu faco jantar": "I make dinner",
  "Eu vou para escola": "I go to school",
  "Boa": "Good",
  "Bom": "Good",
  "noite,": "evening,",
  "tarde": "afternoon",
};

const A1_NATIVE_TEXT_BY_ENGLISH = {
  "es-ES": {
    "Basic greetings for different times of day, with focus on context and naturalness.": "Saludos básicos para distintos momentos del día, con foco en el contexto y la naturalidad.",
    "Use good morning until early afternoon.": "Usa good morning hasta el comienzo de la tarde.",
    "Good afternoon covers the afternoon.": "Good afternoon cubre la tarde.",
    "Good evening is usually used when arriving or greeting someone at night.": "Good evening suele usarse al llegar o saludar por la noche.",
    "You choose the correct greeting without depending on literal translation.": "Eliges el saludo correcto sin depender de una traducción literal.",
    "Select the correct translation for 'Good morning'.": "Selecciona la traducción correcta de 'Good morning'.",
    "Good morning matches the greeting used in the morning.": "Good morning corresponde al saludo usado por la mañana.",
    "Tap what you hear.": "Toca lo que escuches.",
    "In this context, good evening points to a nighttime greeting.": "En este contexto, good evening se refiere a un saludo nocturno.",
    "Build the sentence: 'Good evening, Maria.'": "Forma la frase: 'Good evening, Maria.'",
    "The correct order reinforces the full translation of the greeting.": "El orden correcto refuerza la traducción completa del saludo.",
    "Complete the sentence with the best option.": "Completa la frase con la mejor opción.",
    "Morning calls for good morning, not evening or night.": "La mañana pide good morning, no evening ni night.",
    "Write in Portuguese: 'Good afternoon, teacher.'": "Escribe en portugués: 'Good afternoon, teacher.'",
    "Good afternoon is used in the afternoon.": "Good afternoon se usa por la tarde.",
    "Say in English: 'Good morning, everyone.'": "Di en inglés: 'Good morning, everyone.'",
    "Repeat the full greeting out loud to reinforce pronunciation.": "Repite el saludo completo en voz alta para reforzar la pronunciación.",
    "Ask and answer names with a simple and polite structure.": "Preguntar y responder nombres con una estructura simple y educada.",
    "Which sentence means 'What is your name?'": "¿Qué frase significa 'What is your name?'",
    "What is your name is the standard way to ask someone's name.": "What is your name es la forma estándar de preguntar el nombre de alguien.",
    "Which option corrects the sentence below?": "¿Qué opción corrige la frase de abajo?",
    "With my name, the correct verb is is.": "Con my name, el verbo correcto es is.",
    "Build the answer in English for 'My name is Julia'.": "Forma la respuesta en inglés para 'My name is Julia'.",
    "The full answer structure is My name is Julia.": "La estructura completa de la respuesta es My name is Julia.",
    "Complete in English with your own answer.": "Completa en inglés con tu propia respuesta.",
    "The blank requires the correct form of the verb to be for introductions.": "El espacio requiere la forma correcta del verbo to be para presentaciones.",
    "Social introductions with short responses, listening, and guided writing.": "Presentaciones sociales con respuestas cortas, escucha y escritura guiada.",
    "Choose the translation of 'Nice to meet you'.": "Elige la traducción de 'Nice to meet you'.",
    "The expression shows pleasure when meeting someone.": "La expresión muestra agrado al conocer a alguien.",
    "Listen and select the best answer in Portuguese.": "Escucha y selecciona la mejor respuesta en portugués.",
    "The too indicates reciprocity: too.": "Too indica reciprocidad: también.",
    "Write in English: 'Nice to meet you too.'": "Escribe en inglés: 'Nice to meet you too.'",
    "The standard response uses too at the end.": "La respuesta estándar usa too al final.",
    "Say the answer in English for 'Nice to meet you too.'": "Di la respuesta en inglés para 'Nice to meet you too.'",
    "The spoken response helps automate the full social exchange.": "La respuesta hablada ayuda a automatizar el intercambio social completo.",
    "Short answers to ask and respond how you are.": "Respuestas cortas para preguntar y responder cómo estás.",
    "Choose the best answer for 'How are you?'": "Elige la mejor respuesta para 'How are you?'.",
    "An appropriate answer says how you are and may include thanks.": "Una respuesta adecuada dice cómo estás y puede incluir agradecimiento.",
    "Write exactly what you hear.": "Escribe exactamente lo que escuches.",
    "The sentence uses a short and natural response to how are you.": "La frase usa una respuesta corta y natural para how are you.",
    "Basic affirmative sentences with am, is and are in simple contexts.": "Oraciones afirmativas básicas con am, is y are en contextos simples.",
    "With I, we use am.": "Con I, usamos am.",
    "Choose the correct verb form.": "Elige la forma correcta del verbo.",
    "With she, the correct form is is.": "Con she, la forma correcta es is.",
    "Correct the wrong part of the sentence.": "Corrige la parte incorrecta de la frase.",
    "With they, we use are.": "Con they, usamos are.",
    "Good morning": "Buenos días",
    "Good afternoon": "Buenas tardes",
    "Good evening": "Buenas noches",
    "Good morning, Maria.": "Buenos días, Maria.",
    "Good afternoon, Maria.": "Buenas tardes, Maria.",
    "Good evening, Maria.": "Buenas noches, Maria.",
    "Good afternoon, teacher.": "Buenas tardes, profesor.",
    "Nice to meet you": "Mucho gusto",
    "Nice to meet you too.": "Mucho gusto también.",
    "I am fine.": "Estoy bien.",
    "What is your name?": "¿Cuál es tu nombre?",
    "Excuse me": "Con permiso",
    "See you tomorrow": "Te veo mañana",
    "See you tomorrow.": "Hasta mañana.",
    "I brush my teeth": "Me cepillo los dientes",
    "I make dinner": "Preparo la cena",
    "I go to school": "Voy a la escuela",
    "Good": "Buena",
    "evening,": "noche,",
    "afternoon": "tarde"
  },
  "fr-FR": {
    "Basic greetings for different times of day, with focus on context and naturalness.": "Salutations de base pour différents moments de la journée, avec un accent sur le contexte et le naturel.",
    "Use good morning until early afternoon.": "Utilise good morning jusqu'au début de l'après-midi.",
    "Good afternoon covers the afternoon.": "Good afternoon correspond à l'après-midi.",
    "Good evening is usually used when arriving or greeting someone at night.": "Good evening s'utilise généralement en arrivant ou en saluant quelqu'un le soir.",
    "You choose the correct greeting without depending on literal translation.": "Tu choisis la bonne salutation sans dépendre d'une traduction littérale.",
    "Select the correct translation for 'Good morning'.": "Choisis la bonne traduction de 'Good morning'.",
    "Good morning matches the greeting used in the morning.": "Good morning correspond à la salutation utilisée le matin.",
    "Tap what you hear.": "Appuie sur ce que tu entends.",
    "In this context, good evening points to a nighttime greeting.": "Dans ce contexte, good evening indique une salutation du soir.",
    "Build the sentence: 'Good evening, Maria.'": "Construis la phrase : 'Good evening, Maria.'",
    "The correct order reinforces the full translation of the greeting.": "L'ordre correct renforce la traduction complète de la salutation.",
    "Complete the sentence with the best option.": "Complète la phrase avec la meilleure option.",
    "Morning calls for good morning, not evening or night.": "Le matin demande good morning, pas evening ni night.",
    "Write in Portuguese: 'Good afternoon, teacher.'": "Écris en portugais : 'Good afternoon, teacher.'",
    "Good afternoon is used in the afternoon.": "Good afternoon s'utilise dans l'après-midi.",
    "Say in English: 'Good morning, everyone.'": "Dis en anglais : 'Good morning, everyone.'",
    "Repeat the full greeting out loud to reinforce pronunciation.": "Répète la salutation complète à voix haute pour renforcer la prononciation.",
    "Ask and answer names with a simple and polite structure.": "Demander et répondre aux noms avec une structure simple et polie.",
    "Which sentence means 'What is your name?'": "Quelle phrase signifie 'What is your name?'",
    "What is your name is the standard way to ask someone's name.": "What is your name est la formule standard pour demander le nom de quelqu'un.",
    "Which option corrects the sentence below?": "Quelle option corrige la phrase ci-dessous ?",
    "With my name, the correct verb is is.": "Avec my name, le verbe correct est is.",
    "Build the answer in English for 'My name is Julia'.": "Construis la réponse en anglais pour 'My name is Julia'.",
    "The full answer structure is My name is Julia.": "La structure complète de la réponse est My name is Julia.",
    "Complete in English with your own answer.": "Complète en anglais avec ta propre réponse.",
    "The blank requires the correct form of the verb to be for introductions.": "Le blanc demande la bonne forme du verbe to be pour les présentations.",
    "Social introductions with short responses, listening, and guided writing.": "Présentations sociales avec réponses courtes, écoute et écriture guidée.",
    "Choose the translation of 'Nice to meet you'.": "Choisis la traduction de 'Nice to meet you'.",
    "The expression shows pleasure when meeting someone.": "L'expression montre le plaisir de rencontrer quelqu'un.",
    "Listen and select the best answer in Portuguese.": "Écoute et choisis la meilleure réponse en portugais.",
    "The too indicates reciprocity: too.": "Le mot too indique la réciprocité : aussi.",
    "Write in English: 'Nice to meet you too.'": "Écris en anglais : 'Nice to meet you too.'",
    "The standard response uses too at the end.": "La réponse standard utilise too à la fin.",
    "Say the answer in English for 'Nice to meet you too.'": "Dis la réponse en anglais pour 'Nice to meet you too.'",
    "The spoken response helps automate the full social exchange.": "La réponse orale aide à automatiser l'échange social complet.",
    "Short answers to ask and respond how you are.": "Réponses courtes pour demander et dire comment on va.",
    "Choose the best answer for 'How are you?'": "Choisis la meilleure réponse pour 'How are you?'",
    "An appropriate answer says how you are and may include thanks.": "Une réponse appropriée dit comment tu vas et peut inclure un remerciement.",
    "Write exactly what you hear.": "Écris exactement ce que tu entends.",
    "The sentence uses a short and natural response to how are you.": "La phrase utilise une réponse courte et naturelle à how are you.",
    "Basic affirmative sentences with am, is and are in simple contexts.": "Phrases affirmatives de base avec am, is et are dans des contextes simples.",
    "With I, we use am.": "Avec I, on utilise am.",
    "Choose the correct verb form.": "Choisis la forme correcte du verbe.",
    "With she, the correct form is is.": "Avec she, la forme correcte est is.",
    "Correct the wrong part of the sentence.": "Corrige la partie incorrecte de la phrase.",
    "With they, we use are.": "Avec they, on utilise are.",
    "Good morning": "Bonjour",
    "Good afternoon": "Bon après-midi",
    "Good evening": "Bonsoir",
    "Good morning, Maria.": "Bonjour, Maria.",
    "Good afternoon, Maria.": "Bon après-midi, Maria.",
    "Good evening, Maria.": "Bonsoir, Maria.",
    "Good afternoon, teacher.": "Bon après-midi, professeur.",
    "Nice to meet you": "Ravi de vous rencontrer",
    "Nice to meet you too.": "Ravi de vous rencontrer aussi.",
    "I am fine.": "Je vais bien.",
    "What is your name?": "Comment tu t'appelles ?",
    "Excuse me": "Excusez-moi",
    "See you tomorrow": "Je te vois demain",
    "See you tomorrow.": "À demain.",
    "I brush my teeth": "Je me brosse les dents",
    "I make dinner": "Je prépare le dîner",
    "I go to school": "Je vais à l'école",
    "Good": "Bon",
    "evening,": "soir,",
    "afternoon": "après-midi"
  }
};

function toCanonicalEnglish(text, englishMap) {
  if (typeof text !== "string") return text;
  return PT_TEXT_CANONICAL_EN[text] || englishMap[text] || text;
}

function toLocaleNativeText(text, locale, englishMap) {
  if (typeof text !== "string") return text;
  const normalizedLocale = normalizeLocale(locale).toLowerCase();
  if (normalizedLocale.startsWith("pt")) return text;

  const englishText = toCanonicalEnglish(text, englishMap);
  if (normalizedLocale.startsWith("en")) return englishText;

  const localeMap = A1_NATIVE_TEXT_BY_ENGLISH[normalizeLocale(locale)] || {};
  return localeMap[englishText] || englishText;
}


export const SUPPORTED_GRAMMAR_CONTENT_LOCALES = [
  "en-US",
  "zh-CN",
  "hi-IN",
  "es-ES",
  "fr-FR",
  "ar-SA",
  "bn-BD",
  "pt-BR",
  "ru-RU",
  "ur-PK",
];

let cachedGrammarSource = null;

function walkAst(node, visitor) {
  if (!node || typeof node !== "object") return;
  visitor(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      value.forEach((item) => walkAst(item, visitor));
    } else if (value && typeof value === "object") {
      walkAst(value, visitor);
    }
  }
}

function literalKey(node) {
  if (!node) return "";
  if (node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "NumericLiteral") return String(node.value);
  throw new Error(`Unsupported object key type: ${node.type}`);
}

function extractLiteral(node) {
  if (!node) return null;
  switch (node.type) {
    case "StringLiteral":
    case "NumericLiteral":
    case "BooleanLiteral":
      return node.value;
    case "NullLiteral":
      return null;
    case "TemplateLiteral":
      if (node.expressions.length) {
        throw new Error("Template literals with expressions are not supported in grammar extraction.");
      }
      return node.quasis.map((item) => item.value.cooked || "").join("");
    case "ArrayExpression":
      return node.elements.map((item) => extractLiteral(item));
    case "ObjectExpression": {
      const output = {};
      node.properties.forEach((property) => {
        if (property.type !== "ObjectProperty") return;
        output[literalKey(property.key)] = extractLiteral(property.value);
      });
      return output;
    }
    default:
      throw new Error(`Unsupported literal node type: ${node.type}`);
  }
}

export async function extractGrammarSourceContent() {
  if (cachedGrammarSource) return cachedGrammarSource;

  const source = await fs.readFile(GRAMMAR_SOURCE_PATH, "utf8");
  const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });

  let englishMap = {};
  let baseUnits = [];
  let roleplayScenarios = [];

  walkAst(ast, (node) => {
    if (node.type !== "VariableDeclarator" || node.id?.type !== "Identifier") return;
    const name = node.id.name;
    if (name === "GRAMMAR_EN_TEXT") englishMap = extractLiteral(node.init) || {};
    if (name === "BASE_EXERCISE_UNITS") baseUnits = extractLiteral(node.init) || [];
    if (name === "ROLEPLAY_SCENARIOS") roleplayScenarios = extractLiteral(node.init) || [];
  });

  cachedGrammarSource = { englishMap, baseUnits, roleplayScenarios };
  return cachedGrammarSource;
}

function normalizeLocale(locale = "pt-BR") {
  return String(locale || "pt-BR").trim() || "pt-BR";
}

function toEnglishFallback(text, englishMap) {
  return toCanonicalEnglish(text, englishMap);
}

function deepLocalize(value, locale, englishMap) {
  if (typeof value === "string") {
    return toLocaleNativeText(value, locale, englishMap);
  }
  if (Array.isArray(value)) return value.map((item) => deepLocalize(item, locale, englishMap));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepLocalize(item, locale, englishMap)]));
  }
  return value;
}

function translationModeForLocale(locale) {
  if (locale === "pt-BR" || locale === "en-US") return "native";
  return "english_fallback";
}

function makeId(...parts) {
  return parts
    .flat()
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join("__")
    .replace(/[^a-zA-Z0-9_:-]+/g, "_");
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function bilingual(pt, en) {
  return { pt, en };
}

function localizeGeneratedValue(value, locale) {
  if (Array.isArray(value)) return value.map((item) => localizeGeneratedValue(item, locale));
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 2 && keys.includes("pt") && keys.includes("en")) {
      return String(locale || "").toLowerCase().startsWith("pt") ? value.pt : value.en;
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeGeneratedValue(item, locale)]));
  }
  return value;
}

const B1_DEEP_UNIT_SPECS = [
  {
    id: "b1_indirect_questions",
    conceptKey: "b1.indirect_questions",
    title: bilingual("Perguntas indiretas e perguntas mais naturais", "Indirect questions and more natural questions"),
    summary: bilingual("Treine formas mais educadas e fluidas de fazer perguntas no dia a dia.", "Practice more polite and fluid ways to ask questions in everyday situations."),
    masterySignal: bilingual("Voce consegue suavizar perguntas diretas sem perder clareza.", "You can soften direct questions without losing clarity."),
    guidePoints: [
      bilingual("Observe a ordem da frase depois de expressões como Could you tell me...?", "Notice sentence order after expressions like Could you tell me...?"),
      bilingual("Evite inverter o verbo na segunda parte da pergunta indireta.", "Avoid inverting the verb in the second part of an indirect question."),
      bilingual("Use esse formato para soar mais educado em contexto real.", "Use this pattern to sound more polite in real situations."),
    ],
    choicePrompt: bilingual("Qual opcao soa mais natural e educada?", "Which option sounds more natural and polite?"),
    choiceOptions: [
      "Could you tell me where the station is?",
      "Could you tell me where is the station?",
      "Where the station is, could you tell me?",
    ],
    choiceAnswer: "Could you tell me where the station is?",
    choiceExplanation: bilingual("Na pergunta indireta, mantemos a ordem afirmativa: where the station is.", "In an indirect question, we keep statement order: where the station is."),
    clozeSentence: "Could you tell me ___ the pharmacy is?",
    clozeOptions: ["where", "why", "how many"],
    clozeAnswer: "where",
    clozeExplanation: bilingual("A lacuna pede informacao de lugar.", "The blank asks for place information."),
    listenAudio: "Do you know if the meeting starts at nine?",
    listenOptions: [
      "She is asking about the meeting time.",
      "She is canceling the meeting.",
      "She is inviting people to lunch.",
    ],
    listenAnswer: "She is asking about the meeting time.",
    listenExplanation: bilingual("A frase quer confirmar um horario.", "The sentence checks a time."),
    textPrompt: bilingual("Reescreva de forma mais natural: Where is the station?", "Rewrite more naturally: Where is the station?"),
    textAnswer: "Could you tell me where the station is?",
    textAcceptedAnswers: [
      "Could you tell me where the station is?",
      "Can you tell me where the station is?",
      "Do you know where the station is?",
    ],
    textExplanation: bilingual("Apos Could you tell me / Can you tell me / Do you know, usamos ordem afirmativa.", "After Could you tell me / Can you tell me / Do you know, we use statement order."),
    orderTokens: ["Do", "you", "know", "if", "she", "is", "available", "today?"],
    orderBank: ["available", "today?", "if", "Do", "know", "is", "you", "she"],
    orderExplanation: bilingual("A estrutura correta e Do you know if she is available today?", "The correct structure is Do you know if she is available today?"),
    dictationAudio: "Could you tell me what time the class starts?",
    dictationExplanation: bilingual("Preste atencao na ordem depois de what time.", "Pay attention to the order after what time."),
    freeClozeSentence: "Do you know ___ he lives?",
    freeClozeAnswer: "where",
    freeClozeAcceptedAnswers: ["where"],
    freeClozeExplanation: bilingual("A pergunta pede informacao de lugar.", "The question asks for place information."),
    speechPrompt: bilingual("Diga em ingles: Could you tell me where the manager is?", "Say in English: Could you tell me where the manager is?"),
    speechAudio: "Could you tell me where the manager is?",
    speechExplanation: bilingual("Repita a estrutura completa para automatizar o padrao.", "Repeat the full structure to automate the pattern."),
    roleplayTitle: bilingual("Recepcao do escritorio", "Office reception"),
    roleplayContext: bilingual("Voce chegou a um escritorio e precisa falar com uma pessoa da equipe.", "You arrived at an office and need to speak to someone on the team."),
    roleplayDialogue: [
      { speaker: "Visitor", text: "Hi. I am here for a meeting with Laura." },
      { speaker: "Receptionist", text: "Sure. Could you tell me your company name?" },
      { speaker: "Visitor", text: "I work for Bright Labs." },
    ],
    roleplayQuestion: bilingual("Qual pergunta abaixo segue o mesmo padrao educado?", "Which question below follows the same polite pattern?"),
    roleplayOptions: [
      "Could you tell me if Laura is available now?",
      "Could you tell me if is Laura available now?",
      "Laura is available now, could you tell me?",
    ],
    roleplayAnswer: "Could you tell me if Laura is available now?",
    roleplayExplanation: bilingual("Mantemos if Laura is available, sem inverter o verbo.", "We keep if Laura is available, without inverting the verb."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "Do you know where they are staying?",
      "Do you know where are they staying?",
      "Where they are staying do you know?",
    ],
    recapChoiceAnswer: "Do you know where they are staying?",
    recapChoiceExplanation: bilingual("Em perguntas indiretas, a ordem continua afirmativa.", "In indirect questions, the order stays affirmative."),
    recapTextPrompt: bilingual("Transforme em pergunta indireta: When does the store close?", "Turn into an indirect question: When does the store close?"),
    recapTextAnswer: "Do you know when the store closes?",
    recapTextAcceptedAnswers: [
      "Do you know when the store closes?",
      "Could you tell me when the store closes?",
      "Can you tell me when the store closes?",
    ],
    recapTextExplanation: bilingual("O verbo volta para a ordem afirmativa: the store closes.", "The verb returns to statement order: the store closes."),
    recapSpeechPrompt: bilingual("Diga: Do you know if the bank is open?", "Say: Do you know if the bank is open?"),
    recapSpeechAudio: "Do you know if the bank is open?",
    recapSpeechExplanation: bilingual("Fale a frase completa com ritmo natural.", "Say the full sentence with natural rhythm."),
  },
  {
    id: "b1_present_perfect_markers",
    conceptKey: "b1.present_perfect_markers",
    title: bilingual("Present perfect com for, since, already, yet, ever e just", "Present perfect with for, since, already, yet, ever, and just"),
    summary: bilingual("Consolide o present perfect para experiencia, duracao e acoes recentes.", "Consolidate the present perfect for experience, duration, and recent actions."),
    masterySignal: bilingual("Voce escolhe o marcador correto sem confundir duracao, experiencia e resultado recente.", "You choose the right marker without confusing duration, experience, and recent result."),
    guidePoints: [
      bilingual("Use for com periodo de tempo e since com ponto de inicio.", "Use for with a period of time and since with a starting point."),
      bilingual("Already costuma aparecer em afirmativas; yet em negativas e perguntas.", "Already usually appears in affirmatives; yet in negatives and questions."),
      bilingual("Ever e never falam de experiencia; just fala de algo muito recente.", "Ever and never talk about experience; just talks about something very recent."),
    ],
    choicePrompt: bilingual("Qual frase esta correta?", "Which sentence is correct?"),
    choiceOptions: [
      "I have lived here for three years.",
      "I have lived here since three years.",
      "I live here for three years.",
    ],
    choiceAnswer: "I have lived here for three years.",
    choiceExplanation: bilingual("For combina com um periodo: for three years.", "For matches a period: for three years."),
    clozeSentence: "She has worked here ___ 2022.",
    clozeOptions: ["since", "for", "already"],
    clozeAnswer: "since",
    clozeExplanation: bilingual("2022 e um ponto de inicio, entao usamos since.", "2022 is a starting point, so we use since."),
    listenAudio: "I have just finished the report.",
    listenOptions: [
      "The report was completed a moment ago.",
      "The report will be finished tomorrow.",
      "The speaker has not started the report.",
    ],
    listenAnswer: "The report was completed a moment ago.",
    listenExplanation: bilingual("Just indica algo muito recente.", "Just signals something very recent."),
    textPrompt: bilingual("Escreva uma frase com already sobre enviar um email.", "Write a sentence with already about sending an email."),
    textAnswer: "I have already sent the email.",
    textAcceptedAnswers: [
      "I have already sent the email.",
      "I've already sent the email.",
    ],
    textExplanation: bilingual("Already destaca que a acao ja foi concluida.", "Already highlights that the action is already complete."),
    orderTokens: ["She", "has", "already", "finished", "her", "report."],
    orderBank: ["already", "report.", "finished", "She", "her", "has"],
    orderExplanation: bilingual("Already entra entre has e o participio.", "Already goes between has and the participle."),
    dictationAudio: "Have you ever tried Korean food?",
    dictationExplanation: bilingual("Perceba o uso de ever para experiencia de vida.", "Notice the use of ever for life experience."),
    freeClozeSentence: "We have been friends ___ 2018.",
    freeClozeAnswer: "since",
    freeClozeAcceptedAnswers: ["since"],
    freeClozeExplanation: bilingual("2018 marca o inicio da relacao.", "2018 marks the start of the relationship."),
    speechPrompt: bilingual("Diga em ingles: I have just sent the invoice.", "Say in English: I have just sent the invoice."),
    speechAudio: "I have just sent the invoice.",
    speechExplanation: bilingual("Use just entre have e o verbo principal.", "Use just between have and the main verb."),
    roleplayTitle: bilingual("Reuniao de projeto", "Project meeting"),
    roleplayContext: bilingual("Voce esta atualizando a equipe sobre tarefas recentes e experiencia anterior.", "You are updating the team about recent tasks and previous experience."),
    roleplayDialogue: [
      { speaker: "Lead", text: "Have you finished the client summary yet?" },
      { speaker: "Analyst", text: "Yes, I have already shared it with the design team." },
      { speaker: "Lead", text: "Great. Have you ever worked on a launch like this before?" },
    ],
    roleplayQuestion: bilingual("Qual resposta usa o marcador correto para experiencia?", "Which answer uses the correct marker for experience?"),
    roleplayOptions: [
      "Yes, I have worked on two similar launches before.",
      "Yes, I have just worked on two similar launches before.",
      "Yes, I work on two similar launches before.",
    ],
    roleplayAnswer: "Yes, I have worked on two similar launches before.",
    roleplayExplanation: bilingual("Para experiencia de vida, o present perfect simples funciona bem com before.", "For life experience, the present perfect simple works well with before."),
    recapChoicePrompt: bilingual("Escolha a opcao correta.", "Choose the correct option."),
    recapChoiceOptions: [
      "They haven't replied yet.",
      "They haven't replied already.",
      "They didn't replied yet.",
    ],
    recapChoiceAnswer: "They haven't replied yet.",
    recapChoiceExplanation: bilingual("Yet e natural em negativas e perguntas.", "Yet is natural in negatives and questions."),
    recapTextPrompt: bilingual("Responda em ingles: Sim, eu ja terminei.", "Answer in English: Yes, I have already finished."),
    recapTextAnswer: "Yes, I have already finished.",
    recapTextAcceptedAnswers: [
      "Yes, I have already finished.",
      "Yes, I've already finished.",
    ],
    recapTextExplanation: bilingual("A estrutura correta e have + already + participio.", "The correct structure is have + already + participle."),
    recapSpeechPrompt: bilingual("Diga: Have you ever visited Canada?", "Say: Have you ever visited Canada?"),
    recapSpeechAudio: "Have you ever visited Canada?",
    recapSpeechExplanation: bilingual("Use ever para perguntar sobre experiencias.", "Use ever to ask about experiences."),
  },
  {
    id: "b1_present_perfect_vs_past",
    conceptKey: "b1.present_perfect_vs_past",
    title: bilingual("Present perfect x simple past", "Present perfect vs simple past"),
    summary: bilingual("Diferencie experiencia e conexao com o presente de tempo fechado no passado.", "Differentiate experience and present relevance from finished time in the past."),
    masterySignal: bilingual("Voce identifica quando o tempo importa mais do que o resultado atual.", "You identify when time matters more than present result."),
    guidePoints: [
      bilingual("Use simple past com yesterday, last week, in 2020 e outros tempos fechados.", "Use the simple past with yesterday, last week, in 2020, and other finished times."),
      bilingual("Use present perfect quando o foco estiver na experiencia ou no resultado atual.", "Use the present perfect when the focus is on experience or present result."),
      bilingual("Nao use present perfect com marcadores fechados como yesterday.", "Do not use the present perfect with finished markers like yesterday."),
    ],
    choicePrompt: bilingual("Qual frase esta correta?", "Which sentence is correct?"),
    choiceOptions: [
      "I saw that movie last night.",
      "I have seen that movie last night.",
      "I have saw that movie last night.",
    ],
    choiceAnswer: "I saw that movie last night.",
    choiceExplanation: bilingual("Last night pede simple past.", "Last night requires the simple past."),
    clozeSentence: "She ___ to Rome three times.",
    clozeOptions: ["has been", "went", "has went"],
    clozeAnswer: "has been",
    clozeExplanation: bilingual("Three times mostra experiencia, sem tempo fechado.", "Three times shows experience, with no finished time."),
    listenAudio: "We finished the prototype yesterday.",
    listenOptions: [
      "The action happened at a finished past time.",
      "The action is unfinished now.",
      "The speaker is asking about experience.",
    ],
    listenAnswer: "The action happened at a finished past time.",
    listenExplanation: bilingual("Yesterday fecha o tempo no passado.", "Yesterday closes the time in the past."),
    textPrompt: bilingual("Complete com a melhor forma verbal: I ___ never ___ sushi before.", "Complete with the best verb form: I ___ never ___ sushi before."),
    textAnswer: "have tried",
    textAcceptedAnswers: ["have tried"],
    textExplanation: bilingual("Never + experiencia pede present perfect.", "Never + experience calls for the present perfect."),
    orderTokens: ["Have", "you", "ever", "worked", "with", "this", "software?"],
    orderBank: ["ever", "worked", "software?", "this", "you", "with", "Have"],
    orderExplanation: bilingual("A pergunta de experiencia usa Have you ever + participio.", "An experience question uses Have you ever + past participle."),
    dictationAudio: "I met her in 2019.",
    dictationExplanation: bilingual("In 2019 indica um momento fechado no passado.", "In 2019 indicates a finished time in the past."),
    freeClozeSentence: "He has ___ finished the proposal, so we can send it now.",
    freeClozeAnswer: "just",
    freeClozeAcceptedAnswers: ["just"],
    freeClozeExplanation: bilingual("O foco esta no resultado atual da acao.", "The focus is on the action's present result."),
    speechPrompt: bilingual("Diga em ingles: Eu vi esse documento ontem.", "Say in English: I saw that document yesterday."),
    speechAudio: "I saw that document yesterday.",
    speechExplanation: bilingual("Yesterday combina com simple past.", "Yesterday goes with the simple past."),
    roleplayTitle: bilingual("Atualizacao de equipe", "Team update"),
    roleplayContext: bilingual("Voce esta explicando o que terminou ontem e o que ja concluiu hoje.", "You are explaining what you finished yesterday and what you have already completed today."),
    roleplayDialogue: [
      { speaker: "Manager", text: "Did you call the supplier yesterday?" },
      { speaker: "Coordinator", text: "Yes, I called them yesterday afternoon." },
      { speaker: "Manager", text: "And have you already sent the revised schedule?" },
    ],
    roleplayQuestion: bilingual("Qual resposta combina com a segunda pergunta?", "Which answer fits the second question?"),
    roleplayOptions: [
      "Yes, I have already sent it.",
      "Yes, I sent it yesterday already.",
      "Yes, I have sent it yesterday.",
    ],
    roleplayAnswer: "Yes, I have already sent it.",
    roleplayExplanation: bilingual("Sem tempo fechado, o foco vai para o resultado atual.", "Without a finished time, the focus goes to the present result."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "I have never visited Chile.",
      "I never have visited Chile.",
      "I didn't visited Chile.",
    ],
    recapChoiceAnswer: "I have never visited Chile.",
    recapChoiceExplanation: bilingual("Para experiencia ate agora, use present perfect.", "For experience up to now, use the present perfect."),
    recapTextPrompt: bilingual("Escreva em ingles: Ela terminou o contrato na sexta-feira.", "Write in English: She finished the contract on Friday."),
    recapTextAnswer: "She finished the contract on Friday.",
    recapTextAcceptedAnswers: ["She finished the contract on Friday."],
    recapTextExplanation: bilingual("On Friday fecha o tempo e pede simple past.", "On Friday closes the time and calls for the simple past."),
    recapSpeechPrompt: bilingual("Diga: Have you ever worked remotely?", "Say: Have you ever worked remotely?"),
    recapSpeechAudio: "Have you ever worked remotely?",
    recapSpeechExplanation: bilingual("Use a estrutura para perguntar sobre experiencia.", "Use the structure to ask about experience."),
  },
  {
    id: "b1_modals_review",
    conceptKey: "b1.modals_review",
    title: bilingual("Modals para conselho, obrigacao e possibilidade", "Modals for advice, obligation, and possibility"),
    summary: bilingual("Revise should, must, have to, might e can't em situacoes de trabalho e rotina.", "Review should, must, have to, might, and can't in work and daily-life situations."),
    masterySignal: bilingual("Voce escolhe o modal pelo significado, e nao so pela forma.", "You choose the modal by meaning, not only by form."),
    guidePoints: [
      bilingual("Use should para conselho e recomendacao.", "Use should for advice and recommendation."),
      bilingual("Use must e have to para obrigacao, com diferencas leves de contexto.", "Use must and have to for obligation, with slight context differences."),
      bilingual("Use might para possibilidade e can't para deducao negativa forte.", "Use might for possibility and can't for strong negative deduction."),
    ],
    choicePrompt: bilingual("Qual frase expressa conselho?", "Which sentence expresses advice?"),
    choiceOptions: [
      "You should talk to your manager.",
      "You must talk to your manager yesterday.",
      "You might talk to your manager every day.",
    ],
    choiceAnswer: "You should talk to your manager.",
    choiceExplanation: bilingual("Should expressa conselho de forma natural.", "Should expresses advice naturally."),
    clozeSentence: "You ___ wear a badge to enter the building.",
    clozeOptions: ["have to", "might", "shouldn't"],
    clozeAnswer: "have to",
    clozeExplanation: bilingual("A frase fala de uma regra ou exigencia.", "The sentence describes a rule or requirement."),
    listenAudio: "She might be late because the train is delayed.",
    listenOptions: [
      "There is a possibility that she will be late.",
      "She is definitely late.",
      "She was late yesterday.",
    ],
    listenAnswer: "There is a possibility that she will be late.",
    listenExplanation: bilingual("Might indica possibilidade, nao certeza.", "Might indicates possibility, not certainty."),
    textPrompt: bilingual("Escreva em ingles: Voce nao deveria enviar isso agora.", "Write in English: You should not send this now."),
    textAnswer: "You shouldn't send this now.",
    textAcceptedAnswers: [
      "You shouldn't send this now.",
      "You should not send this now.",
    ],
    textExplanation: bilingual("Shouldn't transmite conselho negativo.", "Shouldn't gives negative advice."),
    orderTokens: ["He", "must", "finish", "the", "safety", "training", "today."],
    orderBank: ["today.", "must", "finish", "He", "training", "the", "safety"],
    orderExplanation: bilingual("Must vem antes do verbo base finish.", "Must comes before the base verb finish."),
    dictationAudio: "You can't be serious.",
    dictationExplanation: bilingual("Aqui can't expressa uma deducao negativa forte.", "Here can't expresses a strong negative deduction."),
    freeClozeSentence: "We ___ leave now, or we will miss the bus.",
    freeClozeAnswer: "must",
    freeClozeAcceptedAnswers: ["must"],
    freeClozeExplanation: bilingual("A situacao pede urgencia e obrigacao.", "The situation shows urgency and obligation."),
    speechPrompt: bilingual("Diga em ingles: We might need more time.", "Say in English: We might need more time."),
    speechAudio: "We might need more time.",
    speechExplanation: bilingual("Use might para uma possibilidade ainda aberta.", "Use might for an open possibility."),
    roleplayTitle: bilingual("Regras do escritorio", "Office rules"),
    roleplayContext: bilingual("Voce esta explicando politicas do escritorio para um novo colega.", "You are explaining office policies to a new coworker."),
    roleplayDialogue: [
      { speaker: "New hire", text: "Can I enter the lab without a badge?" },
      { speaker: "Supervisor", text: "No. You have to wear your badge at all times." },
      { speaker: "New hire", text: "And what should I do if I lose it?" },
    ],
    roleplayQuestion: bilingual("Qual resposta combina melhor com a ultima pergunta?", "Which answer best fits the last question?"),
    roleplayOptions: [
      "You should call security immediately.",
      "You must calling security immediately.",
      "You might late for the meeting.",
    ],
    roleplayAnswer: "You should call security immediately.",
    roleplayExplanation: bilingual("A pergunta pede conselho, entao should e a melhor escolha.", "The question asks for advice, so should is the best choice."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "He can't be at home; his car isn't here.",
      "He can't to be at home; his car isn't here.",
      "He doesn't can be at home; his car isn't here.",
    ],
    recapChoiceAnswer: "He can't be at home; his car isn't here.",
    recapChoiceExplanation: bilingual("Depois de can't, usamos verbo base: be.", "After can't, we use the base verb: be."),
    recapTextPrompt: bilingual("Escreva em ingles: Eu tenho que terminar isso hoje.", "Write in English: I have to finish this today."),
    recapTextAnswer: "I have to finish this today.",
    recapTextAcceptedAnswers: ["I have to finish this today."],
    recapTextExplanation: bilingual("Have to expressa necessidade externa ou obrigacao pratica.", "Have to expresses external need or practical obligation."),
    recapSpeechPrompt: bilingual("Diga: You should ask for help.", "Say: You should ask for help."),
    recapSpeechAudio: "You should ask for help.",
    recapSpeechExplanation: bilingual("Repita a estrutura curta de conselho.", "Repeat the short advice structure."),
  },  {
    id: "c1_confusing_pairs_collocations",
    conceptKey: "c1.confusing_pairs_collocations",
    title: bilingual("Pares confusos e collocations de alto uso", "Confusing pairs and high-use collocations"),
    summary: bilingual("Refine o uso de pares como discuss/argue, remember/remind, hear/listen e outras combinacoes sensiveis.", "Refine the use of pairs like discuss/argue, remember/remind, hear/listen, and other sensitive combinations."),
    masterySignal: bilingual("Voce evita erros de vocabulario fino que denunciam falta de naturalidade.", "You avoid fine-grained vocabulary errors that signal a lack of naturalness."),
    guidePoints: [
      bilingual("Discuss nao pede about na estrutura mais direta.", "Discuss does not take about in the most direct structure."),
      bilingual("Remember e remind mudam de funcao e de sujeito na frase.", "Remember and remind change the function and the subject of the sentence."),
      bilingual("Ouvir passivamente e diferente de escutar com atencao: hear x listen.", "Passive hearing is different from attentive listening: hear vs listen."),
    ],
    choicePrompt: bilingual("Qual frase esta correta?", "Which sentence is correct?"),
    choiceOptions: [
      "We need to discuss the proposal today.",
      "We need to discuss about the proposal today.",
      "We need argue the proposal today.",
    ],
    choiceAnswer: "We need to discuss the proposal today.",
    choiceExplanation: bilingual("Discuss vai direto ao objeto: discuss the proposal.", "Discuss goes directly to the object: discuss the proposal."),
    clozeSentence: "Could you ___ me to call the client at four?",
    clozeOptions: ["remind", "remember", "discuss"],
    clozeAnswer: "remind",
    clozeExplanation: bilingual("Remind pede alguem + to do algo.", "Remind takes someone + to do something."),
    listenAudio: "I heard a noise, but I didn't listen carefully.",
    listenOptions: [
      "The speaker contrasts passive perception and intentional attention.",
      "The speaker is describing two identical actions.",
      "The speaker is talking about memory only.",
    ],
    listenAnswer: "The speaker contrasts passive perception and intentional attention.",
    listenExplanation: bilingual("Hear e listen representam tipos diferentes de percepcao auditiva.", "Hear and listen represent different kinds of auditory perception."),
    textPrompt: bilingual("Escreva em ingles: Ela me lembrou de enviar o contrato.", "Write in English: She reminded me to send the contract."),
    textAnswer: "She reminded me to send the contract.",
    textAcceptedAnswers: ["She reminded me to send the contract."],
    textExplanation: bilingual("Remind someone to do something e a estrutura adequada.", "Remind someone to do something is the proper structure."),
    orderTokens: ["I", "can", "hear", "the", "music,", "but", "I", "am", "not", "listening", "to", "it."],
    orderBank: ["I", "listening", "hear", "can", "the", "to", "am", "it.", "music,", "but", "I", "not"],
    orderExplanation: bilingual("Hear x listening mostra percepcao passiva versus atencao ativa.", "Hear vs listening shows passive perception versus active attention."),
    dictationAudio: "Please remind me to review the figures before the meeting.",
    dictationExplanation: bilingual("Observe a estrutura remind me to review.", "Notice the structure remind me to review."),
    freeClozeSentence: "They argued ___ the budget for two hours.",
    freeClozeAnswer: "about",
    freeClozeAcceptedAnswers: ["about"],
    freeClozeExplanation: bilingual("Argue sobre um tema normalmente usa about.", "Argue about a topic normally uses about."),
    speechPrompt: bilingual("Diga em ingles: I remember meeting her years ago.", "Say in English: I remember meeting her years ago."),
    speechAudio: "I remember meeting her years ago.",
    speechExplanation: bilingual("Remember + gerund olha para uma memoria real do passado.", "Remember + gerund looks at a real memory from the past."),
    roleplayTitle: bilingual("Revisao editorial", "Editorial review"),
    roleplayContext: bilingual("Voce esta revisando um texto para deixa-lo mais natural e preciso.", "You are reviewing a text to make it more natural and precise."),
    roleplayDialogue: [
      { speaker: "Editor", text: "The draft says 'we discussed about the issue'." },
      { speaker: "Writer", text: "Right, that sounds off. We should say 'we discussed the issue'." },
      { speaker: "Editor", text: "Exactly. And later we can say 'they argued about the solution'." },
    ],
    roleplayQuestion: bilingual("Qual frase segue essa mesma logica de uso?", "Which sentence follows the same logic of use?"),
    roleplayOptions: [
      "Can you remind me to update the appendix?",
      "Can you remember me to update the appendix?",
      "Can you discuss me to update the appendix?",
    ],
    roleplayAnswer: "Can you remind me to update the appendix?",
    roleplayExplanation: bilingual("Remind me to update esta gramatical e natural.", "Remind me to update is grammatical and natural."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "I listened to the podcast, but I didn't hear the last part clearly.",
      "I heard to the podcast, but I didn't listen the last part clearly.",
      "I listened the podcast, but I didn't hear clearly the last part.",
    ],
    recapChoiceAnswer: "I listened to the podcast, but I didn't hear the last part clearly.",
    recapChoiceExplanation: bilingual("Listen pede to; hear nao.", "Listen takes to; hear does not."),
    recapTextPrompt: bilingual("Escreva em ingles: Eles discutiram a proposta por horas.", "Write in English: They discussed the proposal for hours."),
    recapTextAnswer: "They discussed the proposal for hours.",
    recapTextAcceptedAnswers: ["They discussed the proposal for hours."],
    recapTextExplanation: bilingual("Discuss vai direto ao objeto.", "Discuss goes straight to the object."),
    recapSpeechPrompt: bilingual("Diga: Please remind her to call me.", "Say: Please remind her to call me."),
    recapSpeechAudio: "Please remind her to call me.",
    recapSpeechExplanation: bilingual("Repita a estrutura com alguem + to do something.", "Repeat the structure with someone + to do something."),
  },  {
    id: "c1_pronunciation_orthography",
    conceptKey: "c1.pronunciation_orthography",
    title: bilingual("Pronuncia avancada, heteronyms e ortografia", "Advanced pronunciation, heteronyms, and orthography"),
    summary: bilingual("Trabalhe tough/thought/though/through, apostrophe, tonic stress e pares de pronuncia confusos.", "Work on tough/thought/though/through, apostrophe, stress, and confusing pronunciation pairs."),
    masterySignal: bilingual("Voce reconhece e produz contrastes de pronuncia que geram ruido em niveis altos.", "You recognize and produce pronunciation contrasts that create noise at high levels."),
    guidePoints: [
      bilingual("Palavras parecidas na escrita podem soar muito diferentes.", "Words that look similar in spelling can sound very different."),
      bilingual("Apostrophe muda sentido e estrutura em varios contextos.", "The apostrophe changes meaning and structure in several contexts."),
      bilingual("Stress lexical pode mudar a naturalidade e ate a classe gramatical da palavra.", "Lexical stress can change naturalness and even the word class."),
    ],
    choicePrompt: bilingual("Qual opcao contem palavras com pronuncias bem diferentes apesar da grafia parecida?", "Which option contains words with very different pronunciations despite similar spelling?"),
    choiceOptions: [
      "though / through / tough / thought",
      "cat / hat / flat / map",
      "book / look / cook / took",
    ],
    choiceAnswer: "though / through / tough / thought",
    choiceExplanation: bilingual("Esse grupo e classico para mostrar que grafia parecida nao garante som parecido.", "This group is classic for showing that similar spelling does not guarantee similar sound."),
    clozeSentence: "The apostrophe is correct in: ___",
    clozeOptions: ["the company's results", "the companys results", "the companies result's"],
    clozeAnswer: "the company's results",
    clozeExplanation: bilingual("Company's marca posse de uma empresa.", "Company's marks possession by one company."),
    listenAudio: "The noun record and the verb record usually differ in stress.",
    listenOptions: [
      "Stress can change across word classes.",
      "The two words are always pronounced identically.",
      "Apostrophes determine both meanings.",
    ],
    listenAnswer: "Stress can change across word classes.",
    listenExplanation: bilingual("Record pode mudar a silaba tonica conforme a funcao.", "Record can change stress according to its function."),
    textPrompt: bilingual("Escreva em ingles com apostrofo correto: os resultados da empresa", "Write in English with the correct apostrophe: the company's results"),
    textAnswer: "the company's results",
    textAcceptedAnswers: ["the company's results"],
    textExplanation: bilingual("Apostrofo antes do s marca posse no singular.", "An apostrophe before s marks singular possession."),
    orderTokens: ["The", "report", "was", "thorough,", "but", "the", "process", "was", "tough."],
    orderBank: ["The", "process", "but", "report", "was", "the", "thorough,", "was", "tough."],
    orderExplanation: bilingual("Thorough e tough parecem proximos na escrita, mas soam bem diferentes.", "Thorough and tough look close in writing, but sound quite different."),
    dictationAudio: "Although the route was rough, the thought behind it was sound.",
    dictationExplanation: bilingual("A frase ajuda a trabalhar pares com grafia e pronuncia traiçoeiras.", "The sentence helps practice pairs with tricky spelling and pronunciation."),
    freeClozeSentence: "The plural possessive form in 'the clients' meeting' needs an apostrophe after the ___.",
    freeClozeAnswer: "s",
    freeClozeAcceptedAnswers: ["s"],
    freeClozeExplanation: bilingual("No plural regular, o apostrofo vem depois do s.", "In the regular plural, the apostrophe comes after the s."),
    speechPrompt: bilingual("Diga em ingles: tough, thought, though, through", "Say in English: tough, thought, though, through"),
    speechAudio: "tough thought though through",
    speechExplanation: bilingual("Fale o grupo completo para separar bem cada som.", "Say the full group to separate each sound clearly."),
    roleplayTitle: bilingual("Treino de apresentacao oral", "Oral presentation training"),
    roleplayContext: bilingual("Voce esta treinando uma apresentacao e revisando pronuncia e escrita fina.", "You are rehearsing a presentation and reviewing fine-grained pronunciation and writing."),
    roleplayDialogue: [
      { speaker: "Coach", text: "Your message is strong, but the stress in 'record' changes when it becomes a verb." },
      { speaker: "Speaker", text: "Right, and I also need to fix the apostrophe in the slide title." },
      { speaker: "Coach", text: "Exactly. Small details like that affect how polished you sound." },
    ],
    roleplayQuestion: bilingual("Qual frase combina melhor com essa revisao?", "Which sentence best matches this review?"),
    roleplayOptions: [
      "The editor noticed that the company's tone sounded more formal.",
      "The editor noticed that the companys tone sounded more formal.",
      "The editor notice that the company's tone sound more formal.",
    ],
    roleplayAnswer: "The editor noticed that the company's tone sounded more formal.",
    roleplayExplanation: bilingual("A frase traz apostrofo correto e estrutura natural.", "The sentence has the correct apostrophe and a natural structure."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "The team's response was thoughtful, not just quick.",
      "The teams response was thoughtful, not just quick.",
      "The team's response was thoughtfull, not just quick.",
    ],
    recapChoiceAnswer: "The team's response was thoughtful, not just quick.",
    recapChoiceExplanation: bilingual("Apostrofo e ortografia precisam estar corretos ao mesmo tempo.", "The apostrophe and spelling both need to be correct."),
    recapTextPrompt: bilingual("Escreva em ingles: a decisão dos clientes", "Write in English: the clients' decision"),
    recapTextAnswer: "the clients' decision",
    recapTextAcceptedAnswers: ["the clients' decision"],
    recapTextExplanation: bilingual("Clients e plural; o apostrofo vem depois do s.", "Clients is plural; the apostrophe comes after the s."),
    recapSpeechPrompt: bilingual("Diga: The noun record, the verb record.", "Say: The noun record, the verb record."),
    recapSpeechAudio: "The noun record, the verb record.",
    recapSpeechExplanation: bilingual("Repita prestando atencao na tonicidade diferente.", "Repeat while paying attention to the different stress."),
  },
];

const B2_DEEP_UNIT_SPECS = [
  {
    id: "b2_contrast_linkers",
    conceptKey: "b2.contrast_linkers",
    title: bilingual("Conectores de contraste e causa com mais controle", "Contrast and cause connectors with more control"),
    summary: bilingual("Pratique according to, due to, while, whereas, otherwise e however em argumentos curtos.", "Practice according to, due to, while, whereas, otherwise, and however in short arguments."),
    masterySignal: bilingual("Voce conecta e contrasta ideias com mais precisao em fala e escrita.", "You connect and contrast ideas more precisely in speaking and writing."),
    guidePoints: [
      bilingual("Use due to para causa nominal e because para oracoes completas.", "Use due to for noun-based cause and because for full clauses."),
      bilingual("Use while e whereas para contrastar duas ideias relacionadas.", "Use while and whereas to contrast two related ideas."),
      bilingual("Use otherwise para mostrar consequencia se algo nao acontecer.", "Use otherwise to show the consequence if something does not happen."),
    ],
    choicePrompt: bilingual("Qual frase usa o conector corretamente?", "Which sentence uses the connector correctly?"),
    choiceOptions: [
      "According to the report, sales improved in March.",
      "According to sales improved in March, the report.",
      "Due to the report says sales improved.",
    ],
    choiceAnswer: "According to the report, sales improved in March.",
    choiceExplanation: bilingual("According to introduz a fonte da informacao.", "According to introduces the source of the information."),
    clozeSentence: "We need to leave now; ___, we will miss the train.",
    clozeOptions: ["otherwise", "whereas", "according to"],
    clozeAnswer: "otherwise",
    clozeExplanation: bilingual("Otherwise indica a consequencia se nao agirmos.", "Otherwise indicates the consequence if we do not act."),
    listenAudio: "While the design is elegant, the navigation is still confusing.",
    listenOptions: [
      "The speaker is contrasting two aspects of the product.",
      "The speaker is describing a timeline.",
      "The speaker is reporting a phone call.",
    ],
    listenAnswer: "The speaker is contrasting two aspects of the product.",
    listenExplanation: bilingual("While introduz contraste aqui, nao tempo.", "While introduces contrast here, not time."),
    textPrompt: bilingual("Escreva em ingles: De acordo com a gerente, o prazo mudou.", "Write in English: According to the manager, the deadline changed."),
    textAnswer: "According to the manager, the deadline changed.",
    textAcceptedAnswers: ["According to the manager, the deadline changed."],
    textExplanation: bilingual("According to liga a informacao a uma fonte especifica.", "According to links the information to a specific source."),
    orderTokens: ["The", "north", "is", "dry,", "whereas", "the", "south", "is", "humid."],
    orderBank: ["dry,", "south", "The", "is", "whereas", "the", "is", "north", "humid."],
    orderExplanation: bilingual("Whereas introduz um contraste claro entre duas partes.", "Whereas introduces a clear contrast between two sides."),
    dictationAudio: "Due to the storm, several flights were canceled.",
    dictationExplanation: bilingual("Observe que due to vem antes de um grupo nominal.", "Notice that due to comes before a noun phrase."),
    freeClozeSentence: "Submit the form today; ___, your request may be delayed.",
    freeClozeAnswer: "otherwise",
    freeClozeAcceptedAnswers: ["otherwise"],
    freeClozeExplanation: bilingual("Otherwise marca o resultado negativo de nao agir.", "Otherwise marks the negative result of not acting."),
    speechPrompt: bilingual("Diga em ingles: While this plan is cheaper, the other one is safer.", "Say in English: While this plan is cheaper, the other one is safer."),
    speechAudio: "While this plan is cheaper, the other one is safer.",
    speechExplanation: bilingual("Treine a estrutura de contraste em uma frase so.", "Practice the contrast structure in a single sentence."),
    roleplayTitle: bilingual("Apresentacao de estrategia", "Strategy presentation"),
    roleplayContext: bilingual("Voce esta comparando duas propostas de expansao para a diretoria.", "You are comparing two expansion proposals for the board."),
    roleplayDialogue: [
      { speaker: "Director", text: "What does the research say about the new market?" },
      { speaker: "Analyst", text: "According to the latest survey, demand is growing." },
      { speaker: "Director", text: "Good. While the opportunity is promising, the logistics are still expensive." },
    ],
    roleplayQuestion: bilingual("Qual frase continua essa apresentacao com contraste adequado?", "Which sentence continues this presentation with an appropriate contrast?"),
    roleplayOptions: [
      "The margin could improve; otherwise, the project will remain risky.",
      "The margin could improve; according to, the project will remain risky.",
      "The margin could improve whereas the project will remain risky because no contrast.",
    ],
    roleplayAnswer: "The margin could improve; otherwise, the project will remain risky.",
    roleplayExplanation: bilingual("Otherwise conecta a melhoria desejada com a consequencia de ela nao acontecer.", "Otherwise connects the desired improvement with the consequence if it does not happen."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "Due to the delay, the team worked remotely.",
      "Due to the team worked remotely, the delay.",
      "According to the delay, the team worked remotely.",
    ],
    recapChoiceAnswer: "Due to the delay, the team worked remotely.",
    recapChoiceExplanation: bilingual("Due to combina com um nome: the delay.", "Due to works with a noun: the delay."),
    recapTextPrompt: bilingual("Escreva em ingles: Enquanto o texto esta bom, o titulo ainda precisa melhorar.", "Write in English: While the text is good, the title still needs improvement."),
    recapTextAnswer: "While the text is good, the title still needs improvement.",
    recapTextAcceptedAnswers: ["While the text is good, the title still needs improvement."],
    recapTextExplanation: bilingual("While contrasta duas avaliacoes da mesma entrega.", "While contrasts two evaluations of the same deliverable."),
    recapSpeechPrompt: bilingual("Diga: According to the report, costs are falling.", "Say: According to the report, costs are falling."),
    recapSpeechAudio: "According to the report, costs are falling.",
    recapSpeechExplanation: bilingual("Repita a estrutura que introduz uma fonte.", "Repeat the structure that introduces a source."),
  },
  {
    id: "b2_reported_passive",
    conceptKey: "b2.reported_passive",
    title: bilingual("Reported speech e passive voice em contexto", "Reported speech and passive voice in context"),
    summary: bilingual("Treine relatar falas e descrever processos com foco em clareza e impessoalidade.", "Practice reporting speech and describing processes with clarity and impersonality."),
    masterySignal: bilingual("Voce consegue relatar falas e usar voz passiva sem soar mecanico.", "You can report speech and use passive voice without sounding mechanical."),
    guidePoints: [
      bilingual("No reported speech, ajuste tempo verbal e referencias quando necessario.", "In reported speech, adjust verb tense and references when necessary."),
      bilingual("Use passive voice quando a acao importa mais do que o agente.", "Use the passive voice when the action matters more than the agent."),
      bilingual("Observe verbos frequentes como say, tell, ask, announce e deliver.", "Notice frequent verbs like say, tell, ask, announce, and deliver."),
    ],
    choicePrompt: bilingual("Qual frase em reported speech esta correta?", "Which reported speech sentence is correct?"),
    choiceOptions: [
      "She said that the file was ready.",
      "She said me that the file was ready.",
      "She told that the file was ready.",
    ],
    choiceAnswer: "She said that the file was ready.",
    choiceExplanation: bilingual("Say nao pede objeto direto aqui; tell pede objeto: She told me...", "Say does not take a direct object here; tell does: She told me..."),
    clozeSentence: "The packages ___ every morning before 9 a.m.",
    clozeOptions: ["are delivered", "deliver", "were delivering"],
    clozeAnswer: "are delivered",
    clozeExplanation: bilingual("A frase descreve um processo recorrente na voz passiva.", "The sentence describes a recurring process in the passive voice."),
    listenAudio: "The manager said the launch would start on Monday.",
    listenOptions: [
      "It is a reported statement about a future plan.",
      "It is a direct question.",
      "It describes a finished past action only.",
    ],
    listenAnswer: "It is a reported statement about a future plan.",
    listenExplanation: bilingual("Would start mostra o backshift de will no discurso relatado.", "Would start shows the backshift of will in reported speech."),
    textPrompt: bilingual("Reescreva em reported speech: 'I am tired,' she said.", "Rewrite in reported speech: 'I am tired,' she said."),
    textAnswer: "She said that she was tired.",
    textAcceptedAnswers: [
      "She said that she was tired.",
      "She said she was tired.",
    ],
    textExplanation: bilingual("Am geralmente recua para was no discurso relatado.", "Am generally shifts back to was in reported speech."),
    orderTokens: ["The", "contract", "was", "signed", "yesterday", "by", "both", "teams."],
    orderBank: ["signed", "yesterday", "both", "teams.", "The", "by", "was", "contract"],
    orderExplanation: bilingual("A voz passiva destaca o contrato, nao quem assinou.", "The passive voice highlights the contract, not who signed it."),
    dictationAudio: "He told me that the meeting had been canceled.",
    dictationExplanation: bilingual("Observe a estrutura told me that... no relato.", "Notice the told me that... structure in reported speech."),
    freeClozeSentence: "The final version will ___ sent tomorrow.",
    freeClozeAnswer: "be",
    freeClozeAcceptedAnswers: ["be"],
    freeClozeExplanation: bilingual("Na passive future usamos will be + past participle.", "In the future passive we use will be + past participle."),
    speechPrompt: bilingual("Diga em ingles: The email was sent this morning.", "Say in English: The email was sent this morning."),
    speechAudio: "The email was sent this morning.",
    speechExplanation: bilingual("Treine a voz passiva em contexto de trabalho.", "Practice the passive voice in a work context."),
    roleplayTitle: bilingual("Atualizacao corporativa", "Corporate update"),
    roleplayContext: bilingual("Voce esta resumindo uma reuniao para um colega que nao participou.", "You are summarizing a meeting for a coworker who did not attend."),
    roleplayDialogue: [
      { speaker: "Coworker", text: "What did the director say about the new release?" },
      { speaker: "You", text: "She said that the campaign would be delayed by one week." },
      { speaker: "Coworker", text: "And was the budget approved?" },
    ],
    roleplayQuestion: bilingual("Qual resposta continua o resumo corretamente?", "Which response continues the summary correctly?"),
    roleplayOptions: [
      "Yes, it was approved after the meeting.",
      "Yes, it approved after the meeting.",
      "Yes, she said me it was approve.",
    ],
    roleplayAnswer: "Yes, it was approved after the meeting.",
    roleplayExplanation: bilingual("A resposta usa a passive voice corretamente para falar do budget.", "The answer uses the passive voice correctly to talk about the budget."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "They told us that the office would close early.",
      "They said us that the office would close early.",
      "They told that the office would close early.",
    ],
    recapChoiceAnswer: "They told us that the office would close early.",
    recapChoiceExplanation: bilingual("Tell pede objeto: told us.", "Tell takes an object: told us."),
    recapTextPrompt: bilingual("Escreva em ingles: O produto e fabricado na Espanha.", "Write in English: The product is made in Spain."),
    recapTextAnswer: "The product is made in Spain.",
    recapTextAcceptedAnswers: ["The product is made in Spain."],
    recapTextExplanation: bilingual("A voz passiva ajuda a focar no produto e no processo.", "The passive voice helps focus on the product and the process."),
    recapSpeechPrompt: bilingual("Diga: She said that the team was ready.", "Say: She said that the team was ready."),
    recapSpeechAudio: "She said that the team was ready.",
    recapSpeechExplanation: bilingual("Repita a estrutura base do discurso relatado.", "Repeat the basic reported speech structure."),
  },
  {
    id: "b2_perfects_time_reference",
    conceptKey: "b2.perfects_time_reference",
    title: bilingual("Present perfect, past perfect e referencia temporal", "Present perfect, past perfect, and time reference"),
    summary: bilingual("Aprofunde o contraste entre experiencias, resultados e acoes anteriores a outro passado.", "Deepen the contrast between experiences, results, and actions previous to another past moment."),
    masterySignal: bilingual("Voce escolhe entre present perfect, simple past e past perfect com mais seguranca.", "You choose between the present perfect, simple past, and past perfect more confidently."),
    guidePoints: [
      bilingual("Use past perfect para uma acao anterior a outro ponto no passado.", "Use the past perfect for an action before another point in the past."),
      bilingual("Use present perfect quando o foco estiver no resultado ou na experiencia ate agora.", "Use the present perfect when the focus is on the result or experience up to now."),
      bilingual("Marcas como before, by the time, already, ever e gone ajudam a escolher a estrutura.", "Markers like before, by the time, already, ever, and gone help you choose the structure."),
    ],
    choicePrompt: bilingual("Qual frase esta correta?", "Which sentence is correct?"),
    choiceOptions: [
      "By the time I arrived, they had left.",
      "By the time I arrived, they have left.",
      "By the time I arrived, they left already.",
    ],
    choiceAnswer: "By the time I arrived, they had left.",
    choiceExplanation: bilingual("Had left mostra a acao anterior ao momento de arrived.", "Had left shows the action before the moment of arrived."),
    clozeSentence: "She has ___ been to Mexico twice.",
    clozeOptions: ["already", "yesterday", "ago"],
    clozeAnswer: "already",
    clozeExplanation: bilingual("Already funciona com present perfect; yesterday e ago puxam simple past.", "Already works with the present perfect; yesterday and ago call for the simple past."),
    listenAudio: "When we got to the cinema, the movie had already started.",
    listenOptions: [
      "The movie started before they arrived.",
      "The movie started after they arrived.",
      "They are talking about a future plan.",
    ],
    listenAnswer: "The movie started before they arrived.",
    listenExplanation: bilingual("Had already started marca anterioridade em relacao a got.", "Had already started marks anteriority relative to got."),
    textPrompt: bilingual("Escreva em ingles: Eu ja tinha enviado o arquivo quando ela ligou.", "Write in English: I had already sent the file when she called."),
    textAnswer: "I had already sent the file when she called.",
    textAcceptedAnswers: ["I had already sent the file when she called."],
    textExplanation: bilingual("A acao de enviar aconteceu antes da ligacao.", "The sending happened before the call."),
    orderTokens: ["Have", "you", "ever", "been", "to", "Japan?"],
    orderBank: ["ever", "Japan?", "Have", "been", "you", "to"],
    orderExplanation: bilingual("Have you ever been... pergunta sobre experiencia de vida.", "Have you ever been... asks about life experience."),
    dictationAudio: "She had finished the report before the client arrived.",
    dictationExplanation: bilingual("Observe a relacao entre a acao concluida e o segundo evento passado.", "Notice the relation between the completed action and the second past event."),
    freeClozeSentence: "I have never ___ such a fast response before.",
    freeClozeAnswer: "seen",
    freeClozeAcceptedAnswers: ["seen"],
    freeClozeExplanation: bilingual("Never + present perfect pede o particípio seen.", "Never + present perfect requires the participle seen."),
    speechPrompt: bilingual("Diga em ingles: We had already left when the rain started.", "Say in English: We had already left when the rain started."),
    speechAudio: "We had already left when the rain started.",
    speechExplanation: bilingual("Fale a sequencia com o contraste entre os dois passados.", "Say the sequence with the contrast between the two past events."),
    roleplayTitle: bilingual("Linha do tempo do projeto", "Project timeline"),
    roleplayContext: bilingual("Voce esta explicando a ordem de eventos de um projeto atrasado.", "You are explaining the order of events in a delayed project."),
    roleplayDialogue: [
      { speaker: "Client", text: "Why was the launch postponed?" },
      { speaker: "Project lead", text: "By the time we received approval, the media slots had already been sold." },
      { speaker: "Client", text: "Had the team finished the campaign assets?" },
    ],
    roleplayQuestion: bilingual("Qual resposta combina com essa linha do tempo?", "Which answer fits this timeline?"),
    roleplayOptions: [
      "Yes, they had finished them before the approval arrived.",
      "Yes, they have finished them before the approval arrived.",
      "Yes, they finished them before and now approval.",
    ],
    roleplayAnswer: "Yes, they had finished them before the approval arrived.",
    roleplayExplanation: bilingual("Past perfect encaixa a acao que veio antes de approval arrived.", "The past perfect fits the action that came before approval arrived."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "He has gone home, so he isn't here now.",
      "He has been home, so he isn't here now.",
      "He went home, so he isn't here now already.",
    ],
    recapChoiceAnswer: "He has gone home, so he isn't here now.",
    recapChoiceExplanation: bilingual("Has gone destaca ausencia atual; has been sugere retorno.", "Has gone highlights current absence; has been suggests return."),
    recapTextPrompt: bilingual("Escreva em ingles: Quando chegamos, eles ja tinham comido.", "Write in English: When we arrived, they had already eaten."),
    recapTextAnswer: "When we arrived, they had already eaten.",
    recapTextAcceptedAnswers: ["When we arrived, they had already eaten."],
    recapTextExplanation: bilingual("Had already eaten marca a acao anterior ao momento de arrived.", "Had already eaten marks the action before the moment of arrived."),
    recapSpeechPrompt: bilingual("Diga: Have you ever worked with a global team?", "Say: Have you ever worked with a global team?"),
    recapSpeechAudio: "Have you ever worked with a global team?",
    recapSpeechExplanation: bilingual("Repita a pergunta de experiencia com fluidez.", "Repeat the experience question fluently."),
  },
  {
    id: "b2_conditionals_outcomes",
    conceptKey: "b2.conditionals_outcomes",
    title: bilingual("Condicionais 0, 1, 2 e 3 em comparacao", "Conditionals 0, 1, 2, and 3 in comparison"),
    summary: bilingual("Organize regras, possibilidades, hipotese presente e arrependimento passado com mais precisao.", "Organize rules, possibilities, present hypotheticals, and past regret with more precision."),
    masterySignal: bilingual("Voce reconhece o efeito de cada condicional sem depender de formula decorada.", "You recognize the effect of each conditional without relying on memorized formulas."),
    guidePoints: [
      bilingual("Zero conditional fala de fatos e regras gerais.", "The zero conditional talks about facts and general rules."),
      bilingual("First conditional fala de possibilidades reais no futuro.", "The first conditional talks about real possibilities in the future."),
      bilingual("Second e third conditional tratam de hipoteses irreais no presente/futuro e no passado.", "The second and third conditional deal with unreal hypotheticals in the present/future and the past."),
    ],
    choicePrompt: bilingual("Qual frase representa uma hipotese irreal no presente?", "Which sentence represents an unreal present hypothesis?"),
    choiceOptions: [
      "If I had more time, I would study French.",
      "If I have more time, I would study French.",
      "If I had had more time, I would study French.",
    ],
    choiceAnswer: "If I had more time, I would study French.",
    choiceExplanation: bilingual("If + past simple com would indica second conditional.", "If + past simple with would indicates the second conditional."),
    clozeSentence: "If you heat ice, it ___.",
    clozeOptions: ["melts", "will melt", "would melt"],
    clozeAnswer: "melts",
    clozeExplanation: bilingual("Zero conditional usa present + present para fatos gerais.", "The zero conditional uses present + present for general facts."),
    listenAudio: "If we leave now, we'll catch the last bus.",
    listenOptions: [
      "It is a real future possibility.",
      "It is an unreal past regret.",
      "It is a scientific fact.",
    ],
    listenAnswer: "It is a real future possibility.",
    listenExplanation: bilingual("If + present / will + base verb forma first conditional.", "If + present / will + base verb forms the first conditional."),
    textPrompt: bilingual("Escreva em ingles: Se eu soubesse a resposta, eu te contaria.", "Write in English: If I knew the answer, I would tell you."),
    textAnswer: "If I knew the answer, I would tell you.",
    textAcceptedAnswers: ["If I knew the answer, I would tell you."],
    textExplanation: bilingual("A ideia e hipotetica no presente, entao usamos second conditional.", "The idea is hypothetical in the present, so we use the second conditional."),
    orderTokens: ["If", "they", "had", "left", "earlier,", "they", "would", "have", "arrived", "on", "time."],
    orderBank: ["have", "they", "earlier,", "had", "If", "arrived", "would", "time.", "left", "on", "they"],
    orderExplanation: bilingual("Third conditional combina had + participio com would have + participio.", "The third conditional combines had + participle with would have + participle."),
    dictationAudio: "If people don't sleep enough, they make more mistakes.",
    dictationExplanation: bilingual("Aqui temos um zero conditional falando de padrao geral.", "Here we have a zero conditional describing a general pattern."),
    freeClozeSentence: "If I had known, I ___ have called you.",
    freeClozeAnswer: "would",
    freeClozeAcceptedAnswers: ["would"],
    freeClozeExplanation: bilingual("No third conditional, usamos would have + participio.", "In the third conditional, we use would have + participle."),
    speechPrompt: bilingual("Diga em ingles: If the weather improves, we will go hiking.", "Say in English: If the weather improves, we will go hiking."),
    speechAudio: "If the weather improves, we will go hiking.",
    speechExplanation: bilingual("Treine o first conditional como plano realista.", "Practice the first conditional as a realistic plan."),
    roleplayTitle: bilingual("Revisao de decisao", "Decision review"),
    roleplayContext: bilingual("Sua equipe esta avaliando um problema e discutindo alternativas.", "Your team is evaluating a problem and discussing alternatives."),
    roleplayDialogue: [
      { speaker: "Manager", text: "If we reduce scope, we will deliver on time." },
      { speaker: "Designer", text: "If we had more budget, we could add the premium features." },
      { speaker: "Manager", text: "And if we had tested earlier, we would have found the bug sooner." },
    ],
    roleplayQuestion: bilingual("Qual frase abaixo segue o padrao de third conditional?", "Which sentence below follows the third conditional pattern?"),
    roleplayOptions: [
      "If we had planned better, we would have saved time.",
      "If we planned better, we would have saved time.",
      "If we had planned better, we will save time.",
    ],
    roleplayAnswer: "If we had planned better, we would have saved time.",
    roleplayExplanation: bilingual("Third conditional fala de um passado diferente do que realmente aconteceu.", "The third conditional talks about a past different from what actually happened."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "If you press this button, the screen turns on.",
      "If you will press this button, the screen turns on.",
      "If you pressed this button, the screen turns on always.",
    ],
    recapChoiceAnswer: "If you press this button, the screen turns on.",
    recapChoiceExplanation: bilingual("A frase descreve uma regra geral: zero conditional.", "The sentence describes a general rule: zero conditional."),
    recapTextPrompt: bilingual("Escreva em ingles: Se eles chegarem cedo, comecaremos a reuniao.", "Write in English: If they arrive early, we will start the meeting."),
    recapTextAnswer: "If they arrive early, we will start the meeting.",
    recapTextAcceptedAnswers: ["If they arrive early, we will start the meeting."],
    recapTextExplanation: bilingual("If + present com will + verbo indica first conditional.", "If + present with will + verb indicates the first conditional."),
    recapSpeechPrompt: bilingual("Diga: If I were you, I would wait.", "Say: If I were you, I would wait."),
    recapSpeechAudio: "If I were you, I would wait.",
    recapSpeechExplanation: bilingual("Repita a estrutura classica de conselho com second conditional.", "Repeat the classic advice structure with the second conditional."),
  },
  {
    id: "b2_infinitive_gerund_control",
    conceptKey: "b2.infinitive_gerund_control",
    title: bilingual("Infinitive x gerund com verbos-chave", "Infinitive vs gerund with key verbs"),
    summary: bilingual("Treine stop, try, remember, forget e outros verbos que mudam de sentido conforme a estrutura.", "Practice stop, try, remember, forget, and other verbs that change meaning depending on the structure."),
    masterySignal: bilingual("Voce escolhe a estrutura pelo sentido pretendido, nao por tentativa.", "You choose the structure by intended meaning, not by guesswork."),
    guidePoints: [
      bilingual("Remember/forget + infinitive olha para uma acao futura; + gerund olha para memoria do passado.", "Remember/forget + infinitive looks to a future action; + gerund looks to memory of the past."),
      bilingual("Stop + gerund encerra uma atividade; stop + infinitive pausa uma atividade para fazer outra.", "Stop + gerund ends an activity; stop + infinitive pauses an activity to do another."),
      bilingual("Try + gerund testa uma estrategia; try + infinitive faz esforco para conseguir algo.", "Try + gerund tests a strategy; try + infinitive makes an effort to achieve something."),
    ],
    choicePrompt: bilingual("Qual frase significa testar uma estrategia?", "Which sentence means testing a strategy?"),
    choiceOptions: [
      "Try restarting the router.",
      "Try to restarting the router.",
      "Try restart the router to.",
    ],
    choiceAnswer: "Try restarting the router.",
    choiceExplanation: bilingual("Try + gerund sugere experimentar uma solucao.", "Try + gerund suggests testing a solution."),
    clozeSentence: "I remembered ___ the client after the meeting.",
    clozeOptions: ["to call", "calling", "call"],
    clozeAnswer: "to call",
    clozeExplanation: bilingual("Remember + infinitive fala de nao esquecer uma tarefa futura.", "Remember + infinitive talks about not forgetting a future task."),
    listenAudio: "He stopped smoking five years ago.",
    listenOptions: [
      "He ended the habit completely.",
      "He paused to smoke for a moment.",
      "He forgot about smoking.",
    ],
    listenAnswer: "He ended the habit completely.",
    listenExplanation: bilingual("Stop + gerund significa deixar de fazer a atividade.", "Stop + gerund means to quit the activity."),
    textPrompt: bilingual("Escreva em ingles: Parei para tomar um cafe.", "Write in English: I stopped to have a coffee."),
    textAnswer: "I stopped to have a coffee.",
    textAcceptedAnswers: ["I stopped to have a coffee.", "I stopped to get a coffee."],
    textExplanation: bilingual("Stop + infinitive mostra a interrupcao de uma atividade para fazer outra.", "Stop + infinitive shows interrupting one activity to do another."),
    orderTokens: ["She", "forgot", "to", "attach", "the", "file."],
    orderBank: ["the", "attach", "file.", "forgot", "She", "to"],
    orderExplanation: bilingual("Forgot to attach indica uma tarefa que nao foi realizada.", "Forgot to attach indicates a task that was not done."),
    dictationAudio: "I will never forget meeting her for the first time.",
    dictationExplanation: bilingual("Forget + gerund se liga a uma memoria do passado.", "Forget + gerund connects to a memory from the past."),
    freeClozeSentence: "Try ___ the brightness if the screen feels too strong.",
    freeClozeAnswer: "lowering",
    freeClozeAcceptedAnswers: ["lowering"],
    freeClozeExplanation: bilingual("Aqui a ideia e testar uma estrategia.", "Here the idea is to test a strategy."),
    speechPrompt: bilingual("Diga em ingles: Remember to send the agenda.", "Say in English: Remember to send the agenda."),
    speechAudio: "Remember to send the agenda.",
    speechExplanation: bilingual("Treine a estrutura voltada para uma tarefa futura.", "Practice the structure aimed at a future task."),
    roleplayTitle: bilingual("Suporte tecnico", "Tech support"),
    roleplayContext: bilingual("Voce esta ajudando um colega a resolver um problema tecnico.", "You are helping a coworker solve a technical problem."),
    roleplayDialogue: [
      { speaker: "Colleague", text: "My laptop keeps freezing during calls." },
      { speaker: "You", text: "Try closing the background apps first." },
      { speaker: "Colleague", text: "Okay. I also forgot to update the system last night." },
    ],
    roleplayQuestion: bilingual("Qual frase abaixo usa a estrutura corretamente?", "Which sentence below uses the structure correctly?"),
    roleplayOptions: [
      "Remember to restart the app before the meeting.",
      "Remember restarting the app before the meeting tomorrow.",
      "Try to lowering the volume first.",
    ],
    roleplayAnswer: "Remember to restart the app before the meeting.",
    roleplayExplanation: bilingual("Remember to restart olha para uma acao futura e planejada.", "Remember to restart looks to a future planned action."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "I regret telling him the secret.",
      "I regret to told him the secret.",
      "I regret tell him the secret.",
    ],
    recapChoiceAnswer: "I regret telling him the secret.",
    recapChoiceExplanation: bilingual("Regret + gerund olha para algo que voce lamenta ter feito.", "Regret + gerund looks at something you regret doing."),
    recapTextPrompt: bilingual("Escreva em ingles: Tente falar com ela amanha.", "Write in English: Try to talk to her tomorrow."),
    recapTextAnswer: "Try to talk to her tomorrow.",
    recapTextAcceptedAnswers: ["Try to talk to her tomorrow."],
    recapTextExplanation: bilingual("Try + infinitive enfatiza o esforco para fazer algo.", "Try + infinitive emphasizes the effort to do something."),
    recapSpeechPrompt: bilingual("Diga: He stopped working at six.", "Say: He stopped working at six."),
    recapSpeechAudio: "He stopped working at six.",
    recapSpeechExplanation: bilingual("Repita a estrutura que indica fim de atividade.", "Repeat the structure that indicates the end of an activity."),
  },
  {
    id: "b2_phrasal_pronunciation_usage",
    conceptKey: "b2.phrasal_pronunciation_usage",
    title: bilingual("Phrasal verbs, quantidade e pronuncia funcional", "Phrasal verbs, quantity, and functional pronunciation"),
    summary: bilingual("Combine phrasal verbs basicos, quantificadores e pronuncia de finais e letras mudas.", "Combine basic phrasal verbs, quantifiers, and pronunciation of endings and silent letters."),
    masterySignal: bilingual("Voce consegue usar estruturas frequentes que deixam o ingles mais natural no uso real.", "You can use frequent structures that make English more natural in real use."),
    guidePoints: [
      bilingual("Observe se o phrasal verb aceita separacao ou nao.", "Notice whether the phrasal verb allows separation or not."),
      bilingual("Use plenty of, none e neither para quantificar com mais naturalidade.", "Use plenty of, none, and neither for more natural quantification."),
      bilingual("Revise finais em -s/-z e letras mudas para melhorar compreensao e pronuncia.", "Review -s/-z endings and silent letters to improve comprehension and pronunciation."),
    ],
    choicePrompt: bilingual("Qual frase com phrasal verb esta correta?", "Which sentence with a phrasal verb is correct?"),
    choiceOptions: [
      "Please turn the lights off before you leave.",
      "Please turn off the lights it before you leave.",
      "Please off turn the lights before you leave.",
    ],
    choiceAnswer: "Please turn the lights off before you leave.",
    choiceExplanation: bilingual("Turn off pode ser separavel quando o objeto e um nome.", "Turn off can be separable when the object is a noun."),
    clozeSentence: "There is ___ time to review the final draft.",
    clozeOptions: ["plenty of", "none", "neither"],
    clozeAnswer: "plenty of",
    clozeExplanation: bilingual("Plenty of indica quantidade suficiente e confortavel.", "Plenty of indicates a comfortable sufficient amount."),
    listenAudio: "The b in debt is silent.",
    listenOptions: [
      "The speaker is explaining pronunciation.",
      "The speaker is discussing quantity.",
      "The speaker is giving directions.",
    ],
    listenAnswer: "The speaker is explaining pronunciation.",
    listenExplanation: bilingual("Debt e um exemplo classico de letra muda.", "Debt is a classic example of a silent letter."),
    textPrompt: bilingual("Escreva em ingles: Nenhuma das opcoes parece segura.", "Write in English: None of the options seems safe."),
    textAnswer: "None of the options seems safe.",
    textAcceptedAnswers: [
      "None of the options seems safe.",
      "None of the options seem safe.",
    ],
    textExplanation: bilingual("As duas concordancias aparecem no uso, embora seems seja mais tradicional.", "Both agreements appear in use, although seems is more traditional."),
    orderTokens: ["We", "need", "to", "find", "out", "why", "the", "system", "failed."],
    orderBank: ["system", "the", "failed.", "need", "out", "why", "find", "We", "to"],
    orderExplanation: bilingual("Find out funciona como unidade de significado: descobrir.", "Find out works as a meaning unit: discover."),
    dictationAudio: "Neither option solves the problem completely.",
    dictationExplanation: bilingual("Observe o uso de neither para negar duas opcoes.", "Notice the use of neither to negate two options."),
    freeClozeSentence: "Can you fill ___ this form before lunch?",
    freeClozeAnswer: "out",
    freeClozeAcceptedAnswers: ["out"],
    freeClozeExplanation: bilingual("Fill out e um phrasal verb comum em contexto administrativo.", "Fill out is a common phrasal verb in administrative contexts."),
    speechPrompt: bilingual("Diga em ingles: We need to set up the meeting room.", "Say in English: We need to set up the meeting room."),
    speechAudio: "We need to set up the meeting room.",
    speechExplanation: bilingual("Treine um phrasal verb muito frequente em ambiente de trabalho.", "Practice a very frequent phrasal verb in a work setting."),
    roleplayTitle: bilingual("Organizacao de evento", "Event setup"),
    roleplayContext: bilingual("Sua equipe esta organizando um evento e distribuindo tarefas rapidamente.", "Your team is organizing an event and distributing tasks quickly."),
    roleplayDialogue: [
      { speaker: "Lead", text: "Can someone set up the projector before the guests arrive?" },
      { speaker: "Assistant", text: "Yes, and I can also hand out the printed schedules." },
      { speaker: "Lead", text: "Great. We still have plenty of time, but we should move now." },
    ],
    roleplayQuestion: bilingual("Qual resposta combina melhor com esse contexto?", "Which response fits this context best?"),
    roleplayOptions: [
      "I can look into the sound issue after I finish this setup.",
      "I can look the issue into after finish this setup.",
      "I can plenty of time look into the issue.",
    ],
    roleplayAnswer: "I can look into the sound issue after I finish this setup.",
    roleplayExplanation: bilingual("Look into e um phrasal verb natural para investigar um problema.", "Look into is a natural phrasal verb for investigating a problem."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "The t in listen is silent.",
      "The t in listen is pronounced strongly.",
      "The t in listen becomes z.",
    ],
    recapChoiceAnswer: "The t in listen is silent.",
    recapChoiceExplanation: bilingual("Listen tem t mudo na pronuncia padrao.", "Listen has a silent t in standard pronunciation."),
    recapTextPrompt: bilingual("Escreva em ingles: Temos comida suficiente para todos.", "Write in English: We have plenty of food for everyone."),
    recapTextAnswer: "We have plenty of food for everyone.",
    recapTextAcceptedAnswers: ["We have plenty of food for everyone."],
    recapTextExplanation: bilingual("Plenty of passa a ideia de abundancia suficiente.", "Plenty of conveys a sense of sufficient abundance."),
    recapSpeechPrompt: bilingual("Diga: Please hand out these documents.", "Say: Please hand out these documents."),
    recapSpeechAudio: "Please hand out these documents.",
    recapSpeechExplanation: bilingual("Repita um phrasal verb muito util em reunioes e aulas.", "Repeat a very useful phrasal verb in meetings and classes."),
  },
];

const C1_DEEP_UNIT_SPECS = [
  {
    id: "c1_nuance_contrast",
    conceptKey: "c1.nuance_contrast",
    title: bilingual("Nuance, concessao e contraste fino", "Nuance, concession, and fine-grained contrast"),
    summary: bilingual("Trabalhe despite, in spite of, so/such, the more...the more e most/most of com mais precisao.", "Work on despite, in spite of, so/such, the more...the more, and most/most of with more precision."),
    masterySignal: bilingual("Voce consegue expressar contraste e intensidade sem escolher conectores aleatoriamente.", "You can express contrast and intensity without choosing connectors randomly."),
    guidePoints: [
      bilingual("Use despite e in spite of antes de nomes ou estruturas nominais.", "Use despite and in spite of before nouns or noun-like structures."),
      bilingual("Use so + adjective/adverb e such + noun phrase.", "Use so + adjective/adverb and such + noun phrase."),
      bilingual("Use the more...the more para correlacao entre duas mudancas.", "Use the more...the more for correlation between two changes."),
    ],
    choicePrompt: bilingual("Qual frase esta correta?", "Which sentence is correct?"),
    choiceOptions: [
      "Despite the rain, the event continued.",
      "Despite it was raining, the event continued.",
      "In spite the rain, the event continued.",
    ],
    choiceAnswer: "Despite the rain, the event continued.",
    choiceExplanation: bilingual("Despite pede um nome ou grupo nominal, como the rain.", "Despite takes a noun or noun phrase, such as the rain."),
    clozeSentence: "It was ___ a difficult case that everyone remembered it.",
    clozeOptions: ["such", "so", "too"],
    clozeAnswer: "such",
    clozeExplanation: bilingual("Such combina com um grupo nominal: such a difficult case.", "Such combines with a noun phrase: such a difficult case."),
    listenAudio: "The more we delayed the decision, the more expensive the solution became.",
    listenOptions: [
      "Two changes are connected and grow together.",
      "The speaker is giving a simple list.",
      "The sentence describes a finished past only.",
    ],
    listenAnswer: "Two changes are connected and grow together.",
    listenExplanation: bilingual("The more...the more mostra correlacao progressiva.", "The more...the more shows a progressive correlation."),
    textPrompt: bilingual("Escreva em ingles: Apesar dos custos, o plano continua viavel.", "Write in English: Despite the costs, the plan remains viable."),
    textAnswer: "Despite the costs, the plan remains viable.",
    textAcceptedAnswers: [
      "Despite the costs, the plan remains viable.",
      "In spite of the costs, the plan remains viable.",
    ],
    textExplanation: bilingual("Despite e in spite of podem funcionar aqui com o mesmo sentido.", "Despite and in spite of can both work here with the same meaning."),
    orderTokens: ["The", "more", "you", "practice,", "the", "more", "natural", "you", "sound."],
    orderBank: ["you", "The", "sound.", "practice,", "natural", "more", "more", "you", "the"],
    orderExplanation: bilingual("A estrutura compara dois crescimentos ao mesmo tempo.", "The structure compares two simultaneous developments."),
    dictationAudio: "It was so quiet that we could hear the rain outside.",
    dictationExplanation: bilingual("So vem antes de adjetivo: so quiet.", "So comes before an adjective: so quiet."),
    freeClozeSentence: "Most ___ the team agreed with the proposal.",
    freeClozeAnswer: "of",
    freeClozeAcceptedAnswers: ["of"],
    freeClozeExplanation: bilingual("Quando ha artigo ou determinante, usamos most of.", "When there is an article or determiner, we use most of."),
    speechPrompt: bilingual("Diga em ingles: In spite of the pressure, she stayed calm.", "Say in English: In spite of the pressure, she stayed calm."),
    speechAudio: "In spite of the pressure, she stayed calm.",
    speechExplanation: bilingual("Repita a estrutura inteira para fixar o conector concessivo.", "Repeat the full structure to lock in the concessive connector."),
    roleplayTitle: bilingual("Mesa-redonda de estrategia", "Strategy roundtable"),
    roleplayContext: bilingual("Voce esta resumindo um debate com concessoes, intensidade e correlacoes.", "You are summarizing a debate with concessions, intensity, and correlations."),
    roleplayDialogue: [
      { speaker: "Chair", text: "Despite the early resistance, the proposal gained support." },
      { speaker: "Analyst", text: "The more evidence we shared, the more confident the board became." },
      { speaker: "Chair", text: "It was such a strong case that the vote ended quickly." },
    ],
    roleplayQuestion: bilingual("Qual frase continua esse registro de forma correta?", "Which sentence continues this discussion correctly?"),
    roleplayOptions: [
      "Most of the panel agreed, despite a few concerns.",
      "Most the panel agreed, despite of a few concerns.",
      "Despite a few concerns, most panel of agreed.",
    ],
    roleplayAnswer: "Most of the panel agreed, despite a few concerns.",
    roleplayExplanation: bilingual("Most of the panel e despite a few concerns estao corretos.", "Most of the panel and despite a few concerns are correct."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "It was such an intense debate that nobody left early.",
      "It was so an intense debate that nobody left early.",
      "It was such intense that nobody left early.",
    ],
    recapChoiceAnswer: "It was such an intense debate that nobody left early.",
    recapChoiceExplanation: bilingual("Such precisa do grupo nominal completo.", "Such needs the full noun phrase."),
    recapTextPrompt: bilingual("Escreva em ingles: Quanto mais eles revisam, menos erros aparecem.", "Write in English: The more they review, the fewer errors appear."),
    recapTextAnswer: "The more they review, the fewer errors appear.",
    recapTextAcceptedAnswers: ["The more they review, the fewer errors appear."],
    recapTextExplanation: bilingual("Use the more...the fewer para comparar mudancas simultaneas.", "Use the more...the fewer to compare simultaneous changes."),
    recapSpeechPrompt: bilingual("Diga: Despite the delay, the launch was successful.", "Say: Despite the delay, the launch was successful."),
    recapSpeechAudio: "Despite the delay, the launch was successful.",
    recapSpeechExplanation: bilingual("Repita a frase com entonacao clara de contraste.", "Repeat the sentence with clear contrast intonation."),
  },
  {
    id: "c1_wish_preference_adaptation",
    conceptKey: "c1.wish_preference_adaptation",
    title: bilingual("Wish, would rather e adaptacao", "Wish, would rather, and adaptation"),
    summary: bilingual("Trabalhe desejo, preferencia e adaptacao com wish, if only, would rather e used to.", "Work on desire, preference, and adaptation with wish, if only, would rather, and used to."),
    masterySignal: bilingual("Voce expressa frustracao, preferencia e adaptacao com mais nuance.", "You express frustration, preference, and adaptation with more nuance."),
    guidePoints: [
      bilingual("Use wish + past para situacoes presentes irreais.", "Use wish + past for unreal present situations."),
      bilingual("Use wish + would para irritacao ou desejo de mudanca de comportamento.", "Use wish + would for irritation or a desire for a behavior change."),
      bilingual("Differentie used to, be used to e get used to.", "Differentiate used to, be used to, and get used to."),
    ],
    choicePrompt: bilingual("Qual frase expressa irritacao com um comportamento atual?", "Which sentence expresses irritation with a current behavior?"),
    choiceOptions: [
      "I wish he would answer my emails.",
      "I wish he answers my emails.",
      "I wish he answered my emails yesterday.",
    ],
    choiceAnswer: "I wish he would answer my emails.",
    choiceExplanation: bilingual("Wish + would expressa desejo de mudanca de comportamento.", "Wish + would expresses a desire for a change in behavior."),
    clozeSentence: "I would rather ___ home tonight.",
    clozeOptions: ["stay", "staying", "to stay"],
    clozeAnswer: "stay",
    clozeExplanation: bilingual("Would rather pede verbo base.", "Would rather takes the base verb."),
    listenAudio: "She is finally getting used to working across time zones.",
    listenOptions: [
      "She is in the process of adapting.",
      "She adapted long ago and it is fully normal now.",
      "She wants to change the time zone immediately.",
    ],
    listenAnswer: "She is in the process of adapting.",
    listenExplanation: bilingual("Getting used to mostra processo de adaptacao em andamento.", "Getting used to shows adaptation in progress."),
    textPrompt: bilingual("Escreva em ingles: Eu queria ter mais tempo para ler.", "Write in English: I wish I had more time to read."),
    textAnswer: "I wish I had more time to read.",
    textAcceptedAnswers: ["I wish I had more time to read."],
    textExplanation: bilingual("Wish + past simple aponta para uma situacao presente irreal.", "Wish + past simple points to an unreal present situation."),
    orderTokens: ["I", "am", "used", "to", "speaking", "in", "public", "now."],
    orderBank: ["used", "public", "speaking", "I", "in", "to", "am", "now."],
    orderExplanation: bilingual("Be used to + gerund mostra estado de adaptacao consolidado.", "Be used to + gerund shows a settled state of adaptation."),
    dictationAudio: "If only they would give us a clear answer.",
    dictationExplanation: bilingual("If only pode reforcar desejo e frustracao.", "If only can intensify desire and frustration."),
    freeClozeSentence: "We used ___ meet every Friday after work.",
    freeClozeAnswer: "to",
    freeClozeAcceptedAnswers: ["to"],
    freeClozeExplanation: bilingual("Used to fala de habito no passado.", "Used to talks about a past habit."),
    speechPrompt: bilingual("Diga em ingles: I would rather discuss this tomorrow.", "Say in English: I would rather discuss this tomorrow."),
    speechAudio: "I would rather discuss this tomorrow.",
    speechExplanation: bilingual("Repita a estrutura completa de preferencia.", "Repeat the full preference structure."),
    roleplayTitle: bilingual("Conversa sobre rotina e adaptacao", "Conversation about routine and adaptation"),
    roleplayContext: bilingual("Voce esta falando sobre mudancas de rotina, habitos passados e preferencia atual.", "You are talking about routine changes, past habits, and current preference."),
    roleplayDialogue: [
      { speaker: "Friend", text: "Are you comfortable with the new schedule now?" },
      { speaker: "You", text: "I am getting used to it, but I wish the meetings were shorter." },
      { speaker: "Friend", text: "Would you rather work earlier in the morning?" },
    ],
    roleplayQuestion: bilingual("Qual resposta continua esse dialogo naturalmente?", "Which answer continues this dialogue naturally?"),
    roleplayOptions: [
      "Yes, I would rather start earlier and finish sooner.",
      "Yes, I would rather to start earlier and finish sooner.",
      "Yes, I wish start earlier and finish sooner.",
    ],
    roleplayAnswer: "Yes, I would rather start earlier and finish sooner.",
    roleplayExplanation: bilingual("Would rather + verbo base e a estrutura correta.", "Would rather + base verb is the correct structure."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "I am used to dealing with tight deadlines.",
      "I am used to deal with tight deadlines.",
      "I use to dealing with tight deadlines.",
    ],
    recapChoiceAnswer: "I am used to dealing with tight deadlines.",
    recapChoiceExplanation: bilingual("Used to aqui funciona como preposicao e pede gerund.", "Used to here works like a preposition and takes a gerund."),
    recapTextPrompt: bilingual("Escreva em ingles: Se ao menos ele chegasse no horario.", "Write in English: If only he arrived on time."),
    recapTextAnswer: "If only he arrived on time.",
    recapTextAcceptedAnswers: ["If only he arrived on time."],
    recapTextExplanation: bilingual("If only + past fala de uma situacao presente desejada e irreal.", "If only + past talks about a desired unreal present situation."),
    recapSpeechPrompt: bilingual("Diga: I wish we had more data.", "Say: I wish we had more data."),
    recapSpeechAudio: "I wish we had more data.",
    recapSpeechExplanation: bilingual("Repita a estrutura de desejo sobre o presente.", "Repeat the desire structure about the present."),
  },
  {
    id: "c1_causatives_relatives",
    conceptKey: "c1.causatives_relatives",
    title: bilingual("Causativos, relativas e estruturas de controle", "Causatives, relatives, and control structures"),
    summary: bilingual("Pratique have/get causative, whose, relative clauses e supposed to em contexto natural.", "Practice have/get causative, whose, relative clauses, and supposed to in natural context."),
    masterySignal: bilingual("Voce organiza estruturas mais densas sem perder naturalidade.", "You organize denser structures without losing naturalness."),
    guidePoints: [
      bilingual("Have something done destaca o servico recebido, nao quem o executou.", "Have something done highlights the service received, not who performed it."),
      bilingual("Whose conecta posse dentro de uma relative clause.", "Whose connects possession inside a relative clause."),
      bilingual("Supposed to ajuda a falar de expectativa, regra ou plano social.", "Supposed to helps talk about expectation, rule, or social plan."),
    ],
    choicePrompt: bilingual("Qual frase usa o causativo corretamente?", "Which sentence uses the causative correctly?"),
    choiceOptions: [
      "I had my laptop repaired last week.",
      "I had repaired my laptop last week by someone.",
      "I had repair my laptop last week.",
    ],
    choiceAnswer: "I had my laptop repaired last week.",
    choiceExplanation: bilingual("Had my laptop repaired mostra que outra pessoa fez o servico.", "Had my laptop repaired shows that someone else did the work."),
    clozeSentence: "The woman ___ office was redesigned leads the innovation team.",
    clozeOptions: ["whose", "who", "which"],
    clozeAnswer: "whose",
    clozeExplanation: bilingual("Whose indica posse: o escritorio dela.", "Whose indicates possession: her office."),
    listenAudio: "We were supposed to submit the proposal by noon.",
    listenOptions: [
      "There was an expectation or plan.",
      "The proposal had already been rejected.",
      "The speaker is reporting a personal preference.",
    ],
    listenAnswer: "There was an expectation or plan.",
    listenExplanation: bilingual("Supposed to aponta para expectativa combinada ou regra.", "Supposed to points to an agreed expectation or rule."),
    textPrompt: bilingual("Escreva em ingles: Eu vou mandar cortar o cabelo amanha.", "Write in English: I am going to have my hair cut tomorrow."),
    textAnswer: "I am going to have my hair cut tomorrow.",
    textAcceptedAnswers: [
      "I am going to have my hair cut tomorrow.",
      "I'm going to have my hair cut tomorrow.",
    ],
    textExplanation: bilingual("Have my hair cut usa a estrutura causativa.", "Have my hair cut uses the causative structure."),
    orderTokens: ["The", "writer", "whose", "article", "won", "the", "award", "is", "speaking", "today."],
    orderBank: ["today.", "writer", "whose", "the", "award", "article", "The", "won", "is", "speaking"],
    orderExplanation: bilingual("Whose article won the award funciona como relative clause com posse.", "Whose article won the award works as a possessive relative clause."),
    dictationAudio: "We need to get the contracts reviewed before Friday.",
    dictationExplanation: bilingual("Get the contracts reviewed e uma alternativa natural ao causativo com have.", "Get the contracts reviewed is a natural alternative to the causative with have."),
    freeClozeSentence: "The analyst ___ presentation impressed the board was promoted.",
    freeClozeAnswer: "whose",
    freeClozeAcceptedAnswers: ["whose"],
    freeClozeExplanation: bilingual("Whose liga a apresentacao ao analista.", "Whose links the presentation to the analyst."),
    speechPrompt: bilingual("Diga em ingles: We are supposed to meet at eight.", "Say in English: We are supposed to meet at eight."),
    speechAudio: "We are supposed to meet at eight.",
    speechExplanation: bilingual("Repita a estrutura com ritmo de fala natural.", "Repeat the structure with natural speech rhythm."),
    roleplayTitle: bilingual("Preparacao de evento", "Event preparation"),
    roleplayContext: bilingual("Voce esta organizando um evento com varios servicos terceirizados e tarefas delegadas.", "You are organizing an event with outsourced services and delegated tasks."),
    roleplayDialogue: [
      { speaker: "Coordinator", text: "Have you had the banners printed yet?" },
      { speaker: "Assistant", text: "Yes, and I also got the venue checked this morning." },
      { speaker: "Coordinator", text: "Great. The speaker whose book launched last month is arriving at six." },
    ],
    roleplayQuestion: bilingual("Qual frase continua esse contexto corretamente?", "Which sentence continues this context correctly?"),
    roleplayOptions: [
      "We are supposed to brief the team before the guests arrive.",
      "We are suppose to briefing the team before the guests arrive.",
      "We had the team brief before the guests arrive by ourselves.",
    ],
    roleplayAnswer: "We are supposed to brief the team before the guests arrive.",
    roleplayExplanation: bilingual("Supposed to + verbo base e a estrutura correta.", "Supposed to + base verb is the correct structure."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "The consultant whose ideas we adopted is joining the call.",
      "The consultant who ideas we adopted is joining the call.",
      "The consultant whose we adopted ideas is joining the call.",
    ],
    recapChoiceAnswer: "The consultant whose ideas we adopted is joining the call.",
    recapChoiceExplanation: bilingual("Whose indica posse dentro da relative clause.", "Whose indicates possession inside the relative clause."),
    recapTextPrompt: bilingual("Escreva em ingles: Eu mandei revisar o texto.", "Write in English: I had the text reviewed."),
    recapTextAnswer: "I had the text reviewed.",
    recapTextAcceptedAnswers: ["I had the text reviewed."],
    recapTextExplanation: bilingual("A estrutura causativa destaca o resultado do servico.", "The causative structure highlights the result of the service."),
    recapSpeechPrompt: bilingual("Diga: She is supposed to lead the session.", "Say: She is supposed to lead the session."),
    recapSpeechAudio: "She is supposed to lead the session.",
    recapSpeechExplanation: bilingual("Repita a estrutura de expectativa e funcao.", "Repeat the expectation-and-role structure."),
  },
  {
    id: "b1_opinions_arguments",
    conceptKey: "b1.opinions_arguments",
    title: bilingual("Opinioes, justificativas e contraste simples", "Opinions, reasons, and simple contrast"),
    summary: bilingual("Monte opinioes claras com because, but, however, I think e in my opinion.", "Build clear opinions with because, but, however, I think, and in my opinion."),
    masterySignal: bilingual("Voce consegue dar opiniao curta, justificar e contrastar uma ideia.", "You can give a short opinion, justify it, and contrast an idea."),
    guidePoints: [
      bilingual("Use I think e In my opinion para introduzir sua posicao.", "Use I think and In my opinion to introduce your position."),
      bilingual("Use because para justificar e but / however para contrastar.", "Use because to justify and but / however to contrast."),
      bilingual("Prefira frases curtas e claras antes de tentar argumentos longos.", "Prefer short, clear sentences before attempting longer arguments."),
    ],
    choicePrompt: bilingual("Qual resposta apresenta opiniao com justificativa?", "Which answer presents an opinion with a reason?"),
    choiceOptions: [
      "I think remote work is effective because people can focus better.",
      "I think remote work because effective people focus.",
      "Remote work effective because I think.",
    ],
    choiceAnswer: "I think remote work is effective because people can focus better.",
    choiceExplanation: bilingual("A frase apresenta opiniao clara e uma justificativa completa.", "The sentence gives a clear opinion and a complete reason."),
    clozeSentence: "In my opinion, this course is useful ___ it is practical.",
    clozeOptions: ["because", "but", "than"],
    clozeAnswer: "because",
    clozeExplanation: bilingual("Because introduz a razao da opiniao.", "Because introduces the reason for the opinion."),
    listenAudio: "I like the design; however, the navigation is still confusing.",
    listenOptions: [
      "The speaker likes one part but criticizes another.",
      "The speaker fully approves everything.",
      "The speaker is asking for directions.",
    ],
    listenAnswer: "The speaker likes one part but criticizes another.",
    listenExplanation: bilingual("However marca contraste entre duas ideias.", "However marks contrast between two ideas."),
    textPrompt: bilingual("Escreva em ingles: Na minha opiniao, este plano e melhor porque e mais simples.", "Write in English: In my opinion, this plan is better because it is simpler."),
    textAnswer: "In my opinion, this plan is better because it is simpler.",
    textAcceptedAnswers: [
      "In my opinion, this plan is better because it is simpler.",
      "In my opinion, this plan is better because it's simpler.",
    ],
    textExplanation: bilingual("A frase combina opiniao, comparacao e justificativa.", "The sentence combines opinion, comparison, and reason."),
    orderTokens: ["I", "agree", "with", "the", "idea,", "but", "we", "need", "more", "data."],
    orderBank: ["with", "data.", "I", "need", "agree", "idea,", "more", "the", "but", "we"],
    orderExplanation: bilingual("But conecta sua concordancia com uma ressalva.", "But connects agreement with a reservation."),
    dictationAudio: "I understand your point, but I see it differently.",
    dictationExplanation: bilingual("Perceba como but cria contraste sem soar agressivo.", "Notice how but creates contrast without sounding aggressive."),
    freeClozeSentence: "I think the meeting was useful; ___, it was too long.",
    freeClozeAnswer: "however",
    freeClozeAcceptedAnswers: ["however"],
    freeClozeExplanation: bilingual("However introduz uma ideia em contraste.", "However introduces a contrasting idea."),
    speechPrompt: bilingual("Diga em ingles: I think this option is safer because it costs less.", "Say in English: I think this option is safer because it costs less."),
    speechAudio: "I think this option is safer because it costs less.",
    speechExplanation: bilingual("Fale a opiniao e a justificativa como um bloco unico.", "Say the opinion and the reason as one block."),
    roleplayTitle: bilingual("Discussao de equipe", "Team discussion"),
    roleplayContext: bilingual("Sua equipe esta escolhendo entre duas estrategias de lancamento.", "Your team is choosing between two launch strategies."),
    roleplayDialogue: [
      { speaker: "Ana", text: "I think the soft launch is safer because we can test the market first." },
      { speaker: "Leo", text: "I agree, but the full launch might create more impact." },
      { speaker: "Ana", text: "That is true; however, the risk is also higher." },
    ],
    roleplayQuestion: bilingual("Qual resposta continua a discussao de forma equilibrada?", "Which answer continues the discussion in a balanced way?"),
    roleplayOptions: [
      "In my opinion, we should test first because the budget is limited.",
      "In my opinion, should we test first because budget limited.",
      "Because budget limited, opinion first test.",
    ],
    roleplayAnswer: "In my opinion, we should test first because the budget is limited.",
    roleplayExplanation: bilingual("A frase traz posicao clara e justificativa natural.", "The sentence gives a clear position and a natural reason."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "I see your point; however, I prefer the second option.",
      "I see your point; however, I prefer second option more better.",
      "I see your point because however I prefer the second option.",
    ],
    recapChoiceAnswer: "I see your point; however, I prefer the second option.",
    recapChoiceExplanation: bilingual("A frase contrasta ideias de forma clara e correta.", "The sentence contrasts ideas clearly and correctly."),
    recapTextPrompt: bilingual("Escreva em ingles: Eu concordo, mas precisamos de mais tempo.", "Write in English: I agree, but we need more time."),
    recapTextAnswer: "I agree, but we need more time.",
    recapTextAcceptedAnswers: ["I agree, but we need more time."],
    recapTextExplanation: bilingual("Use but para adicionar uma ressalva simples.", "Use but to add a simple reservation."),
    recapSpeechPrompt: bilingual("Diga: In my opinion, this idea is strong.", "Say: In my opinion, this idea is strong."),
    recapSpeechAudio: "In my opinion, this idea is strong.",
    recapSpeechExplanation: bilingual("Repita a abertura de opiniao para ganhar fluidez.", "Repeat the opinion opener to build fluency."),
  },
  {
    id: "c1_idioms_word_formation",
    conceptKey: "c1.idioms_word_formation",
    title: bilingual("Idioms, adjective order e word formation", "Idioms, adjective order, and word formation"),
    summary: bilingual("Misture naturalidade lexical com idioms, ordem de adjetivos e prefixos/sufixos frequentes.", "Mix lexical naturalness with idioms, adjective order, and frequent prefixes/suffixes."),
    masterySignal: bilingual("Voce usa linguagem mais idiomatica e mais precisa ao descrever pessoas, objetos e situacoes.", "You use more idiomatic and more precise language when describing people, objects, and situations."),
    guidePoints: [
      bilingual("Adjective order ajuda a frase a soar nativa, mesmo quando a gramatica basica ja esta correta.", "Adjective order helps the sentence sound native, even when the basic grammar is already correct."),
      bilingual("Prefixos e sufixos ampliam repertorio sem obrigar a decorar palavra por palavra.", "Prefixes and suffixes expand repertoire without forcing word-by-word memorization."),
      bilingual("Idioms e collocations devem soar naturais, nunca encaixados a forca.", "Idioms and collocations should sound natural, never forced in."),
    ],
    choicePrompt: bilingual("Qual ordem de adjetivos soa mais natural?", "Which adjective order sounds more natural?"),
    choiceOptions: [
      "a beautiful old Italian painting",
      "an Italian old beautiful painting",
      "a painting beautiful old Italian",
    ],
    choiceAnswer: "a beautiful old Italian painting",
    choiceExplanation: bilingual("Opinion + age + origin + noun segue uma ordem natural frequente.", "Opinion + age + origin + noun follows a frequent natural order."),
    clozeSentence: "The company is trying to ___ its image after the scandal.",
    clozeOptions: ["rebuild", "underbuild", "megabuild"],
    clozeAnswer: "rebuild",
    clozeExplanation: bilingual("O prefixo re- traz a ideia de fazer de novo.", "The prefix re- carries the idea of doing again."),
    listenAudio: "After months of pressure, he finally broke the ice with the new team.",
    listenOptions: [
      "He made the interaction easier.",
      "He caused a conflict immediately.",
      "He ended the project suddenly.",
    ],
    listenAnswer: "He made the interaction easier.",
    listenExplanation: bilingual("Break the ice significa tornar a interacao inicial mais facil.", "Break the ice means to make the initial interaction easier."),
    textPrompt: bilingual("Escreva em ingles: uma mesa pequena de madeira redonda", "Write in English: a small round wooden table"),
    textAnswer: "a small round wooden table",
    textAcceptedAnswers: ["a small round wooden table"],
    textExplanation: bilingual("Size + shape + material + noun segue uma ordem natural.", "Size + shape + material + noun follows a natural order."),
    orderTokens: ["She", "gave", "me", "a", "useful", "little", "career", "tip."],
    orderBank: ["career", "a", "useful", "me", "little", "She", "tip.", "gave"],
    orderExplanation: bilingual("Useful little career tip soa mais natural do que uma ordem aleatoria.", "Useful little career tip sounds more natural than a random order."),
    dictationAudio: "That comment really hit the nail on the head.",
    dictationExplanation: bilingual("Hit the nail on the head significa descrever algo com precisao.", "Hit the nail on the head means to describe something with precision."),
    freeClozeSentence: "The policy was designed to reduce over___ and waste.",
    freeClozeAnswer: "consumption",
    freeClozeAcceptedAnswers: ["consumption"],
    freeClozeExplanation: bilingual("Over- acrescenta a ideia de excesso a uma base lexical.", "Over- adds the idea of excess to a lexical base."),
    speechPrompt: bilingual("Diga em ingles: a charming old French hotel", "Say in English: a charming old French hotel"),
    speechAudio: "a charming old French hotel",
    speechExplanation: bilingual("Fale os adjetivos na ordem natural antes do substantivo.", "Say the adjectives in natural order before the noun."),
    roleplayTitle: bilingual("Critica cultural", "Cultural review"),
    roleplayContext: bilingual("Voce esta comentando um livro e uma exposicao com linguagem mais natural e idiomatica.", "You are commenting on a book and an exhibition with more natural and idiomatic language."),
    roleplayDialogue: [
      { speaker: "Reviewer", text: "The novel starts slowly, but the ending really hits the nail on the head." },
      { speaker: "Host", text: "And how would you describe the exhibition?" },
      { speaker: "Reviewer", text: "It was a fascinating large modern urban installation." },
    ],
    roleplayQuestion: bilingual("Qual frase segue esse mesmo nivel de naturalidade?", "Which sentence follows the same level of naturalness?"),
    roleplayOptions: [
      "It was a striking small contemporary art piece.",
      "It was a contemporary small striking art piece.",
      "It was a piece art contemporary striking small.",
    ],
    roleplayAnswer: "It was a striking small contemporary art piece.",
    roleplayExplanation: bilingual("A ordem escolhida soa muito mais natural para descricao.", "The chosen order sounds much more natural for description."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "That explanation was spot on.",
      "That explanation was on spot the.",
      "That explanation spotted on.",
    ],
    recapChoiceAnswer: "That explanation was spot on.",
    recapChoiceExplanation: bilingual("Spot on e uma expressao de alta naturalidade para precisao.", "Spot on is a highly natural expression for precision."),
    recapTextPrompt: bilingual("Escreva em ingles: um casaco longo preto elegante", "Write in English: an elegant long black coat"),
    recapTextAnswer: "an elegant long black coat",
    recapTextAcceptedAnswers: ["an elegant long black coat"],
    recapTextExplanation: bilingual("Opinion + length + color + noun segue uma ordem natural.", "Opinion + length + color + noun follows a natural order."),
    recapSpeechPrompt: bilingual("Diga: The team needs to rethink the strategy.", "Say: The team needs to rethink the strategy."),
    recapSpeechAudio: "The team needs to rethink the strategy.",
    recapSpeechExplanation: bilingual("Repita um verbo com prefixo produtivo de alto uso.", "Repeat a verb with a high-use productive prefix."),
  },
  {
    id: "b1_comparatives_refined",
    conceptKey: "b1.comparatives_refined",
    title: bilingual("Comparatives e superlatives com mais precisao", "Comparatives and superlatives with more precision"),
    summary: bilingual("Aprofunde comparacoes com better, worse, more, less, as...as e the most.", "Deepen comparisons with better, worse, more, less, as...as, and the most."),
    masterySignal: bilingual("Voce compara pessoas, servicos e ideias com mais naturalidade.", "You compare people, services, and ideas more naturally."),
    guidePoints: [
      bilingual("Use than para comparar duas coisas.", "Use than to compare two things."),
      bilingual("Use as...as para igualdade e not as...as para desigualdade.", "Use as...as for equality and not as...as for inequality."),
      bilingual("Use superlatives para destacar o extremo dentro de um grupo.", "Use superlatives to highlight the extreme inside a group."),
    ],
    choicePrompt: bilingual("Qual frase esta correta?", "Which sentence is correct?"),
    choiceOptions: [
      "This route is faster than the other one.",
      "This route is more fast than the other one.",
      "This route is fastest than the other one.",
    ],
    choiceAnswer: "This route is faster than the other one.",
    choiceExplanation: bilingual("Fast forma o comparativo com -er: faster.", "Fast forms the comparative with -er: faster."),
    clozeSentence: "Her presentation was ___ than mine.",
    clozeOptions: ["better", "best", "more good"],
    clozeAnswer: "better",
    clozeExplanation: bilingual("Good tem comparativo irregular: better.", "Good has the irregular comparative: better."),
    listenAudio: "This is the most reliable option we have.",
    listenOptions: [
      "The speaker is choosing the top option in a group.",
      "The speaker is comparing only two options.",
      "The speaker is rejecting all options.",
    ],
    listenAnswer: "The speaker is choosing the top option in a group.",
    listenExplanation: bilingual("The most reliable indica superlativo.", "The most reliable indicates a superlative."),
    textPrompt: bilingual("Escreva em ingles: Este aplicativo e tao util quanto o outro.", "Write in English: This app is as useful as the other one."),
    textAnswer: "This app is as useful as the other one.",
    textAcceptedAnswers: ["This app is as useful as the other one."],
    textExplanation: bilingual("As useful as expressa igualdade.", "As useful as expresses equality."),
    orderTokens: ["This", "is", "the", "cheapest", "hotel", "in", "the", "area."],
    orderBank: ["the", "hotel", "This", "in", "area.", "cheapest", "the", "is"],
    orderExplanation: bilingual("Cheapest funciona como superlativo dentro do grupo.", "Cheapest works as a superlative inside the group."),
    dictationAudio: "My new schedule is less stressful than the old one.",
    dictationExplanation: bilingual("Observe o uso de less com adjetivos longos ou ideias graduais.", "Notice the use of less with longer adjectives or gradual ideas."),
    freeClozeSentence: "This chair is not as comfortable ___ that one.",
    freeClozeAnswer: "as",
    freeClozeAcceptedAnswers: ["as"],
    freeClozeExplanation: bilingual("A estrutura completa e not as comfortable as.", "The full structure is not as comfortable as."),
    speechPrompt: bilingual("Diga em ingles: This solution is better than the previous one.", "Say in English: This solution is better than the previous one."),
    speechAudio: "This solution is better than the previous one.",
    speechExplanation: bilingual("Use better como comparativo irregular de good.", "Use better as the irregular comparative of good."),
    roleplayTitle: bilingual("Escolha de fornecedor", "Choosing a supplier"),
    roleplayContext: bilingual("Voce esta comparando tres fornecedores com sua equipe.", "You are comparing three suppliers with your team."),
    roleplayDialogue: [
      { speaker: "Manager", text: "Supplier A is cheaper, but Supplier B is more reliable." },
      { speaker: "Analyst", text: "Supplier C is the fastest, but it is also the most expensive." },
      { speaker: "Manager", text: "So we need the best balance overall." },
    ],
    roleplayQuestion: bilingual("Qual frase resume melhor a ideia de equilibrio?", "Which sentence best summarizes the idea of balance?"),
    roleplayOptions: [
      "Supplier B is more reliable than A, and C is the fastest.",
      "Supplier B is reliabler than A, and C is the fast.",
      "Supplier C is more fastest and more expensive.",
    ],
    roleplayAnswer: "Supplier B is more reliable than A, and C is the fastest.",
    roleplayExplanation: bilingual("A frase usa comparativo e superlativo de forma correta.", "The sentence uses the comparative and superlative correctly."),
    recapChoicePrompt: bilingual("Escolha a frase correta.", "Choose the correct sentence."),
    recapChoiceOptions: [
      "This task is less urgent than that one.",
      "This task is little urgent than that one.",
      "This task is lesser urgent than that one.",
    ],
    recapChoiceAnswer: "This task is less urgent than that one.",
    recapChoiceExplanation: bilingual("Less urgent funciona bem para graduar um adjetivo.", "Less urgent works well to grade an adjective."),
    recapTextPrompt: bilingual("Escreva em ingles: Ela e a pessoa mais experiente da equipe.", "Write in English: She is the most experienced person on the team."),
    recapTextAnswer: "She is the most experienced person on the team.",
    recapTextAcceptedAnswers: ["She is the most experienced person on the team."],
    recapTextExplanation: bilingual("Most experienced marca o extremo em um grupo.", "Most experienced marks the extreme in a group."),
    recapSpeechPrompt: bilingual("Diga: This option is not as safe as the other one.", "Say: This option is not as safe as the other one."),
    recapSpeechAudio: "This option is not as safe as the other one.",
    recapSpeechExplanation: bilingual("Treine a estrutura not as...as para desigualdade.", "Practice the structure not as...as for inequality."),
  },

];

function buildDeepLessons(spec) {
  return [
    { id: `${spec.id}_01`, type: "choice", prompt: spec.choicePrompt, options: spec.choiceOptions, answer: spec.choiceAnswer, explanation: spec.choiceExplanation },
    { id: `${spec.id}_02`, type: "cloze", prompt: bilingual("Complete com a melhor opcao.", "Complete with the best option."), sentence: spec.clozeSentence, options: spec.clozeOptions, answer: spec.clozeAnswer, explanation: spec.clozeExplanation },
    { id: `${spec.id}_03`, type: "listen_choice", prompt: bilingual("Escute e escolha a opcao correta.", "Listen and choose the correct option."), audioText: spec.listenAudio, options: spec.listenOptions, answer: spec.listenAnswer, explanation: spec.listenExplanation },
    { id: `${spec.id}_04`, type: "text", prompt: spec.textPrompt, answer: spec.textAnswer, acceptedAnswers: spec.textAcceptedAnswers, explanation: spec.textExplanation },
    { id: `${spec.id}_05`, type: "order", prompt: bilingual("Monte a frase correta.", "Build the correct sentence."), answerTokens: spec.orderTokens, bank: spec.orderBank, explanation: spec.orderExplanation },
    { id: `${spec.id}_06`, type: "dictation", prompt: bilingual("Digite exatamente o que voce ouvir.", "Type exactly what you hear."), audioText: spec.dictationAudio, answer: spec.dictationAudio, explanation: spec.dictationExplanation },
    { id: `${spec.id}_07`, type: "cloze_text", prompt: bilingual("Complete com uma palavra.", "Complete with one word."), sentence: spec.freeClozeSentence, answer: spec.freeClozeAnswer, acceptedAnswers: spec.freeClozeAcceptedAnswers, explanation: spec.freeClozeExplanation },
    { id: `${spec.id}_08`, type: "speech", prompt: spec.speechPrompt, audioText: spec.speechAudio, answer: spec.speechAudio, explanation: spec.speechExplanation },
    { id: `${spec.id}_09`, type: "roleplay", scenarioTitle: spec.roleplayTitle, context: spec.roleplayContext, dialogue: spec.roleplayDialogue, question: spec.roleplayQuestion, options: spec.roleplayOptions, answer: spec.roleplayAnswer, explanation: spec.roleplayExplanation },
    { id: `${spec.id}_10`, type: "choice", prompt: spec.recapChoicePrompt, options: spec.recapChoiceOptions, answer: spec.recapChoiceAnswer, explanation: spec.recapChoiceExplanation },
    { id: `${spec.id}_11`, type: "text", prompt: spec.recapTextPrompt, answer: spec.recapTextAnswer, acceptedAnswers: spec.recapTextAcceptedAnswers, explanation: spec.recapTextExplanation },
    { id: `${spec.id}_12`, type: "speech", prompt: spec.recapSpeechPrompt, audioText: spec.recapSpeechAudio, answer: spec.recapSpeechAudio, explanation: spec.recapSpeechExplanation },
  ];
}

function buildB1DeepUnits(locale) {
  return B1_DEEP_UNIT_SPECS.map((rawSpec) => {
    const spec = localizeGeneratedValue({
      ...rawSpec,
      lessons: buildDeepLessons(rawSpec),
    }, locale);
    return {
      id: spec.id,
      title: spec.title,
      summary: spec.summary,
      masterySignal: spec.masterySignal,
      conceptKey: spec.conceptKey,
      mode: "exercise",
      guidePoints: ensureArray(spec.guidePoints),
      lessons: ensureArray(spec.lessons).map((lesson, lessonIndex) => ({
        ...lesson,
        id: lesson.id || `${spec.id}_${lessonIndex + 1}`,
        conceptKey: spec.conceptKey,
        lang: "en-US",
      })),
    };
  });
}

function buildB2DeepUnits(locale) {
  return B2_DEEP_UNIT_SPECS.map((rawSpec) => {
    const spec = localizeGeneratedValue({
      ...rawSpec,
      lessons: buildDeepLessons(rawSpec),
    }, locale);
    return {
      id: spec.id,
      title: spec.title,
      summary: spec.summary,
      masterySignal: spec.masterySignal,
      conceptKey: spec.conceptKey,
      mode: "exercise",
      guidePoints: ensureArray(spec.guidePoints),
      lessons: ensureArray(spec.lessons).map((lesson, lessonIndex) => ({
        ...lesson,
        id: lesson.id || `${spec.id}_${lessonIndex + 1}`,
        conceptKey: spec.conceptKey,
        lang: "en-US",
      })),
    };
  });
}

function buildC1DeepUnits(locale) {
  return C1_DEEP_UNIT_SPECS.map((rawSpec) => {
    const spec = localizeGeneratedValue({
      ...rawSpec,
      lessons: buildDeepLessons(rawSpec),
    }, locale);
    return {
      id: spec.id,
      title: spec.title,
      summary: spec.summary,
      masterySignal: spec.masterySignal,
      conceptKey: spec.conceptKey,
      mode: "exercise",
      guidePoints: ensureArray(spec.guidePoints),
      lessons: ensureArray(spec.lessons).map((lesson, lessonIndex) => ({
        ...lesson,
        id: lesson.id || `${spec.id}_${lessonIndex + 1}`,
        conceptKey: spec.conceptKey,
        lang: "en-US",
      })),
    };
  });
}

function buildGeneratedLevelUnits(levelId, locale) {
  const normalizedLevel = String(levelId || "A1").toUpperCase();
  const topics = LEVEL_TOPICS[normalizedLevel] || [];
  const options = LEVEL_OPTION_TRANSLATIONS[locale] || LEVEL_OPTION_TRANSLATIONS["en-US"];
  const answer = options[0] || "";
  const promptBuilder = LEVEL_PROMPT_TRANSLATIONS[locale] || LEVEL_PROMPT_TRANSLATIONS["en-US"];

  return topics.map((topic, index) => ({
    id: `${normalizedLevel.toLowerCase()}-u${index + 1}`,
    title: topic,
    mode: index % 3 === 2 ? "conversation" : "exercise",
    lessons: [{
      id: `${normalizedLevel.toLowerCase()}-${index + 1}-1`,
      type: "choice",
      prompt: promptBuilder(normalizedLevel, topic),
      options,
      answer,
    }],
  }));
}

function roleplayUnitOrder(index) {
  return (index + 1) * ROLEPLAY_INSERT_INTERVAL * 10 + 5;
}

export async function buildLocalizedGrammarPayload(levelId = "A1", locale = "pt-BR") {
  const normalizedLevel = String(levelId || "A1").toUpperCase();
  const { englishMap, baseUnits, roleplayScenarios } = await extractGrammarSourceContent();
  if (normalizedLevel === "B1") {
    return { units: buildB1DeepUnits(locale), roleplayScenarios: [] };
  }
  if (normalizedLevel === "B2") {
    return { units: buildB2DeepUnits(locale), roleplayScenarios: [] };
  }
  if (normalizedLevel === "C1") {
    return { units: buildC1DeepUnits(locale), roleplayScenarios: [] };
  }
  if (normalizedLevel !== "A1") {
    return { units: buildGeneratedLevelUnits(normalizedLevel, locale), roleplayScenarios: [] };
  }

  return {
    units: deepLocalize(baseUnits, locale, englishMap),
    roleplayScenarios: deepLocalize(roleplayScenarios, locale, englishMap),
  };
}

export async function seedGrammarContent(pool) {
  const levels = ["A1", ...Object.keys(LEVEL_TOPICS)];
  for (const level of levels) {
    for (const locale of SUPPORTED_GRAMMAR_CONTENT_LOCALES) {
      const payload = await buildLocalizedGrammarPayload(level, locale);
      const translationMode = translationModeForLocale(locale);
      const id = `grammar__${level}__${locale}`;

      await pool.query(
        `INSERT INTO english_grammar_content (id, module_key, level_id, locale, payload_json, translation_mode, updated_at)
         VALUES ($1, 'grammar', $2, $3, $4::jsonb, $5, NOW())
         ON CONFLICT (module_key, level_id, locale)
         DO UPDATE SET payload_json = EXCLUDED.payload_json, translation_mode = EXCLUDED.translation_mode, updated_at = NOW()`,
        [id, level, locale, JSON.stringify(payload), translationMode]
      );
    }
  }
}

async function clearRelationalGrammarLevel(pool, levelId = "A1") {
  const normalizedLevel = String(levelId || "A1").toUpperCase();
  await pool.query(
    `DELETE FROM english_grammar_lesson_answer_translations WHERE answer_id IN (
      SELECT a.id
        FROM english_grammar_lesson_answers a
        JOIN english_grammar_lessons l ON l.id = a.lesson_id
        JOIN english_grammar_units u ON u.id = l.unit_id
       WHERE u.level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(
    `DELETE FROM english_grammar_lesson_answers WHERE lesson_id IN (
      SELECT l.id
        FROM english_grammar_lessons l
        JOIN english_grammar_units u ON u.id = l.unit_id
       WHERE u.level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(
    `DELETE FROM english_grammar_lesson_option_translations WHERE option_id IN (
      SELECT o.id
        FROM english_grammar_lesson_options o
        JOIN english_grammar_lessons l ON l.id = o.lesson_id
        JOIN english_grammar_units u ON u.id = l.unit_id
       WHERE u.level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(
    `DELETE FROM english_grammar_lesson_options WHERE lesson_id IN (
      SELECT l.id
        FROM english_grammar_lessons l
        JOIN english_grammar_units u ON u.id = l.unit_id
       WHERE u.level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(
    `DELETE FROM english_grammar_dialogue_line_translations WHERE dialogue_line_id IN (
      SELECT d.id
        FROM english_grammar_dialogue_lines d
        JOIN english_grammar_lessons l ON l.id = d.lesson_id
        JOIN english_grammar_units u ON u.id = l.unit_id
       WHERE u.level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(
    `DELETE FROM english_grammar_dialogue_lines WHERE lesson_id IN (
      SELECT l.id
        FROM english_grammar_lessons l
        JOIN english_grammar_units u ON u.id = l.unit_id
       WHERE u.level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(
    `DELETE FROM english_grammar_lesson_translations WHERE lesson_id IN (
      SELECT l.id
        FROM english_grammar_lessons l
        JOIN english_grammar_units u ON u.id = l.unit_id
       WHERE u.level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(
    `DELETE FROM english_grammar_lessons WHERE unit_id IN (
      SELECT id FROM english_grammar_units WHERE level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(
    `DELETE FROM english_grammar_guide_point_translations WHERE guide_point_id IN (
      SELECT gp.id
        FROM english_grammar_guide_points gp
        JOIN english_grammar_units u ON u.id = gp.unit_id
       WHERE u.level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(
    `DELETE FROM english_grammar_guide_points WHERE unit_id IN (
      SELECT id FROM english_grammar_units WHERE level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(
    `DELETE FROM english_grammar_unit_translations WHERE unit_id IN (
      SELECT id FROM english_grammar_units WHERE level_id = $1
    )`,
    [normalizedLevel]
  );
  await pool.query(`DELETE FROM english_grammar_units WHERE level_id = $1`, [normalizedLevel]);
}

async function insertUnit(pool, unitId, levelId, unitOrder, mode, conceptKey, sourceUnitKey) {
  await pool.query(
    `INSERT INTO english_grammar_units (id, level_id, unit_order, concept_key, mode, source_unit_key, is_active, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, true, NOW())`,
    [unitId, levelId, unitOrder, conceptKey || "", mode || "exercise", sourceUnitKey || ""]
  );
}

async function insertUnitTranslations(pool, unitId, locales, getter) {
  for (const locale of locales) {
    const localizedUnit = getter(locale) || {};
    await pool.query(
      `INSERT INTO english_grammar_unit_translations (id, unit_id, locale, title, summary, mastery_signal, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        makeId("grammar_unit_translation", unitId, locale),
        unitId,
        locale,
        localizedUnit.title || "",
        localizedUnit.summary || "",
        localizedUnit.masterySignal || "",
      ]
    );
  }
}

async function insertGuidePoints(pool, unitId, locales, getter) {
  const ptGuidePoints = ensureArray(getter("pt-BR")?.guidePoints);
  for (const [guideIndex] of ptGuidePoints.entries()) {
    const guidePointId = makeId("grammar_guide_point", unitId, guideIndex + 1);
    await pool.query(
      `INSERT INTO english_grammar_guide_points (id, unit_id, sort_order)
       VALUES ($1, $2, $3)`,
      [guidePointId, unitId, guideIndex + 1]
    );

    for (const locale of locales) {
      const localizedGuidePoints = ensureArray(getter(locale)?.guidePoints);
      await pool.query(
        `INSERT INTO english_grammar_guide_point_translations (id, guide_point_id, locale, text_value, updated_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          makeId("grammar_guide_point_translation", guidePointId, locale),
          guidePointId,
          locale,
          localizedGuidePoints[guideIndex] || "",
        ]
      );
    }
  }
}

async function insertLesson(pool, lessonId, unitId, lessonOrder, baseLesson) {
  await pool.query(
    `INSERT INTO english_grammar_lessons (
      id, unit_id, lesson_order, lesson_type, concept_key, source_lesson_key, lang,
      audio_text, sentence, wrong_fragment, cover_emoji, is_active, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW())`,
    [
      lessonId,
      unitId,
      lessonOrder,
      baseLesson.type || "choice",
      baseLesson.conceptKey || "",
      baseLesson.id || `lesson_${lessonOrder}`,
      baseLesson.lang || "en-US",
      baseLesson.audioText || "",
      baseLesson.sentence || "",
      baseLesson.wrongFragment || "",
      baseLesson.coverEmoji || "",
    ]
  );
}

async function insertLessonTranslations(pool, lessonId, locales, getter) {
  for (const locale of locales) {
    const localizedLesson = getter(locale) || {};
    await pool.query(
      `INSERT INTO english_grammar_lesson_translations (
        id, lesson_id, locale, prompt, explanation, question, context, scenario_title,
        supporting_copy, placeholder, sentence_text, wrong_fragment_text, audio_text_value, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [
        makeId("grammar_lesson_translation", lessonId, locale),
        lessonId,
        locale,
        localizedLesson.prompt || "",
        localizedLesson.explanation || "",
        localizedLesson.question || "",
        localizedLesson.context || "",
        localizedLesson.scenarioTitle || "",
        localizedLesson.supportingCopy || "",
        localizedLesson.placeholder || "",
        localizedLesson.sentence || "",
        localizedLesson.wrongFragment || "",
        localizedLesson.audioText || "",
      ]
    );
  }
}

async function insertDialogue(pool, lessonId, locales, getter) {
  const ptLines = ensureArray(getter("pt-BR")?.dialogue);
  for (const [lineIndex, ptLine] of ptLines.entries()) {
    const dialogueLineId = makeId("grammar_dialogue_line", lessonId, lineIndex + 1);
    await pool.query(
      `INSERT INTO english_grammar_dialogue_lines (id, lesson_id, line_order, speaker_key)
       VALUES ($1, $2, $3, $4)`,
      [dialogueLineId, lessonId, lineIndex + 1, ptLine.speaker || ""]
    );

    for (const locale of locales) {
      const localizedLine = ensureArray(getter(locale)?.dialogue)[lineIndex] || ptLine;
      await pool.query(
        `INSERT INTO english_grammar_dialogue_line_translations (id, dialogue_line_id, locale, speaker_label, text_value, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          makeId("grammar_dialogue_line_translation", dialogueLineId, locale),
          dialogueLineId,
          locale,
          localizedLine.speaker || ptLine.speaker || "",
          localizedLine.text || "",
        ]
      );
    }
  }
}

async function insertOptions(pool, lessonId, locales, getter) {
  const ptOptions = ensureArray(getter("pt-BR")?.options);
  const ptAnswer = getter("pt-BR")?.answer;
  const ptTokens = new Set(ensureArray(getter("pt-BR")?.answerTokens));
  if (ptAnswer) ptTokens.add(ptAnswer);

  for (const [optionIndex, ptOption] of ptOptions.entries()) {
    const optionId = makeId("grammar_option", lessonId, optionIndex + 1);
    await pool.query(
      `INSERT INTO english_grammar_lesson_options (id, lesson_id, option_order, option_key, is_correct)
       VALUES ($1, $2, $3, $4, $5)`,
      [optionId, lessonId, optionIndex + 1, `option_${optionIndex + 1}`, ptTokens.has(ptOption)]
    );

    for (const locale of locales) {
      const localizedOptions = ensureArray(getter(locale)?.options);
      await pool.query(
        `INSERT INTO english_grammar_lesson_option_translations (id, option_id, locale, text_value, updated_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          makeId("grammar_option_translation", optionId, locale),
          optionId,
          locale,
          localizedOptions[optionIndex] || "",
        ]
      );
    }
  }
}

async function insertAnswers(pool, lessonId, locales, getter) {
  const definitions = [
    ["answer", (lesson) => (lesson?.answer ? [lesson.answer] : [])],
    ["accepted", (lesson) => ensureArray(lesson?.acceptedAnswers)],
    ["answer_token", (lesson) => ensureArray(lesson?.answerTokens)],
    ["bank", (lesson) => ensureArray(lesson?.bank)],
  ];

  for (const [answerType, resolver] of definitions) {
    const ptValues = resolver(getter("pt-BR"));
    for (const [answerIndex] of ptValues.entries()) {
      const answerId = makeId("grammar_answer", lessonId, answerType, answerIndex + 1);
      await pool.query(
        `INSERT INTO english_grammar_lesson_answers (id, lesson_id, answer_type, answer_order, answer_key)
         VALUES ($1, $2, $3, $4, $5)`,
        [answerId, lessonId, answerType, answerIndex + 1, `${answerType}_${answerIndex + 1}`]
      );

      for (const locale of locales) {
        const localizedValues = resolver(getter(locale));
        await pool.query(
          `INSERT INTO english_grammar_lesson_answer_translations (id, answer_id, locale, text_value, updated_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            makeId("grammar_answer_translation", answerId, locale),
            answerId,
            locale,
            localizedValues[answerIndex] || "",
          ]
        );
      }
    }
  }
}

export async function seedGrammarRelationalContent(pool, levelId = "A1") {
  const normalizedLevel = String(levelId || "A1").toUpperCase();

  const localizedByLocale = {};
  for (const locale of SUPPORTED_GRAMMAR_CONTENT_LOCALES) {
    localizedByLocale[locale] = await buildLocalizedGrammarPayload(normalizedLevel, locale);
  }

  await clearRelationalGrammarLevel(pool, normalizedLevel);

  const ptPayload = localizedByLocale["pt-BR"] || { units: [], roleplayScenarios: [] };

  for (const [unitIndex, unit] of ensureArray(ptPayload.units).entries()) {
    const unitId = makeId("grammar_unit", normalizedLevel, unit.id || `u${unitIndex + 1}`);
    await insertUnit(pool, unitId, normalizedLevel, (unitIndex + 1) * 10, "exercise", unit.conceptKey || "", unit.id || `u${unitIndex + 1}`);
    await insertUnitTranslations(pool, unitId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray(localizedByLocale[locale]?.units)[unitIndex] || unit);
    await insertGuidePoints(pool, unitId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray(localizedByLocale[locale]?.units)[unitIndex] || unit);

    const ptLessons = ensureArray(unit.lessons);
    for (const [lessonIndex, lesson] of ptLessons.entries()) {
      const lessonId = makeId("grammar_lesson", unitId, lesson.id || `lesson_${lessonIndex + 1}`);
      await insertLesson(pool, lessonId, unitId, lessonIndex + 1, lesson);
      await insertLessonTranslations(pool, lessonId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray((ensureArray(localizedByLocale[locale]?.units)[unitIndex] || {}).lessons)[lessonIndex] || lesson);
      await insertDialogue(pool, lessonId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray((ensureArray(localizedByLocale[locale]?.units)[unitIndex] || {}).lessons)[lessonIndex] || lesson);
      await insertOptions(pool, lessonId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray((ensureArray(localizedByLocale[locale]?.units)[unitIndex] || {}).lessons)[lessonIndex] || lesson);
      await insertAnswers(pool, lessonId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray((ensureArray(localizedByLocale[locale]?.units)[unitIndex] || {}).lessons)[lessonIndex] || lesson);
    }
  }

  if (normalizedLevel === "A1") {
  for (const [scenarioIndex, scenario] of ensureArray(ptPayload.roleplayScenarios).entries()) {
    const unitId = makeId("grammar_unit", normalizedLevel, scenario.id || `c${scenarioIndex + 1}`);
    await insertUnit(pool, unitId, normalizedLevel, roleplayUnitOrder(scenarioIndex), "conversation", "", scenario.id || `c${scenarioIndex + 1}`);
    await insertUnitTranslations(pool, unitId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray(localizedByLocale[locale]?.roleplayScenarios)[scenarioIndex] || scenario);

    const lessonId = makeId("grammar_lesson", unitId, `${scenario.id || `c${scenarioIndex + 1}`}_roleplay`);
    const baseLesson = { ...scenario, id: `${scenario.id || `c${scenarioIndex + 1}`}-roleplay`, type: "roleplay" };
    await insertLesson(pool, lessonId, unitId, 1, baseLesson);
    await insertLessonTranslations(pool, lessonId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray(localizedByLocale[locale]?.roleplayScenarios)[scenarioIndex] || scenario);
    await insertDialogue(pool, lessonId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray(localizedByLocale[locale]?.roleplayScenarios)[scenarioIndex] || scenario);
    await insertOptions(pool, lessonId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray(localizedByLocale[locale]?.roleplayScenarios)[scenarioIndex] || scenario);
    await insertAnswers(pool, lessonId, SUPPORTED_GRAMMAR_CONTENT_LOCALES, (locale) => ensureArray(localizedByLocale[locale]?.roleplayScenarios)[scenarioIndex] || scenario);
  }
  }
}

async function fetchRelationalGrammarContent(pool, locale, levelId) {
  const normalizedLevel = String(levelId || "A1").toUpperCase();
  const normalizedLocale = normalizeLocale(locale);

  const { rows: unitRows } = await pool.query(
    `SELECT u.id, u.level_id, u.unit_order, u.concept_key, u.mode, u.source_unit_key,
            t.title, t.summary, t.mastery_signal
       FROM english_grammar_units u
       JOIN english_grammar_unit_translations t ON t.unit_id = u.id AND t.locale = $2
      WHERE u.level_id = $1
      ORDER BY u.unit_order ASC`,
    [normalizedLevel, normalizedLocale]
  );
  if (!unitRows.length) return null;

  const { rows: guideRows } = await pool.query(
    `SELECT gp.unit_id, gp.sort_order, t.text_value
       FROM english_grammar_guide_points gp
       JOIN english_grammar_units u ON u.id = gp.unit_id
       JOIN english_grammar_guide_point_translations t ON t.guide_point_id = gp.id AND t.locale = $2
      WHERE u.level_id = $1
      ORDER BY gp.unit_id ASC, gp.sort_order ASC`,
    [normalizedLevel, normalizedLocale]
  );

  const { rows: lessonRows } = await pool.query(
    `SELECT l.id, l.unit_id, l.lesson_order, l.lesson_type, l.concept_key, l.source_lesson_key, l.lang,
            l.audio_text, l.sentence, l.wrong_fragment, l.cover_emoji,
            t.prompt, t.explanation, t.question, t.context, t.scenario_title,
            t.supporting_copy, t.placeholder, t.sentence_text, t.wrong_fragment_text, t.audio_text_value
       FROM english_grammar_lessons l
       JOIN english_grammar_units u ON u.id = l.unit_id
       JOIN english_grammar_lesson_translations t ON t.lesson_id = l.id AND t.locale = $2
      WHERE u.level_id = $1
      ORDER BY l.unit_id ASC, l.lesson_order ASC`,
    [normalizedLevel, normalizedLocale]
  );

  const { rows: dialogueRows } = await pool.query(
    `SELECT d.lesson_id, d.line_order, t.speaker_label, t.text_value
       FROM english_grammar_dialogue_lines d
       JOIN english_grammar_lessons l ON l.id = d.lesson_id
       JOIN english_grammar_units u ON u.id = l.unit_id
       JOIN english_grammar_dialogue_line_translations t ON t.dialogue_line_id = d.id AND t.locale = $2
      WHERE u.level_id = $1
      ORDER BY d.lesson_id ASC, d.line_order ASC`,
    [normalizedLevel, normalizedLocale]
  );

  const { rows: optionRows } = await pool.query(
    `SELECT o.lesson_id, o.option_order, o.is_correct, t.text_value
       FROM english_grammar_lesson_options o
       JOIN english_grammar_lessons l ON l.id = o.lesson_id
       JOIN english_grammar_units u ON u.id = l.unit_id
       JOIN english_grammar_lesson_option_translations t ON t.option_id = o.id AND t.locale = $2
      WHERE u.level_id = $1
      ORDER BY o.lesson_id ASC, o.option_order ASC`,
    [normalizedLevel, normalizedLocale]
  );

  const { rows: answerRows } = await pool.query(
    `SELECT a.lesson_id, a.answer_type, a.answer_order, t.text_value
       FROM english_grammar_lesson_answers a
       JOIN english_grammar_lessons l ON l.id = a.lesson_id
       JOIN english_grammar_units u ON u.id = l.unit_id
       JOIN english_grammar_lesson_answer_translations t ON t.answer_id = a.id AND t.locale = $2
      WHERE u.level_id = $1
      ORDER BY a.lesson_id ASC, a.answer_type ASC, a.answer_order ASC`,
    [normalizedLevel, normalizedLocale]
  );

  const unitMap = new Map();
  unitRows.forEach((row) => {
    unitMap.set(row.id, {
      id: row.source_unit_key || row.id,
      title: row.title || "",
      summary: row.summary || "",
      masterySignal: row.mastery_signal || "",
      conceptKey: row.concept_key || "",
      mode: row.mode || "exercise",
      unitOrder: row.unit_order || 0,
      guidePoints: [],
      lessons: [],
    });
  });

  guideRows.forEach((row) => {
    const unit = unitMap.get(row.unit_id);
    if (unit) unit.guidePoints.push(row.text_value || "");
  });

  const lessonMap = new Map();
  lessonRows.forEach((row) => {
    const lesson = {
      id: row.source_lesson_key || row.id,
      type: row.lesson_type || "choice",
      conceptKey: row.concept_key || "",
      lang: row.lang || "en-US",
      prompt: row.prompt || "",
      explanation: row.explanation || "",
      question: row.question || "",
      context: row.context || "",
      scenarioTitle: row.scenario_title || "",
      supportingCopy: row.supporting_copy || "",
      placeholder: row.placeholder || "",
      sentence: row.sentence_text || row.sentence || "",
      wrongFragment: row.wrong_fragment_text || row.wrong_fragment || "",
      audioText: row.audio_text_value || row.audio_text || "",
      coverEmoji: row.cover_emoji || "",
      dialogue: [],
      options: [],
      acceptedAnswers: [],
      answerTokens: [],
      bank: [],
      answer: "",
    };
    lessonMap.set(row.id, lesson);
    const unit = unitMap.get(row.unit_id);
    if (unit) unit.lessons.push(lesson);
  });

  dialogueRows.forEach((row) => {
    const lesson = lessonMap.get(row.lesson_id);
    if (lesson) lesson.dialogue.push({ speaker: row.speaker_label || "", text: row.text_value || "" });
  });

  optionRows.forEach((row) => {
    const lesson = lessonMap.get(row.lesson_id);
    if (lesson) lesson.options.push(row.text_value || "");
  });

  answerRows.forEach((row) => {
    const lesson = lessonMap.get(row.lesson_id);
    if (!lesson) return;
    if (row.answer_type === "answer") lesson.answer = row.text_value || "";
    if (row.answer_type === "accepted") lesson.acceptedAnswers.push(row.text_value || "");
    if (row.answer_type === "answer_token") lesson.answerTokens.push(row.text_value || "");
    if (row.answer_type === "bank") lesson.bank.push(row.text_value || "");
  });

  const orderedUnits = [...unitMap.values()].sort((a, b) => a.unitOrder - b.unitOrder);
  if (normalizedLevel !== "A1") {
    return { units: orderedUnits.map(({ unitOrder, ...unit }) => unit), roleplayScenarios: [] };
  }

  const exerciseUnits = orderedUnits.filter((unit) => unit.mode !== "conversation").map(({ unitOrder, ...unit }) => unit);
  const roleplayScenarios = orderedUnits.filter((unit) => unit.mode === "conversation").map(({ id, title, lessons }) => {
    const firstLesson = ensureArray(lessons)[0] || {};
    return {
      id,
      title,
      scenarioTitle: firstLesson.scenarioTitle || title || "",
      context: firstLesson.context || "",
      dialogue: ensureArray(firstLesson.dialogue),
      question: firstLesson.question || "",
      options: ensureArray(firstLesson.options),
      answer: firstLesson.answer || "",
      coverEmoji: firstLesson.coverEmoji || "",
    };
  });

  return { units: exerciseUnits, roleplayScenarios };
}

export async function fetchGrammarContentFromDb(pool, locale = "pt-BR", levelId = "A1") {
  const normalizedLevel = String(levelId || "A1").toUpperCase();
  const candidates = Array.from(new Set([normalizeLocale(locale), "en-US", "pt-BR"]));

  for (const candidate of candidates) {
    const relationalPayload = await fetchRelationalGrammarContent(pool, candidate, normalizedLevel);
    if (relationalPayload?.units?.length) {
      return {
        levelId: normalizedLevel,
        locale: candidate,
        translationMode: translationModeForLocale(candidate),
        payload: relationalPayload,
      };
    }

    const { rows } = await pool.query(
      `SELECT locale, payload_json, translation_mode
         FROM english_grammar_content
        WHERE module_key = 'grammar' AND level_id = $1 AND locale = $2
        LIMIT 1`,
      [normalizedLevel, candidate]
    );
    if (rows.length) {
      return {
        levelId: normalizedLevel,
        locale: rows[0].locale,
        translationMode: rows[0].translation_mode || "native",
        payload: rows[0].payload_json || { units: [], roleplayScenarios: [] },
      };
    }
  }

  return {
    levelId: normalizedLevel,
    locale: normalizeLocale(locale),
    translationMode: "fallback",
    payload: { units: [], roleplayScenarios: [] },
  };
}
