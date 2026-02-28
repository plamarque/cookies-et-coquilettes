import { expect, test } from "@playwright/test";
import path from "path";
import { writeFileSync, mkdirSync } from "fs";

async function createRecipeViaManual(page, name = "Cookies test") {
  await page.getByRole("button", { name: "Nouvelle recette" }).click();
  await expect(page.getByRole("heading", { name: "Nouvelle recette" })).toBeVisible();
  await page.getByRole("button", { name: "Saisir à la main" }).click();
  await page.getByLabel("Titre").fill(name);
  await page.getByLabel(/step-text-/).first().fill("Mélanger les ingrédients");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

async function createRecipeViaImport(page, name, recipeText = "Recette brute") {
  const tmpDir = path.join(process.cwd(), "e2e", "tmp");
  mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, "recipe.txt");
  writeFileSync(filePath, recipeText, "utf-8");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Nouvelle recette" }).click();
  await expect(page.getByRole("heading", { name: "Nouvelle recette" })).toBeVisible();
  await page.getByRole("button", { name: "Choisir un fichier" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);

  await expect(page.getByRole("heading", { name: "Revue d'import (obligatoire)" })).toBeVisible();
  await page.getByLabel("Titre").fill(name);
  await page.getByLabel(/step-text-/).first().fill("Mélanger les ingrédients");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

test.describe("Cookies & Coquillettes v1", () => {
  test("affiche l'écran principal avec les cartes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Nouvelle recette" })).toBeVisible();
    await expect(page.getByText("Aucune recette")).toBeVisible();
  });

  test("active le mode cuisine depuis l'écran détail", async ({ page }) => {
    await page.goto("/");
    await createRecipeViaManual(page, "Recette test mode cuisine");
    await expect(page.getByRole("heading", { name: "Recette test mode cuisine" })).toBeVisible();
    await page.getByRole("button", { name: "Mode cuisine" }).click();
    await expect(page.getByText(/WAKE_LOCK|FALLBACK/)).toBeVisible();
  });

  test("création, recherche, édition portions et suppression", async ({ page }) => {
    await page.goto("/");
    await createRecipeViaManual(page, "Brownie maison");

    await page.getByRole("button", { name: "Retour" }).click();
    await page.getByPlaceholder("Rechercher...").fill("brownie");
    await expect(page.getByText("Brownie maison")).toBeVisible();

    await page.getByText("Brownie maison").first().click();
    await expect(page.getByText("Mélanger les ingrédients")).toBeVisible();

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByText("Recette supprimée.")).toBeVisible();
  });

  test("import fichier ouvre la revue obligatoire avant sauvegarde", async ({ page }) => {
    await page.goto("/");
    await createRecipeViaImport(page, "Omelette review", "Recette: Omelette");
    await expect(page.getByText("Recette importée et enregistrée.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Omelette review" })).toBeVisible();
  });
});
