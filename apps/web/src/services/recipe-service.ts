import type {
  Recipe,
  RecipeFilters,
  RecipeService
} from "@cookies-et-coquilettes/domain";
import { db } from "../storage/db";

function bySearch(recipe: Recipe, search?: string): boolean {
  if (!search) {
    return true;
  }

  const normalized = search.toLowerCase();
  return (
    recipe.title.toLowerCase().includes(normalized) ||
    recipe.ingredients.some((ingredient) =>
      ingredient.label.toLowerCase().includes(normalized)
    )
  );
}

function smartRound(quantity: number, unit?: string): number {
  const normalizedUnit = unit?.toLowerCase() ?? "";
  const isIntegerUnit =
    normalizedUnit.includes("oeuf") ||
    normalizedUnit.includes("œuf") ||
    normalizedUnit.includes("pièce") ||
    normalizedUnit.includes("piece") ||
    normalizedUnit.includes("unité") ||
    normalizedUnit.includes("unite");

  if (isIntegerUnit) {
    return Math.max(1, Math.round(quantity));
  }

  if (quantity >= 100) {
    return Math.round(quantity);
  }

  return Math.round(quantity * 10) / 10;
}

class DexieRecipeService implements RecipeService {
  async createRecipe(recipe: Recipe): Promise<void> {
    await db.recipes.put(recipe);
  }

  async updateRecipe(recipeId: string, patch: Partial<Recipe>): Promise<void> {
    const current = await db.recipes.get(recipeId);
    if (!current) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    await db.recipes.put({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    });
  }

  async toggleFavorite(recipeId: string, favorite?: boolean): Promise<void> {
    const current = await db.recipes.get(recipeId);
    if (!current) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    await db.recipes.put({
      ...current,
      favorite: favorite ?? !current.favorite,
      updatedAt: new Date().toISOString()
    });
  }

  async listRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
    const all = await db.recipes.toArray();
    return all
      .filter((recipe) =>
        filters?.category ? recipe.category === filters.category : true
      )
      .filter((recipe) =>
        filters?.favorite !== undefined ? recipe.favorite === filters.favorite : true
      )
      .filter((recipe) => bySearch(recipe, filters?.search))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async scaleRecipe(recipeId: string, servings: number): Promise<Recipe> {
    if (servings <= 0) {
      throw new Error("servings must be > 0");
    }

    const current = await db.recipes.get(recipeId);
    if (!current) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    const referenceServings = current.servingsCurrent ?? current.servingsBase;
    if (!referenceServings || referenceServings <= 0) {
      throw new Error("Recipe has no valid servings reference");
    }

    const coefficient = servings / referenceServings;

    const updated: Recipe = {
      ...current,
      servingsCurrent: servings,
      ingredients: current.ingredients.map((ingredient) => {
        if (!ingredient.isScalable || ingredient.quantity === undefined) {
          return ingredient;
        }

        return {
          ...ingredient,
          quantity: smartRound(ingredient.quantity * coefficient, ingredient.unit)
        };
      }),
      updatedAt: new Date().toISOString()
    };

    await db.recipes.put(updated);
    return updated;
  }
}

export const dexieRecipeService = new DexieRecipeService();
