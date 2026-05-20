import { ExternalLink } from "lucide-react";
import { useI18n } from "../../i18n/useI18n.js";

const logoUrl = new URL(
  "../../../docs/Copia di LOGO TALEA COLORI SFONDO BIANCO_CMYK.png",
  import.meta.url,
).href;

export function Footer() {
  const { language } = useI18n();
  const linkAriaLabel = language === "en"
    ? "Open the TALEA website"
    : "Apri il sito TALEA";
  return (
    <footer className="footer">
      <div className="footer-inner">
        <img className="footer-logo" src={logoUrl} alt="TALEA" />
        <a
          className="footer-link"
          href="https://talea.comune.bologna.it/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={linkAriaLabel}
        >
          <ExternalLink size={14} aria-hidden="true" />
          talea.comune.bologna.it
        </a>
      </div>
    </footer>
  );
}
