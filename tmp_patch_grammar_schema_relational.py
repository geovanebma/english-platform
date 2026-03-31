from pathlib import Path
path = Path(r'C:\Users\Geovane TI\Documents\english-platform\server\db.js')
text = path.read_text(encoding='utf-8')
marker = "  `CREATE TABLE IF NOT EXISTS english_ui_labels ("
block = '''  `CREATE TABLE IF NOT EXISTS english_grammar_units (
    id TEXT PRIMARY KEY,
    level_id TEXT NOT NULL,
    unit_order INTEGER NOT NULL DEFAULT 0,
    concept_key TEXT NOT NULL DEFAULT '',
    mode TEXT NOT NULL DEFAULT 'exercise',
    source_unit_key TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(level_id, unit_order)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_unit_translations (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL REFERENCES english_grammar_units(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    mastery_signal TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(unit_id, locale)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_guide_points (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL REFERENCES english_grammar_units(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(unit_id, sort_order)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_guide_point_translations (
    id TEXT PRIMARY KEY,
    guide_point_id TEXT NOT NULL REFERENCES english_grammar_guide_points(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    text_value TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(guide_point_id, locale)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_lessons (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL REFERENCES english_grammar_units(id) ON DELETE CASCADE,
    lesson_order INTEGER NOT NULL DEFAULT 0,
    lesson_type TEXT NOT NULL,
    concept_key TEXT NOT NULL DEFAULT '',
    source_lesson_key TEXT NOT NULL DEFAULT '',
    lang TEXT NOT NULL DEFAULT 'en-US',
    audio_text TEXT NOT NULL DEFAULT '',
    sentence TEXT NOT NULL DEFAULT '',
    wrong_fragment TEXT NOT NULL DEFAULT '',
    cover_emoji TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(unit_id, lesson_order)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_lesson_translations (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL REFERENCES english_grammar_lessons(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    prompt TEXT NOT NULL DEFAULT '',
    explanation TEXT NOT NULL DEFAULT '',
    question TEXT NOT NULL DEFAULT '',
    context TEXT NOT NULL DEFAULT '',
    scenario_title TEXT NOT NULL DEFAULT '',
    supporting_copy TEXT NOT NULL DEFAULT '',
    placeholder TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(lesson_id, locale)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_dialogue_lines (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL REFERENCES english_grammar_lessons(id) ON DELETE CASCADE,
    line_order INTEGER NOT NULL DEFAULT 0,
    speaker_key TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(lesson_id, line_order)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_dialogue_line_translations (
    id TEXT PRIMARY KEY,
    dialogue_line_id TEXT NOT NULL REFERENCES english_grammar_dialogue_lines(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    speaker_label TEXT NOT NULL DEFAULT '',
    text_value TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(dialogue_line_id, locale)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_lesson_options (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL REFERENCES english_grammar_lessons(id) ON DELETE CASCADE,
    option_order INTEGER NOT NULL DEFAULT 0,
    option_key TEXT NOT NULL DEFAULT '',
    is_correct BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(lesson_id, option_order)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_lesson_option_translations (
    id TEXT PRIMARY KEY,
    option_id TEXT NOT NULL REFERENCES english_grammar_lesson_options(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    text_value TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(option_id, locale)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_lesson_answers (
    id TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL REFERENCES english_grammar_lessons(id) ON DELETE CASCADE,
    answer_type TEXT NOT NULL DEFAULT 'answer',
    answer_order INTEGER NOT NULL DEFAULT 0,
    answer_key TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(lesson_id, answer_type, answer_order)
  )`,
  `CREATE TABLE IF NOT EXISTS english_grammar_lesson_answer_translations (
    id TEXT PRIMARY KEY,
    answer_id TEXT NOT NULL REFERENCES english_grammar_lesson_answers(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    text_value TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(answer_id, locale)
  )`,
'''
if 'CREATE TABLE IF NOT EXISTS english_grammar_units' not in text:
    text = text.replace(marker, block + marker)

index_marker = "  `CREATE INDEX IF NOT EXISTS idx_english_ui_labels_locale ON english_ui_labels(locale)`,"
index_block = '''  `CREATE INDEX IF NOT EXISTS idx_english_grammar_units_level_order ON english_grammar_units(level_id, unit_order)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_unit_translations_locale ON english_grammar_unit_translations(locale)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_guide_points_unit ON english_grammar_guide_points(unit_id, sort_order)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_guide_point_translations_locale ON english_grammar_guide_point_translations(locale)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_lessons_unit ON english_grammar_lessons(unit_id, lesson_order)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_lesson_translations_locale ON english_grammar_lesson_translations(locale)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_dialogue_lines_lesson ON english_grammar_dialogue_lines(lesson_id, line_order)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_dialogue_line_translations_locale ON english_grammar_dialogue_line_translations(locale)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_lesson_options_lesson ON english_grammar_lesson_options(lesson_id, option_order)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_lesson_option_translations_locale ON english_grammar_lesson_option_translations(locale)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_lesson_answers_lesson ON english_grammar_lesson_answers(lesson_id, answer_type, answer_order)`,
  `CREATE INDEX IF NOT EXISTS idx_english_grammar_lesson_answer_translations_locale ON english_grammar_lesson_answer_translations(locale)`,
'''
if 'idx_english_grammar_units_level_order' not in text:
    text = text.replace(index_marker, index_block + index_marker)

path.write_text(text, encoding='utf-8')
