import OpenAI from "openai";

export interface GenerateRecipeImageInput {
  title: string;
  ingredients: Array<{ label: string }>;
  steps: Array<{ text: string }>;
}

export interface GenerateIngredientImageInput {
  label: string;
}

/**
 * Génère une image de recette via DALL-E 3.
 * Style : flat lay, photo de plat type Instagram, élégant, appétissant.
 */
export async function generateRecipeImage(
  input: GenerateRecipeImageInput
): Promise<string | undefined> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  const ingredientsText = input.ingredients
    .map((i) => i.label)
    .filter(Boolean)
    .slice(0, 10)
    .join(", ");

  const prompt = `Professional flat lay food photography, Instagram-style recipe photo. The dish: "${input.title}". Main ingredients visible: ${ingredientsText || "various"}. Style: elegant, appetizing, on a clean white or neutral background, top-down view, natural lighting, high-end food blog quality. No text in the image.`;

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural",
      response_format: "url"
    });

    const url = response.data?.[0]?.url;
    return typeof url === "string" ? url : undefined;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Recipe image generation failed", err);
    return undefined;
  }
}

/**
 * Génère une image d'ingrédient isolé (style photo produit, gros plan, fond blanc, sans mise en scène ni ombres).
 */
export async function generateIngredientImage(
  input: GenerateIngredientImageInput
): Promise<string | undefined> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  const label = input.label.trim();
  if (!label) {
    return undefined;
  }

  const prompt = `Product photography style, close-up of a single cooking ingredient: "${label}". Ingredient as sole main subject, centered, well visible. Plain white background, no staging, no background elements, no shadows, no shadow effects. Crisp details, high contrast edges for small icon readability. No text, no labels, no hands, no packaging brand.`;

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural",
      response_format: "url"
    });

    const url = response.data?.[0]?.url;
    return typeof url === "string" ? url : undefined;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Ingredient image generation failed", err);
    return undefined;
  }
}
