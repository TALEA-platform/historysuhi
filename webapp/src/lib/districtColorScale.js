export const DISTRICT_HEAT_COLORS = {
  default: ["#fff5c0", "#feb24c", "#fd8d3c", "#e31a1c", "#b10026"],
  accessible: ["#f7fcf0", "#7bccc4", "#43a2ca", "#0868ac", "#00204d"],
};

function palette(colorblindMode) {
  return colorblindMode ? DISTRICT_HEAT_COLORS.accessible : DISTRICT_HEAT_COLORS.default;
}

export function districtHeatColor(value, min, max, colorblindMode = false) {
  const t = (value - min) / Math.max(0.0001, max - min);
  const index = t > 0.8 ? 4 : t > 0.6 ? 3 : t > 0.4 ? 2 : t > 0.2 ? 1 : 0;
  return palette(colorblindMode)[index];
}

export function hotspotPercentColor(value, colorblindMode = false) {
  const index = value <= 0 ? 0 : value <= 0.5 ? 1 : value <= 2 ? 2 : value <= 7 ? 3 : 4;
  return palette(colorblindMode)[index];
}
