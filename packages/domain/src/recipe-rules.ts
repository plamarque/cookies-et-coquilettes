import type { IngredientLine, Recipe } from "./recipe";

function roundQuantity(quantity: number, unit?: string): number {
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

export function normalizeIngredient(ingredient: IngredientLine): IngredientLine {
  if (!ingredient.isScalable) {
    return ingredient;
  }

  if (ingredient.quantityBase !== undefined) {
    return ingredient;
  }

  if (ingredient.quantity === undefined) {
    return ingredient;
  }

  return {
    ...ingredient,
    quantityBase: ingredient.quantity
  };
}

export function normalizeRecipeForSave(recipe: Recipe): Recipe {
  return {
    ...recipe,
    ingredients: recipe.ingredients.map(normalizeIngredient)
  };
}

export function isRecipeValidForSave(recipe: Pick<Recipe, "title" | "ingredients" | "steps">): boolean {
  const title = recipe.title.trim();
  if (!title) {
    return false;
  }

  return recipe.ingredients.length > 0 || recipe.steps.length > 0;
}

export function assertRecipeValidForSave(
  recipe: Pick<Recipe, "title" | "ingredients" | "steps">
): void {
  if (!recipe.title.trim()) {
    throw new Error("title is required");
  }

  if (recipe.ingredients.length === 0 && recipe.steps.length === 0) {
    throw new Error("recipe needs at least one ingredient or one step");
  }
}

export function scaleIngredientsFromBase(
  ingredients: IngredientLine[],
  servingsTarget: number,
  servingsBase: number
): IngredientLine[] {
  if (servingsTarget <= 0 || servingsBase <= 0) {
    throw new Error("servings must be > 0");
  }

  const coefficient = servingsTarget / servingsBase;

  return ingredients.map((ingredient) => {
    if (!ingredient.isScalable) {
      return ingredient;
    }

    const quantityBase = ingredient.quantityBase ?? ingredient.quantity;
    if (quantityBase === undefined) {
      return ingredient;
    }

    return {
      ...ingredient,
      quantityBase,
      quantity: roundQuantity(quantityBase * coefficient, ingredient.unit)
    };
  });
}
