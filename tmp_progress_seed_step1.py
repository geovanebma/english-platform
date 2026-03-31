from pathlib import Path
import re

path = Path(r'C:\Users\Geovane TI\Documents\english-platform\server\index.js')
text = path.read_text(encoding='utf-8')

text = text.replace('import fs from "node:fs/promises";\n', '')
text = text.replace('import path from "node:path";\n', '')
text = text.replace('import { fileURLToPath } from "node:url";\n', '')
text = text.replace('const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));\n', '')
text = text.replace('const LOCAL_PROGRESS_PATH = path.resolve(SERVER_DIR, "..", "progress.json");\n', '')

old_block = '''async function readSeedProgress() {
  try {
    const raw = await fs.readFile(LOCAL_PROGRESS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
'''

new_block = '''function buildDefaultProgress() {
  const today = new Date().toISOString().slice(0, 10);
  const sharedVocabulary = {
    saved_words: 0,
    learned_words: 0,
    learned_word_ids: [],
    learned_word_ranks: [],
    learned_words_csv: "",
    last_page: 1,
    last_sort: "rank",
    last_filter: "both",
    last_search: "",
    saved_words_custom: [],
  };

  return {
    languages: {
      source_language: "pt-BR",
      learning_language: "en-US",
    },
    profile: {
      xp: 0,
      streak_days: 0,
      hearts: 5,
    },
    modules: {
      flashcards: {
        active_deck_id: null,
        session: null,
        last_results: null,
      },
      speak_ai: {
        history: [],
        last_input: "",
        total_messages: 0,
      },
      reading_comprehension: {
        completed_passages: [],
        best_scores: {},
        attempts: {},
        last_passage_id: null,
        glossary_saved_words: [],
      },
      pronounce: {
        vowel_progress: 0,
        consonant_progress: 0,
        sessions_completed: 0,
        last_accuracy: 0,
        last_phoneme_score: 0,
        last_mouth_tip: "",
      },
      writing: {
        completed_exercises: [],
        current_level: 1,
        best_score: 0,
        attempts: 0,
        last_feedback: "",
      },
      games: {
        high_score: 0,
        best_combo: 0,
        total_sessions: 0,
        total_correct: 0,
        last_level: 1,
      },
      modern_methodologies: {
        history: [],
        metrics: {
          grammar: 0,
          vocabulary: 0,
          context: 0,
          clarity: 0,
        },
        total_reviews: 0,
        last_input: "",
      },
      listening: {
        completed_today: [],
        last_reset_date: today,
        total_completed: 0,
        last_theme_id: null,
        accent_mode: "us",
        speed_mode: "progressive",
        fixed_rate: 1,
        progress_by_theme: {},
      },
      immersion: {
        completed_themes: [],
        last_theme_id: null,
        total_completed: 0,
      },
      speak_with_natives: {
        sessions_history: [],
        total_sessions: 0,
        total_minutes: 0,
        last_native_id: null,
      },
      translation_practice: {
        correct_count: 0,
        wrong_count: 0,
        completed_ids: [],
        current_level: 1,
        total_attempts: 0,
        last_item_id: null,
      },
      test_english_level: {
        last_result: null,
        attempts: 0,
      },
      community: {
        posts: [],
        muted_author_ids: [],
        reported_post_ids: [],
        total_posts: 0,
        total_comments: 0,
        total_likes: 0,
        last_filter: "all",
        last_sync: null,
      },
      music: {
        last_query: "",
        manual_url: "",
        selected_video_id: "",
        selected_title: "",
        lyrics_en: "",
        search_history: [],
        updated_at: null,
      },
      profile: {
        display_name: "Learner",
        bio: "Building English every day.",
        daily_goal_minutes: 20,
        weekly_goal_xp: 400,
        badges_unlocked: [],
        recent_notes: [],
        updated_at: null,
      },
      srs_global: {
        queue: [],
        completed_today: 0,
        total_reviews: 0,
        last_generated_date: null,
        next_item_id: 1,
      },
      adaptive_diagnostics: {
        global_score: 0,
        global_difficulty: "normal",
        recommended_module_key: "grammar",
        focus_skill: "grammar",
        skill_scores: [],
        last_evaluated: null,
      },
      weekly_study_plan: {
        goal: "conversacao",
        week_start: null,
        generated_at: null,
        days: [],
      },
      error_notebook: {
        patterns: [],
        total_logged: 0,
        last_updated: null,
        manual_notes: [],
      },
      long_term_retention: {
        records: [],
        next_item_id: 1,
        total_tests: 0,
        passed_tests: 0,
        last_generated_date: null,
        last_tested_at: null,
      },
      pedagogical_onboarding: {
        completed: false,
        completed_at: null,
        goal: "conversacao",
        learner_profile: "balanced",
        daily_minutes: 20,
        quiz_answers: {},
        quiz_score: 0,
        estimated_level: "A1",
        personalized_track: ["grammar", "flashcards", "listening", "writing"],
        recommended_module_key: "grammar",
      },
      pedagogical_reports: {
        history: [],
        last_generated_at: null,
        last_report: null,
      },
      my_vocabulary: { ...sharedVocabulary },
      grammar: {
        completed_units: [],
        last_unit: null,
      },
    },
    my_vocabulary: { ...sharedVocabulary },
    app_navigation: {
      root_view: "login",
    },
  };
}
'''
text = text.replace(old_block, new_block)
text = text.replace('  const seeded = await readSeedProgress();\n', '  const seeded = buildDefaultProgress();\n')
text = text.replace('  const seedProgress = await readSeedProgress();\n', '  const seedProgress = buildDefaultProgress();\n')

path.write_text(text, encoding='utf-8')
