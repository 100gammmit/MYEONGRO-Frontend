// Run after npm run build. Uses an isolated synthetic auth backend; never calls AI or production.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import routes from "../src/infrastructure/site-routes.json" with { type: "json" };

const origin = routes.origin;
const articles = ["/guide/tarot/example", "/guide/saju/annual-report"];
const output = "build/public-content-check";
const backendRequests = [];
const sessionCookie = "MYEONGRO_SESSION=public-content-synthetic";
const record = JSON.parse(await readFile(new URL("./fixtures/saju-annual-full.json", import.meta.url), "utf8"));
const backend = createServer((request, response) => {
  backendRequests.push(request.url);
  response.setHeader("content-type", "application/json");
  const authenticated = request.headers.cookie === sessionCookie;
  const json = (value) => response.end(JSON.stringify(value));
  if (request.url === "/api/auth/me") return json(authenticated
    ? { authenticated: true, user: { id: "synthetic-public-content-user" } }
    : { authenticated: false });
  if (!authenticated) { response.statusCode = 401; return json({}); }
  if (request.url === "/api/readings") return json({ items: [record] });
  if (request.url === `/api/readings/${record.id}`) return json({ reading: record });
  if (request.url === "/api/reading-credits") return json({
    dailyFreeGrant: 10, balance: { free: 10, paid: 0, total: 10 },
    nextResetAt: new Date(Date.now() + 86400000).toISOString(), generationInProgress: false,
    costs: { saju: 4, sajuAnnual: 4, tarot: { mind_three_card: 2, relationship_three_card: 2, choice_five_card: 3 } },
  });
  response.statusCode = 404;
  response.end("{}");
});
let app;
let browser;
let appLogs = "";

try {
  await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
  const backendPort = backend.address().port;
  // Reserve a free local port, then let the production Next server bind it.
  const reservation = createServer();
  await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
  const port = reservation.address().port;
  await new Promise((resolve) => reservation.close(resolve));
  const base = `http://localhost:${port}`;
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", process.argv.includes("--dev") ? "dev" : "start", "-H", "localhost", "-p", String(port)], {
    env: { ...process.env, BACKEND_API_URL: `http://127.0.0.1:${backendPort}` },
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  app.stdout.on("data", (chunk) => { appLogs += chunk; });
  app.stderr.on("data", (chunk) => { appLogs += chunk; });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (app.exitCode !== null) throw new Error(`Next exited: ${appLogs}`);
    try {
      if ((await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(2000) })).ok) { ready = true; break; }
    } catch { /* Startup only. */ }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready, `Next did not start: ${appLogs}`);
  const beforeDiscovery = backendRequests.length;
  const robotsResponse = await fetch(`${base}/robots.txt`);
  assert.equal(robotsResponse.status, 200);
  assert.match(robotsResponse.headers.get("content-type"), /text\/plain/);
  assert.ok((await robotsResponse.text()).includes(`Sitemap: ${origin}/sitemap.xml`));
  const sitemapResponse = await fetch(`${base}/sitemap.xml`);
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapResponse.headers.get("content-type"), /xml/);
  const sitemap = await sitemapResponse.text();
  assert.equal(backendRequests.length, beforeDiscovery, "Discovery files must not query auth");
  const oldAbout = await fetch(`${base}/about/reading`, { redirect: "manual" });
  assert.equal(oldAbout.status, 308);
  assert.equal(new URL(oldAbout.headers.get("location"), base).pathname, "/about");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls.map((url) => new URL(url).pathname).sort(), [...routes.publicPages].sort());
  for (const url of urls) {
    assert.equal(new URL(url).origin, origin);
    const path = new URL(url).pathname;
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canonical, `Missing canonical: ${path}`);
    assert.equal(new URL(canonical[1]).href, new URL(url).href, `Canonical: ${path}`);
    assert.ok(!html.includes('content="noindex'), `Public noindex: ${path}`);
  }
  for (const path of ["/login", "/signup/age", "/account"]) {
    const response = await fetch(`${base}${path}`, { redirect: "manual" });
    assert.equal(response.status, 200, path);
    assert.equal(new URL(response.url).pathname, path, `Wrong private page: ${path}`);
    assert.ok((await response.text()).includes('name="robots" content="noindex, nofollow"'), `Private noindex: ${path}`);
  }
  // Guest redirection is a separate contract, never evidence for records metadata.
  const guestRecords = await fetch(`${base}/records`, { redirect: "manual" });
  assert.equal(guestRecords.status, 307);
  const guestDestination = new URL(guestRecords.headers.get("location"), base);
  assert.equal(guestDestination.pathname, "/login");
  assert.equal(guestDestination.searchParams.get("next"), "/records");
  for (const path of ["/records", `/records/${record.id}`, `/saju/results/${record.id}`]) {
    const response = await fetch(`${base}${path}`, { redirect: "manual", headers: { cookie: sessionCookie } });
    assert.equal(response.status, 200, `Authenticated private response: ${path}`);
    assert.equal(response.headers.get("location"), null, `Unexpected redirect: ${path}`);
    assert.equal(new URL(response.url).pathname, path, `Wrong private page: ${path}`);
    const html = await response.text();
    assert.ok(html.includes('name="robots" content="noindex, nofollow"'), `Authenticated private noindex: ${path}`);
    assert.ok(!html.includes('rel="canonical"'), `Private page inherited public canonical: ${path}`);
  }
  assert.ok(backendRequests.includes("/api/readings"), "The authenticated records page must load records");

  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const authenticated = await browser.newContext();
  await authenticated.addCookies([{ name: "MYEONGRO_SESSION", value: "public-content-synthetic", url: base }]);
  const recordsPage = await authenticated.newPage();
  await recordsPage.goto(`${base}/records`);
  await recordsPage.getByRole("heading", { level: 1, name: "내 기록" }).waitFor();
  assert.equal(new URL(recordsPage.url()).pathname, "/records");
  assert.equal(await recordsPage.locator('meta[name="robots"]').getAttribute("content"), "noindex, nofollow");
  await recordsPage.getByRole("link", { name: new RegExp(record.title) }).click();
  await recordsPage.waitForURL(`${base}/records/${record.id}`);
  await recordsPage.getByRole("heading", { level: 1, name: record.title }).waitFor();
  assert.equal(await recordsPage.locator('meta[name="robots"]').getAttribute("content"), "noindex, nofollow");
  await authenticated.close();
  const errors = [];
  for (const width of [375, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    for (const path of articles) {
      assert.equal((await page.goto(`${base}${path}`)).status(), 200);
      await page.locator("h1").waitFor();
      assert.equal(await page.locator("h1").count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow: ${path}/${width}`);
      await page.getByRole("navigation", { name: "가이드 목차" }).getByRole("link").last().click();
      assert.equal(new URL(page.url()).hash, "#read-result");
      await page.screenshot({ path: `${output}/${path.split("/").at(-1)}-${width}.png`, fullPage: true });
    }
    await page.goto(`${base}/about`);
    await page.getByRole("heading", { level: 1, name: "명로 소개" }).waitFor();
    assert.equal(await page.locator("h1").count(), 1);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `About overflow: ${width}`);
    assert.equal(await page.locator('footer a[href="/about"]').textContent(), "명로 소개");
    assert.equal(await page.locator('footer a[href="mailto:contact@myeongro.com"]').count(), 1);
    assert.equal(await page.locator("article > section").last().getAttribute("class"), "about-closing");
    await page.screenshot({ path: `${output}/about-${width}.png`, fullPage: true });
    for (const path of ["/", "/faq", "/guide/tarot", "/guide/saju", articles[0]]) {
      await page.goto(`${base}${path}`);
      if (path === "/faq") await page.locator("#reading-boundaries summary").click();
      await page.locator('a[href="/about#reading-method"]').click();
      await page.waitForURL(`${base}/about#reading-method`);
      await page.waitForFunction(() => {
        const heading = document.querySelector("#reading-method h2");
        if (!heading) return false;
        const { top, bottom } = heading.getBoundingClientRect();
        return top >= 0 && bottom <= innerHeight;
      });
    }
    await page.goto(`${base}/privacy`);
    for (const [label, address] of [
      ["일반 문의", "contact@myeongro.com"],
      ["개인정보 권리행사", "privacy@myeongro.com"],
    ]) {
      const item = page.locator("dt").filter({ hasText: new RegExp(`^${label}$`) }).locator("..");
      assert.equal(await item.locator(`a[href="mailto:${address}"]`).count(), 1);
    }
    await page.getByRole("heading", { name: "개인정보 보호책임자와 문의처", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/privacy-contact-${width}.png` });
    await page.goto(base);
    await page.getByRole("navigation", { name: "리딩 예시와 해설" }).getByRole("link").first().click();
    await page.waitForURL(`${base}${articles[0]}`);
    for (const [guide, article] of [["/guide/tarot", articles[0]], ["/guide/saju", articles[1]]]) {
      await page.goto(`${base}${guide}`);
      await page.locator(`a[href="${article}"]`).click();
      await page.waitForURL(`${base}${article}`);
    }
    await context.close();
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJs.newPage();
  for (const path of articles) {
    assert.equal((await page.goto(`${base}${path}`)).status(), 200);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator("article > section").count(), 8);
    assert.ok((await page.locator("article").textContent()).length > 2000);
  }
  await noJs.close();
  assert.deepEqual(errors, []);
  console.log(`PASS: ${urls.length} registered public canonicals, robots/sitemap without auth, guest redirect + authenticated records/results noindex, 375/1280px, article links/anchors and no-JS content`);
} finally {
  await browser?.close();
  if (app && app.exitCode === null) {
    const exited = new Promise((resolve) => app.once("exit", resolve));
    app.kill();
    await exited;
  }
  await new Promise((resolve) => backend.close(resolve));
}
