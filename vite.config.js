import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function progressApiPlugin() {
  const configDir = path.dirname(fileURLToPath(import.meta.url));
  const progressPath = path.resolve(configDir, "progress.json");
  const authApiBase = process.env.AUTH_API_BASE || "http://localhost:4000";

  const ensureProgressShape = (progress) => {
    const data = progress || {};
    if (!data.languages) {
      data.languages = {
        source_language: "pt-BR",
        learning_language: "en-US",
      };
    }
    if (!data.profile) {
      data.profile = { xp: 0, streak_days: 0, hearts: 5 };
    }
    if (!data.modules) data.modules = {};
    if (!data.modules.flashcards) {
      data.modules.flashcards = {
        active_deck_id: null,
        session: null,
        last_results: null,
      };
    }
    if (!data.modules.speak_ai) {
      data.modules.speak_ai = {
        history: [],
        last_input: "",
        total_messages: 0,
      };
    }
    if (!data.modules.reading_comprehension) {
      data.modules.reading_comprehension = {
        completed_passages: [],
        best_scores: {},
        attempts: {},
        last_passage_id: null,
        glossary_saved_words: [],
      };
    }
    if (!Array.isArray(data.modules.reading_comprehension.glossary_saved_words)) {
      data.modules.reading_comprehension.glossary_saved_words = [];
    }
    if (!data.modules.pronounce) {
      data.modules.pronounce = {
        vowel_progress: 0,
        consonant_progress: 0,
        sessions_completed: 0,
        last_accuracy: 0,
        last_phoneme_score: 0,
        last_mouth_tip: "",
      };
    }
    if (typeof data.modules.pronounce.last_phoneme_score !== "number") {
      data.modules.pronounce.last_phoneme_score = 0;
    }
    if (typeof data.modules.pronounce.last_mouth_tip !== "string") {
      data.modules.pronounce.last_mouth_tip = "";
    }
    if (!data.modules.writing) {
      data.modules.writing = {
        completed_exercises: [],
        current_level: 1,
        best_score: 0,
        attempts: 0,
        last_feedback: "",
      };
    }
    if (!data.modules.games) {
      data.modules.games = {
        high_score: 0,
        best_combo: 0,
        total_sessions: 0,
        total_correct: 0,
        last_level: 1,
      };
    }
    if (!data.modules.modern_methodologies) {
      data.modules.modern_methodologies = {
        history: [],
        metrics: {
          grammar: 0,
          vocabulary: 0,
          context: 0,
          clarity: 0,
        },
        total_reviews: 0,
        last_input: "",
      };
    }
    if (!data.modules.listening) {
      data.modules.listening = {
        completed_today: [],
        last_reset_date: new Date().toISOString().slice(0, 10),
        total_completed: 0,
        last_theme_id: null,
        accent_mode: "us",
        speed_mode: "progressive",
        fixed_rate: 1,
        progress_by_theme: {},
      };
    }
    if (!data.modules.listening.accent_mode) data.modules.listening.accent_mode = "us";
    if (!data.modules.listening.speed_mode) data.modules.listening.speed_mode = "progressive";
    if (typeof data.modules.listening.fixed_rate !== "number") data.modules.listening.fixed_rate = 1;
    if (!data.modules.listening.progress_by_theme) data.modules.listening.progress_by_theme = {};
    if (!data.modules.immersion) {
      data.modules.immersion = {
        completed_themes: [],
        last_theme_id: null,
        total_completed: 0,
      };
    }
    if (!data.modules.speak_with_natives) {
      data.modules.speak_with_natives = {
        sessions_history: [],
        total_sessions: 0,
        total_minutes: 0,
        last_native_id: null,
      };
    }
    if (!data.modules.translation_practice) {
      data.modules.translation_practice = {
        correct_count: 0,
        wrong_count: 0,
        completed_ids: [],
        current_level: 1,
        total_attempts: 0,
        last_item_id: null,
      };
    }
    if (!data.modules.test_english_level) {
      data.modules.test_english_level = {
        last_result: null,
        attempts: 0,
      };
    }
    if (!data.modules.community) {
      data.modules.community = {
        posts: [
          {
            id: "post_1",
            author_id: "user_ana",
            author_name: "Ana",
            content: "Today I learned 12 new words with context sentences. Huge difference.",
            created_at: "2026-03-05T12:15:00.000Z",
            likes_by: ["user_caio"],
            comments: [
              {
                id: "c_1",
                author_id: "user_caio",
                author_name: "Caio",
                text: "Nice progress. Context helps a lot.",
                created_at: "2026-03-05T13:00:00.000Z",
              },
            ],
          },
          {
            id: "post_2",
            author_id: "user_lu",
            author_name: "Lu",
            content: "Anyone wants to practice short speaking drills tonight?",
            created_at: "2026-03-05T17:05:00.000Z",
            likes_by: ["you", "user_ana"],
            comments: [],
          },
          {
            id: "post_3",
            author_id: "user_noah",
            author_name: "Noah",
            content: "Tip: shadowing for 10 minutes a day improved my listening speed.",
            created_at: "2026-03-06T07:30:00.000Z",
            likes_by: [],
            comments: [],
          },
        ],
        muted_author_ids: [],
        reported_post_ids: [],
        total_posts: 3,
        total_comments: 1,
        total_likes: 3,
        last_filter: "all",
        last_sync: null,
      };
    }
    if (!data.modules.music) {
      data.modules.music = {
        last_query: "",
        manual_url: "",
        selected_video_id: "",
        selected_title: "",
        lyrics_en: "",
        search_history: [],
        updated_at: null,
      };
    }
    if (!data.modules.profile) {
      data.modules.profile = {
        display_name: "Learner",
        bio: "Building English every day.",
        daily_goal_minutes: 20,
        weekly_goal_xp: 400,
        badges_unlocked: [],
        recent_notes: [],
        updated_at: null,
      };
    }
    if (!data.modules.srs_global) {
      data.modules.srs_global = {
        queue: [],
        completed_today: 0,
        total_reviews: 0,
        last_generated_date: null,
        next_item_id: 1,
      };
    }
    if (!data.modules.adaptive_diagnostics) {
      data.modules.adaptive_diagnostics = {
        global_score: 0,
        global_difficulty: "normal",
        recommended_module_key: "grammar",
        focus_skill: "grammar",
        skill_scores: [],
        last_evaluated: null,
      };
    }
    if (!data.modules.weekly_study_plan) {
      data.modules.weekly_study_plan = {
        goal: "conversacao",
        week_start: null,
        generated_at: null,
        days: [],
      };
    }
    if (!data.modules.error_notebook) {
      data.modules.error_notebook = {
        patterns: [],
        total_logged: 0,
        last_updated: null,
        manual_notes: [],
      };
    }
    if (!data.modules.long_term_retention) {
      data.modules.long_term_retention = {
        records: [],
        next_item_id: 1,
        total_tests: 0,
        passed_tests: 0,
        last_generated_date: null,
        last_tested_at: null,
      };
    }
    if (!Array.isArray(data.modules.long_term_retention.records)) {
      data.modules.long_term_retention.records = [];
    }
    if (!data.modules.pedagogical_onboarding) {
      data.modules.pedagogical_onboarding = {
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
      };
    }
    if (!data.modules.pedagogical_reports) {
      data.modules.pedagogical_reports = {
        history: [],
        last_generated_at: null,
        last_report: null,
      };
    }
    if (!Array.isArray(data.modules.pedagogical_reports.history)) {
      data.modules.pedagogical_reports.history = [];
    }
    if (!data.modules.my_vocabulary && !data.my_vocabulary) {
      data.modules.my_vocabulary = {
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
      data.my_vocabulary = { ...data.modules.my_vocabulary };
    } else if (!data.modules.my_vocabulary && data.my_vocabulary) {
      data.modules.my_vocabulary = { ...data.my_vocabulary };
    } else if (!data.my_vocabulary && data.modules.my_vocabulary) {
      data.my_vocabulary = { ...data.modules.my_vocabulary };
    }
    if (!Array.isArray(data.modules.my_vocabulary.saved_words_custom)) {
      data.modules.my_vocabulary.saved_words_custom = [];
    }
    if (!Array.isArray(data.my_vocabulary.saved_words_custom)) {
      data.my_vocabulary.saved_words_custom = [...data.modules.my_vocabulary.saved_words_custom];
    }
    if (!data.modules.grammar) {
      data.modules.grammar = {
        completed_units: [],
        last_unit: null,
      };
    }
    return data;
  };

  const readProgress = async () => {
    try {
      const raw = await fs.readFile(progressPath, "utf8");
      return ensureProgressShape(JSON.parse(raw));
    } catch {
      const seeded = ensureProgressShape({});
      await fs.writeFile(progressPath, JSON.stringify(seeded, null, 2), "utf8");
      return seeded;
    }
  };

  const writeProgress = async (progress) => {
    const normalized = ensureProgressShape(progress);
    await fs.writeFile(progressPath, JSON.stringify(normalized, null, 2), "utf8");
    return normalized;
  };

  const readRequestBody = async (req) =>
    await new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => resolve(body));
      req.on("error", reject);
    });

  const tryCloudProgress = async (req, method, body = null) => {
    try {
      const headers = {
        Accept: "application/json",
      };
      if (req.headers.cookie) headers.Cookie = req.headers.cookie;
      if (body !== null) headers["Content-Type"] = "application/json";

      const targetPath = req.url === "/my-vocabulary" ? "/api/progress/my-vocabulary" : "/api/progress";
      const response = await fetch(`${authApiBase}${targetPath}`, {
        method,
        headers,
        body,
      });

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  };

  return {
    name: "progress-api-plugin",
    configureServer(server) {
      server.middlewares.use("/api/progress", async (req, res) => {
        try {
          if (req.method === "GET") {
            const cloud = await tryCloudProgress(req, "GET");
            const progress = cloud ? ensureProgressShape(cloud) : await readProgress();
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(progress));
            return;
          }

          if (req.method === "PUT") {
            const body = await readRequestBody(req);
            try {
              const parsed = body ? JSON.parse(body) : {};
              const cloud = await tryCloudProgress(req, "PUT", JSON.stringify(parsed));
              const saved = cloud ? ensureProgressShape(cloud) : await writeProgress(parsed);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(saved));
            } catch {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Invalid JSON payload" }));
            }
            return;
          }

          if (req.method === "POST" && req.url === "/my-vocabulary") {
            const body = await readRequestBody(req);
            try {
              const payload = body ? JSON.parse(body) : {};
              const cloud = await tryCloudProgress(req, "POST", JSON.stringify(payload));
              if (cloud) {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(cloud));
                return;
              }

              const learnedIds = Array.isArray(payload.learned_word_ids)
                ? payload.learned_word_ids.map(Number).filter(Number.isFinite).sort((a, b) => a - b)
                : [];
              const learnedCsv = typeof payload.learned_words_csv === "string" ? payload.learned_words_csv : "";

              const progress = await readProgress();
              const block = {
                ...progress.my_vocabulary,
                learned_word_ids: learnedIds,
                learned_word_ranks: learnedIds,
                learned_words: learnedIds.length,
                saved_words: learnedIds.length,
                learned_words_csv: learnedCsv,
                last_page: Number(payload.last_page || progress.my_vocabulary.last_page || 1),
                last_sort: payload.last_sort || progress.my_vocabulary.last_sort || "rank",
                last_filter: payload.last_filter || progress.my_vocabulary.last_filter || "both",
                last_search:
                  typeof payload.last_search === "string" ? payload.last_search : progress.my_vocabulary.last_search || "",
              };

              progress.my_vocabulary = { ...block };
              if (!progress.modules) progress.modules = {};
              progress.modules.my_vocabulary = { ...block };

              const saved = await writeProgress(progress);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(saved.my_vocabulary));
            } catch (error) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Invalid JSON payload", detail: error.message }));
            }
            return;
          }

          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Progress API failed", detail: error.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), progressApiPlugin()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.js",
    globals: true,
  },
  server: {
    proxy: {
      "/api/auth": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/api/subscription": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/api/onboarding": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/api/profile": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/api/dictionary": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/api/telemetry": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/api/i18n": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});




