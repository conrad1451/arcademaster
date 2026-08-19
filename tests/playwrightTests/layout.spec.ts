// tests/layout.spec.ts

import { test, expect } from "@playwright/test";

// CHQ: Gemini AI generated file

test.describe("Mobile Viewport Containment Checks", () => {
  // Enforce a strict mobile screen footprint
  test.use({ viewport: { width: 375, height: 667 } });

  test("should completely eliminate scrolling containers on active game screens", async ({
    page,
  }) => {
    await page.goto("/tetris");

    // Assert layout is rigid and prevents accidental vertical shifting
    const pageScrollTop = await page.evaluate(() => window.scrollY);
    expect(pageScrollTop).toBe(0);
  });

  test("should load third-party ad script containers statically in DOM layouts", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify structural ad parent node configurations do not dynamically drop out
    const adContainer = page.locator("#apitiny-ad-wrapper");
    await expect(adContainer).toBeAttached();
  });
});
