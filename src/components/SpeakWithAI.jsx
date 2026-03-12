import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Mic, Send, Volume2, Loader2, BookOpen } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const MAX_HISTORY = 40;

function hexToRgb(hex) {
  const cleaned = (hex || "#58cc02").replace("#", "");
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const int = Number.parseInt(normalized, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function alpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function toTitleCase(word = "") {
  const clean = String(word || "").trim();
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

function chooseVariant(base = "", variants = []) {
  const list = Array.isArray(variants) && variants.length > 0 ? variants : [base];
  const key = String(base || "x");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

function extractName(text = "") {
  const raw = String(text || "");
  const patterns = [
    /\bmy friend\s+([A-Za-z][A-Za-z'-]{1,20})\b/i,
    /\bmy name is\s+([A-Za-z][A-Za-z'-]{1,20})\b/i,
    /\bi am\s+([A-Za-z][A-Za-z'-]{1,20})\b/i,
    /\bi'm\s+([A-Za-z][A-Za-z'-]{1,20})\b/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return toTitleCase(match[1]);
  }
  return "";
}

function buildNaturalReply(rawText = "", corrected = "", improved = "") {
  const text = String(rawText || "").trim();
  const lower = text.toLowerCase();
  const name = extractName(text);

  if (/say hello/.test(lower) && name) {
    return chooseVariant(text, [
      `Hey ${name}! Welcome aboard. It's great to have you here learning English with us.`,
      `Hello ${name}! Welcome, and thanks for joining us to practice English.`,
      `Hi ${name}! So good to meet you. Welcome to your English journey with us.`,
    ]);
  }
  if (/\b(first time|new here)\b/.test(lower) && name) {
    return chooseVariant(text, [
      `Hi ${name}, welcome! You're in the right place. Let's practice step by step.`,
      `Welcome, ${name}! Great first message. We'll build your English naturally from here.`,
      `Nice to meet you, ${name}. Welcome! Let's make your English feel confident and natural.`,
    ]);
  }
  if (/how are you|how's it going/.test(lower)) {
    return chooseVariant(text, [
      "I'm doing great, thanks for asking. How about you?",
      "I'm good, thanks! How's your day going so far?",
      "Doing well here. What about you today?",
    ]);
  }
  if (/\bhello|hi|hey\b/.test(lower)) {
    return chooseVariant(text, [
      "Hey! Great to see you here. What would you like to practice first?",
      "Hi there! Nice to meet you. Want to start with conversation, grammar, or vocabulary?",
      "Hello! I'm glad you're here. What topic do you want to train today?",
    ]);
  }

  if (improved && improved !== corrected) {
    return chooseVariant(text, [
      `Nice sentence. A more natural way to say it is: "${improved}"`,
      `You're very close. I'd say it like this: "${improved}"`,
      `Good attempt. A smoother version would be: "${improved}"`,
    ]);
  }
  return chooseVariant(text, [
    `Great sentence. "${corrected}" sounds natural.`,
    `Well done. "${corrected}" is clear and natural.`,
    `Nice one. "${corrected}" works really well in conversation.`,
  ]);
}

function buildCorrection(text) {
  const raw = (text || "").trim();
  if (!raw) return null;

  let corrected = raw.replace(/\s+/g, " ");
  corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
  if (!/[.!?]$/.test(corrected)) corrected += ".";

  const vocabularyReplacements = [
    { from: /\bvery good\b/gi, to: "excellent" },
    { from: /\bvery bad\b/gi, to: "terrible" },
    { from: /\bbig\b/gi, to: "large" },
    { from: /\bnice\b/gi, to: "pleasant" },
    { from: /\bthing\b/gi, to: "aspect" },
    { from: /\bhelp me\b/gi, to: "assist me" },
  ];

  let improved = corrected;
  vocabularyReplacements.forEach((rule) => {
    improved = improved.replace(rule.from, rule.to);
  });

  const hasChange = improved !== raw;
  const contextTip =
    improved.length < 30
      ? "Try adding context: where, when, and why."
      : "Good structure. Next step: vary connectors like although, therefore, and however.";

  const naturalReply = buildNaturalReply(raw, corrected, improved);

  return { corrected, improved, naturalReply, contextTip, hasChange };
}

function ensureSpeakAI(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.speak_ai) {
    data.modules.speak_ai = {
      history: [],
      last_input: "",
      total_messages: 0,
    };
  }
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureSpeakAI(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureSpeakAI(parsed);
}

function speakMessage(text, lang = "en-US") {
  if (!window.speechSynthesis || !text) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function parseLegacyAiMessage(rawText = "") {
  const lines = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const main = lines[0] || "";
  const corrected =
    lines.find((line) => line.toLowerCase().startsWith("correction:"))?.replace(/^correction:\s*/i, "").replace(/^"|"$/g, "") || "";
  const improved =
    lines.find((line) => line.toLowerCase().startsWith("vocabulary upgrade:"))?.replace(/^vocabulary upgrade:\s*/i, "").replace(/^"|"$/g, "") || "";
  const contextTip =
    lines.find((line) => line.toLowerCase().startsWith("context tip:"))?.replace(/^context tip:\s*/i, "") || "";

  return { main, corrected, improved, contextTip };
}

export default function SpeakWithAI({ setCurrentView, color = "#58cc02" }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningSupported, setListeningSupported] = useState(false);
  const [learningLanguage, setLearningLanguage] = useState("en-US");
  const [openVocabId, setOpenVocabId] = useState(null);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const saved = Array.isArray(progress?.modules?.speak_ai?.history)
          ? progress.modules.speak_ai.history
          : [];
        setMessages(saved.slice(-MAX_HISTORY));
        setLearningLanguage(progress?.languages?.learning_language || "en-US");
      } catch {
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setListeningSupported(true);
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event) => {
        const transcript = event?.results?.[0]?.[0]?.transcript || "";
        setInput((prev) => `${prev} ${transcript}`.trim());
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      recognitionRef.current = rec;
    }

    return () => {
      mounted = false;
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isReplying]);

  const persistHistory = async (nextMessages, lastInput = "") => {
    try {
      const progress = await readProgress();
      const history = nextMessages.slice(-MAX_HISTORY);
      progress.modules.speak_ai = {
        ...(progress.modules.speak_ai || {}),
        history,
        last_input: lastInput,
        total_messages: history.length,
      };
      await writeProgress(progress);
    } catch {
      // no-op
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isReplying) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      role: "user",
      text,
    };

    const correction = buildCorrection(text);
    const aiMsg = {
      id: `a_${Date.now() + 1}`,
      role: "ai",
      text: correction?.naturalReply || "I could not process your sentence. Please try again.",
      corrected: correction?.corrected || "",
      improved: correction?.improved || "",
      contextTip: correction?.contextTip || "",
    };

    const next = [...messages, userMsg, aiMsg].slice(-MAX_HISTORY);
    setInput("");
    setIsReplying(true);
    setMessages(next);
    await persistHistory(next, text);
    setIsReplying(false);
  };

  const toggleMic = () => {
    if (!listeningSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    recognitionRef.current.lang = learningLanguage || "en-US";
    recognitionRef.current.start();
    setIsListening(true);
  };

  const emptyState = useMemo(
    () =>
      !loading && messages.length === 0 ? (
        <div className="speakai-empty">
          Start by writing a sentence in English. I will correct grammar and suggest better vocabulary.
        </div>
      ) : null,
    [loading, messages.length]
  );

  return (
    <section
      className="speakai-shell"
      style={{
        "--speakai-theme": color,
        "--speakai-theme-soft": alpha(color, 0.16),
      }}
    >
      <header className="speakai-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div>
          <div className="speakai-kicker">AI CONVERSATION</div>
          <h1>Speak With AI</h1>
        </div>
              <ModuleGuideButton moduleKey="speak_ai" color={color} />
</header>

      <section className="speakai-chat">
        {loading ? (
          <div className="speakai-empty">Carregando historico...</div>
        ) : (
          <>
            {messages.map((msg) => (
              <article key={msg.id} className={`speakai-bubble ${msg.role === "user" ? "is-user" : "is-ai"}`}>
                {msg.role === "user" ? (
                  <p>{msg.text}</p>
                ) : (
                  <>
                    {(() => {
                      const legacy = parseLegacyAiMessage(msg.text);
                      const mainText = legacy.main || msg.text;
                      const corrected = msg.corrected || legacy.corrected;
                      const improved = msg.improved || legacy.improved;
                      const contextTip = msg.contextTip || legacy.contextTip;
                      return (
                        <>
                          <p>{mainText}</p>
                          <div className="speakai-ai-extra">
                            {corrected ? <p className="speakai-meta-line">Correction: "{corrected}"</p> : null}
                            {contextTip ? <p className="speakai-meta-line">Context tip: {contextTip}</p> : null}

                            <div className="speakai-bubble-actions">
                              <button
                                type="button"
                                className="speakai-audio-btn"
                                onClick={() => speakMessage(mainText, learningLanguage)}
                              >
                                <Volume2 size={16} />
                                Ouvir
                              </button>
                              <button
                                type="button"
                                className="speakai-vocab-btn"
                                onClick={() => setOpenVocabId((prev) => (prev === msg.id ? null : msg.id))}
                              >
                                <BookOpen size={16} />
                                Vocab +
                              </button>
                            </div>

                            {openVocabId === msg.id && improved ? (
                              <div className="speakai-vocab-popup">
                                <strong>Vocabulary upgrade</strong>
                                <p>{improved}</p>
                              </div>
                            ) : null}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </article>
            ))}
            {isReplying && (
              <div className="speakai-loading">
                <Loader2 size={16} className="spin" />
                <span>IA analisando frase...</span>
              </div>
            )}
            {emptyState}
            <div ref={chatEndRef} />
          </>
        )}
      </section>

      <footer className="speakai-input-wrap">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Listening..." : "Type your sentence in English..."}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          type="button"
          className={`speakai-mic-btn ${isListening ? "is-on" : ""}`}
          onClick={toggleMic}
          disabled={!listeningSupported}
          title={listeningSupported ? "Microfone" : "Web Speech API indisponivel"}
        >
          <Mic size={20} />
        </button>
        <button type="button" className="speakai-send-btn" onClick={sendMessage} disabled={!input.trim()}>
          <Send size={18} />
          Enviar
        </button>
      </footer>
    </section>
  );
}
