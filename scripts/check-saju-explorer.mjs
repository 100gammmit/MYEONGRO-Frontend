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
const records = new Map([[record.id, record]]);
const fullPillars = structuredClone(record);
fullPillars.id = "synthetic-full-pillars";
fullPillars.input.calculationSnapshot.pillars.time = { ganZhi: "병술" };
fullPillars.input.calculationSnapshot.fiveElements = { wood: 1, fire: 2, earth: 3, metal: 0, water: 2 };
fullPillars.input.calculationSnapshot.limitations = [];
fullPillars.input.calculationSnapshot.uncertainty.varyingFields = [];
records.set(fullPillars.id, fullPillars);
for (const [id, first, second] of [["synthetic-paired", "인", "해"], ["synthetic-paired-si-shin", "사", "신"]]) {
  const paired = structuredClone(record);
  paired.id = id;
  const snapshot = paired.input.calculationSnapshot;
  snapshot.pillars = { year: { ganZhi: `갑${first}` }, month: { ganZhi: `을${second}` }, day: { ganZhi: "임오" }, time: null };
  snapshot.fiveElements = first === "인"
    ? { wood: 3, fire: 1, earth: 0, metal: 0, water: 2 }
    : { wood: 2, fire: 2, earth: 0, metal: 1, water: 1 };
  snapshot.relations = [{ type: "branch_combination", members: [first, second] }, { type: "branch_break", members: [second, first] }];
  records.set(id, paired);
}
const noRelations = structuredClone(record);
noRelations.id = "synthetic-no-relations";
noRelations.input.calculationSnapshot.relations = [];
records.set(noRelations.id, noRelations);
const unknownTime = structuredClone(record);
unknownTime.id = "synthetic-unknown-time";
delete unknownTime.input.calculationSnapshot.dayMaster;
unknownTime.input.calculationSnapshot.pillars.day = null;
unknownTime.input.calculationSnapshot.fiveElements = { wood: 1, fire: 0, earth: 2, metal: 0, water: 1 };
unknownTime.input.calculationSnapshot.relations = [{ type: "stem_combination", members: ["갑", "기"] }];
unknownTime.input.calculationSnapshot.uncertainty.varyingFields = ["pillars.day", "pillars.time"];
unknownTime.input.calculationSnapshot.limitations = ["DAY_PILLAR_UNCERTAIN", "TIME_PILLAR_UNCERTAIN"];
unknownTime.result.natalSections[0].evidenceKeys = ["pillars"];
unknownTime.result.questionReading.evidenceKeys = ["pillars"];
records.set(unknownTime.id, unknownTime);
const requests = [];
const backend = createServer((request, response) => {
  requests.push(`${request.method} ${request.url}`);
  response.setHeader("content-type", "application/json");
  if (request.url === "/api/auth/me") response.end(JSON.stringify({ authenticated: true, user: { id: "synthetic-user" } }));
  else if (request.url?.startsWith("/api/readings/") && records.has(request.url.slice("/api/readings/".length))) {
    response.end(JSON.stringify({ reading: records.get(request.url.slice("/api/readings/".length)) }));
  }
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
    for (const [name, count, season, direction] of [
      ["목 · 나무", 1, "봄", "동쪽"], ["화 · 불", 1, "여름", "남쪽"],
      ["토 · 흙", 2, "계절이 바뀌는 사이", "가운데"], ["금 · 쇠", 0, "가을", "서쪽"], ["수 · 물", 2, "겨울", "북쪽"],
    ]) {
      await page.getByRole("button", { name: `${name} ${count}개` }).click();
      const panel = page.locator("#saju-explorer-description");
      await panel.getByText(season, { exact: true }).waitFor();
      await panel.getByText(direction, { exact: true }).waitFor();
      await panel.getByRole("heading", { name: "상생 · 돕는 흐름" }).waitFor();
      await panel.getByRole("heading", { name: "상극 · 다스리고 조절하는 흐름" }).waitFor();
      assert.doesNotMatch(await panel.textContent(), /저장된|snapshot|확정된 기둥/);
      assert.equal(await panel.getByText(/좋고 나쁨|강약/).count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await panel.screenshot({ path: `${output}/symbol-${name.slice(0, 1)}-${width}.png` });
    }
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
    for (const id of ["synthetic-paired", "synthetic-paired-si-shin"]) {
      await page.goto(`${base}/saju/results/${id}`);
      for (const type of ["지지의 합", "지지의 파"]) {
        await page.getByRole("button", { name: new RegExp(type) }).click();
        const panel = page.locator("#saju-explorer-description");
        await panel.getByText(/서로 묶이면서도 틈이 생길 수 있는 관계/).waitFor();
        await panel.getByText(type === "지지의 합"
          ? /지지의 합과 지지의 파에 함께 속하는 짝/
          : /지지의 파와 지지의 합에 함께 속하는 짝/).waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await panel.screenshot({ path: `${output}/${id}-${type.endsWith("합") ? "combination" : "break"}-${width}.png` });
      }
    }
    await page.goto(`${base}/saju/results/synthetic-no-relations`);
    await page.getByText("표시된 글자 사이에 해당하는 관계가 없습니다.").waitFor();
    await page.locator("#saju-calculation").screenshot({ path: `${output}/no-relations-${width}.png` });
    await page.goto(`${base}/saju/results/synthetic-unknown-time`);
    await page.getByText(/일간이 확정되지 않아/).waitFor();
    assert.equal(await page.locator(".saju-pillar-grid article").count(), 2);
    await page.getByRole("button", { name: "목 · 나무 1개" }).click();
    await page.getByText(/출생 시각이 확정되지 않은 기둥은 개수와 표시에서 빠집니다/).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator("#saju-calculation").screenshot({ path: `${output}/unknown-time-${width}.png` });
    await page.goto(`${base}/saju/results/synthetic-full-pillars`);
    await page.getByRole("button", { name: "목 · 나무 1개" }).click();
    assert.equal(await page.locator(".saju-pillar-grid article").count(), 4);
    assert.equal(await page.getByText(/출생 시각이 확정되지 않은 기둥/).count(), 0);
    assert.equal(await page.locator("#saju-explorer-description").getByText(/좋고 나쁨|강약/).count(), 1);
    await page.locator("#saju-explorer-description").screenshot({ path: `${output}/full-pillars-${width}.png` });
    await context.close();
  }
  assert.deepEqual(errors, []);
  assert.ok(requests.every((request) => request.startsWith("GET ")), "Exploration must not generate a reading");
  console.log("PASS: synthetic backend, 375/1280px, Enter/Space, selection markers, reading focus, reload/records, 5 elements/flows, paired combination/break, no relations and unknown time; no mutation requests");
} finally {
  await browser?.close();
  app?.kill();
  await new Promise((resolve) => backend.close(resolve));
}
