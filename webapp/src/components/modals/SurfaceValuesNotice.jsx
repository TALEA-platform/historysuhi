import { useEffect, useRef, useState } from "react";
import { Thermometer, X } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { RichText } from "../ui/RichText.jsx";

const STORAGE_KEY = "talea:surface-values-notice-dismissed";

// Popup shown the first time a user activates the "Valori" toggle in View 1.
// The LST/z-score numbers are surface-derived and can be much hotter than the air
// temperature citizens are used to — this notice calls that out explicitly.
// Dismissing writes the localStorage flag so the popup only appears once.

export function SurfaceValuesNotice() {
  const { language } = useI18n();
  const showNumericValues = useAppStore((state) => state.showNumericValues);
  const [open, setOpen] = useState(false);
  const previousValueRef = useRef(showNumericValues);

  useEffect(() => {
    const wasOn = previousValueRef.current;
    previousValueRef.current = showNumericValues;
    if (!showNumericValues || wasOn) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    setOpen(true);
  }, [showNumericValues]);

  if (!open) return null;

  const copy = language === "en"
    ? {
      kicker: "How to read the values",
      title: "Before you read the values",
      close: "Close",
      body: [
        "The numbers on the map are **not air temperature** as measured by weather stations or shown in forecasts.",
        "Depending on the layer they may be **surface temperatures** (roofs, roads, paved areas, vegetation), temperature **differences** in °C, or **unitless indices** — for example the amount of vegetation, how reflective the surfaces are, or overall heat exposure. The 'How to read it' panel next to each map explains what each number means.",
        "Example: a sunlit road can easily be 10-20 °C hotter than the air you breathe. Use these values to compare places and years, not as the temperature you would feel outdoors.",
      ],
      acknowledge: "Got it",
    }
    : {
      kicker: "Come leggere i valori",
      title: "Prima di leggere i valori",
      close: "Chiudi",
      body: [
        "I numeri sulla mappa **non sono la temperatura dell'aria** delle stazioni meteo o delle previsioni del tempo.",
        "A seconda del layer possono essere **temperature di superficie** (tetti, strade, piazzali, vegetazione), **differenze** in °C o **indici senza unità**: per esempio la quantità di verde, quanto le superfici riflettono la luce, o l'esposizione complessiva al caldo. Il pannello 'Come leggerla' accanto a ogni mappa spiega cosa significa ogni numero.",
        "Esempio: una strada al sole può essere anche 10-20 °C più calda dell'aria che respiri. Usa questi valori per confrontare zone e anni, non come la temperatura che percepisci all'aperto.",
      ],
      acknowledge: "Ho capito",
    };

  const close = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="surface-values-notice-title">
      <div className="modal modal-notice">
        <button className="close-button" type="button" onClick={close} aria-label={copy.close}>
          <X size={19} />
        </button>
        <span className="section-kicker">
          <Thermometer size={14} />
          {copy.kicker}
        </span>
        <h2 id="surface-values-notice-title">{copy.title}</h2>
        {copy.body.map((paragraph) => (
          <RichText key={paragraph} as="p" className="notice-body" text={paragraph} />
        ))}
        <div className="notice-actions">
          <button className="primary-action" type="button" onClick={close}>
            {copy.acknowledge}
          </button>
        </div>
      </div>
    </div>
  );
}
