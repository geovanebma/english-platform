import React from "react";
import { getUiLabel } from "../lib/uiLabels";
import { CheckCircle2, Crown, ShieldCheck, Sparkles, Zap } from "lucide-react";

const PREMIUM_AI_MODULES = [
  { key: "module.speak_ai", fallback: "Speak With AI" },
  { key: "module.modern", fallback: "Modern Methodologies" },
  { key: "module.writing", fallback: "Writing" },
  { key: "module.translation_practice", fallback: "Translation Practice" },
];

const MODULE_FEATURES = {
  "Speak With AI": [
    { key: "plans.feature.speak_ai.1", fallback: "Guided conversations with contextual feedback" },
    { key: "plans.feature.speak_ai.2", fallback: "Read-aloud playback of the answers" },
    { key: "plans.feature.speak_ai.3", fallback: "Smart vocabulary expansion" },
  ],
  "Modern Methodologies": [
    { key: "plans.feature.modern.1", fallback: "Adaptive mentoring by objective" },
    { key: "plans.feature.modern.2", fallback: "Deep sessions focused by skill" },
    { key: "plans.feature.modern.3", fallback: "Guided plan with smart suggestions" },
  ],
  Writing: [
    { key: "plans.feature.writing.1", fallback: "AI-assisted correction" },
    { key: "plans.feature.writing.2", fallback: "Style and clarity feedback" },
    { key: "plans.feature.writing.3", fallback: "Support for guided long-form texts" },
  ],
  "Translation Practice": [
    { key: "plans.feature.translation.1", fallback: "Stronger semantic validation" },
    { key: "plans.feature.translation.2", fallback: "Context and translation equivalences" },
    { key: "plans.feature.translation.3", fallback: "Smart reinforcement for fragile phrases" },
  ],
};

export default function PlansPage({ module, isPremiumUser, onBack, onActivatePremium }) {
  const moduleLabel = module?.label || getUiLabel("plans.this_module", "this module");
  const moduleFeatures = MODULE_FEATURES[moduleLabel] || [
    { key: "plans.feature.default.1", fallback: "Smart AI-assisted flows" },
    { key: "plans.feature.default.2", fallback: "More pedagogical personalization" },
    { key: "plans.feature.default.3", fallback: "Premium experience with advanced support" },
  ];

  return (
    <section className="plans-shell" style={{ "--plans-theme": module?.color || "#58cc02" }}>
      <div className="plans-topbar">
        <button type="button" className="duo-back-btn" onClick={onBack}>
          {getUiLabel("common.back", "Back")}
        </button>
        <div className="plans-kicker">
          <Crown size={18} />
          <span>{getUiLabel("plans.premium_required", "Premium required")}</span>
        </div>
      </div>

      <div className="plans-hero">
        <div className="plans-hero-copy">
          <div className="plans-eyebrow">{getUiLabel("plans.ai_features", "AI FEATURES")}</div>
          <h1>{moduleLabel} {getUiLabel("plans.part_of_premium", "is part of Premium")}</h1>
          <p>
            Os módulos com IA ficam liberados apenas para contas Premium. Se alguém tentar entrar neles,
            o app redireciona para esta tela de planos para mostrar o que sera desbloqueado.
          </p>
          <div className="plans-pill-row">
            {PREMIUM_AI_MODULES.map((item) => (
              <span key={item.key} className="plans-pill">
                {getUiLabel(item.key, item.fallback)}
              </span>
            ))}
          </div>
        </div>

        <div className="plans-hero-badge">
          <Sparkles size={30} />
          <strong>{getUiLabel("plans.premium", "Premium")}</strong>
          <span>{getUiLabel("plans.hero_badge", "AI, personalization, and stronger learning tools")}</span>
        </div>
      </div>

      <div className="plans-grid">
        <article className="plans-card">
          <div className="plans-card-head">
            <span>{getUiLabel("plans.free", "Free")}</span>
            <strong>{getUiLabel("plans.continue_learning", "Keep learning")}</strong>
          </div>
          <ul className="plans-feature-list">
            <li><CheckCircle2 size={16} /> {getUiLabel("plans.free_feature.1", "Grammar, Flashcards, Reading, Listening, and more")}</li>
            <li><CheckCircle2 size={16} /> {getUiLabel("plans.free_feature.2", "Account sync")}</li>
            <li><CheckCircle2 size={16} /> {getUiLabel("plans.free_feature.3", "Guided onboarding and weekly plan")}</li>
          </ul>
        </article>

        <article className="plans-card is-module-focus">
          <div className="plans-card-head">
            <span>{getUiLabel("plans.unlock_of", "Unlock of")} {moduleLabel}</span>
            <strong>{getUiLabel("plans.what_includes", "What comes with Premium")}</strong>
          </div>
          <ul className="plans-feature-list">
            {moduleFeatures.map((item) => (
              <li key={item.key}>
                <ShieldCheck size={16} /> {getUiLabel(item.key, item.fallback)}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="plans-pricing-grid">
        <article className="plans-pricing-card">
          <div className="plans-pricing-top">
            <span>{getUiLabel("plans.monthly", "Monthly")}</span>
            <strong>R$ 39,90</strong>
            <em>{getUiLabel("plans.per_month", "per month")}</em>
          </div>
          <ul className="plans-feature-list is-compact">
            <li><Zap size={16} /> {getUiLabel("plans.monthly_feature.1", "Immediate access to AI modules")}</li>
            <li><Zap size={16} /> {getUiLabel("plans.monthly_feature.2", "Ideal for testing Premium")}</li>
          </ul>
          <button
            type="button"
            className="plans-upgrade-btn"
            onClick={() => onActivatePremium?.("monthly")}
            disabled={isPremiumUser}
          >
            {isPremiumUser ? getUiLabel("plans.premium_active", "Premium active") : getUiLabel("plans.subscribe_monthly", "Subscribe monthly")}
          </button>
        </article>

        <article className="plans-pricing-card is-highlighted">
          <div className="plans-save-badge">{getUiLabel("plans.best_value", "Best value")}</div>
          <div className="plans-pricing-top">
            <span>{getUiLabel("plans.yearly", "Yearly")}</span>
            <strong>R$ 299,90</strong>
            <em>{getUiLabel("plans.twelve_months", "12 months of access")}</em>
          </div>
          <ul className="plans-feature-list is-compact">
            <li><Zap size={16} /> {getUiLabel("plans.yearly_feature.1", "All AI modules unlocked")}</li>
            <li><Zap size={16} /> {getUiLabel("plans.yearly_feature.2", "Savings compared to monthly")}</li>
          </ul>
          <button
            type="button"
            className="plans-upgrade-btn"
            onClick={() => onActivatePremium?.("yearly")}
            disabled={isPremiumUser}
          >
            {isPremiumUser ? getUiLabel("plans.premium_active", "Premium active") : getUiLabel("plans.subscribe_yearly", "Subscribe yearly")}
          </button>
        </article>
      </div>
    </section>
  );
}


