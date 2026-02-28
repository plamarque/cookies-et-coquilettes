import { db } from "../storage/db";
import { dexieRecipeService, storeImageFromUrl } from "../services/recipe-service";
import { getInitialRecipes } from "./initial-recipes";

export async function seedIfEmpty(): Promise<void> {
  const count = await db.recipes.count();
  if (count > 0) return;

  const recipes = getInitialRecipes();

  for (let i = 0; i < recipes.length; i++) {
    let recipe = recipes[i];

    if (recipe.id === "seed-cookies-001") {
      const imageUrl = `${window.location.origin}${import.meta.env.BASE_URL}seed/cookie-recipe.png`;
      const imageId = await storeImageFromUrl(imageUrl);
      if (imageId) {
        recipe = { ...recipe, imageId };
      }
    }

    await dexieRecipeService.createRecipe(recipe);
  }
}
