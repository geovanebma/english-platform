import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, Download, Mic, Volume2, BarChart3 } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const BLOCKS = [
  {
    key: "listening",
    title: "Listening",
    questions: [
      {
        id: "l1",
        type: "audio_mcq",
        prompt: "Listen and choose the correct time.",
        audioText: "The meeting starts at quarter to nine.",
        options: ["8:15", "8:45", "9:15"],
        answer: 1,
      },
      {
        id: "l2",
        type: "audio_mcq",
        prompt: "Listen and identify the meaning.",
        audioText: "I would rather stay home tonight.",
        options: ["The person prefers going out", "The person prefers staying home", "The person is unsure"],
        answer: 1,
      },
      {
        id: "l3",
        type: "audio_mcq",
        prompt: "Listen and choose the best response.",
        audioText: "Please send the summary before noon.",
        options: ["It should arrive before 12 PM.", "I sent it last week.", "Tomorrow is fine."],
        answer: 0,
      },
    ],
  },
  {
    key: "reading",
    title: "Reading",
    questions: [
      {
        id: "r1",
        type: "mcq",
        prompt: "Choose the sentence with correct grammar.",
        options: ["She don't like coffee.", "She doesn't like coffee.", "She doesn't likes coffee."],
        answer: 1,
      },
      {
        id: "r2",
        type: "mcq",
        prompt: "Best synonym for 'reliable':",
        options: ["Uncertain", "Trustworthy", "Temporary"],
        answer: 1,
      },
      {
        id: "r3",
        type: "mcq",
        prompt: "Which conclusion is the strongest?",
        options: ["The idea may work with more data.", "Everything is impossible.", "No one should ever try it."],
        answer: 0,
      },
    ],
  },
  {
    key: "speaking",
    title: "Speaking",
    questions: [
      {
        id: "s1",
        type: "speech",
        prompt: "Say a polite answer to accept a task in a formal meeting.",
        expectedPhrases: ["certainly", "i can do that", "of course"],
        reference: "Certainly, I can do that.",
      },
      {
        id: "s2",
        type: "speech",
        prompt: "Ask politely for clarification during a meeting.",
        expectedPhrases: ["could you", "clarify", "please"],
        reference: "Could you clarify that point, please?",
      },
    ],
  },
  {
    key: "writing",
    title: "Writing",
    questions: [
      {
        id: "w1",
        type: "mcq",
        prompt: "Best improved sentence:",
        options: ["I need help with this thing.", "I require assistance with this task.", "Help this now me."],
        answer: 1,
      },
      {
        id: "w2",
        type: "mcq",
        prompt: "Choose the clearest email line:",
        options: ["Send maybe later.", "Could you send the report by 4 PM today?", "Report need now"],
        answer: 1,
      },
      {
        id: "w3",
        type: "text",
        prompt: "Write one clear sentence explaining why daily practice matters.",
        expectedKeywords: ["practice", "improve"],
        reference: "Daily practice helps you improve more consistently.",
      },
    ],
  },
];

function ensureLevelTest(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.test_english_level) {
    data.modules.test_english_level = {
      last_result: null,
      attempts: 0,
      history: [],
    };
  }
  if (!Array.isArray(data.modules.test_english_level.history)) data.modules.test_english_level.history = [];
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureLevelTest(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureLevelTest(parsed);
}

function estimateCEFR(scorePercent) {
  if (scorePercent < 22) return "A1";
  if (scorePercent < 38) return "A2";
  if (scorePercent < 54) return "B1";
  if (scorePercent < 70) return "B2";
  if (scorePercent < 86) return "C1";
  return "C2";
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function levelDescription(level) {
  const map = {
    A1: "Can handle basic survival language and short familiar phrases.",
    A2: "Can manage simple daily interactions and predictable contexts.",
    B1: "Can deal with routine communication and explain familiar ideas.",
    B2: "Can interact with growing confidence in professional and academic settings.",
    C1: "Can express ideas precisely with good control and flexibility.",
    C2: "Can operate with near-native control across demanding contexts.",
  };
  return map[level] || map.A1;
}

function openPrintableReport(result) {
  const html = `
    <html>
      <head>
        <title>${getUiLabel("testlevel.report_title", "English Level Report")}</title>
        <style>
          body { font-family: Verdana, sans-serif; background: #131f24; color: #fff; padding: 28px; }
          .card { background: #0f2a3b; border-radius: 18px; padding: 22px; margin-bottom: 18px; border: 1px solid rgba(255,255,255,.08); }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
          .bar { height: 12px; background: rgba(255,255,255,.08); border-radius: 999px; overflow: hidden; margin-top: 6px; }
          .fill { height: 100%; background: #606160; }
          h1,h2,strong { color: #fff; }
          p,li,span { color: rgba(255,255,255,.84); }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${getUiLabel("testlevel.report_title", "English Level Report")}</h1>
          <p><strong>Date:</strong> ${new Date(result.finished_at || result.date).toLocaleString("pt-BR")}</p>
          <p><strong>Final Score:</strong> ${result.final_score}%</p>
          <p><strong>Estimated Level:</strong> ${result.cefr_level}</p>
          <p>${result.level_description}</p>
        </div>
        <div class="card">
          <h2>Skill Statistics</h2>
          ${Object.entries(result.skills).map(([key, val]) => `
            <div style="margin-bottom:12px;">
              <strong>${key}</strong>
              <span style="float:right;">${val}%</span>
              <div class="bar"><div class="fill" style="width:${val}%;"></div></div>
            </div>
          `).join("")}
        </div>
        <div class="card">
          <h2>Assessment Notes</h2>
          <ul>
            ${(result.insights || []).map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      </body>
    </html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

function speakText(text) {
  if (!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordScore(text, keywords = []) {
  const normalized = normalizeText(text);
  if (!keywords.length) return 0;
  const hits = keywords.filter((keyword) => normalized.includes(normalizeText(keyword))).length;
  return Math.round((hits / keywords.length) * 100);
}

export default function TestYourEnglishLevel({ setCurrentView, color = "#606160" }) {
  const [blockIndex, setBlockIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speechText, setSpeechText] = useState("");
  const [writingText, setWritingText] = useState("");
  const [speechStatus, setSpeechStatus] = useState("");
  const recognitionRef = useRef(null);
  const testStartedRef = useRef(Date.now());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        if (progress.modules.test_english_level.last_result) {
          // keep component fresh but do not auto-open previous result
        }
      } catch {
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const currentBlock = BLOCKS[blockIndex];
  const currentQuestion = currentBlock.questions[questionIndex];
  const totalQuestions = BLOCKS.reduce((acc, b) => acc + b.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const skillPercents = useMemo(() => {
    const map = {};
    BLOCKS.forEach((block) => {
      const correct = block.questions.reduce((acc, q) => {
        const val = answers[q.id];
        return acc + (typeof val === "number" ? val : 0);
      }, 0);
      map[block.key] = Math.round((correct / (block.questions.length * 100)) * 100);
    });
    return map;
  }, [answers]);

  const startSpeechCapture = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechStatus("Speech recognition is not available in this browser.");
      return;
    }
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setSpeechStatus("Listening...");
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript + " ";
      }
      setSpeechText(transcript.trim());
    };
    recognition.onerror = () => setSpeechStatus("Could not capture your voice right now.");
    recognition.onend = () => setSpeechStatus((prev) => prev || "Speech captured. Review before continuing.");
    recognitionRef.current = recognition;
    recognition.start();
  };

  const scoreCurrentQuestion = () => {
    if (currentQuestion.type === "mcq" || currentQuestion.type === "audio_mcq") {
      return selected === currentQuestion.answer ? 100 : 0;
    }
    if (currentQuestion.type === "speech") {
      return keywordScore(speechText, currentQuestion.expectedPhrases || []);
    }
    if (currentQuestion.type === "text") {
      return keywordScore(writingText, currentQuestion.expectedKeywords || []);
    }
    return 0;
  };

  const next = async (answersSnapshot) => {
    setSelected(null);
    setSpeechText("");
    setWritingText("");
    setSpeechStatus("");

    const isLastQuestionInBlock = questionIndex >= currentBlock.questions.length - 1;
    const isLastBlock = blockIndex >= BLOCKS.length - 1;

    if (!isLastQuestionInBlock) {
      setQuestionIndex((i) => i + 1);
      return;
    }

    if (!isLastBlock) {
      setBlockIndex((i) => i + 1);
      setQuestionIndex(0);
      return;
    }

    const finalSkills = {};
    BLOCKS.forEach((block) => {
      const score = block.questions.reduce((acc, q) => acc + Number(answersSnapshot[q.id] || 0), 0);
      finalSkills[block.key] = Math.round(score / block.questions.length);
    });
    const finalScore = Math.round(Object.values(finalSkills).reduce((a, b) => Number(a) + Number(b), 0) / BLOCKS.length);
    const cefr = estimateCEFR(finalScore);
    const weakest = Object.entries(finalSkills).sort((a, b) => a[1] - b[1])[0];
    const strongest = Object.entries(finalSkills).sort((a, b) => b[1] - a[1])[0];
    const finishedAt = new Date().toISOString();
    const durationSeconds = Math.max(1, Math.round((Date.now() - testStartedRef.current) / 1000));
    const finalResult = {
      date: new Date().toISOString(),
      finished_at: finishedAt,
      duration_seconds: durationSeconds,
      final_score: finalScore,
      cefr_level: cefr,
      level_description: levelDescription(cefr),
      skills: finalSkills,
      strongest_skill: strongest?.[0] || "reading",
      weakest_skill: weakest?.[0] || "reading",
      insights: [
        `Strongest area: ${strongest?.[0] || "reading"}.`,
        `Priority area: ${weakest?.[0] || "reading"}.`,
        `Assessment duration: ${Math.floor(durationSeconds / 60)}m ${String(durationSeconds % 60).padStart(2, "0")}s.`,
      ],
    };
    setResult(finalResult);

    try {
      const progress = await readProgress();
      const prevAttempts = Number(progress.modules.test_english_level.attempts || 0);
      progress.modules.test_english_level = {
        last_result: finalResult,
        attempts: prevAttempts + 1,
        history: [finalResult, ...(progress.modules.test_english_level.history || [])].slice(0, 12),
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  const verify = async () => {
    const score = scoreCurrentQuestion();
    if ((currentQuestion.type === "mcq" || currentQuestion.type === "audio_mcq") && selected === null) return;
    if (currentQuestion.type === "speech" && !speechText.trim()) return;
    if (currentQuestion.type === "text" && !writingText.trim()) return;
    const nextAnswers = { ...answers, [currentQuestion.id]: score };
    setAnswers(nextAnswers);
    await next(nextAnswers);
  };

  if (loading) {
    return (
      <section className="testlevel-shell" style={{ "--testlevel-theme": color }}>
        <div className="testlevel-card">{getUiLabel("testlevel.loading", "Loading assessment...")}</div>
      </section>
    );
  }

  if (result) {
    return (
      <section className="testlevel-shell" style={{ "--testlevel-theme": color }}>
        <header className="testlevel-head">
          <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
            <ArrowLeft size={18} />
            {getUiLabel("common.back", "Back")}
          </button>
          <div>
            <div className="testlevel-kicker">{getUiLabel("testlevel.result_kicker", "LEVEL RESULT")}</div>
            <h1>{getUiLabel("testlevel.title", "Your English Level")}</h1>
          </div>
          <ModuleGuideButton moduleKey="testlevel" color={color} />
        </header>

        <article className="testlevel-result-card">
          <h2>{getUiLabel("testlevel.final_result", "Final result")}</h2>
          <p>{getUiLabel("testlevel.final_score", "Final score")}: <strong>{result.final_score}%</strong></p>
          <p>{getUiLabel("testlevel.estimated_level", "Estimated level")}: <strong>{result.cefr_level}</strong></p>
          <p>{result.level_description}</p>

          <div className="testlevel-skill-grid">
            {Object.entries(result.skills).map(([key, val]) => (
              <div key={key} className="testlevel-skill-item">
                <span>{key}</span>
                <strong>{val}%</strong>
                <div className="testlevel-skill-mini-track">
                  <div className="testlevel-skill-mini-fill" style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="testlevel-insights-box">
            {result.insights.map((item, idx) => <p key={`${item}_${idx}`}>{item}</p>)}
          </div>

          <div className="testlevel-actions">
            <button type="button" className="testlevel-primary-btn" onClick={() => downloadJson(result, "english-level-result.json")}>
              <Download size={16} />
              {getUiLabel("testlevel.download_json", "Download JSON")}
            </button>
            <button type="button" className="testlevel-secondary-btn" onClick={() => openPrintableReport(result)}>
              {getUiLabel("testlevel.download_pdf", "Download simple PDF")}
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="testlevel-shell" style={{ "--testlevel-theme": color }}>
      <header className="testlevel-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="testlevel-kicker">{getUiLabel("testlevel.kicker", "ENGLISH LEVEL TEST")}</div>
          <h1>{getUiLabel("testlevel.assessment", "Assessment")}</h1>
        </div>
        <ModuleGuideButton moduleKey="testlevel" color={color} />
      </header>

      <article className="testlevel-card">
        <div className="testlevel-progress">
          <div className="testlevel-progress-track">
            <div className="testlevel-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span>{answeredCount}/{totalQuestions}</span>
        </div>

        <div className="testlevel-block-pill">{currentBlock.title}</div>
        <h2>{currentQuestion.prompt}</h2>

        {(currentQuestion.type === "audio_mcq") ? (
          <button type="button" className="testlevel-audio-btn" onClick={() => speakText(currentQuestion.audioText)}>
            <Volume2 size={16} />
            {getUiLabel("testlevel.listen_audio", "Listen audio")}
          </button>
        ) : null}

        {(currentQuestion.type === "mcq" || currentQuestion.type === "audio_mcq") ? (
          <div className="testlevel-options">
            {currentQuestion.options.map((opt, idx) => (
              <button
                type="button"
                key={`${currentQuestion.id}_${idx}`}
                className={`testlevel-option-btn ${selected === idx ? "is-picked" : ""}`}
                onClick={() => setSelected(idx)}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : null}

        {currentQuestion.type === "speech" ? (
          <div className="testlevel-speech-box">
            <button type="button" className="testlevel-audio-btn" onClick={startSpeechCapture}>
              <Mic size={16} />
              {getUiLabel("testlevel.speak_now", "Speak now")}
            </button>
            <textarea
              rows={4}
              value={speechText}
              onChange={(e) => setSpeechText(e.target.value)}
              placeholder={getUiLabel("testlevel.speech_placeholder", "Your speech appears here. Adjust manually if needed.")}
            />
            <em>{speechStatus || `${getUiLabel("testlevel.model", "Model")}: ${currentQuestion.reference}`}</em>
          </div>
        ) : null}

        {currentQuestion.type === "text" ? (
          <div className="testlevel-speech-box">
            <textarea
              rows={4}
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder={getUiLabel("testlevel.write_placeholder", "Write your answer here...")}
            />
            <em>{getUiLabel("testlevel.model", "Model")}: {currentQuestion.reference}</em>
          </div>
        ) : null}

        <div className="testlevel-actions">
          <button
            type="button"
            className="testlevel-primary-btn"
            onClick={verify}
            disabled={
              (currentQuestion.type === "mcq" || currentQuestion.type === "audio_mcq")
                ? selected === null
                : currentQuestion.type === "speech"
                ? !speechText.trim()
                : !writingText.trim()
            }
          >
            {getUiLabel("translation.check", "Check")}
          </button>
        </div>

        <div className="testlevel-skill-preview">
          <span>{getUiLabel("module.listening", "Listening")} {skillPercents.listening || 0}%</span>
          <span>{getUiLabel("module.reading", "Reading")} {skillPercents.reading || 0}%</span>
          <span>{getUiLabel("module.pronounce", "Speaking")} {skillPercents.speaking || 0}%</span>
          <span>{getUiLabel("module.writing", "Writing")} {skillPercents.writing || 0}%</span>
        </div>
      </article>
    </section>
  );
}


