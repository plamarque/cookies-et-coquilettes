const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const SCENARIOS = [
  {
    id: "home-empty",
    setup: async (page) => {
      await page.goto("/");
      await page.waitForSelector("h1");
      await delay(400);
    }
  },
  {
    id: "cooking-mode",
    setup: async (page) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Activer mode cuisine" }).click();
      await delay(500);
    }
  }
];
