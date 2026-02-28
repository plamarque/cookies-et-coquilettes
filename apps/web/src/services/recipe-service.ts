import type {
  Recipe,
  RecipeFilters,
  RecipeService
} from "@cookies-et-coquilettes/domain";
import {
  assertRecipeValidForSave,
  normalizeRecipeForSave,
  scaleIngredientsFromBase
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

class DexieRecipeService implements RecipeService {
  async createRecipe(recipe: Recipe): Promise<void> {
    const normalized = normalizeRecipeForSave(recipe);
    assertRecipeValidForSave(normalized);
    await db.recipes.put(normalized);
  }

  async updateRecipe(recipeId: string, patch: Partial<Recipe>): Promise<void> {
    const current = await db.recipes.get(recipeId);
    if (!current) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    const updated = normalizeRecipeForSave({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    });
    assertRecipeValidForSave(updated);
    await db.recipes.put(updated);
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    const current = await db.recipes.get(recipeId);
    if (!current) {
      return;
    }

    await db.recipes.delete(recipeId);
    if (current.imageId) {
      await db.images.delete(current.imageId);
    }
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
      .sort((a, b) => {
        if (a.favorite !== b.favorite) {
          return a.favorite ? -1 : 1;
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }

  async scaleRecipe(recipeId: string, servings: number): Promise<Recipe> {
    if (servings <= 0) {
      throw new Error("servings must be > 0");
    }

    const current = await db.recipes.get(recipeId);
    if (!current) {
      throw new Error(`Recipe not found: ${recipeId}`);
    }

    const referenceServings = current.servingsBase;
    if (!referenceServings || referenceServings <= 0) {
      throw new Error("Recipe has no valid servings reference");
    }

    const updated: Recipe = {
      ...current,
      servingsCurrent: servings,
      ingredients: scaleIngredientsFromBase(
        current.ingredients,
        servings,
        referenceServings
      ),
      updatedAt: new Date().toISOString()
    };

    await db.recipes.put(updated);
    return updated;
  }
}

export const dexieRecipeService = new DexieRecipeService();
