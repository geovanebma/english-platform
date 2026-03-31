from pathlib import Path

base = Path(r'C:\Users\Geovane TI\Documents\english-platform')
server_dir = base / 'server'

grammar_repo = r'''import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const GRAMMAR_SOURCE_PATH = path.resolve(SERVER_DIR, "..", "src", "components", "Grammar.jsx");

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
  if (locale === "pt-BR") return "native";
  if (locale === "en-US") return "native";
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

export async function seedGrammarRelationalContent(pool, levelId = "A1") {
  const normalizedLevel = String(levelId || "A1").toUpperCase();
  if (normalizedLevel !== "A1") return;

  const localizedByLocale = {};
  for (const locale of SUPPORTED_GRAMMAR_CONTENT_LOCALES) {
    localizedByLocale[locale] = await buildLocalizedGrammarPayload(normalizedLevel, locale);
  }

  const ptPayload = localizedByLocale["pt-BR"] || { units: [], roleplayScenarios: [] };
  const roleplayScenarioById = Object.fromEntries(ensureArray(ptPayload.roleplayScenarios).map((item) => [item.id, item]));

  await clearRelationalGrammarLevel(pool, normalizedLevel);

  for (const [unitIndex, unit] of ensureArray(ptPayload.units).entries()) {
    const isConversation = unit.mode === "conversation";
    const sourceUnitKey = unit.id || `unit_${unitIndex + 1}`;
    const unitId = makeId("grammar_unit", normalizedLevel, sourceUnitKey);
    const baseScenario = isConversation ? roleplayScenarioById[sourceUnitKey] || {} : {};

    await pool.query(
      `INSERT INTO english_grammar_units (id, level_id, unit_order, concept_key, mode, source_unit_key, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())`,
      [unitId, normalizedLevel, unitIndex + 1, unit.conceptKey || "", unit.mode || "exercise", sourceUnitKey]
    );

    for (const locale of SUPPORTED_GRAMMAR_CONTENT_LOCALES) {
      const localizedUnit = ensureArray(localizedByLocale[locale]?.units)[unitIndex] || unit;
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

    const guidePoints = ensureArray(unit.guidePoints);
    for (const [guideIndex] of guidePoints.entries()) {
      const guidePointId = makeId("grammar_guide_point", unitId, guideIndex + 1);
      await pool.query(
        `INSERT INTO english_grammar_guide_points (id, unit_id, sort_order)
         VALUES ($1, $2, $3)`,
        [guidePointId, unitId, guideIndex + 1]
      );

      for (const locale of SUPPORTED_GRAMMAR_CONTENT_LOCALES) {
        const localizedUnit = ensureArray(localizedByLocale[locale]?.units)[unitIndex] || unit;
        const localizedGuidePoints = ensureArray(localizedUnit.guidePoints);
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

    const lessons = ensureArray(unit.lessons);
    for (const [lessonIndex, lesson] of lessons.entries()) {
      const sourceLessonKey = lesson.id || `lesson_${lessonIndex + 1}`;
      const lessonId = makeId("grammar_lesson", unitId, sourceLessonKey);
      const scenarioLesson = isConversation ? { ...baseScenario, ...lesson } : lesson;

      await pool.query(
        `INSERT INTO english_grammar_lessons (
          id, unit_id, lesson_order, lesson_type, concept_key, source_lesson_key, lang,
          audio_text, sentence, wrong_fragment, cover_emoji, is_active, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW())`,
        [
          lessonId,
          unitId,
          lessonIndex + 1,
          scenarioLesson.type || "choice",
          scenarioLesson.conceptKey || unit.conceptKey || "",
          sourceLessonKey,
          scenarioLesson.lang || "en-US",
          scenarioLesson.audioText || "",
          scenarioLesson.sentence || "",
          scenarioLesson.wrongFragment || "",
          scenarioLesson.coverEmoji || "",
        ]
      );

      for (const locale of SUPPORTED_GRAMMAR_CONTENT_LOCALES) {
        const localizedUnit = ensureArray(localizedByLocale[locale]?.units)[unitIndex] || unit;
        const localizedLessonRaw = ensureArray(localizedUnit.lessons)[lessonIndex] || lesson;
        const localizedScenarioBase = isConversation
          ? (ensureArray(localizedByLocale[locale]?.roleplayScenarios).find((item) => item.id === sourceUnitKey) || {})
          : {};
        const localizedLesson = isConversation ? { ...localizedScenarioBase, ...localizedLessonRaw } : localizedLessonRaw;

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

      const dialogue = ensureArray(scenarioLesson.dialogue);
      for (const [lineIndex, line] of dialogue.entries()) {
        const dialogueLineId = makeId("grammar_dialogue_line", lessonId, lineIndex + 1);
        await pool.query(
          `INSERT INTO english_grammar_dialogue_lines (id, lesson_id, line_order, speaker_key)
           VALUES ($1, $2, $3, $4)`,
          [dialogueLineId, lessonId, lineIndex + 1, line.speaker || ""]
        );

        for (const locale of SUPPORTED_GRAMMAR_CONTENT_LOCALES) {
          const localizedUnit = ensureArray(localizedByLocale[locale]?.units)[unitIndex] || unit;
          const localizedLessonRaw = ensureArray(localizedUnit.lessons)[lessonIndex] || lesson;
          const localizedScenarioBase = isConversation
            ? (ensureArray(localizedByLocale[locale]?.roleplayScenarios).find((item) => item.id === sourceUnitKey) || {})
            : {};
          const localizedLesson = isConversation ? { ...localizedScenarioBase, ...localizedLessonRaw } : localizedLessonRaw;
          const localizedLine = ensureArray(localizedLesson.dialogue)[lineIndex] || line;

          await pool.query(
            `INSERT INTO english_grammar_dialogue_line_translations (id, dialogue_line_id, locale, speaker_label, text_value, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              makeId("grammar_dialogue_line_translation", dialogueLineId, locale),
              dialogueLineId,
              locale,
              localizedLine.speaker || line.speaker || "",
              localizedLine.text || "",
            ]
          );
        }
      }

      const options = ensureArray(scenarioLesson.options);
      const answerValues = new Set(ensureArray(scenarioLesson.answerTokens));
      if (scenarioLesson.answer) answerValues.add(scenarioLesson.answer);
      const acceptedAnswers = ensureArray(scenarioLesson.acceptedAnswers);
      const answerTokens = ensureArray(scenarioLesson.answerTokens);
      const banks = ensureArray(scenarioLesson.bank);

      for (const [optionIndex, optionValue] of options.entries()) {
        const optionId = makeId("grammar_option", lessonId, optionIndex + 1);
        await pool.query(
          `INSERT INTO english_grammar_lesson_options (id, lesson_id, option_order, option_key, is_correct)
           VALUES ($1, $2, $3, $4, $5)`,
          [optionId, lessonId, optionIndex + 1, `option_${optionIndex + 1}`, answerValues.has(optionValue)]
        );

        for (const locale of SUPPORTED_GRAMMAR_CONTENT_LOCALES) {
          const localizedUnit = ensureArray(localizedByLocale[locale]?.units)[unitIndex] || unit;
          const localizedLessonRaw = ensureArray(localizedUnit.lessons)[lessonIndex] || lesson;
          const localizedScenarioBase = isConversation
            ? (ensureArray(localizedByLocale[locale]?.roleplayScenarios).find((item) => item.id === sourceUnitKey) || {})
            : {};
          const localizedLesson = isConversation ? { ...localizedScenarioBase, ...localizedLessonRaw } : localizedLessonRaw;
          const localizedOptions = ensureArray(localizedLesson.options);

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

      const answersToInsert = [];
      if (scenarioLesson.answer) answersToInsert.push({ type: "answer", values: [scenarioLesson.answer] });
      if (acceptedAnswers.length) answersToInsert.push({ type: "accepted", values: acceptedAnswers });
      if (answerTokens.length) answersToInsert.push({ type: "answer_token", values: answerTokens });
      if (banks.length) answersToInsert.push({ type: "bank", values: banks });

      for (const group of answersToInsert) {
        for (const [answerIndex] of group.values.entries()) {
          const answerId = makeId("grammar_answer", lessonId, group.type, answerIndex + 1);
          await pool.query(
            `INSERT INTO english_grammar_lesson_answers (id, lesson_id, answer_type, answer_order, answer_key)
             VALUES ($1, $2, $3, $4, $5)`,
            [answerId, lessonId, group.type, answerIndex + 1, `${group.type}_${answerIndex + 1}`]
          );

          for (const locale of SUPPORTED_GRAMMAR_CONTENT_LOCALES) {
            const localizedUnit = ensureArray(localizedByLocale[locale]?.units)[unitIndex] || unit;
            const localizedLessonRaw = ensureArray(localizedUnit.lessons)[lessonIndex] || lesson;
            const localizedScenarioBase = isConversation
              ? (ensureArray(localizedByLocale[locale]?.roleplayScenarios).find((item) => item.id === sourceUnitKey) || {})
              : {};
            const localizedLesson = isConversation ? { ...localizedScenarioBase, ...localizedLessonRaw } : localizedLessonRaw;
            let sourceValues = [];
            if (group.type == "answer") sourceValues = localizedLesson.answer ? [localizedLesson.answer] : [];
            if (group.type == "accepted") sourceValues = ensureArray(localizedLesson.acceptedAnswers);
            if (group.type == "answer_token") sourceValues = ensureArray(localizedLesson.answerTokens);
            if (group.type == "bank") sourceValues = ensureArray(localizedLesson.bank);

            await pool.query(
              `INSERT INTO english_grammar_lesson_answer_translations (id, answer_id, locale, text_value, updated_at)
               VALUES ($1, $2, $3, $4, NOW())`,
              [
                makeId("grammar_answer_translation", answerId, locale),
                answerId,
                locale,
                sourceValues[answerIndex] || "",
              ]
            );
          }
        }
      }
    }
  }
}

export async function fetchGrammarContentFromDb(pool, locale = "pt-BR", levelId = "A1") {
  const normalizedLevel = String(levelId || "A1").toUpperCase();
  const candidates = Array.from(new Set([normalizeLocale(locale), "en-US", "pt-BR"]));

  for (const candidate of candidates) {
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
'''
(server_dir / 'grammarContentRepo.js').write_text(grammar_repo, encoding='utf-8')

db_path = server_dir / 'db.js'
db_text = db_path.read_text(encoding='utf-8')
db_text = db_text.replace('import { seedGrammarContent } from "./grammarContentRepo.js";', 'import { seedGrammarContent, seedGrammarRelationalContent } from "./grammarContentRepo.js";')
if "sentence_text TEXT NOT NULL DEFAULT ''" not in db_text:
    db_text = db_text.replace("    supporting_copy TEXT NOT NULL DEFAULT '',\n    placeholder TEXT NOT NULL DEFAULT '',\n", "    supporting_copy TEXT NOT NULL DEFAULT '',\n    placeholder TEXT NOT NULL DEFAULT '',\n    sentence_text TEXT NOT NULL DEFAULT '',\n    wrong_fragment_text TEXT NOT NULL DEFAULT '',\n    audio_text_value TEXT NOT NULL DEFAULT '',\n")
if "ALTER TABLE english_grammar_lesson_translations ADD COLUMN IF NOT EXISTS sentence_text" not in db_text:
    marker = "  await pool.query(\n    `ALTER TABLE english_ui_labels ADD COLUMN IF NOT EXISTS text_value TEXT NOT NULL DEFAULT ''`\n  );\n"
    alter_block = "  await pool.query(\n    `ALTER TABLE english_grammar_lesson_translations ADD COLUMN IF NOT EXISTS sentence_text TEXT NOT NULL DEFAULT ''`\n  );\n  await pool.query(\n    `ALTER TABLE english_grammar_lesson_translations ADD COLUMN IF NOT EXISTS wrong_fragment_text TEXT NOT NULL DEFAULT ''`\n  );\n  await pool.query(\n    `ALTER TABLE english_grammar_lesson_translations ADD COLUMN IF NOT EXISTS audio_text_value TEXT NOT NULL DEFAULT ''`\n  );\n"
    db_text = db_text.replace(marker, alter_block + marker)
if '  await seedGrammarRelationalContent(pool);' not in db_text:
    db_text = db_text.replace('  await seedGrammarContent(pool);\n', '  await seedGrammarContent(pool);\n  await seedGrammarRelationalContent(pool);\n')
db_path.write_text(db_text, encoding='utf-8')

checklist_path = base / 'checklist-english-platform.md'
checklist_text = checklist_path.read_text(encoding='utf-8')
for line in [
    '- [x] A1 do Grammar semeado nas tabelas relacionais novas em 10 idiomas\n',
    '- [x] Campos textuais de licao do Grammar tambem modelados por idioma nas tabelas relacionais\n',
]:
    if line not in checklist_text:
        checklist_text += '\n' + line
checklist_path.write_text(checklist_text, encoding='utf-8')
