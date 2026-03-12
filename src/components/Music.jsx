import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Link2, Play, Volume2 } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const EN_PT_WORDS = {
  i: "eu",
  you: "vocÃª",
  we: "nÃ³s",
  they: "eles",
  he: "ele",
  she: "ela",
  it: "isso",
  am: "sou",
  is: "Ã©",
  are: "sÃ£o",
  was: "era",
  were: "eram",
  have: "tenho",
  has: "tem",
  had: "tinha",
  do: "faÃ§o",
  does: "faz",
  did: "fez",
  can: "posso",
  will: "vou",
  would: "iria",
  should: "deveria",
  could: "poderia",
  to: "para",
  in: "em",
  on: "em",
  at: "em",
  with: "com",
  for: "para",
  from: "de",
  of: "de",
  and: "e",
  or: "ou",
  but: "mas",
  not: "nÃ£o",
  my: "meu",
  your: "seu",
  our: "nosso",
  me: "me",
  love: "amor",
  heart: "coraÃ§Ã£o",
  night: "noite",
  day: "dia",
  time: "tempo",
  life: "vida",
  world: "mundo",
  dream: "sonho",
  music: "mÃºsica",
  song: "canÃ§Ã£o",
  dance: "danÃ§ar",
  feel: "sentir",
  fire: "fogo",
  light: "luz",
  dark: "escuro",
  rain: "chuva",
  sky: "cÃ©u",
  home: "casa",
  away: "longe",
  stay: "ficar",
  go: "ir",
  come: "vir",
  back: "voltar",
};

function ensureMusic(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.music) {
    data.modules.music = {
      last_query: "",
      manual_url: "",
      selected_video_id: "",
      selected_title: "",
      lyrics_en: "",
      search_history: [],
      updated_at: null,
    };
  }
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureMusic(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureMusic(parsed);
}

function parseYouTubeId(value) {
  if (!value) return "";
  const cleaned = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) return cleaned;
  try {
    const url = new URL(cleaned);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
    }
    const queryId = url.searchParams.get("v");
    if (queryId && /^[a-zA-Z0-9_-]{11}$/.test(queryId)) return queryId;
    const pathParts = url.pathname.split("/").filter(Boolean);
    const embedIndex = pathParts.findIndex((part) => part === "embed");
    if (embedIndex >= 0 && pathParts[embedIndex + 1]) {
      const embedId = pathParts[embedIndex + 1];
      return /^[a-zA-Z0-9_-]{11}$/.test(embedId) ? embedId : "";
    }
  } catch {
    return "";
  }
  return "";
}

function translateLineToPt(line) {
  if (!line.trim()) return "";
  const parts = line.split(/(\s+|[,.!?;:()[\]"ââ'`])/g);
  return parts
    .map((part) => {
      const clean = part.toLowerCase().replace(/[^a-z']/g, "");
      if (!clean) return part;
      const translated = EN_PT_WORDS[clean];
      if (!translated) return part;
      if (/^[A-Z]/.test(part)) return translated.charAt(0).toUpperCase() + translated.slice(1);
      return translated;
    })
    .join("")
    .replace(/\s{2,}/g, " ");
}

function speak(text, lang = "en-US") {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

export default function Music({ setCurrentView, color = "#616060" }) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || "";
  const hasApiKey = Boolean(apiKey.trim());

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [lyricsRaw, setLyricsRaw] = useState("");
  const [syncing, setSyncing] = useState(false);

  const lyricsLines = useMemo(() => {
    return lyricsRaw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [lyricsRaw]);

  const translatedLines = useMemo(() => lyricsLines.map((line) => translateLineToPt(line)), [lyricsLines]);

  const persistMusic = async (partial) => {
    setSyncing(true);
    try {
      const progress = await readProgress();
      const block = progress.modules.music || {};
      const nextBlock = {
        ...block,
        ...partial,
        updated_at: new Date().toISOString(),
      };
      progress.modules.music = nextBlock;
      const saved = await writeProgress(progress);
      return saved.modules.music;
    } catch {
      return null;
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const progress = await readProgress();
        if (!mounted) return;
        const block = progress.modules.music;
        setQuery(block.last_query || "");
        setManualUrl(block.manual_url || "");
        setSelectedVideoId(block.selected_video_id || "");
        setSelectedTitle(block.selected_title || "");
        setLyricsRaw(block.lyrics_en || "");
      } catch {
        if (!mounted) return;
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearchError("");
    if (!hasApiKey) {
      setSearchError("API do YouTube nao configurada. Use o campo de link manual abaixo.");
      await persistMusic({ last_query: q });
      return;
    }

    setLoading(true);
    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("type", "video");
      url.searchParams.set("maxResults", "8");
      url.searchParams.set("q", q);
      url.searchParams.set("key", apiKey);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok || data.error) throw new Error("Erro na busca do YouTube");

      const parsed = (data.items || []).map((item) => ({
        id: item.id?.videoId || "",
        title: item.snippet?.title || "Sem titulo",
        channel: item.snippet?.channelTitle || "Canal",
      }));
      setResults(parsed.filter((video) => video.id));
      await persistMusic({
        last_query: q,
        search_history: [q, ...((await readProgress()).modules.music.search_history || [])]
          .filter(Boolean)
          .slice(0, 12),
      });
    } catch {
      setSearchError("Nao foi possivel buscar no YouTube agora. Cole o link manualmente.");
    } finally {
      setLoading(false);
    }
  };

  const selectVideo = async (video) => {
    setSelectedVideoId(video.id);
    setSelectedTitle(video.title);
    await persistMusic({
      selected_video_id: video.id,
      selected_title: video.title,
      last_query: query.trim(),
    });
  };

  const applyManualUrl = async () => {
    const parsedId = parseYouTubeId(manualUrl);
    if (!parsedId) {
      setSearchError("Link invalido. Use um link de video do YouTube.");
      return;
    }
    setSearchError("");
    setSelectedVideoId(parsedId);
    setSelectedTitle(selectedTitle || "Video manual");
    await persistMusic({
      manual_url: manualUrl.trim(),
      selected_video_id: parsedId,
      selected_title: selectedTitle || "Video manual",
    });
  };

  const saveLyrics = async () => {
    await persistMusic({
      lyrics_en: lyricsRaw,
      manual_url: manualUrl,
      selected_video_id: selectedVideoId,
      selected_title: selectedTitle,
      last_query: query,
    });
  };

  return (
    <section className="music-shell" style={{ "--music-theme": color }}>
      <header className="music-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div>
          <div className="music-kicker">MUSIC LAB</div>
          <h1>Music</h1>
        </div>
              <ModuleGuideButton moduleKey="music" color={color} />
</header>

      <section className="music-search-card">
        <div className="music-search-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar musica no YouTube..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <button type="button" className="music-primary-btn" onClick={handleSearch} disabled={loading}>
            <Search size={16} />
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {!hasApiKey ? (
          <p className="music-warning">
            Sem API key (`VITE_YOUTUBE_API_KEY`). Use o fallback de link manual.
          </p>
        ) : null}

        {searchError ? <p className="music-error">{searchError}</p> : null}

        <div className="music-manual-row">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="Cole o link do YouTube (fallback manual)"
          />
          <button type="button" className="music-secondary-btn" onClick={applyManualUrl}>
            <Link2 size={16} />
            Aplicar link
          </button>
        </div>
      </section>

      {results.length > 0 ? (
        <section className="music-results-card">
          {results.map((video) => (
            <button
              type="button"
              key={video.id}
              className={`music-result-item ${selectedVideoId === video.id ? "is-selected" : ""}`}
              onClick={() => selectVideo(video)}
            >
              <Play size={15} />
              <div>
                <strong>{video.title}</strong>
                <span>{video.channel}</span>
              </div>
            </button>
          ))}
        </section>
      ) : null}

      <section className="music-main-layout">
        <article className="music-video-card">
          <h2>{selectedTitle || "Selecione uma musica"}</h2>
          {selectedVideoId ? (
            <div className="music-video-embed">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideoId}`}
                title="YouTube music video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="music-empty">Nenhum video selecionado ainda.</p>
          )}
        </article>

        <article className="music-lyrics-card">
          <div className="music-lyrics-head">
            <h2>Letra (EN) + Traducao (PT)</h2>
            <button type="button" className="music-secondary-btn" onClick={saveLyrics}>
              Salvar
            </button>
          </div>

          <textarea
            value={lyricsRaw}
            onChange={(e) => setLyricsRaw(e.target.value)}
            placeholder="Cole a letra em ingles aqui, uma linha por frase..."
            rows={8}
          />

          <div className="music-lines-grid">
            <div className="music-lines-col">
              <h3>English</h3>
              {lyricsLines.length === 0 ? <p>Sem linhas ainda.</p> : null}
              {lyricsLines.map((line, idx) => (
                <div key={`en_${idx}`} className="music-line-item">
                  <span>{line}</span>
                  <button type="button" onClick={() => speak(line, "en-US")}>
                    <Volume2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="music-lines-col">
              <h3>Portugues</h3>
              {translatedLines.length === 0 ? <p>Sem traducao ainda.</p> : null}
              {translatedLines.map((line, idx) => (
                <div key={`pt_${idx}`} className="music-line-item">
                  <span>{line || "-"}</span>
                  <button type="button" onClick={() => speak(line || "-", "pt-BR")}>
                    <Volume2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      {syncing ? <p className="music-syncing">Sincronizando...</p> : null}
    </section>
  );
}
