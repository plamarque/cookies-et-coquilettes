import { expect, test } from "@playwright/test";

test.describe("Cookies & Coquillettes shell", () => {
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
});
