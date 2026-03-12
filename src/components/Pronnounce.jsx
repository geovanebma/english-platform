import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RefreshCw,
  Volume2,
  CheckCircle,
} from "lucide-react";

export default function PronouncePractice({ word, ipa }) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorder = useRef(null);
  const audioRef = useRef(null);
  const chunks = useRef([]);
  const streamRef = useRef(null);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (mediaRecorder.current?.state !== "inactive") mediaRecorder.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        chunks.current = [];
        setAudioURL(URL.createObjectURL(blob));
        // Simula avaliação (substituir por API real)
        setFeedback(Math.random() > 0.5 ? "good" : "bad");
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
      setError(null);
    } catch (e) {
      setError("Permissão de microfone negada ou indisponível.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    recording ? stopRecording() : startRecording();
  }, [recording, startRecording, stopRecording]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setError("Falha ao reproduzir áudio."));
    }
    setPlaying(!playing);
  }, [playing]);

  const reset = useCallback(() => {
    setAudioURL(null);
    setFeedback(null);
    setPlaying(false);
    setRecording(false);
    setError(null);
    if (audioRef.current) audioRef.current.src = "";
  }, []);

  // Atualiza estado ao término da reprodução
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [audioURL]);

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 text-white rounded-xl shadow-lg space-y-4">
      {/* Palavra e transcrição */}
      <div className="text-center">
        <h2 className="text-3xl font-bold">{word}</h2>
        <p className="text-gray-400 mt-1">{ipa}</p>
      </div>

      {/* Mensagem de erro */}
      {error && <p className="text-red-500 text-center text-sm">{error}</p>}

      {/* Controles */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={toggleRecording}
          className={`p-3 rounded-full transition-colors ${
            recording ? "bg-red-600 hover:bg-red-700" : "bg-gray-800 hover:bg-gray-700"
          }`}
          aria-label={recording ? "Parar gravação" : "Iniciar gravação"}
        >
          {recording ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {audioURL && (
          <>
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              aria-label={playing ? "Pausar áudio" : "Reproduzir áudio"}
            >
              {playing ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button
              onClick={reset}
              className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              aria-label="Recomeçar"
            >
              <RefreshCw size={24} />
            </button>
          </>
        )}
      </div>

      {/* Áudio oculto */}
      {audioURL && <audio ref={audioRef} src={audioURL} hidden />}

      {/* Feedback visual */}
      {feedback && (
        <div
          className="flex items-center justify-center mt-4 space-x-2"
          role="status"
          aria-live="polite"
        >
          {feedback === "good" ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : (
            <Volume2 className="text-red-500" size={20} />
          )}
          <span
            className={`font-medium ${
              feedback === "good" ? "text-green-400" : "text-red-400"
            }`}
          >
            {feedback === "good"
              ? "Boa pronúncia! 🎉"
              : "Precisa melhorar. Tente novamente."}
          </span>
        </div>
      )}
    </div>
  );
}