import type { ShareImportPayload } from "@cookies-et-coquilettes/domain";

const SHARE_TITLE_PARAM = "share-title";
const SHARE_TEXT_PARAM = "share-text";
const SHARE_URL_PARAM = "share-url";

function normalizeValue(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function extractFirstHttpUrl(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const match = text.match(/https?:\/\/[^\s<>"')]+/i);
  return normalizeHttpUrl(match?.[0]);
}

export function readShareImportPayloadFromSearch(search: string): ShareImportPayload | null {
  const params = new URLSearchParams(search);
  const title = normalizeValue(params.get(SHARE_TITLE_PARAM));
  const text = normalizeValue(params.get(SHARE_TEXT_PARAM));
  const directUrl = normalizeValue(params.get(SHARE_URL_PARAM));
  const url = normalizeHttpUrl(directUrl) ?? extractFirstHttpUrl(text);

  if (!title && !text && !url) {
    return null;
  }

  return { title, text, url };
}

export function readShareImportPayloadFromWindow(): ShareImportPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  return readShareImportPayloadFromSearch(window.location.search);
}

export function clearShareImportParamsFromWindowLocation(): void {
  if (typeof window === "undefined") {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const hadShareParams =
    params.has(SHARE_TITLE_PARAM) ||
    params.has(SHARE_TEXT_PARAM) ||
    params.has(SHARE_URL_PARAM);

  if (!hadShareParams) {
    return;
  }

  params.delete(SHARE_TITLE_PARAM);
  params.delete(SHARE_TEXT_PARAM);
  params.delete(SHARE_URL_PARAM);

  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", nextUrl);
}
