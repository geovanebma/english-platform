import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, Volume2, Globe2, Gauge, CalendarClock } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const THEMES = [
  {
    id: "l1",
    title: "Greetings in Daily Life",
    phrases: [
      "Good morning, how are you today?",
      "It is nice to finally meet you in person.",
      "Thanks for coming, I appreciate your time.",
      "Have a great day and see you tomorrow.",
    ],
  },
  {
    id: "l2",
    title: "Work and Meetings",
    phrases: [
      "Let us start with a quick project update.",
      "Could you clarify the deadline for this task?",
      "We need to prioritize the client feedback first.",
      "Please send the final document by five o'clock.",
    ],
  },
  {
    id: "l3",
    title: "Travel Situations",
    phrases: [
      "Where can I find platform number seven?",
      "I would like to check in for my flight.",
      "Can you recommend a good local restaurant?",
      "Is this bus going to the city center?",
    ],
  },
  {
    id: "l4",
    title: "Social Conversations",
    phrases: [
      "What do you usually do on weekends?",
      "I recently started learning photography.",
      "That sounds interesting, tell me more about it.",
      "Let us keep in touch after this event.",
    ],
  },
];

const ACCENTS = [
  { key: "us", label: "American", tags: ["en-US"] },
  { key: "uk", label: "British", tags: ["en-GB"] },
  { key: "au", label: "Australian", tags: ["en-AU"] },
  { key: "in", label: "Indian", tags: ["en-IN"] },
  { key: "mixed", label: "Mixed", tags: ["en-US", "en-GB", "en-AU", "en-IN"] },
];

function getTodayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextResetLabel() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const diffMs = next.getTime() - now.getTime();
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

function ensureListening(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.listening) {
    data.modules.listening = {
      completed_today: [],
      last_reset_date: getTodayISO(),
      total_completed: 0,
      last_theme_id: null,
      accent_mode: "us",
      speed_mode: "progressive",
      fixed_rate: 1,
      progress_by_theme: {},
      daily_reset_count: 0,
      sessions_today: 0,
      reset_meta: {
        next_reset_hint: nextResetLabel(),
        last_reset_at: new Date().toISOString(),
      },
    };
  }
  if (!data.modules.listening.accent_mode) data.modules.listening.accent_mode = "us";
  if (!data.modules.listening.speed_mode) data.modules.listening.speed_mode = "progressive";
  if (typeof data.modules.listening.fixed_rate !== "number") data.modules.listening.fixed_rate = 1;
  if (!data.modules.listening.progress_by_theme) data.modules.listening.progress_by_theme = {};
  if (typeof data.modules.listening.daily_reset_count !== "number") data.modules.listening.daily_reset_count = 0;
  if (typeof data.modules.listening.sessions_today !== "number") data.modules.listening.sessions_today = 0;
  if (!data.modules.listening.reset_meta) {
    data.modules.listening.reset_meta = {
      next_reset_hint: nextResetLabel(),
      last_reset_at: new Date().toISOString(),
    };
  }
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureListening(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureListening(parsed);
}

function pickVoiceForAccent(voices, accentMode, phraseIndex = 0) {
  if (!Array.isArray(voices) || voices.length === 0) return null;
  const accent = ACCENTS.find((item) => item.key === accentMode) || ACCENTS[0];
  const tags = accent.tags || ["en-US"];
  const targetTag = accentMode === "mixed" ? tags[phraseIndex % tags.length] : tags[0];
  const exact = voices.find((voice) => voice.lang === targetTag);
  if (exact) return exact;
  const partial = voices.find((voice) => voice.lang?.startsWith("en"));
  return partial || voices[0];
}

function computeRate(speedMode, fixedRate, phraseIndex, phraseCount, themeRound = 0) {
  if (speedMode === "fixed") return Math.max(0.7, Math.min(1.4, Number(fixedRate || 1)));
  const positionProgress = phraseCount > 1 ? phraseIndex / (phraseCount - 1) : 0;
  const roundBonus = Math.min(0.2, themeRound * 0.04);
  const rate = 0.82 + positionProgress * 0.28 + roundBonus;
  return Math.max(0.75, Math.min(1.3, Number(rate.toFixed(2))));
}

function speakWithConfig({
  text,
  accentMode,
  speedMode,
  fixedRate,
  phraseIndex,
  phraseCount,
  themeRound,
  onEnd,
}) {
  if (!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices() || [];
  const voice = pickVoiceForAccent(voices, accentMode, phraseIndex);
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang || "en-US";
  } else {
    utter.lang = "en-US";
  }
  utter.rate = computeRate(speedMode, fixedRate, phraseIndex, phraseCount, themeRound);
  utter.onend = () => onEnd?.();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export default function Listening({ setCurrentView, color = "#a61b57" }) {
  const [stage, setStage] = useState("themes");
  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [completedToday, setCompletedToday] = useState(new Set());
  const [today, setToday] = useState(getTodayISO());
  const [accentMode, setAccentMode] = useState("us");
  const [speedMode, setSpeedMode] = useState("progressive");
  const [fixedRate, setFixedRate] = useState(1);
  const [themeProgress, setThemeProgress] = useState({});
  const [nextReset, setNextReset] = useState(nextResetLabel());
  const [dailyResetCount, setDailyResetCount] = useState(0);
  const [sessionsToday, setSessionsToday] = useState(0);
  const timeoutRef = useRef(null);
  const autoplayRef = useRef(false);
  const repeatRef = useRef(false);

  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    const interval = setInterval(() => setNextReset(nextResetLabel()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const onVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    onVoicesChanged();
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const moduleData = progress.modules.listening;
        const currentDay = getTodayISO();
        setToday(currentDay);

        if (moduleData.last_reset_date !== currentDay) {
          progress.modules.listening.completed_today = [];
          progress.modules.listening.last_reset_date = currentDay;
          progress.modules.listening.sessions_today = 0;
          progress.modules.listening.daily_reset_count = Number(moduleData.daily_reset_count || 0) + 1;
          progress.modules.listening.reset_meta = {
            next_reset_hint: nextResetLabel(),
            last_reset_at: new Date().toISOString(),
          };
          const saved = await writeProgress(progress);
          setCompletedToday(new Set());
          setDailyResetCount(Number(saved.modules.listening.daily_reset_count || 0));
          setSessionsToday(0);
        } else {
          setCompletedToday(new Set(moduleData.completed_today || []));
          setDailyResetCount(Number(moduleData.daily_reset_count || 0));
          setSessionsToday(Number(moduleData.sessions_today || 0));
        }

        setAccentMode(moduleData.accent_mode || "us");
        setSpeedMode(moduleData.speed_mode || "progressive");
        setFixedRate(Number(moduleData.fixed_rate || 1));
        setThemeProgress(moduleData.progress_by_theme || {});
      } catch {
        if (!mounted) return;
      }
    })();
    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const selectedTheme = useMemo(
    () => THEMES.find((t) => t.id === selectedThemeId) || null,
    [selectedThemeId]
  );

  const themeRound = useMemo(
    () => Number(themeProgress?.[selectedThemeId]?.rounds || 0),
    [themeProgress, selectedThemeId]
  );

  const currentRate = useMemo(() => {
    if (!selectedTheme) return Number(fixedRate || 1);
    return computeRate(speedMode, fixedRate, phraseIdx, selectedTheme.phrases.length, themeRound);
  }, [selectedTheme, speedMode, fixedRate, phraseIdx, themeRound]);

  const accentLabel = useMemo(
    () => ACCENTS.find((item) => item.key === accentMode)?.label || "American",
    [accentMode]
  );

  const isUnlocked = (index) => {
    if (index === 0) return true;
    const prev = THEMES[index - 1];
    return completedToday.has(prev.id);
  };

  const persistListeningSettings = async (nextPatch = {}) => {
    try {
      const progress = await readProgress();
      progress.modules.listening = {
        ...progress.modules.listening,
        accent_mode: nextPatch.accent_mode ?? accentMode,
        speed_mode: nextPatch.speed_mode ?? speedMode,
        fixed_rate: typeof nextPatch.fixed_rate === "number" ? nextPatch.fixed_rate : fixedRate,
        progress_by_theme: nextPatch.progress_by_theme ?? themeProgress,
        reset_meta: {
          ...(progress.modules.listening.reset_meta || {}),
          next_reset_hint: nextResetLabel(),
        },
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  const playPhrase = (index) => {
    if (!selectedTheme) return;
    const phrase = selectedTheme.phrases[index];
    setPhraseIdx(index);
    speakWithConfig({
      text: phrase,
      accentMode,
      speedMode,
      fixedRate,
      phraseIndex: index,
      phraseCount: selectedTheme.phrases.length,
      themeRound,
    });
  };

  const stopAutoplay = () => {
    setAutoplay(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const runAutoplayFrom = (startIndex) => {
    if (!selectedTheme) return;
    const phrases = selectedTheme.phrases;
    const bounded = Math.min(startIndex, phrases.length - 1);
    setPhraseIdx(bounded);

    speakWithConfig({
      text: phrases[bounded],
      accentMode,
      speedMode,
      fixedRate,
      phraseIndex: bounded,
      phraseCount: phrases.length,
      themeRound,
      onEnd: () => {
        timeoutRef.current = setTimeout(() => {
          if (!autoplayRef.current) return;
          const isLast = bounded >= phrases.length - 1;
          if (isLast) {
            if (repeatRef.current) runAutoplayFrom(0);
            else setAutoplay(false);
            return;
          }
          runAutoplayFrom(bounded + 1);
        }, 5000);
      },
    });
  };

  useEffect(() => {
    if (!autoplay || !selectedTheme) return;
    runAutoplayFrom(phraseIdx);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, selectedThemeId, repeat, accentMode, speedMode, fixedRate]);

  const finalizeTheme = async () => {
    if (!selectedTheme) return;
    const nextCompleted = new Set(completedToday);
    nextCompleted.add(selectedTheme.id);
    setCompletedToday(nextCompleted);
    stopAutoplay();
    setStage("themes");

    const nextProgressByTheme = {
      ...(themeProgress || {}),
      [selectedTheme.id]: {
        rounds: Number(themeProgress?.[selectedTheme.id]?.rounds || 0) + 1,
        best_rate: Math.max(Number(themeProgress?.[selectedTheme.id]?.best_rate || 0), Number(currentRate || 0)),
        last_rate: Number(currentRate || 1),
        last_accent: accentMode,
      },
    };
    setThemeProgress(nextProgressByTheme);
    setSessionsToday((prev) => prev + 1);

    try {
      const progress = await readProgress();
      const currentDay = getTodayISO();
      const existing = new Set(
        progress.modules.listening.last_reset_date === currentDay
          ? progress.modules.listening.completed_today || []
          : []
      );
      existing.add(selectedTheme.id);

      progress.modules.listening = {
        ...progress.modules.listening,
        completed_today: [...existing],
        last_reset_date: currentDay,
        total_completed: Number(progress.modules.listening.total_completed || 0) + 1,
        last_theme_id: selectedTheme.id,
        accent_mode: accentMode,
        speed_mode: speedMode,
        fixed_rate: fixedRate,
        progress_by_theme: nextProgressByTheme,
        sessions_today: Number(progress.modules.listening.sessions_today || 0) + 1,
        reset_meta: {
          ...(progress.modules.listening.reset_meta || {}),
          next_reset_hint: nextResetLabel(),
        },
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  return (
    <section className="listening-shell" style={{ "--listening-theme": color }}>
      <header className="listening-head">
        <button
          type="button"
          className="duo-back-btn"
          onClick={() => {
            stopAutoplay();
            if (stage === "themes") setCurrentView("initial");
            else setStage("themes");
          }}
        >
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="listening-kicker">{getUiLabel("listening.kicker", "LISTENING TRAINING")}</div>
          <h1>{getUiLabel("module.listening", "Listening")}</h1>
          <p>{getUiLabel("listening.daily_reset_active", "Daily reset active")}: {today}</p>
        </div>
        <ModuleGuideButton moduleKey="listening" color={color} />
      </header>

      <div className="listening-status-grid">
        <article className="listening-status-card">
          <Globe2 size={16} />
          <strong>{getUiLabel("listening.active_accent", "Active accent")}</strong>
          <p>{accentLabel}</p>
        </article>
        <article className="listening-status-card">
          <Gauge size={16} />
          <strong>{getUiLabel("listening.speed", "Speed")}</strong>
          <p>{speedMode === "progressive" ? getUiLabel("listening.progressive", "Progressive") : getUiLabel("listening.fixed_speed", "{rate}x fixed").replace("{rate}", fixedRate.toFixed(2))}</p>
        </article>
        <article className="listening-status-card">
          <CalendarClock size={16} />
          <strong>{getUiLabel("listening.next_reset", "Next reset")}</strong>
          <p>{nextReset}</p>
          <em>{sessionsToday} sessao(oes) hoje � {dailyResetCount} reset(s)</em>
        </article>
      </div>

      {stage === "themes" && (
        <div className="listening-theme-list">
          {THEMES.map((theme, idx) => {
            const unlocked = isUnlocked(idx);
            const done = completedToday.has(theme.id);
            const rounds = Number(themeProgress?.[theme.id]?.rounds || 0);
            const bestRate = Number(themeProgress?.[theme.id]?.best_rate || 0);
            return (
              <button
                key={theme.id}
                type="button"
                className={`listening-theme-btn ${idx % 2 ? "offset-right" : "offset-left"} ${done ? "is-done" : ""} ${!unlocked ? "is-locked" : ""}`}
                disabled={!unlocked}
                onClick={() => {
                  setSelectedThemeId(theme.id);
                  setStage("session");
                  setPhraseIdx(0);
                  setAutoplay(false);
                  setRepeat(false);
                }}
              >
                <span className="listening-theme-title">{theme.title}</span>
                <span className="listening-theme-meta">
                  {(done ? getUiLabel("listening.done_today", "Completed today") : getUiLabel("listening.available", "Available")) + " | " + getUiLabel("listening.rounds", "Rounds") + ": " + rounds + " | " + getUiLabel("listening.best_speed", "Best speed") + ": " + (bestRate ? `${bestRate.toFixed(2)}x` : "-")}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {stage === "session" && selectedTheme && (
        <article className="listening-session-card">
          <h2>{selectedTheme.title}</h2>
          <div className="listening-controls">
            <button type="button" className={`listening-control-btn ${autoplay ? "is-on" : ""}`} onClick={() => setAutoplay((v) => !v)}>
              {getUiLabel("listening.autoplay", "Autoplay")}
            </button>
            <button type="button" className={`listening-control-btn ${repeat ? "is-on" : ""}`} onClick={() => setRepeat((v) => !v)}>
              {getUiLabel("listening.repeat", "Repeat")}
            </button>
            <button type="button" className="listening-finish-btn" onClick={finalizeTheme}>
              {getUiLabel("common.finish", "Finish")}
            </button>
          </div>

          <div className="listening-variation-row">
            <label>
              {getUiLabel("listening.accent", "Accent")}
              <select
                value={accentMode}
                onChange={(e) => {
                  const next = e.target.value;
                  setAccentMode(next);
                  void persistListeningSettings({ accent_mode: next });
                }}
              >
                {ACCENTS.map((accent) => (
                  <option key={accent.key} value={accent.key}>{accent.label}</option>
                ))}
              </select>
            </label>

            <label>
              {getUiLabel("listening.speed", "Speed")}
              <select
                value={speedMode}
                onChange={(e) => {
                  const next = e.target.value;
                  setSpeedMode(next);
                  void persistListeningSettings({ speed_mode: next });
                }}
              >
                <option value="progressive">{getUiLabel("listening.progressive", "Progressive")}</option>
                <option value="fixed">{getUiLabel("listening.fixed", "Fixed")}</option>
              </select>
            </label>

            <label>
              {getUiLabel("listening.fixed_rate", "Fixed rate")}
              <input
                type="range"
                min="0.75"
                max="1.3"
                step="0.05"
                value={fixedRate}
                disabled={speedMode !== "fixed"}
                onChange={(e) => {
                  const next = Number(e.target.value || 1);
                  setFixedRate(next);
                  void persistListeningSettings({ fixed_rate: next });
                }}
              />
            </label>
          </div>

          <div className="listening-variation-meta">
            <span>{getUiLabel("listening.current_speed", "Current speed")}: {currentRate.toFixed(2)}x</span>
            <span>{getUiLabel("listening.mode", "Mode")}: {speedMode === "progressive" ? getUiLabel("listening.mode_progressive_desc", "Progress by phrase + round") : getUiLabel("listening.mode_fixed_desc", "Controlled fixed")}</span>
            <span>{getUiLabel("listening.accent", "Accent")}: {accentLabel}</span>
          </div>

          <ul className="listening-phrase-list">
            {selectedTheme.phrases.map((phrase, idx) => (
              <li key={`${selectedTheme.id}_${idx}`}>
                <button type="button" className="listening-phrase-btn" onClick={() => playPhrase(idx)}>
                  <Volume2 size={16} />
                  <span>{phrase}</span>
                  <em>{idx === phraseIdx ? getUiLabel("listening.current", "Current") : getUiLabel("listening.phrase_n", "Phrase {n}").replace("{n}", idx + 1)}</em>
                </button>
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}


