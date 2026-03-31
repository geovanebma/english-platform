import React, { useEffect, useMemo, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, Search, Link2, Play, Volume2, Sparkles, Music2 } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "";
const LYRICS_API_URL = import.meta.env.VITE_MUSIC_LYRICS_API_URL || "";
const TRANSLATE_API_URL = import.meta.env.VITE_MUSIC_TRANSLATE_API_URL || "";

const EN_PT_WORDS = {
  i: "eu", you: "voce", we: "nos", they: "eles", he: "ele", she: "ela", it: "isso",
  am: "sou", is: "e", are: "sao", was: "era", were: "eram", have: "tenho", has: "tem",
  had: "tinha", do: "faco", does: "faz", did: "fez", can: "posso", will: "vou", would: "iria",
  should: "deveria", could: "poderia", to: "para", in: "em", on: "em", at: "em", with: "com",
  for: "para", from: "de", of: "de", and: "e", or: "ou", but: "mas", not: "nao", my: "meu",
  your: "seu", our: "nosso", me: "me", love: "amor", heart: "coracao", night: "noite", day: "dia",
  time: "tempo", life: "vida", world: "mundo", dream: "sonho", music: "musica", song: "cancao",
  dance: "dancar", feel: "sentir", fire: "fogo", light: "luz", dark: "escuro", rain: "chuva",
  sky: "ceu", home: "casa", away: "longe", stay: "ficar", go: "ir", come: "vir", back: "voltar",
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
      translated_lyrics: [],
      search_history: [],
      updated_at: null,
      ai_lyrics_enabled: Boolean(LYRICS_API_URL),
      ai_translate_enabled: Boolean(TRANSLATE_API_URL),
    };
  }
  const block = data.modules.music;
  if (!Array.isArray(block.search_history)) block.search_history = [];
  if (!Array.isArray(block.translated_lyrics)) block.translated_lyrics = [];
  if (typeof block.ai_lyrics_enabled !== "boolean") block.ai_lyrics_enabled = Boolean(LYRICS_API_URL);
  if (typeof block.ai_translate_enabled !== "boolean") block.ai_translate_enabled = Boolean(TRANSLATE_API_URL);
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
  const parts = line.split(/(\s+|[,.!?;:()[\]"��'`])/g);
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

async function fetchLyrics(query, title, videoId) {
  if (!LYRICS_API_URL) return null;
  try {
    const res = await fetch(LYRICS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, title, videoId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const lines = Array.isArray(data?.lines) ? data.lines : String(data?.lyrics || "").split(/\r?\n/).filter(Boolean);
    return lines.filter(Boolean);
  } catch {
    return null;
  }
}

async function translateLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  if (!TRANSLATE_API_URL) return lines.map((line) => translateLineToPt(line));
  try {
    const res = await fetch(TRANSLATE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, source: "en", target: "pt-BR" }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (Array.isArray(data?.lines)) return data.lines;
    throw new Error();
  } catch {
    return lines.map((line) => translateLineToPt(line));
  }
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
  const hasApiKey = Boolean(YOUTUBE_API_KEY.trim());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [lyricsRaw, setLyricsRaw] = useState("");
  const [translatedLines, setTranslatedLines] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [aiLyricsEnabled, setAiLyricsEnabled] = useState(Boolean(LYRICS_API_URL));
  const [aiTranslateEnabled, setAiTranslateEnabled] = useState(Boolean(TRANSLATE_API_URL));

  const lyricsLines = useMemo(() => {
    return lyricsRaw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }, [lyricsRaw]);

  const effectiveTranslations = useMemo(
    () => translatedLines.length === lyricsLines.length && translatedLines.length > 0 ? translatedLines : lyricsLines.map((line) => translateLineToPt(line)),
    [translatedLines, lyricsLines]
  );

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
        setTranslatedLines(block.translated_lyrics || []);
        setAiLyricsEnabled(Boolean(block.ai_lyrics_enabled));
        setAiTranslateEnabled(Boolean(block.ai_translate_enabled));
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
      setSearchError(getUiLabel("music.youtube_api_missing", "YouTube API is not configured. Use the manual link field below."));
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
      url.searchParams.set("key", YOUTUBE_API_KEY);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok || data.error) throw new Error("Erro na busca do YouTube");

      const parsed = (data.items || []).map((item) => ({
        id: item.id?.videoId || "",
        title: item.snippet?.title || getUiLabel("music.untitled", "Untitled"),
        channel: item.snippet?.channelTitle || getUiLabel("music.channel", "Channel"),
      }));
      setResults(parsed.filter((video) => video.id));
      const progress = await readProgress();
      await persistMusic({
        last_query: q,
        search_history: [q, ...(progress.modules.music.search_history || [])].filter(Boolean).slice(0, 12),
      });
    } catch {
      setSearchError(getUiLabel("music.youtube_search_failed", "Could not search YouTube right now. Paste the link manually."));
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
      setSearchError(getUiLabel("music.invalid_link", "Invalid link. Use a YouTube video link."));
      return;
    }
    setSearchError("");
    const fallbackTitle = query.trim() || selectedTitle || getUiLabel("music.manual_video", "Manual YouTube video");
    setSelectedVideoId(parsedId);
    setSelectedTitle(fallbackTitle);
    await persistMusic({
      manual_url: manualUrl.trim(),
      selected_video_id: parsedId,
      selected_title: fallbackTitle,
    });
  };

  const generateLyrics = async () => {
    setLoadingLyrics(true);
    try {
      const lines = aiLyricsEnabled ? await fetchLyrics(query.trim(), selectedTitle, selectedVideoId) : null;
      if (lines?.length) {
        const raw = lines.join("\n");
        setLyricsRaw(raw);
        const nextTranslations = aiTranslateEnabled ? await translateLines(lines) : lines.map((line) => translateLineToPt(line));
        setTranslatedLines(nextTranslations);
        await persistMusic({ lyrics_en: raw, translated_lyrics: nextTranslations, ai_lyrics_enabled: aiLyricsEnabled, ai_translate_enabled: aiTranslateEnabled });
        return;
      }
      if (!lyricsRaw.trim()) {
        const fallback = [
          selectedTitle || query.trim() || getUiLabel("music.fallback_line_1", "Untitled line 1"),
          getUiLabel("music.fallback_line_2", "Add the official lyrics here if the API is not available."),
          getUiLabel("music.fallback_line_3", "You can still study line by line with manual text."),
        ];
        setLyricsRaw(fallback.join("\n"));
        const nextTranslations = fallback.map((line) => translateLineToPt(line));
        setTranslatedLines(nextTranslations);
        await persistMusic({ lyrics_en: fallback.join("\n"), translated_lyrics: nextTranslations, ai_lyrics_enabled: aiLyricsEnabled, ai_translate_enabled: aiTranslateEnabled });
      }
    } finally {
      setLoadingLyrics(false);
    }
  };

  const saveLyrics = async () => {
    const nextTranslations = aiTranslateEnabled ? await translateLines(lyricsLines) : lyricsLines.map((line) => translateLineToPt(line));
    setTranslatedLines(nextTranslations);
    await persistMusic({
      lyrics_en: lyricsRaw,
      translated_lyrics: nextTranslations,
      manual_url: manualUrl,
      selected_video_id: selectedVideoId,
      selected_title: selectedTitle,
      last_query: query,
      ai_lyrics_enabled: aiLyricsEnabled,
      ai_translate_enabled: aiTranslateEnabled,
    });
  };

  const playAllLines = (lang = "en-US") => {
    const source = lang === "pt-BR" ? effectiveTranslations : lyricsLines;
    source.forEach((line, index) => {
      setTimeout(() => speak(line, lang), index * 2500);
    });
  };

  return (
    <section className="music-shell" style={{ "--music-theme": color }}>
      <header className="music-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="music-kicker">{getUiLabel("music.kicker", "MUSIC LAB")}</div>
          <h1>{getUiLabel("module.music", "Music")}</h1>
        </div>
        <ModuleGuideButton moduleKey="music" color={color} />
      </header>

      <section className="music-search-card">
        <div className="music-search-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={getUiLabel("music.search_placeholder", "Search music on YouTube...")}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSearch();
            }}
          />
          <button type="button" className="music-primary-btn" onClick={() => void handleSearch()} disabled={loading}>
            <Search size={16} />
            {loading ? getUiLabel("music.searching", "Searching...") : getUiLabel("music.search", "Search")}
          </button>
        </div>

        <div className="music-api-row">
          <button type="button" className={`music-secondary-btn ${aiLyricsEnabled ? "is-on" : ""}`} onClick={() => setAiLyricsEnabled((prev) => !prev)}>
            <Sparkles size={15} /> {getUiLabel("music.lyrics_api", "Lyrics API")} {aiLyricsEnabled ? getUiLabel("flash.toggle.on", "ON") : getUiLabel("flash.toggle.off", "OFF")}
          </button>
          <button type="button" className={`music-secondary-btn ${aiTranslateEnabled ? "is-on" : ""}`} onClick={() => setAiTranslateEnabled((prev) => !prev)}>
            <Sparkles size={15} /> {getUiLabel("music.translation_api", "Translation API")} {aiTranslateEnabled ? getUiLabel("flash.toggle.on", "ON") : getUiLabel("flash.toggle.off", "OFF")}
          </button>
        </div>

        {!hasApiKey ? (
          <p className="music-warning">{getUiLabel("music.no_api_key", "No API key (`VITE_YOUTUBE_API_KEY`). Use the manual link fallback.")}</p>
        ) : null}

        {searchError ? <p className="music-error">{searchError}</p> : null}

        <div className="music-manual-row">
          <input type="text" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder={getUiLabel("music.manual_link_placeholder", "Paste the YouTube link (manual fallback)")} />
          <button type="button" className="music-secondary-btn" onClick={() => void applyManualUrl()}>
            <Link2 size={16} />
            {getUiLabel("music.apply_link", "Apply link")}
          </button>
        </div>

        <div className="music-history-row">
          {(results.length === 0 ? [] : results.slice(0, 3)).map((video) => (
            <button key={video.id} type="button" className="music-history-chip" onClick={() => void selectVideo(video)}>
              <Music2 size={13} /> {video.title}
            </button>
          ))}
        </div>
      </section>

      {results.length > 0 ? (
        <section className="music-results-card">
          {results.map((video) => (
            <button type="button" key={video.id} className={`music-result-item ${selectedVideoId === video.id ? "is-selected" : ""}`} onClick={() => void selectVideo(video)}>
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
          <h2>{selectedTitle || getUiLabel("music.select_song", "Select a song")}</h2>
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
            <p className="music-empty">{getUiLabel("music.no_video_selected", "No video selected yet.")}</p>
          )}
        </article>

        <article className="music-lyrics-card">
          <div className="music-lyrics-head">
            <h2>{getUiLabel("music.lyrics_title", "Lyrics (EN) + Translation (PT)")}</h2>
            <div className="music-lyrics-actions">
              <button type="button" className="music-secondary-btn" onClick={() => void generateLyrics()}>{loadingLyrics ? getUiLabel("music.searching", "Searching...") : getUiLabel("music.fetch_lyrics", "Fetch lyrics")}</button>
              <button type="button" className="music-secondary-btn" onClick={() => void saveLyrics()}>{getUiLabel("common.save", "Save")}</button>
            </div>
          </div>

          <textarea value={lyricsRaw} onChange={(e) => setLyricsRaw(e.target.value)} placeholder={getUiLabel("music.lyrics_placeholder", "Paste the lyrics in English here, one line per phrase...")} rows={8} />

          <div className="music-bulk-actions">
            <button type="button" className="music-secondary-btn" onClick={() => playAllLines("en-US")}>{getUiLabel("music.listen_all_en", "Listen all EN")}</button>
            <button type="button" className="music-secondary-btn" onClick={() => playAllLines("pt-BR")}>{getUiLabel("music.listen_all_pt", "Listen all PT")}</button>
          </div>

          <div className="music-lines-grid">
            <div className="music-lines-col">
              <h3>{getUiLabel("music.english", "English")}</h3>
              {lyricsLines.length === 0 ? <p>{getUiLabel("music.no_lines", "No lines yet.")}</p> : null}
              {lyricsLines.map((line, idx) => (
                <div key={`en_${idx}`} className="music-line-item">
                  <strong>{idx + 1}</strong>
                  <span>{line}</span>
                  <button type="button" onClick={() => speak(line, "en-US")}>
                    <Volume2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="music-lines-col">
              <h3>{getUiLabel("music.portuguese", "Portuguese")}</h3>
              {effectiveTranslations.length === 0 ? <p>{getUiLabel("music.no_translation", "No translation yet.")}</p> : null}
              {effectiveTranslations.map((line, idx) => (
                <div key={`pt_${idx}`} className="music-line-item">
                  <strong>{idx + 1}</strong>
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

      {syncing ? <p className="music-syncing">{getUiLabel("music.syncing", "Syncing...")}</p> : null}
    </section>
  );
}


