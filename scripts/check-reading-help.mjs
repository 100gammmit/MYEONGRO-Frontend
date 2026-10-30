// Run against a local dev/start server: node scripts/check-reading-help.mjs
// Screenshots are local verification artifacts, not public content.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.HELP_BASE_URL ?? "http://localhost:3105";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname), "Use a local test server");
const output = "build/reading-help-check";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.HELP_BROWSER_CHANNEL ?? "chrome", headless: true });
const errors = [];
try {
  for (const width of [375, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [path, title] of [["/faq", "자주 묻는 질문"], ["/guide/tarot", "타로 사용 가이드"], ["/guide/saju", "사주 사용 가이드"]]) {
      const response = await page.goto(`${baseUrl}${path}`);
      assert.equal(response.status(), 200);
      await page.getByRole("heading", { name: title, exact: true, level: 1 }).waitFor();
      assert.equal(new URL(page.url()).pathname, path);
      assert.ok((await page.title()).includes(title));
      assert.ok(await page.locator('meta[name="description"]').getAttribute("content"));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `overflow: ${path} / ${width}`);
      for (const href of ["/faq", "/guide/tarot", "/guide/saju"]) {
        assert.equal(await page.locator(`footer a[href="${href}"]`).count(), 1);
      }
      if (path === "/faq") {
        const first = page.locator("details").first();
        const summary = first.locator("summary");
        await summary.focus();
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => document.querySelector("details").open);
        await page.keyboard.press("Space");
        await page.waitForFunction(() => !document.querySelector("details").open);
        await page.goto(`${baseUrl}/faq#birth-time`);
        await page.waitForFunction(() => document.getElementById("birth-time").open);
        assert.equal(await page.evaluate(() => document.activeElement?.parentElement?.id), "birth-time");
      } else {
        await page.getByRole("navigation", { name: "가이드 목차" }).getByRole("link").last().click();
        assert.equal(new URL(page.url()).hash, "#read-result");
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      }
      await page.screenshot({ path: `${output}/${path.replaceAll("/", "-").slice(1)}-${width}.png`, fullPage: true });
    }
    await page.goto(baseUrl);
    await page.getByRole("navigation", { name: "리딩 이용 안내" }).getByRole("link", { name: "타로 사용 가이드" }).click();
    await page.waitForURL(`${baseUrl}/guide/tarot`);
    await page.goto(`${baseUrl}/tarot`);
    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByRole("link", { name: "타로 사용 가이드 (새 탭)" }).click(),
    ]);
    await popup.waitForLoadState();
    assert.equal(new URL(page.url()).pathname, "/tarot");
    assert.equal(new URL(popup.url()).pathname, "/guide/tarot");
    await context.close();
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJs.newPage();
  for (const path of ["/faq", "/guide/tarot", "/guide/saju"]) {
    assert.equal((await page.goto(`${baseUrl}${path}`)).status(), 200);
    assert.ok((await page.locator("main").textContent()).length > 1000);
    if (path === "/faq") {
      await page.locator("summary").first().click();
      assert.ok(await page.locator("details").first().getAttribute("open") !== null);
    }
  }
  await noJs.close();
  assert.deepEqual(errors, []);
  console.log("PASS: public pages, metadata, 375/1280px layout, keyboard FAQ, deep links, help popup and no-JS content");
} finally {
  await browser.close();
}
