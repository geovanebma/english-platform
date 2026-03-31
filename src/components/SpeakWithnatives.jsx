import React, { useEffect, useMemo, useRef, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
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
  ShieldAlert,
  CalendarDays,
  UserCheck,
} from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const NATIVE_LIST = [
  {
    id: "n1",
    name: "Emma Johnson",
    country: "United Kingdom",
    flag: "\uD83C\uDDEC\uD83C\uDDE7",
    accent: "British",
    online: true,
    rating: 4.9,
    reviews: 238,
    photo: "https://i.pravatar.cc/220?img=47",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    bio: "Cambridge tutor. Focus on job interviews and fluency confidence.",
    goals: ["work", "conversation"],
    slots: ["09:00", "11:30", "19:00"],
  },
  {
    id: "n2",
    name: "Liam Carter",
    country: "United States",
    flag: "\uD83C\uDDFA\uD83C\uDDF8",
    accent: "American",
    online: true,
    rating: 4.8,
    reviews: 192,
    photo: "https://i.pravatar.cc/220?img=14",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    bio: "Business English coach. Meetings, presentations and negotiation.",
    goals: ["work", "exam"],
    slots: ["08:30", "14:00", "20:00"],
  },
  {
    id: "n3",
    name: "Olivia Smith",
    country: "Canada",
    flag: "\uD83C\uDDE8\uD83C\uDDE6",
    accent: "North American",
    online: false,
    rating: 4.7,
    reviews: 164,
    photo: "https://i.pravatar.cc/220?img=5",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    bio: "General conversation and pronunciation correction.",
    goals: ["conversation", "travel"],
    slots: ["10:00", "16:00", "21:00"],
  },
  {
    id: "n4",
    name: "Noah Brown",
    country: "Australia",
    flag: "\uD83C\uDDE6\uD83C\uDDFA",
    accent: "Australian",
    online: true,
    rating: 4.9,
    reviews: 287,
    photo: "https://i.pravatar.cc/220?img=68",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    bio: "IELTS speaking specialist and advanced vocabulary.",
    goals: ["exam", "conversation"],
    slots: ["07:00", "12:30", "22:00"],
  },
];

const GOAL_OPTIONS = [
  { key: "all", labelKey: "natives.goal.all", fallback: "All" },
  { key: "conversation", labelKey: "natives.goal.conversation", fallback: "Conversation" },
  { key: "work", labelKey: "natives.goal.work", fallback: "Work" },
  { key: "travel", labelKey: "natives.goal.travel", fallback: "Travel" },
  { key: "exam", labelKey: "natives.goal.exam", fallback: "Exam" },
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
      blocked_native_ids: [],
      reports: [],
      scheduled_requests: [],
      preferred_goal: "all",
      safety_mode: true,
    };
  }
  const block = data.modules.speak_with_natives;
  if (!Array.isArray(block.blocked_native_ids)) block.blocked_native_ids = [];
  if (!Array.isArray(block.reports)) block.reports = [];
  if (!Array.isArray(block.scheduled_requests)) block.scheduled_requests = [];
  if (!block.preferred_goal) block.preferred_goal = "all";
  if (typeof block.safety_mode !== "boolean") block.safety_mode = true;
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to read progress");
  const parsed = await res.json();
  return ensureNatives(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Failed to save progress");
  const parsed = await res.json();
  return ensureNatives(parsed);
}

function currentHourMinute() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function slotToMinutes(slot) {
  const [h, m] = String(slot).split(":").map(Number);
  return (Number(h) || 0) * 60 + (Number(m) || 0);
}

function isNativeCurrentlyOnline(native) {
  const nowMin = currentHourMinute();
  const slotLive = (native.slots || []).some((slot) => Math.abs(slotToMinutes(slot) - nowMin) <= 90);
  return Boolean(native.online && slotLive);
}

function formatDateTime(date) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return String(date || "");
  }
}

async function setupRemoteWebRtc(remoteSourceEl, remoteTargetEl) {
  if (!remoteSourceEl || !remoteTargetEl) return null;
  const sourcePlay = remoteSourceEl.play();
  if (sourcePlay?.catch) {
    try { await sourcePlay; } catch {}
  }
  const captureStream = remoteSourceEl.captureStream?.() || remoteSourceEl.mozCaptureStream?.();
  if (!captureStream) {
    remoteTargetEl.srcObject = null;
    remoteTargetEl.src = remoteSourceEl.currentSrc || remoteSourceEl.src;
    remoteTargetEl.muted = false;
    try { await remoteTargetEl.play(); } catch {}
    return null;
  }

  const localPeer = new RTCPeerConnection();
  const remotePeer = new RTCPeerConnection();
  const remoteStream = new MediaStream();
  remoteTargetEl.srcObject = remoteStream;

  captureStream.getTracks().forEach((track) => localPeer.addTrack(track, captureStream));
  localPeer.onicecandidate = (event) => event.candidate && remotePeer.addIceCandidate(event.candidate).catch(() => {});
  remotePeer.onicecandidate = (event) => event.candidate && localPeer.addIceCandidate(event.candidate).catch(() => {});
  remotePeer.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
  };

  const offer = await localPeer.createOffer();
  await localPeer.setLocalDescription(offer);
  await remotePeer.setRemoteDescription(offer);
  const answer = await remotePeer.createAnswer();
  await remotePeer.setLocalDescription(answer);
  await localPeer.setRemoteDescription(answer);

  try { await remoteTargetEl.play(); } catch {}
  return { localPeer, remotePeer, captureStream };
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
  const [historyMeta, setHistoryMeta] = useState({ total_sessions: 0, total_minutes: 0 });
  const [preferredGoal, setPreferredGoal] = useState("all");
  const [blockedNativeIds, setBlockedNativeIds] = useState([]);
  const [scheduledRequests, setScheduledRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [safetyMode, setSafetyMode] = useState(true);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteSourceRef = useRef(null);
  const rtcRef = useRef(null);

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
        setPreferredGoal(block.preferred_goal || "all");
        setBlockedNativeIds(block.blocked_native_ids || []);
        setScheduledRequests(block.scheduled_requests || []);
        setReports(block.reports || []);
        setSafetyMode(Boolean(block.safety_mode));
      } catch {
        if (!mounted) return;
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (stage !== "call" || !selectedNative) return;
    let active = true;
    const attachMedia = async () => {
      if (!localVideoRef.current || !localStreamRef.current || !remoteVideoRef.current || !remoteSourceRef.current) return;
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.muted = true;
      try { await localVideoRef.current.play(); } catch {}
      rtcRef.current = await setupRemoteWebRtc(remoteSourceRef.current, remoteVideoRef.current);
      if (!active && rtcRef.current) {
        try { rtcRef.current.localPeer?.close(); } catch {}
        try { rtcRef.current.remotePeer?.close(); } catch {}
      }
    };
    void attachMedia();
    return () => {
      active = false;
    };
  }, [stage, selectedNative]);

  const visibleNatives = useMemo(() => {
    return NATIVE_LIST
      .filter((native) => !blockedNativeIds.includes(native.id))
      .filter((native) => preferredGoal === "all" || native.goals?.includes(preferredGoal))
      .sort((a, b) => Number(isNativeCurrentlyOnline(b)) - Number(isNativeCurrentlyOnline(a)) || b.rating - a.rating);
  }, [blockedNativeIds, preferredGoal]);

  const onlineCount = useMemo(() => visibleNatives.filter((n) => isNativeCurrentlyOnline(n)).length, [visibleNatives]);

  const persistNativesState = async (patch = {}) => {
    try {
      const progress = await readProgress();
      progress.modules.speak_with_natives = {
        ...progress.modules.speak_with_natives,
        preferred_goal: patch.preferred_goal ?? preferredGoal,
        blocked_native_ids: patch.blocked_native_ids ?? blockedNativeIds,
        scheduled_requests: patch.scheduled_requests ?? scheduledRequests,
        reports: patch.reports ?? reports,
        safety_mode: typeof patch.safety_mode === "boolean" ? patch.safety_mode : safetyMode,
      };
      const saved = await writeProgress(progress);
      const block = saved.modules.speak_with_natives;
      setPreferredGoal(block.preferred_goal || "all");
      setBlockedNativeIds(block.blocked_native_ids || []);
      setScheduledRequests(block.scheduled_requests || []);
      setReports(block.reports || []);
      setSafetyMode(Boolean(block.safety_mode));
    } catch {
      // no-op
    }
  };

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
    if (remoteVideoRef.current) {
      remoteVideoRef.current.pause?.();
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current.src = "";
    }
    if (remoteSourceRef.current) {
      remoteSourceRef.current.pause?.();
      remoteSourceRef.current.src = "";
      remoteSourceRef.current.srcObject = null;
    }
    if (rtcRef.current) {
      try { rtcRef.current.localPeer?.close(); } catch {}
      try { rtcRef.current.remotePeer?.close(); } catch {}
      rtcRef.current = null;
    }
  };

  const startCall = async (native) => {
    setIsConnecting(true);
    setCallError("");
    setSelectedNative(native);
    setChat([
      {
        id: `m_${Date.now()}`,
        author: native.name,
        text: `${getUiLabel("natives.chat.greeting", "Hi! Great to meet you.")} ${getUiLabel("natives.chat.focus_intro", "We can focus on")} ${preferredGoal === "all" ? getUiLabel("natives.goal.conversation", "conversation") : (GOAL_OPTIONS.find((item) => item.key === preferredGoal)?.fallback || preferredGoal)} ${getUiLabel("natives.chat.today", "today.")} ${getUiLabel("natives.chat.question", "What do you want to practice first?")}`,
      },
    ]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setCallStartedAt(Date.now());
      setStage("call");
    } catch {
      setCallError(getUiLabel("natives.error.permissions", "Could not access camera/microphone. Check permissions."));
      stopMedia();
      setSelectedNative(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const scheduleCall = async (native, slot) => {
    const nextScheduled = [
      {
        id: `sched_${Date.now()}`,
        native_id: native.id,
        native_name: native.name,
        slot,
        goal: preferredGoal,
        created_at: new Date().toISOString(),
      },
      ...scheduledRequests,
    ].slice(0, 20);
    setScheduledRequests(nextScheduled);
    await persistNativesState({ scheduled_requests: nextScheduled });
  };

  const reportNative = async (nativeId, reason = "safety") => {
    const nextReports = [
      {
        id: `rep_${Date.now()}`,
        native_id: nativeId,
        reason,
        created_at: new Date().toISOString(),
      },
      ...reports,
    ].slice(0, 30);
    setReports(nextReports);
    await persistNativesState({ reports: nextReports });
  };

  const blockNative = async (nativeId) => {
    if (blockedNativeIds.includes(nativeId)) return;
    const nextBlocked = [...blockedNativeIds, nativeId];
    setBlockedNativeIds(nextBlocked);
    await persistNativesState({ blocked_native_ids: nextBlocked });
  };

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text || !selectedNative) return;
    const userMessage = { id: `u_${Date.now()}`, author: "You", text };
    const nativeReply = {
      id: `r_${Date.now() + 1}`,
      author: selectedNative.name,
      text:
        preferredGoal === "work"
          ? getUiLabel("natives.reply.work", "Nice. Try making that sound a little more professional and add one concrete detail.")
          : preferredGoal === "exam"
          ? getUiLabel("natives.reply.exam", "Good start. Add a connector like 'however' or 'therefore' to make it stronger.")
          : getUiLabel("natives.reply.default", "Nice sentence. Try adding one specific detail to make it more natural."),
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
        native_name: selectedNative?.name || getUiLabel("common.unknown", "Unknown"),
        started_at: new Date(start).toISOString(),
        duration_minutes: durationMinutes,
        messages_count: chat.length,
        goal: preferredGoal,
        safety_mode,
      };

      progress.modules.speak_with_natives = {
        ...block,
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
            if (stage === "call") void endCall();
            else setCurrentView("initial");
          }}
        >
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="natives-kicker">{getUiLabel("natives.kicker", "SPEAK WITH NATIVES")}</div>
          <h1>{getUiLabel("module.speak_with_natives", "Natives Call")}</h1>
        </div>
        <ModuleGuideButton moduleKey="natives" color={color} />
      </header>

      {stage === "list" && (
        <section className="natives-list-card">
          <div className="natives-summary">
            <span>{getUiLabel("natives.online_now", "Online now")}: {onlineCount}</span>
            <span>{getUiLabel("natives.sessions", "Sessions")}: {historyMeta.total_sessions}</span>
            <span>{getUiLabel("natives.minutes", "Minutes")}: {historyMeta.total_minutes}</span>
          </div>

          <div className="natives-toolbar">
            <label>
{getUiLabel("natives.goal", "Goal")}
              <select
                value={preferredGoal}
                onChange={(e) => {
                  const next = e.target.value;
                  setPreferredGoal(next);
                  void persistNativesState({ preferred_goal: next });
                }}
              >
                {GOAL_OPTIONS.map((goal) => (
                  <option key={goal.key} value={goal.key}>{getUiLabel(goal.labelKey, goal.fallback)}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`natives-safety-btn ${safetyMode ? "is-on" : ""}`}
              onClick={() => {
                const next = !safetyMode;
                setSafetyMode(next);
                void persistNativesState({ safety_mode: next });
              }}
            >
              <ShieldAlert size={15} />
              {getUiLabel("natives.safety_mode", "Safety mode")} {safetyMode ? getUiLabel("flash.toggle.on", "ON") : getUiLabel("flash.toggle.off", "OFF")}
            </button>
            <div className="natives-toolbar-meta">
              <span><CalendarDays size={14} /> {getUiLabel("natives.scheduled", "Scheduled")}: {scheduledRequests.length}</span>
              <span><UserCheck size={14} /> {getUiLabel("natives.blocked", "Blocked")}: {blockedNativeIds.length}</span>
            </div>
          </div>

          <div className="natives-grid">
            {visibleNatives.map((native, idx) => {
              const live = isNativeCurrentlyOnline(native);
              return (
                <article key={native.id} className={`native-card ${idx % 2 ? "offset-right" : "offset-left"}`}>
                  <div className="native-main">
                    <div className="native-photo-wrap">
                      <img src={native.photo} alt={native.name} className="native-photo" />
                      <span className="native-flag">{native.flag}</span>
                    </div>
                    <div className="native-main-text">
                      <strong>{native.name}</strong>
                      <span>{native.country} | {native.accent}</span>
                      <div className="native-rating">
                        <div className="native-stars">{renderStars(native.rating)}</div>
                        <small>{native.rating.toFixed(1)} ({native.reviews})</small>
                      </div>
                      <em className={live ? "is-online" : "is-offline"}>{live ? getUiLabel("natives.online_now", "Online now") : getUiLabel("natives.offline_now", "Offline now")}</em>
                    </div>
                  </div>
                  <div className="native-slot-list">
                    {native.slots.map((slot) => (
                      <button key={`${native.id}_${slot}`} type="button" className="native-slot-chip" onClick={() => void scheduleCall(native, slot)}>
                        <CalendarDays size={13} /> {slot}
                      </button>
                    ))}
                  </div>
                  <div className="native-card-actions">
                    <button type="button" className="native-info-btn" onClick={() => setExpandedNativeId((prev) => (prev === native.id ? null : native.id))}>
                      <Info size={15} />
                      {getUiLabel("natives.more_info", "More information")}
                    </button>
                    <button type="button" className="native-call-btn" disabled={!live || isConnecting} onClick={() => void startCall(native)}>
                      <Video size={16} />
                      {live ? getUiLabel("natives.join_call", "Join call") : getUiLabel("natives.wait_slot", "Wait for slot")}
                    </button>
                  </div>
                </article>
              );
            })}

            {visibleNatives.map((native) =>
              expandedNativeId === native.id ? (
                <article key={`${native.id}_info`} className="native-info-panel">
                  <strong>{getUiLabel("natives.profile_of", "Profile of")} {native.name}</strong>
                  <p>{native.bio}</p>
                  <p>{getUiLabel("natives.goals", "Goals")}: {(native.goals || []).map((goal) => getUiLabel(`natives.goal.${goal}`, goal)).join(", ")}</p>
                  <div className="native-info-actions">
                    <button type="button" onClick={() => void reportNative(native.id, "profile")}>{getUiLabel("natives.report_profile", "Report profile")}</button>
                    <button type="button" onClick={() => void blockNative(native.id)}>{getUiLabel("natives.block", "Block")}</button>
                  </div>
                </article>
              ) : null
            )}
          </div>
          {scheduledRequests.length ? (
            <div className="natives-schedule-card">
              <strong>{getUiLabel("natives.requested_schedule", "Requested schedule")}</strong>
              {scheduledRequests.slice(0, 4).map((item) => (
                <p key={item.id}>{item.native_name} - {item.slot} - {getUiLabel("natives.goal", "Goal")}: {getUiLabel(`natives.goal.${item.goal || "all"}`, item.goal || "all")}</p>
              ))}
            </div>
          ) : null}
          {callError ? <div className="natives-call-error">{callError}</div> : null}
        </section>
      )}

      {stage === "call" && selectedNative && (
        <section className="natives-call-layout">
          <div className="natives-video-area">
            <video ref={remoteSourceRef} src={selectedNative.video} muted loop playsInline className="natives-hidden-source" />
            <div className="natives-remote-video">
              <video ref={remoteVideoRef} autoPlay playsInline />
              <div className="natives-video-label">
                <span>{selectedNative.flag}</span>
                <strong>{selectedNative.name}</strong>
              </div>
            </div>
            <div className="natives-local-video">
              <video ref={localVideoRef} autoPlay playsInline muted />
              <div className="natives-video-label">
                <strong>{getUiLabel("common.you", "You")}</strong>
              </div>
            </div>
            <div className="natives-call-controls">
              <button type="button" className="natives-control-btn" onClick={toggleMic}>
                {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                {isMicOn ? getUiLabel("natives.mic_on", "Mic on") : getUiLabel("natives.mic_off", "Mic off")}
              </button>
              <button type="button" className="natives-control-btn" onClick={toggleCam}>
                {isCamOn ? <Camera size={16} /> : <CameraOff size={16} />}
                {isCamOn ? getUiLabel("natives.cam_on", "Cam on") : getUiLabel("natives.cam_off", "Cam off")}
              </button>
              <button type="button" className="natives-control-btn" onClick={() => void reportNative(selectedNative.id, "call")}>{getUiLabel("natives.report", "Report")}</button>
              <button type="button" className="natives-end-btn" onClick={() => void endCall()}>
                <PhoneOff size={16} />
                {getUiLabel("common.end", "End")}
              </button>
            </div>
          </div>

          <aside className="natives-chat-panel">
            <h2>{getUiLabel("common.chat", "Chat")}</h2>
            {safetyMode ? <p className="natives-safety-note">{getUiLabel("natives.safety_note", "Safety mode enabled: chats and reports are stored in local progress.")}</p> : null}
            <div className="natives-chat-list">
              {chat.map((m) => (
                <article key={m.id} className={`natives-chat-bubble ${m.author === getUiLabel("common.you", "You") ? "is-user" : ""}`}>
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
                placeholder={getUiLabel("natives.message_placeholder", "Type your message...")}
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



