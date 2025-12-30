import { test, expect } from "@playwright/test";

test.describe("Trade landing deep-links to generator", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test so existing drafts don't interfere
    // with tests that rely on query-param trade selection.
    await page.goto("/generator");
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("scopegen_proposal_draft")) {
          localStorage.removeItem(key);
        }
      });
    });
  });

  test("bathroom trade CTA preselects generator trade", async ({ page }) => {
    await page.goto("/trades/bathroom");
    await expect(page.getByTestId("trade-cta")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("trade-cta").click();

    await expect(page).toHaveURL(/\/generator\?trade=bathroom/);
    await page.waitForLoadState("networkidle");

    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await expect(tradeSelect).toContainText("Bathroom Remodel", { timeout: 10000 });
  });

  test("roofing trade CTA preselects generator trade", async ({ page }) => {
    await page.goto("/trades/roofing");
    await expect(page.getByTestId("trade-cta")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("trade-cta").click();

    await expect(page).toHaveURL(/\/generator\?trade=roofing/);
    await page.waitForLoadState("networkidle");

    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await expect(tradeSelect).toContainText("Roofing", { timeout: 10000 });
  });

  test("restored draft takes precedence over query parameter", async ({ page }) => {
    // Create a draft with a specific trade (bathroom)
    await page.goto("/generator");
    await page.waitForLoadState("networkidle");

    // Select bathroom trade and save as draft
    const tradeButton = page.locator('[data-testid="select-trade-0"]').first();
    await tradeButton.click();
    await page.getByRole("option", { name: /bathroom/i }).click();

    // Wait for draft to be saved to localStorage
    await page.waitForFunction(() => {
      const keys = Object.keys(localStorage);
      return keys.some((key) => key.startsWith("scopegen_proposal_draft"));
    });

    // Navigate with a different trade query parameter (roofing)
    await page.goto("/generator?trade=roofing");
    await page.waitForLoadState("networkidle");

    // Verify the restored draft (bathroom) takes precedence over query param (roofing)
    const tradeSelect = page.locator('[data-testid="select-trade-0"]');
    await expect(tradeSelect).toContainText("Bathroom Remodel", { timeout: 10000 });
    await expect(tradeSelect).not.toContainText("Roofing");
  });
});

