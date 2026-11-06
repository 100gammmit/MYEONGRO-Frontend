// Run after npm run build. Uses an isolated synthetic auth backend; never calls AI or production.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const origin = "https://www.myeongro.com";
const articles = ["/guide/tarot/example", "/guide/saju/annual-report"];
const output = "build/public-content-check";
const backendRequests = [];
const backend = createServer((request, response) => {
  backendRequests.push(request.url);
  response.setHeader("content-type", "application/json");
  if (request.url === "/api/auth/me") return response.end(JSON.stringify({ authenticated: false }));
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
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "localhost", "-p", String(port)], {
    env: { ...process.env, BACKEND_API_URL: `http://127.0.0.1:${backendPort}` },
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  app.stdout.on("data", (chunk) => { appLogs += chunk; });
  app.stderr.on("data", (chunk) => { appLogs += chunk; });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (app.exitCode !== null) throw new Error(`Next exited: ${appLogs}`);
    try {
      if ((await fetch(`${base}/robots.txt`)).ok) { ready = true; break; }
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
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.equal(urls.length, 13);
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
  for (const path of ["/login", "/signup/age", "/records", "/account"]) {
    const response = await fetch(`${base}${path}`);
    assert.ok((await response.text()).includes('name="robots" content="noindex, nofollow"'), `Private noindex: ${path}`);
  }

  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ channel: process.env.HELP_BROWSER_CHANNEL ?? "chrome", headless: true });
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
  console.log("PASS: 13 public canonicals, robots/sitemap without auth, private noindex, 375/1280px, article links/anchors and no-JS content");
} finally {
  await browser?.close();
  if (app && app.exitCode === null) {
    const exited = new Promise((resolve) => app.once("exit", resolve));
    app.kill();
    await exited;
  }
  await new Promise((resolve) => backend.close(resolve));
}
