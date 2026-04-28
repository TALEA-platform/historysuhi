// URL builders for opening a map coordinate in Google's external viewers.
// Kept in one place so MapTooltip and MapPinnedInspection stay consistent.

export function buildStreetViewUrl(lat, lng) {
  // The `?api=1` form is the stable deep-link shape recommended by Google for
  // launching Street View at a coordinate. Zoom/heading/pitch default to Street
  // View's own automatic framing.
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

export function buildGoogleEarthUrl(lat, lng) {
  // Google Earth web deep-link. Parameters: @lat,lng,altitude(a),distance(a?),
  // heading(h),tilt(t),roll(r). Using a modest altitude/distance keeps the
  // initial framing usable at street scale.
  return `https://earth.google.com/web/@${lat},${lng},100a,400d,35y,0h,0t,0r/`;
}
