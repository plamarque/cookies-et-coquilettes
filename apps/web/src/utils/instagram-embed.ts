const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com", "instagr.am"]);
const INSTAGRAM_PATH_KINDS = new Set(["p", "reel", "reels", "tv"]);

export function buildInstagramEmbedUrl(rawUrl?: string): string | undefined {
  if (!rawUrl?.trim()) {
    return undefined;
  }
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    if (!INSTAGRAM_HOSTS.has(host)) {
      return undefined;
    }
    const [kindRaw, shortcodeRaw] = parsed.pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 2);
    const kind = kindRaw?.toLowerCase();
    const shortcode = shortcodeRaw?.trim();
    if (!kind || !shortcode || !INSTAGRAM_PATH_KINDS.has(kind)) {
      return undefined;
    }
    return `https://www.instagram.com/${kind}/${shortcode}/embed`;
  } catch {
    return undefined;
  }
}
