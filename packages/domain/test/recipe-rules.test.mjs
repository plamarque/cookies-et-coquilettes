import test from "node:test";
import assert from "node:assert/strict";
import {
  assertRecipeValidForSave,
  isRecipeValidForSave,
  normalizeIngredient,
  scaleIngredientsFromBase
} from "../src/recipe-rules.js";

test("validation: reject empty title and empty content", () => {
  assert.equal(
    isRecipeValidForSave({
      title: " ",
      ingredients: [],
      steps: []
    }),
    false
  );

  assert.throws(
    () =>
      assertRecipeValidForSave({
        title: "Recette vide",
        ingredients: [],
        steps: []
      }),
    /at least one ingredient or one step/
  );
});

test("validation: accept ingredient-only or step-only recipe", () => {
  assert.equal(
    isRecipeValidForSave({
      title: "Pancakes",
      ingredients: [{ id: "i1", label: "Farine", isScalable: false }],
      steps: []
    }),
    true
  );

  assert.equal(
    isRecipeValidForSave({
      title: "Riz",
      ingredients: [],
      steps: [{ id: "s1", order: 1, text: "Cuire" }]
    }),
    true
  );
});

test("normalizeIngredient: set quantityBase for scalable ingredient", () => {
  const normalized = normalizeIngredient({
    id: "i1",
    label: "Farine",
    quantity: 250,
    unit: "g",
    isScalable: true
  });

  assert.equal(normalized.quantityBase, 250);
});

test("scaleIngredientsFromBase: scale from immutable base without drift", () => {
  const ingredients = [
    { id: "i1", label: "Farine", quantity: 250, quantityBase: 250, unit: "g", isScalable: true },
    { id: "i2", label: "Oeuf", quantity: 2, quantityBase: 2, unit: "oeuf", isScalable: true },
    { id: "i3", label: "Pincée de sel", isScalable: false }
  ];

  const forFour = scaleIngredientsFromBase(ingredients, 4, 2);
  assert.equal(forFour[0].quantity, 500);
  assert.equal(forFour[1].quantity, 4);
  assert.equal(forFour[2].quantity, undefined);

  const forThree = scaleIngredientsFromBase(ingredients, 3, 2);
  assert.equal(forThree[0].quantity, 375);
  assert.equal(forThree[1].quantity, 3);
});
