import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
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
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const tileFailures = [];
  page.on("response", (r) => {
    if (r.url().includes("tile.openstreetmap.org") && r.status() >= 400)
      tileFailures.push({ url: r.url(), status: r.status() });
  });
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.screenshot({ path: "qa/screenshots/hero-desktop.png" });
  await page.locator("#theme-button").click();
  await page.locator('[data-theme-choice="dark"]').click();
  await page.screenshot({ path: "qa/screenshots/dark-desktop.png" });
  await page.locator("#theme-button").click();
  await page.locator('[data-theme-choice="light"]').click();
  await page.locator("#map").scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
  await page
    .locator("#travel-map")
    .screenshot({ path: "qa/screenshots/map.png" });
  console.log(
    "MAP",
    JSON.stringify({
      failures: tileFailures,
      text: await page.locator("#travel-map").innerText(),
      tileCount: await page
        .locator("#travel-map img.leaflet-tile-loaded")
        .count(),
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "qa/screenshots/hero-mobile.png" });
  await page.locator("#language-button").click();
  await page.screenshot({ path: "qa/screenshots/german-mobile.png" });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const boxes = await page
      .locator(".hero-content,.hero-location,.hero-link")
      .evaluateAll((els) =>
        els.map((el) => ({
          class: el.className,
          x: el.getBoundingClientRect().x,
          y: el.getBoundingClientRect().y,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
        })),
      );
    console.log("GERMAN", width, JSON.stringify(boxes));
    if (width === 320)
      await page.screenshot({ path: "qa/screenshots/german-mobile-small.png" });
  }
} finally {
  await browser.close();
  server.kill();
}
