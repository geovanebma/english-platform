import React from "react";
import { ArrowLeft } from "lucide-react";

export default function FlashcardsSessionResults({ results, deckName, onBack, color = "#096105" }) {
  const summary = results?.summary || {};
  const totalCards = results?.total_cards || 0;

  return (
    <section
      className="flash-results-shell"
      style={{
        "--flash-theme": color,
        "--flash-theme-shadow": "color-mix(in srgb, var(--flash-theme) 68%, #000 32%)",
      }}
    >
      <div className="flash-results-head">
        <h1>Sessao concluida!</h1>
        <p>Deck: {deckName}</p>
      </div>

      <div className="flash-results-grid">
        <article className="flash-results-card">
          <h3>Easy</h3>
          <strong>{summary.easy || 0}</strong>
        </article>
        <article className="flash-results-card">
          <h3>Good</h3>
          <strong>{summary.good || 0}</strong>
        </article>
        <article className="flash-results-card">
          <h3>Hard</h3>
          <strong>{summary.hard || 0}</strong>
        </article>
        <article className="flash-results-card">
          <h3>Again</h3>
          <strong>{summary.again || 0}</strong>
        </article>
      </div>

      <div className="flash-results-footer">
        <div className="flash-results-total">Cartoes revisados: {totalCards}</div>
      </div>

      <button type="button" className="flash-results-back" onClick={onBack}>
        <ArrowLeft size={18} />
        Voltar
      </button>
    </section>
  );
}
