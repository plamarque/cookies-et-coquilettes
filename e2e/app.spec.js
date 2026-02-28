import { expect, test } from "@playwright/test";

async function createRecipe(page, name = "Cookies test") {
  await page.getByLabel("Texte collé").fill("Recette brute");
  await page.getByRole("button", { name: "Importer depuis texte" }).click();
  await expect(page.getByRole("heading", { name: "Revue d'import (obligatoire)" })).toBeVisible();
  await page.getByLabel("Titre").fill(name);
  await page.getByLabel(/step-text-/).first().fill("Mélanger les ingrédients");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

test.describe("Cookies & Coquillettes v1", () => {
  test("affiche l'écran principal", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Cookies & Coquillettes" })
    ).toBeVisible();
    await expect(page.getByText("Aucune recette")).toBeVisible();
  });

  test("active le mode cuisine", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Activer mode cuisine" }).click();
    await expect(page.getByText(/WAKE_LOCK|FALLBACK/)).toBeVisible();
  });

  test("création, recherche, édition portions et suppression", async ({ page }) => {
    await page.goto("/");
    await createRecipe(page, "Brownie maison");

    await page.getByRole("button", { name: "Retour" }).click();
    await page.getByLabel("Recherche (titre + ingrédients)").fill("brownie");
    await expect(page.getByText("Brownie maison")).toBeVisible();

    await page.getByText("Brownie maison").first().click();
    await expect(page.getByText("Mélanger les ingrédients")).toBeVisible();

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByText("Recette supprimée.")).toBeVisible();
  });

  test("import texte ouvre la revue obligatoire avant sauvegarde", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Texte collé").fill("Recette: Omelette");
    await page.getByRole("button", { name: "Importer depuis texte" }).click();
    await expect(page.getByRole("heading", { name: "Revue d'import (obligatoire)" })).toBeVisible();
    await page.getByLabel("Titre").fill("Omelette review");
    await page.getByLabel(/step-text-/).first().fill("Battre les oeufs");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Recette importée et enregistrée.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Omelette review" })).toBeVisible();
  });
});
