import Dexie, { type Table } from "dexie";
import type { Recipe, RecipeImage } from "@cookies-et-coquilettes/domain";

export class RecipesDatabase extends Dexie {
  recipes!: Table<Recipe, string>;
  images!: Table<RecipeImage & { blob: Blob }, string>;

  constructor() {
    super("cookies-et-coquilettes");
    this.version(1).stores({
      recipes: "id, category, favorite, updatedAt",
      images: "id, createdAt"
    });
  }
}

export const db = new RecipesDatabase();
