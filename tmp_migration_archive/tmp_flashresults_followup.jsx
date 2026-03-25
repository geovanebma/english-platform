import React, { useMemo } from "react";
import { ArrowLeft, BarChart3, Clock3, Gauge, RefreshCw, Target } from "lucide-react";

function formatDuration(seconds = 0) {
  const safe = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatRelativeDue(iso) {
  if (!iso) return "Sem agendamento";
  const diffMs = Date.parse(iso) - Date.now();
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  if (diffHours <= 0) return "Disponivel agora";
  if (diffHours < 24) return `Em ${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `Em ${diffDays}d`;
}

export default function FlashcardsSessionResults({ results, deckName, onBack, color = "#096105" }) {
  const summary = results?.summary || {};
  const totalCards = Number(results?.total_cards || 0);
  const reviewedCards = Number(results?.unique_reviewed_cards || totalCards || 0);
  const durationSeconds = Number(results?.duration_seconds || 0);
  const cardsPerMinute = Number(results?.cards_per_minute || 0);
  const accuracy = Number(results?.accuracy || 0);
  const focusCards = Number(results?.focus_cards_count || 0);
  const weakestCards = Array.isArray(results?.weakest_cards) ? results.weakest_cards : [];
  const nextDueAt = results?.next_due_at || null;
  const dueWithin24h = Number(results?.due_within_24h || 0);

  const ratingRows = useMemo(() => {
    const rows = [
      { key: "easy", label: "Easy", value: Number(summary.easy || 0), tone: "easy" },
      { key: "good", label: "Good", value: Number(summary.good || 0), tone: "good" },
      { key: "hard", label: "Hard", value: Number(summary.hard || 0), tone: "hard" },
      { key: "again", label: "Again", value: Number(summary.again || 0), tone: "again" },
    ];

    return rows.map((row) => ({
      ...row,
      percent: totalCards > 0 ? Math.round((row.value / totalCards) * 100) : 0,
    }));
  }, [summary, totalCards]);

  const strongestBucket = ratingRows.reduce((best, row) => (row.value > best.value ? row : best), ratingRows[0] || { label: "-", value: 0 });

  return (
    <section
      className="flash-results-shell"
      style={{
        "--flash-theme": color,
        "--flash-theme-shadow": "color-mix(in srgb, var(--flash-theme) 68%, #000 32%)",
      }}
    >
      <div className="flash-results-head flash-results-head-card">
        <div className="flash-results-head-copy">
          <span className="flash-results-kicker">Flashcards Review Report</span>
          <h1>Sessao concluida</h1>
          <p>{deckName}</p>
        </div>
        <div className="flash-results-score-ring" aria-label={`Precisao ${accuracy}%`}>
          <div className="flash-results-score-ring-inner">
            <strong>{accuracy}%</strong>
            <span>Precisao</span>
          </div>
        </div>
      </div>

      <div className="flash-results-overview">
        <article className="flash-results-stat-card">
          <span className="flash-results-stat-icon"><Clock3 size={18} /></span>
          <div>
            <small>Tempo total</small>
            <strong>{formatDuration(durationSeconds)}</strong>
          </div>
        </article>
        <article className="flash-results-stat-card">
          <span className="flash-results-stat-icon"><BarChart3 size={18} /></span>
          <div>
            <small>Cartoes revisados</small>
            <strong>{reviewedCards}</strong>
          </div>
        </article>
        <article className="flash-results-stat-card">
          <span className="flash-results-stat-icon"><Gauge size={18} /></span>
          <div>
            <small>Ritmo medio</small>
            <strong>{cardsPerMinute} cartoes/min</strong>
          </div>
        </article>
        <article className="flash-results-stat-card">
          <span className="flash-results-stat-icon"><Target size={18} /></span>
          <div>
            <small>Revisoes prioritarias</small>
            <strong>{focusCards}</strong>
          </div>
        </article>
      </div>

      <div className="flash-results-layout">
        <article className="flash-results-panel">
          <div className="flash-results-panel-head">
            <h2>Distribuicao das respostas</h2>
            <span>{totalCards} respostas</span>
          </div>
          <div className="flash-results-bars">
            {ratingRows.map((row) => (
              <div key={row.key} className="flash-results-bar-row">
                <div className="flash-results-bar-meta">
                  <strong>{row.label}</strong>
                  <span>{row.value} • {row.percent}%</span>
                </div>
                <div className="flash-results-bar-track">
                  <div className={`flash-results-bar-fill is-${row.tone}`} style={{ width: `${Math.max(row.percent, row.value > 0 ? 6 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="flash-results-panel">
          <div className="flash-results-panel-head">
            <h2>Diagnostico rapido</h2>
            <span>Leitura da sessao</span>
          </div>
          <div className="flash-results-insights">
            <div className="flash-results-insight">
              <small>Faixa dominante</small>
              <strong>{strongestBucket?.label || "-"}</strong>
              <p>Esse foi o comportamento mais frequente da sessao.</p>
            </div>
            <div className="flash-results-insight">
              <small>Taxa de consolidacao</small>
              <strong>{Math.min(100, Math.round((((summary.easy || 0) + (summary.good || 0)) / Math.max(totalCards, 1)) * 100))}%</strong>
              <p>Percentual de respostas que indicam retencao boa ou estavel.</p>
            </div>
            <div className="flash-results-insight">
              <small>Itens para repetir</small>
              <strong>{(summary.hard || 0) + (summary.again || 0)}</strong>
              <p>Esses itens devem voltar com prioridade na proxima sessao.</p>
            </div>
          </div>
        </article>
      </div>

      <div className="flash-results-layout flash-results-layout-secondary">
        <article className="flash-results-panel">
          <div className="flash-results-panel-head">
            <h2>Cards mais frageis</h2>
            <span>{weakestCards.length} itens</span>
          </div>
          <div className="flash-results-fragile-list">
            {weakestCards.length ? weakestCards.map((card) => (
              <div key={card.card_id} className="flash-results-fragile-item">
                <div className="flash-results-fragile-copy">
                  <strong>{card.front}</strong>
                  <span>{card.back}</span>
                </div>
                <div className="flash-results-fragile-meta">
                  <small>{card.rating}</small>
                  <span>{formatRelativeDue(card.due_at)}</span>
                </div>
              </div>
            )) : (
              <div className="flash-results-empty">Nenhum card fragil nesta sessao.</div>
            )}
          </div>
        </article>

        <article className="flash-results-panel">
          <div className="flash-results-panel-head">
            <h2>Agenda da proxima revisao</h2>
            <span>SRS</span>
          </div>
          <div className="flash-results-insights">
            <div className="flash-results-insight">
              <small>Primeiro retorno</small>
              <strong>{formatRelativeDue(nextDueAt)}</strong>
              <p>{nextDueAt ? new Date(nextDueAt).toLocaleString("pt-BR") : "Ainda sem data prevista."}</p>
            </div>
            <div className="flash-results-insight">
              <small>Cards ate 24h</small>
              <strong>{dueWithin24h}</strong>
              <p>Quantidade de itens que tendem a voltar rapido na janela de um dia.</p>
            </div>
          </div>
        </article>
      </div>

      <div className="flash-results-footer-card">
        <div className="flash-results-footer-copy">
          <span className="flash-results-footer-icon"><RefreshCw size={18} /></span>
          <div>
            <strong>Proxima revisao</strong>
            <p>
              {focusCards > 0
                ? `${focusCards} cartoes entram como foco prioritario na proxima rodada.`
                : "Nenhum cartao critico nesta sessao. A proxima rodada pode focar em expansao ou manutencao."}
            </p>
          </div>
        </div>
        <button type="button" className="flash-results-back" onClick={onBack}>
          <ArrowLeft size={18} />
          Voltar
        </button>
      </div>
    </section>
  );
}
