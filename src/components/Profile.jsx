import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, UserCircle2, Save, Trophy, Flame, Gem, Clock3 } from "lucide-react";
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
      updated_at: null,
    };
  }
  if (!Array.isArray(data.modules.profile.badges_unlocked)) data.modules.profile.badges_unlocked = [];
  if (!Array.isArray(data.modules.profile.recent_notes)) data.modules.profile.recent_notes = [];
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
    { id: "vocab50", label: "VocabulÃ¡rio 50", unlocked: learned >= 50, description: "Marque 50 palavras learned" },
    { id: "call5", label: "Fala ativa", unlocked: sessions >= 5, description: "FaÃ§a 5 sessÃµes com nativos" },
    { id: "test3", label: "Monitoramento", unlocked: tests >= 3, description: "Complete 3 testes de nÃ­vel" },
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
        });
      } catch {
        if (!mounted) return;
        setError("Nao foi possivel carregar o perfil.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const badges = useMemo(() => buildBadges(progress), [progress]);

  const totalCompletedModules = useMemo(() => {
    if (!progress?.modules) return 0;
    const blocks = progress.modules;
    let done = 0;
    if ((blocks.grammar?.completed_units || []).length > 0) done += 1;
    if ((blocks.flashcards?.last_results && blocks.flashcards.last_results.completed) || false) done += 1;
    if ((blocks.reading_comprehension?.completed_passages || []).length > 0) done += 1;
    if ((blocks.immersion?.completed_themes || []).length > 0) done += 1;
    if ((blocks.listening?.total_completed || 0) > 0) done += 1;
    return done;
  }, [progress]);

  const recentActivity = useMemo(() => {
    if (!progress?.modules) return [];
    const rows = [];
    const modules = progress.modules;
    if (modules.community?.last_sync) {
      rows.push({ label: "Community atualizada", date: modules.community.last_sync });
    }
    if (modules.music?.updated_at) {
      rows.push({ label: "Music atualizada", date: modules.music.updated_at });
    }
    if (modules.speak_with_natives?.sessions_history?.length) {
      const last = modules.speak_with_natives.sessions_history[modules.speak_with_natives.sessions_history.length - 1];
      rows.push({ label: `SessÃ£o com nativo (${last.native_name || "Nativo"})`, date: last.started_at });
    }
    if (modules.test_english_level?.last_result?.finished_at) {
      rows.push({ label: "Teste de nÃ­vel concluÃ­do", date: modules.test_english_level.last_result.finished_at });
    }
    return rows
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [progress]);

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
        display_name: form.display_name.trim() || "Learner",
        bio: form.bio.trim(),
        daily_goal_minutes: Math.max(5, Number(form.daily_goal_minutes || 20)),
        weekly_goal_xp: Math.max(100, Number(form.weekly_goal_xp || 400)),
        badges_unlocked: earnedBadges,
        updated_at: new Date().toISOString(),
      };

      const note = {
        id: `note_${Date.now()}`,
        text: "Perfil atualizado",
        created_at: new Date().toISOString(),
      };
      latest.modules.profile.recent_notes = [note, ...(latest.modules.profile.recent_notes || [])].slice(0, 12);

      const saved = await writeProgress(latest);
      setProgress(saved);
      setSuccess("Perfil salvo com sucesso.");
    } catch {
      setError("Nao foi possivel salvar agora.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="profile-shell" style={{ "--profile-theme": color }}>
        <p className="profile-loading">Carregando perfil...</p>
      </section>
    );
  }

  const userXp = Number(progress?.profile?.xp || 0);
  const userStreak = Number(progress?.profile?.streak_days || 0);
  const userHearts = Number(progress?.profile?.hearts || 5);
  const learnedWords = Number(
    progress?.modules?.my_vocabulary?.learned_words || progress?.my_vocabulary?.learned_words || 0
  );

  return (
    <section className="profile-shell" style={{ "--profile-theme": color }}>
      <header className="profile-head">
        <button type="button" className="duo-back-btn" onClick={() => setCurrentView("initial")}>
          <ArrowLeft size={18} />
          Voltar
        </button>
        <div>
          <div className="profile-kicker">PROFILE</div>
          <h1>Meu Perfil</h1>
        </div>
              <ModuleGuideButton moduleKey="profile" color={color} />
</header>

      <section className="profile-hero-card">
        <div className="profile-avatar-wrap">
          <UserCircle2 size={70} />
        </div>
        <div className="profile-hero-copy">
          <h2>{form.display_name || "Learner"}</h2>
          <p>{form.bio || "Sem bio ainda."}</p>
        </div>
        <div className="profile-stat-chips">
          <span><Gem size={14} /> {userXp} XP</span>
          <span><Flame size={14} /> {userStreak} dias</span>
          <span><Trophy size={14} /> {totalCompletedModules} mÃ³dulos ativos</span>
          <span>â¤ {userHearts}</span>
        </div>
      </section>

      <section className="profile-grid">
        <article className="profile-card">
          <h3>Editar perfil e metas</h3>
          <label>
            Nome exibido
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
            />
          </label>
          <label>
            Bio
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </label>
          <div className="profile-goals-row">
            <label>
              Meta diÃ¡ria (min)
              <input
                type="number"
                min="5"
                value={form.daily_goal_minutes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, daily_goal_minutes: Number(e.target.value || 20) }))
                }
              />
            </label>
            <label>
              Meta semanal (XP)
              <input
                type="number"
                min="100"
                step="10"
                value={form.weekly_goal_xp}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, weekly_goal_xp: Number(e.target.value || 400) }))
                }
              />
            </label>
          </div>
          <button type="button" className="profile-save-btn" onClick={onSave} disabled={saving}>
            <Save size={15} />
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
          {error ? <p className="profile-error">{error}</p> : null}
          {success ? <p className="profile-success">{success}</p> : null}
        </article>

        <article className="profile-card">
          <h3>Conquistas</h3>
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
          <h3>Resumo de estudo</h3>
          <div className="profile-summary-grid">
            <div>
              <Clock3 size={15} />
              <span>Meta diÃ¡ria: {form.daily_goal_minutes} min</span>
            </div>
            <div>
              <Gem size={15} />
              <span>Meta semanal: {form.weekly_goal_xp} XP</span>
            </div>
            <div>
              <Trophy size={15} />
              <span>Palavras learned: {learnedWords}</span>
            </div>
            <div>
              <Flame size={15} />
              <span>Streak atual: {userStreak} dias</span>
            </div>
          </div>
        </article>

        <article className="profile-card">
          <h3>Atividade recente</h3>
          <div className="profile-activity-list">
            {recentActivity.length === 0 ? (
              <p>Nenhuma atividade recente registrada.</p>
            ) : (
              recentActivity.map((item, idx) => (
                <div key={`${item.label}_${idx}`} className="profile-activity-item">
                  <strong>{item.label}</strong>
                  <span>{new Date(item.date).toLocaleString("pt-BR")}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </section>
  );
}
