import { test, expect } from "@playwright/test";

test.describe("ScopeScan Driveway flow", () => {
  test.beforeEach(async ({ page }) => {
    // Configure mobile API client to use dev auth mode (x-mobile-user-id header).
    // This assumes the test environment is running with MOBILE_API_AUTH=none.
    await page.addInitScript(() => {
      localStorage.setItem(
        "scopegen-mobile-web-config",
        JSON.stringify({
          baseUrl: window.location.origin,
          userId: "pw-driveway-user",
        })
      );
    });
  });

  test("Trade picker: shows Driveway (no 'Concrete') and driveway/walkway sub-selection", async ({ page }) => {
    await page.goto("/m/create");
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("Driveway")').first().click();

    // Sub-selection should appear and default to driveway slab
    await expect(page.locator('[data-testid="driveway-subselection"]')).toBeVisible();

    // Naming cleanup
    await expect(page.locator("body")).not.toContainText(/Concrete/i);
    await expect(page.locator("body")).toContainText(/Driveway/i);
  });

  test("Driveway: polygon SF, thickness affects CY, stamped implies Best", async ({ page }) => {
    await page.goto("/m/measure/demo?demo=1");
    await expect(page.locator('[data-testid="driveway-measure-page"]')).toBeVisible();

    await page.evaluate(() => {
      (window as any).__setDrivewayPolygonPoints([
        { lat: 30.2672, lng: -97.7431 },
        { lat: 30.2672, lng: -97.7430 },
        { lat: 30.2673, lng: -97.7430 },
        { lat: 30.2673, lng: -97.7431 },
      ]);
    });

    const drivewaySfText = await page.locator('[data-testid="driveway-sf"]').innerText();
    const drivewaySf = Number(drivewaySfText.replace(/[^0-9.]/g, ""));
    expect(drivewaySf).toBeGreaterThan(0);

    const cyBeforeText = await page.locator('[data-testid="concrete-cy"]').innerText();
    const cyBefore = Number(cyBeforeText.replace(/[^0-9.]/g, ""));

    await page.locator('[data-testid="thickness-5"]').click();
    const cyAfterText = await page.locator('[data-testid="concrete-cy"]').innerText();
    const cyAfter = Number(cyAfterText.replace(/[^0-9.]/g, ""));
    expect(cyAfter).not.toEqual(cyBefore);

    await page.locator('[data-testid="toggle-finish-stamped"]').click();
    await expect(page.locator('[data-testid="selected-package"]')).toHaveText("BEST");
  });

  test("Walkway add-on: width x LF computes SF and totalSF includes driveway + walkway", async ({ page }) => {
    await page.goto("/m/measure/demo?demo=1");
    await expect(page.locator('[data-testid="driveway-measure-page"]')).toBeVisible();

    await page.waitForFunction(() => typeof (window as any).__setDrivewayPolygonPoints === "function", undefined, { timeout: 30000 });
    await page.evaluate(() => {
      (window as any).__setDrivewayPolygonPoints([
        { lat: 30.2672, lng: -97.7431 },
        { lat: 30.2672, lng: -97.7430 },
        { lat: 30.2673, lng: -97.7430 },
        { lat: 30.2673, lng: -97.7431 },
      ]);
      (window as any).__setWalkwayLinePoints([
        { lat: 30.26725, lng: -97.74312 },
        { lat: 30.26735, lng: -97.74312 },
      ]);
    });

    await page.locator('[data-testid="walkway-width-4"]').click();

    const drivewaySfText = await page.locator('[data-testid="driveway-sf"]').innerText();
    const walkwaySfText = await page.locator('[data-testid="walkway-sf"]').innerText();
    const totalSfText = await page.locator('[data-testid="total-sf"]').innerText();

    const drivewaySf = Number(drivewaySfText.replace(/[^0-9.]/g, ""));
    const walkwaySf = Number(walkwaySfText.replace(/[^0-9.]/g, ""));
    const totalSf = Number(totalSfText.replace(/[^0-9.]/g, ""));

    expect(walkwaySf).toBeGreaterThan(0);
    expect(totalSf).toBeGreaterThan(drivewaySf);
    expect(Math.abs(totalSf - (drivewaySf + walkwaySf))).toBeLessThan(5);
  });

  test("Packages: Best includes drainage/sealing language in proposal preview (demo)", async ({ page }) => {
    await page.goto("/m/measure/demo?demo=1");
    await expect(page.locator('[data-testid="driveway-measure-page"]')).toBeVisible();

    await page.evaluate(() => {
      (window as any).__setDrivewayPolygonPoints([
        { lat: 30.2672, lng: -97.7431 },
        { lat: 30.2672, lng: -97.7430 },
        { lat: 30.2673, lng: -97.7430 },
        { lat: 30.2673, lng: -97.7431 },
      ]);
    });

    await page.locator('[data-testid="package-best"]').click();
    await expect(page.locator('[data-testid="selected-package"]')).toHaveText("BEST");

    await page.locator('[data-testid="button-generate-driveway"]').click();
    await page.waitForURL("**/m/preview/**", { timeout: 30000 });

    // Scope sections should include drainage considerations
    await expect(page.locator("body")).toContainText(/Drainage considerations/i);
    // Best package should include sealing language
    await expect(page.locator("body")).toContainText(/sealing/i);
  });
});

