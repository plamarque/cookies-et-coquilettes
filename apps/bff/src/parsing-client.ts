import type { IngredientLine, ImportType, ParsedRecipeDraft } from "./types.js";

export interface ParseRecipeInput {
  sourceType: ImportType;
  text?: string;
  url?: string;
  screenshotBase64?: string;
  shareTitle?: string;
}

function fallbackDraft(title: string, sourceType: ImportType, url?: string): ParsedRecipeDraft {
  const ingredients: IngredientLine[] = [];
  return {
    title,
    category: "SALE",
    ingredients,
    steps: [],
    source: {
      type: sourceType,
      url,
      capturedAt: new Date().toISOString()
    }
  };
}

export async function parseRecipeWithCloud(
  input: ParseRecipeInput
): Promise<ParsedRecipeDraft> {
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  const title = input.shareTitle || "Recette importée";

  // Placeholder: branch kept explicit so the BFF can be deployed now and
  // switched to real OpenAI parsing without changing API contracts.
  if (!hasOpenAiKey) {
    return fallbackDraft(title, input.sourceType, input.url);
  }

  return fallbackDraft(title, input.sourceType, input.url);
}
