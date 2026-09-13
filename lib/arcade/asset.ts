/** Resolve public asset path (GitHub Pages uses /VIPER base). */
export function arcadeAsset(path: string) {
  if (typeof window === "undefined") return path;
  const prefix = window.location.pathname.startsWith("/VIPER") ? "/VIPER" : "";
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

export function arcadeBasePath() {
  if (typeof window === "undefined") return "";
  return window.location.pathname.startsWith("/VIPER") ? "/VIPER" : "";
}
