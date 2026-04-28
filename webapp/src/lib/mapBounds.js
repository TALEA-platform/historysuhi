export const BOLOGNA_CITY_BOUNDS = [
  [11.22965538811709, 44.42111295594283],
  [11.43371439412737, 44.55620539026697],
];

export function expandBounds(bounds, { xMultiplier = 1, yMultiplier = xMultiplier } = {}) {
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const halfWidth = ((maxLng - minLng) * xMultiplier) / 2;
  const halfHeight = ((maxLat - minLat) * yMultiplier) / 2;

  return [
    [centerLng - halfWidth, centerLat - halfHeight],
    [centerLng + halfWidth, centerLat + halfHeight],
  ];
}

export const BOLOGNA_MAX_PAN_BOUNDS = expandBounds(BOLOGNA_CITY_BOUNDS, {
  xMultiplier: 4.5,
  yMultiplier: 3.75,
});