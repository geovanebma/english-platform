import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Send, Volume2 } from "lucide-react";

const MAX_HISTORY = 50;

function analyzeText(text) {
  const raw = (text || "").trim();
  if (!raw) {
    return {
      corrected: "",
      improved: "",
      explanation:
        "Write a complete sentence so I can analyze grammar, vocabulary, and context.",
      metrics: { grammar: 0, vocabulary: 0, context: 0, clarity: 0 },
    };
  }

  let corrected = raw.replace(/\s+/g, " ");
  corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
  if (!/[.!?]$/.test(corrected)) corrected += ".";

  const replacements = [
    { from: /\bvery good\b/gi, to: "excellent" },
    { from: /\bvery bad\b/gi, to: "terrible" },
    { from: /\bbig\b/gi, to: "substantial" },
    { from: /\bnice\b/gi, to: "valuable" },
    { from: /\bthing\b/gi, to: "aspect" },
    { from: /\bhelp\b/gi, to: "assist" },
  ];

  let improved = corrected;
  replacements.forEach((rule) => {
    improved = improved.replace(rule.from, rule.to);
  });

  const grammar =
    corrected === raw ? 85 : 92;
  const vocabulary = improved === corrected ? 78 : 90;
  const context =
    corrected.length > 45 ? 88 : 72;
  const clarity =
    corrected.split(" ").length >= 8 ? 89 : 74;

  const explanation = [
    `Correction: "${corrected}"`,
    `Better wording: "${improved}"`,
    "Context tip: add concrete details (time, place, purpose) to sound more natural.",
  ].join("\n");

  return {
    corrected,
    improved,
    explanation,
    metrics: { grammar, vocabulary, context, clarity },
  };
}

function ensureModern(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
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
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureModern(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureModern(parsed);
}

function speakText(text, lang = "en-US") {
  if (!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function averageMetrics(items) {
  if (!items.length) {
    return { grammar: 0, vocabulary: 0, context: 0, clarity: 0 };
  }
  const sum = items.reduce(
    (acc, it) => {
      acc.grammar += it.metrics?.grammar || 0;
      acc.vocabulary += it.metrics?.vocabulary || 0;
      acc.context += it.metrics?.context || 0;
      acc.clarity += it.metrics?.clarity || 0;
      return acc;
    },
    { grammar: 0, vocabulary: 0, context: 0, clarity: 0 }
  );
  const n = items.length;
  return {
    grammar: Math.round(sum.grammar / n),
    vocabulary: Math.round(sum.vocabulary / n),
    context: Math.round(sum.context / n),
    clarity: Math.round(sum.clarity / n),
  };
}

export default function Modernmethodologies({ setCurrentView, color = "#5902b0" }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [metrics, setMetrics] = useState({
    grammar: 0,
    vocabulary: 0,
    context: 0,
    clarity: 0,
  });
  const [learningLanguage, setLearningLanguage] = useState("en-US");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const block = progress.modules.modern_methodologies;
        const loadedHistory = Array.isArray(block.history) ? block.history : [];
        setHistory(loadedHistory.slice(-MAX_HISTORY));
        setMetrics(block.metrics || averageMetrics(loadedHistory));
        setLearningLanguage(progress?.languages?.learning_language || "en-US");
      } catch {
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);

    const analysis = analyzeText(text);
    const userMsg = { id: `u_${Date.now()}`, role: "user", text };
    const mentorMsg = {
      id: `m_${Date.now() + 1}`,
      role: "mentor",
      text: analysis.explanation,
      corrected: analysis.corrected,
      improved: analysis.improved,
      metrics: analysis.metrics,
    };

    const nextHistory = [...history, userMsg, mentorMsg].slice(-MAX_HISTORY);
    const nextMetrics = averageMetrics(nextHistory.filter((m) => m.role === "mentor"));
    setHistory(nextHistory);
    setMetrics(nextMetrics);
    setInput("");

    try {
      const progress = await readProgress();
      progress.modules.modern_methodologies = {
        history: nextHistory,
        metrics: nextMetrics,
        total_reviews: Number(progress.modules.modern_methodologies.total_reviews || 0) + 1,
        last_input: text,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    } finally {
      setSending(false);
    }
  };

  const metricItems = useMemo(
    () => [
      { key: "grammar", label: "Grammar", value: metrics.grammar },
      { key: "vocabulary", label: "Vocabulary", value: metrics.vocabulary },
      { key: "context", label: "Context", value: metrics.context },
      { key: "clarity", label: "Clarity", value: metrics.clarity },
    ],
    [metrics]
  );

  return (
    <section className="modern-shell" style={{ "--modern-theme": color }}>
      <header className="modern-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div>
          <div className="modern-kicker">ADVANCED AI MENTOR</div>
          <h1>Modern Methodologies</h1>
        </div>
      </header>

      <div className="modern-layout">
        <section className="modern-chat-card">
          {loading ? (
            <div className="modern-empty">Carregando histórico...</div>
          ) : history.length === 0 ? (
            <div className="modern-empty">
              Write a sentence in English. I will correct it, improve vocabulary, and explain context.
            </div>
          ) : (
            <div className="modern-chat-list">
              {history.map((msg) => (
                <article key={msg.id} className={`modern-bubble ${msg.role === "user" ? "is-user" : "is-mentor"}`}>
                  <p>{msg.text}</p>
                  {msg.role === "mentor" && (
                    <button
                      type="button"
                      className="modern-audio-btn"
                      onClick={() => speakText(msg.text, learningLanguage)}
                    >
                      <Volume2 size={15} />
                      Ouvir feedback
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}

          <footer className="modern-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="Type your sentence to get advanced feedback..."
            />
            <button type="button" className="modern-send-btn" onClick={submit} disabled={!input.trim() || sending}>
              <Send size={16} />
              {sending ? "Analisando..." : "Enviar"}
            </button>
          </footer>
        </section>

        <aside className="modern-panel-card">
          <h2>Feedback por categoria</h2>
          <div className="modern-metrics">
            {metricItems.map((item) => (
              <div key={item.key} className="modern-metric-item">
                <div className="modern-metric-head">
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="modern-metric-track">
                  <div className="modern-metric-fill" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
