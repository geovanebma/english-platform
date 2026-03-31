import React, { useEffect, useMemo, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, Volume2, CheckCircle2, BookOpenText, Headphones } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const IMMERSION_THEMES = [
  {
    id: "im1",
    title: "Verb To Be in Real Context",
    introduction:
      "The verb 'to be' is one of the foundations of English. It appears in introductions, descriptions, and daily interactions.",
    context:
      "In real conversations, 'to be' helps you identify people, describe states, and talk about location. You will hear it in almost every basic dialogue.",
    examples: [
      "I am ready for the class.",
      "She is my colleague.",
      "They are at the station.",
    ],
    dialogue: [
      { speaker: "A", text: "Hi, I am Daniel. Are you new here?" },
      { speaker: "B", text: "Yes, I am. I am from Brazil." },
      { speaker: "A", text: "Great! We are in the same group." },
    ],
    checkpoints: [
      "I can identify the correct form of 'to be' for the subject.",
      "I can use 'to be' to describe identity, location, or state.",
      "I can repeat one dialogue line naturally.",
    ],
    readingBridge: "Open Reading to reinforce identity and routine language in context.",
    listeningBridge: "Open Listening to hear the same structures with controlled repetition.",
  },
  {
    id: "im2",
    title: "Present Simple for Routine",
    introduction:
      "Present simple is used for habits, routines, and facts. It gives structure to everyday communication.",
    context:
      "When discussing work, study, and schedules, present simple sounds natural and direct. It is essential for speaking clearly.",
    examples: [
      "I work from home three days a week.",
      "He studies English after dinner.",
      "The train leaves at 8 AM.",
    ],
    dialogue: [
      { speaker: "A", text: "What time do you start work?" },
      { speaker: "B", text: "I start at nine and finish at six." },
      { speaker: "A", text: "Do you study English every day?" },
      { speaker: "B", text: "Yes, I do. I practice for thirty minutes." },
    ],
    checkpoints: [
      "I can talk about habits using present simple.",
      "I can ask and answer routine questions.",
      "I can notice the -s ending in third person.",
    ],
    readingBridge: "Open Reading to practice routines and factual information in paragraph form.",
    listeningBridge: "Open Listening to hear routines with progressive speed.",
  },
  {
    id: "im3",
    title: "Making Polite Requests",
    introduction:
      "Polite requests improve communication quality and social connection. They are essential in professional and personal settings.",
    context:
      "Expressions like 'Could you...' and 'Would you mind...' help you sound respectful and cooperative in English.",
    examples: [
      "Could you send me the file, please?",
      "Would you mind repeating that?",
      "Can you help me with this form?",
    ],
    dialogue: [
      { speaker: "A", text: "Could you help me find this address?" },
      { speaker: "B", text: "Sure, I can. It is two blocks from here." },
      { speaker: "A", text: "Thank you. Would you mind writing it down?" },
      { speaker: "B", text: "No problem. Here you go." },
    ],
    checkpoints: [
      "I can ask for help politely.",
      "I can soften a request with polite language.",
      "I can recognize polite request patterns in audio.",
    ],
    readingBridge: "Open Reading to see polite requests inside short professional texts.",
    listeningBridge: "Open Listening to hear request patterns in controlled dialogue.",
  },
];

function ensureImmersion(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.immersion) {
    data.modules.immersion = {
      completed_themes: [],
      last_theme_id: null,
      total_completed: 0,
      checkpoints_by_theme: {},
      bridge_clicks: { reading: 0, listening: 0 },
    };
  }
  if (!data.modules.immersion.checkpoints_by_theme) data.modules.immersion.checkpoints_by_theme = {};
  if (!data.modules.immersion.bridge_clicks) {
    data.modules.immersion.bridge_clicks = { reading: 0, listening: 0 };
  }
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureImmersion(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureImmersion(parsed);
}

function speak(text, lang = "en-US") {
  if (!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export default function Immersion({ setCurrentView, color = "#b00245", navigateModule }) {
  const [selectedThemeId, setSelectedThemeId] = useState(IMMERSION_THEMES[0].id);
  const [completed, setCompleted] = useState(new Set());
  const [learningLanguage, setLearningLanguage] = useState("en-US");
  const [checkpointsByTheme, setCheckpointsByTheme] = useState({});
  const [bridgeClicks, setBridgeClicks] = useState({ reading: 0, listening: 0 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const block = progress.modules.immersion;
        setCompleted(new Set(block.completed_themes || []));
        setLearningLanguage(progress?.languages?.learning_language || "en-US");
        setCheckpointsByTheme(block.checkpoints_by_theme || {});
        setBridgeClicks(block.bridge_clicks || { reading: 0, listening: 0 });
      } catch {
        if (!mounted) return;
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedTheme = useMemo(
    () => IMMERSION_THEMES.find((t) => t.id === selectedThemeId) || IMMERSION_THEMES[0],
    [selectedThemeId]
  );

  const currentCheckpoints = checkpointsByTheme[selectedTheme.id] || [];
  const checkpointsCompleted = currentCheckpoints.length;
  const checkpointProgress = Math.round((checkpointsCompleted / Math.max(1, selectedTheme.checkpoints.length)) * 100);

  const persistImmersion = async (patch = {}) => {
    try {
      const progress = await readProgress();
      progress.modules.immersion = {
        ...progress.modules.immersion,
        completed_themes: patch.completed_themes ?? [...completed],
        last_theme_id: patch.last_theme_id ?? progress.modules.immersion.last_theme_id,
        total_completed:
          patch.total_completed ?? Number(progress.modules.immersion.total_completed || completed.size),
        checkpoints_by_theme: patch.checkpoints_by_theme ?? checkpointsByTheme,
        bridge_clicks: patch.bridge_clicks ?? bridgeClicks,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  const toggleCheckpoint = async (index) => {
    const current = new Set(currentCheckpoints);
    if (current.has(index)) current.delete(index);
    else current.add(index);
    const nextByTheme = {
      ...checkpointsByTheme,
      [selectedTheme.id]: [...current].sort((a, b) => a - b),
    };
    setCheckpointsByTheme(nextByTheme);
    await persistImmersion({ checkpoints_by_theme: nextByTheme });
  };

  const openBridge = async (moduleKey) => {
    const nextBridgeClicks = {
      ...bridgeClicks,
      [moduleKey]: Number(bridgeClicks[moduleKey] || 0) + 1,
    };
    setBridgeClicks(nextBridgeClicks);
    await persistImmersion({ bridge_clicks: nextBridgeClicks });
    if (typeof navigateModule === "function") {
      navigateModule(moduleKey);
      return;
    }
    setCurrentView("initial");
  };

  const finishTheme = async () => {
    const nextCompleted = new Set(completed);
    nextCompleted.add(selectedTheme.id);
    setCompleted(nextCompleted);

    try {
      const progress = await readProgress();
      const existing = new Set(progress.modules.immersion.completed_themes || []);
      existing.add(selectedTheme.id);
      progress.modules.immersion = {
        ...progress.modules.immersion,
        completed_themes: [...existing],
        last_theme_id: selectedTheme.id,
        total_completed: existing.size,
        checkpoints_by_theme: checkpointsByTheme,
        bridge_clicks: bridgeClicks,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  return (
    <section className="immersion-shell" style={{ "--immersion-theme": color }}>
      <header className="immersion-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="immersion-kicker">{getUiLabel("immersion.kicker", "IMMERSION BOOK")}</div>
          <h1>{getUiLabel("module.immersion", "Immersion")}</h1>
        </div>
        <ModuleGuideButton moduleKey="immersion" color={color} />
      </header>

      <div className="immersion-layout">
        <aside className="immersion-theme-list">
          {IMMERSION_THEMES.map((theme, idx) => (
            <button
              key={theme.id}
              type="button"
              className={`immersion-theme-btn ${idx % 2 ? "offset-right" : "offset-left"} ${selectedThemeId === theme.id ? "is-active" : ""} ${completed.has(theme.id) ? "is-done" : ""}`}
              onClick={() => setSelectedThemeId(theme.id)}
            >
              <span>{theme.title}</span>
              <em>{completed.has(theme.id) ? getUiLabel("immersion.completed", "Completed") : getUiLabel("immersion.in_study", "In study")}</em>
            </button>
          ))}
        </aside>

        <article className="immersion-book-card">
          <h2>{selectedTheme.title}</h2>

          <section>
            <h3>{getUiLabel("immersion.introduction", "Introduction")}</h3>
            <p>{selectedTheme.introduction}</p>
          </section>

          <section>
            <h3>{getUiLabel("immersion.context", "Context")}</h3>
            <p>{selectedTheme.context}</p>
          </section>

          <section>
            <h3>{getUiLabel("immersion.examples", "Examples")}</h3>
            <ul>
              {selectedTheme.examples.map((ex) => (
                <li key={ex}>{ex}</li>
              ))}
            </ul>
          </section>

          <section className="immersion-dialogue">
            <h3>{getUiLabel("immersion.mini_dialogue", "Mini dialogue")}</h3>
            <ul>
              {selectedTheme.dialogue.map((line, idx) => (
                <li key={`${line.speaker}_${idx}`}>
                  <strong>{line.speaker}:</strong> {line.text}
                  <button type="button" className="immersion-audio-btn" onClick={() => speak(line.text, learningLanguage)}>
                    <Volume2 size={14} />
                    {getUiLabel("dictionary.listen", "Listen")}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="immersion-checkpoints-card">
            <div className="immersion-checkpoints-head">
              <div>
                <h3>{getUiLabel("immersion.internal_checkpoints", "Internal checkpoints")}</h3>
                <p>{getUiLabel("immersion.checkpoints_progress", "{done}/{total} completed").replace("{done}", checkpointsCompleted).replace("{total}", selectedTheme.checkpoints.length)}</p>
              </div>
              <div className="immersion-checkpoint-track">
                <div className="immersion-checkpoint-fill" style={{ width: `${checkpointProgress}%` }} />
              </div>
            </div>
            <div className="immersion-checkpoint-list">
              {selectedTheme.checkpoints.map((checkpoint, index) => {
                const done = currentCheckpoints.includes(index);
                return (
                  <button
                    key={`${selectedTheme.id}_${index}`}
                    type="button"
                    className={`immersion-checkpoint-btn ${done ? "is-done" : ""}`}
                    onClick={() => toggleCheckpoint(index)}
                  >
                    <CheckCircle2 size={15} />
                    <span>{checkpoint}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="immersion-bridge-grid">
            <article className="immersion-bridge-card">
              <div className="immersion-bridge-head">
                <BookOpenText size={16} />
                <strong>{getUiLabel("immersion.bridge_reading", "Bridge to Reading")}</strong>
              </div>
              <p>{selectedTheme.readingBridge}</p>
              <button type="button" className="immersion-bridge-btn" onClick={() => openBridge("reading")}>{getUiLabel("immersion.open_reading", "Open Reading")}</button>
            </article>
            <article className="immersion-bridge-card">
              <div className="immersion-bridge-head">
                <Headphones size={16} />
                <strong>{getUiLabel("immersion.bridge_listening", "Bridge to Listening")}</strong>
              </div>
              <p>{selectedTheme.listeningBridge}</p>
              <button type="button" className="immersion-bridge-btn" onClick={() => openBridge("listening")}>{getUiLabel("immersion.open_listening", "Open Listening")}</button>
            </article>
          </section>

          <button type="button" className="immersion-finish-btn" onClick={finishTheme}>
            {getUiLabel("immersion.finish_theme", "Finish theme")}
          </button>
        </article>
      </div>
    </section>
  );
}


