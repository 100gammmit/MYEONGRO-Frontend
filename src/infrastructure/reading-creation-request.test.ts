import { describe, expect, it, vi } from "vitest";

import { postReadingRequest, RECOVERY_DEADLINE_MS, RECOVERY_INTERVAL_MS } from "./reading-creation-request";

const BODY = { requestId: "11111111-1111-4111-8111-111111111111", question: "q" };
const json = (status: number, value: unknown) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
const edge = (status: number) => new Response("<html>504 Gateway Timeout ERROR</html>", { status, headers: { "content-type": "text/html" } });

function harness(answers: Array<Response | Error>) {
  let clock = 0;
  const fetcher = vi.fn(async () => {
    const next = answers.shift();
    if (!next) throw new Error("no more answers");
    if (next instanceof Error) throw next;
    return next;
  });
  const wait = vi.fn(async (milliseconds: number) => { clock += milliseconds; });
  const onRecovering = vi.fn();
  return { fetcher, wait, onRecovering, now: () => clock, sentBodies: () => fetcher.mock.calls.map((call) => (call as unknown[])[1] as RequestInit).map((init) => init.body) };
}

describe("postReadingRequest", () => {
  it("checks a lost answer again with the same body until the replayed reading arrives", async () => {
    const h = harness([edge(504), json(409, { code: "READING_GENERATION_IN_PROGRESS" }), json(200, { reading: { id: "r1" } })]);
    const outcome = await postReadingRequest("/api/saju/readings", BODY, h);
    expect(outcome.kind).toBe("response");
    if (outcome.kind !== "response") return;
    expect(outcome.response.status).toBe(200);
    expect(await outcome.response.json()).toEqual({ reading: { id: "r1" } });
    expect(h.fetcher).toHaveBeenCalledTimes(3);
    expect(new Set(h.sentBodies())).toEqual(new Set([JSON.stringify(BODY)]));
    expect(h.onRecovering).toHaveBeenCalledTimes(1);
    expect(h.wait).toHaveBeenCalledWith(RECOVERY_INTERVAL_MS);
  });

  it("checks again after an edge 502 or 503 without JSON", async () => {
    const h = harness([edge(502), edge(503), json(200, { ok: true })]);
    const outcome = await postReadingRequest("/api/tarot/readings", BODY, h);
    expect(outcome.kind === "response" && outcome.response.status).toBe(200);
    expect(h.onRecovering).toHaveBeenCalledTimes(1);
  });

  it("rejects a connection error at once instead of waiting", async () => {
    const h = harness([new TypeError("network")]);
    await expect(postReadingRequest("/api/saju/readings", BODY, h)).rejects.toThrow("network");
    expect(h.wait).not.toHaveBeenCalled();
  });

  it("returns answers that settle the request as they are", async () => {
    for (const answer of [
      json(502, { code: "BACKEND_UNAVAILABLE", message: "요청을 처리할 서버에 연결하지 못했습니다." }),
      json(409, { code: "READING_GENERATION_IN_PROGRESS" }),
      json(500, { code: "OPENAI_READING_GENERATION_FAILED" }),
      new Response(null, { status: 401 }),
    ]) {
      const h = harness([answer]);
      const outcome = await postReadingRequest("/api/saju/readings", BODY, h);
      expect(outcome.kind === "response" && outcome.response.status).toBe(answer.status);
      expect(h.fetcher).toHaveBeenCalledTimes(1);
      expect(h.onRecovering).not.toHaveBeenCalled();
    }
  });

  it("returns a failure the replay reports instead of waiting on", async () => {
    const h = harness([edge(504), json(500, { code: "OPENAI_READING_GENERATION_FAILED" })]);
    const outcome = await postReadingRequest("/api/saju/readings", BODY, h);
    expect(outcome.kind === "response" && outcome.response.status).toBe(500);
  });

  it("gives up as unresolved before the backend fails a stuck generation", async () => {
    const answers = [edge(504), ...Array.from({ length: 200 }, () => json(409, { code: "READING_GENERATION_IN_PROGRESS" }))];
    const h = harness(answers);
    const outcome = await postReadingRequest("/api/saju/readings", BODY, h);
    expect(outcome).toEqual({ kind: "unresolved" });
    expect(h.now()).toBeLessThanOrEqual(RECOVERY_DEADLINE_MS);
    expect(h.onRecovering).toHaveBeenCalledTimes(1);
  });
});
