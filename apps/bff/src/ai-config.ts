/**
 * Configuration centralisée des modèles IA.
 * Permet un contrôle complet des coûts via variables d'environnement.
 */

export type ImageUseCase = "recipe" | "ingredient" | "cooking_step";
export type ChatUseCase = "parse" | "step_timer" | "reorder";

const DEFAULTS = {
  image: {
    recipe: { model: "gpt-image-1.5", quality: "low" },
    ingredient: { model: "gpt-image-1-mini", quality: "low" },
    cooking_step: { model: "gpt-image-1-mini", quality: "low" }
  } as Record<ImageUseCase, { model: string; quality: string }>,
  chat: "gpt-4o-mini"
};

function getEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

const IMAGE_MODEL_KEYS: Record<ImageUseCase, string> = {
  recipe: "AI_IMAGE_MODEL_RECIPE",
  ingredient: "AI_IMAGE_MODEL_INGREDIENT",
  cooking_step: "AI_IMAGE_MODEL_COOKING_STEP"
};

export function getImageModel(useCase: ImageUseCase): string {
  return getEnv(IMAGE_MODEL_KEYS[useCase]) ?? DEFAULTS.image[useCase].model;
}

const IMAGE_QUALITY_KEYS: Record<ImageUseCase, string> = {
  recipe: "AI_IMAGE_QUALITY_RECIPE",
  ingredient: "AI_IMAGE_QUALITY_INGREDIENT",
  cooking_step: "AI_IMAGE_QUALITY_COOKING_STEP"
};

export function getImageQuality(useCase: ImageUseCase): string {
  return getEnv(IMAGE_QUALITY_KEYS[useCase]) ?? DEFAULTS.image[useCase].quality;
}

export function getChatModel(useCase: ChatUseCase): string {
  const overrideKey: Record<ChatUseCase, string> = {
    parse: "AI_CHAT_MODEL_PARSE",
    step_timer: "AI_CHAT_MODEL_STEP_TIMER",
    reorder: "AI_CHAT_MODEL_REORDER"
  };
  return getEnv(overrideKey[useCase]) ?? getEnv("AI_CHAT_MODEL") ?? DEFAULTS.chat;
}
