// Local synthetic backend + accepted synthetic Preview outputs. Never calls OpenAI.
// Run after npm run build: node scripts/check-saju-annual.mjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const records = new Map();
for (const mode of ["full", "brief"]) {
  const record = JSON.parse(await readFile(new URL(`./fixtures/saju-annual-${mode}.json`, import.meta.url), "utf8"));
  records.set(record.id, record);
}
const requests = [];
const submissions = [];
const handle = (request, response) => {
  requests.push(`${request.method} ${request.url}`);
  response.setHeader("content-type", "application/json");
  const json = (value) => response.end(JSON.stringify(value));
  if (request.url === "/api/auth/me") return json({ authenticated: true, user: { id: "synthetic-user" } });
  if (request.url?.startsWith("/api/consents")) return json({ status: { acceptedDocumentTypes: ["terms", "ai-overseas-transfer"], requiredDocumentTypes: ["terms", "ai-overseas-transfer"], hasAcceptedRequired: true } });
  if (request.url === "/api/saju/birth-places") return json({ version: "synthetic", provinces: [{ provinceCode: "11", provinceName: "서울특별시" }] });
  if (request.url === "/api/reading-credits") return json({ dailyFreeGrant: 10, balance: { free: 10, paid: 0, total: 10 }, nextResetAt: new Date(Date.now() + 86400000).toISOString(), generationInProgress: false, costs: { saju: 4, sajuAnnual: 4, tarot: { mind_three_card: 2, relationship_three_card: 2, choice_five_card: 3 } } });
  if (request.url === "/api/readings") return json({ items: [...records.values()] });
  if (request.url?.startsWith("/api/readings/")) {
    const record = records.get(request.url.slice("/api/readings/".length));
    if (record) return json({ reading: record });
  }
  if (request.method === "POST" && request.url === "/api/saju/readings") {
    let body = "";
    request.on("data", (part) => { body += part; });
    request.on("end", () => { submissions.push(JSON.parse(body)); json({ reading: records.get("synthetic-annual-full") }); });
    return;
  }
  response.statusCode = 404; json({});
};
const servers = [];
let app;
let browser;
let logs = "";
try {
  const manifest = JSON.parse(await readFile(".next/routes-manifest.json", "utf8"));
  const destination = manifest.rewrites.beforeFiles.find((route) => route.source === "/api/consents")?.destination;
  assert.ok(destination);
  const rewrite = new URL(destination);
  assert.ok(["127.0.0.1", "localhost"].includes(rewrite.hostname), "Refuse a non-local build-time backend");
  for (const [host, port] of [["127.0.0.1", 3118], [rewrite.hostname, Number(rewrite.port || 80)]]) {
    if (servers.some((item) => item.host === host && item.port === port)) continue;
    const server = createServer(handle);
    await new Promise((resolve, reject) => { server.once("error", reject); server.listen(port, host, resolve); });
    servers.push({ host, port, server });
  }
  await mkdir("build/saju-annual-check", { recursive: true });
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3119"], { windowsHide: true, env: { ...process.env, BACKEND_API_URL: "http://127.0.0.1:3118" }, stdio: ["ignore", "pipe", "pipe"] });
  for (const stream of [app.stdout, app.stderr]) stream.on("data", (part) => { logs = (logs + part).slice(-8000); });
  const base = "http://127.0.0.1:3119";
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${base}/saju/results/synthetic-annual-full`)).ok) { ready = true; break; } } catch { /* local startup */ }
    if (app.exitCode !== null) throw new Error(logs);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, logs);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const errors = [];
  for (const width of [375, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    for (const mode of ["full", "brief"]) {
      await page.goto(`${base}/saju/results/synthetic-annual-${mode}?month=2`);
      const months = page.getByRole("group", { name: "살펴볼 달" });
      await months.getByRole("button", { name: /^2월 · 선택됨/ }).waitFor();
      assert.equal(await months.getByRole("button").count(), 12);
      await page.getByText(/앞달 후반과 이어지는 구간/).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `build/saju-annual-check/${mode}-${width}.png`, fullPage: true });
      const december = months.getByRole("button", { name: /^12월/ });
      await december.focus(); await page.keyboard.press("Enter");
      assert.equal(new URL(page.url()).searchParams.get("month"), "12");
      await page.reload();
      await months.getByRole("button", { name: /^12월 · 선택됨/ }).waitFor();
      const calculation = page.locator("details").filter({ has: page.locator("summary", { hasText: "내 사주 탐색 · 명식과 계산 기준 보기" }) }).first();
      assert.equal(await calculation.getAttribute("open"), null);
      await calculation.locator("summary").first().focus(); await page.keyboard.press("Space");
      await page.getByRole("group", { name: "사주 탐색 항목" }).waitFor({ state: "visible" });
      await page.goto(`${base}/records/synthetic-annual-${mode}?month=3`);
      await page.getByRole("button", { name: /^3월 · 선택됨/ }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `build/saju-annual-check/${mode}-record-${width}.png`, fullPage: true });
    }
    const before = submissions.length;
    await page.goto(`${base}/saju`);
    await page.getByRole("radio", { name: /한 해 리포트/ }).check();
    await page.getByRole("radio", { name: /일·진로/ }).check();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await page.getByLabel("양력 생년월일").fill("1992-08-17");
    await page.getByRole("radio", { name: /시간을 몰라요/ }).check();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await page.getByText("입력하지 않음", { exact: true }).waitFor();
    await page.getByRole("button", { name: "사주 리딩 생성", exact: true }).click();
    await page.getByRole("group", { name: "살펴볼 달" }).waitFor();
    assert.equal(submissions.length, before + 1);
    assert.equal(submissions.at(-1).reportType, "annual_monthly");
    assert.equal(submissions.at(-1).question, "");
    assert.equal(submissions.at(-1).birthProfile.birthTime, undefined);
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.equal(submissions.length, 2, "Only the two explicit synthetic creations may POST");
  assert.ok(requests.every((item) => item.startsWith("GET ") || item === "POST /api/saju/readings"));
  console.log("PASS M4: accepted synthetic full/brief reports, 12 months, shared periods, Enter/Space, 375/1280px, refresh/records and optional-question creation; no OpenAI calls");
} finally {
  await browser?.close(); app?.kill();
  for (const { server } of servers) await new Promise((resolve) => server.close(resolve));
}
