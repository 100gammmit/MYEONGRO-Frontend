import { describe, expect, it } from "vitest";

import { createGuestTransferPostHandler } from "./handler";

describe("POST /api/consents/transfer", () => {
  it("is gone for public callers because OAuth callback owns guest transfer", async () => {
    const post = createGuestTransferPostHandler();

    const response = await post(new Request("http://localhost/api/consents/transfer", {
      method: "POST",
      body: JSON.stringify({
        guestSessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      }),
    }));

    expect(response.status).toBe(410);
  });

  it("route module is also blocked without reading a guest id from the body", async () => {
    const { POST } = await import("./route");

    const response = await POST(new Request("http://localhost/api/consents/transfer", {
      method: "POST",
      body: JSON.stringify({
        guestSessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      }),
    }));

    expect(response.status).toBe(410);
  });
});
