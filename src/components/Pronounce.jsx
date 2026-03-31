import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, Volume2, Mic, MicOff } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const EXERCISES = [
  { id: "p1", type: "consonant", prompt: "dock", options: ["dock", "deck"], correct: 0 },
  { id: "p2", type: "vowel", prompt: "ship", options: ["sheep", "ship"], correct: 1 },
  { id: "p3", type: "vowel", prompt: "full", options: ["full", "fool"], correct: 0 },
  { id: "p4", type: "consonant", prompt: "bat", options: ["pat", "bat"], correct: 1 },
  { id: "p5", type: "consonant", prompt: "zoo", options: ["zoo", "sue"], correct: 0 },
  { id: "p6", type: "vowel", prompt: "cat", options: ["cut", "cat"], correct: 1 },
];

const PHONETIC_GUIDE = {
  dock: {
    ipa: "/dak/",
    phonemes: ["d", "o", "k"],
    mouthKey: "pronounce.mouth.dock",
    mouthFallback: "Touch the tongue behind the teeth for /d/ and close with /k/.",
  },
  ship: {
    ipa: "/shIp/",
    phonemes: ["sh", "i", "p"],
    mouthKey: "pronounce.mouth.ship",
    mouthFallback: "Lips slightly rounded for /sh/ and a short /i/ vowel.",
  },
  full: {
    ipa: "/ful/",
    phonemes: ["f", "u", "l"],
    mouthKey: "pronounce.mouth.full",
    mouthFallback: "Teeth on the lower lip for /f/ and a short /u/ with rounded lips.",
  },
  bat: {
    ipa: "/baet/",
    phonemes: ["b", "ae", "t"],
    mouthKey: "pronounce.mouth.bat",
    mouthFallback: "Open the mouth wider on /ae/ and finish with a crisp /t/.",
  },
  zoo: {
    ipa: "/zu/",
    phonemes: ["z", "u"],
    mouthKey: "pronounce.mouth.zoo",
    mouthFallback: "Use voiced vibration on /z/ and keep /u/ long and clear.",
  },
  cat: {
    ipa: "/kaet/",
    phonemes: ["k", "ae", "t"],
    mouthKey: "pronounce.mouth.cat",
    mouthFallback: "Start with a back /k/, open on /ae/, and end with a short /t/.",
  },
};

const PHONEME_REGEX = {
  sh: /(sh|ch|s)/,
  ae: /(a|ae|ah|e)/,
  i: /(i|ih|ee|y)/,
  u: /(u|oo|ou)/,
  d: /d/,
  k: /(k|c|ck|q)/,
  p: /p/,
  b: /b/,
  f: /f/,
  l: /l/,
  t: /t/,
  z: /z/,
  o: /(o|aw|a)/,
};

function ensurePronounce(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
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
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensurePronounce(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensurePronounce(parsed);
}

function speakWord(word, lang = "en-US") {
  if (!window.speechSynthesis || !word) return;
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = lang;
  utter.rate = 0.92;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function normalizeWord(word) {
  return String(word || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

function levenshtein(a, b) {
  const x = normalizeWord(a);
  const y = normalizeWord(b);
  const matrix = Array.from({ length: x.length + 1 }, () => Array(y.length + 1).fill(0));
  for (let i = 0; i <= x.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= y.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= x.length; i += 1) {
    for (let j = 1; j <= y.length; j += 1) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[x.length][y.length];
}

function scorePhonetic(targetWord, transcript, getLabel) {
  const t = typeof getLabel === "function" ? getLabel : (key, fallback) => fallback;
  const target = normalizeWord(targetWord);
  const spokenRaw = String(transcript || "").trim();
  const spokenTokens = spokenRaw
    .split(/\s+/)
    .map((token) => normalizeWord(token))
    .filter(Boolean);
  const spoken = spokenTokens.length ? spokenTokens[0] : "";

  const maxLen = Math.max(1, target.length, spoken.length);
  const distance = levenshtein(target, spoken || target);
  const similarityScore = Math.max(0, Math.round((1 - distance / maxLen) * 100));

  const guide = PHONETIC_GUIDE[target] || null;
  let phonemeScore = 0;
  let misses = [];
  if (guide) {
    const checks = guide.phonemes.map((phoneme) => {
      const matcher = PHONEME_REGEX[phoneme];
      if (!matcher) return false;
      return matcher.test(spoken);
    });
    const phonemeChecks = guide.phonemes.map((phoneme, idx) => ({
      phoneme,
      ok: !!checks[idx],
      tip: guide.phonemeTips?.[phoneme] || guide.mouthFallback,
    }));

    const hits = checks.filter(Boolean).length;
    phonemeScore = Math.round((hits / Math.max(1, checks.length)) * 100);
    misses = guide.phonemes.filter((_, idx) => !checks[idx]);
    void phonemeChecks;
  }

  const finalScore = Math.round(similarityScore * 0.65 + phonemeScore * 0.35);
  const tipBase = guide
    ? t(guide.mouthKey, guide.mouthFallback)
    : t(
        "pronounce.tip.default",
        "Speak slower, open your mouth on the vowel core, and finish the consonant."
      );
  const focus = t("pronounce.tip.focus", "Focus on phonemes: {phonemes}.").replace(
    "{phonemes}",
    misses.join(", ")
  );
  const tip = misses.length > 0 ? `${tipBase} ${focus}` : tipBase;

  return {
    score: Number.isFinite(finalScore) ? finalScore : 0,
    ipa: guide?.ipa || "",
    misses,
    mouthTip: tip,
    spoken: spokenRaw || "-",
  };
}

export default function Pronounce({ setCurrentView, color = "#c80054" }) {
  const [stage, setStage] = useState("home");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [answers, setAnswers] = useState({});
  const [speechScores, setSpeechScores] = useState({});
  const [transcript, setTranscript] = useState("");
  const [listeningMic, setListeningMic] = useState(false);
  const [speechUnsupported, setSpeechUnsupported] = useState(false);
  const [vowelProgress, setVowelProgress] = useState(0);
  const [consonantProgress, setConsonantProgress] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [lastPhonemeScore, setLastPhonemeScore] = useState(0);
  const [lastMouthTip, setLastMouthTip] = useState("");
  const [learningLanguage, setLearningLanguage] = useState("en-US");
  const recognitionRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const p = progress.modules.pronounce;
        setVowelProgress(Number(p.vowel_progress || 0));
        setConsonantProgress(Number(p.consonant_progress || 0));
        setSessionsCompleted(Number(p.sessions_completed || 0));
        setLastPhonemeScore(Number(p.last_phoneme_score || 0));
        setLastMouthTip(p.last_mouth_tip || "");
        setLearningLanguage(progress?.languages?.learning_language || "en-US");
      } catch {
        if (!mounted) return;
      }
    })();
    return () => {
      mounted = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // no-op
        }
      }
    };
  }, []);

  const current = EXERCISES[idx];
  const progressPercent = Math.round((idx / EXERCISES.length) * 100);
  const currentSpeech = speechScores[current?.id] || null;
  const canContinue = selected !== null && (currentSpeech || speechUnsupported);

  const start = () => {
    setIdx(0);
    setSelected(null);
    setFeedback(null);
    setAnswers({});
    setSpeechScores({});
    setTranscript("");
    setStage("session");
    setTimeout(() => speakWord(EXERCISES[0].prompt, learningLanguage), 120);
  };

  const choose = (optionIdx) => {
    setSelected(optionIdx);
    const isCorrect = optionIdx === current.correct;
    setFeedback(isCorrect ? "correct" : "wrong");
    setAnswers((prev) => ({ ...prev, [current.id]: isCorrect }));
  };

  const evaluateTranscript = (spokenText) => {
    const result = scorePhonetic(current.prompt, spokenText, getUiLabel);
    setSpeechScores((prev) => ({ ...prev, [current.id]: result }));
  };

  const startSpeaking = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechUnsupported(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = learningLanguage || "en-US";
      recognition.maxAlternatives = 1;
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setListeningMic(true);
      };

      recognition.onresult = (event) => {
        const text = event?.results?.[0]?.[0]?.transcript || "";
        setTranscript(text);
        evaluateTranscript(text);
      };

      recognition.onerror = () => {
        setListeningMic(false);
      };

      recognition.onend = () => {
        setListeningMic(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechUnsupported(true);
    }
  };

  const next = async () => {
    if (!current) return;
    const isLast = idx >= EXERCISES.length - 1;
    if (!isLast) {
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      setSelected(null);
      setFeedback(null);
      setTranscript("");
      setSpeechUnsupported(false);
      setTimeout(() => speakWord(EXERCISES[nextIdx].prompt, learningLanguage), 120);
      return;
    }

    const summary = EXERCISES.reduce(
      (acc, ex) => {
        const ok = !!answers[ex.id];
        const speech = speechScores[ex.id];
        const speechOk = Number(speech?.score || 0) >= 70;
        const speechScore = Number(speech?.score || 0);
        if (ex.type === "vowel" && ok) acc.vowelsCorrect += 1;
        if (ex.type === "consonant" && ok) acc.consonantsCorrect += 1;
        if (ok) acc.totalCorrect += 1;
        if (ex.type === "vowel" && speechOk) acc.vowelsSpeech += 1;
        if (ex.type === "consonant" && speechOk) acc.consonantsSpeech += 1;
        acc.totalSpeech += speechScore;
        if (speech?.mouthTip && speechScore < acc.lowestSpeechScore) {
          acc.lowestSpeechScore = speechScore;
          acc.lowestTip = speech.mouthTip;
        }
        return acc;
      },
      {
        vowelsCorrect: 0,
        consonantsCorrect: 0,
        totalCorrect: 0,
        vowelsSpeech: 0,
        consonantsSpeech: 0,
        totalSpeech: 0,
        lowestSpeechScore: 999,
        lowestTip: "",
      }
    );

    const avgSpeechScore = Math.round(summary.totalSpeech / Math.max(1, EXERCISES.length));
    const vowelGain = summary.vowelsCorrect * 6 + summary.vowelsSpeech * 4;
    const consonantGain = summary.consonantsCorrect * 6 + summary.consonantsSpeech * 4;
    const nextVowels = Math.min(100, vowelProgress + vowelGain);
    const nextConsonants = Math.min(100, consonantProgress + consonantGain);
    const listeningAccuracy = Math.round((summary.totalCorrect / EXERCISES.length) * 100);
    const keepTraining = getUiLabel(
      "pronounce.tip.keep_training",
      "Keep training minimal pairs and recording your speech."
    );

    setVowelProgress(nextVowels);
    setConsonantProgress(nextConsonants);
    setSessionsCompleted((n) => n + 1);
    setLastPhonemeScore(avgSpeechScore);
    setLastMouthTip(summary.lowestTip || keepTraining);
    setStage("home");

    try {
      const progress = await readProgress();
      progress.modules.pronounce = {
        vowel_progress: nextVowels,
        consonant_progress: nextConsonants,
        sessions_completed: Number(progress.modules.pronounce.sessions_completed || 0) + 1,
        last_accuracy: listeningAccuracy,
        last_phoneme_score: avgSpeechScore,
        last_mouth_tip: summary.lowestTip || keepTraining,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  const vowelCards = useMemo(
    () => [
      { label: "ae", word: "cat", value: vowelProgress },
      { label: "i", word: "ship", value: vowelProgress },
      { label: "u", word: "food", value: vowelProgress },
    ],
    [vowelProgress]
  );

  const consonantCards = useMemo(
    () => [
      { label: "b/p", word: "bat", value: consonantProgress },
      { label: "d/t", word: "dock", value: consonantProgress },
      { label: "z/s", word: "zoo", value: consonantProgress },
    ],
    [consonantProgress]
  );

  return (
    <section className="pronounce-shell" style={{ "--pronounce-theme": color }}>
      <header className="pronounce-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="pronounce-kicker">{getUiLabel("pronounce.kicker", "PRONUNCIATION LAB")}</div>
          <h1>{getUiLabel("module.pronounce", "Pronounce")}</h1>
        </div>
        <ModuleGuideButton moduleKey="pronounce" color={color} />
      </header>

      {stage === "home" && (
        <div className="pronounce-home">
          <h2>{getUiLabel("pronounce.title", "Learn English sounds")}</h2>
          <p>
            {getUiLabel(
              "pronounce.subtitle",
              "Train your ear, speak, and receive phonetic scores per session."
            )}
          </p>
          <button type="button" className="pronounce-start-btn" onClick={start}>
            {getUiLabel("pronounce.start", "Start")}
          </button>

          <div className="pronounce-summary">
            {getUiLabel("pronounce.sessions_done", "Sessions completed")}: {sessionsCompleted}
          </div>
          <div className="pronounce-summary">
            {getUiLabel("pronounce.last_score", "Last phonetic score")}: {lastPhonemeScore}%
          </div>
          {lastMouthTip ? <div className="pronounce-mouth-tip">{lastMouthTip}</div> : null}

          <h3>{getUiLabel("pronounce.vowels", "Vowels")}</h3>
          <div className="pronounce-grid">
            {vowelCards.map((c) => (
              <article key={c.label} className="pronounce-card">
                <strong>{c.label}</strong>
                <span>{c.word}</span>
                <div className="pronounce-mini-track">
                  <div className="pronounce-mini-fill" style={{ width: `${c.value}%` }} />
                </div>
              </article>
            ))}
          </div>

          <h3>{getUiLabel("pronounce.consonants", "Consonants")}</h3>
          <div className="pronounce-grid">
            {consonantCards.map((c) => (
              <article key={c.label} className="pronounce-card">
                <strong>{c.label}</strong>
                <span>{c.word}</span>
                <div className="pronounce-mini-track">
                  <div className="pronounce-mini-fill" style={{ width: `${c.value}%` }} />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {stage === "session" && current && (
        <article className="pronounce-session">
          <div className="pronounce-session-progress">
            <div className="pronounce-session-track">
              <div className="pronounce-session-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span>
              {idx + 1}/{EXERCISES.length}
            </span>
          </div>

          <h2>{getUiLabel("pronounce.prompt", "What do you hear?")}</h2>
          <button
            type="button"
            className="pronounce-audio-btn"
            onClick={() => speakWord(current.prompt, learningLanguage)}
          >
            <Volume2 size={34} />
          </button>

          <div className="pronounce-options">
            {current.options.map((opt, i) => (
              <button
                type="button"
                key={opt}
                className={`pronounce-option ${selected === i ? "is-picked" : ""}`}
                onClick={() => choose(i)}
              >
                {opt}
              </button>
            ))}
          </div>

          {feedback && (
            <div className={`pronounce-feedback ${feedback === "correct" ? "is-correct" : "is-wrong"}`}>
              {feedback === "correct"
                ? getUiLabel("pronounce.correct", "Correct answer!")
                : getUiLabel("pronounce.wrong", "Almost. Try again next one.")}
            </div>
          )}

          <section className="pronounce-speaking-box">
            <div className="pronounce-speaking-head">
              <strong>
                {getUiLabel("pronounce.say_word", "Say the word")}: {current.prompt}
              </strong>
              <span>{PHONETIC_GUIDE[current.prompt]?.ipa || ""}</span>
            </div>
            <div className="pronounce-speaking-actions">
              <button type="button" onClick={startSpeaking} disabled={listeningMic}>
                {listeningMic ? <MicOff size={16} /> : <Mic size={16} />}
                {listeningMic
                  ? getUiLabel("pronounce.listening", "Listening...")
                  : getUiLabel("pronounce.record", "Record voice")}
              </button>
              <button type="button" className="is-light" onClick={() => evaluateTranscript(current.prompt)}>
                {getUiLabel("pronounce.simulate", "Simulate ideal")}
              </button>
            </div>
            {speechUnsupported ? (
              <p className="pronounce-speaking-note">
                {getUiLabel(
                  "pronounce.unsupported",
                  "Web Speech API is not available in this browser. You can continue without speech scoring."
                )}
              </p>
            ) : null}
            {transcript ? (
              <p className="pronounce-speaking-note">
                {getUiLabel("pronounce.you_said", "You said")}: "{transcript}"
              </p>
            ) : null}

            {currentSpeech ? (
              <div className="pronounce-phonetic-result">
                <div className="pronounce-phonetic-track">
                  <div
                    className="pronounce-phonetic-fill"
                    style={{ width: `${Math.max(0, Math.min(100, currentSpeech.score))}%` }}
                  />
                  <span>{currentSpeech.score}%</span>
                </div>
                <p>
                  {getUiLabel("pronounce.mouth_tip", "Mouth tip")}: {currentSpeech.mouthTip}
                </p>
                <em>
                  {getUiLabel("pronounce.phonemes", "Focused phonemes")}: {(PHONETIC_GUIDE[current.prompt]?.phonemes || []).join(", ") || "-"}
                </em>
              </div>
            ) : null}
          </section>

          <button
            type="button"
            className="pronounce-next-btn"
            onClick={next}
            disabled={!canContinue}
          >
            {idx < EXERCISES.length - 1
              ? getUiLabel("common.continue", "Continue")
              : getUiLabel("common.finish", "Finish")}
          </button>
        </article>
      )}
    </section>
  );
}
