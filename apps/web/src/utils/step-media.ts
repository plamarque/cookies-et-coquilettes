import type { Recipe, StepMedium, StepMediumDraft } from "@cookies-et-coquilettes/domain";
import { buildInstagramEmbedUrl } from "./instagram-embed";
import { buildYouTubeEmbedUrl } from "./youtube-embed";

export function collectStepImageIdsFromRecipe(recipe: Recipe): string[] {
  const ids: string[] = [];
  for (const step of recipe.steps) {
    for (const m of step.media ?? []) {
      if (m.type === "image") ids.push(m.imageId);
    }
  }
  return ids;
}

export function collectStepImageIdsFromSteps(steps: { media?: StepMedium[] }[]): string[] {
  const ids: string[] = [];
  for (const step of steps) {
    for (const m of step.media ?? []) {
      if (m.type === "image") ids.push(m.imageId);
    }
  }
  return ids;
}

export function isAllowedVideoUrl(raw: string): boolean {
  const u = raw.trim();
  return u.startsWith("http://") || u.startsWith("https://");
}

/** Fusionne brouillons d’images (URL) et médias persistés (imageId) pour le formulaire. */
export type FormStepMedium =
  | { type: "image"; imageId?: string; imageUrl?: string }
  | { type: "video"; url: string };

export function stepMediaToFormDrafts(media?: StepMedium[]): FormStepMedium[] {
  if (!media?.length) return [];
  return media.map((m) =>
    m.type === "video"
      ? { type: "video", url: m.url }
      : { type: "image", imageId: m.imageId }
  );
}

export function draftsFromParsedStepMedia(media?: StepMediumDraft[]): FormStepMedium[] {
  if (!media?.length) return [];
  return media.map((m) =>
    m.type === "video"
      ? { type: "video", url: m.url }
      : { type: "image", imageUrl: m.imageUrl }
  );
}

/** Médias déjà persistés ou vidéos (hors imageUrl en attente) pour validation / brouillon sync. */
export function syncFormMediaToRecipePartial(
  media: FormStepMedium[] | undefined
): StepMedium[] | undefined {
  if (!media?.length) return undefined;
  const out: StepMedium[] = [];
  for (const m of media) {
    if (m.type === "video" && isAllowedVideoUrl(m.url)) {
      out.push({ type: "video", url: m.url.trim() });
    }
    if (m.type === "image" && m.imageId) {
      out.push({ type: "image", imageId: m.imageId });
    }
  }
  return out.length > 0 ? out : undefined;
}

export function buildVimeoEmbedUrl(rawUrl: string): string | undefined {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    if (host !== "vimeo.com" && host !== "www.vimeo.com") return undefined;
    const m = parsed.pathname.match(/\/(?:video\/)?(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  } catch {
    return undefined;
  }
  return undefined;
}

/** URL d’iframe pour une vidéo d’étape (YouTube, Instagram, Vimeo). */
export function stepVideoEmbedSrc(url: string): string | undefined {
  return (
    buildYouTubeEmbedUrl(url) ??
    buildInstagramEmbedUrl(url) ??
    buildVimeoEmbedUrl(url)
  );
}
