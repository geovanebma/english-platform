import "dotenv/config";
import crypto from "node:crypto";
import net from "node:net";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcryptjs";
import axios from "axios";
import { ensureDatabase, pool } from "./db.js";
import { fetchGrammarContentFromDb } from "./grammarContentRepo.js";

const app = express();
const PORT = Number(process.env.AUTH_PORT || 4000);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const SESSION_COOKIE = "ep_session";
const OAUTH_STATE_COOKIE = "ep_oauth_state";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 14);
const ENABLE_MEANINGS_VERIFIER = process.env.ENABLE_MEANINGS_VERIFIER !== "false";
const MEANINGS_VERIFY_INTERVAL_MS = Number(process.env.MEANINGS_VERIFY_INTERVAL_MS || 15 * 60 * 1000);
let httpServer = null;
const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);

async function ensurePortAvailable(port) {
  await new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.once("error", (error) => {
      if (error?.code === "EADDRINUSE") {
        reject(new Error(`A porta ${port} ja esta em uso. Feche o servidor anterior antes de iniciar outro.`));
        return;
      }
      reject(error);
    });

    tester.once("listening", () => {
      tester.close(() => resolve());
    });

    tester.listen(port, "0.0.0.0");
  });
}

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

function randomId() {
  return crypto.randomUUID();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildCookieOptions(extra = {}) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    ...extra,
  };
}

function resolveUserRole(email = "") {
  const normalized = String(email || "").trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized) ? "admin" : "user";
}

async function syncAdminRoles() {
  if (!ADMIN_EMAILS.length) return;
  await pool.query(`UPDATE english_users SET role = CASE WHEN LOWER(email) = ANY($1::text[]) THEN 'admin' ELSE role END`, [ADMIN_EMAILS]);
}

function getProviderConfig(provider) {
  const configs = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/api/auth/oauth/google/callback`,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      scope: "openid email profile",
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackUrl:
        process.env.FACEBOOK_CALLBACK_URL || `http://localhost:${PORT}/api/auth/oauth/facebook/callback`,
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
      userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email,picture",
      scope: "email,public_profile",
    },
  };

  return configs[provider];
}

function buildGoalTrack(goal = "travel", startMode = "zero") {
  const base = {
    travel: ["grammar", "flashcards", "listening", "translation"],
    work: ["grammar", "writing", "speak_ai", "courses"],
    study: ["grammar", "reading", "writing", "test_level"],
    fun: ["flashcards", "games", "music", "immersion"],
    people: ["speak_ai", "natives", "listening", "grammar"],
    other: ["grammar", "flashcards", "reading", "listening"],
  };

  const track = base[goal] || base.other;
  if (startMode === "level_check") {
    return ["test_level", ...track.filter((item) => item !== "test_level")];
  }
  return track;
}

function estimateLevelFromSetup(proficiency = "iniciante", startMode = "zero") {
  if (startMode === "level_check") {
    const map = {
      nenhum: "A1",
      iniciante: "A1",
      basico: "A2",
      intermediario: "B1",
      avancado: "B2",
    };
    return map[proficiency] || "A1";
  }

  return proficiency === "avancado" ? "B1" : proficiency === "intermediario" ? "A2" : "A1";
}

function buildWeeklyStudyPlan(goal = "travel", dailyMinutes = 20) {
  const focusMap = {
    travel: ["listening", "flashcards", "translation", "speak_ai", "grammar", "immersion", "review"],
    work: ["writing", "grammar", "speak_ai", "courses", "reading", "listening", "review"],
    study: ["grammar", "reading", "writing", "translation", "courses", "test_level", "review"],
    fun: ["music", "games", "flashcards", "immersion", "listening", "speak_ai", "review"],
    people: ["speak_ai", "natives", "listening", "grammar", "flashcards", "immersion", "review"],
    other: ["grammar", "flashcards", "reading", "listening", "writing", "translation", "review"],
  };
  const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const focus = focusMap[goal] || focusMap.other;
  return {
    goal,
    week_start: new Date().toISOString().slice(0, 10),
    generated_at: new Date().toISOString(),
    days: labels.map((label, index) => ({
      label,
      focus: focus[index],
      minutes: Number(dailyMinutes || 20),
      status: "planned",
    })),
  };
}

function normalizeLookupWord(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeLocale(locale) {
  if (!locale) return "en-US";
  const normalized = String(locale).trim();
  if (!normalized) return "en-US";
  return normalized;
}

function normalizePartOfSpeech(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || "unknown";
}

function scoreDefinition(word, partOfSpeech, definition) {
  const def = String(definition || "").toLowerCase();
  const w = String(word || "").toLowerCase();
  let score = 0;

  if (!def) return -5;
  if (def.includes("language")) score += 4;
  if (def.includes("england") || def.includes("english people") || def.includes("english language")) score += 3;
  if (partOfSpeech === "noun" || partOfSpeech === "adjective") score += 1;
  if (def.includes("billiards") || def.includes("bowling") || def.includes("spin") || def.includes("rotation")) score -= 3;
  if (w && def.includes(w)) score += 1;

  return score;
}

async function fallbackDefinitionForWord(word, sourceLang) {
  const normalized = normalizeLookupWord(word);
  const fallbackMap = {
    their: {
      partOfSpeech: "pronoun",
      english: "Belonging to or associated with them.",
    },
    theirs: {
      partOfSpeech: "pronoun",
      english: "Belonging to or associated with them; the possession is theirs.",
    },
  };

  const hit = fallbackMap[normalized];
  if (!hit) return null;
  const source = await translateDefinition(hit.english, sourceLang);
  return {
    ipa: "",
    audioUrl: "",
    meanings: [
      {
        partOfSpeech: hit.partOfSpeech,
        english: hit.english,
        source: source || "",
      },
    ],
    synonyms: [],
    examples: [],
    partOfSpeech: hit.partOfSpeech,
  };
}

async function translateDefinition(text, sourceLang = "pt") {
  if (!text) return "";
  const base = String(sourceLang || "pt").split("-")[0];
  if (base === "en") return text;
  try {
    const res = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${base}`
    );

    const translated = res?.data?.responseData?.translatedText;
    return typeof translated === "string" && translated.length ? translated : "";
  } catch {
    return "";
  }
}
async function fetchDictionaryFromApis(word, sourceLang = "pt") {
  const dictLang = "en";
  let ipa = "";
  let audioUrl = "";
  let meanings = [];
  const synonymsSet = new Set();
  const examplesSet = new Set();

  try {
    const res = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/${dictLang}/${encodeURIComponent(word.toLowerCase())}`
    );

    const entries = Array.isArray(res?.data) ? res.data : res?.data ? [res.data] : [];
    if (!entries.length) return await fallbackDefinitionForWord(word, sourceLang);

    const first = entries[0];
    ipa = first?.phonetic || first?.phonetics?.find((item) => item?.text)?.text || "";
    audioUrl = first?.phonetics?.find((item) => item?.audio)?.audio || "";

    const scored = [];
    for (const entry of entries) {
      const rawMeanings = Array.isArray(entry?.meanings) ? entry.meanings : [];
      for (const meaning of rawMeanings) {
        const defs = Array.isArray(meaning?.definitions) ? meaning.definitions : [];
        for (const def of defs) {
          const english = def?.definition || "";
          if (!english) continue;
          const source = await translateDefinition(english, sourceLang);
          const pos = normalizePartOfSpeech(meaning?.partOfSpeech);
          const score = scoreDefinition(word, pos, english);
          scored.push({
            partOfSpeech: pos,
            english,
            source: source || "",
            score,
          });
          (def?.synonyms || []).forEach((item) => synonymsSet.add(item));
          if (def?.example) examplesSet.add(def.example);
        }
        (meaning?.synonyms || []).forEach((item) => synonymsSet.add(item));
      }
    }

    scored.sort((a, b) => b.score - a.score);
    meanings = scored.slice(0, 8).map(({ score, ...item }) => item);
  } catch {
    return await fallbackDefinitionForWord(word, sourceLang);
  }

  if (!meanings.length) {
    const fallback = await fallbackDefinitionForWord(word, sourceLang);
    if (fallback) return fallback;
  }

  return {
    ipa,
    audioUrl,
    meanings,
    synonyms: [...synonymsSet].slice(0, 12),
    examples: [...examplesSet].slice(0, 6),
    partOfSpeech: meanings[0]?.partOfSpeech || "",
  };
}

function normalizeMeaningText(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeaningKeys(meanings = []) {
  return meanings
    .map((item) => ({
      part: normalizeMeaningText(item?.partOfSpeech || ""),
      text: normalizeMeaningText(item?.english || item?.definition || ""),
    }))
    .filter((item) => item.text.length > 0)
    .map((item) => `${item.part}|${item.text}`);
}

function compareMeanings(stored = [], fresh = []) {
  const storedKeys = new Set(extractMeaningKeys(stored));
  const freshKeys = new Set(extractMeaningKeys(fresh));
  if (storedKeys.size === 0 || freshKeys.size === 0) {
    return { ok: false, ratio: 0 };
  }

  let intersection = 0;
  for (const key of storedKeys) {
    if (freshKeys.has(key)) intersection += 1;
  }

  const minSize = Math.min(storedKeys.size, freshKeys.size);
  const ratio = minSize ? intersection / minSize : 0;
  return { ok: ratio >= 0.45, ratio };
}

function assessMeaningQuality(word, meanings = []) {
  const lowerWord = String(word || "").toLowerCase();
  const items = Array.isArray(meanings) ? meanings : [];
  if (!items.length) {
    return { score: 0, status: "missing", notes: "No meanings saved yet." };
  }

  let score = Math.min(30, items.length * 8);
  const combined = items.map((item) => `${item?.partOfSpeech || ""} ${item?.english || ""}`).join(" ").toLowerCase();

  if (combined.includes("language")) score += 18;
  if (combined.includes("england") || combined.includes("english language")) score += 10;
  if (lowerWord === "english" && (combined.includes("spin") || combined.includes("billiards") || combined.includes("bowling"))) score -= 35;
  if (["their", "theirs"].includes(lowerWord) && combined.includes("belonging to or associated with them")) score += 20;
  if (combined.includes(lowerWord)) score += 5;

  const finalScore = Math.max(0, Math.min(100, score));
  const status = finalScore >= 75 ? "verified" : finalScore >= 45 ? "needs_review" : "weak";
  const notes = status === "verified"
    ? "Meanings look consistent with the current checks."
    : status === "needs_review"
      ? "Meanings are usable but should be reviewed again."
      : "Meanings look weak or suspicious for this word.";

  return { score: finalScore, status, notes };
}

let meaningsVerifierRunning = false;

async function verifyWikiWordMeaningsBatch() {
  if (meaningsVerifierRunning) return;
  meaningsVerifierRunning = true;
  try {
    const { rows } = await pool.query(
      `SELECT word, normalized_word, meanings, meanings_verified_count
       FROM english_wiki_words
       WHERE meanings <> '[]'::jsonb
         AND meanings_verified_count < 3
       ORDER BY meanings_verified_count ASC, rank_order ASC
       LIMIT 15`
    );

    for (const row of rows) {
      const word = row.word;
      const normalized = row.normalized_word;
      const storedMeanings = Array.isArray(row.meanings) ? row.meanings : [];
      if (!storedMeanings.length) {
        continue;
      }

      const apiData = await fetchDictionaryFromApis(word, "pt");
      if (!apiData || !Array.isArray(apiData.meanings) || apiData.meanings.length === 0) {
        const quality = assessMeaningQuality(rawWord, meanings);
        await pool.query(
          `UPDATE english_wiki_words
           SET meanings_quality_score = $2,
               meanings_status = $3,
               meanings_review_notes = $4,
               meanings_last_source = $5,
               meanings_verified_count = meanings_verified_count + 1,
               meanings_verified_at = NOW()
           WHERE normalized_word = $1`,
          [normalized, quality.score, quality.status, quality.notes, "dictionaryapi.dev"]
        );
        continue;
      }

      const comparison = compareMeanings(storedMeanings, apiData.meanings);
      const quality = assessMeaningQuality(word, apiData.meanings);
      if (!comparison.ok) {
        await pool.query(
          `UPDATE english_wiki_words
           SET part_of_speech = $2,
               meanings = $3::jsonb,
               examples = $4::jsonb,
               synonyms = $5::jsonb,
               ipa = $6,
               audio_url = $7,
               meanings_quality_score = $8,
               meanings_status = $9,
               meanings_review_notes = $10,
               meanings_last_source = $11,
               meanings_verified_count = meanings_verified_count + 1,
               meanings_verified_at = NOW()
           WHERE normalized_word = $1`,
          [
            normalized,
            apiData.partOfSpeech || "",
            JSON.stringify(apiData.meanings),
            JSON.stringify(apiData.examples || []),
            JSON.stringify(apiData.synonyms || []),
            apiData.ipa || "",
            apiData.audioUrl || "",
            quality.score,
            quality.status,
            quality.notes,
            "dictionaryapi.dev",
          ]
        );
      } else {
        await pool.query(
          `UPDATE english_wiki_words
           SET meanings_quality_score = $2,
               meanings_status = $3,
               meanings_review_notes = $4,
               meanings_last_source = $5,
               meanings_verified_count = meanings_verified_count + 1,
               meanings_verified_at = NOW()
           WHERE normalized_word = $1`,
          [normalized]
        );
      }
    }
  } catch (error) {
    console.warn("[meanings-verifier] error", error?.message || error);
  } finally {
    meaningsVerifierRunning = false;
  }
}

async function ensureWikiWord(normalizedWord, rawWord) {
  const { rows } = await pool.query(
    `SELECT word, part_of_speech, meanings, examples, synonyms, ipa, audio_url, normalized_word
     FROM english_wiki_words
     WHERE normalized_word = $1
     LIMIT 1`,
    [normalizedWord]
  );
  if (rows.length) return rows[0];

  const { rows: maxRows } = await pool.query(
    `SELECT COALESCE(MAX(rank_order), 0)::int AS max FROM english_wiki_words`
  );
  const nextRank = Number(maxRows[0]?.max || 0) + 1;

  await pool.query(
    `INSERT INTO english_wiki_words (rank_order, word, normalized_word)
     VALUES ($1, $2, $3)
     ON CONFLICT (word) DO NOTHING`,
    [nextRank, rawWord, normalizedWord]
  );

  const { rows: afterRows } = await pool.query(
    `SELECT word, part_of_speech, meanings, examples, synonyms, ipa, audio_url, normalized_word
     FROM english_wiki_words
     WHERE normalized_word = $1
     LIMIT 1`,
    [normalizedWord]
  );

  return afterRows[0] || null;
}


async function applyUserSetup(userId, payload = {}) {
  const siteLanguage = payload.site_language || "pt-BR";
  const learningLanguage = payload.learning_language || "en-US";
  const goal = payload.goal || "travel";
  const referralSource = payload.referral_source || "";
  const proficiency = payload.proficiency || "iniciante";
  const dailyGoalMinutes = Number(payload.daily_goal_minutes || 15);
  const notificationsEnabled = Boolean(payload.notifications_enabled);
  const startMode = payload.start_mode === "level_check" ? "level_check" : "zero";
  const estimatedLevel = estimateLevelFromSetup(proficiency, startMode);
  const personalizedTrack = buildGoalTrack(goal, startMode);

  await pool.query(
    `UPDATE english_user_profiles
     SET source_language = $2,
         learning_language = $3,
         goal = $4,
         estimated_level = $5,
         ui_language = $6,
         referral_source = $7,
         proficiency_label = $8,
         daily_goal_minutes = $9,
         notifications_enabled = $10,
         start_mode = $11,
         updated_at = NOW()
     WHERE user_id = $1`,
    [
      userId,
      siteLanguage,
      learningLanguage,
      goal,
      estimatedLevel,
      siteLanguage,
      referralSource,
      proficiency,
      dailyGoalMinutes,
      notificationsEnabled,
      startMode,
    ]
  );

  const progress = await getProgressSnapshot(userId);
  const nextProgress = {
    ...progress,
    languages: {
      ...(progress.languages || {}),
      source_language: siteLanguage,
      learning_language: learningLanguage,
    },
    profile: {
      ...(progress.profile || {}),
      daily_goal_minutes: dailyGoalMinutes,
      notifications_enabled: notificationsEnabled,
      estimated_level: estimatedLevel,
    },
    modules: {
      ...(progress.modules || {}),
      pedagogical_onboarding: {
        completed: true,
        completed_at: new Date().toISOString(),
        goal,
        learner_profile: startMode === "level_check" ? "diagnostic" : "guided",
        daily_minutes: dailyGoalMinutes,
        quiz_answers: {},
        quiz_score: estimatedLevel === "B2" ? 80 : estimatedLevel === "B1" ? 65 : estimatedLevel === "A2" ? 40 : 20,
        estimated_level: estimatedLevel,
        personalized_track: personalizedTrack,
        recommended_module_key: startMode === "level_check" ? "test_level" : personalizedTrack[0],
        referral_source: referralSource,
        notifications_enabled: notificationsEnabled,
        start_mode: startMode,
      },
      adaptive_diagnostics: {
        ...(progress.modules?.adaptive_diagnostics || {}),
        recommended_module_key: startMode === "level_check" ? "test_level" : personalizedTrack[0],
        focus_skill: personalizedTrack[0] || "grammar",
        global_difficulty: proficiency === "avancado" ? "high" : proficiency === "intermediario" ? "normal" : "guided",
        global_score: estimatedLevel === "B2" ? 78 : estimatedLevel === "B1" ? 62 : estimatedLevel === "A2" ? 38 : 18,
        last_evaluated: new Date().toISOString(),
      },
      weekly_study_plan: buildWeeklyStudyPlan(goal, dailyGoalMinutes),
      ui_navigation: {
        ...(progress.modules?.ui_navigation || {}),
        selected_module_key: startMode === "level_check" ? "test_level" : personalizedTrack[0] || "grammar",
        active_screen: "home",
      },
      profile: {
        ...(progress.modules?.profile || {}),
        daily_goal_minutes: dailyGoalMinutes,
      },
    },
  };

  await upsertProgressSnapshot(userId, nextProgress);
  return { estimatedLevel, personalizedTrack };
}

function buildDefaultProgress() {
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

async function upsertProgressSnapshot(userId, progress) {
  await pool.query(
    `INSERT INTO english_progress_snapshots (user_id, progress_json, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET progress_json = EXCLUDED.progress_json, updated_at = NOW()`,
    [userId, JSON.stringify(progress || {})]
  );
}

async function getProgressSnapshot(userId) {
  const { rows } = await pool.query(
    `SELECT progress_json
     FROM english_progress_snapshots
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );

  const current = rows[0]?.progress_json || {};
  if (current && typeof current === "object" && Object.keys(current).length > 0) {
    return current;
  }

  const seeded = buildDefaultProgress();
  await upsertProgressSnapshot(userId, seeded);
  return seeded;
}

async function createUserWithDefaults({ name, email, passwordHash = null, authSource = "local" }) {
  const userId = randomId();
  const subscriptionId = randomId();
  const seedProgress = buildDefaultProgress();

  await pool.query(
    `INSERT INTO english_users (id, name, email, password_hash, auth_source, role)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, name, email.toLowerCase(), passwordHash, authSource, resolveUserRole(email)]
  );

  await pool.query(
    `INSERT INTO english_user_profiles (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  await pool.query(
    `INSERT INTO english_subscriptions (id, user_id, plan, status, provider)
     VALUES ($1, $2, 'free', 'active', 'internal')
     ON CONFLICT (user_id) DO NOTHING`,
    [subscriptionId, userId]
  );

  await pool.query(
    `INSERT INTO english_progress_snapshots (user_id, progress_json)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, JSON.stringify(seedProgress)]
  );

  return userId;
}

async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.auth_source, u.role, s.plan, s.status,
            p.source_language, p.learning_language, p.ui_language, p.goal, p.estimated_level,
            p.referral_source, p.proficiency_label, p.daily_goal_minutes, p.notifications_enabled, p.start_mode
     FROM english_users u
     LEFT JOIN english_subscriptions s ON s.user_id = u.id
     LEFT JOIN english_user_profiles p ON p.user_id = u.id
     WHERE u.email = $1
     LIMIT 1`,
    [email.toLowerCase()]
  );
  return rows[0] || null;
}

async function findUserByIdentity(provider, providerUserId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.auth_source, u.role, s.plan, s.status,
            p.source_language, p.learning_language, p.ui_language, p.goal, p.estimated_level,
            p.referral_source, p.proficiency_label, p.daily_goal_minutes, p.notifications_enabled, p.start_mode
     FROM english_auth_identities i
     JOIN english_users u ON u.id = i.user_id
     LEFT JOIN english_subscriptions s ON s.user_id = u.id
     LEFT JOIN english_user_profiles p ON p.user_id = u.id
     WHERE i.provider = $1 AND i.provider_user_id = $2
     LIMIT 1`,
    [provider, providerUserId]
  );
  return rows[0] || null;
}

async function attachIdentity(userId, provider, providerUserId, providerEmail) {
  await pool.query(
    `INSERT INTO english_auth_identities (id, user_id, provider, provider_user_id, provider_email)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (provider, provider_user_id)
     DO UPDATE SET provider_email = EXCLUDED.provider_email`,
    [randomId(), userId, provider, providerUserId, providerEmail || null]
  );
}

async function createSession(userId, req, res) {
  const rawToken = crypto.randomBytes(48).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  await pool.query(
    `INSERT INTO english_auth_sessions (id, user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      randomId(),
      userId,
      tokenHash,
      expiresAt.toISOString(),
      req.headers["user-agent"] || null,
      req.ip || req.socket.remoteAddress || null,
    ]
  );

  res.cookie(SESSION_COOKIE, rawToken, buildCookieOptions({ expires: expiresAt }));
}

async function getCurrentAuth(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;

  const tokenHash = sha256(token);
    const { rows } = await pool.query(
    `SELECT s.id AS session_id, s.user_id, s.expires_at, u.name, u.email, u.auth_source, u.role,
            sub.plan, sub.status,
            p.source_language, p.learning_language, p.ui_language, p.goal, p.estimated_level,
            p.referral_source, p.proficiency_label, p.daily_goal_minutes, p.notifications_enabled, p.start_mode
     FROM english_auth_sessions s
     JOIN english_users u ON u.id = s.user_id
     LEFT JOIN english_subscriptions sub ON sub.user_id = u.id
     LEFT JOIN english_user_profiles p ON p.user_id = u.id
     WHERE s.token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );

  const session = rows[0];
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  await pool.query(
    `UPDATE english_auth_sessions SET last_seen_at = NOW() WHERE id = $1`,
    [session.session_id]
  );

    return {
    sessionId: session.session_id,
    user: {
      id: session.user_id,
      name: session.name,
      email: session.email,
      auth_source: session.auth_source,
      role: session.role || "user",
      subscription: {
        plan: session.plan || "free",
        status: session.status || "active",
      },
      profile: {
        source_language: session.source_language || "pt-BR",
        learning_language: session.learning_language || "en-US",
        ui_language: session.ui_language || session.source_language || "pt-BR",
        goal: session.goal || "",
        estimated_level: session.estimated_level || "",
        referral_source: session.referral_source || "",
        proficiency_label: session.proficiency_label || "",
        daily_goal_minutes: Number(session.daily_goal_minutes || 0),
        notifications_enabled: Boolean(session.notifications_enabled),
        start_mode: session.start_mode || "zero",
      },
    },
  };
}

async function clearSession(req, res) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    await pool.query(`DELETE FROM english_auth_sessions WHERE token_hash = $1`, [sha256(token)]);
  }
  res.clearCookie(SESSION_COOKIE, buildCookieOptions());
}

function requireAuth(handler) {
  return async (req, res) => {
    try {
      const auth = await getCurrentAuth(req);
      if (!auth) {
        res.status(401).json({ error: "Sessao invalida ou expirada." });
        return;
      }
      req.auth = auth;
      await handler(req, res);
    } catch (error) {
      res.status(500).json({ error: "Falha de autenticacao.", detail: error.message });
    }
  };
}

function requireAdmin(handler) {
  return requireAuth(async (req, res) => {
    if (String(req.auth?.user?.role || "user") !== "admin") {
      res.status(403).json({ error: "Acesso restrito a administradores." });
      return;
    }
    await handler(req, res);
  });
}

function parseJsonArrayInput(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return JSON.parse(value);
  }
  return [];
}


async function createCommunityNotification({ recipientUserId, actorUserId = null, actorName = "", type, postId = null, message }) {
  if (!recipientUserId || !message) return;
  await pool.query(
    `INSERT INTO english_community_notifications (id, recipient_user_id, actor_user_id, actor_name, type, post_id, message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [randomId(), recipientUserId, actorUserId, actorName, type, postId, message]
  );
}

async function getCommunityNotifications(userId, limit = 6) {
  const { rows } = await pool.query(
    `SELECT id, actor_name, type, post_id, message, read_at, created_at
     FROM english_community_notifications
     WHERE recipient_user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  const unreadRes = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM english_community_notifications
     WHERE recipient_user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return { items: rows, unread_count: Number(unreadRes.rows[0]?.count || 0) };
}

async function getCommunityFeedPayload(userId, options = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(20, Math.max(5, Number(options.limit || 8)));
  const filter = String(options.filter || "all").trim() || "all";
  const offset = (page - 1) * limit;

  const mutedRes = await pool.query(
    `SELECT muted_author_key
     FROM english_community_user_mutes
     WHERE muter_user_id = $1`,
    [userId]
  );
  const mutedAuthorKeys = mutedRes.rows.map((row) => row.muted_author_key);

  const reportedRes = await pool.query(
    `SELECT post_id
     FROM english_community_reports
     WHERE reporter_user_id = $1`,
    [userId]
  );
  const reportedPostIds = reportedRes.rows.map((row) => row.post_id);

  const baseRowsRes = await pool.query(
    `SELECT p.id, p.author_user_id, p.author_key, p.author_name, p.content, p.media_url, p.created_at,
            COALESCE(l.like_count, 0)::int AS like_count,
            COALESCE(c.comment_count, 0)::int AS comment_count,
            EXISTS(
              SELECT 1
              FROM english_community_post_likes viewer_like
              WHERE viewer_like.post_id = p.id AND viewer_like.user_id = $1
            ) AS liked_by_me
     FROM english_community_posts p
     LEFT JOIN (
       SELECT post_id, COUNT(*)::int AS like_count
       FROM english_community_post_likes
       GROUP BY post_id
     ) l ON l.post_id = p.id
     LEFT JOIN (
       SELECT post_id, COUNT(*)::int AS comment_count
       FROM english_community_comments
       GROUP BY post_id
     ) c ON c.post_id = p.id`,
    [userId]
  );

  let posts = baseRowsRes.rows.filter((post) => !mutedAuthorKeys.includes(post.author_key));
  if (filter === "mine") posts = posts.filter((post) => post.author_key === userId);
  if (filter === "liked") posts = posts.filter((post) => Boolean(post.liked_by_me));
  if (filter === "popular") posts.sort((a, b) => Number(b.like_count || 0) - Number(a.like_count || 0) || new Date(b.created_at) - new Date(a.created_at));
  else posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = posts.length;
  const slice = posts.slice(offset, offset + limit);
  const postIds = slice.map((row) => row.id);
  let commentsByPost = {};
  if (postIds.length) {
    const commentsRes = await pool.query(
      `SELECT id, post_id, author_key, author_name, text, created_at
       FROM english_community_comments
       WHERE post_id = ANY($1::text[])
       ORDER BY created_at ASC`,
      [postIds]
    );
    commentsByPost = commentsRes.rows.reduce((acc, row) => {
      if (!acc[row.post_id]) acc[row.post_id] = [];
      acc[row.post_id].push({
        id: row.id,
        author_id: row.author_key,
        author_name: row.author_name,
        text: row.text,
        created_at: row.created_at,
      });
      return acc;
    }, {});
  }

  const mappedPosts = slice.map((row) => ({
    id: row.id,
    author_user_id: row.author_user_id,
    author_id: row.author_key,
    author_name: row.author_name,
    content: row.content,
    media_url: row.media_url || "",
    created_at: row.created_at,
    like_count: Number(row.like_count || 0),
    liked_by_me: Boolean(row.liked_by_me),
    comment_count: Number(row.comment_count || 0),
    comments: commentsByPost[row.id] || [],
  }));

  const statsRes = await pool.query(
    `SELECT
        (SELECT COUNT(*)::int FROM english_community_posts) AS total_posts,
        (SELECT COUNT(*)::int FROM english_community_comments) AS total_comments,
        (SELECT COUNT(*)::int FROM english_community_post_likes) AS total_likes`
  );

  const notifications = await getCommunityNotifications(userId, 8);

  return {
    viewer_id: userId,
    posts: mappedPosts,
    muted_author_keys: mutedAuthorKeys,
    reported_post_ids: reportedPostIds,
    stats: {
      total_posts: Number(statsRes.rows[0]?.total_posts || 0),
      total_comments: Number(statsRes.rows[0]?.total_comments || 0),
      total_likes: Number(statsRes.rows[0]?.total_likes || 0),
    },
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
      has_more: offset + mappedPosts.length < total,
      filter,
    },
    notifications,
  };
}

async function getAdminDictionaryEntry(normalizedWord) {
  const { rows } = await pool.query(
    `SELECT word, normalized_word, part_of_speech, meanings, examples, synonyms, ipa, audio_url,
            meanings_verified_count, meanings_verified_at, meanings_quality_score, meanings_status, meanings_review_notes, meanings_last_source
     FROM english_wiki_words
     WHERE normalized_word = $1
     LIMIT 1`,
    [normalizedWord]
  );
  return rows[0] || null;
}

function buildAuthPayload(user) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      auth_source: user.auth_source,
      role: user.role || "user",
      subscription: {
        plan: user.plan || user.subscription?.plan || "free",
        status: user.status || user.subscription?.status || "active",
      },
      profile: {
        source_language: user.source_language || "pt-BR",
        learning_language: user.learning_language || "en-US",
        ui_language: user.ui_language || user.source_language || "pt-BR",
        goal: user.goal || "",
        estimated_level: user.estimated_level || "",
        referral_source: user.referral_source || "",
        proficiency_label: user.proficiency_label || "",
        daily_goal_minutes: Number(user.daily_goal_minutes || 0),
        notifications_enabled: Boolean(user.notifications_enabled),
        start_mode: user.start_mode || "zero",
      },
    },
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "english-platform-auth" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, onboarding } = req.body || {};
    if (!name || !email || !password) {
      res.status(400).json({ error: "Nome, email e senha sao obrigatorios." });
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: "Ja existe uma conta com este email." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createUserWithDefaults({
      name,
      email,
      passwordHash,
      authSource: "local",
    });

    if (onboarding && typeof onboarding === "object") {
      await applyUserSetup(userId, onboarding);
    }

    await createSession(userId, req, res);
    const createdUser = await findUserByEmail(email);
    res.status(201).json(buildAuthPayload(createdUser));
  } catch (error) {
    res.status(500).json({ error: "Nao foi possivel criar a conta.", detail: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: "Email e senha sao obrigatorios." });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user || !user.password_hash) {
      res.status(401).json({ error: "Credenciais invalidas." });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: "Credenciais invalidas." });
      return;
    }

    await createSession(user.id, req, res);
    res.json(buildAuthPayload(user));
  } catch (error) {
    res.status(500).json({ error: "Nao foi possivel entrar.", detail: error.message });
  }
});

app.post("/api/auth/logout", requireAuth(async (req, res) => {
  await clearSession(req, res);
  res.json({ ok: true });
}));

app.get("/api/auth/me", async (req, res) => {
  try {
    const auth = await getCurrentAuth(req);
    if (!auth) {
      res.json({ user: null, authenticated: false });
      return;
    }
    res.json({ user: auth.user, authenticated: true });
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar sessao.", detail: error.message });
  }
});

app.get("/api/progress", async (req, res) => {
  try {
    const auth = await getCurrentAuth(req);
    if (!auth) {
      res.status(401).json({ error: "Nao autenticado para sincronizacao cloud." });
      return;
    }

    const progress = await getProgressSnapshot(auth.user.id);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar progresso na nuvem.", detail: error.message });
  }
});

app.put("/api/progress", async (req, res) => {
  try {
    const auth = await getCurrentAuth(req);
    if (!auth) {
      res.status(401).json({ error: "Nao autenticado para sincronizacao cloud." });
      return;
    }

    const payload = req.body && typeof req.body === "object" ? req.body : {};
    await upsertProgressSnapshot(auth.user.id, payload);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: "Falha ao salvar progresso na nuvem.", detail: error.message });
  }
});

app.post("/api/progress/my-vocabulary", async (req, res) => {
  try {
    const auth = await getCurrentAuth(req);
    if (!auth) {
      res.status(401).json({ error: "Nao autenticado para sincronizacao cloud." });
      return;
    }

    const payload = req.body || {};
    const learnedIds = Array.isArray(payload.learned_word_ids)
      ? payload.learned_word_ids.map(Number).filter(Number.isFinite).sort((a, b) => a - b)
      : [];
    const learnedCsv = typeof payload.learned_words_csv === "string" ? payload.learned_words_csv : "";

    const progress = await getProgressSnapshot(auth.user.id);
    const sourceBlock = progress.my_vocabulary || progress.modules?.my_vocabulary || {};
    const block = {
      ...sourceBlock,
      learned_word_ids: learnedIds,
      learned_word_ranks: learnedIds,
      learned_words: learnedIds.length,
      saved_words: learnedIds.length,
      learned_words_csv: learnedCsv,
      last_page: Number(payload.last_page || sourceBlock.last_page || 1),
      last_sort: payload.last_sort || sourceBlock.last_sort || "rank",
      last_filter: payload.last_filter || sourceBlock.last_filter || "both",
      last_search: typeof payload.last_search === "string" ? payload.last_search : sourceBlock.last_search || "",
    };

    const nextProgress = {
      ...progress,
      my_vocabulary: { ...block },
      modules: {
        ...(progress.modules || {}),
        my_vocabulary: { ...block },
      },
    };

    await upsertProgressSnapshot(auth.user.id, nextProgress);
    res.json(block);
  } catch (error) {
    res.status(500).json({ error: "Falha ao salvar vocabulary na nuvem.", detail: error.message });
  }
});

app.get("/api/auth/oauth/:provider/start", async (req, res) => {
  const provider = req.params.provider;
  const config = getProviderConfig(provider);
  if (!config || !config.clientId || !config.clientSecret) {
    res.redirect(`${FRONTEND_URL}?oauth_error=${provider}_not_configured`);
    return;
  }

  const state = crypto.randomBytes(20).toString("hex");
  res.cookie(OAUTH_STATE_COOKIE, `${provider}:${state}`, buildCookieOptions({ maxAge: 10 * 60 * 1000 }));

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: "code",
    scope: config.scope,
    state,
  });

  res.redirect(`${config.authUrl}?${params.toString()}`);
});

app.get("/api/auth/oauth/:provider/callback", async (req, res) => {
  const provider = req.params.provider;
  const config = getProviderConfig(provider);
  const cookieValue = req.cookies?.[OAUTH_STATE_COOKIE] || "";
  const expected = cookieValue.split(":");
  const state = req.query.state;
  const code = req.query.code;

  if (!config || !config.clientId || !config.clientSecret || expected[0] !== provider || expected[1] !== state) {
    res.redirect(`${FRONTEND_URL}?oauth_error=invalid_${provider}_state`);
    return;
  }

  try {
    let accessToken = "";
    if (provider === "google") {
      const tokenRes = await axios.post(
        config.tokenUrl,
        new URLSearchParams({
          code,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.callbackUrl,
          grant_type: "authorization_code",
        }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      accessToken = tokenRes.data.access_token;
    } else {
      const tokenRes = await axios.get(config.tokenUrl, {
        params: {
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.callbackUrl,
          code,
        },
      });
      accessToken = tokenRes.data.access_token;
    }

    const profileRes = await axios.get(config.userInfoUrl, {
      headers: provider === "google" ? { Authorization: `Bearer ${accessToken}` } : undefined,
      params: provider === "facebook" ? { access_token: accessToken } : undefined,
    });

    const profile = profileRes.data;
    const providerUserId = String(profile.sub || profile.id);
    const email = profile.email;
    const name = profile.name || "Learner";

    let user = await findUserByIdentity(provider, providerUserId);
    if (!user && email) {
      user = await findUserByEmail(email);
    }

    let userId = user?.id;
    if (!userId) {
      userId = await createUserWithDefaults({
        name,
        email,
        passwordHash: null,
        authSource: provider,
      });
      user = await findUserByEmail(email);
    }

    await attachIdentity(userId, provider, providerUserId, email);
    await createSession(userId, req, res);
    res.clearCookie(OAUTH_STATE_COOKIE, buildCookieOptions());
    res.redirect(FRONTEND_URL);
  } catch (error) {
    res.redirect(`${FRONTEND_URL}?oauth_error=${provider}_callback_failed`);
  }
});

app.get("/api/subscription/me", requireAuth(async (req, res) => {
  res.json({ subscription: req.auth.user.subscription });
}));

app.get("/api/onboarding/catalog", async (req, res) => {
  try {
    const siteLanguage = String(req.query.siteLanguage || "pt-BR");
    const { rows: siteRows } = await pool.query(
      `SELECT site_language, site_language_label, COUNT(*)::int AS available_count
       FROM english_language_catalog
       GROUP BY site_language, site_language_label
       ORDER BY site_language_label ASC`
    );
    const { rows: languageRows } = await pool.query(
      `SELECT learning_language, learning_label, native_label, flag, learners_display, sort_order
       FROM english_language_catalog
       WHERE site_language = $1
       ORDER BY sort_order ASC, learning_label ASC`,
      [siteLanguage]
    );

    res.json({
      site_languages: siteRows.map((row) => ({
        code: row.site_language,
        label: row.site_language_label,
        available_count: Number(row.available_count || 0),
      })),
      languages: languageRows.map((row) => ({
        code: row.learning_language,
        label: row.learning_label,
        native_label: row.native_label,
        flag: row.flag,
        learners_display: row.learners_display,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar catalogo de idiomas.", detail: error.message });
  }
});

app.post("/api/telemetry", async (req, res) => {
  try {
    const auth = await getCurrentAuth(req);
    const userId = auth?.user?.id || null;
    const { name, payload, moduleKey, screen, anonId, occurredAt } = req.body || {};
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Evento invalido." });
      return;
    }

    await pool.query(
      `INSERT INTO english_telemetry_events (id, user_id, anon_id, event_name, module_key, screen, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)` ,
      [
        randomId(),
        userId,
        anonId || null,
        name,
        moduleKey || null,
        screen || null,
        JSON.stringify(payload || {}),
        occurredAt ? new Date(occurredAt) : new Date(),
      ]
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Falha ao registrar evento." });
  }
});

app.get("/api/telemetry/summary", async (req, res) => {
  try {
    const auth = await getCurrentAuth(req);
    const userId = auth?.user?.id || null;
    const days = Math.max(1, Math.min(30, Number(req.query.days || 7)));

    const whereUser = userId ? "WHERE user_id = $1" : "";
    const params = userId ? [userId] : [];
    const recentWhere = userId
      ? `WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'`
      : `WHERE created_at >= NOW() - INTERVAL '${days} days'`;

    const totalRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM english_telemetry_events ${whereUser}`,
      params
    );

    const lastRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM english_telemetry_events ${recentWhere}`,
      params
    );

    const nameRes = await pool.query(
      `SELECT event_name AS name, COUNT(*)::int AS count
       FROM english_telemetry_events
       ${whereUser}
       GROUP BY event_name
       ORDER BY count DESC
       LIMIT 6`,
      params
    );

    const moduleRes = await pool.query(
      `SELECT module_key AS moduleKey, COUNT(*)::int AS count
       FROM english_telemetry_events
       ${whereUser}
       GROUP BY module_key
       ORDER BY count DESC
       LIMIT 6`,
      params
    );

    const recentRes = await pool.query(
      `SELECT event_name AS name, module_key AS moduleKey, screen, created_at
       FROM english_telemetry_events
       ${whereUser}
       ORDER BY created_at DESC
       LIMIT 10`,
      params
    );

    res.json({
      total: Number(totalRes.rows[0]?.count || 0),
      last7: Number(lastRes.rows[0]?.count || 0),
      by_name: nameRes.rows || [],
      by_module: moduleRes.rows || [],
      recent: recentRes.rows || [],
    });
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar telemetria." });
  }
});

app.get("/api/telemetry/export", async (req, res) => {
  try {
    const auth = await getCurrentAuth(req);
    const userId = auth?.user?.id || null;
    const days = Math.max(1, Math.min(30, Number(req.query.days || 7)));
    const whereUser = userId ? "WHERE user_id = $1" : "";
    const params = userId ? [userId] : [];
    const whereRecent = userId
      ? `WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'`
      : `WHERE created_at >= NOW() - INTERVAL '${days} days'`;

    const rows = await pool.query(
      `SELECT created_at, event_name, module_key, screen, user_id, anon_id
       FROM english_telemetry_events
       ${whereRecent}
       ORDER BY created_at DESC`
      , params
    );

    const header = "occurred_at,event_name,module_key,screen,user_id,anon_id";
    const lines = rows.rows.map((row) => {
      const values = [
        row.created_at?.toISOString?.() || "",
        row.event_name || "",
        row.module_key || "",
        row.screen || "",
        row.user_id || "",
        row.anon_id || "",
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`);
      return values.join(",");
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=telemetry.csv");
    res.send([header, ...lines].join("\n"));
  } catch (error) {
    res.status(500).json({ error: "Falha ao exportar telemetria." });
  }
});

app.get("/api/i18n/labels", async (req, res) => {
  try {
    const rawLocale = normalizeLocale(req.query.locale || "en-US");
    const base = rawLocale.includes("-") ? rawLocale : `${rawLocale}-US`;

    let rows = [];
    const primary = await pool.query(
      `SELECT label_key, text_value
       FROM english_ui_labels
       WHERE locale = $1`,
      [rawLocale]
    );
    rows = primary.rows || [];

    if (!rows.length && base !== rawLocale) {
      const fallback = await pool.query(
        `SELECT label_key, text_value
         FROM english_ui_labels
         WHERE locale = $1`,
        [base]
      );
      rows = fallback.rows || [];
    }

    if (!rows.length && rawLocale !== "en-US") {
      const fallbackEn = await pool.query(
        `SELECT label_key, text_value
         FROM english_ui_labels
         WHERE locale = $1`,
        ["en-US"]
      );
      rows = fallbackEn.rows || [];
    }

    const labels = {};
    rows.forEach((row) => {
      labels[row.label_key] = row.text_value;
    });

    res.json({ locale: rawLocale, labels });
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar legendas." });
  }
});


app.get("/api/grammar/content", async (req, res) => {
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

app.get("/api/dictionary/words", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(200, Math.max(10, Number(req.query.limit || 100)));
    const searchRaw = String(req.query.search || "").trim();
    const offset = (page - 1) * limit;

    let total = 0;
    let words = [];

    if (searchRaw) {
      const term = `${searchRaw}%`;
      const countRes = await pool.query(
        `SELECT COUNT(*)::int AS count FROM english_wiki_words WHERE word IS NOT NULL AND word ILIKE $1`,
        [term]
      );
      total = Number(countRes.rows[0]?.count || 0);
      const listRes = await pool.query(
        `SELECT word FROM english_wiki_words WHERE word IS NOT NULL AND word ILIKE $1 ORDER BY word ASC LIMIT $2 OFFSET $3`,
        [term, limit, offset]
      );
      words = listRes.rows.map((row) => row.word);
    } else {
      const countRes = await pool.query(
        `SELECT COUNT(*)::int AS count FROM english_wiki_words WHERE word IS NOT NULL`
      );
      total = Number(countRes.rows[0]?.count || 0);
      const listRes = await pool.query(
        `SELECT word FROM english_wiki_words WHERE word IS NOT NULL ORDER BY word ASC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      words = listRes.rows.map((row) => row.word);
    }

    res.json({ page, limit, total, words });
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar lista." });
  }
});
app.get("/api/dictionary/:word", async (req, res) => {
  try {
    const rawWord = String(req.params.word || "").trim();
    if (!rawWord) {
      res.status(400).json({ error: "Palavra invalida." });
      return;
    }

    const sourceLang = String(req.query.source || "pt");
    const normalized = normalizeLookupWord(rawWord);

    const { rows } = await pool.query(
      `SELECT word, part_of_speech, meanings, examples, synonyms, ipa, audio_url, normalized_word
       FROM english_wiki_words
       WHERE normalized_word = $1
       LIMIT 1`,
      [normalized]
    );

    let entry = rows[0] || null;
    let meanings = Array.isArray(entry?.meanings) ? entry.meanings : [];
    let synonyms = Array.isArray(entry?.synonyms) ? entry.synonyms : [];
    let examples = Array.isArray(entry?.examples) ? entry.examples : [];

    if (!entry) {
      const { rows: maxRows } = await pool.query(
        `SELECT COALESCE(MAX(rank_order), 0)::int AS max FROM english_wiki_words`
      );
      const nextRank = Number(maxRows[0]?.max || 0) + 1;

      await pool.query(
        `INSERT INTO english_wiki_words (rank_order, word, normalized_word)
         VALUES ($1, $2, $3)
         ON CONFLICT (word) DO NOTHING`,
        [nextRank, rawWord.toLowerCase(), normalized]
      );

      const { rows: afterRows } = await pool.query(
        `SELECT word, part_of_speech, meanings, examples, synonyms, ipa, audio_url, normalized_word
         FROM english_wiki_words
         WHERE normalized_word = $1
         LIMIT 1`,
        [normalized]
      );
      entry = afterRows[0] || null;
    }

    if (!meanings.length) {
      const apiData = await fetchDictionaryFromApis(rawWord, sourceLang);
      if (apiData) {
        meanings = apiData.meanings || [];
        synonyms = apiData.synonyms || [];
        examples = apiData.examples || [];

        await pool.query(
          `UPDATE english_wiki_words
           SET part_of_speech = $2,
               meanings = $3::jsonb,
               examples = $4::jsonb,
               synonyms = $5::jsonb,
               ipa = $6,
               audio_url = $7,
               meanings_quality_score = $8,
               meanings_status = $9,
               meanings_review_notes = $10,
               meanings_last_source = $11
           WHERE normalized_word = $1`,
          [
            normalized,
            apiData.partOfSpeech || "",
            JSON.stringify(meanings),
            JSON.stringify(examples),
            JSON.stringify(synonyms),
            apiData.ipa || "",
            apiData.audioUrl || "",
            quality.score,
            quality.status,
            quality.notes,
            "dictionaryapi.dev",
          ]
        );

        entry = {
          ...(entry || {}),
          part_of_speech: apiData.partOfSpeech || "",
          ipa: apiData.ipa || "",
          audio_url: apiData.audioUrl || "",
          word: entry?.word || rawWord,
        };
      }
    }

    res.json({
      word: entry?.word || rawWord,
      ipa: entry?.ipa || "",
      audio_url: entry?.audio_url || "",
      part_of_speech: entry?.part_of_speech || "",
      meanings,
      synonyms,
      examples,
    });
  } catch (error) {
    console.error("[dictionary] error", error);
    res.status(500).json({ error: "Falha ao buscar definicao." });
  }
});


app.get("/api/community/feed", requireAuth(async (req, res) => {
  try {
    const payload = await getCommunityFeedPayload(req.auth.user.id, {
      page: req.query.page,
      limit: req.query.limit,
      filter: req.query.filter,
    });
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar feed da comunidade.", detail: error.message });
  }
}));

app.post("/api/community/posts", requireAuth(async (req, res) => {
  try {
    const content = String(req.body?.content || "").trim();
    const mediaUrl = String(req.body?.media_url || "").trim();
    if (!content) {
      res.status(400).json({ error: "Conteudo obrigatorio." });
      return;
    }

    const postId = randomId();
    await pool.query(
      `INSERT INTO english_community_posts (id, author_user_id, author_key, author_name, content, media_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [postId, req.auth.user.id, req.auth.user.id, req.auth.user.name, content, mediaUrl]
    );

    res.status(201).json(await getCommunityFeedPayload(req.auth.user.id));
  } catch (error) {
    res.status(500).json({ error: "Falha ao publicar post.", detail: error.message });
  }
}));

app.post("/api/community/posts/:postId/like", requireAuth(async (req, res) => {
  try {
    const postId = String(req.params.postId || "").trim();
    const existing = await pool.query(
      `SELECT 1 FROM english_community_post_likes WHERE post_id = $1 AND user_id = $2 LIMIT 1`,
      [postId, req.auth.user.id]
    );

    if (existing.rows.length) {
      await pool.query(`DELETE FROM english_community_post_likes WHERE post_id = $1 AND user_id = $2`, [postId, req.auth.user.id]);
    } else {
      await pool.query(`INSERT INTO english_community_post_likes (post_id, user_id) VALUES ($1, $2)`, [postId, req.auth.user.id]);
      const { rows: postRows } = await pool.query(`SELECT author_user_id FROM english_community_posts WHERE id = $1 LIMIT 1`, [postId]);
      const recipient = postRows[0]?.author_user_id;
      if (recipient && recipient !== req.auth.user.id) {
        await createCommunityNotification({
          recipientUserId: recipient,
          actorUserId: req.auth.user.id,
          actorName: req.auth.user.name,
          type: "like",
          postId,
          message: `${req.auth.user.name} liked your post.`,
        });
      }
    }

    res.json(await getCommunityFeedPayload(req.auth.user.id));
  } catch (error) {
    res.status(500).json({ error: "Falha ao atualizar like.", detail: error.message });
  }
}));

app.post("/api/community/posts/:postId/comments", requireAuth(async (req, res) => {
  try {
    const postId = String(req.params.postId || "").trim();
    const textValue = String(req.body?.text || "").trim();
    if (!textValue) {
      res.status(400).json({ error: "Comentario obrigatorio." });
      return;
    }

    await pool.query(
      `INSERT INTO english_community_comments (id, post_id, author_user_id, author_key, author_name, text)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomId(), postId, req.auth.user.id, req.auth.user.id, req.auth.user.name, textValue]
    );

    const { rows: postRows } = await pool.query(`SELECT author_user_id FROM english_community_posts WHERE id = $1 LIMIT 1`, [postId]);
    const recipient = postRows[0]?.author_user_id;
    if (recipient && recipient !== req.auth.user.id) {
      await createCommunityNotification({
        recipientUserId: recipient,
        actorUserId: req.auth.user.id,
        actorName: req.auth.user.name,
        type: "comment",
        postId,
        message: `${req.auth.user.name} commented on your post.`,
      });
    }

    res.status(201).json(await getCommunityFeedPayload(req.auth.user.id));
  } catch (error) {
    res.status(500).json({ error: "Falha ao publicar comentario.", detail: error.message });
  }
}));

app.post("/api/community/posts/:postId/report", requireAuth(async (req, res) => {
  try {
    const postId = String(req.params.postId || "").trim();
    const reason = String(req.body?.reason || "general").trim() || "general";
    await pool.query(
      `INSERT INTO english_community_reports (id, post_id, reporter_user_id, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (post_id, reporter_user_id)
       DO UPDATE SET reason = EXCLUDED.reason, created_at = NOW()`,
      [randomId(), postId, req.auth.user.id, reason]
    );

    res.json(await getCommunityFeedPayload(req.auth.user.id));
  } catch (error) {
    res.status(500).json({ error: "Falha ao reportar post.", detail: error.message });
  }
}));

app.post("/api/community/users/:authorKey/mute", requireAuth(async (req, res) => {
  try {
    const authorKey = String(req.params.authorKey || "").trim();
    if (!authorKey || authorKey == req.auth.user.id) {
      res.status(400).json({ error: "Autor invalido para mute." });
      return;
    }

    await pool.query(
      `INSERT INTO english_community_user_mutes (id, muter_user_id, muted_author_key)
       VALUES ($1, $2, $3)
       ON CONFLICT (muter_user_id, muted_author_key) DO NOTHING`,
      [randomId(), req.auth.user.id, authorKey]
    );

    res.json(await getCommunityFeedPayload(req.auth.user.id));
  } catch (error) {
    res.status(500).json({ error: "Falha ao silenciar autor.", detail: error.message });
  }
}));

app.get("/api/community/notifications", requireAuth(async (req, res) => {
  try {
    res.json(await getCommunityNotifications(req.auth.user.id, Math.min(20, Math.max(5, Number(req.query.limit || 8)))));
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar notificacoes.", detail: error.message });
  }
}));

app.post("/api/community/notifications/read", requireAuth(async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((item) => String(item)) : [];
    if (ids.length) {
      await pool.query(
        `UPDATE english_community_notifications
         SET read_at = NOW()
         WHERE recipient_user_id = $1 AND id = ANY($2::text[])`,
        [req.auth.user.id, ids]
      );
    } else {
      await pool.query(
        `UPDATE english_community_notifications
         SET read_at = NOW()
         WHERE recipient_user_id = $1 AND read_at IS NULL`,
        [req.auth.user.id]
      );
    }
    res.json(await getCommunityNotifications(req.auth.user.id, 8));
  } catch (error) {
    res.status(500).json({ error: "Falha ao marcar notificacoes.", detail: error.message });
  }
}));

app.get("/api/admin/me", requireAuth(async (req, res) => {
  res.json({ role: req.auth.user.role || "user", is_admin: String(req.auth.user.role || "user") === "admin" });
}));

app.get("/api/admin/dictionary/entries", requireAdmin(async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const limit = Math.min(80, Math.max(10, Number(req.query.limit || 30)));
    const params = [];
    let where = "";
    if (search) {
      params.push(`${search}%`);
      where = `WHERE word ILIKE $${params.length}`;
    }
    params.push(limit);

    const { rows } = await pool.query(
      `SELECT word, normalized_word, part_of_speech, meanings, examples, synonyms, ipa, audio_url,
              meanings_verified_count, meanings_verified_at, meanings_quality_score, meanings_status, meanings_review_notes, meanings_last_source
       FROM english_wiki_words
       ${where}
       ORDER BY word ASC
       LIMIT $${params.length}`,
      params
    );

    res.json({ entries: rows });
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar entradas do dicionario.", detail: error.message });
  }
}));

app.patch("/api/admin/dictionary/entries/:word", requireAdmin(async (req, res) => {
  try {
    const rawWord = String(req.params.word || "").trim();
    const normalized = normalizeLookupWord(rawWord);
    const entry = await ensureWikiWord(normalized, rawWord);
    if (!entry) {
      res.status(404).json({ error: "Entrada nao encontrada." });
      return;
    }

    const meanings = parseJsonArrayInput(req.body?.meanings);
    const examples = parseJsonArrayInput(req.body?.examples);
    const synonyms = parseJsonArrayInput(req.body?.synonyms);
    const partOfSpeech = String(req.body?.part_of_speech || "").trim();
    const ipa = String(req.body?.ipa || "").trim();
    const audioUrl = String(req.body?.audio_url || "").trim();

    await pool.query(
      `UPDATE english_wiki_words
       SET part_of_speech = $2,
           meanings = $3::jsonb,
           examples = $4::jsonb,
           synonyms = $5::jsonb,
           ipa = $6,
           audio_url = $7,
           meanings_quality_score = $8,
           meanings_status = $9,
           meanings_review_notes = $10,
           meanings_last_source = $11
       WHERE normalized_word = $1`,
      [normalized, partOfSpeech, JSON.stringify(meanings), JSON.stringify(examples), JSON.stringify(synonyms), ipa, audioUrl, assessMeaningQuality(rawWord, meanings).score, assessMeaningQuality(rawWord, meanings).status, assessMeaningQuality(rawWord, meanings).notes, "admin_manual"]
    );

    res.json({ entry: await getAdminDictionaryEntry(normalized) });
  } catch (error) {
    res.status(400).json({ error: "Falha ao salvar entrada do dicionario.", detail: error.message });
  }
}));

app.post("/api/admin/dictionary/reverify/:word", requireAdmin(async (req, res) => {
  try {
    const rawWord = String(req.params.word || "").trim();
    const normalized = normalizeLookupWord(rawWord);
    await ensureWikiWord(normalized, rawWord);
    const apiData = await fetchDictionaryFromApis(rawWord, "pt");
    if (!apiData || !Array.isArray(apiData.meanings) || !apiData.meanings.length) {
      res.status(404).json({ error: "Nao foi possivel refazer meanings para esta palavra." });
      return;
    }

    const quality = assessMeaningQuality(rawWord, apiData.meanings || []);
    await pool.query(
      `UPDATE english_wiki_words
       SET part_of_speech = $2,
           meanings = $3::jsonb,
           examples = $4::jsonb,
           synonyms = $5::jsonb,
           ipa = $6,
           audio_url = $7,
           meanings_quality_score = $8,
           meanings_status = $9,
           meanings_review_notes = $10,
           meanings_last_source = $11,
           meanings_verified_count = meanings_verified_count + 1,
           meanings_verified_at = NOW()
       WHERE normalized_word = $1`,
      [
        normalized,
        apiData.partOfSpeech || "",
        JSON.stringify(apiData.meanings || []),
        JSON.stringify(apiData.examples || []),
        JSON.stringify(apiData.synonyms || []),
        apiData.ipa || "",
        apiData.audioUrl || "",
        quality.score,
        quality.status,
        quality.notes,
        "dictionaryapi.dev",
      ]
    );

    res.json({ entry: await getAdminDictionaryEntry(normalized) });
  } catch (error) {
    res.status(500).json({ error: "Falha ao refazer meanings.", detail: error.message });
  }
}));

app.get("/api/admin/i18n/labels", requireAdmin(async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const locale = String(req.query.locale || "").trim();
    const params = [];
    const where = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`label_key ILIKE $${params.length}`);
    }
    if (locale) {
      params.push(locale);
      where.push(`locale = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT label_key, locale, text_value, updated_at
       FROM english_ui_labels
       ${whereSql}
       ORDER BY label_key ASC, locale ASC
       LIMIT 200`,
      params
    );

    res.json({ labels: rows });
  } catch (error) {
    res.status(500).json({ error: "Falha ao carregar labels.", detail: error.message });
  }
}));

app.patch("/api/admin/i18n/labels/:labelKey", requireAdmin(async (req, res) => {
  try {
    const labelKey = decodeURIComponent(String(req.params.labelKey || "").trim());
    const locale = String(req.body?.locale || "").trim();
    const textValue = String(req.body?.text_value || "");
    if (!labelKey || !locale) {
      res.status(400).json({ error: "Label e idioma sao obrigatorios." });
      return;
    }

    const id = `${locale}__${labelKey}`;
    await pool.query(
      `INSERT INTO english_ui_labels (id, label_key, locale, text_value, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (label_key, locale)
       DO UPDATE SET text_value = EXCLUDED.text_value, updated_at = NOW()`,
      [id, labelKey, locale, textValue]
    );

    const { rows } = await pool.query(
      `SELECT label_key, locale, text_value, updated_at
       FROM english_ui_labels
       WHERE label_key = $1 AND locale = $2
       LIMIT 1`,
      [labelKey, locale]
    );

    res.json({ label: rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: "Falha ao salvar label.", detail: error.message });
  }
}));

app.post("/api/profile/setup", requireAuth(async (req, res) => {
  const result = await applyUserSetup(req.auth.user.id, req.body || {});
  res.json({ ok: true, ...result });
}));

app.post("/api/subscription/mock-upgrade", requireAuth(async (req, res) => {
  const plan = req.body?.plan === "premium" ? "premium" : "free";
  await pool.query(
    `UPDATE english_subscriptions
     SET plan = $1, updated_at = NOW()
     WHERE user_id = $2`,
    [plan, req.auth.user.id]
  );

  const auth = await getCurrentAuth(req);
  res.json({ subscription: auth.user.subscription });
}));

async function start() {
  await ensureDatabase();
  await syncAdminRoles();
  await ensurePortAvailable(PORT);
  httpServer = app.listen(PORT, () => {
    console.log(
      `[english-platform-auth] running on http://localhost:${PORT} (pid: ${process.pid}, db: ${process.env.DB_DATABASE || "english_platform"})`
    );
  });
  httpServer.on("error", (error) => {
    console.error("[english-platform-auth] server error", error);
  });
  httpServer.on("close", () => {
    console.warn("[english-platform-auth] server closed");
  });

  if (ENABLE_MEANINGS_VERIFIER) {
    setTimeout(() => {
      verifyWikiWordMeaningsBatch();
      setInterval(verifyWikiWordMeaningsBatch, MEANINGS_VERIFY_INTERVAL_MS);
    }, 1500);
  }

  // Keeps the Node process attached in environments where the terminal or
  // child process handling may prematurely release the event loop.
  process.stdin.resume();
}

process.on("beforeExit", (code) => {
  console.warn(`[english-platform-auth] beforeExit with code ${code}`);
});

process.on("exit", (code) => {
  console.warn(`[english-platform-auth] exit with code ${code}`);
});

process.on("SIGINT", () => {
  console.log("[english-platform-auth] received SIGINT, shutting down");
  httpServer?.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
  console.log("[english-platform-auth] received SIGTERM, shutting down");
  httpServer?.close(() => process.exit(0));
});

process.on("unhandledRejection", (error) => {
  console.error("[english-platform-auth] unhandled rejection", error);
});

process.on("uncaughtException", (error) => {
  console.error("[english-platform-auth] uncaught exception", error);
});

start().catch((error) => {
  console.error("[english-platform-auth] failed to start", error);
  process.exit(1);
});






