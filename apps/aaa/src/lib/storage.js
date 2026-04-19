import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

const LEGACY_WORDS_KEY = 'myvocab.words.v1';
const LEGACY_SETTINGS_KEY = 'myvocab.settings.v1';
const dbPromise = SQLite.openDatabaseAsync('my-vocab-100k.db');
let initialized = false;
let legacyMigrated = false;

export function normalizeWord(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function createWordEntry(word, extra = {}) {
  const normalized = normalizeWord(word);
  const now = new Date().toISOString();
  return {
    word: normalized,
    label: normalized,
    translation: '',
    meaning: '',
    example: '',
    listeningText: normalized,
    notes: '',
    status: 'new',
    favorite: false,
    includeInStudy: false,
    reviewInterval: 1,
    reviewStreak: 0,
    lastReviewedAt: null,
    nextReviewAt: now,
    createdAt: now,
    updatedAt: now,
    ...extra,
  };
}

async function getDb() {
  const db = await dbPromise;

  if (!initialized) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS vocab_words (
        word TEXT PRIMARY KEY NOT NULL,
        label TEXT NOT NULL,
        translation TEXT DEFAULT '',
        meaning TEXT DEFAULT '',
        example TEXT DEFAULT '',
        listeningText TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'new',
        favorite INTEGER DEFAULT 0,
        reviewInterval INTEGER DEFAULT 1,
        reviewStreak INTEGER DEFAULT 0,
        lastReviewedAt TEXT,
        nextReviewAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    try {
      await db.runAsync('ALTER TABLE vocab_words ADD COLUMN includeInStudy INTEGER DEFAULT 0');
    } catch {
      // column already exists
    }

    initialized = true;
  }

  if (!legacyMigrated) {
    await migrateLegacyData(db);
    legacyMigrated = true;
  }

  return db;
}

async function migrateLegacyData(db) {
  const existing = await db.getFirstAsync('SELECT COUNT(*) AS total FROM vocab_words');
  const total = Number(existing?.total || 0);

  if (total > 0) {
    await AsyncStorage.removeItem(LEGACY_WORDS_KEY).catch(() => {});
    await AsyncStorage.removeItem(LEGACY_SETTINGS_KEY).catch(() => {});
    return;
  }

  const [legacyWordsRaw, legacySettingsRaw] = await Promise.all([
    AsyncStorage.getItem(LEGACY_WORDS_KEY).catch(() => null),
    AsyncStorage.getItem(LEGACY_SETTINGS_KEY).catch(() => null),
  ]);

  if (legacyWordsRaw) {
    try {
      const legacyWords = JSON.parse(legacyWordsRaw);
      if (Array.isArray(legacyWords) && legacyWords.length > 0) {
        await saveWordsInternal(db, legacyWords);
      }
    } catch {
      // ignore malformed legacy data
    }
  }

  if (legacySettingsRaw) {
    try {
      const legacySettings = JSON.parse(legacySettingsRaw);
      if (legacySettings && typeof legacySettings === 'object') {
        await saveSettingsInternal(db, legacySettings);
      }
    } catch {
      // ignore malformed legacy data
    }
  }

  await AsyncStorage.removeItem(LEGACY_WORDS_KEY).catch(() => {});
  await AsyncStorage.removeItem(LEGACY_SETTINGS_KEY).catch(() => {});
}

function rowToWord(row) {
  return {
    ...row,
    favorite: Boolean(row.favorite),
    includeInStudy: Boolean(row.includeInStudy),
    reviewInterval: Number(row.reviewInterval || 1),
    reviewStreak: Number(row.reviewStreak || 0),
  };
}

async function saveWordsInternal(db, words) {
  const safeWords = Array.isArray(words) ? words : [];
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM vocab_words');
    for (const item of safeWords) {
      const entry = createWordEntry(item?.word || '', item || {});
      await db.runAsync(
        `INSERT OR REPLACE INTO vocab_words (
          word, label, translation, meaning, example, listeningText, notes,
          status, favorite, includeInStudy, reviewInterval, reviewStreak, lastReviewedAt,
          nextReviewAt, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.word,
          entry.label,
          entry.translation || '',
          entry.meaning || '',
          entry.example || '',
          entry.listeningText || entry.word,
          entry.notes || '',
          entry.status || 'new',
          entry.favorite ? 1 : 0,
          entry.includeInStudy ? 1 : 0,
          Number(entry.reviewInterval || 1),
          Number(entry.reviewStreak || 0),
          entry.lastReviewedAt || null,
          entry.nextReviewAt || null,
          entry.createdAt,
          entry.updatedAt,
        ]
      );
    }
  });
}

async function saveSettingsInternal(db, settings) {
  const payload = {
    listeningRate: 0.92,
    showTranscript: false,
    ...settings,
  };

  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(payload)) {
      await db.runAsync(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      );
    }
  });
}

export async function loadWords() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT * FROM vocab_words ORDER BY updatedAt DESC, createdAt DESC');
  return rows.map(rowToWord);
}

export async function saveWords(words) {
  const db = await getDb();
  await saveWordsInternal(db, words);
}

export async function loadSettings() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT key, value FROM app_settings');
  if (!rows.length) return { listeningRate: 0.92, showTranscript: false };

  const parsed = {};
  for (const row of rows) {
    try {
      parsed[row.key] = JSON.parse(row.value);
    } catch {
      parsed[row.key] = row.value;
    }
  }

  return { listeningRate: 0.92, showTranscript: false, ...parsed };
}

export async function saveSettings(settings) {
  const db = await getDb();
  await saveSettingsInternal(db, settings);
}

export function upsertWord(words, nextWord) {
  const normalized = normalizeWord(nextWord.word);
  const existingIndex = words.findIndex((item) => normalizeWord(item.word) === normalized);
  const merged = {
    ...(existingIndex >= 0 ? words[existingIndex] : createWordEntry(normalized)),
    ...nextWord,
    word: normalized,
    label: normalized,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    const clone = [...words];
    clone[existingIndex] = merged;
    return clone;
  }

  return [merged, ...words];
}

export function applyReview(words, word, difficulty = 'good') {
  const normalized = normalizeWord(word);
  const now = new Date();
  return words.map((item) => {
    if (normalizeWord(item.word) !== normalized) return item;
    const currentInterval = Number(item.reviewInterval || 1);
    const nextInterval = difficulty === 'easy'
      ? Math.min(currentInterval * 2, 30)
      : difficulty === 'hard'
        ? 1
        : Math.min(currentInterval + 1, 14);
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + nextInterval);
    return {
      ...item,
      status: difficulty === 'easy' ? 'mastered' : 'learning',
      reviewInterval: nextInterval,
      reviewStreak: Number(item.reviewStreak || 0) + (difficulty === 'hard' ? 0 : 1),
      lastReviewedAt: now.toISOString(),
      nextReviewAt: nextDate.toISOString(),
      updatedAt: now.toISOString(),
    };
  });
}

export function getDueWords(words) {
  const now = Date.now();
  return words.filter((item) => !item.nextReviewAt || new Date(item.nextReviewAt).getTime() <= now);
}
