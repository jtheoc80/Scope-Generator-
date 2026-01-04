import { test, expect } from "@playwright/test";

/**
 * Smoke Test: Export PDF + Email PDF (deterministic)
 *
 * Validates:
 * - PDF endpoint returns application/pdf + Content-Disposition
 * - PDF bytes are stable across repeated requests
 * - Email send in EMAIL_MODE=test writes a row to DB outbox (no external provider)
 */
test.describe("PDF Export + Email Outbox @smoke", () => {
  test("should export deterministic PDF and write email to outbox", async ({ page }) => {
    const qaSecret = process.env.QA_TEST_SECRET;
    const baseURL = process.env.QA_BASE_URL || "http://localhost:3000";
    test.skip(!qaSecret, "QA_TEST_SECRET is required for deterministic E2E");
    test.skip(!baseURL.includes("localhost"), "Runs only against local QA server (not staging/prod)");

    const runId = Date.now().toString();
    const recipientEmail = `recipient+${runId}@example.test`;
    const clientName = `QA Client ${runId.slice(-4)}`;

    // Create a QA user + login (cookie auth)
    const createUserRes = await page.request.post("/api/qa/create-user", {
      data: {
        email: `qa+${runId}@example.test`,
        firstName: "QA",
        lastName: "PDF",
        secret: qaSecret,
      },
    });
    expect(createUserRes.ok()).toBeTruthy();
    const createdUser = await createUserRes.json();
    const userId = createdUser.user.id as string;

    const loginRes = await page.request.post("/api/qa/login", {
      data: {
        userId,
        secret: qaSecret,
      },
    });
    expect(loginRes.ok()).toBeTruthy();

    // Create a deterministic proposal
    const createProposalRes = await page.request.post("/api/qa/create-proposal", {
      data: {
        userId,
        clientName,
        address: "123 Test Street, Austin, TX 78701",
        secret: qaSecret,
      },
    });
    expect(createProposalRes.ok()).toBeTruthy();
    const createdProposal = await createProposalRes.json();
    const proposalId = createdProposal.proposal.id as number;

    const pdfPath = `/api/proposals/${proposalId}/pdf`;

    // Assert PDF endpoint headers + stable bytes
    const r1 = await page.request.get(pdfPath);
    expect(r1.status()).toBe(200);
    expect(r1.headers()["content-type"]).toContain("application/pdf");
    expect(r1.headers()["content-disposition"]).toContain(".pdf");
    const b1 = await r1.body();

    const r2 = await page.request.get(pdfPath);
    expect(r2.status()).toBe(200);
    const b2 = await r2.body();
    expect(Buffer.compare(b1, b2)).toBe(0);

    // Exercise UI export button + assert request
    await page.goto(`/proposals/${proposalId}`);
    await page.waitForLoadState("networkidle");

    const exportBtn = page.locator('[data-testid="export-pdf"]');
    await expect(exportBtn).toBeVisible({ timeout: 10000 });

    const pdfRespPromise = page.waitForResponse(
      (resp) => resp.url().includes(pdfPath) && resp.status() === 200,
    );
    await exportBtn.click();
    const pdfResp = await pdfRespPromise;
    expect(pdfResp.headers()["content-type"]).toContain("application/pdf");

    await expect(page.locator('[data-testid="pdf-generation-status"]')).toContainText(/PDF: (Ready|Sent)/);

    // Email PDF via modal (writes to outbox in EMAIL_MODE=test)
    await page.getByRole("button", { name: "Email PDF" }).click();
    await expect(page.locator('[data-testid="input-recipient-email"]')).toBeVisible();
    await page.locator('[data-testid="input-recipient-email"]').fill(recipientEmail);
    await page.locator('[data-testid="email-pdf"]').click();

    // Verify outbox record exists
    const outboxRes = await page.request.get(
      `/api/qa/outbox?proposalId=${proposalId}&to=${encodeURIComponent(recipientEmail)}&secret=${qaSecret}`,
    );
    expect(outboxRes.ok()).toBeTruthy();
    const outbox = await outboxRes.json();
    expect(outbox.count).toBeGreaterThan(0);
    expect(outbox.records[0].to).toBe(recipientEmail);
    expect(outbox.records[0].proposalId).toBe(proposalId);
    expect(Array.isArray(outbox.records[0].attachments)).toBeTruthy();
    expect(outbox.records[0].attachments.length).toBeGreaterThan(0);
    expect(outbox.records[0].attachments[0].contentType).toBe("application/pdf");
  });
});

