import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";
import { getUiLabel } from "../lib/uiLabels";

function prettyJson(value) {
  return JSON.stringify(Array.isArray(value) ? value : [], null, 2);
}

export default function ContentAdmin({ onBack, color = "#4b7bec" }) {
  const [tab, setTab] = useState("dictionary");
  const [search, setSearch] = useState("");
  const [locale, setLocale] = useState("pt-BR");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dictionaryEntries, setDictionaryEntries] = useState([]);
  const [selectedWord, setSelectedWord] = useState("");
  const [dictionaryForm, setDictionaryForm] = useState(null);
  const [labels, setLabels] = useState([]);
  const [selectedLabelKey, setSelectedLabelKey] = useState("");
  const [labelForm, setLabelForm] = useState(null);

  const loadDictionaryEntries = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/dictionary/entries?search=${encodeURIComponent(search)}&limit=40`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      const entries = Array.isArray(data?.entries) ? data.entries : [];
      setDictionaryEntries(entries);
      if (entries.length) {
        const active = entries.find((entry) => entry.word === selectedWord) || entries[0];
        setSelectedWord(active.word);
        setDictionaryForm({
          ...active,
          meanings: prettyJson(active.meanings),
          examples: prettyJson(active.examples),
          synonyms: prettyJson(active.synonyms),
        });
      }
      setMessage("");
    } catch {
      setMessage(getUiLabel("community.feed_error", "Could not load the live feed right now."));
    } finally {
      setLoading(false);
    }
  };

  const loadLabels = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/i18n/labels?search=${encodeURIComponent(search)}&locale=${encodeURIComponent(locale)}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      const nextLabels = Array.isArray(data?.labels) ? data.labels : [];
      setLabels(nextLabels);
      if (nextLabels.length) {
        const active = nextLabels.find((entry) => `${entry.label_key}__${entry.locale}` === selectedLabelKey) || nextLabels[0];
        setSelectedLabelKey(`${active.label_key}__${active.locale}`);
        setLabelForm({ ...active });
      }
      setMessage("");
    } catch {
      setMessage(getUiLabel("community.feed_error", "Could not load the live feed right now."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "dictionary") {
      void loadDictionaryEntries();
    } else {
      void loadLabels();
    }
  }, [tab]);

  const selectedDictionaryEntry = useMemo(
    () => dictionaryEntries.find((entry) => entry.word === selectedWord) || null,
    [dictionaryEntries, selectedWord]
  );

  const selectedLabel = useMemo(
    () => labels.find((entry) => `${entry.label_key}__${entry.locale}` === selectedLabelKey) || null,
    [labels, selectedLabelKey]
  );

  useEffect(() => {
    if (!selectedDictionaryEntry) return;
    setDictionaryForm({
      ...selectedDictionaryEntry,
      meanings: prettyJson(selectedDictionaryEntry.meanings),
      examples: prettyJson(selectedDictionaryEntry.examples),
      synonyms: prettyJson(selectedDictionaryEntry.synonyms),
    });
  }, [selectedDictionaryEntry]);

  useEffect(() => {
    if (!selectedLabel) return;
    setLabelForm({ ...selectedLabel });
  }, [selectedLabel]);

  const saveDictionary = async () => {
    try {
      const body = {
        part_of_speech: dictionaryForm.part_of_speech || "",
        ipa: dictionaryForm.ipa || "",
        audio_url: dictionaryForm.audio_url || "",
        meanings: JSON.parse(dictionaryForm.meanings || "[]"),
        examples: JSON.parse(dictionaryForm.examples || "[]"),
        synonyms: JSON.parse(dictionaryForm.synonyms || "[]"),
      };
      const res = await fetch(`/api/admin/dictionary/entries/${encodeURIComponent(dictionaryForm.word)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "save");
      setMessage(getUiLabel("admin.saved", "Saved successfully."));
      await loadDictionaryEntries();
      setSelectedWord(data?.entry?.word || dictionaryForm.word);
    } catch {
      setMessage(getUiLabel("admin.invalid_json", "Invalid JSON in one of the fields."));
    }
  };

  const reverifyDictionary = async () => {
    if (!dictionaryForm?.word) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dictionary/reverify/${encodeURIComponent(dictionaryForm.word)}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "reverify");
      setMessage(getUiLabel("admin.saved", "Saved successfully."));
      await loadDictionaryEntries();
      setSelectedWord(data?.entry?.word || dictionaryForm.word);
    } catch {
      setMessage(getUiLabel("community.feed_error", "Could not load the live feed right now."));
    } finally {
      setLoading(false);
    }
  };

  const saveLabel = async () => {
    if (!labelForm?.label_key) return;
    try {
      const res = await fetch(`/api/admin/i18n/labels/${encodeURIComponent(labelForm.label_key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: labelForm.locale, text_value: labelForm.text_value || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "label");
      setMessage(getUiLabel("admin.saved", "Saved successfully."));
      await loadLabels();
      setSelectedLabelKey(`${labelForm.label_key}__${labelForm.locale}`);
    } catch {
      setMessage(getUiLabel("community.feed_error", "Could not load the live feed right now."));
    }
  };

  return (
    <section style={{ padding: 24, color: "#f5fbff", background: "#101b22", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button type="button" className="duo-back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color, fontWeight: 800, letterSpacing: "0.1em", fontSize: 12 }}>{getUiLabel("admin.kicker", "CONTENT OPS")}</div>
          <h1 style={{ margin: "8px 0 6px", fontSize: 42 }}>{getUiLabel("admin.title", "Content admin panel")}</h1>
          <p style={{ margin: 0, color: "#c7d9e6", maxWidth: 820 }}>{getUiLabel("admin.subtitle", "Review dictionary data, rerun meanings, and adjust app labels without leaving the platform.")}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button type="button" className="duo-open-module-btn" style={{ background: tab === "dictionary" ? color : "#20323d" }} onClick={() => setTab("dictionary")}>
          {getUiLabel("admin.tab.dictionary", "Dictionary")}
        </button>
        <button type="button" className="duo-open-module-btn" style={{ background: tab === "labels" ? color : "#20323d" }} onClick={() => setTab("labels")}>
          {getUiLabel("admin.tab.labels", "Labels")}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20 }}>
        <section className="duo-info-card" style={{ minHeight: 620 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={getUiLabel("admin.search", "Search")}
              style={{ flex: 1, background: "#0d2433", color: "#fff", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }}
            />
            {tab === "labels" ? (
              <select value={locale} onChange={(e) => setLocale(e.target.value)} style={{ background: "#0d2433", color: "#fff", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }}>
                <option value="pt-BR">pt-BR</option>
                <option value="en-US">en-US</option>
              </select>
            ) : null}
            <button type="button" className="community-secondary-btn" onClick={() => (tab === "dictionary" ? void loadDictionaryEntries() : void loadLabels())}>
              <RefreshCw size={14} /> {getUiLabel("community.refresh", "Refresh")}
            </button>
          </div>
          <div style={{ color: "#9fb4c4", fontWeight: 700, marginBottom: 10 }}>{getUiLabel("admin.results", "Results")}</div>
          <div style={{ display: "grid", gap: 10, maxHeight: 520, overflow: "auto" }}>
            {tab === "dictionary"
              ? dictionaryEntries.map((entry) => (
                  <button
                    key={entry.word}
                    type="button"
                    onClick={() => setSelectedWord(entry.word)}
                    style={{ textAlign: "left", borderRadius: 16, padding: 14, border: selectedWord === entry.word ? `2px solid ${color}` : "1px solid #31546c", background: "#10212b", color: "#fff" }}
                  >
                    <strong>{entry.word}</strong>
                    <div style={{ color: "#9fb4c4", marginTop: 6, fontSize: 13 }}>{entry.part_of_speech || "-"}</div>
                  </button>
                ))
              : labels.map((entry) => {
                  const key = `${entry.label_key}__${entry.locale}`;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedLabelKey(key)}
                      style={{ textAlign: "left", borderRadius: 16, padding: 14, border: selectedLabelKey === key ? `2px solid ${color}` : "1px solid #31546c", background: "#10212b", color: "#fff" }}
                    >
                      <strong>{entry.label_key}</strong>
                      <div style={{ color: "#9fb4c4", marginTop: 6, fontSize: 13 }}>{entry.locale}</div>
                    </button>
                  );
                })}
            {!loading && ((tab === "dictionary" && dictionaryEntries.length === 0) || (tab === "labels" && labels.length === 0)) ? (
              <div style={{ color: "#9fb4c4" }}>{getUiLabel("admin.empty", "No results found.")}</div>
            ) : null}
          </div>
        </section>

        <section className="duo-info-card" style={{ minHeight: 620 }}>
          {message ? <p style={{ color: "#ffd47f", marginTop: 0 }}>{message}</p> : null}
          {loading ? <p>{getUiLabel("admin.loading", "Loading...")}</p> : null}

          {tab === "dictionary" ? (
            dictionaryForm ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label>
                    <div style={{ marginBottom: 6 }}>{getUiLabel("admin.dict.part_of_speech", "Part of speech")}</div>
                    <input value={dictionaryForm.part_of_speech || ""} onChange={(e) => setDictionaryForm((prev) => ({ ...prev, part_of_speech: e.target.value }))} style={{ width: "100%", background: "#0d2433", color: "#fff", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 6 }}>{getUiLabel("admin.dict.verified", "Verified")}</div>
                    <input value={`${dictionaryForm.meanings_verified_count || 0}${dictionaryForm.meanings_verified_at ? ` | ${dictionaryForm.meanings_verified_at}` : ""}`} readOnly style={{ width: "100%", background: "#0d2433", color: "#9fb4c4", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label>
                    <div style={{ marginBottom: 6 }}>{getUiLabel("admin.dict.status", "Quality status")}</div>
                    <input value={dictionaryForm.meanings_status || "pending"} readOnly style={{ width: "100%", background: "#0d2433", color: "#9fb4c4", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 6 }}>{getUiLabel("admin.dict.score", "Quality score")}</div>
                    <input value={String(dictionaryForm.meanings_quality_score || 0)} readOnly style={{ width: "100%", background: "#0d2433", color: "#9fb4c4", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
                  </label>
                </div>
                <label>
                  <div style={{ marginBottom: 6 }}>{getUiLabel("admin.dict.notes", "Review notes")}</div>
                  <textarea rows={3} value={dictionaryForm.meanings_review_notes || ""} readOnly style={{ width: "100%", background: "#0d2433", color: "#9fb4c4", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label>
                    <div style={{ marginBottom: 6 }}>{getUiLabel("admin.dict.ipa", "IPA")}</div>
                    <input value={dictionaryForm.ipa || ""} onChange={(e) => setDictionaryForm((prev) => ({ ...prev, ipa: e.target.value }))} style={{ width: "100%", background: "#0d2433", color: "#fff", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 6 }}>{getUiLabel("admin.dict.audio_url", "Audio URL")}</div>
                    <input value={dictionaryForm.audio_url || ""} onChange={(e) => setDictionaryForm((prev) => ({ ...prev, audio_url: e.target.value }))} style={{ width: "100%", background: "#0d2433", color: "#fff", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
                  </label>
                </div>
                <label>
                  <div style={{ marginBottom: 6 }}>{getUiLabel("admin.dict.meanings", "Meanings (JSON)")}</div>
                  <textarea rows={10} value={dictionaryForm.meanings || "[]"} onChange={(e) => setDictionaryForm((prev) => ({ ...prev, meanings: e.target.value }))} style={{ width: "100%", background: "#0d2433", color: "#fff", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <label>
                    <div style={{ marginBottom: 6 }}>{getUiLabel("admin.dict.examples", "Examples (JSON)")}</div>
                    <textarea rows={8} value={dictionaryForm.examples || "[]"} onChange={(e) => setDictionaryForm((prev) => ({ ...prev, examples: e.target.value }))} style={{ width: "100%", background: "#0d2433", color: "#fff", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
                  </label>
                  <label>
                    <div style={{ marginBottom: 6 }}>{getUiLabel("admin.dict.synonyms", "Synonyms (JSON)")}</div>
                    <textarea rows={8} value={dictionaryForm.synonyms || "[]"} onChange={(e) => setDictionaryForm((prev) => ({ ...prev, synonyms: e.target.value }))} style={{ width: "100%", background: "#0d2433", color: "#fff", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
                  </label>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button type="button" className="duo-open-module-btn" onClick={() => void saveDictionary()}>
                    <Save size={16} /> {getUiLabel("admin.save", "Save")}
                  </button>
                  <button type="button" className="community-secondary-btn" onClick={() => void reverifyDictionary()}>
                    <RefreshCw size={16} /> {getUiLabel("admin.reverify", "Reverify meanings")}
                  </button>
                </div>
              </div>
            ) : (
              <p>{getUiLabel("admin.select_entry", "Select an entry to edit.")}</p>
            )
          ) : labelForm ? (
            <div style={{ display: "grid", gap: 14 }}>
              <label>
                <div style={{ marginBottom: 6 }}>Key</div>
                <input value={labelForm.label_key || ""} readOnly style={{ width: "100%", background: "#0d2433", color: "#9fb4c4", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
              </label>
              <label>
                <div style={{ marginBottom: 6 }}>{getUiLabel("admin.locale", "Locale")}</div>
                <input value={labelForm.locale || ""} readOnly style={{ width: "100%", background: "#0d2433", color: "#9fb4c4", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
              </label>
              <label>
                <div style={{ marginBottom: 6 }}>{getUiLabel("admin.text_value", "Text value")}</div>
                <textarea rows={12} value={labelForm.text_value || ""} onChange={(e) => setLabelForm((prev) => ({ ...prev, text_value: e.target.value }))} style={{ width: "100%", background: "#0d2433", color: "#fff", border: "1px solid #31546c", borderRadius: 14, padding: "12px 14px" }} />
              </label>
              <div>
                <button type="button" className="duo-open-module-btn" onClick={() => void saveLabel()}>
                  <Save size={16} /> {getUiLabel("admin.save", "Save")}
                </button>
              </div>
            </div>
          ) : (
            <p>{getUiLabel("admin.select_label", "Select a label to edit.")}</p>
          )}
        </section>
      </div>
    </section>
  );
}
