import React, { useState, useRef, useEffect } from "react";
import { Volume2, Loader2, Zap, ArrowLeft } from "lucide-react";
// import "./ListeningPage.css";

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";
const API_KEY = ""; // ← inserir sua chave aqui

/* ---------- Utilitários ---------- */
const base64ToArrayBuffer = (b64) => {
  if (!b64) return new ArrayBuffer(0);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

const pcmToWav = (pcm16, sampleRate) => {
  const numChannels = 1,
    bytesPerSample = 2,
    blockAlign = numChannels * bytesPerSample,
    byteRate = sampleRate * blockAlign,
    dataSize = pcm16.length * bytesPerSample,
    buffer = new ArrayBuffer(44 + dataSize),
    view = new DataView(buffer);

  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  let offset = 44;
  pcm16.forEach((sample) => {
    view.setInt16(offset, sample, true);
    offset += 2;
  });

  return new Blob([view], { type: "audio/wav" });
};

/* ---------- API ---------- */
const generateAudio = async (text, voice = "Zephyr") => {
  const url = `${API_BASE_URL}?key=${API_KEY}`;
  const payload = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
    },
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const part = json?.candidates?.[0]?.content?.parts?.[0];
        const b64 = part?.inlineData?.data;
        const mime = part?.inlineData?.mimeType;

        if (b64 && mime?.startsWith("audio/")) {
          const sr = Number(mime.match(/rate=(\d+)/)?.[1] ?? 16000);
          const pcm = new Int16Array(base64ToArrayBuffer(b64));
          const wav = pcmToWav(pcm, sr);
          return URL.createObjectURL(wav);
        }
        throw new Error("Dados de áudio ausentes na resposta");
      }

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
        continue;
      }

      const txt = await res.text();
      throw new Error(`API ${res.status}: ${txt}`);
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
    }
  }
  return null;
};

/* ---------- Dados estáticos ---------- */
const staticLesson = {
  title: "Teste de Voz Simples",
  main_text: "The sun is shining and I am learning English through technology.",
  translation_pt: "O sol está brilhando e estou aprendendo Inglês através da tecnologia.",
};

/* ---------- Componentes auxiliares ---------- */
function AudioPlayer({ src, onEnded }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.play().catch(() => {});
    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, [src, onEnded]);

  return <audio ref={audioRef} src={src} hidden />;
}

/* ---------- Componente principal ---------- */
export default function ListeningPage({ setCurrentView }) {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handlePlay = async (text) => {
    setLoading(true);
    setError(null);
    setAudioUrl(null);
    try {
      const url = await generateAudio(text);
      if (!url) throw new Error("Falha ao gerar áudio");
      setAudioUrl(url);
    } catch (e) {
      setError(e.message ?? "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="listening-page">
      <header className="listening-header">
        <h1 className="listening-title">Módulo: Listening</h1>
        <button onClick={() => setCurrentView("initial")} className="back-button">
          <ArrowLeft size={18} />
          Voltar ao Início
        </button>
      </header>

      <section className="lesson-card">
        <h2 className="lesson-title">Lição: {staticLesson.title}</h2>

        <article className="lesson-content">
          <h3 className="content-label">Frase em Inglês:</h3>
          <p className="text-english">{staticLesson.main_text}</p>

          <h3 className="content-label">Tradução:</h3>
          <p className="text-portuguese">{staticLesson.translation_pt}</p>
        </article>

        <button
          onClick={() => handlePlay(staticLesson.main_text)}
          disabled={loading}
          className={`generate-button ${loading ? "loading" : ""}`}
        >
          {loading ? (
            <>
              <Loader2 className="spinner" size={20} />
              Gerando áudio...
            </>
          ) : (
            <>
              <Volume2 size={20} />
              Ouvir frase (IA)
            </>
          )}
        </button>

        {audioUrl && (
          <div className="status-message success">
            <Zap size={16} />
            Áudio pronto! Reproduzindo…
          </div>
        )}

        {error && (
          <div className="status-message error">
            <strong>Erro:</strong> {error}
          </div>
        )}
      </section>

      {audioUrl && <AudioPlayer src={audioUrl} onEnded={() => setAudioUrl(null)} />}
    </div>
  );
}