import { ExternalLink, Globe, Navigation, X } from "lucide-react";
import { useI18n } from "../../i18n/useI18n.js";
import { RichText } from "../ui/RichText.jsx";
import {
  getFormattedRasterValue,
  getRasterValueContext,
  getRasterValueDetail,
  getRasterValueLabel,
} from "../../utils/raster.js";
import { buildGoogleEarthUrl, buildStreetViewUrl } from "../../utils/externalMapLinks.js";

// Persistent inspection card opened when the user clicks while in "inspect" mode.
// It reads the raster value at that point and stays visible until the user closes it.
// Also exposes Street View / Google Earth deep-links for the clicked coordinate.

export function MapPinnedInspection({ info, layer, showNumericValues, onClose }) {
  const { language } = useI18n();
  if (!info) return null;

  const formattedValue = getFormattedRasterValue(layer, info.value, language);
  const label = getRasterValueLabel(layer, info.value, language);
  const detail = getRasterValueDetail(layer, info.value, language);
  const context = getRasterValueContext(layer, info.value, language);
  const copy = language === "en"
    ? {
      close: "Close inspection",
      interpretation: "How to read this point",
      pointDetail: "Point details",
      value: "Value",
      streetView: "Street View",
      googleEarth: "Google Earth",
    }
    : {
      close: "Chiudi ispezione",
      interpretation: "Come leggere questo punto",
      pointDetail: "Dettaglio punto",
      value: "Valore",
      streetView: "Street View",
      googleEarth: "Google Earth",
    };

  const lngLat = info.lngLat;
  const depthNotes = [];
  const noteCandidates = [
    context,
    layer.valueInfo,
    layer.moreInfo?.[0],
  ].filter(Boolean);

  noteCandidates.forEach((note) => {
    if (note === detail || depthNotes.includes(note) || depthNotes.length >= 2) return;
    depthNotes.push(note);
  });

  return (
    <div className="map-inspection-card">
      <button className="inspection-close" type="button" onClick={onClose} aria-label={copy.close}>
        <X size={15} />
      </button>
      <span>{copy.pointDetail}</span>
      <h3>{label}</h3>
      <RichText as="p" text={detail} />
      {layer.inspectNote && <RichText as="p" text={layer.inspectNote} />}
      {showNumericValues && formattedValue && (
        <dl>
          <div>
            <dt>{copy.value}</dt>
            <dd>{formattedValue}</dd>
          </div>
        </dl>
      )}
      {depthNotes.length > 0 && (
        <section className="inspection-context" aria-label={copy.interpretation}>
          <strong className="inspection-context-title">{copy.interpretation}</strong>
          {depthNotes.map((note) => (
            <RichText key={note} as="p" text={note} />
          ))}
        </section>
      )}
      {lngLat && (
        <div className="inspect-external-actions">
          <a
            className="inspect-external-link"
            href={buildStreetViewUrl(lngLat.lat, lngLat.lng)}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={13} />
            {copy.streetView}
            <ExternalLink size={11} />
          </a>
          <a
            className="inspect-external-link"
            href={buildGoogleEarthUrl(lngLat.lat, lngLat.lng)}
            target="_blank"
            rel="noreferrer"
          >
            <Globe size={13} />
            {copy.googleEarth}
            <ExternalLink size={11} />
          </a>
        </div>
      )}
      <small>{layer.title}</small>
    </div>
  );
}
