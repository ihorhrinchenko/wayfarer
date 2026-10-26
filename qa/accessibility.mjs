import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";
const server = spawn(
  process.execPath,
  [fileURLToPath(new URL("../scripts/preview.mjs", import.meta.url))],
  { stdio: "ignore", windowsHide: true },
);
await new Promise((resolve) => setTimeout(resolve, 500));
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const reports = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.locator("#map").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.locator("footer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  for (const variant of ["light-desktop", "dark-desktop", "german-mobile"]) {
    if (variant === "dark-desktop") {
      await page.locator("#theme-button").click();
      await page.locator('[data-theme-choice="dark"]').click();
    }
    if (variant === "german-mobile") {
      await page.locator("#language-button").click();
      await page.setViewportSize({ width: 320, height: 844 });
    }
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    reports.push({ variant, violations: results.violations });
    console.log(
      JSON.stringify({
        variant,
        violations: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes
            .map((n) => ({ target: n.target, summary: n.failureSummary }))
            .slice(0, 12),
          count: v.nodes.length,
        })),
      }),
    );
  }
  await page.locator("#place-grid .place-title-button").first().click();
  const dialog = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  reports.push({ variant: "detail-dialog", violations: dialog.violations });
  console.log(
    JSON.stringify({
      variant: "detail-dialog",
      violations: dialog.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes
          .map((n) => ({ target: n.target, summary: n.failureSummary }))
          .slice(0, 12),
        count: v.nodes.length,
      })),
    }),
  );
} finally {
  await writeFile(
    new URL("./accessibility-results.json", import.meta.url),
    JSON.stringify(reports, null, 2),
  );
  await browser.close();
  server.kill();
}
if (
  reports.some((r) =>
    r.violations.some((v) => ["critical", "serious"].includes(v.impact)),
  )
)
  process.exitCode = 1;
