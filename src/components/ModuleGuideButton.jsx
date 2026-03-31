import React, { useMemo, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { getModuleGuide } from "../data/moduleGuides";

export default function ModuleGuideButton({ moduleKey, color = "#58cc02", className = "" }) {
  const [open, setOpen] = useState(false);
  const guide = useMemo(() => getModuleGuide(moduleKey), [moduleKey]);

  if (!guide) return null;

  return (
    <>
      <button
        type="button"
        className={`module-guide-launch ${className}`.trim()}
        onClick={() => setOpen(true)}
        style={{
          "--module-guide-color": color,
          "--module-guide-shadow": `color-mix(in srgb, ${color} 72%, #000 28%)`,
        }}
      >
        <BookOpen size={18} />
        GUIA
      </button>

      {open ? (
        <div className="module-guide-overlay" role="dialog" aria-modal="true" aria-label={guide.title}>
          <div className="module-guide-panel" style={{ "--module-guide-color": color }}>
            <div className="module-guide-panel-head">
              <div>
                <div className="module-guide-kicker">GUIA DO MODULO</div>
                <h2>{guide.title}</h2>
                <p>{guide.subtitle}</p>
              </div>
              <button type="button" className="module-guide-close" onClick={() => setOpen(false)} aria-label="Fechar guia">
                <X size={18} />
              </button>
            </div>

            <div className="module-guide-sections">
              {guide.sections.map((section) => (
                <section key={section.heading} className="module-guide-section">
                  <h3>{section.heading}</h3>
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div className="module-guide-footer">
              <button type="button" className="module-guide-cta" onClick={() => setOpen(false)}>
                Fechar guia
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
