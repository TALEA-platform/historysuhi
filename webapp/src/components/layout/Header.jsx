import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Info, Link as LinkIcon } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";

// Resolve the logo URL through Vite's import.meta.url so the asset hash is correct
// in dev and in the built bundle. The file lives outside src/ in webapp/docs/.
const logoUrl = new URL(
  "../../../docs/Copia di LOGO TALEA COLORI SFONDO BIANCO_CMYK.png",
  import.meta.url,
).href;

export function Header() {
  const { language, setLanguage } = useI18n();
  const setState = useAppStore((state) => state.setState);
  const [shareCopied, setShareCopied] = useState(false);
  const shareTimerRef = useRef(null);
  useEffect(() => () => {
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
  }, []);
  const copy = language === "en"
    ? {
      brandTitle: "Bologna Surface Temperature History",
      brandSubtitle: "Satellite data 2013–2026 · surface temperature",
      guide: "Guide",
      methodology: "Methodology",
      share: "Share",
      shareCopied: "Copied!",
      shareAriaLabel: "Copy link to this view",
      guideAriaLabel: "Open guide",
      methodologyAriaLabel: "Open methodology",
      languageAriaLabel: "Language",
    }
    : {
      brandTitle: "Temperature di Superficie di Bologna",
      brandSubtitle: "Dati satellitari 2013–2026 · superficie",
      guide: "Guida",
      methodology: "Metodologia",
      share: "Condividi",
      shareCopied: "Copiato!",
      shareAriaLabel: "Copia il link a questa sezione",
      guideAriaLabel: "Apri la guida",
      methodologyAriaLabel: "Apri la metodologia",
      languageAriaLabel: "Lingua",
    };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setShareCopied(true);
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
      shareTimerRef.current = setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt(copy.shareAriaLabel, url);
    }
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand-left">
          <img className="brand-logo" src={logoUrl} alt="Talea" />
          <div className="brand-text">
            <h1 className="brand-title">{copy.brandTitle}</h1>
            <p className="brand-subtitle">{copy.brandSubtitle}</p>
          </div>
        </div>
        <div className="header-actions">
        <div className="language-switch" role="group" aria-label={copy.languageAriaLabel}>
          <button
            className={language === "it" ? "active" : ""}
            type="button"
            aria-pressed={language === "it"}
            onClick={() => setLanguage("it")}
          >
            IT
          </button>
          <button
            className={language === "en" ? "active" : ""}
            type="button"
            aria-pressed={language === "en"}
            onClick={() => setLanguage("en")}
          >
            EN
          </button>
        </div>
        <button
          className="text-button"
          type="button"
          onClick={() => setState({ onboardingOpen: true })}
          aria-label={copy.guideAriaLabel}
          title={copy.guide}
        >
          <BookOpen size={16} />
          <span className="button-label">{copy.guide}</span>
        </button>
        <button
          className="text-button"
          type="button"
          onClick={() => setState({ methodologyOpen: true })}
          aria-label={copy.methodologyAriaLabel}
          title={copy.methodology}
        >
          <Info size={16} />
          <span className="button-label">{copy.methodology}</span>
        </button>
        <button
          className="text-button"
          type="button"
          onClick={handleShare}
          aria-label={copy.shareAriaLabel}
          title={shareCopied ? copy.shareCopied : copy.share}
        >
          {shareCopied ? <Check size={16} /> : <LinkIcon size={16} />}
          <span className="button-label">{shareCopied ? copy.shareCopied : copy.share}</span>
        </button>
        </div>
      </div>
    </header>
  );
}
