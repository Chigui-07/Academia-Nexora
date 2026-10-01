export function getAppBaseUrl() {
  if (typeof window === "undefined") return "";

  const isGitHubPages = window.location.hostname.endsWith("github.io");
  return `${window.location.origin}${isGitHubPages ? "/Academia-Nexora" : ""}`;
}

export function goTo(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  window.location.assign(`${getAppBaseUrl()}${normalizedPath}`);
}

export function replaceWith(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  window.location.replace(`${getAppBaseUrl()}${normalizedPath}`);
}
