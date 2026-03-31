from pathlib import Path
server_dir = Path(r'C:\Users\Geovane TI\Documents\english-platform\server')
repo_path = server_dir / 'grammarContentRepo.js'
repo_path.write_text(r'''import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const GRAMMAR_SOURCE_PATH = path.resolve(SERVER_DIR, "..", "src", "components", "Grammar.jsx");
const ROLEPLAY_INSERT_INTERVAL = 3;

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
  if (typeof text !== "string") return text;
  return englishMap[text] || text;
}

function deepLocalize(value, locale, englishMap) {
  if (typeof value === "string") {
    if (normalizeLocale(locale).toLowerCase().startsWith("pt")) return value;
    return toEnglishFallback(value, englishMap);
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

function roleplayUnitOrder(index) {
  return (index + 1) * ROLEPLAY_INSERT_INTERVAL * 10 + 5;
}

export async function buildLocalizedGrammarPayload(levelId = "A1", locale = "pt-BR") {
  const normalizedLevel = String(levelId || "A1").toUpperCase();
  if (normalizedLevel !== "A1") return { units: [], roleplayScenarios: [] };

  const { englishMap, baseUnits, roleplayScenarios } = await extractGrammarSourceContent();
  return {
    units: deepLocalize(baseUnits, locale, englishMap),
    roleplayScenarios: deepLocalize(roleplayScenarios, locale, englishMap),
  };
}

export async function seedGrammarContent(pool) {
  for (const locale of SUPPORTED_GRAMMAR_CONTENT_LOCALES) {
    const payload = await buildLocalizedGrammarPayload("A1", locale);
    const translationMode = translationModeForLocale(locale);
    const id = `grammar__A1__${locale}`;

    await pool.query(
      `INSERT INTO english_grammar_content (id, module_key, level_id, locale, payload_json, translation_mode, updated_at)
       VALUES ($1, 'grammar', 'A1', $2, $3::jsonb, $4, NOW())
       ON CONFLICT (module_key, level_id, locale)
       DO UPDATE SET payload_json = EXCLUDED.payload_json, translation_mode = EXCLUDED.translation_mode, updated_at = NOW()`,
      [id, locale, JSON.stringify(payload), translationMode]
    );
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
  if (normalizedLevel !== "A1") return;

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
  const exerciseUnits = orderedUnits.filter((unit) => unit.mode !== "conversation").map(({ unitOrder, ...unit }) => unit);
  const roleplayScenarios = orderedUnits
    .filter((unit) => unit.mode === "conversation")
    .map(({ id, title, lessons }) => {
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
''', encoding='utf-8')
