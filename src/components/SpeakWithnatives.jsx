import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Video,
  Send,
  Star,
  Info,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  PhoneOff,
} from "lucide-react";

const NATIVE_LIST = [
  {
    id: "n1",
    name: "Emma Johnson",
    country: "United Kingdom",
    flag: "🇬🇧",
    accent: "British",
    online: true,
    rating: 4.9,
    reviews: 238,
    photo: "https://i.pravatar.cc/220?img=47",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    bio: "Cambridge tutor. Focus on job interviews and fluency confidence.",
  },
  {
    id: "n2",
    name: "Liam Carter",
    country: "United States",
    flag: "🇺🇸",
    accent: "American",
    online: true,
    rating: 4.8,
    reviews: 192,
    photo: "https://i.pravatar.cc/220?img=14",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    bio: "Business English coach. Meetings, presentations and negotiation.",
  },
  {
    id: "n3",
    name: "Olivia Smith",
    country: "Canada",
    flag: "🇨🇦",
    accent: "North American",
    online: false,
    rating: 4.7,
    reviews: 164,
    photo: "https://i.pravatar.cc/220?img=5",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    bio: "General conversation and pronunciation correction.",
  },
  {
    id: "n4",
    name: "Noah Brown",
    country: "Australia",
    flag: "🇦🇺",
    accent: "Australian",
    online: true,
    rating: 4.9,
    reviews: 287,
    photo: "https://i.pravatar.cc/220?img=68",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    bio: "IELTS speaking specialist and advanced vocabulary.",
  },
];

function ensureNatives(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.speak_with_natives) {
    data.modules.speak_with_natives = {
      sessions_history: [],
      total_sessions: 0,
      total_minutes: 0,
      last_native_id: null,
    };
  }
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureNatives(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureNatives(parsed);
}

export default function SpeakWithnatives({ setCurrentView, color = "#d1a56b" }) {
  const [stage, setStage] = useState("list");
  const [selectedNative, setSelectedNative] = useState(null);
  const [expandedNativeId, setExpandedNativeId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState([]);
  const [callStartedAt, setCallStartedAt] = useState(null);
  const [callError, setCallError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [historyMeta, setHistoryMeta] = useState({
    total_sessions: 0,
    total_minutes: 0,
  });

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const block = progress.modules.speak_with_natives;
        setHistoryMeta({
          total_sessions: Number(block.total_sessions || 0),
          total_minutes: Number(block.total_minutes || 0),
        });
      } catch {
        if (!mounted) return;
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (stage !== "call") return;

    const attachLocal = async () => {
      if (!localVideoRef.current || !localStreamRef.current) return;
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.muted = true;
      try {
        await localVideoRef.current.play();
      } catch {
        // autoplay can fail silently in some browsers
      }
    };

    attachLocal();
  }, [stage, selectedNative]);

  const onlineCount = useMemo(() => NATIVE_LIST.filter((n) => n.online).length, []);

  const renderStars = (value) => {
    const full = Math.round(value || 0);
    return Array.from({ length: 5 }).map((_, idx) => (
      <Star key={idx} size={14} className={idx < full ? "is-on" : ""} />
    ));
  };

  const stopMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  };

  const startCall = async (native) => {
    setIsConnecting(true);
    setCallError("");
    setSelectedNative(native);
    setChat([
      {
        id: `m_${Date.now()}`,
        author: native.name,
        text: "Hi! Great to meet you. What topic do you want to practice today?",
      },
    ]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCallStartedAt(Date.now());
      setStage("call");
    } catch {
      setCallError("Nao foi possivel acessar camera/microfone. Verifique as permissoes.");
      stopMedia();
      setSelectedNative(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMessage = { id: `u_${Date.now()}`, author: "You", text };
    const nativeReply = {
      id: `r_${Date.now() + 1}`,
      author: selectedNative.name,
      text: "Nice sentence. Try adding one specific detail to make it more natural.",
    };

    setChat((prev) => [...prev, userMessage, nativeReply]);
    setChatInput("");
  };

  const endCall = async () => {
    const start = callStartedAt || Date.now();
    const durationMinutes = Math.max(1, Math.round((Date.now() - start) / 60000));

    try {
      const progress = await readProgress();
      const block = progress.modules.speak_with_natives;
      const previous = Array.isArray(block.sessions_history) ? block.sessions_history : [];
      const session = {
        id: `s_${Date.now()}`,
        native_id: selectedNative?.id || null,
        native_name: selectedNative?.name || "Unknown",
        started_at: new Date(start).toISOString(),
        duration_minutes: durationMinutes,
        messages_count: chat.length,
      };

      progress.modules.speak_with_natives = {
        sessions_history: [...previous, session].slice(-50),
        total_sessions: Number(block.total_sessions || 0) + 1,
        total_minutes: Number(block.total_minutes || 0) + durationMinutes,
        last_native_id: selectedNative?.id || null,
      };
      await writeProgress(progress);

      setHistoryMeta({
        total_sessions: progress.modules.speak_with_natives.total_sessions,
        total_minutes: progress.modules.speak_with_natives.total_minutes,
      });
    } catch {
      // no-op
    } finally {
      stopMedia();
      setStage("list");
      setSelectedNative(null);
      setChat([]);
      setChatInput("");
      setCallStartedAt(null);
      setIsMicOn(true);
      setIsCamOn(true);
    }
  };

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isMicOn;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setIsMicOn(next);
  };

  const toggleCam = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isCamOn;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setIsCamOn(next);
  };

  return (
    <section className="natives-shell" style={{ "--natives-theme": color }}>
      <header className="natives-head">
        <button
          type="button"
          className="duo-back-btn"
          onClick={() => {
            if (stage === "call") endCall();
            else setCurrentView("initial");
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div>
          <div className="natives-kicker">SPEAK WITH NATIVES</div>
          <h1>Natives Call</h1>
        </div>
      </header>

      {stage === "list" && (
        <section className="natives-list-card">
          <div className="natives-summary">
            <span>Online agora: {onlineCount}</span>
            <span>Sessoes: {historyMeta.total_sessions}</span>
            <span>Minutos: {historyMeta.total_minutes}</span>
          </div>

          <div className="natives-grid">
            {NATIVE_LIST.map((native, idx) => (
              <article key={native.id} className={`native-card ${idx % 2 ? "offset-right" : "offset-left"}`}>
                <div className="native-main">
                  <div className="native-photo-wrap">
                    <img src={native.photo} alt={native.name} className="native-photo" />
                    <span className="native-flag">{native.flag}</span>
                  </div>
                  <div className="native-main-text">
                    <strong>{native.name}</strong>
                    <span>
                      {native.country} | {native.accent}
                    </span>
                    <div className="native-rating">
                      <div className="native-stars">{renderStars(native.rating)}</div>
                      <small>
                        {native.rating.toFixed(1)} ({native.reviews})
                      </small>
                    </div>
                    <em className={native.online ? "is-online" : "is-offline"}>
                      {native.online ? "Online" : "Offline"}
                    </em>
                  </div>
                </div>
                <div className="native-card-actions">
                  <button
                    type="button"
                    className="native-info-btn"
                    onClick={() => setExpandedNativeId((prev) => (prev === native.id ? null : native.id))}
                  >
                    <Info size={15} />
                    Mais informacoes
                  </button>
                  <button
                    type="button"
                    className="native-call-btn"
                    disabled={!native.online || isConnecting}
                    onClick={() => startCall(native)}
                  >
                    <Video size={16} />
                    {native.online ? "Entrar na call" : "Indisponivel"}
                  </button>
                </div>
              </article>
            ))}

            {NATIVE_LIST.map((native) =>
              expandedNativeId === native.id ? (
                <article key={`${native.id}_info`} className="native-info-panel">
                  <strong>Perfil de {native.name}</strong>
                  <p>{native.bio}</p>
                </article>
              ) : null
            )}
          </div>
          {callError ? <div className="natives-call-error">{callError}</div> : null}
        </section>
      )}

      {stage === "call" && selectedNative && (
        <section className="natives-call-layout">
          <div className="natives-video-area">
            <div className="natives-remote-video">
              <video key={selectedNative.id} src={selectedNative.video} autoPlay loop playsInline muted />
              <div className="natives-video-label">
                <span>{selectedNative.flag}</span>
                <strong>{selectedNative.name}</strong>
              </div>
            </div>
            <div className="natives-local-video">
              <video ref={localVideoRef} autoPlay playsInline muted />
              <div className="natives-video-label">
                <strong>Voce</strong>
              </div>
            </div>
            <div className="natives-call-controls">
              <button type="button" className="natives-control-btn" onClick={toggleMic}>
                {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                {isMicOn ? "Mic on" : "Mic off"}
              </button>
              <button type="button" className="natives-control-btn" onClick={toggleCam}>
                {isCamOn ? <Camera size={16} /> : <CameraOff size={16} />}
                {isCamOn ? "Cam on" : "Cam off"}
              </button>
              <button type="button" className="natives-end-btn" onClick={endCall}>
                <PhoneOff size={16} />
                Encerrar
              </button>
            </div>
          </div>

          <aside className="natives-chat-panel">
            <h2>Chat</h2>
            <div className="natives-chat-list">
              {chat.map((m) => (
                <article key={m.id} className={`natives-chat-bubble ${m.author === "You" ? "is-user" : ""}`}>
                  <strong>{m.author}</strong>
                  <p>{m.text}</p>
                </article>
              ))}
            </div>
            <footer className="natives-chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Type your message..."
              />
              <button type="button" onClick={sendMessage}>
                <Send size={16} />
              </button>
            </footer>
          </aside>
        </section>
      )}
    </section>
  );
}
