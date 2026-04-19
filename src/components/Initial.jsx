import React, { useEffect, useMemo, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { trackEvent } from "../lib/telemetry";

import "../initial.css";

import {

  BookOpen,

  CreditCard,

  Headphones,

  MessageSquare,

  BookMarked,

  Library,

  GraduationCap,

  FileText,

  Volume2,

  Pencil,

  Gamepad2,

  Lightbulb,

  Waves,

  Users,

  Languages,

  ClipboardCheck,

  User,

  UserRound,

  Music,

  Shield,

  Flame,

  Gem,

  Heart,

  ChevronRight,

  UserPlus,

  LogIn,

  RotateCcw,

  CheckCircle2,

  BrainCircuit,

  Gauge,

  TrendingUp,

  CalendarDays,
  RefreshCw,
  NotebookPen,
  TriangleAlert,
  Plus,
  BarChart3,
  FileDown,
  Trophy,
} from "lucide-react";
import Grammar from "./Grammar";

import Flashcards from "./Flashcards";

import MyVocabulary from "./MyVocabulary";

import Dictionary from "./Dictionary";

import Courses from "./Courses";

import SpeakWithAI from "./SpeakWithAI";

import ReadingComprehension from "./ReadingComprehension";

import Pronounce from "./Pronounce";

import Writing from "./Writing";

import Games from "./Games";

import Modernmethodologies from "./Modernmethodologies";

import Listening from "./Listening";

import Immersion from "./Immersion";

import SpeakWithnatives from "./SpeakWithnatives";

import TranslationPractice from "./TranslationPractice";

import TestYourEnglishLevel from "./TestYourEnglishLevel";

import Community from "./Community";

import MusicModule from "./Music";

import ProfileModule from "./Profile";
import PlansPage from "./Plans";
import ContentAdmin from "./ContentAdmin";



function hexToRgb(hex) {

  const cleaned = (hex || "#58cc02").replace("#", "");

  const normalized =

    cleaned.length === 3

      ? cleaned

          .split("")

          .map((c) => c + c)

          .join("")

      : cleaned;

  const int = Number.parseInt(normalized, 16);

  return {

    r: (int >> 16) & 255,

    g: (int >> 8) & 255,

    b: int & 255,

  };

}



function darken(hex, amount = 20) {

  const { r, g, b } = hexToRgb(hex);

  const next = [r, g, b].map((v) => Math.max(0, v - amount));

  return `rgb(${next[0]}, ${next[1]}, ${next[2]})`;

}



function alpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function rgbToHsl({ r, g, b }) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === nr) h = ((ng - nb) / diff) % 6;
    else if (max === ng) h = (nb - nr) / diff + 2;
    else h = (nr - ng) / diff + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function getPersonByColor(hex) {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));

  if (s <= 14 || l <= 18) return "lin";
  if (h >= 70 && h < 165) return "duo";
  if (h >= 45 && h < 70) return "bea";
  if (h >= 345 || h < 15) return "eddy";
  if (h >= 15 && h < 45) return l <= 46 ? "falstaff" : "lucy";
  if (h >= 165 && h < 255) return "junior";
  if (h >= 255 && h < 300) return "lily";
  if (h >= 300 && h < 345) return l >= 68 ? "zari" : "vikram";

  return "oscar";
}



const LANGUAGE_FLAG_MAP = {
  "pt-BR": { code: "br", label: "Português" },
  "en-US": { code: "gb", label: "English" },
  "es-ES": { code: "es", label: "Español" },
  "fr-FR": { code: "fr", label: "Français" },
  "it-IT": { code: "it", label: "Italiano" },
  "de-DE": { code: "de", label: "Deutsch" },
  "ja-JP": { code: "jp", label: "日本語" },
  "ko-KR": { code: "kr", label: "한국어" },
  "zh-CN": { code: "cn", label: "中文" },
};

function getLanguageFlag(locale) {
  const entry = LANGUAGE_FLAG_MAP[String(locale || '').trim()];
  if (!entry?.code) {
    return { src: '', label: 'Idioma' };
  }
  return {
    src: '/img/flags/' + entry.code + '.svg',
    label: entry.label,
  };
}


const MODULES = [
  { key: "grammar", label: "Grammar", color: "#58cc02", icon: BookOpen },
  { key: "flashcards", label: "Flashcards", color: "#FEB023", icon: CreditCard },
  { key: "my_vocabulary", label: "My Vocabulary", color: "#FF4A49", icon: Library },
  { key: "dictionary", label: "Dictionary", color: "#A46845", icon: BookMarked },
  { key: "speak_ai", label: "Speak With AI", color: "#14E5FF", icon: MessageSquare },
  { key: "courses", label: "Courses", color: "#A76EFF", icon: GraduationCap },
  { key: "reading", label: "Reading", color: "#C76B03", icon: FileText },
  { key: "pronounce", label: "Pronounce", color: "#FD9700", icon: Volume2 },
  { key: "writing", label: "Writing", color: "#27E69B", icon: Pencil },
  { key: "games", label: "Games", color: "#0084C6", icon: Gamepad2 },
  { key: "modern", label: "Modern Methodologies", color: "#FFC0EA", icon: Lightbulb },
  { key: "listening", label: "Listening", color: "#5B3F88", icon: Headphones },
  { key: "immersion", label: "Immersion", color: "#FFB100", icon: Waves },
  { key: "natives", label: "Speak With Natives", color: "#E79F53", icon: Users },
  { key: "translation", label: "Translation Practice", color: "#D3221F", icon: Languages },
  { key: "test_level", label: "Test Your English Level", color: "#CD308F", icon: ClipboardCheck },
  { key: "profile", label: "Profile", color: "#FF86CE", icon: UserRound },
  { key: "music", label: "Music", color: "#DB8E73", icon: Music },
  { key: "community", label: "Community", color: "#3C3E3B", icon: User },
];

const MODULE_LABEL_KEYS = {
  grammar: "module.grammar",
  flashcards: "module.flashcards",
  my_vocabulary: "module.my_vocabulary",
  dictionary: "module.dictionary",
  speak_ai: "module.speak_ai",
  courses: "module.courses",
  reading: "module.reading",
  pronounce: "module.pronounce",
  writing: "module.writing",
  games: "module.games",
  modern: "module.modern",
  listening: "module.listening",
  immersion: "module.immersion",
  natives: "module.natives",
  translation: "module.translation",
  test_level: "module.test_level",
  profile: "module.profile",
  music: "module.music",
  community: "module.community",
};

const AI_PREMIUM_MODULE_KEYS = new Set(["speak_ai", "modern", "writing", "translation"]);

const GRAMMAR_LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const GRAMMAR_LEVEL_TOTALS = {
  A1: 10,
  A2: 6,
  B1: 6,
  B2: 6,
  C1: 6,
  C2: 6,
};

const ONBOARDING_QUESTIONS = [
  {
    id: "q1",
    prompt: "Escolha a traducao de: 'I am looking for the train station.'",
    options: [
      "Estou procurando a estacao de trem.",
      "Eu cheguei na estacao de onibus.",
      "Vou trabalhar na estacao.",
    ],
    answer: 0,
    skill: "reading",
  },
  {
    id: "q2",
    prompt: "Complete: 'She ___ to work every day.'",
    options: ["go", "goes", "going"],
    answer: 1,
    skill: "grammar",
  },
  {
    id: "q3",
    prompt: "Qual resposta e mais natural para 'How was your day?'",
    options: [
      "It was productive, thanks for asking.",
      "Blue window seven.",
      "I am on yesterday.",
    ],
    answer: 0,
    skill: "speaking",
  },
  {
    id: "q4",
    prompt: "Escolha a melhor traducao para 'deadline'.",
    options: ["Prazo final", "Estrada", "Biblioteca"],
    answer: 0,
    skill: "vocabulary",
  },
  {
    id: "q5",
    prompt: "Qual frase esta escrita corretamente?",
    options: [
      "I have went to the meeting.",
      "I went to the meeting.",
      "I goed to the meeting.",
    ],
    answer: 1,
    skill: "writing",
  },
];


function todayIso() {

  return new Date().toISOString().slice(0, 10);

}



function addDays(dateIso, days) {

  const date = new Date(`${dateIso}T00:00:00`);

  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);

}



function ensureSrs(progress) {

  const data = progress || {};

  if (!data.modules) data.modules = {};

  if (!data.modules.srs_global) {

    data.modules.srs_global = {

      queue: [],

      completed_today: 0,

      total_reviews: 0,

      last_generated_date: null,

      next_item_id: 1,

    };

  }

  if (!Array.isArray(data.modules.srs_global.queue)) data.modules.srs_global.queue = [];

  return data;

}



function clamp(value, min = 0, max = 100) {

  return Math.max(min, Math.min(max, value));

}



function getDifficulty(score, errorPressure) {

  let level = "normal";

  if (score < 35) level = "basic";

  if (score >= 70) level = "advanced";

  if (errorPressure > 0.55 && level === "advanced") level = "normal";

  if (errorPressure > 0.65 && level === "normal") level = "basic";

  return level;

}



function scoreTrend(current, previous) {

  const prev = Number(previous || 0);

  const now = Number(current || 0);

  const diff = now - prev;

  if (diff > 4) return "up";

  if (diff < -4) return "down";

  return "flat";

}

function averageNumbers(values = []) {
  const numeric = (values || []).map((value) => Number(value || 0)).filter((value) => Number.isFinite(value));
  if (!numeric.length) return 0;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function countObjectKeys(value) {
  return value && typeof value === "object" ? Object.keys(value).length : 0;
}

function moduleLabelStatic(moduleKey, fallback = "") {
  const normalized = String(moduleKey || "").trim().toLowerCase();
  const module = MODULES.find((item) => item.key === normalized);
  return getUiLabel(MODULE_LABEL_KEYS[normalized] || "", fallback || module?.label || normalized || "module");
}

function buildPedagogicalSignals(progress = {}) {
  const modules = progress?.modules || {};
  const grammarBlock = modules.grammar || {};
  const flashcardsBlock = modules.flashcards || {};
  const vocabularyBlock = modules.my_vocabulary || {};
  const readingBlock = modules.reading_comprehension || {};
  const listeningBlock = modules.listening || {};
  const pronounceBlock = modules.pronounce || {};
  const speakAiBlock = modules.speak_ai || {};
  const nativesBlock = modules.speak_with_natives || {};
  const writingBlock = modules.writing || {};
  const translationBlock = modules.translation_practice || {};
  const modernBlock = modules.modern_methodologies || {};
  const coursesBlock = modules.courses || {};
  const gamesBlock = modules.games || {};
  const immersionBlock = modules.immersion || {};
  const musicBlock = modules.music || {};
  const testLevelBlock = modules.test_english_level || {};
  const flashLast = flashcardsBlock.last_results || null;
  const flashAccuracy = flashLast?.total_cards
    ? Number(flashLast.correct_count || 0) / Math.max(1, Number(flashLast.total_cards || 1))
    : 0.5;
  const translationAttempts = Number(translationBlock.total_attempts || 0);
  const translationWrong = Number(translationBlock.wrong_count || 0);
  const translationErrorRate = translationAttempts > 0 ? translationWrong / translationAttempts : 0;

  return {
    modules,
    grammarCompleted: Number((grammarBlock.completed_units || []).length),
    writingBest: Number(writingBlock.best_score || 0),
    writingAttempts: Number(writingBlock.attempts || 0),
    modernMetrics: modernBlock.metrics || {},
    modernSessions: Number((modernBlock.session_history || []).length),
    translationAttempts,
    translationErrorRate,
    learnedWords: Number(vocabularyBlock.learned_words || progress?.my_vocabulary?.learned_words || 0),
    flashLast,
    flashAccuracy,
    readingCompleted: Number((readingBlock.completed_passages || []).length),
    readingBestAvg: averageNumbers(Object.values(readingBlock.best_scores || {})),
    listeningCompleted: Number(listeningBlock.total_completed || 0),
    pronounceAccuracy: Number(pronounceBlock.last_accuracy || 0),
    pronounceSessions: Number(pronounceBlock.sessions_completed || 0),
    aiMessages: Number(speakAiBlock.total_messages || 0),
    nativeSessions: Number(nativesBlock.total_sessions || 0),
    nativeMinutes: Number(nativesBlock.total_minutes || 0),
    coursesLessons: Number((coursesBlock.done_lesson_ids || []).length),
    courseCertificates: countObjectKeys(coursesBlock.certificates),
    immersionCompleted: Number(immersionBlock.total_completed || 0),
    immersionBridgeClicks:
      Number(immersionBlock.bridge_clicks?.reading || 0) +
      Number(immersionBlock.bridge_clicks?.listening || 0),
    gamesSessions: Number(gamesBlock.total_sessions || 0),
    gamesHighScore: Number(gamesBlock.high_score || 0),
    gamesBestCombo: Number(gamesBlock.best_combo || 0),
    musicSearches: Number((musicBlock.search_history || []).length),
    musicTranslatedLines: Number((musicBlock.translated_lyrics || []).length),
    musicHasSelection: musicBlock.selected_video_id ? 1 : 0,
    testLevelAttempts: Number(testLevelBlock.attempts || 0),
    testFinalScore: Number(testLevelBlock.last_result?.final_score || 0),
    testSkills: testLevelBlock.last_result?.skills || {},
  };
}

function buildPedagogicalModuleHealth(progress = {}) {
  const signals = buildPedagogicalSignals(progress);
  const { modernMetrics, testSkills } = signals;

  return [
    { key: "grammar", label: moduleLabelStatic("grammar", "Grammar"), value: 20 + signals.grammarCompleted * 11 + Number(modernMetrics.grammar || 0) * 0.4 },
    { key: "flashcards", label: moduleLabelStatic("flashcards", "Flashcards"), value: 18 + signals.flashAccuracy * 82 + Number(signals.flashLast?.total_cards || 0) * 1.2 },
    { key: "my_vocabulary", label: moduleLabelStatic("my_vocabulary", "My Vocabulary"), value: 14 + signals.learnedWords * 0.42 },
    { key: "speak_ai", label: moduleLabelStatic("speak_ai", "Speak With AI"), value: 16 + signals.aiMessages * 1.4 + Number(modernMetrics.context || 0) * 0.3 },
    { key: "courses", label: moduleLabelStatic("courses", "Courses"), value: 18 + signals.coursesLessons * 3.2 + signals.courseCertificates * 18 },
    { key: "reading", label: moduleLabelStatic("reading", "Reading"), value: 18 + signals.readingCompleted * 10 + signals.readingBestAvg * 0.42 + Number(testSkills.reading || 0) * 0.22 },
    { key: "pronounce", label: moduleLabelStatic("pronounce", "Pronounce"), value: 20 + signals.pronounceSessions * 7 + signals.pronounceAccuracy * 0.45 },
    { key: "writing", label: moduleLabelStatic("writing", "Writing"), value: 18 + signals.writingAttempts * 4 + signals.writingBest * 0.5 + Number(testSkills.writing || 0) * 0.22 },
    { key: "games", label: moduleLabelStatic("games", "Games"), value: 12 + signals.gamesSessions * 9 + signals.gamesBestCombo * 1.4 + signals.gamesHighScore * 0.025 },
    { key: "modern", label: moduleLabelStatic("modern", "Modern Methodologies"), value: 20 + averageNumbers(Object.values(modernMetrics || {})) * 0.7 + signals.modernSessions * 4 },
    { key: "listening", label: moduleLabelStatic("listening", "Listening"), value: 18 + signals.listeningCompleted * 9 + Number(testSkills.listening || 0) * 0.24 + signals.musicHasSelection * 6 },
    { key: "immersion", label: moduleLabelStatic("immersion", "Immersion"), value: 18 + signals.immersionCompleted * 11 + signals.immersionBridgeClicks * 4 },
    { key: "natives", label: moduleLabelStatic("natives", "Speak With Natives"), value: 14 + signals.nativeSessions * 13 + signals.nativeMinutes * 0.35 },
    { key: "translation", label: moduleLabelStatic("translation", "Translation Practice"), value: 18 + signals.translationAttempts * 2.8 + (1 - signals.translationErrorRate) * 42 },
    { key: "test_level", label: moduleLabelStatic("test_level", "Test Your English Level"), value: 16 + signals.testLevelAttempts * 8 + signals.testFinalScore * 0.6 },
    { key: "music", label: moduleLabelStatic("music", "Music"), value: 12 + signals.musicSearches * 5 + signals.musicTranslatedLines * 1.5 + signals.musicHasSelection * 12 },
  ].map((item) => ({
    ...item,
    value: clamp(Math.round(item.value), 0, 100),
  }));
}



function computeAdaptiveDiagnostics(progress) {
  const signals = buildPedagogicalSignals(progress);
  const modules = signals.modules || {};
  const previous = modules.adaptive_diagnostics || {};
  const previousMap = Object.fromEntries(
    (previous.skill_scores || []).map((item) => [item.skill, Number(item.score || 0)])
  );

  const grammarScore = clamp(
    22 +
      signals.grammarCompleted * 12 +
      Number(signals.modernMetrics.grammar || 0) * 0.5 +
      signals.writingBest * 0.15 +
      signals.coursesLessons * 0.8 +
      signals.testFinalScore * 0.08 -
      signals.translationErrorRate * 35
  );

  const vocabularyScore = clamp(
    18 +
      signals.learnedWords * 0.55 +
      signals.flashAccuracy * 24 +
      Number(signals.modernMetrics.vocabulary || 0) * 0.4 +
      signals.musicTranslatedLines * 0.7 +
      signals.gamesSessions * 1.1
  );

  const readingScore = clamp(
    20 +
      signals.readingCompleted * 11 +
      signals.readingBestAvg * 0.45 +
      signals.immersionCompleted * 5 +
      signals.coursesLessons * 0.45 +
      signals.musicSearches * 1.3 +
      Number(signals.testSkills.reading || 0) * 0.35
  );

  const listeningScore = clamp(
    20 +
      signals.listeningCompleted * 10 +
      signals.pronounceAccuracy * 0.5 +
      signals.pronounceSessions * 3 +
      signals.musicHasSelection * 6 +
      signals.musicTranslatedLines * 0.4 +
      Number(signals.testSkills.listening || 0) * 0.35
  );

  const speakingScore = clamp(
    16 +
      signals.aiMessages * 0.9 +
      signals.nativeSessions * 12 +
      signals.nativeMinutes * 0.18 +
      signals.pronounceSessions * 4 +
      Number(signals.modernMetrics.context || 0) * 0.25 +
      Number(signals.testSkills.speaking || 0) * 0.35
  );

  const writingScore = clamp(
    18 +
      signals.writingBest * 0.55 +
      signals.writingAttempts * 2 +
      Number(signals.modernMetrics.clarity || 0) * 0.35 +
      signals.coursesLessons * 0.35 +
      signals.courseCertificates * 6 +
      Number(signals.testSkills.writing || 0) * 0.4 -
      signals.translationErrorRate * 28
  );



  const skillScores = [

    {

      skill: "grammar",

      score: Math.round(grammarScore),

      error_pressure: Number((signals.translationErrorRate * 0.7).toFixed(2)),

    },

    {

      skill: "vocabulary",

      score: Math.round(vocabularyScore),

      error_pressure: Number((Math.max(0, 0.45 - signals.flashAccuracy / 2)).toFixed(2)),

    },

    {

      skill: "reading",

      score: Math.round(readingScore),

      error_pressure: Number((Math.max(0, 0.5 - signals.readingBestAvg / 200)).toFixed(2)),

    },

    {

      skill: "listening",

      score: Math.round(listeningScore),

      error_pressure: Number((Math.max(0, 0.55 - signals.pronounceAccuracy / 150)).toFixed(2)),

    },

    {

      skill: "speaking",

      score: Math.round(speakingScore),

      error_pressure: Number((Math.max(0, 0.5 - signals.aiMessages / 40)).toFixed(2)),

    },

    {

      skill: "writing",

      score: Math.round(writingScore),

      error_pressure: Number((Math.max(0, 0.6 - signals.writingBest / 170)).toFixed(2)),

    },

  ].map((item) => ({

    ...item,

    difficulty: getDifficulty(item.score, item.error_pressure),

    trend: scoreTrend(item.score, previousMap[item.skill]),

  }));



  const globalScore = Math.round(

    skillScores.reduce((sum, item) => sum + item.score, 0) / Math.max(1, skillScores.length)

  );



  const weakest = [...skillScores].sort((a, b) => a.score - b.score)[0];

  const skillToModule = {

    grammar: "grammar",

    vocabulary: "my_vocabulary",

    reading: "reading",

    listening: "listening",

    speaking: "speak_ai",

    writing: "writing",

  };

  const recommendedModule = skillToModule[weakest?.skill] || "grammar";



  return {

    global_score: globalScore,

    global_difficulty: getDifficulty(

      globalScore,

      skillScores.reduce((sum, item) => sum + item.error_pressure, 0) / Math.max(1, skillScores.length)

    ),

    recommended_module_key: recommendedModule,

    focus_skill: weakest?.skill || "grammar",

    skill_scores: skillScores,

    last_evaluated: new Date().toISOString(),

  };

}



function startOfWeekIso(date = new Date()) {

  const target = new Date(date);

  const day = target.getDay();

  const diffToMonday = day === 0 ? -6 : 1 - day;

  target.setDate(target.getDate() + diffToMonday);

  target.setHours(0, 0, 0, 0);

  return target.toISOString().slice(0, 10);

}



function buildWeeklyPlan(goal = "conversacao", progress = {}) {
  const goalKey = goal || "conversacao";

  const weekStart = startOfWeekIso();

  const profileXp = Number(progress?.profile?.xp || 0);

  const baseMinutes = profileXp > 400 ? 35 : profileXp > 150 ? 28 : 22;



  const templates = {

    viagem: [

      ["listening", getUiLabel("weekly.travel.1", "Airport and hotel (listening)"), baseMinutes],

      ["translation", getUiLabel("weekly.travel.2", "Useful EN<->PT travel phrases"), baseMinutes],
      ["speak_ai", getUiLabel("weekly.travel.3", "Roleplay: asking for directions"), baseMinutes],
      ["my_vocabulary", getUiLabel("weekly.travel.4", "Transport vocabulary"), baseMinutes - 4],
      ["pronounce", getUiLabel("weekly.travel.5", "Pronunciation of places and directions"), baseMinutes - 2],
      ["immersion", getUiLabel("weekly.travel.6", "Short reading: travel itinerary"), baseMinutes],
      ["flashcards", getUiLabel("weekly.travel.7", "Quick travel review"), baseMinutes - 6],
    ],

    trabalho: [

      ["writing", getUiLabel("weekly.work.1", "Professional email and follow-up"), baseMinutes + 4],

      ["reading", getUiLabel("weekly.work.2", "Business reading practice"), baseMinutes],
      ["speak_ai", getUiLabel("weekly.work.3", "Meeting simulation"), baseMinutes + 2],
      ["dictionary", getUiLabel("weekly.work.4", "Technical terms and synonyms"), baseMinutes - 4],
      ["courses", getUiLabel("weekly.work.5", "Career English module"), baseMinutes],
      ["listening", getUiLabel("weekly.work.6", "Meeting audio in English"), baseMinutes],
      ["flashcards", getUiLabel("weekly.work.7", "Corporate vocabulary review"), baseMinutes - 5],
    ],

    prova: [

      ["reading", getUiLabel("weekly.exam.1", "Reading comprehension (timed)"), baseMinutes + 6],
      ["writing", getUiLabel("weekly.exam.2", "Sentence correction and cohesion"), baseMinutes + 4],
      ["listening", getUiLabel("weekly.exam.3", "Listening practice with repetition"), baseMinutes + 2],
      ["test_level", getUiLabel("weekly.exam.4", "Mini mock test by blocks"), baseMinutes + 8],

      ["grammar", getUiLabel("weekly.exam.5", "Review common structures"), baseMinutes],
      ["translation", getUiLabel("weekly.exam.6", "High-accuracy translation"), baseMinutes],
      ["srs", getUiLabel("weekly.exam.7", "Spaced review of weak points"), baseMinutes - 4],
    ],

    conversacao: [

      ["speak_ai", getUiLabel("weekly.conversation.1", "Guided conversation with corrections"), baseMinutes + 4],
      ["speak_ai", getUiLabel("weekly.conversation.2", "Quick questions and answers"), baseMinutes],
      ["pronounce", getUiLabel("weekly.conversation.3", "Critical sounds practice"), baseMinutes - 2],
      ["listening", getUiLabel("weekly.conversation.4", "Active listening + repetition"), baseMinutes + 2],
      ["speak_with_natives", getUiLabel("weekly.conversation.5", "Speaking session with natives"), baseMinutes + 6],
      ["immersion", getUiLabel("weekly.conversation.6", "Context dialogue and audio"), baseMinutes],
      ["flashcards", getUiLabel("weekly.conversation.7", "Useful dialogue phrases"), baseMinutes - 6],
    ],

  };



  const chosen = templates[goalKey] || templates.conversacao;

  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

  return {

    goal: goalKey,

    week_start: weekStart,

    generated_at: new Date().toISOString(),

    days: chosen.map((item, index) => ({

      day_index: index,

      day_name: dayNames[index],

      module_key: item[0],

      task: item[1],

      minutes: Math.max(12, Number(item[2] || baseMinutes)),

      status: "pending",

    })),

  };
}

function ensureErrorNotebook(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.error_notebook) {
    data.modules.error_notebook = {
      patterns: [],
      total_logged: 0,
      last_updated: null,
      manual_notes: [],
    };
  }
  if (!Array.isArray(data.modules.error_notebook.patterns)) data.modules.error_notebook.patterns = [];
  if (!Array.isArray(data.modules.error_notebook.manual_notes)) data.modules.error_notebook.manual_notes = [];
  return data;
}

function ensureLongTermRetention(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
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
  return data;
}

function ensurePedagogicalOnboarding(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
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
  return data;
}

function ensurePedagogicalReports(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
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
  return data;
}

function ensureUiNavigation(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.ui_navigation) {
    data.modules.ui_navigation = {
      selected_module_key: "grammar",
      active_screen: "home",
      grammar_current_level: "A1",
    };
  }
  return data;
}

function buildAdvancedPedagogicalReport(progress = {}) {
  const modules = progress.modules || {};
  const adaptive = modules.adaptive_diagnostics || {};
  const retention = modules.long_term_retention || {};
  const weekly = modules.weekly_study_plan || {};
  const onboarding = modules.pedagogical_onboarding || {};
  const profile = progress.profile || {};
  const skillScores = Array.isArray(adaptive.skill_scores) ? adaptive.skill_scores : [];

  const strongest = [...skillScores].sort((a, b) => Number(b.score || 0) - Number(a.score || 0))[0] || null;
  const weakest = [...skillScores].sort((a, b) => Number(a.score || 0) - Number(b.score || 0))[0] || null;

  const totalRetention = Number(retention.total_tests || 0);
  const passedRetention = Number(retention.passed_tests || 0);
  const retentionRate = totalRetention > 0 ? Math.round((passedRetention / totalRetention) * 100) : 0;

  const days = Array.isArray(weekly.days) ? weekly.days : [];
  const completedDays = days.filter((day) => day.status === "done").length;
  const consistencyRate = days.length > 0 ? Math.round((completedDays / days.length) * 100) : 0;

  const reportsHistory = Array.isArray(modules.pedagogical_reports?.history)
    ? modules.pedagogical_reports.history
    : [];
  const previous = reportsHistory[reportsHistory.length - 1] || null;

  const currentScore = Number(adaptive.global_score || 0);
  const previousScore = Number(previous?.global_score || 0);
  const evolution = currentScore - previousScore;

  const objective = onboarding.goal || "conversacao";
  const level = onboarding.estimated_level || estimatedLevelFromScore(onboarding.quiz_score || 0);

  const moduleHealth = buildPedagogicalModuleHealth(progress);

  const generatedAt = new Date().toISOString();
  return {
    id: `report_${Date.now()}`,
    generated_at: generatedAt,
    global_score: currentScore,
    level_estimate: level,
    objective,
    retention_rate: retentionRate,
    consistency_rate: consistencyRate,
    xp: Number(profile.xp || 0),
    streak_days: Number(profile.streak_days || 0),
    strongest_skill: strongest ? strongest.skill : null,
    weakest_skill: weakest ? weakest.skill : null,
    score_evolution: evolution,
    module_health: moduleHealth,
    recommendations: [
      weakest
        ? getUiLabel("report.recommendation.focus", "Prioritize {skill} in the next 72 hours.").replace("{skill}", skillLabelStatic(weakest.skill))
        : getUiLabel("report.recommendation.start", "Start with grammar practice."),
      retentionRate < 65
        ? getUiLabel("report.recommendation.retention_low", "Increase spaced reviews across 7 and 30 days to consolidate memory.")
        : getUiLabel("report.recommendation.retention_ok", "Keep the current spaced reviews to preserve retention."),
      consistencyRate < 60
        ? getUiLabel("report.recommendation.consistency_low", "Reduce the daily goal and improve weekly consistency.")
        : getUiLabel("report.recommendation.consistency_ok", "Weekly consistency is solid, so you can raise the difficulty."),
    ],
  };
}

function skillLabelStatic(skillKey) {
  const map = {
    grammar: "Grammar",
    vocabulary: "Vocabulary",
    reading: "Reading",
    listening: "Listening",
    speaking: "Speaking",
    writing: "Writing",
  };
  return map[skillKey] || skillKey;
}

function estimatedLevelFromScore(score = 0) {
  if (score >= 90) return "C1";
  if (score >= 80) return "B2";
  if (score >= 65) return "B1";
  if (score >= 45) return "A2";
  return "A1";
}

function buildPersonalizedTrack(goal = "conversacao", learnerProfile = "balanced") {
  const goalTracks = {
    viagem: ["listening", "translation", "my_vocabulary", "speak_ai", "immersion", "flashcards"],
    trabalho: ["writing", "reading", "dictionary", "courses", "speak_ai", "listening"],
    prova: ["reading", "writing", "grammar", "translation", "test_level", "flashcards"],
    conversacao: ["speak_ai", "pronounce", "listening", "natives", "immersion", "flashcards"],
  };
  const profileBoost = {
    visual: "reading",
    auditivo: "listening",
    pratico: "speak_ai",
    balanced: "grammar",
  };
  const base = goalTracks[goal] || goalTracks.conversacao;
  const booster = profileBoost[learnerProfile] || profileBoost.balanced;
  const merged = [booster, ...base, "grammar", "my_vocabulary"];
  return [...new Set(merged)].slice(0, 8);
}

function normalizeRetentionDue(records, now = todayIso()) {
  return (records || []).map((item) => {
    if (item.status === "done") return item;
    const dueNow = item.scheduled_for <= now;
    return {
      ...item,
      status: dueNow ? "due" : "scheduled",
    };
  });
}

function buildRetentionSeeds(progress, existingRecords = [], limit = 3) {
  const existingKeys = new Set((existingRecords || []).filter((item) => item.status !== "done").map((item) => item.key));
  const candidates = buildSrsCandidates(progress).filter((item) => !existingKeys.has(item.key)).slice(0, limit);
  return candidates;
}

function buildRecurringErrorPatterns(progress, previousPatterns = []) {
  const modules = progress?.modules || {};
  const prevMap = Object.fromEntries((previousPatterns || []).map((item) => [item.key, item]));
  const patterns = [];

  const translationAttempts = Number(modules.translation_practice?.total_attempts || 0);
  const translationWrong = Number(modules.translation_practice?.wrong_count || 0);
  const translationErrorRate = translationAttempts > 0 ? translationWrong / translationAttempts : 0;
  if (translationAttempts >= 5 && translationErrorRate >= 0.25) {
    patterns.push({
      key: "preposicoes",
      title: getUiLabel("errors.prepositions.title", "Prepositions"),
      rule: getUiLabel("errors.prepositions.rule", "Practice in/on/at, to/for and from/of in short sentences."),
      wrong_example: "I am in the bus",
      right_example: "I am on the bus",
      occurrences: Math.max(2, Math.round(translationWrong * 0.55)),
    });
  }

  const writingBest = Number(modules.writing?.best_score || 0);
  const writingAttempts = Number(modules.writing?.attempts || 0);
  if (writingAttempts >= 3 && writingBest < 65) {
    patterns.push({
      key: "ordem_palavras",
      title: getUiLabel("errors.word_order.title", "Word order"),
      rule: getUiLabel("errors.word_order.rule", "Practice subject + verb + complement structure."),
      wrong_example: "Always I study English",
      right_example: "I always study English",
      occurrences: Math.max(2, Math.round((70 - writingBest) / 8)),
    });
  }

  const grammarCompleted = Number((modules.grammar?.completed_units || []).length);
  const grammarMetric = Number(modules.modern_methodologies?.metrics?.grammar || 0);
  if (grammarCompleted > 0 && grammarMetric < 35) {
    patterns.push({
      key: "concordancia_verbal",
      title: getUiLabel("errors.subject_verb.title", "Subject-verb agreement"),
      rule: getUiLabel("errors.subject_verb.rule", "Review he/she/it + verb with s in the simple present."),
      wrong_example: "She go to school",
      right_example: "She goes to school",
      occurrences: Math.max(1, Math.round((35 - grammarMetric) / 7)),
    });
  }

  const listeningDone = Number(modules.listening?.total_completed || 0);
  const pronounceAccuracy = Number(modules.pronounce?.last_accuracy || 0);
  if (listeningDone > 0 && pronounceAccuracy < 55) {
    patterns.push({
      key: "confusao_sons",
      title: getUiLabel("errors.sounds.title", "Sound confusion"),
      rule: getUiLabel("errors.sounds.rule", "Practice minimal pairs and repeat with slower audio."),
      wrong_example: "ship/sheep trocados",
      right_example: "ship (I) vs sheep (i:)",
      occurrences: Math.max(1, Math.round((60 - pronounceAccuracy) / 10)),
    });
  }

  const manualPatterns = (previousPatterns || []).filter((item) => item.source === "manual");
  const mergedAuto = patterns.map((item) => {
    const prev = prevMap[item.key];
    return {
      ...item,
      id: prev?.id || `err_${item.key}`,
      source: "auto",
      status: prev?.status || "active",
      review_count: Number(prev?.review_count || 0),
      occurrences: Math.max(Number(item.occurrences || 0), Number(prev?.occurrences || 0)),
      last_seen: new Date().toISOString(),
    };
  });

  const all = [...mergedAuto, ...manualPatterns];
  return all.sort((a, b) => Number(b.occurrences || 0) - Number(a.occurrences || 0)).slice(0, 12);
}

function buildSrsCandidates(progress) {
  const signals = buildPedagogicalSignals(progress);
  const modules = signals.modules || {};
  const candidates = [];
  const pushCandidate = (candidate, condition = true) => {
    if (!condition) return;
    candidates.push(candidate);
  };

  const learnedWords = modules.my_vocabulary?.learned_word_ids || [];

  pushCandidate(
    {
      key: `vocab_${learnedWords[0]}`,
      module: "my_vocabulary",
      title: getUiLabel("srs.vocab.title", "Review learned word"),
      prompt: getUiLabel("srs.vocab.prompt", "Try to recall the translation and use it in a short sentence."),
    },
    learnedWords.length > 0
  );

  pushCandidate(
    {
      key: "grammar_recent",
      module: "grammar",
      title: getUiLabel("srs.grammar.title", "Review latest grammar unit"),
      prompt: getUiLabel("srs.grammar.prompt", "Recap the structure and say 2 examples."),
    },
    (modules.grammar?.completed_units || []).length > 0
  );

  pushCandidate(
    {
      key: "translation_mix",
      module: "translation",
      title: getUiLabel("srs.translation.title", "Review EN <-> PT translation"),
      prompt: getUiLabel("srs.translation.prompt", "Do 3 quick translations without help."),
    },
    (modules.translation_practice?.total_attempts || 0) > 0
  );

  pushCandidate(
    {
      key: "listening_audio",
      module: "listening",
      title: getUiLabel("srs.listening.title", "Review listening sentences"),
      prompt: getUiLabel("srs.listening.prompt", "Listen and repeat with a short pause."),
    },
    (modules.listening?.total_completed || 0) > 0
  );

  if (modules.flashcards?.last_results) {
    const flashcardsGlobal = Array.isArray(modules.flashcards?.global_review_cards)
      ? modules.flashcards.global_review_cards
      : [];

    if (flashcardsGlobal.length > 0) {
      flashcardsGlobal.slice(0, 2).forEach((entry) => {
        candidates.push({
          key: entry.key,
          module: entry.module || "flashcards",
          title: entry.title || getUiLabel("srs.flashcards.card_title", "Review flashcard"),
          prompt: entry.prompt || getUiLabel("srs.flashcards.card_prompt", "Review the recent weak card."),
        });
      });
    } else {
      pushCandidate({
        key: "flashcards_memory",
        module: "flashcards",
        title: getUiLabel("srs.flashcards.deck_title", "Review recent flashcards deck"),
        prompt: getUiLabel("srs.flashcards.deck_prompt", "Go through 5 cards using active recall."),
      });
    }
  }

  pushCandidate(
    {
      key: "reading_passage",
      module: "reading",
      title: getUiLabel("srs.reading.title", "Review reading passage"),
      prompt: getUiLabel("srs.reading.prompt", "Recall the main idea and one supporting detail from a recent passage."),
    },
    signals.readingCompleted > 0
  );

  pushCandidate(
    {
      key: "writing_revision",
      module: "writing",
      title: getUiLabel("srs.writing.title", "Review writing correction"),
      prompt: getUiLabel("srs.writing.prompt", "Rewrite one recent sentence with clearer structure and fewer mistakes."),
    },
    signals.writingAttempts > 0
  );

  pushCandidate(
    {
      key: "speak_ai_recall",
      module: "speak_ai",
      title: getUiLabel("srs.speaking.title", "Review speaking idea"),
      prompt: getUiLabel("srs.speaking.prompt", "Say one short answer aloud using the last conversation topic."),
    },
    signals.aiMessages > 0
  );

  pushCandidate(
    {
      key: "pronounce_sound",
      module: "pronounce",
      title: getUiLabel("srs.pronounce.title", "Review critical sound"),
      prompt: getUiLabel("srs.pronounce.prompt", "Repeat the most recent sound pair slowly and then at natural speed."),
    },
    signals.pronounceSessions > 0
  );

  pushCandidate(
    {
      key: "courses_checkpoint",
      module: "courses",
      title: getUiLabel("srs.courses.title", "Review course checkpoint"),
      prompt: getUiLabel("srs.courses.prompt", "Recall one key lesson from the most recent course module."),
    },
    signals.coursesLessons > 0
  );

  pushCandidate(
    {
      key: "immersion_theme",
      module: "immersion",
      title: getUiLabel("srs.immersion.title", "Review immersion theme"),
      prompt: getUiLabel("srs.immersion.prompt", "Summarize the last immersion theme in one or two sentences."),
    },
    signals.immersionCompleted > 0
  );

  pushCandidate(
    {
      key: "natives_session",
      module: "natives",
      title: getUiLabel("srs.natives.title", "Review native conversation"),
      prompt: getUiLabel("srs.natives.prompt", "Recall one useful phrase from the last session with a native speaker."),
    },
    signals.nativeSessions > 0
  );

  pushCandidate(
    {
      key: "test_level_weakest",
      module: "test_level",
      title: getUiLabel("srs.test_level.title", "Review weakest test skill"),
      prompt: getUiLabel("srs.test_level.prompt", "Revisit the weakest skill from the last level test with one short drill."),
    },
    signals.testLevelAttempts > 0
  );

  pushCandidate(
    {
      key: "music_lyrics",
      module: "music",
      title: getUiLabel("srs.music.title", "Review music lyrics"),
      prompt: getUiLabel("srs.music.prompt", "Listen again and recall one lyric line with its meaning."),
    },
    signals.musicHasSelection > 0 || signals.musicSearches > 0
  );

  pushCandidate(
    {
      key: "games_speed",
      module: "games",
      title: getUiLabel("srs.games.title", "Review speed challenge"),
      prompt: getUiLabel("srs.games.prompt", "Practice one quick answer round focusing on accuracy before speed."),
    },
    signals.gamesSessions > 0
  );

  pushCandidate(
    {
      key: "modern_coaching",
      module: "modern",
      title: getUiLabel("srs.modern.title", "Review mentor feedback"),
      prompt: getUiLabel("srs.modern.prompt", "Apply one mentor suggestion in a new sentence."),
    },
    signals.modernSessions > 0
  );

  if (candidates.length === 0) {
    pushCandidate({
      key: "starter_review",
      module: "starter",
      title: getUiLabel("srs.starter.title", "First global review"),
      prompt: getUiLabel("srs.starter.prompt", "Start with the Grammar module and finish 1 lesson."),
    });
  }

  return candidates.slice(0, 10);
}

function toDateOnly(isoDateTime) {
  if (!isoDateTime || typeof isoDateTime !== "string") return null;
  const date = isoDateTime.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function computeFlashcardsSrsCounts(srsCards = {}, today = todayIso()) {
  const weekLimit = addDays(today, 7);
  let overdue = 0;
  let dueToday = 0;
  let dueNext7 = 0;

  for (const entry of Object.values(srsCards || {})) {
    const dueDate = toDateOnly(entry?.due_at);
    if (!dueDate) continue;
    if (dueDate < today) overdue += 1;
    else if (dueDate === today) dueToday += 1;
    else if (dueDate <= weekLimit) dueNext7 += 1;
  }

  return {
    overdue,
    dueToday,
    dueNext7,
    totalWindow: overdue + dueToday + dueNext7,
  };
}

function resolveSrsModuleKey(item) {
  const moduleLabel = String(item?.module || "").trim().toLowerCase();
  const key = String(item?.key || "").trim().toLowerCase();

  if (MODULES.some((entry) => entry.key === moduleLabel)) return moduleLabel;
  if (moduleLabel.includes("flash")) return "flashcards";
  if (moduleLabel.includes("grammar")) return "grammar";
  if (moduleLabel.includes("translation")) return "translation";
  if (moduleLabel.includes("listening")) return "listening";
  if (moduleLabel.includes("vocabulary")) return "my_vocabulary";
  if (moduleLabel.includes("reading")) return "reading";
  if (moduleLabel.includes("writing")) return "writing";
  if (moduleLabel.includes("course")) return "courses";
  if (moduleLabel.includes("pronounce")) return "pronounce";
  if (moduleLabel.includes("immersion")) return "immersion";
  if (moduleLabel.includes("music")) return "music";
  if (moduleLabel.includes("game")) return "games";
  if (moduleLabel.includes("native")) return "natives";
  if (moduleLabel.includes("modern")) return "modern";
  if (moduleLabel.includes("test")) return "test_level";
  if (moduleLabel.includes("starter")) return "grammar";
  if (moduleLabel.includes("speaking")) return "speak_ai";
  if (moduleLabel.includes("ai")) return "speak_ai";

  if (key.startsWith("flashcards")) return "flashcards";
  if (key.startsWith("grammar")) return "grammar";
  if (key.startsWith("translation")) return "translation";
  if (key.startsWith("listening")) return "listening";
  if (key.startsWith("vocab")) return "my_vocabulary";
  if (key.startsWith("reading")) return "reading";
  if (key.startsWith("writing")) return "writing";
  if (key.startsWith("speak_ai") || key.startsWith("speaking")) return "speak_ai";
  if (key.startsWith("pronounce")) return "pronounce";
  if (key.startsWith("courses")) return "courses";
  if (key.startsWith("immersion")) return "immersion";
  if (key.startsWith("natives")) return "natives";
  if (key.startsWith("test_level")) return "test_level";
  if (key.startsWith("music")) return "music";
  if (key.startsWith("games")) return "games";
  if (key.startsWith("modern")) return "modern";

  return "grammar";
}


function SidebarButton({ module, active, onClick, index, label }) {
  const Icon = module.icon;
  const offsetClass = index % 2 === 0 ? "offset-left" : "offset-right";
  const mascotOverride = {
    flashcards: "bea",
    pronounce: "lucy",
    writing: "oscar",
    immersion: "bea",
  };
  const mascot = mascotOverride[module.key] || getPersonByColor(module.color);

  return (
    <button
      type="button"
      className={`duo-unit-btn ${active ? "is-open" : "is-locked"} ${offsetClass}`}
      style={{
        "--unit-color": module.color,
        "--unit-shadow": darken(module.color, 26),
      }}
      onClick={() => onClick(module.key)}
      title={label}
    >
      <span className="duo-unit-icon">
        <Icon size={20} />
      </span>
      <span className="duo-unit-text">{label}</span>
        {AI_PREMIUM_MODULE_KEYS.has(module.key) ? (
          <span className="duo-unit-premium-badge">Premium</span>
        ) : null}
        <span className="duo-unit-mascot" aria-hidden="true">
        <img src={`/img/persons/${mascot}.png`} alt="" loading="lazy" />
      </span>
    </button>
  );
}



function PlaceholderScreen({ module, onBack }) {

  return (

    <section

      className="duo-page-shell"

      style={{

        "--page-theme": module.color,

        "--page-theme-soft": alpha(module.color, 0.18),

        "--page-theme-border": alpha(module.color, 0.35),

      }}

    >

      <div className="duo-page-header">

        <button type="button" className="duo-back-btn" onClick={onBack}>

          {getUiLabel("common.back", "Back")}

        </button>

        <div>

          <div className="duo-page-kicker">Modulo em restauracao</div>

          <h1>{module.label}</h1>

        </div>

      </div>



      <div className="duo-placeholder-card">

        <h2>{module.label}</h2>

        <p>

          A estrutura Duolingo desta aba sera restaurada novamente. A base visual e o

          tema deste modulo ja foram reaplicados.

        </p>

        <div className="duo-placeholder-chip-row">

          <span className="duo-chip">Tema {module.color}</span>

          <span className="duo-chip">Layout web</span>

          <span className="duo-chip">Pronto para migracao</span>

        </div>

      </div>

    </section>

  );

}



export default function InitialPage({ switchToRegister, switchToLogin, authUser, authReady, onLogout, onUpgradePlan }) {
  const [selectedModuleKey, setSelectedModuleKey] = useState("grammar");
  const [activeScreen, setActiveScreen] = useState("home");
  const [navigationHydrated, setNavigationHydrated] = useState(false);
  const [pendingSrsReviewId, setPendingSrsReviewId] = useState(null);
  const [grammarCurrentLevel, setGrammarCurrentLevel] = useState("A1");
  const [grammarCompletedByLevel, setGrammarCompletedByLevel] = useState({
    A1: [],
    A2: [],
    B1: [],
    B2: [],
    C1: [],
    C2: [],
  });
  const [profileStats, setProfileStats] = useState({ xp: 124, streak_days: 7, hearts: 5 });
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [srsState, setSrsState] = useState({
    queue: [],

    completed_today: 0,

    total_reviews: 0,

    last_generated_date: null,

    next_item_id: 1,
  });
  const [flashcardsSrsCounts, setFlashcardsSrsCounts] = useState({
    overdue: 0,
    dueToday: 0,
    dueNext7: 0,
    totalWindow: 0,
  });
  const [adaptiveState, setAdaptiveState] = useState({

    global_score: 0,

    global_difficulty: "normal",

    recommended_module_key: "grammar",

    focus_skill: "grammar",

    skill_scores: [],

    last_evaluated: null,

  });

  const [weeklyPlanState, setWeeklyPlanState] = useState({
    goal: "conversacao",
    week_start: null,
    generated_at: null,
    days: [],
  });
  const [errorNotebookState, setErrorNotebookState] = useState({
    patterns: [],
    total_logged: 0,
    last_updated: null,
    manual_notes: [],
  });
  const [retentionState, setRetentionState] = useState({
    records: [],
    next_item_id: 1,
    total_tests: 0,
    passed_tests: 0,
    last_generated_date: null,
    last_tested_at: null,
  });
  const [pedagogicalReportState, setPedagogicalReportState] = useState({
    history: [],
    last_generated_at: null,
    last_report: null,
  });
  const [showPedagogicalReportModal, setShowPedagogicalReportModal] = useState(false);
  const [selectedPedagogicalReportId, setSelectedPedagogicalReportId] = useState(null);
  const [manualErrorInput, setManualErrorInput] = useState("");
  const [telemetryDays, setTelemetryDays] = useState(7);
  const [telemetrySummary, setTelemetrySummary] = useState({
    total: 0,
    last7: 0,
    by_name: [],
    by_module: [],
    recent: [],
  });
  const telemetryPeriodLabel = telemetryDays === 14
    ? getUiLabel("dashboard.days_14", "14 days")
    : telemetryDays === 30
      ? getUiLabel("dashboard.days_30", "30 days")
      : getUiLabel("dashboard.days_7", "7 days");
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [onboardingState, setOnboardingState] = useState({
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
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState({});
  const [onboardingGoal, setOnboardingGoal] = useState("conversacao");
  const [onboardingProfile, setOnboardingProfile] = useState("balanced");
  const [onboardingMinutes, setOnboardingMinutes] = useState(20);
  const [lockedModuleKey, setLockedModuleKey] = useState(null);
  const [welcomeMode, setWelcomeMode] = useState("first");
  const [uiLabels, setUiLabels] = useState({});


  const selectedModule = useMemo(

    () => MODULES.find((m) => m.key === selectedModuleKey) || MODULES[0],

    [selectedModuleKey]

  );

  const SelectedModuleIcon = selectedModule.icon;
  const isPremiumUser = String(authUser?.subscription?.plan || "free").toLowerCase() === "premium";
  const isAdminUser = String(authUser?.role || "user").toLowerCase() === "admin";
  const isPremiumLockedModule = (moduleKey) => AI_PREMIUM_MODULE_KEYS.has(moduleKey) && !isPremiumUser;
  const selectedModuleRequiresPremium = isPremiumLockedModule(selectedModule.key);
  const displayName = authUser?.name?.trim() || authUser?.email?.split("@")[0] || getUiLabel("welcome.student", "Student");
  const displayInitial = displayName.charAt(0).toUpperCase() || "A";
  const learningLanguageFlag = getLanguageFlag(authUser?.profile?.learning_language || onboardingState?.learning_language || "en-US");
  const dailyGoalValue = Number(authUser?.profile?.daily_goal_minutes || onboardingState?.daily_minutes || 20);
  const getModuleLabel = (module) => {
    const labelKey = MODULE_LABEL_KEYS[module.key];
    if (labelKey && uiLabels[labelKey]) return uiLabels[labelKey];
    return module.label;
  };
  const getWeekdayLabel = (dayIndex) => {
    const key = Number(dayIndex);
    const weekdayKeys = [
      "dashboard.weekday.mon",
      "dashboard.weekday.tue",
      "dashboard.weekday.wed",
      "dashboard.weekday.thu",
      "dashboard.weekday.fri",
      "dashboard.weekday.sat",
      "dashboard.weekday.sun",
    ];
    const weekdayFallbacks = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return getUiLabel(weekdayKeys[key] || "dashboard.weekday.mon", weekdayFallbacks[key] || "Mon");
  };
  const getModuleLabelByKey = (moduleKey) => {
    const normalized = String(moduleKey || "").trim().toLowerCase();
    const module = MODULES.find((item) => item.key === normalized);
    return module ? getModuleLabel(module) : normalized || getUiLabel("dashboard.other", "other");
  };
  const getSrsModuleLabel = (item) => {
    if (String(item?.key || "") === "starter_review") {
      return getUiLabel("dashboard.starter", "Starter");
    }
    return getModuleLabelByKey(resolveSrsModuleKey(item));
  };


  useEffect(() => {
    if (!authUser) return;
    const key = `ep_last_seen_${authUser.id || displayName}`;
    const last = window.localStorage.getItem(key);
    setWelcomeMode(last ? "back" : "first");
    window.localStorage.setItem(key, new Date().toISOString());
  }, [authUser, displayName]);

  useEffect(() => {
    const locale = authUser?.profile?.source_language || authUser?.profile?.ui_language || onboardingState?.source_language || "pt-BR";
    fetch(`/api/i18n/labels?locale=${encodeURIComponent(locale)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.labels) setUiLabels(data.labels);
      })
      .catch(() => {
        // no-op
      });
  }, [authUser, onboardingState?.source_language]);




  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/progress", { cache: "no-store" });
        if (!res.ok) return;
        const parsed = await res.json();
        const normalized = ensureUiNavigation(
          ensurePedagogicalReports(
            ensurePedagogicalOnboarding(
              ensureLongTermRetention(ensureErrorNotebook(ensureSrs(parsed)))
            )
          )
        );
        if (!mounted) return;


        setProfileStats({
          xp: Number(normalized.profile?.xp || 0),
          streak_days: Number(normalized.profile?.streak_days || 0),
          hearts: Number(normalized.profile?.hearts || 5),
        });

        const grammarBlock = normalized.modules?.grammar || {};
        const completedByLevelRaw = grammarBlock.completed_units_by_level || {};
        const nextGrammarByLevel = {
          A1: Array.isArray(completedByLevelRaw.A1)
            ? completedByLevelRaw.A1
            : Array.isArray(grammarBlock.completed_units)
              ? grammarBlock.completed_units
              : [],
          A2: Array.isArray(completedByLevelRaw.A2) ? completedByLevelRaw.A2 : [],
          B1: Array.isArray(completedByLevelRaw.B1) ? completedByLevelRaw.B1 : [],
          B2: Array.isArray(completedByLevelRaw.B2) ? completedByLevelRaw.B2 : [],
          C1: Array.isArray(completedByLevelRaw.C1) ? completedByLevelRaw.C1 : [],
          C2: Array.isArray(completedByLevelRaw.C2) ? completedByLevelRaw.C2 : [],
        };
        setGrammarCompletedByLevel(nextGrammarByLevel);
        setGrammarCurrentLevel(
          GRAMMAR_LEVEL_ORDER.includes(grammarBlock.current_level) ? grammarBlock.current_level : "A1"
        );

        let nextSrs = { ...normalized.modules.srs_global };
        const previousAdaptive = normalized.modules.adaptive_diagnostics || {};
        const nextAdaptive = computeAdaptiveDiagnostics(normalized);
        normalized.modules.adaptive_diagnostics = nextAdaptive;
        const previousNotebook = normalized.modules.error_notebook || {};
        const nextPatterns = buildRecurringErrorPatterns(
          normalized,
          previousNotebook.patterns || []
        );
        const nextNotebook = {
          patterns: nextPatterns,
          total_logged: nextPatterns.reduce(
            (sum, pattern) => sum + Number(pattern.occurrences || 0),
            0
          ),
          last_updated: new Date().toISOString(),
          manual_notes: Array.isArray(previousNotebook.manual_notes)
            ? previousNotebook.manual_notes
            : [],
        };
        normalized.modules.error_notebook = nextNotebook;
        const previousRetention = normalized.modules.long_term_retention || {};
        let nextRetention = {
          ...previousRetention,
          records: normalizeRetentionDue(previousRetention.records || [], todayIso()),
        };
        const previousWeeklyPlan = normalized.modules.weekly_study_plan || null;
        const currentOnboarding = normalized.modules.pedagogical_onboarding || null;
        let nextWeeklyPlan = previousWeeklyPlan;

        const currentWeekStart = startOfWeekIso();

        if (

          !previousWeeklyPlan ||

          !previousWeeklyPlan.week_start ||

          previousWeeklyPlan.week_start !== currentWeekStart ||

          !Array.isArray(previousWeeklyPlan.days)

        ) {

          nextWeeklyPlan = buildWeeklyPlan(previousWeeklyPlan?.goal || "conversacao", normalized);

          normalized.modules.weekly_study_plan = nextWeeklyPlan;

        }

        const today = todayIso();

        let shouldSave = false;

        if (nextSrs.last_generated_date !== today) {

          const candidates = buildSrsCandidates(normalized);

          const firstId = Number(nextSrs.next_item_id || 1);

          nextSrs = {

            ...nextSrs,

            completed_today: 0,

            last_generated_date: today,

            next_item_id: firstId + candidates.length,

            queue: candidates.map((candidate, idx) => ({

              id: firstId + idx,

              key: candidate.key,

              module: candidate.module,

              title: candidate.title,

              prompt: candidate.prompt,

              due_date: today,

              interval_days: 1,

              status: "due",

            })),

          };

          normalized.modules.srs_global = nextSrs;

          shouldSave = true;

        }



        if (JSON.stringify(previousAdaptive) !== JSON.stringify(nextAdaptive)) {
          shouldSave = true;
        }
        if (JSON.stringify(previousNotebook) !== JSON.stringify(nextNotebook)) {
          shouldSave = true;
        }
        const hasActiveRetention = (nextRetention.records || []).some((item) => item.status !== "done");
        if (!hasActiveRetention || nextRetention.last_generated_date !== todayIso()) {
          const seeds = buildRetentionSeeds(normalized, nextRetention.records || [], 3);
          if (seeds.length > 0) {
            const startId = Number(nextRetention.next_item_id || 1);
            const created = seeds.map((seed, index) => ({
              id: startId + index,
              key: seed.key,
              title: seed.title,
              module: seed.module,
              prompt: seed.prompt,
              scheduled_days: 7,
              scheduled_for: todayIso(),
              status: "due",
              attempts: 0,
              source_date: todayIso(),
              stage: "7d",
              last_score: null,
            }));
            nextRetention = {
              ...nextRetention,
              records: [...(nextRetention.records || []), ...created],
              next_item_id: startId + created.length,
              last_generated_date: todayIso(),
            };
            normalized.modules.long_term_retention = nextRetention;
            shouldSave = true;
          }
        }
        if (JSON.stringify(previousRetention) !== JSON.stringify(nextRetention)) {
          shouldSave = true;
        }
        if (JSON.stringify(previousWeeklyPlan) !== JSON.stringify(nextWeeklyPlan)) {
          shouldSave = true;
        }


        if (shouldSave) {

          await fetch("/api/progress", {

            method: "PUT",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify(normalized),

          });

        }



        setSrsState(nextSrs);
        setFlashcardsSrsCounts(
          computeFlashcardsSrsCounts(normalized.modules?.flashcards?.srs_cards || {}, todayIso())
        );
        setAdaptiveState(nextAdaptive);
        setWeeklyPlanState(nextWeeklyPlan || buildWeeklyPlan("conversacao", normalized));
        setErrorNotebookState(nextNotebook);
        setRetentionState(nextRetention);
        setPedagogicalReportState(normalized.modules.pedagogical_reports || {
          history: [],
          last_generated_at: null,
          last_report: null,
        });
        setOnboardingState(currentOnboarding);
        setOnboardingGoal(currentOnboarding?.goal || "conversacao");
        setOnboardingProfile(currentOnboarding?.learner_profile || "balanced");
        setOnboardingMinutes(Number(currentOnboarding?.daily_minutes || 20));
        setOnboardingAnswers(currentOnboarding?.quiz_answers || {});
        setShowOnboarding(!currentOnboarding?.completed);
        setOnboardingStep(0);
        const savedNavigation = normalized.modules.ui_navigation || {};
        if (savedNavigation.selected_module_key) {
          setSelectedModuleKey(savedNavigation.selected_module_key);
        } else if (currentOnboarding?.recommended_module_key) {
          setSelectedModuleKey(currentOnboarding.recommended_module_key);
        }
        if (savedNavigation.active_screen) {
          setActiveScreen(savedNavigation.active_screen);
        }
        if (
          savedNavigation.grammar_current_level &&
          GRAMMAR_LEVEL_ORDER.includes(savedNavigation.grammar_current_level)
        ) {
          setGrammarCurrentLevel(savedNavigation.grammar_current_level);
        }
        setNavigationHydrated(true);
      } catch {
        if (!mounted) return;
        setNavigationHydrated(true);
      }
    })();


    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!navigationHydrated) return;

    const saveNavigation = async () => {
      try {
        const res = await fetch("/api/progress", { cache: "no-store" });
        if (!res.ok) return;
        const progress = ensureUiNavigation(await res.json());
        progress.modules.ui_navigation = {
          ...(progress.modules.ui_navigation || {}),
          selected_module_key: selectedModuleKey,
          active_screen: activeScreen,
          grammar_current_level: grammarCurrentLevel,
        };
        await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(progress),
        });
      } catch {
        // no-op
      }
    };

    void saveNavigation();
  }, [activeScreen, grammarCurrentLevel, navigationHydrated, selectedModuleKey]);

  const dueItems = useMemo(
    () => (srsState.queue || []).filter((item) => item.status === "due"),
    [srsState.queue]
  );
  const srsWeekStats = useMemo(() => {
    const queue = Array.isArray(srsState.queue) ? srsState.queue : [];
    const today = todayIso();
    const weekLimit = addDays(today, 7);
    const withDate = queue.filter((item) => typeof item.due_date === "string" && item.due_date.length >= 10);
    const overdue = withDate.filter((item) => item.due_date < today && item.status !== "done").length;
    const dueToday = withDate.filter((item) => item.due_date === today && item.status !== "done").length;
    const dueNext7 = withDate.filter(
      (item) => item.due_date > today && item.due_date <= weekLimit && item.status !== "done"
    ).length;
    const totalWindow =
      overdue +
      dueToday +
      dueNext7 +
      Number(flashcardsSrsCounts.overdue || 0) +
      Number(flashcardsSrsCounts.dueToday || 0) +
      Number(flashcardsSrsCounts.dueNext7 || 0);
    const dueTodayTotal = dueToday + Number(flashcardsSrsCounts.dueToday || 0) + Number(flashcardsSrsCounts.overdue || 0);
    const dueNext7Total = dueNext7 + Number(flashcardsSrsCounts.dueNext7 || 0);
    return {
      overdue: overdue + Number(flashcardsSrsCounts.overdue || 0),
      dueToday: dueTodayTotal,
      dueNext7: dueNext7Total,
      totalWindow,
      weekProgress: totalWindow > 0 ? Math.round(((dueTodayTotal + dueNext7Total) / totalWindow) * 100) : 0,
    };
  }, [flashcardsSrsCounts.dueNext7, flashcardsSrsCounts.dueToday, flashcardsSrsCounts.overdue, srsState.queue]);
  const dueItemsTotal = Number(dueItems.length || 0) + Number(flashcardsSrsCounts.overdue || 0) + Number(flashcardsSrsCounts.dueToday || 0);


  const completeReview = async (itemId) => {
    const target = (srsState.queue || []).find((item) => item.id === itemId);

    if (!target) return;



    const nextInterval = target.interval_days >= 7 ? 14 : target.interval_days >= 3 ? 7 : 3;

    const today = todayIso();

    const nextQueue = (srsState.queue || []).map((item) =>

      item.id === itemId

        ? {

            ...item,

            status: "scheduled",

            interval_days: nextInterval,

            due_date: addDays(today, nextInterval),

          }

        : item

    );



    const nextSrs = {

      ...srsState,

      queue: nextQueue,

      completed_today: Number(srsState.completed_today || 0) + 1,

      total_reviews: Number(srsState.total_reviews || 0) + 1,

    };

    setSrsState(nextSrs);



    try {

      const res = await fetch("/api/progress", { cache: "no-store" });

      if (!res.ok) return;

      const progress = ensureSrs(await res.json());

      progress.modules.srs_global = {

        ...progress.modules.srs_global,

        ...nextSrs,

      };

      await fetch("/api/progress", {

        method: "PUT",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(progress),

      });

    } catch {

      // no-op

    }

  };



  const skillLabel = (skillKey) => {

    const map = {

      grammar: getUiLabel("module.grammar", "Grammar"),

      vocabulary: getUiLabel("dashboard.skill_vocabulary", "Vocabulary"),

      reading: getUiLabel("module.reading", "Reading"),

      listening: getUiLabel("module.listening", "Listening"),

      speaking: getUiLabel("dashboard.skill_speaking", "Speaking"),

      writing: getUiLabel("module.writing", "Writing"),

    };

    return map[skillKey] || skillKey;

  };



  const difficultyLabel = (level) => {

    if (level === "basic") return getUiLabel("dashboard.difficulty_basic", "Basic");

    if (level === "advanced") return getUiLabel("dashboard.difficulty_advanced", "Advanced");
    return getUiLabel("dashboard.difficulty_normal", "Normal");

  };



  const goalLabel = (goal) => {
    const map = {

      viagem: getUiLabel("onboarding.goal.travel", "Travel"),

      trabalho: getUiLabel("onboarding.goal.work", "Work"),

      prova: getUiLabel("onboarding.goal.exam", "Exam"),

      conversacao: getUiLabel("onboarding.goal.conversation", "Conversation"),

    };

    return map[goal] || getUiLabel("onboarding.goal.conversation", "Conversation");
  };

  const formatUiDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const locale = window.__uiLocale || "pt-BR";
    return date.toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getGrammarCompletedCount = (levelId) =>
    Math.min(
      Number(GRAMMAR_LEVEL_TOTALS[levelId] || 0),
      Number((grammarCompletedByLevel[levelId] || []).length || 0)
    );

  const isGrammarLevelUnlocked = (levelId) => {
    const levelIndex = GRAMMAR_LEVEL_ORDER.indexOf(levelId);
    if (levelIndex <= 0) return true;
    const previous = GRAMMAR_LEVEL_ORDER[levelIndex - 1];
    return getGrammarCompletedCount(previous) >= Number(GRAMMAR_LEVEL_TOTALS[previous] || 0);
  };

  const persistGrammarLevel = async (levelId) => {
    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      if (!res.ok) return;
      const progress = await res.json();
      if (!progress.modules) progress.modules = {};
      if (!progress.modules.grammar) progress.modules.grammar = {};
      progress.modules.grammar.current_level = levelId;
      await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
    } catch {
      // no-op
    }
  };

  const selectGrammarLevel = async (levelId) => {
    if (!GRAMMAR_LEVEL_ORDER.includes(levelId)) return;
    if (!isGrammarLevelUnlocked(levelId)) return;
    setGrammarCurrentLevel(levelId);
    await persistGrammarLevel(levelId);
  };

  const openGrammarLevelModule = async (levelId) => {
    trackEvent("grammar_level_open", { levelId }, { moduleKey: "grammar", screen: "module" });
    if (!GRAMMAR_LEVEL_ORDER.includes(levelId)) return;
    if (!isGrammarLevelUnlocked(levelId)) return;
    setPendingSrsReviewId(null);
    setGrammarCurrentLevel(levelId);
    setSelectedModuleKey("grammar");
    await persistGrammarLevel(levelId);
    setActiveScreen("module");
  };


  const saveWeeklyPlan = async (nextPlan) => {

    setWeeklyPlanState(nextPlan);

    try {

      const res = await fetch("/api/progress", { cache: "no-store" });

      if (!res.ok) return;

      const progress = await res.json();

      if (!progress.modules) progress.modules = {};

      progress.modules.weekly_study_plan = nextPlan;

      await fetch("/api/progress", {

        method: "PUT",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(progress),

      });

    } catch {

      // no-op

    }

  };



  const regenerateWeeklyPlan = async (goal = weeklyPlanState.goal || "conversacao") => {

    try {

      const res = await fetch("/api/progress", { cache: "no-store" });

      if (!res.ok) return;

      const progress = await res.json();

      const next = buildWeeklyPlan(goal, progress);

      await saveWeeklyPlan(next);

    } catch {

      // no-op

    }

  };



  const updateWeeklyGoal = async (goal) => {

    if (!goal) return;

    await regenerateWeeklyPlan(goal);

  };



  const toggleWeeklyDayDone = async (dayIndex) => {
    const days = Array.isArray(weeklyPlanState.days) ? weeklyPlanState.days : [];

    const nextDays = days.map((day) =>

      day.day_index === dayIndex

        ? { ...day, status: day.status === "done" ? "pending" : "done" }

        : day

    );

    const nextPlan = {

      ...weeklyPlanState,

      days: nextDays,

      generated_at: weeklyPlanState.generated_at || new Date().toISOString(),

    };

    await saveWeeklyPlan(nextPlan);
  };

  const openPlansForModule = (moduleKey, reviewId = null) => {
    trackEvent("premium_gate", { moduleKey, reviewId }, { moduleKey, screen: "plans" });
    setPendingSrsReviewId(reviewId);
    setLockedModuleKey(moduleKey);
    setSelectedModuleKey(moduleKey);
    setActiveScreen("plans");
  };
  const openReviewModule = (item) => {
    const moduleKey = resolveSrsModuleKey(item);
    const reviewId = Number(item?.id) || null;
    if (isPremiumLockedModule(moduleKey)) {
      openPlansForModule(moduleKey, reviewId);
      return;
    }
    setPendingSrsReviewId(reviewId);
    setLockedModuleKey(null);
    setSelectedModuleKey(moduleKey);
    setActiveScreen("module");
  };
  const selectModule = (moduleKey) => {
    setPendingSrsReviewId(null);
    setSelectedModuleKey(moduleKey);
  };
  const openModuleByKey = (moduleKey) => {
    trackEvent("module_open", { moduleKey }, { moduleKey, screen: "module" });
    if (isPremiumLockedModule(moduleKey)) {
      openPlansForModule(moduleKey);
      return;
    }
    setPendingSrsReviewId(null);
    setLockedModuleKey(null);
    setSelectedModuleKey(moduleKey);
    setActiveScreen("module");
  };
  const openSelectedModule = () => {
    setPendingSrsReviewId(null);
    if (isPremiumLockedModule(selectedModule.key)) {
      openPlansForModule(selectedModule.key);
      return;
    }
    setLockedModuleKey(null);
    if (selectedModule.key === "grammar") {
      void persistGrammarLevel(grammarCurrentLevel);
    }
    setActiveScreen("module");
  };

  const handleModuleBack = async () => {
    const reviewId = pendingSrsReviewId;
    setPendingSrsReviewId(null);
    setActiveScreen("home");
    if (reviewId != null) {
      await completeReview(reviewId);
    }
  };

  const saveErrorNotebook = async (nextNotebook) => {
    setErrorNotebookState(nextNotebook);
    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      if (!res.ok) return;
      const progress = ensureErrorNotebook(await res.json());
      progress.modules.error_notebook = nextNotebook;
      await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
    } catch {
      // no-op
    }
  };

  const togglePatternReviewed = async (patternId) => {
    const nextPatterns = (errorNotebookState.patterns || []).map((item) =>
      item.id === patternId
        ? {
            ...item,
            status: item.status === "reviewed" ? "active" : "reviewed",
            review_count: Number(item.review_count || 0) + 1,
          }
        : item
    );
    const nextNotebook = {
      ...errorNotebookState,
      patterns: nextPatterns,
      total_logged: nextPatterns.reduce((sum, pattern) => sum + Number(pattern.occurrences || 0), 0),
      last_updated: new Date().toISOString(),
    };
    await saveErrorNotebook(nextNotebook);
  };

  const addManualErrorPattern = async () => {
    const text = manualErrorInput.trim();
    if (!text) return;
    const pattern = {
      id: `err_manual_${Date.now()}`,
      key: `manual_${Date.now()}`,
      title: text,
      rule: getUiLabel("dashboard.manual_error_rule", "Error added manually by the learner."),
      wrong_example: "-",
      right_example: "-",
      occurrences: 1,
      source: "manual",
      status: "active",
      review_count: 0,
      last_seen: new Date().toISOString(),
    };
    const nextPatterns = [pattern, ...(errorNotebookState.patterns || [])].slice(0, 12);
    const nextNotebook = {
      ...errorNotebookState,
      patterns: nextPatterns,
      total_logged: nextPatterns.reduce((sum, item) => sum + Number(item.occurrences || 0), 0),
      last_updated: new Date().toISOString(),
      manual_notes: [
        { id: `note_${Date.now()}`, text, created_at: new Date().toISOString() },
        ...(errorNotebookState.manual_notes || []),
      ].slice(0, 20),
    };
    setManualErrorInput("");
    await saveErrorNotebook(nextNotebook);
  };

  const answerOnboardingQuestion = (questionId, optionIndex) => {
    setOnboardingAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const onboardingScore = useMemo(() => {
    const hits = ONBOARDING_QUESTIONS.reduce((sum, question) => {
      return sum + (Number(onboardingAnswers[question.id]) === Number(question.answer) ? 1 : 0);
    }, 0);
    return Math.round((hits / ONBOARDING_QUESTIONS.length) * 100);
  }, [onboardingAnswers]);

  const saveOnboarding = async () => {
    const track = buildPersonalizedTrack(onboardingGoal, onboardingProfile);
    const level = estimatedLevelFromScore(onboardingScore);
    const payload = {
      completed: true,
      completed_at: new Date().toISOString(),
      goal: onboardingGoal,
      learner_profile: onboardingProfile,
      daily_minutes: Number(onboardingMinutes || 20),
      quiz_answers: onboardingAnswers,
      quiz_score: onboardingScore,
      estimated_level: level,
      personalized_track: track,
      recommended_module_key: track[0] || "grammar",
    };
    setOnboardingState(payload);
    setSelectedModuleKey(payload.recommended_module_key);
    setShowOnboarding(false);
    setOnboardingStep(0);

    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      if (!res.ok) return;
      const progress = ensurePedagogicalOnboarding(await res.json());
      progress.modules.pedagogical_onboarding = payload;
      progress.modules.weekly_study_plan = buildWeeklyPlan(onboardingGoal, progress);
      if (!progress.modules.profile) progress.modules.profile = {};
      progress.modules.profile.daily_goal_minutes = Number(onboardingMinutes || 20);
      await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
      setWeeklyPlanState(progress.modules.weekly_study_plan);
    } catch {
      // no-op
    }
  };

  const saveRetentionState = async (nextRetention) => {
    setRetentionState(nextRetention);
    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      if (!res.ok) return;
      const progress = ensureLongTermRetention(await res.json());
      progress.modules.long_term_retention = nextRetention;
      await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
    } catch {
      // no-op
    }
  };

  const savePedagogicalReportState = async (nextReports) => {
    setPedagogicalReportState(nextReports);
    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      if (!res.ok) return;
      const progress = ensurePedagogicalReports(await res.json());
      progress.modules.pedagogical_reports = nextReports;
      await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
    } catch {
      // no-op
    }
  };

  const generatePedagogicalReport = async () => {
    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      if (!res.ok) return;
      const progress = ensurePedagogicalReports(await res.json());
      const report = buildAdvancedPedagogicalReport(progress);
      const history = [...(progress.modules.pedagogical_reports.history || []), report].slice(-20);
      const next = {
        history,
        last_generated_at: report.generated_at,
        last_report: report,
      };
      await savePedagogicalReportState(next);
      setSelectedPedagogicalReportId(report.id);
      setShowPedagogicalReportModal(true);
    } catch {
      // no-op
    }
  };

  const exportPedagogicalReport = (reportOverride = null) => {
    const report = reportOverride || pedagogicalReportState.last_report;
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pedagogical-report-${todayIso()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };
  const loadTelemetrySummary = async () => {
    setTelemetryLoading(true);
    try {
      const res = await fetch(`/api/telemetry/summary?days=${telemetryDays}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await res.json();
      setTelemetrySummary({
        total: Number(data?.total || 0),
        last7: Number(data?.last7 || 0),
        by_name: Array.isArray(data?.by_name) ? data.by_name : [],
        by_module: Array.isArray(data?.by_module) ? data.by_module : [],
        recent: Array.isArray(data?.recent) ? data.recent : [],
      });
    } catch {
      // no-op
    } finally {
      setTelemetryLoading(false);
    }
  };

  const exportTelemetryCsv = async () => {
    try {
      const res = await fetch(`/api/telemetry/export?days=${telemetryDays}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `telemetry-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      // no-op
    }
  };


  useEffect(() => {
    void loadTelemetrySummary();
  }, [authUser, telemetryDays]);


  const runRetentionTest = async (recordId, passed = true) => {
    const now = todayIso();
    const current = (retentionState.records || []).find((item) => item.id === recordId);
    if (!current || current.status === "done") return;

    let nextId = Number(retentionState.next_item_id || 1);
    const followUps = [];
    const updated = (retentionState.records || []).map((item) => {
      if (item.id !== recordId) return item;

      const attempts = Number(item.attempts || 0) + 1;
      if (passed && Number(item.scheduled_days || 7) === 7) {
        followUps.push({
          id: nextId++,
          key: `${item.key}_30d`,
          title: item.title,
          module: item.module,
          prompt: item.prompt,
          scheduled_days: 30,
          scheduled_for: addDays(now, 30),
          status: "scheduled",
          attempts: 0,
          source_date: now,
          stage: "30d",
          last_score: null,
        });
      }

      if (passed) {
        return {
          ...item,
          status: "done",
          attempts,
          completed_at: now,
          last_score: Math.max(70, Number(item.last_score || 0), 82),
        };
      }

      const retryGap = Number(item.scheduled_days || 7) === 7 ? 2 : 4;
      return {
        ...item,
        status: "scheduled",
        attempts,
        scheduled_for: addDays(now, retryGap),
        last_score: 45,
      };
    });

    const normalizedRecords = normalizeRetentionDue([...updated, ...followUps], now);
    const nextRetention = {
      ...retentionState,
      records: normalizedRecords,
      next_item_id: nextId,
      total_tests: Number(retentionState.total_tests || 0) + 1,
      passed_tests: Number(retentionState.passed_tests || 0) + (passed ? 1 : 0),
      last_tested_at: new Date().toISOString(),
    };
    await saveRetentionState(nextRetention);
  };

  const retentionDueItems = useMemo(
    () => (retentionState.records || []).filter((item) => item.status === "due"),
    [retentionState.records]
  );
  const retentionRate = useMemo(() => {
    const total = Number(retentionState.total_tests || 0);
    if (total <= 0) return 0;
    return Math.round((Number(retentionState.passed_tests || 0) / total) * 100);
  }, [retentionState.passed_tests, retentionState.total_tests]);
  const retentionProgressMax = Math.max(
    1,
    Number(retentionState.total_tests || 0) + Number(retentionDueItems.length || 0)
  );
  const lastPedagogicalReport = pedagogicalReportState.last_report || null;
  const pedagogicalReportHistory = useMemo(
    () => [...(pedagogicalReportState.history || [])].slice().reverse(),
    [pedagogicalReportState.history]
  );
  const selectedPedagogicalReport = useMemo(() => {
    if (!pedagogicalReportHistory.length) return lastPedagogicalReport;
    if (!selectedPedagogicalReportId) return lastPedagogicalReport || pedagogicalReportHistory[0];
    return (
      pedagogicalReportHistory.find((item) => item.id === selectedPedagogicalReportId) ||
      lastPedagogicalReport ||
      pedagogicalReportHistory[0]
    );
  }, [lastPedagogicalReport, pedagogicalReportHistory, selectedPedagogicalReportId]);
  const telemetryMax = Math.max(1, ...(telemetrySummary.by_module || []).map((item) => Number(item.count || 0)));


  if (activeScreen === "plans" || (activeScreen === "module" && isPremiumLockedModule(selectedModule.key))) {
    return (
      <PlansPage
        module={MODULES.find((item) => item.key === (lockedModuleKey || selectedModule.key)) || selectedModule}
        isPremiumUser={isPremiumUser}
        onBack={() => {
          setPendingSrsReviewId(null);
          setLockedModuleKey(null);
          setActiveScreen("home");
        }}
        onActivatePremium={async () => {
          if (!onUpgradePlan) return;
          await onUpgradePlan();
          setLockedModuleKey(null);
          setActiveScreen("module");
        }}
      />
    );
  }
  if (activeScreen === "module" && selectedModule.key === "grammar") {

    return (

      <Grammar

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "flashcards") {

    return (

      <Flashcards

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "my_vocabulary") {

    return (

      <MyVocabulary

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "dictionary") {

    return (

      <Dictionary

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "courses") {

    return (

      <Courses

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "speak_ai") {

    return (

      <SpeakWithAI

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "reading") {

    return (

      <ReadingComprehension

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "pronounce") {

    return (

      <Pronounce

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "writing") {

    return (

      <Writing

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "games") {

    return (

      <Games

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "modern") {

    return (

      <Modernmethodologies

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "listening") {

    return (

      <Listening

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "immersion") {

    return (

      <Immersion
        setCurrentView={handleModuleBack}
        navigateModule={openModuleByKey}
        color={selectedModule.color}
      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "natives") {

    return (

      <SpeakWithnatives

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "translation") {

    return (

      <TranslationPractice

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "test_level") {

    return (

      <TestYourEnglishLevel

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "community") {

    return (

      <Community

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "profile") {

    return (

      <ProfileModule

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "module" && selectedModule.key === "music") {

    return (

      <MusicModule

        setCurrentView={handleModuleBack}

        color={selectedModule.color}

      />

    );

  }



  if (activeScreen === "admin") {
    if (!isAdminUser) {
      setActiveScreen("home");
      return null;
    }
    return (
      <ContentAdmin
        onBack={() => setActiveScreen("home")}
        color="#4b7bec"
      />
    );
  }

  if (activeScreen === "module") {

    return (

      <PlaceholderScreen

        module={selectedModule}

        onBack={() => setActiveScreen("home")}

      />

    );

  }



  return (

    <div className="duo-home-layout">

      <aside className="duo-left-sidebar">

        <div className="duo-logo-block">
          <a aria-current="" className="duo-brand-link" href="">
            <img
              className="sOuBs"
              src="https://d35aaqx5ub95lt.cloudfront.net/vendor/70a4be81077a8037698067f583816ff9.svg"
              alt="Duolingo"
            />
            <img
              className="_1C091"
              src="https://d35aaqx5ub95lt.cloudfront.net/vendor/0cecd302cf0bcd0f73d51768feff75fe.svg"
              alt="Duolingo logo"
            />
          </a>
        </div>


        <div className="duo-sidebar-list">

          {MODULES.map((module, index) => (

            <SidebarButton

              key={module.key}

              module={module}

              label={getModuleLabel(module)}

              index={index}

              active={selectedModule.key === module.key}

              onClick={selectModule}

            />

          ))}

        </div>

      </aside>



      <main className="duo-center-panel">

        <div className="duo-welcome-bar">
          <div className="duo-welcome-text">
            <span className="duo-welcome-kicker">
              {welcomeMode === "back" ? getUiLabel("app.welcome.back", "Welcome back,") : getUiLabel("app.welcome.first", "Welcome for the first time,")}
            </span>
            <strong className="duo-welcome-name">{displayName}</strong>
          </div>
          <div className="duo-welcome-meta">
            {learningLanguageFlag?.src ? (
              <img
                className="duo-welcome-flag"
                src={learningLanguageFlag.src}
                alt={learningLanguageFlag.label}
                title={learningLanguageFlag.label}
              />
            ) : (
              <span className="duo-welcome-flag duo-welcome-flag-fallback">🌐</span>
            )}
            <span className="duo-welcome-goal">{getUiLabel("welcome.daily_goal", "Daily goal")}:  {dailyGoalValue} min</span>
          </div>
        </div>

        <div className="duo-top-actions">
          <button type="button" className="duo-logout-btn" onClick={onLogout}>
            {getUiLabel("common.logout", "Logout")}
          </button>
        </div>

        <div className="duo-top-stats">

          <div className="duo-stat-pill duo-stat-blue">

            <Gem size={16} />

            <span>{profileStats.xp} XP</span>

          </div>

          <div className="duo-stat-pill duo-stat-orange">

            <Flame size={16} />

            <span>{profileStats.streak_days} {getUiLabel("dashboard.days", "days")}</span>

          </div>

          <div className="duo-stat-pill duo-stat-heart">

            <Heart size={16} />

            <span>{profileStats.hearts}</span>

          </div>

        </div>



        {selectedModule.key === "grammar" ? (
          <section className="duo-grammar-level-list">
            {GRAMMAR_LEVEL_ORDER.map((levelId, levelIndex) => {
              const unlocked = isGrammarLevelUnlocked(levelId);
              const isActive = grammarCurrentLevel === levelId;
              const done = getGrammarCompletedCount(levelId) >= Number(GRAMMAR_LEVEL_TOTALS[levelId] || 0);
              const progressPct = Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    (getGrammarCompletedCount(levelId) / Math.max(1, Number(GRAMMAR_LEVEL_TOTALS[levelId] || 1))) *
                      100
                  )
                )
              );
              return (
                <article
                  key={levelId}
                  className={`duo-grammar-section-card duo-grammar-level-card ${isActive ? "is-active" : ""} ${!unlocked ? "is-locked" : ""}`}
                >
                  <div className="duo-grammar-section-top">
                    <span className="duo-grammar-section-kicker">{levelId} - {getUiLabel("dashboard.view_details", "VIEW DETAILS")}</span>
                    <button
                      type="button"
                      className="duo-grammar-review-btn"
                      disabled={!unlocked}
                      onClick={() => {
                        void openGrammarLevelModule(levelId);
                      }}
                    >
                      {getUiLabel("common.review", "Review")}
                    </button>
                  </div>
                  <h1>{getUiLabel("dashboard.section", "Section")} {levelIndex + 1}</h1>
                  <div className="duo-grammar-complete-line">
                    <CheckCircle2 size={18} />
                    <span>{done ? getUiLabel("dashboard.completed", "COMPLETED") : unlocked ? getUiLabel("dashboard.in_progress", "IN PROGRESS") : getUiLabel("dashboard.locked", "LOCKED")}</span>
                  </div>
                  <div className="duo-grammar-progress-wrap">
                    <div className="duo-grammar-progress-track">
                      <div className="duo-grammar-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span>{progressPct}%</span>
                  </div>
                  <button
                    type="button"
                    className="duo-open-module-btn duo-grammar-continue-btn"
                    disabled={!unlocked}
                    onClick={() => {
                      void openGrammarLevelModule(levelId);
                    }}
                  >
                    {done ? getUiLabel("dashboard.review_level", "REVIEW LEVEL") : unlocked ? getUiLabel("common.continue", "Continue") : getUiLabel("dashboard.skip_section", "Skip to section {section}").replace("{section}", String(levelIndex + 1))}
                  </button>
                </article>
              );
            })}
          </section>
        ) : (
          <section
            className="duo-current-card"
            style={{
              "--unit-color": selectedModule.color,
              "--unit-shadow": darken(selectedModule.color, 26),
              "--unit-glow": alpha(selectedModule.color, 0.16),
            }}
          >
            <div className="duo-current-card-kicker">{getUiLabel("dashboard.current_menu", "CURRENT MENU")}</div>
            <h1>{getModuleLabel(selectedModule)}</h1>
            <p>
              {selectedModuleRequiresPremium
                ? getUiLabel("dashboard.premium_info", "This module uses AI and is available only on Premium. If you try to enter, you will be redirected to the plans page.")
                : getUiLabel("dashboard.module_intro", "Rebuilding the Duolingo-style interface and module flow in stages.")}
            </p>
            <button
              type="button"
              className={`duo-open-module-btn ${selectedModuleRequiresPremium ? "is-premium" : ""}`}
              onClick={openSelectedModule}
            >
              <SelectedModuleIcon size={18} />
              {selectedModuleRequiresPremium ? getUiLabel("dashboard.view_plans", "View Premium plans") : getUiLabel("dashboard.open_module", "Open module")}
              <ChevronRight size={18} />
            </button>
          </section>
        )}

      </main>


      <aside className="duo-right-rail">
        <div className="duo-info-card">
          <div className="duo-info-title">{getUiLabel("dashboard.unlock_leagues", "Unlock the leagues!")}</div>
          <div className="duo-info-row">
            <Shield size={28} />
            <p>{getUiLabel("dashboard.complete_lessons", "Complete 10 more lessons to start competing.")}</p>
          </div>
        </div>

        <div className="duo-info-card duo-onboarding-card">
          <div className="duo-info-head">
            <span>{getUiLabel("menu.onboarding", "Pedagogical onboarding")}</span>
            <button type="button" onClick={() => setShowOnboarding(true)}>{getUiLabel("menu.start", "START")}</button>
          </div>
          <div className="duo-onboarding-summary">
            <span>
              <ClipboardCheck size={14} />
              {getUiLabel("dashboard.level", "Level")}: {onboardingState.estimated_level || "A1"}
            </span>
            <span>
              <CalendarDays size={14} />
              {getUiLabel("dashboard.goal", "Goal")}: {onboardingState.goal || "conversacao"}
            </span>
          </div>
          <p className="duo-onboarding-copy">
            {onboardingState.completed
              ? getUiLabel("dashboard.track_ready", "Personalized track ready. Redo it when your goal changes.")
              : getUiLabel("dashboard.track_setup", "Set your goal and profile to build your personalized track.")}
          </p>
          <div className="duo-onboarding-track">
            {(onboardingState.personalized_track || []).slice(0, 4).map((moduleKey) => (
              <span key={moduleKey}>{getUiLabel(MODULE_LABEL_KEYS[moduleKey] || "", moduleKey)}</span>
            ))}
          </div>
        </div>

        <div className="duo-info-card duo-report-card">
          <div className="duo-info-head">
            <span>{getUiLabel("menu.reports", "Pedagogical reports")}</span>
            <button type="button">ADV</button>
          </div>

          <div className="duo-report-summary">
            <span>
              <BarChart3 size={14} />
              {getUiLabel("dashboard.score", "Score")}: {lastPedagogicalReport?.global_score ?? adaptiveState.global_score ?? 0}
            </span>
            <span>
              <Trophy size={14} />
              {getUiLabel("dashboard.level", "Level")}: {lastPedagogicalReport?.level_estimate ?? onboardingState.estimated_level ?? "A1"}
            </span>
          </div>

          <div className="duo-report-grid">
            <article>
              <strong>{getUiLabel("dashboard.strong", "Strong")}</strong>
              <p>{skillLabel(lastPedagogicalReport?.strongest_skill || adaptiveState.focus_skill || "grammar")}</p>
            </article>
            <article>
              <strong>{getUiLabel("dashboard.improve", "Needs work")}</strong>
              <p>{skillLabel(lastPedagogicalReport?.weakest_skill || adaptiveState.focus_skill || "grammar")}</p>
            </article>
            <article>
              <strong>{getUiLabel("dashboard.retention", "Retention")}</strong>
              <p>{lastPedagogicalReport?.retention_rate ?? retentionRate}%</p>
            </article>
            <article>
              <strong>{getUiLabel("dashboard.consistency", "Consistency")}</strong>
              <p>{lastPedagogicalReport?.consistency_rate ?? 0}%</p>
            </article>
          </div>

          <div className="duo-report-actions">
            <button type="button" onClick={generatePedagogicalReport}>
              <RefreshCw size={14} />
              {getUiLabel("dashboard.generate_report", "Generate report")}
            </button>
            <button
              type="button"
              className="is-secondary"
              onClick={() => {
                setSelectedPedagogicalReportId(lastPedagogicalReport?.id || null);
                setShowPedagogicalReportModal(true);
              }}
              disabled={!lastPedagogicalReport}
            >
              <BarChart3 size={14} />
              {getUiLabel("dashboard.view_details", "VIEW DETAILS")}
            </button>
            <button type="button" className="is-secondary" onClick={exportPedagogicalReport} disabled={!lastPedagogicalReport}>
              <FileDown size={14} />
              {getUiLabel("dashboard.export_json", "Export JSON")}
            </button>
          </div>

          <div className="duo-report-recos">
            {(lastPedagogicalReport?.recommendations || []).slice(0, 2).map((item, index) => (
              <p key={`${item}_${index}`}>- {item}</p>
            ))}
          </div>
        </div>

        <div className="duo-info-card duo-telemetry-card">
          <div className="duo-info-head">
            <span>{getUiLabel("dashboard.telemetry", "Telemetry")}</span>
            <div className="duo-telemetry-filter">
              <label>
                {getUiLabel("dashboard.period", "Period")}
                <select value={telemetryDays} onChange={(e) => setTelemetryDays(Number(e.target.value))}>
                  <option value={7}>{getUiLabel("dashboard.days_7", "7 days")}</option>
                  <option value={14}>{getUiLabel("dashboard.days_14", "14 days")}</option>
                  <option value={30}>{getUiLabel("dashboard.days_30", "30 days")}</option>
                </select>
              </label>
            </div>
            <button type="button" onClick={loadTelemetrySummary} disabled={telemetryLoading}>
              {telemetryLoading ? "..." : getUiLabel("dashboard.refresh", "REFRESH")}
            </button>
            <button type="button" className="is-secondary" onClick={exportTelemetryCsv}>
              {getUiLabel("dashboard.export_csv", "Export CSV")}
            </button>
          </div>
          <div className="duo-report-summary">
            <span>
              <BarChart3 size={14} />
              {getUiLabel("dashboard.total_events", "Total events")}: {telemetrySummary.total}
            </span>
            <span>
              <TrendingUp size={14} />
              {getUiLabel("dashboard.last", "Last")} {telemetryPeriodLabel}: {telemetrySummary.last7}
            </span>
          </div>
          <div className="duo-telemetry-bars">
            {(telemetrySummary.by_module || []).slice(0, 4).map((item, index) => {
              const width = Math.round((Number(item.count || 0) / telemetryMax) * 100);
              return (
                <div
                  key={`${item.moduleKey || "other"}_${index}`}
                  style={{ display: "grid", gridTemplateColumns: "120px 1fr 40px", gap: "8px", alignItems: "center", marginTop: "8px" }}
                >
                  <span style={{ color: "#c7d9e6", fontWeight: 700, fontSize: "0.82rem" }}>
                    {item.moduleKey || getUiLabel("dashboard.other", "other")}
                  </span>
                  <div style={{ height: "8px", background: "rgba(97,127,147,0.35)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${width}%`, background: "#58cc02" }} />
                  </div>
                  <strong style={{ color: "#f3f8fc", fontSize: "0.85rem" }}>{item.count}</strong>
                </div>
              );
            })}
            {(telemetrySummary.by_module || []).length === 0 ? (
              <p style={{ color: "#c7d9e6", marginTop: "8px" }}>
                {getUiLabel("dashboard.no_module_data", "No module data yet.")}
              </p>
            ) : null}
          </div>
          <div className="duo-report-grid">
            {(telemetrySummary.by_module || []).slice(0, 4).map((item, index) => (
              <article key={`${item.moduleKey || "unknown"}_${index}`}>
                <strong>{item.moduleKey || getUiLabel("dashboard.other", "other")}</strong>
                <p>{item.count}</p>
              </article>
            ))}
            {(telemetrySummary.by_module || []).length === 0 ? (
              <article>
                <strong>{getUiLabel("dashboard.no_data", "No data")}</strong>
                <p>0</p>
              </article>
            ) : null}
          </div>
          <div className="duo-report-recos">
            {(telemetrySummary.by_name || []).slice(0, 2).map((item) => (
              <p key={item.name}>- {item.name}: {item.count}</p>
            ))}
          </div>
        </div>

        {isAdminUser ? (
        <div className="duo-info-card">
          <div className="duo-info-head">
            <span>{getUiLabel("menu.content_admin", "Content admin")}</span>
            <button type="button" onClick={() => setActiveScreen("admin")}>{getUiLabel("dashboard.admin_role", "Admin")}</button>
          </div>
          <p className="duo-onboarding-copy">{getUiLabel("dashboard.admin_copy", "Edit app labels and review dictionary entries from one internal panel.")}</p>
          <div className="duo-report-actions">
            <button type="button" onClick={() => setActiveScreen("admin")}>
              <NotebookPen size={14} />
              {getUiLabel("dashboard.open_admin", "Open admin")}
            </button>
            <button type="button" className="is-secondary" onClick={() => openModuleByKey("community")}>
              <Users size={14} />
              {getUiLabel("module.community", "Community")}
            </button>
          </div>
        </div>
        ) : null}

        <div className="duo-info-card duo-srs-card">
          <div className="duo-info-head">

            <span>{getUiLabel("dashboard.global_srs", "Global spaced review")}</span>

            <button type="button">SRS</button>

          </div>



          <div className="duo-srs-summary">
            <span>
              {getUiLabel("dashboard.today_completed", "Today: {count} completed").replace(
                "{count}",
                String(srsState.completed_today)
              )}
            </span>
            <span>
              {getUiLabel("dashboard.pending", "Pending: {count}").replace(
                "{count}",
                String(dueItemsTotal)
              )}
            </span>
          </div>

          <div className="duo-srs-kpi-grid">
            <article>
              <strong>{srsWeekStats.dueToday}</strong>
              <span>{getUiLabel("dashboard.due_today", "Due today")}</span>
            </article>
            <article>
              <strong>{srsWeekStats.dueNext7}</strong>
              <span>{getUiLabel("dashboard.next_days", "Next {days}").replace("{days}", getUiLabel("dashboard.days_7", "7 days"))}</span>
            </article>
            <article>
              <strong>{retentionRate}%</strong>
              <span>{getUiLabel("dashboard.retention_rate", "Retention rate")}</span>
            </article>
          </div>

          <div className="duo-srs-week-line">
            <div className="duo-srs-week-track">
              <div className="duo-srs-week-fill" style={{ width: `${srsWeekStats.weekProgress}%` }} />
            </div>
            <span>
              {getUiLabel("dashboard.week_window", "Weekly window")}: {srsWeekStats.dueToday + srsWeekStats.dueNext7} / {Math.max(1, srsWeekStats.totalWindow)}
            </span>
          </div>

          <div className="duo-progress-bar duo-srs-progress">
            <div
              className="duo-progress-fill"

              style={{

                width: `${Math.min(

                  100,

                  Math.round(

                    (Number(srsState.completed_today || 0) /

                      Math.max(

                        1,

                        Number(srsState.completed_today || 0) + Number(dueItems.length || 0)

                      )) *

                      100

                  )

                )}%`,

              }}

            />

            <span>

              {srsState.completed_today} /{" "}

              {Number(srsState.completed_today || 0) + Number(dueItems.length || 0)}

            </span>

          </div>



          <div className="duo-srs-list">
            {(Number(flashcardsSrsCounts.overdue || 0) + Number(flashcardsSrsCounts.dueToday || 0)) > 0 ? (
              <article className="duo-srs-item">
                <div>
                  <strong>{getUiLabel("dashboard.flashcards_due", "Flashcards due")}</strong>
                  <p>
                    {getUiLabel("dashboard.flashcards_due_desc", "{count} card(s) ready to review now.").replace(
                      "{count}",
                      String(Number(flashcardsSrsCounts.overdue || 0) + Number(flashcardsSrsCounts.dueToday || 0))
                    )}
                  </p>
                </div>
                <button type="button" onClick={() => { selectModule("flashcards"); setActiveScreen("module"); }}>
                  <CheckCircle2 size={15} />
                  {getUiLabel("dashboard.open_flashcards", "Open Flashcards")}
                </button>
              </article>
            ) : null}
            {dueItems.slice(0, 3).map((item) => (
              <article key={item.id} className="duo-srs-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{getSrsModuleLabel(item)}: {item.prompt}</p>
                </div>
                <div className="duo-srs-item-actions">
                  <button type="button" onClick={() => openReviewModule(item)}>
                    <CheckCircle2 size={15} />
                    {getUiLabel("dashboard.open_module", "Open module")}
                  </button>
                  <button type="button" className="is-secondary" onClick={() => completeReview(item.id)}>
                    {getUiLabel("dashboard.mark_reviewed", "Mark reviewed")}
                  </button>
                </div>
              </article>
            ))}
            {dueItems.length === 0 ? (

              <div className="duo-srs-empty">

                <RotateCcw size={16} />

                {getUiLabel("dashboard.no_reviews_today", "No reviews pending today.")}

              </div>

            ) : null}

          </div>

        </div>



        <div className="duo-info-card duo-adaptive-card">
          <div className="duo-info-head">

            <span>{getUiLabel("dashboard.adaptive_diagnostic", "Adaptive diagnostic")}</span>

            <button type="button">AUTO</button>

          </div>



          <div className="duo-adaptive-summary">

            <span>

              <Gauge size={14} />

              {getUiLabel("dashboard.score", "Score")}: {adaptiveState.global_score}

            </span>

            <span>

              <BrainCircuit size={14} />

              {getUiLabel("dashboard.difficulty", "Difficulty")}: {difficultyLabel(adaptiveState.global_difficulty)}

            </span>

          </div>



          <div className="duo-adaptive-focus">

            <p>

              {getUiLabel("dashboard.current_focus", "Current focus")}: <strong>{skillLabel(adaptiveState.focus_skill)}</strong>

            </p>

            <button

              type="button"

              onClick={() => selectModule(adaptiveState.recommended_module_key || "grammar")}

            >

              {getUiLabel("dashboard.apply_adjustment", "Apply adjustment")}

            </button>

          </div>



          <div className="duo-adaptive-skills">

            {(adaptiveState.skill_scores || []).map((item) => (

              <article key={item.skill} className="duo-adaptive-skill-item">

                <div className="duo-adaptive-skill-head">

                  <strong>{skillLabel(item.skill)}</strong>

                  <span>

                    <TrendingUp size={13} />

                    {item.score}

                  </span>

                </div>

                <div className="duo-adaptive-track">

                  <div className="duo-adaptive-fill" style={{ width: `${item.score}%` }} />

                </div>

                <em>

                  {difficultyLabel(item.difficulty)} Â· {getUiLabel("dashboard.error_rate", "error")} {Math.round(Number(item.error_pressure || 0) * 100)}%
                </em>

              </article>

            ))}

          </div>
        </div>

        <div className="duo-info-card duo-weekplan-card">
          <div className="duo-info-head">
            <span>{getUiLabel("dashboard.weekly_plan", "Automatic weekly plan")}</span>
            <button type="button">WEEK</button>
          </div>

          <div className="duo-weekplan-controls">
            <label htmlFor="weekly-goal-select">{getUiLabel("dashboard.goal", "Goal")}</label>
            <select
              id="weekly-goal-select"
              value={weeklyPlanState.goal || "conversacao"}
              onChange={(e) => updateWeeklyGoal(e.target.value)}
            >
              <option value="viagem">{getUiLabel("onboarding.goal.travel", "Travel")}</option>
              <option value="trabalho">{getUiLabel("onboarding.goal.work", "Work")}</option>
              <option value="prova">{getUiLabel("onboarding.goal.exam", "Exam")}</option>
              <option value="conversacao">{getUiLabel("onboarding.goal.conversation", "Conversation")}</option>
            </select>
            <button type="button" onClick={() => regenerateWeeklyPlan(weeklyPlanState.goal || "conversacao")}>
              <RefreshCw size={14} />
              {getUiLabel("dashboard.regenerate", "Regenerate")}
            </button>
          </div>

          <div className="duo-weekplan-meta">
            <span>
              <CalendarDays size={14} />
              {getUiLabel("dashboard.week", "Week")}: {weeklyPlanState.week_start || "-"}
            </span>
            <span>{getUiLabel("dashboard.current_focus", "Current focus")}: {goalLabel(weeklyPlanState.goal)}</span>
          </div>

          <div className="duo-weekplan-list">
            {(weeklyPlanState.days || []).slice(0, 7).map((day) => (
              <article key={`${day.day_index}_${day.task}`} className={`duo-weekplan-day ${day.status === "done" ? "is-done" : ""}`}>
                <div>
                  <strong>{getWeekdayLabel(day.day_index)}</strong>
                  <p>{day.task}</p>
                  <em>{day.minutes} min Â· {getModuleLabelByKey(day.module_key)}</em>
                </div>
                <button type="button" onClick={() => toggleWeeklyDayDone(day.day_index)}>
                  {day.status === "done" ? getUiLabel("dashboard.done", "Done") : getUiLabel("dashboard.mark", "Mark")}
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="duo-info-card duo-error-card">
          <div className="duo-info-head">
            <span>{getUiLabel("dashboard.error_notebook", "Error notebook")}</span>
            <button type="button">{getUiLabel("dashboard.errors_short", "ERRORS")}</button>
          </div>

          <div className="duo-error-summary">
            <span>
              <TriangleAlert size={14} />
              {getUiLabel("dashboard.patterns", "Patterns")}: {(errorNotebookState.patterns || []).length}
            </span>
            <span>
              <NotebookPen size={14} />
              {getUiLabel("dashboard.occurrences", "Occurrences")}: {errorNotebookState.total_logged || 0}
            </span>
          </div>

          <div className="duo-error-input-row">
            <input
              type="text"
              value={manualErrorInput}
              onChange={(e) => setManualErrorInput(e.target.value)}
              placeholder={getUiLabel("dashboard.manual_error_placeholder", "Add a manual error note (example: preposition with on/in)")}
            />
            <button type="button" onClick={addManualErrorPattern}>
              <Plus size={14} />
              {getUiLabel("common.add", "Add")}
            </button>
          </div>

          <div className="duo-error-list">
            {(errorNotebookState.patterns || []).slice(0, 4).map((pattern) => (
              <article
                key={pattern.id}
                className={`duo-error-item ${pattern.status === "reviewed" ? "is-reviewed" : ""}`}
              >
                <div>
                  <strong>{pattern.title}</strong>
                  <p>{pattern.rule}</p>
                  <em>
                    {pattern.wrong_example} {"->"} {pattern.right_example}
                  </em>
                </div>
                <button type="button" onClick={() => togglePatternReviewed(pattern.id)}>
                  {pattern.status === "reviewed" ? getUiLabel("dashboard.reopen", "Reopen") : getUiLabel("dashboard.reviewed", "Reviewed")}
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="duo-info-card duo-retention-card">
          <div className="duo-info-head">
            <span>{getUiLabel("dashboard.long_term_retention", "Long-term retention")}</span>
            <button type="button">7/30</button>
          </div>

          <div className="duo-retention-summary">
            <span>
              <CalendarDays size={14} />
              {getUiLabel("dashboard.tests_today", "Today: {count} test(s)").replace("{count}", String(retentionDueItems.length))}
            </span>
            <span>
              <Gauge size={14} />
              {getUiLabel("dashboard.retention", "Retention")}: {retentionRate}%
            </span>
          </div>

          <div className="duo-progress-bar duo-retention-progress">
            <div
              className="duo-progress-fill"
              style={{ width: `${Math.min(100, Math.round((Number(retentionState.total_tests || 0) / retentionProgressMax) * 100))}%` }}
            />
            <span>
              {retentionState.total_tests} / {retentionProgressMax}
            </span>
          </div>

          <div className="duo-retention-list">
            {retentionDueItems.slice(0, 3).map((item) => (
              <article key={item.id} className="duo-retention-item">
                <div>
                  <strong>{item.title}</strong>
                  <p>{getSrsModuleLabel(item)}: {item.prompt}</p>
                  <em>{getUiLabel("dashboard.test_in", "Test in {days} days").replace("{days}", String(item.scheduled_days))}</em>
                </div>
                <div className="duo-retention-actions">
                  <button type="button" onClick={() => runRetentionTest(item.id, true)}>
                    <CheckCircle2 size={14} />
                    {getUiLabel("dashboard.remembered", "Remembered")}
                  </button>
                  <button type="button" className="is-fail" onClick={() => runRetentionTest(item.id, false)}>
                    <RotateCcw size={14} />
                    {getUiLabel("dashboard.reinforce", "Reinforce")}
                  </button>
                </div>
              </article>
            ))}
            {retentionDueItems.length === 0 ? (
              <div className="duo-srs-empty">
                <CheckCircle2 size={16} />
                {getUiLabel("dashboard.no_tests_today", "No pending tests today.")}
              </div>
            ) : null}
          </div>
        </div>

        <div className="duo-info-card">
          <div className="duo-info-head">
            <span>{getUiLabel("dashboard.daily_missions", "Daily missions")}</span>
            <button type="button">{getUiLabel("dashboard.view_all", "VIEW ALL")}</button>

          </div>

          <div className="duo-mission-item">

            <div className="duo-mission-title">{getUiLabel("dashboard.earn_xp", "Earn 10 XP")}</div>

            <div className="duo-progress-bar">

              <div className="duo-progress-fill" style={{ width: "20%" }} />

              <span>2 / 10</span>

            </div>

          </div>

        </div>        {authReady && !authUser ? (
          <div className="duo-info-card duo-auth-card">
            <div className="duo-info-title">{getUiLabel("dashboard.create_profile_prompt", "Create a profile to save your progress!")}</div>

            <div className="duo-cta-stack">
              <button type="button" className="duo-cta-primary" onClick={switchToRegister}>
                <UserPlus size={18} />
                {getUiLabel("dashboard.create_profile", "CREATE A PROFILE")}
              </button>

              <button type="button" className="duo-cta-secondary" onClick={switchToLogin}>
                <LogIn size={18} />
                {getUiLabel("dashboard.login", "LOGIN")}
              </button>
            </div>
          </div>
        ) : null}
      </aside>

      {showPedagogicalReportModal ? (
        <div className="duo-onboarding-overlay">
          <section className="duo-onboarding-modal duo-report-modal">
            <div className="duo-onboarding-head">
              <h2>{getUiLabel("menu.reports", "Pedagogical reports")}</h2>
              <button type="button" onClick={() => setShowPedagogicalReportModal(false)}>
                {getUiLabel("common.close", "Close")}
              </button>
            </div>

            {selectedPedagogicalReport ? (
              <div className="duo-report-modal-body">
                <div className="duo-report-modal-grid">
                  <section className="duo-report-modal-main">
                    <div className="duo-report-summary">
                      <span>
                        <BarChart3 size={14} />
                        {getUiLabel("dashboard.score", "Score")}: {selectedPedagogicalReport.global_score ?? 0}
                      </span>
                      <span>
                        <Trophy size={14} />
                        {getUiLabel("dashboard.level", "Level")}: {selectedPedagogicalReport.level_estimate ?? "A1"}
                      </span>
                      <span>
                        <Gauge size={14} />
                        {getUiLabel("dashboard.retention", "Retention")}: {selectedPedagogicalReport.retention_rate ?? 0}%
                      </span>
                      <span>
                        <CalendarDays size={14} />
                        {getUiLabel("dashboard.consistency", "Consistency")}: {selectedPedagogicalReport.consistency_rate ?? 0}%
                      </span>
                    </div>

                    <div className="duo-report-grid duo-report-grid-wide">
                      <article>
                        <strong>{getUiLabel("dashboard.objective", "Objective")}</strong>
                        <p>{goalLabel(selectedPedagogicalReport.objective)}</p>
                      </article>
                      <article>
                        <strong>{getUiLabel("dashboard.generated_at", "Generated at")}</strong>
                        <p>{formatUiDateTime(selectedPedagogicalReport.generated_at)}</p>
                      </article>
                      <article>
                        <strong>{getUiLabel("dashboard.score_evolution", "Score evolution")}</strong>
                        <p>{selectedPedagogicalReport.score_evolution > 0 ? "+" : ""}{selectedPedagogicalReport.score_evolution || 0}</p>
                      </article>
                      <article>
                        <strong>{getUiLabel("dashboard.xp_label", "XP")}</strong>
                        <p>{selectedPedagogicalReport.xp ?? 0}</p>
                      </article>
                      <article>
                        <strong>{getUiLabel("dashboard.streak_label", "Streak")}</strong>
                        <p>{selectedPedagogicalReport.streak_days ?? 0}</p>
                      </article>
                      <article>
                        <strong>{getUiLabel("dashboard.improve", "Needs work")}</strong>
                        <p>{skillLabel(selectedPedagogicalReport.weakest_skill || "grammar")}</p>
                      </article>
                    </div>

                    <div className="duo-report-section">
                      <div className="duo-info-head">
                        <span>{getUiLabel("dashboard.module_health", "Module health")}</span>
                      </div>
                      <div className="duo-report-health-list">
                        {(selectedPedagogicalReport.module_health || []).map((item) => (
                          <article key={item.key} className="duo-report-health-item">
                            <div className="duo-report-health-head">
                              <strong>{item.label || getModuleLabelByKey(item.key)}</strong>
                              <span>{item.value}%</span>
                            </div>
                            <div className="duo-adaptive-track">
                              <div className="duo-adaptive-fill" style={{ width: `${item.value}%` }} />
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>

                    <div className="duo-report-section">
                      <div className="duo-info-head">
                        <span>{getUiLabel("dashboard.recommendations", "Recommendations")}</span>
                      </div>
                      <div className="duo-report-recos duo-report-recos-strong">
                        {(selectedPedagogicalReport.recommendations || []).map((item, index) => (
                          <p key={`${item}_${index}`}>- {item}</p>
                        ))}
                      </div>
                    </div>

                    <div className="duo-report-actions duo-report-actions-wide">
                      <button type="button" onClick={() => exportPedagogicalReport(selectedPedagogicalReport)}>
                        <FileDown size={14} />
                        {getUiLabel("dashboard.export_json", "Export JSON")}
                      </button>
                      <button type="button" className="is-secondary" onClick={() => setShowPedagogicalReportModal(false)}>
                        {getUiLabel("common.close", "Close")}
                      </button>
                    </div>
                  </section>

                  <aside className="duo-report-modal-side">
                    <div className="duo-info-head">
                      <span>{getUiLabel("dashboard.report_history", "Report history")}</span>
                    </div>
                    <div className="duo-report-history-list">
                      {pedagogicalReportHistory.map((report) => (
                        <button
                          key={report.id}
                          type="button"
                          className={`duo-report-history-item ${selectedPedagogicalReport?.id === report.id ? "is-active" : ""}`}
                          onClick={() => setSelectedPedagogicalReportId(report.id)}
                        >
                          <strong>{formatUiDateTime(report.generated_at)}</strong>
                          <span>{getUiLabel("dashboard.score", "Score")}: {report.global_score ?? 0}</span>
                          <span>{getUiLabel("dashboard.level", "Level")}: {report.level_estimate ?? "A1"}</span>
                        </button>
                      ))}
                      {pedagogicalReportHistory.length === 0 ? (
                        <div className="duo-srs-empty">
                          <BarChart3 size={16} />
                          {getUiLabel("dashboard.no_report_yet", "Generate your first report to see results here.")}
                        </div>
                      ) : null}
                    </div>
                  </aside>
                </div>
              </div>
            ) : (
              <div className="duo-report-empty-state">
                <BarChart3 size={18} />
                <p>{getUiLabel("dashboard.no_report_yet", "Generate your first report to see results here.")}</p>
                <button type="button" onClick={generatePedagogicalReport}>
                  <RefreshCw size={14} />
                  {getUiLabel("dashboard.generate_report", "Generate report")}
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {showOnboarding ? (
        <div className="duo-onboarding-overlay">
          <section className="duo-onboarding-modal">
            <div className="duo-onboarding-head">
              <h2>{getUiLabel("onboarding.title", "Pedagogical onboarding")}</h2>
              <button type="button" onClick={() => setShowOnboarding(false)}>
                {getUiLabel("common.close", "Close")}
              </button>
            </div>

            <div className="duo-onboarding-steps">
              <span className={onboardingStep === 0 ? "is-active" : ""}>{getUiLabel("onboarding.step.test", "Quick test")}</span>
              <span className={onboardingStep === 1 ? "is-active" : ""}>{getUiLabel("onboarding.step.goal", "Goal")}</span>
              <span className={onboardingStep === 2 ? "is-active" : ""}>{getUiLabel("onboarding.step.profile", "Profile")}</span>
            </div>

            {onboardingStep === 0 ? (
              <div className="duo-onboarding-body">
                {ONBOARDING_QUESTIONS.map((question) => (
                  <article key={question.id} className="duo-onboarding-question">
                    <strong>{getUiLabel(`onboarding.quiz.${question.id}.prompt`, question.prompt)}</strong>
                    <div className="duo-onboarding-options">
                      {question.options.map((option, index) => (
                        <button
                          key={`${question.id}_${index}`}
                          type="button"
                          className={Number(onboardingAnswers[question.id]) === index ? "is-selected" : ""}
                          onClick={() => answerOnboardingQuestion(question.id, index)}
                        >
                          {getUiLabel(`onboarding.quiz.${question.id}.option${index + 1}`, option)}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
                <div className="duo-onboarding-actions">
                  <span>{getUiLabel("onboarding.score", "Current score")}:  {onboardingScore}%</span>
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(1)}
                    disabled={Object.keys(onboardingAnswers).length < ONBOARDING_QUESTIONS.length}
                  >
                    {getUiLabel("common.continue", "Continue")}
                  </button>
                </div>
              </div>
            ) : null}

            {onboardingStep === 1 ? (
              <div className="duo-onboarding-body">
                <label htmlFor="onboarding-goal">{getUiLabel("onboarding.goal_label", "Main goal")}</label>
                <select id="onboarding-goal" value={onboardingGoal} onChange={(e) => setOnboardingGoal(e.target.value)}>
                  <option value="conversacao">{getUiLabel("onboarding.goal.conversation", "Conversation")}</option>
                  <option value="viagem">{getUiLabel("onboarding.goal.travel", "Travel")}</option>
                  <option value="trabalho">{getUiLabel("onboarding.goal.work", "Work")}</option>
                  <option value="prova">{getUiLabel("onboarding.goal.exam", "Exam")}</option>
                </select>
                <label htmlFor="onboarding-minutes">{getUiLabel("onboarding.daily_minutes", "Daily goal (minutes)")}</label>
                <input
                  id="onboarding-minutes"
                  type="number"
                  min={10}
                  max={120}
                  value={onboardingMinutes}
                  onChange={(e) => setOnboardingMinutes(Number(e.target.value || 20))}
                />
                <div className="duo-onboarding-actions">
                  <button type="button" onClick={() => setOnboardingStep(0)}>{getUiLabel("common.back", "Back")}</button>
                  <button type="button" onClick={() => setOnboardingStep(2)}>{getUiLabel("common.continue", "Continue")}</button>
                </div>
              </div>
            ) : null}

            {onboardingStep === 2 ? (
              <div className="duo-onboarding-body">
                <label htmlFor="onboarding-profile">{getUiLabel("onboarding.profile_label", "Learning profile")}</label>
                <select
                  id="onboarding-profile"
                  value={onboardingProfile}
                  onChange={(e) => setOnboardingProfile(e.target.value)}
                >
                  <option value="balanced">{getUiLabel("onboarding.profile.balanced", "Balanced")}</option>
                  <option value="visual">{getUiLabel("onboarding.profile.visual", "Visual")}</option>
                  <option value="auditivo">{getUiLabel("onboarding.profile.auditory", "Auditory")}</option>
                  <option value="pratico">{getUiLabel("onboarding.profile.practical", "Hands-on")}</option>
                </select>
                <p>
                  {getUiLabel("onboarding.estimated_level", "Estimated level")}:  <strong>{estimatedLevelFromScore(onboardingScore)}</strong>
                </p>
                <p>
                  {getUiLabel("onboarding.track_suggested", "Suggested track")}: {" "}
                  <strong>{buildPersonalizedTrack(onboardingGoal, onboardingProfile).join(" -> ")}</strong>
                </p>
                <div className="duo-onboarding-actions">
                  <button type="button" onClick={() => setOnboardingStep(1)}>{getUiLabel("common.back", "Back")}</button>
                  <button type="button" onClick={saveOnboarding}>{getUiLabel("onboarding.finish", "Finish onboarding")}</button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}


































































































