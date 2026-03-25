import React, { useEffect, useMemo, useState } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, UserCircle2, Save, Trophy, Flame, Gem, Clock3, Settings2, Award, BarChart3 } from "lucide-react";
import ModuleGuideButton from "./ModuleGuideButton";

function ensureProfileModule(progress) {
  const data = progress || {};
  if (!data.modules) data.modules = {};
  if (!data.modules.profile) {
    data.modules.profile = {
      display_name: "Learner",
      bio: "Building English every day.",
      daily_goal_minutes: 20,
      weekly_goal_xp: 400,
      badges_unlocked: [],
      recent_notes: [],
      avatar_key: "mentor",
      settings: {
        study_reminders: true,
        public_profile: false,
      },
      updated_at: null,
    };
  }
  if (!Array.isArray(data.modules.profile.badges_unlocked)) data.modules.profile.badges_unlocked = [];
  if (!Array.isArray(data.modules.profile.recent_notes)) data.modules.profile.recent_notes = [];
  if (!data.modules.profile.avatar_key) data.modules.profile.avatar_key = "mentor";
  if (!data.modules.profile.settings) {
    data.modules.profile.settings = {
      study_reminders: true,
      public_profile: false,
    };
  }
  return data;
}

async function readProgress() {
  const res = await fetch("/api/progress", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao ler progresso");
  const parsed = await res.json();
  return ensureProfileModule(parsed);
}

async function writeProgress(nextProgress) {
  const res = await fetch("/api/progress", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextProgress),
  });
  if (!res.ok) throw new Error("Falha ao salvar progresso");
  const parsed = await res.json();
  return ensureProfileModule(parsed);
}

function buildBadges(progress) {
  const xp = Number(progress?.profile?.xp || 0);
  const streak = Number(progress?.profile?.streak_days || 0);
  const learned = Number(progress?.my_vocabulary?.learned_words || progress?.modules?.my_vocabulary?.learned_words || 0);
  const sessions = Number(progress?.modules?.speak_with_natives?.total_sessions || 0);
  const tests = Number(progress?.modules?.test_english_level?.attempts || 0);

  return [
    { id: "xp100", label: "100 XP", unlocked: xp >= 100, description: "Acumule 100 XP" },
    { id: "streak7", label: "7 Dias", unlocked: streak >= 7, description: "Mantenha 7 dias seguidos" },
    { id: "vocab50", label: "Vocabulario 50", unlocked: learned >= 50, description: "Marque 50 palavras learned" },
    { id: "call5", label: "Fala ativa", unlocked: sessions >= 5, description: "Faca 5 sessoes com nativos" },
    { id: "test3", label: "Monitoramento", unlocked: tests >= 3, description: "Complete 3 testes de nivel" },
  ];
}

const AVATARS = [
  { key: "mentor", labelKey: "profile.avatar.mentor", fallback: "Mentor", emoji: "\uD83E\uDDE0" },
  { key: "traveler", labelKey: "profile.avatar.traveler", fallback: "Traveler", emoji: "\u2708\uFE0F" },
  { key: "speaker", labelKey: "profile.avatar.speaker", fallback: "Speaker", emoji: "\uD83C\uDFA4" },
  { key: "builder", labelKey: "profile.avatar.builder", fallback: "Builder", emoji: "\uD83D\uDEE0\uFE0F" },
];

function buildModuleHistory(progress) {
  const modules = progress?.modules || {};
  return [
    {
      key: "grammar",
      label: getUiLabel("module.grammar", "Grammar"),
      value: (modules.grammar?.completed_units || []).length,
      helper: getUiLabel("profile.helper.units_completed", "completed units"),
    },
    {
      key: "flashcards",
      label: getUiLabel("module.flashcards", "Flashcards"),
      value: Number(modules.flashcards?.session_history?.length || 0),
      helper: getUiLabel("profile.helper.sessions_logged", "logged sessions"),
    },
    {
      key: "reading",
      label: getUiLabel("module.reading", "Reading"),
      value: (modules.reading_comprehension?.completed_passages || []).length,
      helper: getUiLabel("profile.helper.passages_completed", "completed passages"),
    },
    {
      key: "listening",
      label: getUiLabel("module.listening", "Listening"),
      value: Number(modules.listening?.total_completed || 0),
      helper: getUiLabel("profile.helper.topics_finished", "finished topics"),
    },
    {
      key: "immersion",
      label: getUiLabel("module.immersion", "Immersion"),
      value: (modules.immersion?.completed_themes || []).length,
      helper: "temas conclu�dos",
    },
    {
      key: "writing",
      label: getUiLabel("module.writing", "Writing"),
      value: Number(modules.writing?.attempts || 0),
      helper: getUiLabel("profile.helper.attempts_saved", "saved attempts"),
    },
  ];
}

export default function Profile({ setCurrentView, color = "#4f7cff" }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [progress, setProgress] = useState(null);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    daily_goal_minutes: 20,
    weekly_goal_xp: 400,
    avatar_key: "mentor",
    study_reminders: true,
    public_profile: false,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await readProgress();
        if (!mounted) return;
        setProgress(data);
        setForm({
          display_name: data.modules.profile.display_name || "Learner",
          bio: data.modules.profile.bio || "",
          daily_goal_minutes: Number(data.modules.profile.daily_goal_minutes || 20),
          weekly_goal_xp: Number(data.modules.profile.weekly_goal_xp || 400),
          avatar_key: data.modules.profile.avatar_key || "mentor",
          study_reminders: Boolean(data.modules.profile.settings?.study_reminders),
          public_profile: Boolean(data.modules.profile.settings?.public_profile),
        });
      } catch {
        if (!mounted) return;
        setError(getUiLabel("profile.load_error", "Could not load profile."));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const badges = useMemo(() => buildBadges(progress), [progress]);
  const moduleHistory = useMemo(() => buildModuleHistory(progress), [progress]);

  const totalCompletedModules = useMemo(() => {
    if (!progress?.modules) return 0;
    return moduleHistory.filter((item) => Number(item.value || 0) > 0).length;
  }, [moduleHistory, progress]);

  const recentActivity = useMemo(() => {
    if (!progress?.modules) return [];
    const rows = [];
    const modules = progress.modules;
    if (modules.community?.last_sync) rows.push({ label: getUiLabel("profile.community_updated", "Community updated"), date: modules.community.last_sync });
    if (modules.music?.updated_at) rows.push({ label: getUiLabel("profile.music_updated", "Music updated"), date: modules.music.updated_at });
    if (modules.speak_with_natives?.sessions_history?.length) {
      const last = modules.speak_with_natives.sessions_history[modules.speak_with_natives.sessions_history.length - 1];
      rows.push({ label: `${getUiLabel("profile.native_session", "Session with native speaker")} (${last.native_name || getUiLabel("profile.native_fallback", "Native")})`, date: last.started_at });
    }
    if (modules.test_english_level?.last_result?.finished_at) {
      rows.push({ label: getUiLabel("profile.level_test_completed", "Level test completed"), date: modules.test_english_level.last_result.finished_at });
    }
    if (modules.courses?.certificates?.length) {
      const cert = modules.courses.certificates[modules.courses.certificates.length - 1];
      rows.push({ label: `${getUiLabel("profile.certificate_generated", "Certificate generated")} (${cert.course_title || getUiLabel("profile.course_fallback", "Course")})`, date: cert.issued_at });
    }
    return rows
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [progress]);

  const weeklyGoalProgress = useMemo(() => {
    const xp = Number(progress?.profile?.xp || 0);
    return Math.min(100, Math.round((xp / Math.max(1, Number(form.weekly_goal_xp || 400))) * 100));
  }, [progress, form.weekly_goal_xp]);

  const onSave = async () => {
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const latest = await readProgress();
      const earnedBadges = buildBadges(latest)
        .filter((badge) => badge.unlocked)
        .map((badge) => badge.id);

      latest.modules.profile = {
        ...latest.modules.profile,
        display_name: form.display_name.trim() || getUiLabel("profile.learner", "Learner"),
        bio: form.bio.trim(),
        daily_goal_minutes: Math.max(5, Number(form.daily_goal_minutes || 20)),
        weekly_goal_xp: Math.max(100, Number(form.weekly_goal_xp || 400)),
        badges_unlocked: earnedBadges,
        avatar_key: form.avatar_key,
        settings: {
          study_reminders: Boolean(form.study_reminders),
          public_profile: Boolean(form.public_profile),
        },
        updated_at: new Date().toISOString(),
      };

      const note = {
        id: `note_${Date.now()}`,
        text: getUiLabel("profile.updated_note", "Profile updated"),
        created_at: new Date().toISOString(),
      };
      latest.modules.profile.recent_notes = [note, ...(latest.modules.profile.recent_notes || [])].slice(0, 12);

      const saved = await writeProgress(latest);
      setProgress(saved);
      setSuccess(getUiLabel("profile.saved_success", "Profile saved successfully."));
    } catch {
      setError(getUiLabel("profile.save_error", "Could not save right now."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="profile-shell" style={{ "--profile-theme": color }}>
        <p className="profile-loading">{getUiLabel("profile.loading", "Loading profile...")}</p>
      </section>
    );
  }

  const userXp = Number(progress?.profile?.xp || 0);
  const userStreak = Number(progress?.profile?.streak_days || 0);
  const userHearts = Number(progress?.profile?.hearts || 5);
  const learnedWords = Number(progress?.modules?.my_vocabulary?.learned_words || progress?.my_vocabulary?.learned_words || 0);
  const selectedAvatar = AVATARS.find((item) => item.key === form.avatar_key) || AVATARS[0];

  return (
    <section className="profile-shell" style={{ "--profile-theme": color }}>
      <header className="profile-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
        <div>
          <div className="profile-kicker">{getUiLabel("profile.kicker", "PROFILE")}</div>
          <h1>{getUiLabel("module.profile", "Profile")}</h1>
        </div>
        <ModuleGuideButton moduleKey="profile" color={color} />
      </header>

      <section className="profile-hero-card">
        <div className="profile-avatar-wrap profile-avatar-emoji">{selectedAvatar.emoji}</div>
        <div className="profile-hero-copy">
          <h2>{form.display_name || getUiLabel("profile.learner", "Learner")}</h2>
          <p>{form.bio || getUiLabel("profile.no_bio", "No bio yet.")}</p>
        </div>
        <div className="profile-stat-chips">
          <span><Gem size={14} /> {userXp} XP</span>
          <span><Flame size={14} /> {userStreak} {getUiLabel("profile.days", "days")}</span>
          <span><Trophy size={14} /> {totalCompletedModules} {getUiLabel("profile.active_modules", "active modules")}</span>
          <span>{"\u2665\uFE0F"} {userHearts}</span>
        </div>
      </section>

      <section className="profile-grid">
        <article className="profile-card">
          <h3>{getUiLabel("profile.edit_profile_goals", "Edit profile and goals")}</h3>
          <label>
            {getUiLabel("profile.display_name", "Display name")}
            <input type="text" value={form.display_name} onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))} />
          </label>
          <label>
            {getUiLabel("profile.bio", "Bio")}
            <textarea rows={3} value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} />
          </label>
          <div className="profile-goals-row">
            <label>
              {getUiLabel("profile.daily_goal_min", "Daily goal (min)")}
              <input type="number" min="5" value={form.daily_goal_minutes} onChange={(e) => setForm((prev) => ({ ...prev, daily_goal_minutes: Number(e.target.value || 20) }))} />
            </label>
            <label>
              {getUiLabel("profile.weekly_goal_xp", "Weekly goal (XP)")}
              <input type="number" min="100" step="10" value={form.weekly_goal_xp} onChange={(e) => setForm((prev) => ({ ...prev, weekly_goal_xp: Number(e.target.value || 400) }))} />
            </label>
          </div>
          <div className="profile-goal-progress">
            <div className="profile-goal-track"><div className="profile-goal-fill" style={{ width: `${weeklyGoalProgress}%` }} /></div>
            <span>{weeklyGoalProgress}% {getUiLabel("profile.of_weekly_goal", "of weekly goal")}</span>
          </div>
          <button type="button" className="profile-save-btn" onClick={onSave} disabled={saving}>
            <Save size={15} />
            {saving ? getUiLabel("common.saving", "Saving...") : getUiLabel("profile.save_profile", "Save profile")}
          </button>
          {error ? <p className="profile-error">{error}</p> : null}
          {success ? <p className="profile-success">{success}</p> : null}
        </article>

        <article className="profile-card">
          <h3><Award size={16} /> {getUiLabel("profile.avatar_settings", "Avatar and settings")}</h3>
          <div className="profile-avatar-list">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.key}
                type="button"
                className={`profile-avatar-choice ${form.avatar_key === avatar.key ? "is-active" : ""}`}
                onClick={() => setForm((prev) => ({ ...prev, avatar_key: avatar.key }))}
              >
                <span>{avatar.emoji}</span>
                <strong>{getUiLabel(avatar.labelKey, avatar.fallback)}</strong>
              </button>
            ))}
          </div>
          <div className="profile-settings-box">
            <label className="profile-setting-item">
              <input
                type="checkbox"
                checked={form.study_reminders}
                onChange={(e) => setForm((prev) => ({ ...prev, study_reminders: e.target.checked }))}
              />
              <span><Settings2 size={14} /> {getUiLabel("profile.study_reminders", "Study reminders")}</span>
            </label>
            <label className="profile-setting-item">
              <input
                type="checkbox"
                checked={form.public_profile}
                onChange={(e) => setForm((prev) => ({ ...prev, public_profile: e.target.checked }))}
              />
              <span><UserCircle2 size={14} /> {getUiLabel("profile.public_profile", "Public profile")}</span>
            </label>
          </div>
        </article>

        <article className="profile-card">
          <h3>{getUiLabel("profile.achievements", "Achievements")}</h3>
          <div className="profile-badge-list">
            {badges.map((badge) => (
              <div key={badge.id} className={`profile-badge-item ${badge.unlocked ? "is-unlocked" : ""}`}>
                <strong>{badge.label}</strong>
                <span>{badge.description}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="profile-card">
          <h3><BarChart3 size={16} /> {getUiLabel("profile.full_stats", "Full stats")}</h3>
          <div className="profile-summary-grid">
            <div><Clock3 size={15} /><span>{getUiLabel("profile.daily_goal", "Daily goal")}: {form.daily_goal_minutes} min</span></div>
            <div><Gem size={15} /><span>{getUiLabel("profile.weekly_goal", "Weekly goal")}: {form.weekly_goal_xp} XP</span></div>
            <div><Trophy size={15} /><span>{getUiLabel("profile.learned_words", "Learned words")}: {learnedWords}</span></div>
            <div><Flame size={15} /><span>{getUiLabel("profile.current_streak", "Current streak")}: {userStreak} {getUiLabel("profile.days", "days")}</span></div>
          </div>
        </article>

        <article className="profile-card">
          <h3>{getUiLabel("profile.module_history", "History by module")}</h3>
          <div className="profile-module-history">
            {moduleHistory.map((item) => (
              <article key={item.key} className="profile-module-history-item">
                <strong>{item.label}</strong>
                <span>{item.value}</span>
                <em>{item.helper}</em>
              </article>
            ))}
          </div>
        </article>

        <article className="profile-card">
          <h3>{getUiLabel("profile.recent_activity", "Recent activity")}</h3>
          <div className="profile-activity-list">
            {recentActivity.length === 0 ? (
              <p>{getUiLabel("profile.no_recent_activity", "No recent activity recorded.")}</p>
            ) : (
              recentActivity.map((item, idx) => (
                <div key={`${item.label}_${idx}`} className="profile-activity-item">
                  <strong>{item.label}</strong>
                  <span>{new Date(item.date).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </section>
  );
}


