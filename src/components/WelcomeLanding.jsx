import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getOnboardingCatalog } from "../lib/authClient";
import { getUiLabel } from "../lib/uiLabels";

function WelcomeLanding({ siteLanguage, onSiteLanguageChange, onStart, onLogin, labelsVersion }) {
  const [siteLanguages, setSiteLanguages] = useState([
    { code: "pt-BR", label: "Português", available_count: 8 },
    { code: "en-US", label: "English", available_count: 20 },
  ]);

  useEffect(() => {
    let active = true;
    (async () => {
      const catalog = await getOnboardingCatalog(siteLanguage);
      if (!active) return;
      if (Array.isArray(catalog.site_languages) && catalog.site_languages.length) {
        setSiteLanguages(catalog.site_languages);
      }
    })();
    return () => {
      active = false;
    };
  }, [siteLanguage]);

  return (
    <section className="duo-public-shell">
      <header className="duo-public-header">
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

      <main className="duo-public-hero">
        <div className="duo-public-illustration">
          <img src="/img/duolingo_characters.png" alt="Duolingo characters" />
        </div>

        <div className="duo-public-copy">
          <h1>{getUiLabel("landing.headline", "The free, fun, and effective way to learn a language!")}</h1>

          <div className="duo-public-actions">
            <button type="button" className="duo-public-cta" onClick={onStart}>
              {getUiLabel("landing.start_now", "COMECE AGORA")}
            </button>
            <button type="button" className="duo-public-secondary" onClick={onLogin}>
              {getUiLabel("landing.already_account", "I ALREADY HAVE AN ACCOUNT")}
            </button>
          </div>
        </div>
      </main>
    </section>
  );
}

export default WelcomeLanding;


