import type {
  InstructionStep,
  ParsedInstructionStep,
  StepMedium
} from "@cookies-et-coquilettes/domain";
import type { FormStepMedium } from "../utils/step-media";
import { isAllowedVideoUrl } from "../utils/step-media";
import { dexieRecipeService, storeImageFromUrl } from "./recipe-service";

export async function resolveFormStepMediaForSave(
  media: FormStepMedium[] | undefined
): Promise<StepMedium[] | undefined> {
  if (!media?.length) return undefined;
  const out: StepMedium[] = [];
  for (const m of media) {
    if (m.type === "video") {
      const u = m.url.trim();
      if (isAllowedVideoUrl(u)) out.push({ type: "video", url: u });
      continue;
    }
    if (m.imageId) {
      out.push({ type: "image", imageId: m.imageId });
      continue;
    }
    if (m.imageUrl) {
      const imageId = await storeImageFromUrl(m.imageUrl);
      if (imageId) out.push({ type: "image", imageId });
    }
  }
  return out.length > 0 ? out : undefined;
}

async function resolveDraftMediaToPersisted(media: ParsedInstructionStep["media"]): Promise<
  StepMedium[] | undefined
> {
  if (!media?.length) return undefined;
  const resolved: StepMedium[] = [];
  for (const m of media) {
    if (m.type === "video") {
      const u = m.url.trim();
      if (u.startsWith("http://") || u.startsWith("https://")) {
        resolved.push({ type: "video", url: u });
      }
      continue;
    }
    const imageId = await storeImageFromUrl(m.imageUrl);
    if (imageId) resolved.push({ type: "image", imageId });
  }
  return resolved.length > 0 ? resolved : undefined;
}

/** Télécharge les images du draft et met à jour les étapes de la recette (vidéos = URLs brutes). */
export async function hydrateStepMediaFromDraft(
  recipeId: string,
  recipeSteps: InstructionStep[],
  draftSteps: ParsedInstructionStep[]
): Promise<void> {
  const draftById = new Map(draftSteps.map((s) => [s.id, s]));
  const nextSteps = await Promise.all(
    recipeSteps.map(async (step, index) => {
      const draft = draftById.get(step.id) ?? draftSteps[index];
      if (!draft?.media?.length) return step;
      const media = await resolveDraftMediaToPersisted(draft.media);
      if (!media?.length) return step;
      return { ...step, media };
    })
  );
  if (!nextSteps.some((s, i) => s !== recipeSteps[i])) return;
  await dexieRecipeService.updateRecipe(recipeId, { steps: nextSteps });
}
