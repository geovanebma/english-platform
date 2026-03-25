import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, Mic, Send, Volume2, Loader2, BookOpen } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const MAX_HISTORY = 40;
const VOCAB_SYNC_LIMIT = 120;
const AI_ENDPOINT = import.meta.env.VITE_SPEAKAI_API_URL || "";

const VOCAB_STOPWORDS = new Set([
  "the","a","an","and","or","but","so","to","of","in","on","at","for","with","from","by","is","am","are","was","were","be","been","being",
  "do","does","did","have","has","had","will","would","can","could","should","may","might","must","i","you","he","she","it","we","they",
  "me","him","her","us","them","my","your","his","their","our","this","that","these","those","there","here","what","when","where","why",
  "how","hello","hi","hey","thanks","thank","please","good","great","nice","very","really","today","tomorrow","yesterday","want","like"
]);

function hexToRgb(hex) {
  const cleaned = (hex || "#58cc02").replace("#", "");
  const normalized = cleaned.length === 3 ? cleaned.split("").map((c) => c + c).join("") : cleaned;
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

function inferTopic(text = "") {
  const raw = String(text || "").toLowerCase();
  if (/\b(travel|hotel|airport|trip|flight)\b/.test(raw)) return "travel";
  if (/\b(work|meeting|office|job|interview|client)\b/.test(raw)) return "work";
  if (/\b(friend|family|name|hello|meet)\b/.test(raw)) return "social";
  if (/\b(food|restaurant|lunch|dinner|coffee)\b/.test(raw)) return "food";
  if (/\b(study|grammar|vocabulary|english|learn)\b/.test(raw)) return "study";
  return "general";
}

function describeTopic(topic) {
  switch (topic) {
    case "travel":
      return "travel English";
    case "work":
      return "professional communication";
    case "social":
      return "social conversation";
    case "food":
      return "food and restaurant English";
    case "study":
      return "study and learning language";
    default:
      return "general conversation";
  }
}

function buildNaturalReply(rawText = "", corrected = "", improved = "", recentMessages = [], topic = "general") {
  const text = String(rawText || "").trim();
  const lower = text.toLowerCase();
  const name = extractName(text);
  const recentUserTopics = recentMessages
    .filter((msg) => msg?.role === "user")
    .slice(-3)
    .map((msg) => String(msg.text || "").toLowerCase())
    .join(" ");

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

  if (topic === "travel" || /travel|hotel|airport|trip/.test(`${lower} ${recentUserTopics}`)) {
    return chooseVariant(text, [
      `Nice. We can keep this in a travel context. "${improved || corrected}" sounds natural here.`,
      `Great topic. For travel English, I would say: "${improved || corrected}"`,
      `That works well in a travel situation. A polished version is: "${improved || corrected}"`,
    ]);
  }

  if (topic === "work" || /work|meeting|job|interview|office/.test(`${lower} ${recentUserTopics}`)) {
    return chooseVariant(text, [
      `Nice professional phrasing. In a work context, "${improved || corrected}" sounds more polished.`,
      `Good workplace English. A stronger version would be: "${improved || corrected}"`,
      `That idea is clear. For a professional setting, I would naturally say: "${improved || corrected}"`,
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

function buildFollowUpQuestion(topic = "general", recentMessages = []) {
  const recentText = recentMessages
    .filter((msg) => msg?.role === "user")
    .slice(-2)
    .map((msg) => String(msg.text || "").toLowerCase())
    .join(" ");

  if (topic === "travel" || /hotel|trip|airport|flight/.test(recentText)) {
    return "What part of the trip do you want to describe next?";
  }
  if (topic === "work" || /meeting|client|office|job/.test(recentText)) {
    return "Can you give me one more sentence from that work situation?";
  }
  if (topic === "food") {
    return "What would you order or say in that situation?";
  }
  if (topic === "study") {
    return "Do you want to practice a grammar point or a real-life sentence next?";
  }
  return "What would you like to say next?";
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

  const topic = inferTopic(raw);
  const naturalReply = buildNaturalReply(raw, corrected, improved, [], topic);
  return { corrected, improved, naturalReply, contextTip, hasChange, topic };
}

function ensureSpeakAI(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.speak_ai) {
    data.modules.speak_ai = {
      history: [],
      last_input: "",
      total_messages: 0,
      sync_my_vocabulary: false,
      topic_memory: [],
      recent_topics: [],
    };
  }
  if (typeof data.modules.speak_ai.sync_my_vocabulary !== "boolean") {
    data.modules.speak_ai.sync_my_vocabulary = false;
  }
  if (!Array.isArray(data.modules.speak_ai.topic_memory)) {
    data.modules.speak_ai.topic_memory = [];
  }
  if (!Array.isArray(data.modules.speak_ai.recent_topics)) {
    data.modules.speak_ai.recent_topics = [];
  }
  if (!data.modules.my_vocabulary) {
    data.modules.my_vocabulary = { saved_words_custom: [] };
  }
  return data;
}

function extractVocabularyCandidates(...texts) {
  const bag = new Map();
  texts
    .map((text) => String(text || ""))
    .forEach((text) => {
      const words = text
        .toLowerCase()
        .replace(/[^a-z'\s-]/g, " ")
        .split(/\s+/)
        .map((word) => word.replace(/^'+|'+$/g, ""))
        .filter((word) => word.length >= 3 && !VOCAB_STOPWORDS.has(word));
      words.forEach((word) => {
        if (!bag.has(word)) {
          bag.set(word, {
            id: `speakai-${word}`,
            rank: 100000 + bag.size + 1,
            word,
            source: "speak_ai",
            added_at: new Date().toISOString(),
          });
        }
      });
    });
  return [...bag.values()].slice(0, 8);
}

function mergeSavedCustomWords(existing = [], incoming = []) {
  const map = new Map();
  [...existing, ...incoming].forEach((entry) => {
    if (!entry?.word) return;
    const key = String(entry.word).toLowerCase();
    if (!map.has(key)) {
      map.set(key, entry);
    }
  });
  return [...map.values()].slice(0, VOCAB_SYNC_LIMIT);
}

function buildTopicMemory(history = []) {
  const counts = new Map();
  history
    .filter((msg) => msg?.role === "ai" && msg?.topic)
    .forEach((msg) => counts.set(msg.topic, (counts.get(msg.topic) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([topic, count]) => ({ topic, count }));
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

async function fetchRealAiReply(payload) {
  if (!AI_ENDPOINT) return null;
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const parsed = await res.json();
    return {
      text: String(parsed?.reply || parsed?.text || "").trim(),
      corrected: String(parsed?.corrected || "").trim(),
      improved: String(parsed?.improved || "").trim(),
      contextTip: String(parsed?.contextTip || parsed?.context_tip || "").trim(),
      topic: String(parsed?.topic || payload?.topic || "general").trim() || "general",
    };
  } catch {
    return null;
  }
}

function parseLegacyAiMessage(rawText = "") {
  const lines = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const main = lines[0] || "";
  const corrected = lines.find((line) => line.toLowerCase().startsWith("correction:"))?.replace(/^correction:\s*/i, "").replace(/^"|"$/g, "") || "";
  const improved = lines.find((line) => line.toLowerCase().startsWith("vocabulary upgrade:"))?.replace(/^vocabulary upgrade:\s*/i, "").replace(/^"|"$/g, "") || "";
  const contextTip = lines.find((line) => line.toLowerCase().startsWith("context tip:"))?.replace(/^context tip:\s*/i, "") || "";

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
  const [syncMyVocabulary, setSyncMyVocabulary] = useState(false);
  const [voiceToVoice, setVoiceToVoice] = useState(false);
  const [topicMemory, setTopicMemory] = useState([]);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const saved = Array.isArray(progress?.modules?.speak_ai?.history) ? progress.modules.speak_ai.history : [];
        setMessages(saved.slice(-MAX_HISTORY));
        setLearningLanguage(progress?.languages?.learning_language || "en-US");
        setSyncMyVocabulary(Boolean(progress?.modules?.speak_ai?.sync_my_vocabulary));
        setVoiceToVoice(Boolean(progress?.modules?.speak_ai?.voice_to_voice));
        setTopicMemory(Array.isArray(progress?.modules?.speak_ai?.topic_memory) ? progress.modules.speak_ai.topic_memory : []);
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
  }, [voiceToVoice]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isReplying]);

  const persistHistory = async (nextMessages, lastInput = "", extras = {}) => {
    try {
      const progress = await readProgress();
      const history = nextMessages.slice(-MAX_HISTORY);
      const myVocabulary = progress.modules.my_vocabulary || {};
      const existingCustom = Array.isArray(myVocabulary.saved_words_custom) ? myVocabulary.saved_words_custom : [];
      const incomingCustom = Array.isArray(extras.savedWordsCustom) ? extras.savedWordsCustom : [];
      const recentTopics = history.filter((msg) => msg?.topic).map((msg) => msg.topic).slice(-8);
      const nextTopicMemory = buildTopicMemory(history);
      progress.modules.speak_ai = {
        ...(progress.modules.speak_ai || {}),
        history,
        last_input: lastInput,
        total_messages: history.length,
        sync_my_vocabulary: extras.syncMyVocabulary ?? syncMyVocabulary,
        topic_memory: nextTopicMemory,
        recent_topics: recentTopics,
      };
      if (incomingCustom.length > 0) {
        progress.modules.my_vocabulary = {
          ...myVocabulary,
          saved_words_custom: mergeSavedCustomWords(existingCustom, incomingCustom),
        };
      }
      const saved = await writeProgress(progress);
      setTopicMemory(saved.modules.speak_ai.topic_memory || []);
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
      topic: inferTopic(text),
    };

    const correction = buildCorrection(text);
    const nextDraft = [...messages, userMsg].slice(-MAX_HISTORY);
    const aiMsg = {
      id: `a_${Date.now() + 1}`,
      role: "ai",
      text: buildNaturalReply(text, correction?.corrected || text, correction?.improved || text, nextDraft, correction?.topic || "general"),
      corrected: correction?.corrected || "",
      improved: correction?.improved || "",
      contextTip: correction?.contextTip || "",
      topic: correction?.topic || inferTopic(text),
    };

    const next = [...nextDraft, aiMsg].slice(-MAX_HISTORY);
    setInput("");
    setIsReplying(true);
    setMessages(next);
    const savedWordsCustom = syncMyVocabulary ? extractVocabularyCandidates(text, correction?.corrected, correction?.improved) : [];
    await persistHistory(next, text, {
      syncMyVocabulary,
      savedWordsCustom,
    });
    setIsReplying(false);
  };

  const handleToggleVocabularySync = async () => {
    const nextValue = !syncMyVocabulary;
    setSyncMyVocabulary(nextValue);
    try {
      const progress = await readProgress();
      progress.modules.speak_ai = {
        ...(progress.modules.speak_ai || {}),
        sync_my_vocabulary: nextValue,
      };
      await writeProgress(progress);
    } catch {
      setSyncMyVocabulary((prev) => !prev);
    }
  };

  const handleToggleVoiceToVoice = async () => {
    const nextValue = !voiceToVoice;
    setVoiceToVoice(nextValue);
    try {
      const progress = await readProgress();
      progress.modules.speak_ai = {
        ...(progress.modules.speak_ai || {}),
        voice_to_voice: nextValue,
      };
      await writeProgress(progress);
    } catch {
      setVoiceToVoice((prev) => !prev);
    }
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

  const getTopicLabel = (topic) => {
    switch (topic) {
      case "travel":
        return getUiLabel("speak_ai.topic.travel", "Travel English");
      case "work":
        return getUiLabel("speak_ai.topic.work", "Professional communication");
      case "social":
        return getUiLabel("speak_ai.topic.social", "Social conversation");
      case "food":
        return getUiLabel("speak_ai.topic.food", "Food and restaurant English");
      case "study":
        return getUiLabel("speak_ai.topic.study", "Study and language learning");
      default:
        return getUiLabel("speak_ai.topic.general", "General conversation");
    }
  };

  const emptyState = useMemo(
    () =>
      !loading && messages.length === 0 ? (
        <div className="speakai-empty">
          {getUiLabel("speak_ai.empty", "Start by writing a sentence in English. I will correct grammar and suggest better vocabulary.")}
        </div>
      ) : null,
    [loading, messages.length]
  );

  const latestFocus = topicMemory[0] ? getTopicLabel(topicMemory[0].topic) : getUiLabel("speak_ai.no_topic", "No strong topic yet");

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
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="speakai-kicker">{getUiLabel("speak_ai.kicker", "AI CONVERSATION")}</div>
          <h1>{getUiLabel("module.speak_ai", "Speak With AI")}</h1>
        </div>
        <ModuleGuideButton moduleKey="speak_ai" color={color} />
      </header>

      <section className="speakai-sync-card">
        <div>
          <div className="speakai-sync-kicker">{getUiLabel("flash.sync.kicker", "MY VOCABULARY")}</div>
          <strong>{getUiLabel("speak_ai.sync.title", "Update vocabulary with the conversation")}</strong>
          <p>{getUiLabel("speak_ai.sync.desc", "When enabled, relevant words from your messages are added to My Vocabulary.")}</p>
        </div>
        <button
          type="button"
          className={`speakai-sync-toggle ${syncMyVocabulary ? "is-on" : ""}`}
          onClick={handleToggleVocabularySync}
          aria-pressed={syncMyVocabulary}
        >
          <span className="speakai-sync-toggle-dot" />
          {syncMyVocabulary ? getUiLabel("flash.toggle.on", "ON") : getUiLabel("flash.toggle.off", "OFF")}
        </button>
      </section>

      <section className="speakai-memory-card">
        <div>
          <div className="speakai-sync-kicker">{getUiLabel("speak_ai.memory.kicker", "MEMORY")}</div>
          <strong>{getUiLabel("speak_ai.memory.title", "Current conversation focus")}</strong>
          <p>{latestFocus}</p>
        </div>
        <div className="speakai-memory-tags">
          {topicMemory.length ? topicMemory.map((item) => (
            <span key={item.topic} className="speakai-memory-tag">{getTopicLabel(item.topic)} - {item.count}</span>
          )) : <span className="speakai-memory-tag">{getUiLabel("speak_ai.memory.fresh", "Fresh conversation")}</span>}
        </div>
      </section>

      <section className="speakai-chat">
        {loading ? (
          <div className="speakai-empty">{getUiLabel("speak_ai.loading_history", "Loading history...")}</div>
        ) : (
          <>
            {messages.map((msg) => (
              <article key={msg.id} className={`speakai-bubble ${msg.role === "user" ? "is-user" : "is-ai"}`}>
                {msg.role === "user" ? (
                  <p>{msg.text}</p>
                ) : (
                  (() => {
                    const legacy = parseLegacyAiMessage(msg.text);
                    const mainText = legacy.main || msg.text;
                    const corrected = msg.corrected || legacy.corrected;
                    const improved = msg.improved || legacy.improved;
                    const contextTip = msg.contextTip || legacy.contextTip;
                    return (
                      <>
                        <p>{mainText}</p>
                        <div className="speakai-ai-extra">
                          {corrected ? <p className="speakai-meta-line">{getUiLabel("speak_ai.correction", "Correction")}: "{corrected}"</p> : null}
                          {contextTip ? <p className="speakai-meta-line">{getUiLabel("speak_ai.context_tip", "Context tip")}: {contextTip}</p> : null}
                          {msg.topic ? <p className="speakai-meta-line">{getUiLabel("speak_ai.context", "Context")}: {getTopicLabel(msg.topic)}</p> : null}
                          <div className="speakai-bubble-actions">
                            <button type="button" className="speakai-audio-btn" onClick={() => speakMessage(mainText, learningLanguage)}>
                              <Volume2 size={16} />
                              {getUiLabel("dictionary.listen", "Listen")}
                            </button>
                            <button type="button" className="speakai-vocab-btn" onClick={() => setOpenVocabId((prev) => (prev === msg.id ? null : msg.id))}>
                              <BookOpen size={16} />
                              {getUiLabel("speak_ai.vocab_plus", "Vocab +")}
                            </button>
                          </div>
                          {openVocabId === msg.id && improved ? (
                            <div className="speakai-vocab-popup">
                              <strong>{getUiLabel("speak_ai.vocab_upgrade", "Vocabulary upgrade")}</strong>
                              <p>{improved}</p>
                            </div>
                          ) : null}
                        </div>
                      </>
                    );
                  })()
                )}
              </article>
            ))}
            {isReplying && (
              <div className="speakai-loading">
                <Loader2 size={16} className="spin" />
                <span>{getUiLabel("speak_ai.replying", "AI is analyzing your sentence...")}</span>
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
          placeholder={isListening ? getUiLabel("speak_ai.listening", "Listening...") : getUiLabel("speak_ai.placeholder", "Type your sentence in English...")}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button
          type="button"
          className={`speakai-mic-btn ${isListening ? "is-on" : ""}`}
          onClick={toggleMic}
          disabled={!listeningSupported}
          title={listeningSupported ? getUiLabel("speak_ai.microphone", "Microphone") : getUiLabel("speak_ai.webspeech_unavailable", "Web Speech API unavailable")}
        >
          <Mic size={20} />
        </button>
        <button type="button" className="speakai-send-btn" onClick={sendMessage} disabled={!input.trim() || isReplying}>
          <Send size={18} />
          {getUiLabel("common.send", "Send")}
        </button>
      </footer>
    </section>
  );
}





