// Synthetic backend only. No login credentials or OpenAI calls are used.
// Run after npm run build: node scripts/check-saju-explorer.mjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const output = "build/saju-explorer-check";
const record = {
  id: "synthetic-saju", kind: "saju", schemaVersion: 5, status: "completed", spreadType: null,
  title: "합성 사주 탐색 검증", createdAt: "2026-11-03T00:00:00Z", updatedAt: "2026-11-03T00:00:00Z",
  input: { targetYear: 2026, calculationSnapshot: {
    calculationVersion: "saju-ko-v1", engine: "lunar-java", engineVersion: "1.7.7", cityCatalogVersion: "kr-admin-v1", targetYear: 2026,
    pillars: { year: { ganZhi: "갑자" }, month: { ganZhi: "기축" }, day: { ganZhi: "임오" }, time: null }, dayMaster: "임",
    fiveElements: { wood: 1, fire: 1, earth: 2, metal: 0, water: 2 },
    relations: [{ type: "stem_combination", members: ["갑", "기"] }, { type: "branch_clash", members: ["자", "오"] }],
    annualFortune: { year: 2026, ganZhi: "병오", stemTenGod: "편재" }, limitations: ["TIME_PILLAR_UNCERTAIN"], uncertainty: { varyingFields: ["pillars.time"] },
  } },
  result: { readingMode: "standard", questionRedirected: false, title: "합성 사주 탐색 검증", summary: "합성 결과의 요약입니다.",
    natalSections: [
      { id: "core", heading: "나를 읽는 기준", body: "합성 일간 설명입니다.", evidenceKeys: ["dayMaster"] },
      { id: "strengths", heading: "글자의 구성", body: "합성 오행 설명입니다.", evidenceKeys: ["elementBalance"] },
      { id: "relationship", heading: "관계의 설명", body: "합성 관계 설명입니다.", evidenceKeys: ["interactions"] },
      { id: "work", heading: "일하는 방식", body: "합성 십성 설명입니다.", evidenceKeys: ["tenGods"] },
    ], annualReading: { year: 2026, heading: "올해의 설명", body: "합성 연간 설명입니다.", evidenceKeys: ["annualFlow"] },
    questionReading: { heading: "질문의 설명", body: "합성 질문 설명입니다.", evidenceKeys: ["dayMaster"] }, disclaimer: "오락과 자기 성찰을 위한 참고입니다.",
  },
};
const requests = [];
const backend = createServer((request, response) => {
  requests.push(`${request.method} ${request.url}`);
  response.setHeader("content-type", "application/json");
  if (request.url === "/api/auth/me") response.end(JSON.stringify({ authenticated: true, user: { id: "synthetic-user" } }));
  else if (request.url === "/api/readings/synthetic-saju") response.end(JSON.stringify({ reading: record }));
  else if (request.url === "/api/readings") response.end(JSON.stringify({ items: [record] }));
  else { response.statusCode = 404; response.end("{}"); }
});
await new Promise((resolve, reject) => { backend.once("error", reject); backend.listen(3118, "127.0.0.1", resolve); });
let app;
let browser;
let logs = "";
try {
  await mkdir(output, { recursive: true });
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3119"], {
    env: { ...process.env, BACKEND_API_URL: "http://127.0.0.1:3118" }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  app.stdout.on("data", (chunk) => { logs = (logs + chunk).slice(-8000); });
  app.stderr.on("data", (chunk) => { logs = (logs + chunk).slice(-8000); });
  app.on("error", (error) => { logs += error.message; });
  const base = "http://127.0.0.1:3119";
  let ready = false;
  let lastStatus = "no response";
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${base}/saju/results/synthetic-saju`);
      lastStatus = String(response.status);
      if (response.ok) { ready = true; break; }
    } catch (error) { lastStatus = `${error.message} (${error.cause?.code ?? "unknown"})`; }
    if (app.exitCode !== null) throw new Error(logs);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, `${lastStatus}; backend requests: ${requests.join(", ")}; ${logs}`);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const errors = [];
  for (const width of [375, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/saju/results/synthetic-saju`);
    await page.getByRole("group", { name: "사주 탐색 항목" }).waitFor();
    const earth = page.getByRole("button", { name: "토 · 흙 2개" });
    await earth.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelectorAll('[data-highlighted="true"]').length === 2);
    assert.equal(await earth.getAttribute("aria-pressed"), "true");
    assert.equal(await page.getByText("선택", { exact: true }).count(), 2);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${output}/elements-${width}.png`, fullPage: true });
    const relation = page.getByRole("button", { name: /지지의 충.*자·오/ });
    await relation.focus();
    await page.keyboard.press("Space");
    await page.waitForFunction(() => document.querySelectorAll('[data-highlighted="true"]').length === 2);
    const link = page.getByRole("navigation", { name: "선택한 계산을 사용한 리딩" }).getByRole("link");
    await link.focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "saju-relationship");
    await page.reload();
    assert.equal(await page.getByRole("button", { name: "일간 · 나의 기준" }).getAttribute("aria-pressed"), "true");
    await page.goto(`${base}/records/synthetic-saju`);
    await page.getByRole("group", { name: "사주 탐색 항목" }).waitFor();
    await page.screenshot({ path: `${output}/record-${width}.png`, fullPage: true });
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.ok(requests.every((request) => request.startsWith("GET ")), "Exploration must not generate a reading");
  console.log("PASS: synthetic backend, 375/1280px, Enter/Space, selection markers, reading focus, reload and records route; no mutation requests");
} finally {
  await browser?.close();
  app?.kill();
  await new Promise((resolve) => backend.close(resolve));
}
