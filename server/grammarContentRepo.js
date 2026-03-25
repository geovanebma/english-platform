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
