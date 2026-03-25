import React, { useEffect, useMemo, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, Send, Volume2, Target, BrainCircuit, Sparkles, Wand2 } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const MAX_HISTORY = 50;
const GOALS = [
  { key: "conversation", labelKey: "modern.goal.conversation", fallback: "Conversation" },
  { key: "travel", labelKey: "modern.goal.travel", fallback: "Travel" },
  { key: "work", labelKey: "modern.goal.work", fallback: "Work" },
  { key: "exam", labelKey: "modern.goal.exam", fallback: "Exam" },
];
const FOCUS_LABELS = {
  grammar: { labelKey: "modern.focus.grammar", fallback: "Grammar" },
  vocabulary: { labelKey: "modern.focus.vocabulary", fallback: "Vocabulary" },
  context: { labelKey: "modern.focus.context", fallback: "Context" },
  clarity: { labelKey: "modern.focus.clarity", fallback: "Clarity" },
};
const SESSION_LIBRARY = {
  conversation: [
    {
      id: "conv_story",
      titleKey: "modern.session.conv_story.title",
      titleFallback: "Natural follow-up practice",
      focus: "context",
      promptKey: "modern.session.conv_story.prompt",
      promptFallback: "Tell me about a conversation you had this week and why it mattered to you.",
      depth: "deep",
    },
    {
      id: "conv_smalltalk",
      titleKey: "modern.session.conv_smalltalk.title",
      titleFallback: "Small talk upgrade",
      focus: "vocabulary",
      promptKey: "modern.session.conv_smalltalk.prompt",
      promptFallback: "Introduce yourself to a new classmate and keep the conversation going for three turns.",
      depth: "guided",
    },
  ],
  travel: [
    {
      id: "travel_hotel",
      titleKey: "modern.session.travel_hotel.title",
      titleFallback: "Hotel check-in rehearsal",
      focus: "clarity",
      promptKey: "modern.session.travel_hotel.prompt",
      promptFallback: "Ask for a quiet room, confirm breakfast time, and mention one special request.",
      depth: "guided",
    },
    {
      id: "travel_problem",
      titleKey: "modern.session.travel_problem.title",
      titleFallback: "Travel problem solving",
      focus: "grammar",
      promptKey: "modern.session.travel_problem.prompt",
      promptFallback: "Explain that your luggage is missing and ask what steps you should follow next.",
      depth: "deep",
    },
  ],
  work: [
    {
      id: "work_update",
      titleKey: "modern.session.work_update.title",
      titleFallback: "Professional update",
      focus: "clarity",
      promptKey: "modern.session.work_update.prompt",
      promptFallback: "Write a short project update with progress, blocker, and next action.",
      depth: "deep",
    },
    {
      id: "work_meeting",
      titleKey: "modern.session.work_meeting.title",
      titleFallback: "Meeting contribution",
      focus: "context",
      promptKey: "modern.session.work_meeting.prompt",
      promptFallback: "Share one idea in a meeting and support it with a reason and an example.",
      depth: "guided",
    },
  ],
  exam: [
    {
      id: "exam_argument",
      titleKey: "modern.session.exam_argument.title",
      titleFallback: "Argument under pressure",
      focus: "grammar",
      promptKey: "modern.session.exam_argument.prompt",
      promptFallback: "Write a clear opinion paragraph about why daily reading improves language learning.",
      depth: "deep",
    },
    {
      id: "exam_precision",
      titleKey: "modern.session.exam_precision.title",
      titleFallback: "Precision drill",
      focus: "vocabulary",
      promptKey: "modern.session.exam_precision.prompt",
      promptFallback: "Rewrite a simple sentence using stronger academic vocabulary and better connectors.",
      depth: "guided",
    },
  ],
};

function getFocusLabel(key) {
  const meta = FOCUS_LABELS[key] || { labelKey: "modern.focus.context", fallback: "Context" };
  return getUiLabel(meta.labelKey, meta.fallback);
}

function getGoalLabel(key) {
  const goal = GOALS.find((item) => item.key === key) || GOALS[0];
  return getUiLabel(goal.labelKey, goal.fallback);
}

function getSessionTitle(session) {
  return getUiLabel(session?.titleKey || "", session?.titleFallback || "");
}

function getSessionPrompt(session) {
  return getUiLabel(session?.promptKey || "", session?.promptFallback || "");
}

function buildNaturalReply(text, objective, focus) {
  const base = (text || "").trim();
  const compact = base.replace(/\s+/g, " ");
  const named = compact.match(/\bmy name is\s+([a-z]+)/i) || compact.match(/\bi am\s+([a-z]+)/i);
  const learnerName = named ? named[1].charAt(0).toUpperCase() + named[1].slice(1) : null;
  const objectiveIntro = {
    conversation: getUiLabel("modern.reply.objective.conversation", "You are building a more natural conversational flow."),
    travel: getUiLabel("modern.reply.objective.travel", "This answer already sounds useful for a travel situation."),
    work: getUiLabel("modern.reply.objective.work", "This is moving toward a more professional tone."),
    exam: getUiLabel("modern.reply.objective.exam", "This is a good base for a more structured exam response."),
  }[objective] || getUiLabel("modern.reply.objective.default", "This is a strong start.");
  const focusLine = {
    grammar: getUiLabel("modern.reply.focus.grammar", "I tightened the grammar so the sentence reads more confidently."),
    vocabulary: getUiLabel("modern.reply.focus.vocabulary", "I upgraded a few words to make the message sound richer."),
    context: getUiLabel("modern.reply.focus.context", "I added more context so the message feels less robotic and more human."),
    clarity: getUiLabel("modern.reply.focus.clarity", "I made the structure cleaner so the idea lands faster."),
  }[focus] || getUiLabel("modern.reply.focus.default", "I refined the sentence to sound more natural.");
  const greeting = learnerName
    ? `${getUiLabel("modern.reply.greeting_named", "Hello")} ${learnerName}, ${getUiLabel("modern.reply.welcome_back", "welcome back")}. `
    : `${getUiLabel("modern.reply.nice_work", "Nice work")}. `;
  return `${greeting}${objectiveIntro} ${focusLine}`;
}

function analyzeText(text, objective = "conversation", focus = "context") {
  const raw = (text || "").trim();
  if (!raw) {
    return {
      corrected: "",
      improved: "",
      explanation:
        getUiLabel("modern.analysis.empty_explanation", "Write a complete sentence so I can analyze grammar, vocabulary, context, and clarity."),
      naturalReply: getUiLabel("modern.analysis.empty_reply", "I am ready when you are. Send me one complete idea and we will improve it together."),
      categoryFeedback: {
        grammar: getUiLabel("modern.analysis.tip.grammar", "Start with one complete sentence."),
        vocabulary: getUiLabel("modern.analysis.tip.vocabulary", "Use at least one specific noun or verb."),
        context: getUiLabel("modern.analysis.tip.context", "Add where, when, or why."),
        clarity: getUiLabel("modern.analysis.tip.clarity", "Keep one main idea first."),
      },
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
  if (objective === "work") {
    improved = improved.replace(/\bhi\b/gi, "Hello");
  }
  if (objective === "travel") {
    improved = improved.replace(/\bI want\b/gi, "I would like");
  }

  const grammar = corrected === raw ? 85 : 92;
  const vocabulary = improved === corrected ? 78 : 90;
  const context = corrected.length > 45 ? 88 : 72;
  const clarity = corrected.split(" ").length >= 8 ? 89 : 74;

  const categoryFeedback = {
    grammar:
      grammar >= 88
        ? getUiLabel("modern.feedback.grammar.good", "Grammar is mostly under control. Keep your verb forms stable.")
        : getUiLabel("modern.feedback.grammar.bad", "Check capitalization, verb form, and sentence ending."),
    vocabulary:
      vocabulary >= 88
        ? getUiLabel("modern.feedback.vocabulary.good", "Your word choice is getting stronger.")
        : getUiLabel("modern.feedback.vocabulary.bad", "Swap generic words for more specific verbs and nouns."),
    context:
      context >= 84
        ? getUiLabel("modern.feedback.context.good", "You gave enough context to make the sentence feel useful.")
        : getUiLabel("modern.feedback.context.bad", "Add one detail about time, place, or purpose."),
    clarity:
      clarity >= 84
        ? getUiLabel("modern.feedback.clarity.good", "The sentence is easy to follow.")
        : getUiLabel("modern.feedback.clarity.bad", "Split the idea into one clear action and one supporting detail."),
  };

  const explanation = [
    `Correction: \"${corrected}\"`,
    `Better wording: \"${improved}\"`,
    `${getUiLabel("modern.context_tip", "Context tip")}: ${categoryFeedback[focus]}`,
  ].join("\n");

  return {
    corrected,
    improved,
    explanation,
    naturalReply: buildNaturalReply(corrected, objective, focus),
    categoryFeedback,
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
      objective: "conversation",
      active_focus: "context",
      session_depth: "guided",
      adaptive_plan: [],
      session_history: [],
    };
  }
  const block = data.modules.modern_methodologies;
  if (!block.objective) block.objective = "conversation";
  if (!block.active_focus) block.active_focus = "context";
  if (!block.session_depth) block.session_depth = "guided";
  if (!Array.isArray(block.adaptive_plan)) block.adaptive_plan = [];
  if (!Array.isArray(block.session_history)) block.session_history = [];
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

function buildAdaptivePlan(objective, metrics) {
  const ordered = Object.entries(metrics || {})
    .map(([key, value]) => ({ key, value: Number(value || 0) }))
    .sort((a, b) => a.value - b.value);
  const weakest = ordered.slice(0, 2);
  return weakest.map((item, index) => ({
    id: `${objective}_${item.key}_${index}`,
    category: item.key,
    title: `${getFocusLabel(item.key)} ${getUiLabel("modern.sprint", "sprint")}`,
    description:
      objective === "work"
        ? `${getUiLabel("modern.plan.work_prefix", "Focus on")} ${getFocusLabel(item.key).toLowerCase()} ${getUiLabel("modern.plan.work_suffix", "with professional scenarios and short corrections.")}`
        : objective === "travel"
        ? `${getUiLabel("modern.plan.travel_prefix", "Practice")} ${getFocusLabel(item.key).toLowerCase()} ${getUiLabel("modern.plan.travel_suffix", "with travel-specific English and fast recovery drills.")}`
        : objective === "exam"
        ? `${getUiLabel("modern.plan.exam_prefix", "Tighten")} ${getFocusLabel(item.key).toLowerCase()} ${getUiLabel("modern.plan.exam_suffix", "with precision-first tasks and model answers.")}`
        : `${getUiLabel("modern.plan.conversation_prefix", "Grow")} ${getFocusLabel(item.key).toLowerCase()} ${getUiLabel("modern.plan.conversation_suffix", "with natural conversation tasks and mentor feedback.")}`,
  }));
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
  const [objective, setObjective] = useState("conversation");
  const [activeFocus, setActiveFocus] = useState("context");
  const [sessionDepth, setSessionDepth] = useState("guided");

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
        setObjective(block.objective || "conversation");
        setActiveFocus(block.active_focus || "context");
        setSessionDepth(block.session_depth || "guided");
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

  const metricItems = useMemo(
    () => [
      { key: "grammar", value: metrics.grammar },
      { key: "vocabulary", value: metrics.vocabulary },
      { key: "context", value: metrics.context },
      { key: "clarity", value: metrics.clarity },
    ],
    [metrics]
  );

  const adaptivePlan = useMemo(() => buildAdaptivePlan(objective, metrics), [objective, metrics]);
  const sessionSuggestions = useMemo(() => {
    const source = SESSION_LIBRARY[objective] || SESSION_LIBRARY.conversation;
    return source.filter((item) => sessionDepth === "deep" ? true : item.depth !== "deep").slice(0, 3);
  }, [objective, sessionDepth]);

  const persistSettings = async (patch = {}) => {
    try {
      const progress = await readProgress();
      const block = progress.modules.modern_methodologies || {};
      progress.modules.modern_methodologies = {
        ...block,
        objective: patch.objective ?? objective,
        active_focus: patch.active_focus ?? activeFocus,
        session_depth: patch.session_depth ?? sessionDepth,
        adaptive_plan: patch.adaptive_plan ?? adaptivePlan,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  const applySessionPrompt = (session) => {
    setActiveFocus(session.focus || "context");
    setInput(getSessionPrompt(session) || "");
    void persistSettings({ active_focus: session.focus || "context" });
  };

  const submit = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);

    const analysis = analyzeText(text, objective, activeFocus);
    const userMsg = { id: `u_${Date.now()}`, role: "user", text };
    const mentorMsg = {
      id: `m_${Date.now() + 1}`,
      role: "mentor",
      text: analysis.naturalReply,
      corrected: analysis.corrected,
      improved: analysis.improved,
      explanation: analysis.explanation,
      categoryFeedback: analysis.categoryFeedback,
      metrics: analysis.metrics,
    };

    const nextHistory = [...history, userMsg, mentorMsg].slice(-MAX_HISTORY);
    const mentorHistory = nextHistory.filter((m) => m.role === "mentor");
    const nextMetrics = averageMetrics(mentorHistory);
    const nextAdaptivePlan = buildAdaptivePlan(objective, nextMetrics);
    setHistory(nextHistory);
    setMetrics(nextMetrics);
    setInput("");

    try {
      const progress = await readProgress();
      const block = progress.modules.modern_methodologies || {};
      progress.modules.modern_methodologies = {
        ...block,
        history: nextHistory,
        metrics: nextMetrics,
        total_reviews: Number(block.total_reviews || 0) + 1,
        last_input: text,
        objective,
        active_focus: activeFocus,
        session_depth: sessionDepth,
        adaptive_plan: nextAdaptivePlan,
        session_history: [
          {
            id: `s_${Date.now()}`,
            objective,
            focus: activeFocus,
            depth: sessionDepth,
            created_at: new Date().toISOString(),
          },
          ...(Array.isArray(block.session_history) ? block.session_history : []),
        ].slice(0, 20),
      };
      await writeProgress(progress);
    } catch {
      // no-op
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="modern-shell" style={{ "--modern-theme": color }}>
      <header className="modern-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="modern-kicker">{getUiLabel("modern.kicker", "ADVANCED AI MENTOR")}</div>
          <h1>{getUiLabel("module.modern_methodologies", "Modern Methodologies")}</h1>
        </div>
        <ModuleGuideButton moduleKey="modern" color={color} />
      </header>

      <div className="modern-layout">
        <section className="modern-chat-card">
          <div className="modern-control-bar">
            <label>
              {getUiLabel("modern.objective", "Objective")}
              <select
                value={objective}
                onChange={(e) => {
                  const next = e.target.value;
                  setObjective(next);
                  void persistSettings({ objective: next, adaptive_plan: buildAdaptivePlan(next, metrics) });
                }}
              >
                {GOALS.map((goal) => (
                  <option key={goal.key} value={goal.key}>{getUiLabel(goal.labelKey, goal.fallback)}</option>
                ))}
              </select>
            </label>
            <label>
              {getUiLabel("modern.session_depth", "Session depth")}
              <select
                value={sessionDepth}
                onChange={(e) => {
                  const next = e.target.value;
                  setSessionDepth(next);
                  void persistSettings({ session_depth: next });
                }}
              >
                <option value="guided">{getUiLabel("modern.guided", "Guided")}</option>
                <option value="deep">{getUiLabel("modern.deep_coaching", "Deep coaching")}</option>
              </select>
            </label>
          </div>

          <div className="modern-focus-row">
            {metricItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`modern-focus-chip ${activeFocus === item.key ? "is-active" : ""}`}
                onClick={() => {
                  setActiveFocus(item.key);
                  void persistSettings({ active_focus: item.key });
                }}
              >
                {getFocusLabel(item.key)}
              </button>
            ))}
          </div>

          <div className="modern-session-grid">
            {sessionSuggestions.map((session) => (
              <button
                key={session.id}
                type="button"
                className="modern-session-card"
                onClick={() => applySessionPrompt(session)}
              >
                <strong>{getSessionTitle(session)}</strong>
                <span>{getFocusLabel(session.focus)}</span>
                <p>{getSessionPrompt(session)}</p>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="modern-empty">{getUiLabel("modern.loading_history", "Loading history...")}</div>
          ) : history.length === 0 ? (
            <div className="modern-empty">
              {getUiLabel("modern.empty", "Write a sentence in English. I will correct it, improve vocabulary, and explain context.")}
            </div>
          ) : (
            <div className="modern-chat-list">
              {history.map((msg) => (
                <article key={msg.id} className={`modern-bubble ${msg.role === "user" ? "is-user" : "is-mentor"}`}>
                  <p>{msg.text}</p>
                  {msg.role === "mentor" ? (
                    <div className="modern-mentor-detail">
                      <div className="modern-mentor-copy">
                        <p>{msg.explanation}</p>
                        <ul>
                          {Object.entries(msg.categoryFeedback || {}).map(([key, value]) => (
                            <li key={key}><strong>{getFocusLabel(key)}:</strong> {value}</li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        className="modern-audio-btn"
                        onClick={() => speakText(`${msg.text} ${msg.explanation || ""}`, learningLanguage)}
                      >
                        <Volume2 size={15} />
                        {getUiLabel("modern.listen_feedback", "Listen feedback")}
                      </button>
                    </div>
                  ) : null}
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
              placeholder={getUiLabel("modern.placeholder", "Type your sentence to get advanced feedback...")}
            />
            <button type="button" className="modern-send-btn" onClick={submit} disabled={!input.trim() || sending}>
              <Send size={16} />
              {sending ? getUiLabel("modern.analyzing", "Analyzing...") : getUiLabel("common.send", "Send")}
            </button>
          </footer>
        </section>

        <aside className="modern-panel-card">
          <h2>{getUiLabel("modern.feedback_by_category", "Feedback by category")}</h2>
          <div className="modern-metrics">
            {metricItems.map((item) => (
              <div key={item.key} className="modern-metric-item">
                <div className="modern-metric-head">
                  <span>{getFocusLabel(item.key)}</span>
                  <strong>{item.value}%</strong>
                </div>
                <div className="modern-metric-track">
                  <div className="modern-metric-fill" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="modern-plan-card">
            <div className="modern-plan-head">
              <Target size={16} />
              <strong>{getUiLabel("modern.adaptive_plan", "Adaptive plan")}</strong>
            </div>
            <div className="modern-plan-list">
              {adaptivePlan.map((item) => (
                <article key={item.id} className="modern-plan-item">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="modern-coach-grid">
            <article className="modern-coach-card">
              <BrainCircuit size={16} />
              <strong>{getUiLabel("modern.category_coach", "Category coach")}</strong>
              <p>{getUiLabel("modern.active_focus", "Active focus")}: {getFocusLabel(activeFocus)}</p>
            </article>
            <article className="modern-coach-card">
              <Sparkles size={16} />
              <strong>{getUiLabel("modern.objective", "Objective")}</strong>
              <p>{getGoalLabel(objective)}</p>
            </article>
            <article className="modern-coach-card">
              <Wand2 size={16} />
              <strong>{getUiLabel("modern.depth", "Depth")}</strong>
              <p>{sessionDepth === "deep" ? getUiLabel("modern.deep_coaching", "Deep coaching") : getUiLabel("modern.guided_practice", "Guided practice")}</p>
            </article>
          </div>
        </aside>
      </div>
    </section>
  );
}


