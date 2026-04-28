import { ChevronRight, Info } from "lucide-react";
import { useAppStore } from "../../store/appStore.js";
import { useI18n } from "../../i18n/useI18n.js";
import { PanelCard } from "../ui/PanelCard.jsx";
import { RichText, RichTextInline } from "../ui/RichText.jsx";

// "Come leggerla" reading panel rendered next to each map.
// Pulls almost all of its content from the layer config in data/layers.js, so adding
// or tweaking copy never requires touching this component.
//
// `followUps` is the optional list of cross-view jumps; `stateKey` lets each follow-up
// declare which slice of the store it needs to update on click.

export function InfoPanel({ id, layer }) {
  const { language } = useI18n();
  const setState = useAppStore((state) => state.setState);
  const showNumericValues = useAppStore((state) => state.showNumericValues);
  const hasAdvancedDetails = Boolean(
    layer.details?.length || layer.moreInfo?.length || layer.sourceNote || layer.method,
  );
  const copy = language === "en"
    ? {
      title: "How to read it",
      numericValues: "Numeric values",
      learnMore: "Learn more",
      methodology: "Method and limits",
    }
    : {
      title: "Come leggerla",
      numericValues: "Valori numerici",
      learnMore: "Approfondisci",
      methodology: "Metodo e limiti",
    };

  return (
    <PanelCard id={id} className="info-target" title={copy.title} icon={<Info size={16} />}>
      <div className="info-copy">
        <h3>{layer.title}</h3>
        <RichText as="p" text={layer.description} />
        <RichText as="p" text={layer.explanation} />
        {showNumericValues && layer.valueInfo && (
          <div className="numeric-value-note">
            <span>{copy.numericValues}</span>
            <RichText as="p" text={layer.valueInfo} />
          </div>
        )}
        {hasAdvancedDetails && (
          <details className="explain-more">
            <summary>{copy.learnMore}</summary>
            {layer.details && (
              <ul className="reader-notes">
                {layer.details.map((detail) => (
                  <li key={detail}><RichTextInline text={detail} /></li>
                ))}
              </ul>
            )}
            {layer.moreInfo?.map((item) => (
              <RichText key={item} as="p" text={item} />
            ))}
            {layer.sourceNote && <p className="method-note">{layer.sourceNote}</p>}
            {layer.method && <p className="method-note">{layer.method}</p>}
            {layer.followUps && (
              <div className="follow-up-actions">
                {layer.followUps.map((item) => (
                  <button
                    key={`${item.view}-${item.layer}-${item.label}`}
                    className="inline-action"
                    type="button"
                    onClick={() => setState({ currentView: item.view, [item.stateKey]: item.layer })}
                  >
                    {item.label} <ChevronRight size={15} />
                  </button>
                ))}
              </div>
            )}
          </details>
        )}
        {!hasAdvancedDetails && layer.followUps && (
          <div className="follow-up-actions">
            {layer.followUps.map((item) => (
              <button
                key={`${item.view}-${item.layer}-${item.label}`}
                className="inline-action"
                type="button"
                onClick={() => setState({ currentView: item.view, [item.stateKey]: item.layer })}
              >
                {item.label} <ChevronRight size={15} />
              </button>
            ))}
          </div>
        )}
        <button className="inline-action" type="button" onClick={() => setState({ methodologyOpen: true })}>
          {copy.methodology} <ChevronRight size={15} />
        </button>
      </div>
    </PanelCard>
  );
}
