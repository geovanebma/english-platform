import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, CheckCircle2, XCircle, BookOpen, Plus } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const PASSAGES = [
  {
    id: "reading_b1_daily",
    level: "Beginner",
    theme: "Daily Routine",
    title: "A Productive Morning",
    passage:
      "Emma wakes up at 6:30 every day. She drinks water, stretches for ten minutes, and writes a short to-do list. After breakfast, she studies English for thirty minutes before work. She believes that small habits make a big difference over time.",
    questions: [
      {
        id: "q1",
        type: "mcq",
        text: "What does Emma do before work?",
        options: [
          "She studies English for thirty minutes.",
          "She goes back to sleep.",
          "She watches TV for one hour.",
        ],
        correct: 0,
      },
      {
        id: "q2",
        type: "tf",
        text: "Emma thinks small habits are important.",
        options: ["True", "False"],
        correct: 0,
      },
      {
        id: "q3",
        type: "mcq",
        text: "How long does she stretch?",
        options: ["Five minutes", "Ten minutes", "Thirty minutes"],
        correct: 1,
      },
    ],
  },
  {
    id: "reading_i1_work",
    level: "Intermediate",
    theme: "Work Communication",
    title: "Clear Project Updates",
    passage:
      "When Leo gives project updates, he starts with what was completed, then explains current blockers, and finishes with the next action. His team says this structure saves time because everyone understands priorities quickly.",
    questions: [
      {
        id: "q1",
        type: "mcq",
        text: "Why does Leo's team like his updates?",
        options: [
          "Because they are very long.",
          "Because they quickly show priorities.",
          "Because they avoid next actions.",
        ],
        correct: 1,
      },
      {
        id: "q2",
        type: "tf",
        text: "Leo ends his updates with the next action.",
        options: ["True", "False"],
        correct: 0,
      },
      {
        id: "q3",
        type: "mcq",
        text: "What is mentioned as part of his structure?",
        options: ["Weekend plans", "Current blockers", "Hiring process"],
        correct: 1,
      },
    ],
  },
  {
    id: "reading_i2_travel",
    level: "Intermediate",
    theme: "Travel",
    title: "Missed Train, Better Plan",
    passage:
      "Nina missed her train because she arrived two minutes late. Instead of panicking, she checked the next schedule, informed her host, and used the waiting time to review useful travel phrases. The delay became a learning opportunity.",
    questions: [
      {
        id: "q1",
        type: "tf",
        text: "Nina panicked after missing the train.",
        options: ["True", "False"],
        correct: 1,
      },
      {
        id: "q2",
        type: "mcq",
        text: "What did she do while waiting?",
        options: ["She took a nap.", "She reviewed travel phrases.", "She canceled her trip."],
        correct: 1,
      },
      {
        id: "q3",
        type: "mcq",
        text: "What is the main idea?",
        options: [
          "Small delays can still be used productively.",
          "Travel is always stressful.",
          "Schedules are never useful.",
        ],
        correct: 0,
      },
    ],
  },
];

const GLOSSARY = {
  productive: {
    meaning_en: "Able to produce useful results.",
    meaning_pt: "Capaz de gerar resultados uteis.",
    example: "A productive routine helps you learn faster.",
  },
  routine: {
    meaning_en: "A usual sequence of actions done regularly.",
    meaning_pt: "Sequencia habitual de acoes feitas regularmente.",
    example: "My morning routine starts with water and reading.",
  },
  habits: {
    meaning_en: "Behaviors that you do often and regularly.",
    meaning_pt: "Comportamentos repetidos com frequencia.",
    example: "Small habits can create big progress.",
  },
  blockers: {
    meaning_en: "Problems that stop progress.",
    meaning_pt: "Problemas que bloqueiam o progresso.",
    example: "We discuss blockers at the start of the meeting.",
  },
  priorities: {
    meaning_en: "Things that are most important now.",
    meaning_pt: "Coisas mais importantes no momento.",
    example: "Clear priorities reduce wasted time.",
  },
  schedule: {
    meaning_en: "A plan of times and activities.",
    meaning_pt: "Planejamento de horarios e atividades.",
    example: "She checked the train schedule quickly.",
  },
  delay: {
    meaning_en: "A period of waiting when something is late.",
    meaning_pt: "Periodo de espera por atraso.",
    example: "The delay became a learning opportunity.",
  },
  opportunity: {
    meaning_en: "A good chance to do something.",
    meaning_pt: "Uma boa chance para fazer algo.",
    example: "Every mistake is an opportunity to improve.",
  },
};

function normalizeWord(raw) {
  return String(raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

function ensureReading(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
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
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureReading(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureReading(parsed);
}

async function readWikiWordsText() {
  const candidates = ["/wiki-100k.txt", "/src/data/wiki-100k.txt"];
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      if (text?.trim()) return text;
    } catch {
      // try next
    }
  }
  return "";
}

function splitPassageTokens(passage) {
  const matches = String(passage || "").match(/\w+|[^\w\s]+|\s+/g);
  if (!matches) return [];
  return matches.map((token, idx) => {
    const normalized = normalizeWord(token);
    const isWord = /^[a-z]+$/.test(normalized);
    return {
      id: `${idx}_${token}`,
      raw: token,
      normalized,
      isWord,
    };
  });
}

function speakWord(text, lang = "en-US") {
  if (!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export default function ReadingComprehension({ setCurrentView, color = "#b01766" }) {
  const [stage, setStage] = useState("list");
  const [selectedPassageId, setSelectedPassageId] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({
    completed_passages: [],
    best_scores: {},
    attempts: {},
    last_passage_id: null,
    glossary_saved_words: [],
  });
  const [selectedWord, setSelectedWord] = useState(null);
  const [glossaryMessage, setGlossaryMessage] = useState("");
  const wikiIndexRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        setStats(progress.modules.reading_comprehension);
      } catch {
        if (!mounted) return;
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedPassage = useMemo(
    () => PASSAGES.find((p) => p.id === selectedPassageId) || null,
    [selectedPassageId]
  );

  const passageTokens = useMemo(
    () => splitPassageTokens(selectedPassage?.passage || ""),
    [selectedPassage?.passage]
  );

  const currentQuestion = useMemo(
    () => selectedPassage?.questions?.[questionIndex] || null,
    [selectedPassage, questionIndex]
  );

  const totalQuestions = selectedPassage?.questions?.length || 0;
  const progressPercent = totalQuestions ? Math.round((questionIndex / totalQuestions) * 100) : 0;

  const selectedGlossaryEntry = useMemo(() => {
    if (!selectedWord) return null;
    return (
      GLOSSARY[selectedWord] || {
        meaning_en: `Definition for "${selectedWord}" is not in the quick glossary yet.`,
        meaning_pt: `Definicao de "${selectedWord}" ainda nao cadastrada no glossario rapido.`,
        example: `Try using "${selectedWord}" in a short sentence.`,
      }
    );
  }, [selectedWord]);

  const selectedWordSaved = useMemo(() => {
    if (!selectedWord) return false;
    const saved = Array.isArray(stats.glossary_saved_words) ? stats.glossary_saved_words : [];
    return saved.includes(selectedWord);
  }, [selectedWord, stats.glossary_saved_words]);

  const relatedGlossaryWords = useMemo(() => {
    if (!selectedWord) return [];
    const seen = new Set();
    return passageTokens
      .filter((token) => token.isWord && token.normalized !== selectedWord && GLOSSARY[token.normalized])
      .map((token) => token.normalized)
      .filter((word) => {
        if (seen.has(word)) return false;
        seen.add(word);
        return true;
      })
      .slice(0, 4);
  }, [passageTokens, selectedWord]);

  const openPassage = (id) => {
    setSelectedPassageId(id);
    setQuestionIndex(0);
    setAnswers({});
    setFeedback(null);
    setResult(null);
    setSelectedWord(null);
    setGlossaryMessage("");
    setStage("quiz");
  };

  const pickAnswer = (optionIndex) => {
    if (!currentQuestion) return;
    const isCorrect = optionIndex === currentQuestion.correct;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
    setFeedback({
      correct: isCorrect,
      text: isCorrect ? getUiLabel("reading.correct", "Correct! Great reading.") : getUiLabel("reading.wrong", "Incorrect answer. Review the passage and try again."),
    });
  };

  const saveWordToVocabulary = async () => {
    if (!selectedWord) return;
    setGlossaryMessage(getUiLabel("reading.saving", "Saving..."));
    try {
      const progress = await readProgress();
      const normalizedWord = normalizeWord(selectedWord);
      const readableWord = selectedWord.charAt(0).toUpperCase() + selectedWord.slice(1).toLowerCase();

      const readingBlock = progress.modules.reading_comprehension;
      const currentGlossary = Array.isArray(readingBlock.glossary_saved_words)
        ? readingBlock.glossary_saved_words
        : [];
      if (!currentGlossary.includes(normalizedWord)) {
        readingBlock.glossary_saved_words = [...currentGlossary, normalizedWord].slice(-200);
      }

      if (!wikiIndexRef.current) {
        const raw = await readWikiWordsText();
        const words = raw
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((word) => normalizeWord(word));
        wikiIndexRef.current = new Map();
        words.forEach((word, index) => {
          if (!wikiIndexRef.current.has(word)) {
            wikiIndexRef.current.set(word, index + 1);
          }
        });
      }

      const vocabModule = progress.modules.my_vocabulary || {};
      const vocabRoot = progress.my_vocabulary || {};
      const currentIds = [
        ...(Array.isArray(vocabModule.learned_word_ids) ? vocabModule.learned_word_ids : []),
        ...(Array.isArray(vocabRoot.learned_word_ids) ? vocabRoot.learned_word_ids : []),
      ]
        .map((id) => Number(id))
        .filter(Number.isFinite);
      const idsSet = new Set(currentIds);

      const possibleRank = wikiIndexRef.current.get(normalizedWord);
      if (possibleRank) idsSet.add(possibleRank);
      const mergedIds = [...idsSet].sort((a, b) => a - b);

      const customSaved = Array.isArray(vocabModule.saved_words_custom)
        ? vocabModule.saved_words_custom
        : [];
      const customExists = customSaved.some((entry) => normalizeWord(entry.word) === normalizedWord);
      const nextCustom = customExists
        ? customSaved
        : [
            {
              word: readableWord,
              source: "reading_glossary",
              added_at: new Date().toISOString(),
            },
            ...customSaved,
          ].slice(0, 400);

      const csvBase = Array.from(
        new Set(
          String(vocabModule.learned_words_csv || vocabRoot.learned_words_csv || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );
      if (!csvBase.includes(readableWord)) csvBase.push(readableWord);
      const csv = csvBase.join(",");

      const nextVocabulary = {
        ...vocabRoot,
        ...vocabModule,
        learned_word_ids: mergedIds,
        learned_word_ranks: mergedIds,
        learned_words: mergedIds.length,
        saved_words: mergedIds.length,
        learned_words_csv: csv,
        saved_words_custom: nextCustom,
      };
      progress.modules.my_vocabulary = { ...nextVocabulary };
      progress.my_vocabulary = { ...nextVocabulary };

      const saved = await writeProgress(progress);
      setStats(saved.modules.reading_comprehension);
      setGlossaryMessage(getUiLabel("reading.saved", "\"{word}\" saved to vocabulary.").replace("{word}", readableWord));
    } catch {
      setGlossaryMessage(getUiLabel("reading.save_error", "Failed to save word to vocabulary."));
    }
  };

  const nextQuestion = async () => {
    if (!selectedPassage || !currentQuestion) return;
    setFeedback(null);
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex((i) => i + 1);
      return;
    }

    const correctCount = selectedPassage.questions.reduce((acc, q) => {
      return acc + (answers[q.id] === q.correct ? 1 : 0);
    }, 0);
    const percent = Math.round((correctCount / totalQuestions) * 100);
    const nextResult = { correctCount, totalQuestions, percent };
    setResult(nextResult);
    setStage("result");

    try {
      const progress = await readProgress();
      const block = progress.modules.reading_comprehension || {};
      const completed = new Set(block.completed_passages || []);
      completed.add(selectedPassage.id);

      const bestScores = { ...(block.best_scores || {}) };
      bestScores[selectedPassage.id] = Math.max(bestScores[selectedPassage.id] || 0, percent);

      const attempts = { ...(block.attempts || {}) };
      attempts[selectedPassage.id] = (attempts[selectedPassage.id] || 0) + 1;

      progress.modules.reading_comprehension = {
        ...block,
        completed_passages: [...completed],
        best_scores: bestScores,
        attempts,
        last_passage_id: selectedPassage.id,
      };
      const saved = await writeProgress(progress);
      setStats(saved.modules.reading_comprehension);
    } catch {
      // no-op
    }
  };

  return (
    <section className="reading-shell" style={{ "--reading-theme": color }}>
      <header className="reading-head">
        <button
          type="button"
          className="duo-back-btn"
          onClick={() => {
            if (stage === "list") setCurrentView("initial");
            else setStage("list");
          }}
        >
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="reading-kicker">READING COMPREHENSION</div>
          <h1>Reading</h1>
        </div>
              <ModuleGuideButton moduleKey="reading" color={color} />
</header>

      {stage === "list" && (
        <div className="reading-list">
          {PASSAGES.map((p, idx) => {
            const best = stats.best_scores?.[p.id] || 0;
            const done = (stats.completed_passages || []).includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                className={`reading-card ${idx % 2 ? "offset-right" : "offset-left"}`}
                onClick={() => openPassage(p.id)}
              >
                <span className="reading-card-title">{p.title}</span>
                <span className="reading-card-sub">
                  {p.level} | {p.theme}
                </span>
                <span className="reading-card-meta">
                  {done ? getUiLabel("reading.completed", "Completed") : getUiLabel("reading.new", "New")} | {getUiLabel("reading.best", "Best")}: {best}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {stage === "quiz" && selectedPassage && currentQuestion && (
        <article className="reading-quiz">
          <div className="reading-progress">
            <div className="reading-progress-track">
              <div className="reading-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span>
              {questionIndex + 1}/{totalQuestions}
            </span>
          </div>

          <h2>{selectedPassage.title}</h2>
          <p className="reading-passage">
            {passageTokens.map((token) => {
              if (!token.isWord) {
                return <span key={token.id}>{token.raw}</span>;
              }
              const isActive = selectedWord === token.normalized;
              return (
                <button
                  key={token.id}
                  type="button"
                  className={`reading-word-btn ${isActive ? "is-active" : ""}`}
                  onClick={() => {
                    setSelectedWord((prev) => (prev === token.normalized ? null : token.normalized));
                    setGlossaryMessage("");
                  }}
                >
                  {token.raw}
                </button>
              );
            })}
          </p>

          {selectedWord ? (
            <section className="reading-glossary-card">
              <div className="reading-glossary-head">
                <strong>{selectedWord}</strong>
                <span>
                  <BookOpen size={14} />
                  {getUiLabel("reading.glossary", "Contextual glossary")}
                </span>
                <button type="button" className="reading-glossary-sound" onClick={() => speakWord(selectedWord, "en-US")}>
                  {getUiLabel("reading.listen", "Listen")}
                </button>
              </div>
              <p>
                <b>EN:</b> {selectedGlossaryEntry?.meaning_en}
              </p>
              <p>
                <b>PT:</b> {selectedGlossaryEntry?.meaning_pt}
              </p>
              <p>
                <b>{getUiLabel("reading.example", "Example")}: </b> {selectedGlossaryEntry?.example}
              </p>
              {relatedGlossaryWords.length ? (
                <div className="reading-glossary-related">
                  {relatedGlossaryWords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      className="reading-related-chip"
                      onClick={() => {
                        setSelectedWord(word);
                        setGlossaryMessage("");
                      }}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              ) : null}
              <button type="button" onClick={saveWordToVocabulary} disabled={selectedWordSaved}>
                <Plus size={14} />
                {selectedWordSaved ? getUiLabel("reading.saved_already", "Already saved") : getUiLabel("reading.save_vocab", "Save to vocabulary")}
              </button>
              {glossaryMessage ? <em>{glossaryMessage}</em> : null}
            </section>
          ) : null}

          <h3>{currentQuestion.text}</h3>
          <div className="reading-options">
            {currentQuestion.options.map((opt, idx) => (
              <button
                type="button"
                key={opt}
                className={`reading-option ${answers[currentQuestion.id] === idx ? "is-picked" : ""}`}
                onClick={() => pickAnswer(idx)}
              >
                {opt}
              </button>
            ))}
          </div>

          {feedback && (
            <div className={`reading-feedback ${feedback.correct ? "is-correct" : "is-wrong"}`}>
              {feedback.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="reading-actions">
            <button
              type="button"
              className="reading-next-btn"
              onClick={nextQuestion}
              disabled={typeof answers[currentQuestion.id] !== "number"}
            >
              {questionIndex < totalQuestions - 1 ? getUiLabel("common.next", "Next") : getUiLabel("common.finish", "Finish")}
            </button>
          </div>
        </article>
      )}

      {stage === "result" && result && selectedPassage && (
        <article className="reading-result">
          <h2>{getUiLabel("reading.final_result", "Final result")}</h2>
          <p>
            Voce acertou <strong>{result.correctCount}</strong> de <strong>{result.totalQuestions}</strong>{" "}
            perguntas.
          </p>
          <p className="reading-result-score">{result.percent}%</p>
          <div className="reading-actions">
            <button type="button" className="reading-next-btn" onClick={() => openPassage(selectedPassage.id)}>
              {getUiLabel("reading.retry", "Retry passage")}
            </button>
            <button type="button" className="reading-secondary-btn" onClick={() => setStage("list")}>
              {getUiLabel("common.back_to_themes", "Back to themes")}
            </button>
          </div>
        </article>
      )}
    </section>
  );
}





