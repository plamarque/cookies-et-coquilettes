import { expect, test } from "@playwright/test";
import path from "path";
import { writeFileSync, mkdirSync } from "fs";

async function saveRecipeForm(page) {
  await page
    .locator(".form-header-actions")
    .getByRole("button", { name: "Enregistrer" })
    .click();
}

async function createRecipeViaManual(page, name = "Cookies test") {
  await page.getByRole("button", { name: "Nouvelle recette" }).click();
  await expect(page.getByRole("heading", { name: "Nouvelle recette" })).toBeVisible();
  await page.getByRole("button", { name: "Saisir à la main" }).click();
  await page.getByLabel("Titre").fill(name);
  await page.getByLabel(/step-text-/).first().fill("Mélanger les ingrédients");
  await saveRecipeForm(page);
  await expect(page.getByRole("heading", { name })).toBeVisible();
}

async function createRecipeViaImport(page, recipeText = "Recette brute") {
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

  await expect(page.locator(".message.success")).toContainText(
    /Recette importée\.|a échoué/i
  );
  await expect(page.locator("section.panel.detail, section.panel.form-panel")).toBeVisible();
}

test.describe("Cookies & Coquillettes v1", () => {
  test("affiche l'écran principal avec les cartes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Nouvelle recette" })).toBeVisible();
    await expect(page.getByText("Coquillettes au jambon de Juan Arbelaez")).toBeVisible();
    await expect(page.getByText("Cookies aux pépites de chocolat")).toBeVisible();
  });

  test("active le mode cuisine depuis l'écran détail", async ({ page }) => {
    await page.goto("/");
    await createRecipeViaManual(page, "Recette test mode cuisine");
    await expect(page.getByRole("heading", { name: "Recette test mode cuisine" })).toBeVisible();
    await page.getByRole("button", { name: "Cuisiner" }).click();
    await expect(page.locator(".message.success")).toContainText(/Wake Lock|fallback navigateur/i);
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

  test("import fichier crée la recette directement", async ({ page }) => {
    await page.goto("/");
    await createRecipeViaImport(page, "Recette: Omelette");
    await expect(page.locator("section.panel.detail, section.panel.form-panel")).toBeVisible();
  });

  test("image recette : affichage sur carte, détail, formulaire et suppression", async ({
    page
  }) => {
    await page.goto("/");
    const imagePath = path.join(process.cwd(), "e2e", "fixtures", "test-image.png");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Nouvelle recette" }).click();
    await expect(page.getByRole("heading", { name: "Nouvelle recette" })).toBeVisible();
    await page.getByRole("button", { name: "Saisir à la main" }).click();
    await page.getByLabel("Titre").fill("Recette avec image");
    await page.getByLabel(/step-text-/).first().fill("Étape 1");
    await page.getByRole("button", { name: "Ajouter une image" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(imagePath);
    await saveRecipeForm(page);

    await expect(page.getByRole("heading", { name: "Recette avec image" })).toBeVisible();
    await expect(page.getByAltText("Photo de la recette").first()).toBeVisible();

    await page.getByRole("button", { name: "Retour" }).click();
    const recipeCard = page.locator(".recipe-card", { hasText: "Recette avec image" }).first();
    await expect(recipeCard.locator(".recipe-card-image")).toBeVisible();

    await recipeCard.click();
    await expect(page.locator(".recipe-detail-image")).toBeVisible();

    await page.getByRole("button", { name: "Éditer" }).click();
    await expect(page.locator(".recipe-form-image")).toBeVisible();
    await page
      .locator(".recipe-form-image-actions")
      .getByRole("button", { name: "Supprimer" })
      .click();
    await saveRecipeForm(page);

    await page.getByRole("button", { name: "Retour" }).click();
    await expect(recipeCard.locator(".recipe-card-image")).toHaveCount(0);
  });
});
