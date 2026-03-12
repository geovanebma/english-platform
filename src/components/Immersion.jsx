import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Volume2 } from "lucide-react";
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
    };
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

export default function Immersion({ setCurrentView, color = "#b00245" }) {
  const [selectedThemeId, setSelectedThemeId] = useState(IMMERSION_THEMES[0].id);
  const [completed, setCompleted] = useState(new Set());
  const [learningLanguage, setLearningLanguage] = useState("en-US");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const block = progress.modules.immersion;
        setCompleted(new Set(block.completed_themes || []));
        setLearningLanguage(progress?.languages?.learning_language || "en-US");
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

  const finishTheme = async () => {
    const nextCompleted = new Set(completed);
    nextCompleted.add(selectedTheme.id);
    setCompleted(nextCompleted);

    try {
      const progress = await readProgress();
      const existing = new Set(progress.modules.immersion.completed_themes || []);
      existing.add(selectedTheme.id);
      progress.modules.immersion = {
        completed_themes: [...existing],
        last_theme_id: selectedTheme.id,
        total_completed: existing.size,
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
          Voltar
        </button>
        <div>
          <div className="immersion-kicker">IMMERSION BOOK</div>
          <h1>Immersion</h1>
        </div>
              <ModuleGuideButton moduleKey="immersion" color={color} />
</header>

      <div className="immersion-layout">
        <aside className="immersion-theme-list">
          {IMMERSION_THEMES.map((theme, idx) => (
            <button
              key={theme.id}
              type="button"
              className={`immersion-theme-btn ${idx % 2 ? "offset-right" : "offset-left"} ${
                selectedThemeId === theme.id ? "is-active" : ""
              } ${completed.has(theme.id) ? "is-done" : ""}`}
              onClick={() => setSelectedThemeId(theme.id)}
            >
              <span>{theme.title}</span>
              <em>{completed.has(theme.id) ? "ConcluÃ­do" : "Em estudo"}</em>
            </button>
          ))}
        </aside>

        <article className="immersion-book-card">
          <h2>{selectedTheme.title}</h2>

          <section>
            <h3>IntroduÃ§Ã£o</h3>
            <p>{selectedTheme.introduction}</p>
          </section>

          <section>
            <h3>Contexto</h3>
            <p>{selectedTheme.context}</p>
          </section>

          <section>
            <h3>Exemplos</h3>
            <ul>
              {selectedTheme.examples.map((ex) => (
                <li key={ex}>{ex}</li>
              ))}
            </ul>
          </section>

          <section className="immersion-dialogue">
            <h3>Mini diÃ¡logo</h3>
            <ul>
              {selectedTheme.dialogue.map((line, idx) => (
                <li key={`${line.speaker}_${idx}`}>
                  <strong>{line.speaker}:</strong> {line.text}
                  <button
                    type="button"
                    className="immersion-audio-btn"
                    onClick={() => speak(line.text, learningLanguage)}
                  >
                    <Volume2 size={14} />
                    Ouvir
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <button type="button" className="immersion-finish-btn" onClick={finishTheme}>
            Finalizar tema
          </button>
        </article>
      </div>
    </section>
  );
}
