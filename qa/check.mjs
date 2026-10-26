import { chromium } from "playwright-core";
import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const origin = process.env.QA_URL || "http://127.0.0.1:4173";
const output = fileURLToPath(new URL("./screenshots/", import.meta.url));
await mkdir(output, { recursive: true });
let server;
try {
  await fetch(origin);
} catch {
  server = spawn(
    process.execPath,
    [fileURLToPath(new URL("../scripts/preview.mjs", import.meta.url))],
    { stdio: "pipe", windowsHide: true },
  );
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
const results = [];
const errors = [];
const missing = [];
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const page = await context.newPage();
page.setDefaultTimeout(8000);
page.on("pageerror", (err) => errors.push(err.message));
page.on("response", (response) => {
  if (response.url().startsWith(origin) && response.status() >= 400)
    missing.push({ status: response.status(), url: response.url() });
});

async function check(name, task) {
  try {
    await task();
    results.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (err) {
    results.push({ name, passed: false, error: err.message });
    console.log(`FAIL ${name}: ${err.message}`);
  }
}

try {
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await check("Document metadata and landmark structure", async () => {
    assert.match(await page.title(), /Wayfarer/i);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator("main").count(), 1);
    assert.ok(
      await page.locator('meta[name="description"]').getAttribute("content"),
    );
    assert.ok((await page.locator("h2").count()) >= 9);
  });
  await check("Images have accessible descriptions and load", async () => {
    const badAlt = await page.locator("img:not([alt])").count();
    assert.equal(badAlt, 0);
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const broken = await page
      .locator("img[src]")
      .evaluateAll((images) =>
        images
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.src),
      );
    assert.deepEqual(broken, []);
  });
  await check(
    "Hero search combines query and interest, city filters clear, and catalog expands",
    async () => {
      await page.locator("#destination-search").fill("Lisbon");
      await page.locator("#hero-interest").selectOption("hidden");
      await page.locator('#hero-search button[type="submit"]').click();
      assert.equal(await page.locator("#place-grid .place-card").count(), 1);
      assert.match(
        await page.locator("#place-grid").innerText(),
        /tram-lined lanes/i,
      );
      await page.locator('#destination-grid [data-city="copenhagen"]').click();
      assert.equal(await page.locator("#place-grid .place-card").count(), 2);
      assert.equal(await page.locator("#active-filters").isVisible(), true);
      await page.locator("[data-clear-city]").click();
      assert.equal(await page.locator("#place-grid .place-card").count(), 6);
      await page.locator("#show-more").click();
      assert.equal(await page.locator("#place-grid .place-card").count(), 8);
      assert.equal(await page.locator("#show-more").isVisible(), false);
    },
  );
  await check("Links and visible buttons have accessible names", async () => {
    const unnamed = await page.locator("button,a").evaluateAll((elements) =>
      elements
        .filter((el) => {
          const visible = !!(
            el.offsetWidth ||
            el.offsetHeight ||
            el.getClientRects().length
          );
          return (
            visible &&
            !(
              el.getAttribute("aria-label") ||
              el.getAttribute("title") ||
              el.textContent.trim() ||
              el.querySelector("img[alt]")
            )
          );
        })
        .map((el) => el.outerHTML.slice(0, 250)),
    );
    assert.deepEqual(unnamed, []);
  });
  await check(
    "Catalog search, empty state, categories, and sorting",
    async () => {
      const search = page.locator("#catalog-search");
      await search.fill("Kyoto");
      await page.waitForTimeout(150);
      assert.equal(await page.locator("#place-grid .place-card").count(), 2);
      await search.fill("a-place-that-does-not-exist-xyz");
      await page.waitForTimeout(150);
      assert.equal(await page.locator("#place-grid .place-card").count(), 0);
      assert.ok(
        (await page.locator("#place-grid").innerText()).trim().length > 0,
      );
      await search.fill("");
      await page
        .locator("#filter-tabs button")
        .filter({ hasText: /Food/ })
        .click();
      assert.equal(await page.locator("#place-grid .place-card").count(), 2);
      await page.locator("#filter-tabs button").first().click();
      await page.locator("#sort-select").selectOption("name");
      const titles = await page
        .locator("#place-grid .place-title-button")
        .allTextContents();
      assert.deepEqual(
        titles,
        [...titles].sort((a, b) => a.localeCompare(b)),
      );
      await page.locator("#sort-select").selectOption("recommended");
    },
  );
  await check(
    "Place detail dialog opens, traps focus and closes with Escape",
    async () => {
      const trigger = page.locator("#place-grid .place-title-button").first();
      await trigger.click();
      assert.equal(
        await page.locator("#detail-dialog").evaluate((el) => el.open),
        true,
      );
      await page.keyboard.press("Tab");
      assert.equal(
        await page
          .locator("#detail-dialog")
          .evaluate((el) => el.contains(document.activeElement)),
        true,
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.locator("#detail-dialog").evaluate((el) => el.open),
        false,
      );
      assert.equal(
        await trigger.evaluate((el) => el === document.activeElement),
        true,
      );
    },
  );
  await check(
    "Saved places persist after reload and appear in collection",
    async () => {
      await page.locator("#place-grid .favorite-button").first().click();
      assert.equal(
        (await page.locator("#saved-count").innerText()).trim(),
        "1",
      );
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(
        (await page.locator("#saved-count").innerText()).trim(),
        "1",
      );
      await page.locator("#saved-button").click();
      assert.equal(
        await page.locator("#saved-dialog").evaluate((el) => el.open),
        true,
      );
      assert.ok(
        (await page.locator("#saved-content").innerText()).trim().length > 0,
      );
      const pending = page.waitForEvent("download");
      await page.locator("#export-saved").click();
      const exported = await pending;
      assert.equal(exported.suggestedFilename(), "wayfarer-saved-places.json");
      const list = JSON.parse(await readFile(await exported.path(), "utf8"));
      assert.equal(list.places.length, 1);
      assert.ok(Number.isFinite(list.places[0].coordinates.lat));
      await page.keyboard.press("Escape");
    },
  );
  await check("Complete German language choice persists", async () => {
    const originalHero = await page.locator("h1").innerText();
    await page.locator("#language-button").click();
    assert.equal(await page.locator("html").getAttribute("lang"), "de");
    assert.notEqual(await page.locator("h1").innerText(), originalHero);
    assert.match(
      await page.locator('#contact-form button[type="submit"]').innerText(),
      /Entwurf/i,
    );
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("lang"), "de");
    await page.locator("#language-button").click();
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
  });
  await check("Light, dark, and system theme respond and persist", async () => {
    await page.locator("#theme-button").click();
    await page.locator('[data-theme-choice="dark"]').click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await page.locator("#theme-button").click();
    await page.locator('[data-theme-choice="system"]').click();
    assert.equal(
      await page.locator("html").getAttribute("data-theme"),
      "light",
    );
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(100);
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.locator("#theme-button").click();
    await page.locator('[data-theme-choice="light"]').click();
  });
  await check("Gallery opens a keyboard-operated lightbox", async () => {
    await page.locator("#gallery-grid button").first().click();
    assert.equal(
      await page.locator("#lightbox").evaluate((el) => el.open),
      true,
    );
    const first = await page.locator("#lightbox-image").getAttribute("src");
    await page.keyboard.press("ArrowRight");
    assert.notEqual(
      await page.locator("#lightbox-image").getAttribute("src"),
      first,
    );
    await page.keyboard.press("ArrowLeft");
    assert.equal(
      await page.locator("#lightbox-image").getAttribute("src"),
      first,
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#lightbox").evaluate((el) => el.open),
      false,
    );
  });
  await check("FAQ is keyboard accessible", async () => {
    const summary = page.locator("#faq-list summary").first();
    await summary.focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await summary.evaluate((el) => el.closest("details").open),
      true,
    );
  });
  await check(
    "Contact validates required fields and creates an honest local draft",
    async () => {
      await page.locator('#contact-form button[type="submit"]').click();
      assert.ok(
        (await page.locator("#name-error").innerText()).trim().length > 0,
      );
      assert.ok(
        (await page.locator("#email-error").innerText()).trim().length > 0,
      );
      await page.locator("#contact-name").fill("QA Traveller");
      await page.locator("#contact-email").fill("qa@example.com");
      await page
        .locator("#contact-message")
        .fill(
          "This is a local demonstration message for an imaginary city break.",
        );
      await page.locator("#contact-consent").check();
      await page.locator('#contact-form button[type="submit"]').click();
      assert.equal(await page.locator("#form-result").isVisible(), true);
      assert.match(
        await page.locator("#form-result").innerText(),
        /draft|download|saved/i,
      );
      const pending = page.waitForEvent("download");
      await page.locator("#download-draft").click();
      const downloaded = await pending;
      const contents = await readFile(await downloaded.path(), "utf8");
      assert.equal(
        downloaded.suggestedFilename(),
        "wayfarer-message-draft.txt",
      );
      assert.match(contents, /QA Traveller/);
      assert.match(contents, /qa@example.com/);
      assert.match(contents, /does not send email/i);
    },
  );
  await check(
    "Interactive map has selectable city controls and usable attribution",
    async () => {
      const cities = page.locator("#map-cities button");
      assert.equal(await cities.count(), 4);
      await cities.nth(1).click();
      assert.ok(
        (await page.locator("#travel-map").innerText()).trim().length > 0,
      );
      assert.ok(
        (await page.locator('#travel-map a[href*="openstreetmap"]').count()) >
          0,
      );
      await page.locator("#travel-map .is-selected").focus();
      await page.keyboard.press("Enter");
      await page
        .locator(".wayfarer-map-popup-button")
        .waitFor({ state: "visible" });
      await page.waitForFunction(() =>
        document.activeElement?.classList.contains("wayfarer-map-popup-button"),
      );
      assert.equal(
        await page
          .locator(".wayfarer-map-popup-button")
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await page.keyboard.press("Enter");
      assert.equal(
        await page.locator("#detail-dialog").evaluate((el) => el.open),
        true,
      );
      await page.keyboard.press("Escape");
    },
  );
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 820, 1180],
    ["mobile", 390, 844],
    ["mobile-small", 320, 720],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    await check(`${name} has no horizontal overflow`, async () => {
      const dimensions = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      assert.ok(
        dimensions.scroll <= dimensions.client + 1,
        JSON.stringify(dimensions),
      );
    });
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  }
  await check(
    "Mobile menu opens and closes after choosing a section",
    async () => {
      await page.locator("#menu-toggle").click();
      assert.equal(await page.locator("#mobile-nav").isVisible(), true);
      await page.locator("#mobile-nav a").first().click();
      assert.equal(await page.locator("#mobile-nav").isVisible(), false);
    },
  );
  await check(
    "English and German hero controls stay clear of location labels at 320px and 390px",
    async () => {
      for (const language of ["en", "de"]) {
        if ((await page.locator("html").getAttribute("lang")) !== language)
          await page.locator("#language-button").click();
        for (const width of [320, 390]) {
          await page.setViewportSize({ width, height: 844 });
          const link = await page.locator(".hero-link").boundingBox();
          const location = await page.locator(".hero-location").boundingBox();
          assert.ok(
            link.y + link.height < location.y,
            `${language} at ${width}: CTA bottom ${link.y + link.height} overlaps location ${location.y}`,
          );
        }
      }
      await page.locator("#language-button").click();
    },
  );
  await check(
    "Credits files work and privacy reset clears saved preferences",
    async () => {
      await page.locator("#credits-button").click();
      assert.equal(
        await page.locator("#info-dialog").evaluate((el) => el.open),
        true,
      );
      const localLinks = await page
        .locator("#info-content a")
        .evaluateAll((links) =>
          links
            .map((a) => a.href)
            .filter((href) => new URL(href).origin === location.origin),
        );
      assert.equal(localLinks.length, 3);
      for (const url of localLinks)
        assert.equal((await page.request.get(url)).status(), 200, url);
      await page.keyboard.press("Escape");
      await page.locator("#privacy-button").click();
      await page.locator("#clear-local-data").click();
      assert.equal(
        await page.locator("#info-dialog").evaluate((el) => el.open),
        false,
      );
      assert.deepEqual(
        await page.evaluate(() =>
          Object.keys(localStorage).filter((k) => k.startsWith("wayfarer-")),
        ),
        [],
      );
      assert.equal(
        (await page.locator("#saved-count").innerText()).trim(),
        "0",
      );
    },
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `${output}/hero-desktop.png` });
  await page.locator("#theme-button").click();
  await page.locator('[data-theme-choice="dark"]').click();
  await page.screenshot({ path: `${output}/dark-desktop.png` });
  await page.locator("#theme-button").click();
  await page.locator('[data-theme-choice="light"]').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${output}/hero-mobile.png` });
  await page.locator("#language-button").click();
  await page.screenshot({ path: `${output}/german-mobile.png` });
  await check("Application starts without JavaScript errors", async () =>
    assert.deepEqual(errors, []),
  );
  await check("All local resources return successful responses", async () =>
    assert.deepEqual(missing, []),
  );
} finally {
  await writeFile(
    new URL("./results.json", import.meta.url),
    JSON.stringify({ results, errors, missing }, null, 2),
  );
  await browser.close();
  server?.kill();
}
console.log(
  JSON.stringify({
    passed: results.filter((x) => x.passed).length,
    failed: results.filter((x) => !x.passed).length,
    screenshots: output,
  }),
);
if (results.some((x) => !x.passed)) process.exitCode = 1;
