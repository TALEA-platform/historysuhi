// EU funding compliance footer.

import { useI18n } from "../../i18n/useI18n.js";

export function Footer() {
  const { language } = useI18n();
  const copy = language === "en"
    ? {
      projectLine: "Talea Project · Municipality of Bologna · European Urban Initiative",
      fundingLine: "Co-funded by the European Union",
      ctaText: "Learn more about the Talea project ↗",
    }
    : {
      projectLine: "Progetto Talea · Comune di Bologna · European Urban Initiative",
      fundingLine: "Cofinanziato dall'Unione europea",
      ctaText: "Scopri di più sul progetto Talea ↗",
    };
  return (
    <footer className="footer">
      <a
        className="footer-cta"
        href="https://talea.comune.bologna.it"
        target="_blank"
        rel="noopener noreferrer"
      >
        {copy.ctaText}
      </a>
      <span>{copy.projectLine}</span>
      <strong>{copy.fundingLine}</strong>
    </footer>
  );
}
