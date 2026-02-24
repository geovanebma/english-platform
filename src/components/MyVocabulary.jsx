import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  BookOpen,
  Search,
  Bookmark,
  Volume2,
  Maximize,
  Loader2,
  X,
  Zap,
  RotateCcw,
} from "lucide-react";

/* ---------- API Helpers ---------- */
// Convert base64 string to ArrayBuffer
const base64ToArrayBuffer = (b64) => {
  if (!b64) return new ArrayBuffer(0);
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

// Transform PCM16 data into a WAV Blob
const pcmToWav = (pcm16, sampleRate) => {
  const numChannels = 1,
    bytesPerSample = 2,
    blockAlign = numChannels * bytesPerSample,
    byteRate = sampleRate * blockAlign,
    dataSize = pcm16.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  // RIFF header
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false);
  // fmt sub‑chunk
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  // data sub‑chunk
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < pcm16.length; i++) {
    view.setInt16(offset, pcm16[i], true);
    offset += 2;
  }
  return new Blob([view], { type: "audio/wav" });
};

// Generate TTS audio via Gemini API
const generateAudio = async (text, voice = "Kore") => {
  const API_KEY = "AIzaSyDTfuMCi5WlpKcDOAz1NoUwAytj1vs4gW4";
  const ENDPOINT =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";
  const url = `${ENDPOINT}?key=${API_KEY}`;
  const payload = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
    },
    model: "gemini-2.5-flash-preview-tts",
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 429) await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
        else throw new Error(`API ${res.status}`);
        continue;
      }
      const { candidates } = await res.json();
      const part = candidates?.[0]?.content?.parts?.[0];
      const { data, mimeType } = part?.inlineData || {};
      if (data && mimeType?.startsWith("audio/")) {
        const sr = Number(mimeType.match(/rate=(\d+)/)?.[1] ?? 16000);
        const pcm = new Int16Array(base64ToArrayBuffer(data));
        const wav = pcmToWav(pcm, sr);
        return URL.createObjectURL(wav);
      }
      return null;
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
    }
  }
  return null;
};

/* ---------- Mock Data ---------- */
const mockVocabulary = [
  {
    id: 1,
    word: "the",
    most_used_position: 0,
    is_learned: true,
    examples_text: "The sun is hot; The book is old.",
    meanings: [
      { type: "Article", meaning: "used to refer to specific people or things" },
    ],
  },
  // … outros itens
];

/* ---------- Sub‑components ---------- */
const WordDetailsModal = ({ word, meanings, examples, onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg p-6 shadow-xl">
      <div className="flex justify-between items-start border-b pb-3 mb-4">
        <h3 className="text-2xl font-bold text-[#096105] dark:text-green-400">
          {word}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full bg-gray-100 dark:bg-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <section>
          <h4 className="text-lg font-semibold border-l-4 border-[#096105] pl-2 dark:border-green-500">
            Significados
          </h4>
          {meanings?.length ? (
            <ul className="list-disc ml-5 space-y-1 text-gray-700 dark:text-gray-300">
              {meanings.map((m, i) => (
                <li key={i}>
                  <span className="font-medium">[{m.type}]</span> {m.meaning}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">Nenhum significado.</p>
          )}
        </section>
        <section>
          <h4 className="text-lg font-semibold border-l-4 border-yellow-500 pl-2">
            Exemplos
          </h4>
          <p className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded border border-yellow-100 dark:border-yellow-800 italic whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {examples || "Nenhum exemplo."}
          </p>
        </section>
      </div>
      <button
        onClick={onClose}
        className="mt-6 w-full bg-gray-800 dark:bg-gray-700 text-white py-2 rounded"
      >
        Fechar
      </button>
    </div>
  </div>
);

/* ---------- Main Component ---------- */
export default function MyVocabulary({ setCurrentView }) {
  const [vocab, setVocab] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | learned | unlearned
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(null);
  const [selected, setSelected] = useState(null);
  const [audioErr, setAudioErr] = useState(null);
  const searchTimeout = useRef(null);

  // Load mock data (replace with real fetch later)
  useEffect(() => {
    const timer = setTimeout(() => {
      setVocab(
        mockVocabulary.sort(
          (a, b) => a.most_used_position - b.most_used_position
        )
      );
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Debounced search handler
  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(value), 300);
  }, []);

  // Toggle learned state (optimistic UI)
  const toggleLearned = useCallback((id) => {
    setVocab((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_learned: !w.is_learned } : w))
    );
    // TODO: persist change on backend
  }, []);

  // Generate and play TTS audio
  const speakWord = useCallback(async (word) => {
    setAudioErr(null);
    setSpeaking(word);
    try {
      const url = await generateAudio(word, "Aoede");
      if (!url) throw new Error("Áudio não gerado");
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setSpeaking(null);
    } catch (e) {
      setAudioErr(e.message);
      setSpeaking(null);
    }
    // Auto‑dismiss error toast
    setTimeout(() => setAudioErr(null), 5000);
  }, []);

  // Apply filter + search
  const filtered = useMemo(() => {
    return vocab
      .filter((w) => {
        if (filter === "learned") return w.is_learned;
        if (filter === "unlearned") return !w.is_learned;
        return true;
      })
      .filter((w) => w.word.toLowerCase().includes(search.toLowerCase()));
  }, [vocab, filter, search]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-500 dark:text-gray-400">
        <Loader2 className="animate-spin mr-2 w-8 h-8" />
        Carregando vocabulário...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-[#096105] dark:text-green-400">
          Meu Vocabulário
        </h1>
        <button
          onClick={() => setCurrentView("initial")}
          className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          ← Voltar
        </button>
      </header>

      {/* Audio error toast */}
      {audioErr && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg flex items-center space-x-2 animate-pulse">
          <Zap className="w-5 h-5" />
          <span>{audioErr}</span>
          <button onClick={() => setAudioErr(null)} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-green-100 dark:border-gray-600 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar palavra..."
              defaultValue={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#096105] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {/* Filter buttons */}
          <div className="flex space-x-2">
            {["all", "learned", "unlearned"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded ${
                  filter === f
                    ? "bg-[#096105] text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300"
                }`}
              >
                {f === "all"
                  ? `Todas (${vocab.length})`
                  : f === "learned"
                  ? "Aprendidas"
                  : "A aprender"}
              </button>
            ))}
          </div>
        </div>

        {/* Vocabulary table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-[#096105] dark:bg-gray-700 text-white">
              <tr>
                <th className="px-4 py-2 text-xs">✓</th>
                <th className="px-4 py-2 text-left text-xs">Palavra</th>
                <th className="px-4 py-2 text-left text-xs hidden sm:table-cell">
                  Posição
                </th>
                <th className="px-4 py-2 text-center text-xs">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="p-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Nenhuma palavra encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr
                    key={w.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={w.is_learned}
                        onChange={() => toggleLearned(w.id)}
                        className="w-4 h-4 text-[#096105] rounded focus:ring-[#096105]"
                      />
                    </td>
                    <td className="px-4 py-2 font-medium text-lg">{w.word}</td>
                    <td className="px-4 py-2 hidden sm:table-cell text-gray-600 dark:text-gray-400">
                      #{w.most_used_position + 1}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => setSelected(w)}
                          className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200"
                          title="Ver detalhes"
                        >
                          <Maximize className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => speakWord(w.word)}
                          disabled={speaking === w.word}
                          className={`p-2 rounded-full flex items-center justify-center ${
                            speaking === w.word
                              ? "bg-yellow-300 cursor-not-allowed"
                              : "bg-yellow-100 hover:bg-yellow-200"
                          }`}
                          title="Ouvir"
                        >
                          {speaking === w.word ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Volume2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Exibindo {filtered.length} de {vocab.length} palavras.
        </p>
      </section>

      {/* Details modal */}
      {selected && (
        <WordDetailsModal
          word={selected.word}
          meanings={selected.meanings}
          examples={selected.examples_text}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}