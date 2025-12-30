import { test, expect } from "@playwright/test";

test.describe("Trade landing deep-links to generator", () => {
  test("bathroom trade CTA preselects generator trade", async ({ page }) => {
    // Ensure a restored draft can't override the query-param selection.
    await page.goto("/generator");
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("scopegen_proposal_draft")) localStorage.removeItem(key);
      });
    });

    await page.goto("/trades/bathroom");
    await expect(page.getByTestId("trade-cta")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("trade-cta").click();

    await expect(page).toHaveURL(/\/generator\?trade=bathroom/);
    await page.waitForLoadState("networkidle");

    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await expect(tradeSelect).toContainText("Bathroom Remodel", { timeout: 10000 });
  });

  test("roofing trade CTA preselects generator trade", async ({ page }) => {
    await page.goto("/generator");
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("scopegen_proposal_draft")) localStorage.removeItem(key);
      });
    });

    await page.goto("/trades/roofing");
    await expect(page.getByTestId("trade-cta")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("trade-cta").click();

    await expect(page).toHaveURL(/\/generator\?trade=roofing/);
    await page.waitForLoadState("networkidle");

    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await expect(tradeSelect).toContainText("Roofing", { timeout: 10000 });
  });
});

