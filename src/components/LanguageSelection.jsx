import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { getOnboardingCatalog } from "../lib/authClient";
import { getUiLabel } from "../lib/uiLabels";

function LanguageSelection({ siteLanguage, onSiteLanguageChange, onBack, onSelectLanguage, labelsVersion }) {
  const [siteLanguages, setSiteLanguages] = useState([]);
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const catalog = await getOnboardingCatalog(siteLanguage);
      if (!active) return;
      setSiteLanguages(catalog.site_languages || []);
      setLanguages(catalog.languages || []);
    })();
    return () => {
      active = false;
    };
  }, [siteLanguage]);

  const summary = useMemo(() => {
    const selected = siteLanguages.find((item) => item.code === siteLanguage);
    if (!selected) return "";
    return getUiLabel("language.available_count", "{count} languages available").replace("{count}", selected.available_count);
  }, [siteLanguage, siteLanguages]);

  return (
    <section className="duo-public-shell is-language-step">
      <header className="duo-public-header is-compact">
        <div className="duo-public-brand">
          <img src="/img/duolingo.png" alt="Duolingo" />
        </div>

        <label className="duo-site-language-select">
          <span>{getUiLabel("language.site_label", "IDIOMA DO SITE")}</span>
          <div className="duo-site-language-wrap">
            <select value={siteLanguage} onChange={(e) => onSiteLanguageChange(e.target.value)}>
              {siteLanguages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown size={18} />
          </div>
        </label>
      </header>

      <div className="duo-language-page">
        <button type="button" className="duo-public-back" onClick={onBack}>
          <ArrowLeft size={18} />
          {getUiLabel("common.back", "Voltar")}
        </button>

        <div className="duo-language-intro">
          <h1>{getUiLabel("language.want_learn", "Eu quero aprender...")}</h1>
          <p>{summary}</p>
        </div>

        <div className="duo-language-grid">
          {languages.map((language) => (
            <button
              key={`${siteLanguage}-${language.code}`}
              type="button"
              className="duo-language-card"
              onClick={() => onSelectLanguage(language)}
            >
              <span className="duo-language-flag">{language.flag}</span>
              <strong>{language.label}</strong>
              <span>{language.learners_display}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LanguageSelection;


