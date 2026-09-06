import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConsentSettings } from "./consent-settings";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConsentSettings", () => {
  it("shows and confirms withdrawal for an accepted AI transfer consent", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({
        status: { acceptedDocumentTypes: ["terms", "ai-overseas-transfer"] },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(<ConsentSettings />);

    const withdrawButton = await screen.findByRole("button", { name: "동의 철회" });
    fireEvent.click(withdrawButton);
    expect(screen.getByText(/신규 AI 타로·사주 리딩 생성이 중단/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "AI 국외이전 동의 철회" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "AI 리딩 정보 국외이전 동의를 철회했어요.",
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/consents/ai-overseas-transfer",
      { method: "DELETE", credentials: "same-origin" },
    );
  });

  it("keeps the current state and reports a withdrawal failure", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({
        status: { acceptedDocumentTypes: ["ai-overseas-transfer"] },
      }))
      .mockResolvedValueOnce(Response.json({ error: "failed" }, { status: 500 }));

    render(<ConsentSettings />);

    fireEvent.click(await screen.findByRole("button", { name: "동의 철회" }));
    fireEvent.click(screen.getByRole("button", { name: "AI 국외이전 동의 철회" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "동의를 철회하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
    );
    await waitFor(() => expect(
      screen.getByRole("button", { name: "AI 국외이전 동의 철회" }),
    ).toBeEnabled());
  });
});
