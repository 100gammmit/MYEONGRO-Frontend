import { describe, expect, it, vi } from "vitest";

import {
  createReadingDeleteHandler,
  createReadingDetailHandler,
  createReadingListHandler,
  createReadingRetryHandler,
} from "./records-handler";

const completedReading = {
  id: "reading-1",
  kind: "tarot" as const,
  status: "completed" as const,
  title: "관계의 흐름",
  input: { question: "앞으로 어떻게 흘러갈까요?" },
  result: {
    title: "관계의 흐름",
    summary: "천천히 확인할 시기입니다.",
    sections: [{ heading: "현재", body: "대화를 이어가세요." }],
    guidance: ["서두르지 마세요."],
    disclaimer: "자기 성찰을 위한 참고 정보입니다.",
  },
  createdAt: "2026-06-12T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:01.000Z",
};

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    getUserId: vi.fn().mockResolvedValue("user-1"),
    listReadings: vi.fn().mockResolvedValue([completedReading]),
    getReading: vi.fn().mockResolvedValue(completedReading),
    deleteReading: vi.fn().mockResolvedValue(true),
    retryReading: vi.fn().mockResolvedValue(completedReading),
    ...overrides,
  };
}

describe("reading records handlers", () => {
  it("lists only the authenticated owner's active readings", async () => {
    const deps = dependencies();
    const response = await createReadingListHandler(deps)(
      new Request("https://fortune.test/api/readings"),
    );

    expect(response.status).toBe(200);
    expect(deps.listReadings).toHaveBeenCalledWith("user-1");
    expect(await response.json()).toEqual({ items: [completedReading] });
  });

  it("rejects record access without authentication", async () => {
    const deps = dependencies({
      getUserId: vi.fn().mockResolvedValue(null),
    });

    const responses = await Promise.all([
      createReadingListHandler(deps)(new Request("https://fortune.test/api/readings")),
      createReadingDetailHandler(deps)(
        new Request("https://fortune.test/api/readings/reading-1"),
        { params: Promise.resolve({ readingId: "reading-1" }) },
      ),
      createReadingDeleteHandler(deps)(
        new Request("https://fortune.test/api/readings/reading-1"),
        { params: Promise.resolve({ readingId: "reading-1" }) },
      ),
      createReadingRetryHandler(deps)(
        new Request("https://fortune.test/api/readings/reading-1/retry"),
        { params: Promise.resolve({ readingId: "reading-1" }) },
      ),
    ]);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401]);
    expect(deps.listReadings).not.toHaveBeenCalled();
    expect(deps.getReading).not.toHaveBeenCalled();
    expect(deps.deleteReading).not.toHaveBeenCalled();
    expect(deps.retryReading).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing or foreign reading", async () => {
    const deps = dependencies({
      getReading: vi.fn().mockResolvedValue(null),
      deleteReading: vi.fn().mockResolvedValue(false),
    });

    const detail = await createReadingDetailHandler(deps)(
      new Request("https://fortune.test/api/readings/foreign"),
      { params: Promise.resolve({ readingId: "foreign" }) },
    );
    const deleted = await createReadingDeleteHandler(deps)(
      new Request("https://fortune.test/api/readings/foreign"),
      { params: Promise.resolve({ readingId: "foreign" }) },
    );

    expect(detail.status).toBe(404);
    expect(deleted.status).toBe(404);
  });

  it("soft deletes an owned reading", async () => {
    const deps = dependencies();
    const response = await createReadingDeleteHandler(deps)(
      new Request("https://fortune.test/api/readings/reading-1"),
      { params: Promise.resolve({ readingId: "reading-1" }) },
    );

    expect(response.status).toBe(204);
    expect(deps.deleteReading).toHaveBeenCalledWith("user-1", "reading-1");
  });

  it("retries an owned failed reading without exposing provider errors", async () => {
    const successDeps = dependencies();
    const success = await createReadingRetryHandler(successDeps)(
      new Request("https://fortune.test/api/readings/reading-1/retry"),
      { params: Promise.resolve({ readingId: "reading-1" }) },
    );

    expect(success.status).toBe(200);
    expect(successDeps.retryReading).toHaveBeenCalledWith("user-1", "reading-1");

    const failureDeps = dependencies({
      retryReading: vi.fn().mockRejectedValue(new Error("secret provider detail")),
    });
    const failure = await createReadingRetryHandler(failureDeps)(
      new Request("https://fortune.test/api/readings/reading-1/retry"),
      { params: Promise.resolve({ readingId: "reading-1" }) },
    );

    expect(failure.status).toBe(409);
    expect(await failure.json()).toEqual({
      error: "재시도할 수 없는 리딩입니다.",
    });
  });
});
