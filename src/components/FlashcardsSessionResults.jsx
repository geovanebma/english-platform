import React, { useMemo } from "react";
import { getUiLabel } from "../lib/uiLabels";
import { ArrowLeft, BarChart3, Clock3, Gauge, RefreshCw, Target } from "lucide-react";

function formatDuration(seconds = 0) {
  const safe = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatRelativeDue(iso) {
  if (!iso) return getUiLabel("flash.results.no_schedule", "No schedule");
  const diffMs = Date.parse(iso) - Date.now();
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  if (diffHours <= 0) return getUiLabel("flash.results.available_now", "Available now");
  if (diffHours < 24) return getUiLabel("flash.results.in_hours", "In {hours}h").replace("{hours}", String(diffHours));
  const diffDays = Math.round(diffHours / 24);
  return getUiLabel("flash.results.in_days", "In {days}d").replace("{days}", String(diffDays));
}

export default function FlashcardsSessionResults({ results, deckName, onBack, color = "#096105", sourceLanguage = "pt-BR" }) {
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
      { key: "easy", label: getUiLabel("flash.rate.easy", "Easy"), value: Number(summary.easy || 0), tone: "easy" },
      { key: "good", label: getUiLabel("flash.rate.good", "Good"), value: Number(summary.good || 0), tone: "good" },
      { key: "hard", label: getUiLabel("flash.rate.hard", "Hard"), value: Number(summary.hard || 0), tone: "hard" },
      { key: "again", label: getUiLabel("flash.rate.again", "Again"), value: Number(summary.again || 0), tone: "again" },
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
          <span className="flash-results-kicker">{getUiLabel("flash.results.report", "Flashcards review report")}</span>
          <h1>{getUiLabel("flash.results.completed", "Session completed")}</h1>
          <p>{deckName}</p>
        </div>
        <div className="flash-results-score-ring" aria-label={getUiLabel("flash.results.accuracy_aria", "Accuracy {value}%").replace("{value}", String(accuracy))}>
          <div className="flash-results-score-ring-inner">
            <strong>{accuracy}%</strong>
            <span>{getUiLabel("flash.results.precision", "Accuracy")}</span>
          </div>
        </div>
      </div>

      <div className="flash-results-overview">
        <article className="flash-results-stat-card">
          <span className="flash-results-stat-icon"><Clock3 size={18} /></span>
          <div>
            <small>{getUiLabel("flash.results.total_time", "Total time")}</small>
            <strong>{formatDuration(durationSeconds)}</strong>
          </div>
        </article>
        <article className="flash-results-stat-card">
          <span className="flash-results-stat-icon"><BarChart3 size={18} /></span>
          <div>
            <small>{getUiLabel("flash.results.reviewed_cards", "Cards reviewed")}</small>
            <strong>{reviewedCards}</strong>
          </div>
        </article>
        <article className="flash-results-stat-card">
          <span className="flash-results-stat-icon"><Gauge size={18} /></span>
          <div>
            <small>{getUiLabel("flash.results.average_pace", "Average pace")}</small>
            <strong>{getUiLabel("flash.results.cards_per_min", "{value} cards/min").replace("{value}", String(cardsPerMinute))}</strong>
          </div>
        </article>
        <article className="flash-results-stat-card">
          <span className="flash-results-stat-icon"><Target size={18} /></span>
          <div>
            <small>{getUiLabel("flash.results.priority_reviews", "Priority reviews")}</small>
            <strong>{focusCards}</strong>
          </div>
        </article>
      </div>

      <div className="flash-results-layout">
        <article className="flash-results-panel">
          <div className="flash-results-panel-head">
            <h2>{getUiLabel("flash.results.answer_distribution", "Answer distribution")}</h2>
            <span>{getUiLabel("flash.results.answers_count", "{count} answers").replace("{count}", String(totalCards))}</span>
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
            <h2>{getUiLabel("flash.results.quick_diagnosis", "Quick diagnosis")}</h2>
            <span>{getUiLabel("flash.results.session_read", "Session read")}</span>
          </div>
          <div className="flash-results-insights">
            <div className="flash-results-insight">
              <small>{getUiLabel("flash.results.dominant_band", "Dominant band")}</small>
              <strong>{strongestBucket?.label || "-"}</strong>
              <p>{getUiLabel("flash.results.dominant_band_desc", "This was the most frequent behavior in the session.")}</p>
            </div>
            <div className="flash-results-insight">
              <small>{getUiLabel("flash.results.consolidation_rate", "Consolidation rate")}</small>
              <strong>{Math.min(100, Math.round((((summary.easy || 0) + (summary.good || 0)) / Math.max(totalCards, 1)) * 100))}%</strong>
              <p>{getUiLabel("flash.results.consolidation_desc", "Percentage of answers that indicate good or stable retention.")}</p>
            </div>
            <div className="flash-results-insight">
              <small>{getUiLabel("flash.results.repeat_items", "Items to repeat")}</small>
              <strong>{(summary.hard || 0) + (summary.again || 0)}</strong>
              <p>{getUiLabel("flash.results.repeat_items_desc", "These items should return with priority in the next session.")}</p>
            </div>
          </div>
        </article>
      </div>

      <div className="flash-results-layout flash-results-layout-secondary">
        <article className="flash-results-panel">
          <div className="flash-results-panel-head">
            <h2>{getUiLabel("flash.results.fragile_cards", "Most fragile cards")}</h2>
            <span>{getUiLabel("flash.results.items_count", "{count} items").replace("{count}", String(weakestCards.length))}</span>
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
              <div className="flash-results-empty">{getUiLabel("flash.results.no_fragile", "No fragile cards in this session.")}</div>
            )}
          </div>
        </article>

        <article className="flash-results-panel">
          <div className="flash-results-panel-head">
            <h2>{getUiLabel("flash.results.next_review_schedule", "Next review schedule")}</h2>
            <span>SRS</span>
          </div>
          <div className="flash-results-insights">
            <div className="flash-results-insight">
              <small>{getUiLabel("flash.results.first_return", "First return")}</small>
              <strong>{formatRelativeDue(nextDueAt)}</strong>
              <p>{nextDueAt ? new Date(nextDueAt).toLocaleString(sourceLanguage || "pt-BR") : getUiLabel("flash.results.no_estimated_date", "No estimated date yet.")}</p>
            </div>
            <div className="flash-results-insight">
              <small>{getUiLabel("flash.results.cards_24h", "Cards within 24h")}</small>
              <strong>{dueWithin24h}</strong>
              <p>{getUiLabel("flash.results.cards_24h_desc", "Number of items likely to return quickly within one day.")}</p>
            </div>
          </div>
        </article>
      </div>

      <div className="flash-results-footer-card">
        <div className="flash-results-footer-copy">
          <span className="flash-results-footer-icon"><RefreshCw size={18} /></span>
          <div>
            <strong>{getUiLabel("flash.results.next_review", "Next review")}</strong>
            <p>
              {focusCards > 0
                ? getUiLabel("flash.results.next_review_focus", "{count} cards enter as priority focus in the next round.").replace("{count}", String(focusCards))
                : getUiLabel("flash.results.next_review_clear", "No critical cards in this session. The next round can focus on expansion or maintenance.")}
            </p>
          </div>
        </div>
        <button type="button" className="flash-results-back" onClick={onBack}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Back")}
        </button>
      </div>
    </section>
  );
}



