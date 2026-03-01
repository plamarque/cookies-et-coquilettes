import Dexie, { type Table } from "dexie";
import type { IngredientImage, Recipe, RecipeImage } from "@cookies-et-coquilettes/domain";

export class RecipesDatabase extends Dexie {
  recipes!: Table<Recipe, string>;
  images!: Table<RecipeImage & { blob: Blob }, string>;
  ingredientImages!: Table<IngredientImage & { blob: Blob }, string>;

  constructor() {
    super("cookies-et-coquilettes");
    this.version(2).stores({
      recipes: "id, category, favorite, updatedAt",
      images: "id, createdAt",
      ingredientImages: "id, createdAt"
    });
  }
}

export const db = new RecipesDatabase();
