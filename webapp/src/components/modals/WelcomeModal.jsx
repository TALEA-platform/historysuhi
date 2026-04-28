import { ArrowRight, BookOpen, HelpCircle, X } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { RichText } from "../ui/RichText.jsx";

const STORAGE_KEY = "talea:onboarded";

// Lightweight first-load welcome message. Replaces the previous behaviour where the
// full Guide opened automatically. Naming model the rest of the app follows:
//   Welcome  → this popup (first-time orientation)
//   Support  → contextual "?" overlay (per-view callouts)
//   Guide    → OnboardingModal opened from the Header (comprehensive walkthrough)
//   Methodology → sources, limits, definitions

export function WelcomeModal() {
  const { language } = useI18n();
  const setState = useAppStore((state) => state.setState);

  const dismiss = (followUp = {}) => {
    localStorage.setItem(STORAGE_KEY, "1");
    setState({ welcomeOpen: false, ...followUp });
  };

  const copy = language === "en"
    ? {
      kicker: "Welcome",
      title: "Bologna Surface Temperatures",
      lead:
        "An interactive map developed within the Talea project, showing how Bologna's **surfaces** heat up in summer (2013–2025) — roads, roofs, paved areas and vegetation, observed by satellite. Not the air people breathe, but a useful reading of where heat accumulates and why.",
      hint:
        "Press the **?** button at any time to see what each control on screen does. The full **Guide** and **Methodology** are always available in the top bar.",
      enter: "Enter the map",
      tryHelp: "Show me how things work",
      guideHint: "Open the full guide",
      close: "Close",
    }
    : {
      kicker: "Benvenuto",
      title: "Temperature Superficiali di Bologna",
      lead:
        "In questa webapp interattiva, sviluppata nell'ambito del progetto Talea, si osserva come si scaldano le **superfici** di Bologna in estate (2013–2025): strade, tetti, piazzali e vegetazione osservati dal satellite. Non è la temperatura dell'aria, ma una lettura utile di dove si accumula il caldo e perché.",
      hint:
        "Premi il pulsante **?** in qualsiasi momento per scoprire a cosa serve ogni controllo a schermo. La **Guida** completa e la **Metodologia** sono sempre disponibili nella barra in alto.",
      enter: "Entra nella mappa",
      tryHelp: "Mostrami come funziona",
      guideHint: "Apri la guida completa",
      close: "Chiudi",
    };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="modal modal-welcome">
        <button className="close-button" type="button" onClick={() => dismiss()} aria-label={copy.close}>
          <X size={19} />
        </button>
        <span className="section-kicker">{copy.kicker}</span>
        <h2 id="welcome-title">{copy.title}</h2>
        <RichText as="p" className="guide-lead" text={copy.lead} />
        <RichText as="p" className="welcome-hint" text={copy.hint} />
        <div className="welcome-actions">
          <button
            type="button"
            className="primary-action"
            onClick={() => dismiss()}
          >
            {copy.enter}
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            className="welcome-secondary"
            onClick={() => dismiss({ supportModeOpen: true })}
          >
            <HelpCircle size={16} />
            {copy.tryHelp}
          </button>
          <button
            type="button"
            className="welcome-tertiary"
            onClick={() => dismiss({ onboardingOpen: true })}
          >
            <BookOpen size={15} />
            {copy.guideHint}
          </button>
        </div>
      </div>
    </div>
  );
}
