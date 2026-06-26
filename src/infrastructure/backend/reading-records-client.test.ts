import { beforeEach, describe, expect, it, vi } from "vitest";

import { BackendReadingRecordsClient } from "./reading-records-client";

describe("BackendReadingRecordsClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("BACKEND_API_URL", "https://spring.test/");
  });

  it("loads reading records with the Spring session cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ items: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const items = await new BackendReadingRecordsClient("JSESSIONID=session").list();

    expect(items).toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith("https://spring.test/api/readings", {
      headers: expect.any(Headers),
      cache: "no-store",
    });
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("cookie")).toBe("JSESSIONID=session");
    expect(headers.has("Authorization")).toBe(false);
  });
});
