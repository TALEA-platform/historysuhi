import { RichTextInline } from "../ui/RichText.jsx";
import { useI18n } from "../../i18n/useI18n.js";
import {
  getFormattedRasterValue,
  getRasterValueDetail,
  getRasterValueLabel,
} from "../../utils/raster.js";

// Hover tooltip rendered above the raster map. Hidden when the user is in
// "navigate" interaction mode (we only follow the cursor while inspecting).
// The tooltip is read-only: deeper actions like Street View / Google Earth
// links live on the pinned inspection card so the user has to commit a click
// before we surface them.

export function MapTooltip({
  interactionMode,
  showNumericValues,
  layer,
  hoverInfo,
}) {
  const { language } = useI18n();
  if (interactionMode !== "inspect" || !hoverInfo) return null;

  const formattedValue = hoverInfo ? getFormattedRasterValue(layer, hoverInfo.value, language) : null;
  const label = getRasterValueLabel(layer, hoverInfo?.value, language);
  const detail = getRasterValueDetail(layer, hoverInfo?.value, language);
  const copy = language === "en"
    ? { here: "Here", mapValue: "Map value", clickHint: "Click for more details" }
    : { here: "Qui", mapValue: "Valore della mappa", clickHint: "Clicca per maggiori dettagli" };

  return (
    <div className="map-tooltip">
      <span>{copy.here}</span>
      <strong>{label}</strong>
      <small><RichTextInline text={detail} /></small>
      {showNumericValues && formattedValue && <em>{copy.mapValue}: {formattedValue}</em>}
      <small className="tooltip-hint">{copy.clickHint}</small>
    </div>
  );
}
