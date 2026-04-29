function normalizeBasePath(pathname) {
  if (!pathname) return "/";
  if (pathname.endsWith("/")) return pathname;
  const lastSlash = pathname.lastIndexOf("/");
  return lastSlash >= 0 ? pathname.slice(0, lastSlash + 1) : "/";
}

function getRuntimeBasePath() {
  if (typeof window === "undefined") return "/";
  if (import.meta.env?.DEV) return normalizeBasePath(import.meta.env?.BASE_URL || "/");
  const pathname = window.location.pathname || "/";
  const legacyViewMatch = pathname.match(/^(.*?\/)view\/v[1-5]\/?$/);
  if (legacyViewMatch) return legacyViewMatch[1] || "/";
  return normalizeBasePath(pathname);
}

export function getAppBasePath() {
  return getRuntimeBasePath();
}

export function appUrl(path) {
  const relativePath = String(path || "").replace(/^\/+/, "");
  return `${getAppBasePath()}${relativePath}`;
}

export function buildAppHref(searchParams) {
  const query = searchParams?.toString?.() || "";
  const basePath = getAppBasePath();
  return query ? `${basePath}?${query}` : basePath;
}
