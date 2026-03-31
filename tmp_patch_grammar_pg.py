from pathlib import Path

base = Path(r'C:\Users\Geovane TI\Documents\english-platform')
server_dir = base / 'server'

repo_js = r'''import fs from "node:fs/promises";
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
    const translationMode = locale === "pt-BR" ? "native" : locale === "en-US" ? "native" : "english_fallback";
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
(server_dir / 'grammarContentRepo.js').write_text(repo_js, encoding='utf-8')

db_path = server_dir / 'db.js'
db_text = db_path.read_text(encoding='utf-8')
if 'import { seedGrammarContent } from "./grammarContentRepo.js";' not in db_text:
    db_text = db_text.replace('import { Pool } from "pg";\n', 'import { Pool } from "pg";\nimport { seedGrammarContent } from "./grammarContentRepo.js";\n')
if 'CREATE TABLE IF NOT EXISTS english_grammar_content' not in db_text:
    insert_before = '  `CREATE TABLE IF NOT EXISTS english_ui_labels ('
    grammar_table = """  `CREATE TABLE IF NOT EXISTS english_grammar_content (\n    id TEXT PRIMARY KEY,\n    module_key TEXT NOT NULL DEFAULT 'grammar',\n    level_id TEXT NOT NULL,\n    locale TEXT NOT NULL,\n    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,\n    translation_mode TEXT NOT NULL DEFAULT 'native',\n    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n    UNIQUE(module_key, level_id, locale)\n  )`,\n"""
    db_text = db_text.replace(insert_before, grammar_table + insert_before)
if 'await seedGrammarContent(pool);' not in db_text:
    db_text = db_text.replace('  await seedUiLabels();\n', '  await seedUiLabels();\n  await seedGrammarContent(pool);\n')
db_path.write_text(db_text, encoding='utf-8')

index_path = server_dir / 'index.js'
index_text = index_path.read_text(encoding='utf-8')
if 'import { fetchGrammarContentFromDb } from "./grammarContentRepo.js";' not in index_text:
    index_text = index_text.replace('import { ensureDatabase, pool } from "./db.js";\n', 'import { ensureDatabase, pool } from "./db.js";\nimport { fetchGrammarContentFromDb } from "./grammarContentRepo.js";\n')
if 'app.get("/api/grammar/content"' not in index_text:
    route = '''app.get("/api/grammar/content", async (req, res) => {
  try {
    const locale = String(req.query.locale || "pt-BR");
    const level = String(req.query.level || "A1").toUpperCase();
    const content = await fetchGrammarContentFromDb(pool, locale, level);
    res.json({
      module: "grammar",
      level: content.levelId,
      locale: content.locale,
      translation_mode: content.translationMode,
      payload: content.payload,
    });
  } catch (error) {
    console.error("[english-platform-auth] grammar content error", error);
    res.status(500).json({ error: "Falha ao carregar conteudo do grammar." });
  }
});

'''
    index_text = index_text.replace('app.get("/api/dictionary/words", async (req, res) => {', route + 'app.get("/api/dictionary/words", async (req, res) => {')
index_path.write_text(index_text, encoding='utf-8')

grammar_path = base / 'src' / 'components' / 'Grammar.jsx'
grammar_text = grammar_path.read_text(encoding='utf-8')
grammar_text = grammar_text.replace('function buildGrammarUnits() {', 'function buildGrammarUnits(baseExerciseUnits = BASE_EXERCISE_UNITS, roleplayScenarios = ROLEPLAY_SCENARIOS) {')
grammar_text = grammar_text.replace('  BASE_EXERCISE_UNITS.forEach((exerciseUnit, index) => {', '  baseExerciseUnits.forEach((exerciseUnit, index) => {')
grammar_text = grammar_text.replace('    const shouldInsertScenario = exerciseCount % roleplayEvery === 0 && scenarioCursor < ROLEPLAY_SCENARIOS.length;', '    const shouldInsertScenario = exerciseCount % roleplayEvery === 0 && scenarioCursor < roleplayScenarios.length;')
grammar_text = grammar_text.replace('      const scenario = ROLEPLAY_SCENARIOS[scenarioCursor++];', '      const scenario = roleplayScenarios[scenarioCursor++];')
grammar_text = grammar_text.replace('const GRAMMAR_UNITS = buildGrammarUnits();', 'const GRAMMAR_UNITS = buildGrammarUnits(BASE_EXERCISE_UNITS, ROLEPLAY_SCENARIOS);')
grammar_text = grammar_text.replace('  const [loading, setLoading] = useState(true);\n  const [sourceLanguage, setSourceLanguage] = useState("pt-BR");\n', '  const [loading, setLoading] = useState(true);\n  const [sourceLanguage, setSourceLanguage] = useState("pt-BR");\n  const [grammarContentByLevel, setGrammarContentByLevel] = useState({});\n')
if 'const runtimeLevelUnitMap = useMemo(() => ({' not in grammar_text:
    marker = '  const [grammarContentByLevel, setGrammarContentByLevel] = useState({});\n\n'
    addition = '''  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const response = await fetch(`/api/grammar/content?level=A1&locale=${encodeURIComponent(sourceLanguage)}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!mounted || !data?.payload) return;
        setGrammarContentByLevel((current) => ({
          ...current,
          [String(data.level || "A1").toUpperCase()]: data.payload,
        }));
      } catch {
        // fallback local permanece ativo
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sourceLanguage]);

  const runtimeLevelUnitMap = useMemo(() => ({
    ...LEVEL_UNIT_MAP,
    A1: buildGrammarUnits(
      grammarContentByLevel.A1?.units || BASE_EXERCISE_UNITS,
      grammarContentByLevel.A1?.roleplayScenarios || ROLEPLAY_SCENARIOS
    ),
  }), [grammarContentByLevel]);

'''
    grammar_text = grammar_text.replace(marker, marker + addition)
grammar_text = grammar_text.replace('        levelId === "A1" ? LEVEL_UNIT_MAP[levelId].filter((u) => u.completed).map((u) => u.id) : [];', '        levelId === "A1" ? (runtimeLevelUnitMap[levelId] || []).filter((u) => u.completed).map((u) => u.id) : [];')
grammar_text = grammar_text.replace('  }, []);', '  }, [runtimeLevelUnitMap]);', 1)
grammar_text = grammar_text.replace('          const levelUnits = LEVEL_UNIT_MAP[levelId] || [];', '          const levelUnits = runtimeLevelUnitMap[levelId] || [];')
grammar_text = grammar_text.replace('            const previousUnits = LEVEL_UNIT_MAP[previousLevel] || [];', '            const previousUnits = runtimeLevelUnitMap[previousLevel] || [];')
grammar_text = grammar_text.replace('    const base = LEVEL_UNIT_MAP[currentLevel] || [];', '    const base = runtimeLevelUnitMap[currentLevel] || [];')
grammar_text = grammar_text.replace('  }, [completedIds, currentLevel, sourceLanguage]);', '  }, [completedIds, currentLevel, sourceLanguage, runtimeLevelUnitMap]);')
grammar_path.write_text(grammar_text, encoding='utf-8')

checklist_path = base / 'checklist-english-platform.md'
checklist_text = checklist_path.read_text(encoding='utf-8')
if '- [x] Conteudo base do Grammar migrado para PostgreSQL (`english_grammar_content`) com seed multilocale' not in checklist_text:
    checklist_text += '\n- [x] Conteudo base do Grammar migrado para PostgreSQL (`english_grammar_content`) com seed multilocale\n- [x] API `/api/grammar/content` ligada ao Grammar com fallback seguro\n'
checklist_path.write_text(checklist_text, encoding='utf-8')
