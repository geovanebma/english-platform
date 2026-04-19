<<<<<<< HEAD
﻿import React, { useEffect, useMemo, useRef, useState } from 'react';
=======
import React, { useEffect, useMemo, useRef, useState } from 'react';
>>>>>>> b238f6c (backup 01)
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import wordBank from './src/data/word-bank.generated.json';
import {
  applyReview,
  createWordEntry,
  getDueWords,
  loadSettings,
  loadWords,
  normalizeWord,
  saveSettings,
  saveWords,
  upsertWord
} from './src/lib/storage';
import { lookupDictionaryEntry } from './src/lib/apiClient';

const TABS = [
  { key: 'Flashcards', label: 'Flashcards', short: 'Review' },
  { key: 'Meu vocabulario', label: 'Meu vocabulario', short: 'Words' },
  { key: 'Escuta', label: 'Escuta', short: 'Listening' }
];

const DICTIONARY_PAGE_SIZE = 25;
const VOCAB_PAGE_SIZE = 25;
const LISTENING_PAGE_SIZE = 10;

function formatStatus(status) {
  if (status === 'mastered') return 'Dominada';
  if (status === 'learning') return 'Aprendendo';
  return 'Nova';
}

function formatDays(days) {
  if (!Number.isFinite(days)) return 'Sem agenda';
  if (days <= 0) return 'Hoje';
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

function uniqueByWord(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.word || seen.has(item.word)) return false;
    seen.add(item.word);
    return true;
  });
}

function clampPage(page, totalPages) {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}

function removeWord(words, targetWord) {
  return words.filter((item) => item.word !== targetWord);
}

function parseExampleLines(exampleText) {
  const rawText = String(exampleText || '').trim();
  const lines = rawText.split('\n').map((line) => line.trim()).filter(Boolean);
  const english = (lines.find((line) => /^EN:\s*/i.test(line)) || '').replace(/^EN:\s*/i, '').trim();
  const portuguese = (lines.find((line) => /^PT:\s*/i.test(line)) || '').replace(/^PT:\s*/i, '').trim();
  return { english, portuguese };
}

function hasGeneratedExample(entry, fallbackWord = '') {
  const lines = parseExampleLines(entry?.example || '');
  const listeningText = String(entry?.listeningText || '').trim().toLowerCase();
  const normalizedFallback = String(fallbackWord || '').trim().toLowerCase();
  return Boolean(lines.english || (listeningText && listeningText !== normalizedFallback));
}

function buildHighlightedSegments(exampleText, targetWord) {
  const rawText = String(exampleText || '').trim();
  const cleanWord = String(targetWord || '').trim();

  if (!rawText || !cleanWord) {
    return [{ text: rawText, highlight: false }];
  }

  const lines = rawText.split('\n').map((line) => line.trim()).filter(Boolean);
  const englishLine = lines.find((line) => /^EN:\s*/i.test(line)) || rawText;
  const englishText = englishLine.replace(/^EN:\s*/i, '').trim();

  if (!englishText) {
    return [{ text: rawText, highlight: false }];
  }

  const escapedWord = cleanWord.replace(/[.*+?^$|(){}\[\]\\]/g, '\\$&');
  const matcher = new RegExp('(\\b' + escapedWord + '\\b)', 'gi');
  const parts = englishText.split(matcher).filter((part) => part.length > 0);

  if (!parts.length) {
    return [{ text: englishText, highlight: false }];
  }

  return parts.map((part) => ({
    text: part,
    highlight: part.toLowerCase() === cleanWord.toLowerCase()
  }));
}
export default function App() {
  const [activeTab, setActiveTab] = useState('Meu vocabulario');
  const [words, setWords] = useState([]);
  const [settings, setSettings] = useState({ listeningRate: 0.92, showTranscript: false });
  const [query, setQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [dictionaryEntry, setDictionaryEntry] = useState(null);
  const [dictionaryLoading, setDictionaryLoading] = useState(false);
  const [flashIndex, setFlashIndex] = useState(0);
  const [showFlashAnswer, setShowFlashAnswer] = useState(false);
  const [customListeningText, setCustomListeningText] = useState('');
  const [dictationAnswer, setDictationAnswer] = useState('');
  const [dictionaryPage, setDictionaryPage] = useState(1);
  const [vocabPage, setVocabPage] = useState(1);
  const [vocabQuery, setVocabQuery] = useState('');
  const [vocabFilter, setVocabFilter] = useState('all');
  const [listeningPage, setListeningPage] = useState(1);
  const [vocabPageInput, setVocabPageInput] = useState('1');
  const [listeningPageInput, setListeningPageInput] = useState('1');
  const [bootstrapped, setBootstrapped] = useState(false);
  const [listeningAutoplay, setListeningAutoplay] = useState(false);
  const [listeningRepeat, setListeningRepeat] = useState(false);
  const [listeningCurrentIndex, setListeningCurrentIndex] = useState(0);
  const [listeningPlaying, setListeningPlaying] = useState(false);
  const listeningTimeoutRef = useRef(null);
  const listeningAutoplayRef = useRef(false);
  const listeningRepeatRef = useRef(false);
  const listeningListRef = useRef(null);
  const listeningItemOffsetsRef = useRef({});

  useEffect(() => {
    (async () => {
      const [storedWords, storedSettings] = await Promise.all([loadWords(), loadSettings()]);
      setWords(storedWords);
      setSettings(storedSettings);
      setBootstrapped(true);
    })();
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;
    saveWords(words);
  }, [bootstrapped, words]);

  useEffect(() => {
    if (!bootstrapped) return;
    saveSettings(settings);
  }, [bootstrapped, settings]);

  const normalizedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return wordBank;
    return wordBank.filter((word) => word.includes(normalizedQuery));
  }, [normalizedQuery]);

  const savedMap = useMemo(() => new Map(words.map((item) => [item.word, item])), [words]);

  const studyWords = useMemo(() => words.filter((item) => item.includeInStudy), [words]);
  const dueWords = useMemo(() => getDueWords(studyWords), [studyWords]);

  const flashcards = useMemo(() => {
    return uniqueByWord(dueWords.length > 0 ? dueWords : studyWords).slice(0, 60);
  }, [dueWords, studyWords]);

  const currentFlashcard = flashcards[flashIndex] || null;
  const currentFlashcardExample = parseExampleLines(currentFlashcard?.example || '');
  const flashcardPromptSegments = buildHighlightedSegments(
    currentFlashcardExample.english || currentFlashcard?.word || '',
    currentFlashcard?.word || ''
  );
  const flashcardAnswerText =
    currentFlashcardExample.portuguese ||
    currentFlashcard?.translation ||
    currentFlashcard?.meaning ||
    'Sem traducao ainda';
  const listeningQueue = useMemo(() => {
    return uniqueByWord(studyWords)
      .map((item) => {
        const exampleLines = parseExampleLines(item.example);
        const fallbackWord = String(item.word || '').trim();
        const phraseText = String(item.listeningText || '').trim() || exampleLines.english || fallbackWord;
        const isPhrase = phraseText.toLowerCase() !== fallbackWord.toLowerCase();

        return {
          word: item.word,
          text: phraseText,
          translation: isPhrase
            ? exampleLines.portuguese || item.translation || ''
            : item.translation || exampleLines.portuguese || '',
          example: item.example || ''
        };
      })
      .filter((item) => item.text);
  }, [studyWords]);

  const listeningTotalPages = Math.max(1, Math.ceil(listeningQueue.length / LISTENING_PAGE_SIZE));
  const listeningPageItems = useMemo(() => {
    const start = (listeningPage - 1) * LISTENING_PAGE_SIZE;
    return listeningQueue.slice(start, start + LISTENING_PAGE_SIZE);
  }, [listeningPage, listeningQueue]);

  const currentListeningItem = listeningPageItems[listeningCurrentIndex] || null;

  const dictionaryTotalPages = Math.max(1, Math.ceil(searchResults.length / DICTIONARY_PAGE_SIZE));
  const dictionaryPageItems = useMemo(() => {
    const start = (dictionaryPage - 1) * DICTIONARY_PAGE_SIZE;
    return searchResults.slice(start, start + DICTIONARY_PAGE_SIZE);
  }, [dictionaryPage, searchResults]);

  const normalizedVocabQuery = vocabQuery.trim().toLowerCase();
  const filteredVocabItems = useMemo(() => {
    let base = wordBank;

    if (normalizedVocabQuery) {
      base = base.filter((word) => word.includes(normalizedVocabQuery));
    }

    if (vocabFilter === 'learned') {
      base = base.filter((word) => savedMap.get(normalizeWord(word))?.status === 'mastered');
    } else if (vocabFilter === 'unlearned') {
      base = base.filter((word) => savedMap.get(normalizeWord(word))?.status !== 'mastered');
    }

    return base;
  }, [normalizedVocabQuery, savedMap, vocabFilter]);

  const vocabTotalPages = Math.max(1, Math.ceil(filteredVocabItems.length / VOCAB_PAGE_SIZE));
  const vocabPageItems = useMemo(() => {
    const start = (vocabPage - 1) * VOCAB_PAGE_SIZE;
    return filteredVocabItems.slice(start, start + VOCAB_PAGE_SIZE);
  }, [filteredVocabItems, vocabPage]);

  useEffect(() => {
    setDictionaryPage(1);
  }, [normalizedQuery]);

  useEffect(() => {
    setDictionaryPage((current) => clampPage(current, dictionaryTotalPages));
  }, [dictionaryTotalPages]);

  useEffect(() => {
    setVocabPage((current) => clampPage(current, vocabTotalPages));
  }, [vocabTotalPages]);

  useEffect(() => {
    setVocabPage(1);
  }, [normalizedVocabQuery, vocabFilter]);

  useEffect(() => {
    setVocabPageInput(String(vocabPage));
  }, [vocabPage]);

  useEffect(() => {
    setListeningPageInput(String(listeningPage));
  }, [listeningPage]);

  useEffect(() => {
    setListeningPage((current) => clampPage(current, listeningTotalPages));
  }, [listeningTotalPages]);

  useEffect(() => {
    setListeningCurrentIndex((current) => {
      if (listeningPageItems.length === 0) return 0;
      return Math.min(current, listeningPageItems.length - 1);
    });
  }, [listeningPageItems.length]);

  useEffect(() => {
    listeningAutoplayRef.current = listeningAutoplay;
  }, [listeningAutoplay]);

  useEffect(() => {
    listeningRepeatRef.current = listeningRepeat;
  }, [listeningRepeat]);

  useEffect(() => {
    if (activeTab === 'Escuta') return;
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
    Speech.stop();
    setListeningPlaying(false);
    setListeningAutoplay(false);
    listeningAutoplayRef.current = false;
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'Escuta') return;
    const y = listeningItemOffsetsRef.current[listeningCurrentIndex];
    if (typeof y !== 'number') return;
    listeningListRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  }, [activeTab, listeningCurrentIndex]);

  useEffect(() => {
    return () => {
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
      Speech.stop();
    };
  }, []);

  const listeningText = currentListeningItem?.text || selectedWord || 'practice makes progress';

  const learnedCount = useMemo(() => words.filter((item) => item.status === 'mastered').length, [words]);
  const learningCount = useMemo(() => words.filter((item) => item.status === 'learning').length, [words]);
  const stats = useMemo(
    () => [
      { label: 'Base local', value: String(wordBank.length), tone: 'sun' },
      { label: 'Para revisar', value: String(dueWords.length), tone: 'mint' },
      { label: 'Marcadas', value: String(words.length), tone: 'sky' },
      { label: 'Dominadas', value: String(learnedCount), tone: 'rose' }
    ],
    [dueWords.length, learnedCount, words.length]
  );

  const activeTabLabel = useMemo(
    () => TABS.find((tab) => tab.key === activeTab)?.label || activeTab,
    [activeTab]
  );

  const activeTabHint = useMemo(() => {
    if (activeTab === 'Meu vocabulario') return 'Lista principal com rank, audio, lupa e controle de aprendida.';
    if (activeTab === 'Flashcards') return 'Revisao rapida para memorizar melhor.';
    return 'Lista de frases com autoplay, repeat e pausa automatica de 3 segundos.';
  }, [activeTab]);

  const quickActions = useMemo(
    () => [
      {
        key: 'words',
        title: 'Abrir palavras',
        subtitle: 'Buscar, ouvir e marcar',
        onPress: () => setActiveTab('Meu vocabulario')
      },
      {
        key: 'review',
        title: dueWords.length > 0 ? 'Revisar agora' : 'Abrir flashcards',
        subtitle: dueWords.length > 0 ? `${dueWords.length} pendentes` : 'Comecar revisao',
        onPress: () => setActiveTab('Flashcards')
      },
      {
        key: 'listen',
        title: 'Treino de escuta',
        subtitle: 'Ouvir e digitar',
        onPress: () => setActiveTab('Escuta')
      }
    ],
    [dueWords.length]
  );

  async function persistWordsUpdate(updater, baseWords = words) {
    const nextWords = typeof updater === 'function' ? updater(baseWords) : updater;
    const safeNextWords = Array.isArray(nextWords) ? nextWords : [];

    setWords(safeNextWords);
    await saveWords(safeNextWords);
    return safeNextWords;
  }

  async function ensureWordReady(word, options = {}) {
    const cleanWord = String(word || '').trim().toLowerCase();
    const { markLearned = false, forceExample = false } = options;
    if (!cleanWord) return null;

    const local = savedMap.get(cleanWord);
    const baseEntry = local || createWordEntry(cleanWord);
    const hasGeneratedContent = Boolean(
      baseEntry.translation ||
      baseEntry.meaning ||
      baseEntry.example ||
      (baseEntry.listeningText && baseEntry.listeningText !== cleanWord)
    );
    const hasExampleContent = hasGeneratedExample(baseEntry, cleanWord);

    let nextEntry = baseEntry;

    if (!hasGeneratedContent || (forceExample && !hasExampleContent)) {
      try {
        const aiEntry = await lookupDictionaryEntry(cleanWord);
        if (aiEntry) {
          nextEntry = {
            ...baseEntry,
            ...aiEntry,
            word: cleanWord,
            label: cleanWord,
            listeningText: aiEntry.listeningText || baseEntry.listeningText || cleanWord
          };
        }
      } catch {
        nextEntry = baseEntry;
      }
    }

    if (markLearned) {
      nextEntry = {
        ...nextEntry,
        status: 'mastered',
        reviewInterval: Math.max(7, Number(nextEntry.reviewInterval || 1)),
        nextReviewAt: nextEntry.nextReviewAt || new Date().toISOString()
      };
    }

    await persistWordsUpdate((current) => upsertWord(current, nextEntry));
    return nextEntry;
  }

  async function handleLookup(word) {
    const cleanWord = String(word || '').trim().toLowerCase();
    if (!cleanWord) return;

    setSelectedWord(cleanWord);
    const local = savedMap.get(cleanWord);
    const baseEntry = local || createWordEntry(cleanWord);
    setDictionaryEntry(baseEntry);
    setDictionaryLoading(true);

    try {
      const nextEntry = await ensureWordReady(cleanWord);
      if (nextEntry) {
        setDictionaryEntry(nextEntry);
      }
    } finally {
      setDictionaryLoading(false);
    }
  }

  async function toggleStudyWord(word) {
    const cleanWord = normalizeWord(word);
    if (!cleanWord) return;

    const local = savedMap.get(cleanWord);

    if (local?.includeInStudy) {
      const nextEntry = {
        ...(local || createWordEntry(cleanWord)),
        includeInStudy: false,
      };
      const nextWords = upsertWord(words, nextEntry);
      setWords(nextWords);
      await saveWords(nextWords);
      if (selectedWord === cleanWord) {
        setDictionaryEntry(nextEntry);
      }
      return;
    }

    setDictionaryLoading(true);

    try {
      const baseEntry = local || createWordEntry(cleanWord);
      const hasGeneratedContent = Boolean(
        baseEntry.translation ||
        baseEntry.meaning ||
        baseEntry.example ||
        (baseEntry.listeningText && baseEntry.listeningText !== cleanWord)
      );
      const hasExampleContent = hasGeneratedExample(baseEntry, cleanWord);

      let nextEntry = baseEntry;

      if (!hasGeneratedContent || !hasExampleContent) {
        try {
          const aiEntry = await lookupDictionaryEntry(cleanWord);
          if (aiEntry) {
            nextEntry = {
              ...baseEntry,
              ...aiEntry,
              word: cleanWord,
              label: cleanWord,
              listeningText: aiEntry.listeningText || baseEntry.listeningText || cleanWord,
            };
          }
        } catch {
          nextEntry = baseEntry;
        }
      }

      nextEntry = {
        ...nextEntry,
        includeInStudy: true,
      };

      const nextWords = upsertWord(words, nextEntry);
      setWords(nextWords);
      await saveWords(nextWords);
      setSelectedWord(cleanWord);
      setDictionaryEntry(nextEntry);
    } finally {
      setDictionaryLoading(false);
    }
  }
  async function toggleLearnedWord(word) {
    const cleanWord = String(word || '').trim().toLowerCase();
    if (!cleanWord) return;

    const local = savedMap.get(cleanWord);

    if (local?.status === 'mastered') {
      const nextEntry = {
        ...(local || createWordEntry(cleanWord)),
        status: 'new',
        reviewInterval: 1,
        nextReviewAt: new Date().toISOString()
      };
      await persistWordsUpdate((current) => upsertWord(current, nextEntry));
      return;
    }

    setDictionaryLoading(true);

    try {
      await ensureWordReady(cleanWord, { markLearned: true });
    } finally {
      setDictionaryLoading(false);
    }
  }

  function handleReview(difficulty) {
    if (!currentFlashcard) return;
    const updated = applyReview(words, currentFlashcard.word, difficulty);
    persistWordsUpdate(updated);
    setShowFlashAnswer(false);
    setFlashIndex((prev) => {
      if (flashcards.length <= 1) return 0;
      return (prev + 1) % flashcards.length;
    });
  }

  function handleSpeak(text) {
    if (!text) return;
    Speech.stop();
    Speech.speak(text, { rate: settings.listeningRate, language: 'en-US' });
  }

  function clearListeningTimer() {
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
      listeningTimeoutRef.current = null;
    }
  }

  function stopListeningSession(resetAutoplay = true) {
    clearListeningTimer();
    Speech.stop();
    setListeningPlaying(false);
    if (resetAutoplay) {
      setListeningAutoplay(false);
      listeningAutoplayRef.current = false;
    }
  }

  function playListeningItem(index, continueSequence = false) {
    if (!listeningPageItems.length) return;

    const safeIndex = Math.min(Math.max(index, 0), listeningPageItems.length - 1);
    const item = listeningPageItems[safeIndex];

    clearListeningTimer();
    Speech.stop();
    setListeningCurrentIndex(safeIndex);
    setListeningPlaying(true);

    Speech.speak(item.text, {
      rate: settings.listeningRate,
      language: 'en-US',
      onDone: () => {
        if (!continueSequence || !listeningAutoplayRef.current) {
          setListeningPlaying(false);
          return;
        }

        listeningTimeoutRef.current = setTimeout(() => {
          const nextIndex = safeIndex + 1;

          if (nextIndex < listeningPageItems.length) {
            playListeningItem(nextIndex, true);
            return;
          }

          if (listeningRepeatRef.current && listeningPageItems.length > 0) {
            playListeningItem(0, true);
            return;
          }

          setListeningPlaying(false);
          setListeningAutoplay(false);
          listeningAutoplayRef.current = false;
        }, 3000);
      },
      onStopped: () => {
        setListeningPlaying(false);
      },
      onError: () => {
        setListeningPlaying(false);
        setListeningAutoplay(false);
        listeningAutoplayRef.current = false;
      }
    });
  }

  function handleListeningAutoplayToggle() {
    if (!listeningPageItems.length) return;

    if (listeningAutoplayRef.current) {
      stopListeningSession(true);
      return;
    }

    setListeningAutoplay(true);
    listeningAutoplayRef.current = true;
    playListeningItem(listeningCurrentIndex, true);
  }

  function handleListeningRepeatToggle() {
    setListeningRepeat((current) => {
      const next = !current;
      listeningRepeatRef.current = next;
      return next;
    });
  }

  const dictationFeedback = useMemo(() => {
    if (!dictationAnswer.trim()) return '';
    return dictationAnswer.trim().toLowerCase() === listeningText.trim().toLowerCase()
      ? 'Transcricao correta.'
      : 'Ainda diferente do audio. Tente de novo.';
  }, [dictationAnswer, listeningText]);

  function jumpToPage(rawValue, totalPages, onChangePage, onInputChange) {
    const numeric = Number(String(rawValue || '').replace(/[^0-9]/g, ''));
    const nextPage = clampPage(Number.isFinite(numeric) && numeric > 0 ? numeric : 1, totalPages);
    onInputChange(String(nextPage));
    onChangePage(nextPage);
  }

  function renderPagination(page, totalPages, onChangePage, itemCount, itemLabel, inputValue, onInputChange) {
    if (itemCount <= 0) return null;

    return (
      <View style={styles.paginationShell}>
        <Text style={styles.paginationSummary}>
          Pagina {page} de {totalPages} - {itemCount} {itemLabel}
        </Text>
        <View style={styles.paginationControls}>
          <TouchableOpacity
            style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
            onPress={() => onChangePage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
              Anterior
            </Text>
          </TouchableOpacity>

          <View style={styles.paginationJumpShell}>
            <TextInput
              value={inputValue}
              onChangeText={(value) => onInputChange(value.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.paginationInput}
              onSubmitEditing={() => jumpToPage(inputValue, totalPages, onChangePage, onInputChange)}
              returnKeyType="go"
            />
            <Text style={styles.paginationJumpMeta}>/ {totalPages}</Text>
            <TouchableOpacity
              style={styles.paginationGoButton}
              onPress={() => jumpToPage(inputValue, totalPages, onChangePage, onInputChange)}
            >
              <Text style={styles.paginationGoButtonText}>Ir</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.paginationButton, page === totalPages && styles.paginationButtonDisabled]}
            onPress={() => onChangePage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <Text style={[styles.paginationButtonText, page === totalPages && styles.paginationButtonTextDisabled]}>
              Proxima
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderDictionaryTab() {
    return null;
  }

  function renderVocabTab() {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelEyebrow}>Meu vocabulario</Text>

        <View style={styles.searchShell}>
          <TextInput
            value={vocabQuery}
            onChangeText={setVocabQuery}
            placeholder="Buscar palavra no seu vocabulario"
            placeholderTextColor="#7b8798"
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, vocabFilter === 'all' && styles.filterPillActive]}
            onPress={() => setVocabFilter('all')}
          >
            <Text style={[styles.filterPillText, vocabFilter === 'all' && styles.filterPillTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, vocabFilter === 'learned' && styles.filterPillActive]}
            onPress={() => setVocabFilter('learned')}
          >
            <Text style={[styles.filterPillText, vocabFilter === 'learned' && styles.filterPillTextActive]}>
              Aprendidas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, vocabFilter === 'unlearned' && styles.filterPillActive]}
            onPress={() => setVocabFilter('unlearned')}
          >
            <Text style={[styles.filterPillText, vocabFilter === 'unlearned' && styles.filterPillTextActive]}>
              Nao aprendidas
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.rankColumn]} numberOfLines={1}>Rank</Text>
          <Text style={[styles.tableHeaderText, styles.wordColumn]} numberOfLines={1}>Palavra</Text>
<<<<<<< HEAD
          <Text style={[styles.tableHeaderText, styles.actionColumn]} numberOfLines={1}>A��es</Text>
=======
          <Text style={[styles.tableHeaderText, styles.actionColumn]} numberOfLines={1}>A��es</Text>
>>>>>>> b238f6c (backup 01)
        </View>

        {filteredVocabItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nada encontrado</Text>
            <Text style={styles.emptyText}>
              Ajuste a busca ou troque o filtro para ver mais palavras.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listStack}>
              {vocabPageItems.map((word, index) => {
                const absoluteRank = (vocabPage - 1) * VOCAB_PAGE_SIZE + index + 1;
                const savedEntry = savedMap.get(normalizeWord(word));
                const isLearned = savedEntry?.status === 'mastered';
                const isInStudy = Boolean(savedEntry?.includeInStudy);

                return (
                  <React.Fragment key={word}>
                    <View style={styles.tableRowCard}>
                      <Text style={[styles.rankCell, styles.rankColumn]}>#{absoluteRank}</Text>
                      <Text style={[styles.wordCell, styles.wordColumn]} numberOfLines={1} ellipsizeMode="tail">
                        {word}
                      </Text>
                      <TouchableOpacity
                        style={[styles.iconButton, styles.iconActionColumn]}
                        onPress={() => handleSpeak(word)}
                      >
                        <Ionicons name="play" size={14} color="#ffffff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.iconButton, styles.iconActionColumn]}
                        onPress={() => handleLookup(word)}
                      >
                        <Ionicons name="search" size={14} color="#ffffff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.learnBox, styles.iconActionColumn, isLearned && styles.learnBoxChecked]}
                        onPress={() => toggleLearnedWord(word)}
                      >
                        <Ionicons
                          name={isLearned ? 'checkmark' : 'square-outline'}
                          size={14}
                          color={isLearned ? '#ffffff' : '#9b8b77'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.studyBox, styles.iconActionColumn, isInStudy && styles.studyBoxActive]}
                        onPress={() => toggleStudyWord(word)}
                      >
                        <Ionicons
                          name="add"
                          size={15}
                          color={isInStudy ? '#ffffff' : '#123848'}
                        />
                      </TouchableOpacity>
                    </View>
                    {selectedWord === word && (
                      <View style={styles.featureCard}>
                        <View style={styles.featureTopRow}>
                          <View style={styles.featureWordWrap}>
                            <Text style={styles.featureWord}>{selectedWord}</Text>
                            <Text style={styles.featureMeta}>
                              {dictionaryLoading
                                ? 'Enriquecendo com IA...'
                                : savedMap.get(normalizeWord(selectedWord))?.status === 'mastered'
                                  ? 'Ja esta marcada como aprendida'
                                  : savedMap.get(normalizeWord(selectedWord))?.includeInStudy
                                    ? 'Ja esta no flashcards e listening'
                                    : savedMap.has(normalizeWord(selectedWord))
                                    ? 'Ja esta salva no seu vocabulario'
                                    : 'Salvando frase e detalhes automaticamente'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.ghostButton}
                            onPress={() => handleSpeak(dictionaryEntry?.listeningText || selectedWord)}
                          >
                            <Text style={styles.ghostButtonText}>Ouvir</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.definitionGrid}>
                          <View style={styles.definitionBlock}>
                            <Text style={styles.definitionLabel}>Traducao</Text>
                            <Text style={styles.definitionText}>
                              {dictionaryEntry?.translation || 'Ainda nao definida'}
                            </Text>
                          </View>
                          <View style={styles.definitionBlock}>
                            <Text style={styles.definitionLabel}>Meaning</Text>
                            <Text style={styles.definitionText}>
                              {dictionaryEntry?.meaning || 'Use o proxy de IA para gerar definicao.'}
                            </Text>
                          </View>
                          <View style={styles.definitionBlockWide}>
                            <Text style={styles.definitionLabel}>Exemplo</Text>
                            <Text style={styles.definitionText}>
                              {dictionaryEntry?.example || 'EN: No example yet.\nPT: Ainda sem exemplo.'}
                            </Text>
                          </View>
                        </View>

                      </View>
                    )}
                  </React.Fragment>
                );
              })}
            </View>

            {renderPagination(
              vocabPage,
              vocabTotalPages,
              setVocabPage,
              filteredVocabItems.length,
              'palavras',
              vocabPageInput,
              setVocabPageInput
            )}
          </>
        )}
      </View>
    );
  }

  function renderFlashcardsTab() {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelEyebrow}>Flashcards</Text>
        {!currentFlashcard ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Ainda nao ha cards para revisar</Text>
            <Text style={styles.emptyText}>
              Adicione palavras ao banco para gerar uma fila de estudo.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.flashProgressRow}>
              <Text style={styles.flashProgressText}>
                Card {flashIndex + 1} de {flashcards.length}
              </Text>
              <Text style={styles.flashProgressText}>{dueWords.length} pendentes hoje</Text>
            </View>

            <TouchableOpacity
              style={[styles.flashcardShell, showFlashAnswer && styles.flashcardShellAnswer]}
              onPress={() => setShowFlashAnswer((prev) => !prev)}
            >
              <Text style={styles.flashTag}>{showFlashAnswer ? 'Traducao' : 'Frase'}</Text>
              {!showFlashAnswer ? (
                <Text style={styles.flashSentencePrompt}>
                  {flashcardPromptSegments.map((segment, index) => (
                    <Text
                      key={(currentFlashcard?.word || 'flash') + '-prompt-' + index}
                      style={segment.highlight ? styles.flashSentencePromptHighlight : styles.flashSentencePromptText}
                    >
                      {segment.text}
                    </Text>
                  ))}
                </Text>
              ) : (
                <Text style={styles.flashTranslationAnswer}>{flashcardAnswerText}</Text>
              )}
              <Text style={styles.flashHint}>
                {showFlashAnswer
                  ? 'Toque para voltar para a frase'
                  : 'Toque para revelar a traducao da frase'}
              </Text>
            </TouchableOpacity>

            <View style={styles.tripleButtonRow}>
              <TouchableOpacity
                style={styles.secondaryButtonWide}
                onPress={() => handleSpeak(currentFlashcard.listeningText || currentFlashcardExample.english || currentFlashcard.word)}
              >
                <Text style={styles.secondaryButtonWideText}>Ouvir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.warnButton} onPress={() => handleReview('hard')}>
                <Text style={styles.warnButtonText}>Dificil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButtonCompact} onPress={() => handleReview('easy')}>
                <Text style={styles.primaryButtonText}>Facil</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  }

  function renderListeningTab() {
    return (
      <View style={styles.panel}>
        <Text style={styles.panelEyebrow}>Listening</Text>

        {!listeningQueue.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Ainda nao ha frases para ouvir</Text>
            <Text style={styles.emptyText}>
              Use a lupa ou marque palavras como aprendidas para gerar frases e montar sua lista de listening.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listeningControlsRow}>
              <TouchableOpacity
                style={[styles.listeningControlButton, listeningAutoplay && styles.listeningControlButtonActive]}
                onPress={handleListeningAutoplayToggle}
              >
                <Text style={[styles.listeningControlButtonText, listeningAutoplay && styles.listeningControlButtonTextActive]}>
                  {listeningAutoplay ? 'Parar Autoplay' : 'Autoplay'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.listeningControlButton, listeningRepeat && styles.listeningControlButtonActive]}
                onPress={handleListeningRepeatToggle}
              >
                <Text style={[styles.listeningControlButtonText, listeningRepeat && styles.listeningControlButtonTextActive]}>Repeat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.listeningFinishButton} onPress={() => stopListeningSession(true)}>
                <Text style={styles.listeningFinishButtonText}>Finalizar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={listeningListRef}
              style={styles.listeningListScroll}
              contentContainerStyle={styles.listeningListStack}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {listeningPageItems.map((item, index) => {
                const isCurrent = index === listeningCurrentIndex;
                const isPlayingCurrent = isCurrent && listeningPlaying;

                return (
                  <TouchableOpacity
                    key={item.word + '-' + index}
                    style={[styles.listeningListItem, isCurrent && styles.listeningListItemActive]}
                    onPress={() => playListeningItem(index, listeningAutoplayRef.current)}
                    onLayout={(event) => {
                      listeningItemOffsetsRef.current[index] = event.nativeEvent.layout.y;
                    }}
                  >
                    <View style={styles.listeningListIconWrap}>
                      <Ionicons name="volume-high" size={16} color="#ffffff" />
                    </View>
                    <View style={styles.listeningListTextWrap}>
                      <Text style={styles.listeningListPhrase}>
                        {buildHighlightedSegments(item.text, item.word).map((segment, segmentIndex) => (
                          <Text
                            key={item.word + '-listening-segment-' + index + '-' + segmentIndex}
                            style={segment.highlight ? styles.listeningListWordHighlight : styles.listeningListPhraseText}
                          >
                            {segment.text}
                          </Text>
                        ))}
                      </Text>
                      {isCurrent && !!item.translation && (
                        <Text style={styles.listeningListTranslation}>{item.translation}</Text>
                      )}
                    </View>
                    <Text style={[styles.listeningListTag, isCurrent && styles.listeningListTagActive]}>
                      {isPlayingCurrent ? 'Atual' : `Frase ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {renderPagination(
              listeningPage,
              listeningTotalPages,
              (nextPage) => {
                stopListeningSession(true);
                setListeningPage(nextPage);
                setListeningCurrentIndex(0);
              },
              listeningQueue.length,
              'frases',
              listeningPageInput,
              setListeningPageInput
            )}
          </>
        )}
      </View>
    );
  }

  function renderActiveTab() {
    if (activeTab === 'Meu vocabulario') return renderVocabTab();
    if (activeTab === 'Flashcards') return renderFlashcardsTab();
    return renderListeningTab();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>My Vocab 100k</Text>
        {/* <View style={styles.heroCard}>
        </View> */}

        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <View key={item.label} style={[styles.statCard, styles[`statCard_${item.tone}`]]}>
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {renderActiveTab()}
      </ScrollView>

      <View style={styles.bottomTabBar}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.bottomTabButton, active && styles.bottomTabButtonActive]}
            >
              <Text style={[styles.bottomTabText, active && styles.bottomTabTextActive]}>{tab.short}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f4efe6'
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 150,
    gap: 18
  },
  heroCard: {
    backgroundColor: '#113946',
    borderRadius: 30,
    padding: 22,
    gap: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  heroKicker: {
    color: '#f6d28f',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1
  },
  heroTitle: {
    color: '#13222c',
    fontSize: 32,
    fontWeight: '900'
  },
  heroSubtitle: {
    color: '#d5e4e8',
    fontSize: 15,
    lineHeight: 22
  },
  heroFocusCard: {
    backgroundColor: '#f2ebe1',
    borderRadius: 22,
    padding: 16,
    gap: 6
  },
  heroFocusLabel: {
    color: '#8b5e34',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  heroFocusTitle: {
    color: '#1b3139',
    fontSize: 22,
    fontWeight: '900'
  },
  heroFocusText: {
    color: '#4d6270',
    lineHeight: 21
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 4
  },
  statCard: {
    width: 90,
    borderRadius: 18,
    padding: 12,
    minHeight: 60,
    justifyContent: 'space-between',
    borderWidth: 1
  },

  statCard_sun: {
    backgroundColor: '#fff4d9',
    borderColor: '#f3d089'
  },
  statCard_mint: {
    backgroundColor: '#dff7ec',
    borderColor: '#97d5b4'
  },
  statCard_sky: {
    backgroundColor: '#e3f1ff',
    borderColor: '#a7c8ea'
  },
  statCard_rose: {
    backgroundColor: '#fde8ea',
    borderColor: '#eab3ba'
  },
  statLabel: {
    color: '#536574',
    fontSize: 11,
    fontWeight: '700'
  },
  statValue: {
    color: '#13222c',
    fontSize: 20,
    fontWeight: '900'
  },
  quickActionPanel: {
    gap: 12
  },
  quickActionHeader: {
    gap: 4
  },
  quickActionTitle: {
    color: '#172430',
    fontSize: 20,
    fontWeight: '900'
  },
  quickActionHint: {
    color: '#697887',
    lineHeight: 20
  },
  quickActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  quickActionCard: {
    flexBasis: '47%',
    backgroundColor: '#fffdf9',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4d8c8',
    minHeight: 108,
    justifyContent: 'space-between'
  },
  quickActionCardTitle: {
    color: '#172430',
    fontSize: 17,
    fontWeight: '800'
  },
  quickActionCardSubtitle: {
    color: '#697887',
    lineHeight: 20
  },
  panel: {
    backgroundColor: '#fffdf9',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e7dac8',
    gap: 16
  },
  panelHeaderRow: {
    flexDirection: 'row',
    gap: 12
  },
  panelHeaderTextWrap: {
    flex: 1,
    gap: 4
  },
  panelEyebrow: {
    color: '#9c6a3d',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  panelTitle: {
    color: '#172430',
    fontSize: 24,
    fontWeight: '900'
  },
  panelSubtitle: {
    color: '#6b7988',
    lineHeight: 21
  },
  searchShell: {
    backgroundColor: '#f4efe8',
    borderRadius: 20,
    padding: 4
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d8cab8',
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#12212a'
  },
  sectionBlock: {
    gap: 10
  },
  sectionTitle: {
    color: '#223240',
    fontSize: 15,
    fontWeight: '800'
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  horizontalChipsRow: {
    gap: 8,
    paddingRight: 10
  },
  wordChip: {
    backgroundColor: '#edf4f7',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#d4e1e6'
  },
  wordChipActive: {
    backgroundColor: '#123848',
    borderColor: '#123848'
  },
  wordChipSaved: {
    borderColor: '#8fc7a7'
  },
  wordChipText: {
    color: '#214458',
    fontWeight: '800'
  },
  wordChipTextActive: {
    color: '#ffffff'
  },
  featureCard: {
    backgroundColor: '#123848',
    borderRadius: 24,
    padding: 18,
    gap: 14
  },
  featureCardSoft: {
    backgroundColor: '#f2ebe1',
    borderRadius: 24,
    padding: 18,
    gap: 14
  },
  featureTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start'
  },
  featureWordWrap: {
    flex: 1,
    gap: 4
  },
  featureWord: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900'
  },
  featureMeta: {
    color: '#b8d1d6',
    lineHeight: 20
  },
  softLabel: {
    color: '#9e6f44',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  ghostButton: {
    backgroundColor: '#f4efe6',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14
  },
  ghostButtonText: {
    color: '#153949',
    fontWeight: '800'
  },
  definitionGrid: {
    gap: 10
  },
  definitionBlock: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 14,
    gap: 6
  },
  definitionBlockWide: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 14,
    gap: 6
  },
  definitionLabel: {
    color: '#9e6f44',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  definitionText: {
    color: '#f4f8f9',
    lineHeight: 21
  },
  primaryRow: {
    flexDirection: 'row'
  },
  primaryButton: {
    backgroundColor: '#d36f33',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    flexGrow: 1,
    alignItems: 'center'
  },
  primaryButtonCompact: {
    backgroundColor: '#d36f33',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 92,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  secondaryButtonWide: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d8cab8',
    alignItems: 'center',
    flexGrow: 1
  },
  secondaryButtonWideText: {
    color: '#203545',
    fontWeight: '800'
  },
  warnButton: {
    backgroundColor: '#fff1d8',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#efc77d',
    minWidth: 88,
    alignItems: 'center'
  },
  warnButtonText: {
    color: '#9c5b14',
    fontWeight: '800'
  },
  emptyCard: {
    backgroundColor: '#f5efe7',
    borderRadius: 22,
    padding: 18,
    gap: 10
  },
  emptyTitle: {
    color: '#1a2a35',
    fontSize: 18,
    fontWeight: '800'
  },
  emptyText: {
    color: '#697887',
    lineHeight: 21
  },
  paginationShell: {
    gap: 8,
    marginTop: 2
  },
  paginationSummary: {
    color: '#697887',
    fontWeight: '700',
    fontSize: 12
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6
  },
  paginationJumpShell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  paginationInput: {
    minWidth: 48,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d8cab8',
    backgroundColor: '#ffffff',
    color: '#203545',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center'
  },
  paginationJumpMeta: {
    color: '#697887',
    fontWeight: '700',
    fontSize: 12
  },
  paginationGoButton: {
    backgroundColor: '#123848',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  paginationGoButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  paginationButton: {
    backgroundColor: '#f3ede3',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d8cab8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 92
  },
  paginationButtonDisabled: {
    backgroundColor: '#ece4d8',
    borderColor: '#e4d8c8'
  },
  paginationButtonText: {
    color: '#203545',
    fontWeight: '800',
    fontSize: 12
  },
  paginationButtonTextDisabled: {
    color: '#9aa6b2'
  },
  listStack: {
    gap: 10
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#133847',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6
  },
  tableHeaderText: {
    color: '#d8edf2',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  tableRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f2ea',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e4d7c5'
  },
  tableRowCardActive: {
    borderColor: '#123848',
    backgroundColor: '#eef5f7'
  },
  rankColumn: {
    width: 60
  },
  wordColumn: {
    flex: 1,
    minWidth: 100
  },
  actionColumn: {
    width: 72,
    alignItems: 'center'
  },
  iconActionColumn: {
    width: 30,
    height: 30,
    alignItems: 'center'
  },
  statusColumn: {
    width: 68,
    alignItems: 'center'
  },
  rankCell: {
    color: '#183141',
    fontWeight: '900'
  },
  wordCell: {
    color: '#183141',
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1
  },
  tableActionButton: {
    backgroundColor: '#123848',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 64,
    alignItems: 'center'
  },
  tableActionButtonText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  iconButton: {
    backgroundColor: '#123848',
    borderRadius: 999,
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  statusCell: {
    color: '#566776',
    fontWeight: '800',
    textAlign: 'center'
  },
  learnBox: {
    borderWidth: 1,
    borderColor: '#123848',
    borderRadius: 999,
    width: 22,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  learnBoxChecked: {
    backgroundColor: '#123848',
    borderColor: '#123848'
  },
  studyBox: {
    borderWidth: 1,
    borderColor: '#123848',
    borderRadius: 999,
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  studyBoxActive: {
    backgroundColor: '#123848',
    borderColor: '#123848'
  },
  learnBoxText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 11,
    lineHeight: 12
  },
  learnBoxTextChecked: {
    color: '#ffffff'
  },
  vocabCard: {
    backgroundColor: '#f7f2ea',
    borderRadius: 20,
    padding: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e4d7c5'
  },
  vocabCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  vocabWordWrap: {
    flex: 1,
    gap: 4
  },
  vocabWord: {
    color: '#172430',
    fontSize: 20,
    fontWeight: '900'
  },
  vocabMeta: {
    color: '#697887'
  },
  vocabMeaning: {
    color: '#314655',
    fontWeight: '700'
  },
  vocabDetail: {
    color: '#556675',
    lineHeight: 20
  },
  smallActionButton: {
    backgroundColor: '#123848',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14
  },
  smallActionButtonText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  flashProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  flashProgressText: {
    color: '#6b7988',
    fontWeight: '700'
  },
  flashcardShell: {
    minHeight: 250,
    borderRadius: 28,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff1d8',
    borderWidth: 1,
    borderColor: '#efc77d'
  },
  flashcardShellAnswer: {
    backgroundColor: '#123848',
    borderColor: '#123848'
  },
  flashTag: {
    color: '#a56220',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  flashWordCenter: {
    fontSize: 34,
    fontWeight: '900',
    color: '#7a4010',
    textAlign: 'center'
  },
  flashSentencePrompt: {
    textAlign: 'center'
  },
  flashSentencePromptText: {
    color: '#7a4010',
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '900'
  },
  flashSentencePromptHighlight: {
    color: '#ff9f43',
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '900',
    textDecorationLine: 'underline'
  },
  flashTranslationAnswer: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center'
  },
  flashHint: {
    color: '#6a4c2d',
    lineHeight: 22,
    textAlign: 'center'
  },
  tripleButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  listeningText: {
    color: '#183141',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32
  },
  listeningMeta: {
    color: '#516271',
    lineHeight: 20
  },
  successText: {
    color: '#19734d',
    fontWeight: '800'
  },
  mutedText: {
    color: '#7b4d29',
    fontWeight: '700'
  },
  transcriptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#d8cab8'
  },
  transcriptText: {
    color: '#203545',
    lineHeight: 21
  },
  textLinkButton: {
    alignSelf: 'flex-start'
  },
  textLinkButtonText: {
    color: '#20465a',
    fontWeight: '800'
  },
  listeningControlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  listeningControlButton: {
    backgroundColor: '#efe5f6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#c9b2dc'
  },
  listeningControlButtonActive: {
    backgroundColor: '#6c4aa4',
    borderColor: '#6c4aa4'
  },
  listeningControlButtonText: {
    color: '#432c69',
    fontWeight: '800'
  },
  listeningControlButtonTextActive: {
    color: '#ffffff'
  },
  listeningFinishButton: {
    backgroundColor: '#d36f33',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11
  },
  listeningFinishButtonText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  listeningBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  listeningBadge: {
    backgroundColor: '#efe3ee',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  listeningBadgeText: {
    color: '#6e526f',
    fontSize: 12,
    fontWeight: '800'
  },
  listeningListScroll: {
    maxHeight: 420
  },
  listeningListStack: {
    gap: 10,
    paddingBottom: 4
  },
  listeningListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#123848',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#47616d'
  },
  listeningListItemActive: {
    borderColor: '#f3d089',
    backgroundColor: '#194555'
  },
  listeningListIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  listeningListIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900'
  },
  listeningListTextWrap: {
    flex: 1,
    minWidth: 0
  },
  listeningListPhrase: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800'
  },
  listeningListPhraseText: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800'
  },
  listeningListWordHighlight: {
    color: '#ff9f43',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '900',
    textDecorationLine: 'underline'
  },
  listeningListTranslation: {
    color: '#cde1e8',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  listeningListTag: {
    color: '#f1d4e8',
    fontSize: 13,
    fontWeight: '800'
  },
  listeningListTagActive: {
    color: '#ffd783'
  },
  bottomTabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 46,
    backgroundColor: '#fffdf9',
    borderRadius: 24,
    padding: 8,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e3d6c5',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8
  },
  bottomTabButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomTabButtonActive: {
    backgroundColor: '#123848'
  },
  bottomTabText: {
    color: '#5d6d7c',
    fontWeight: '800',
    fontSize: 12
  },
  bottomTabTextActive: {
    color: '#ffffff'
  }
});






