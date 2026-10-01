import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

import { ReadingRecordActions } from "./reading-record-actions";

describe("ReadingRecordActions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    refresh.mockReset();
    push.mockReset();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  });

  it("keeps the record when the confirmation is cancelled", () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    render(<ReadingRecordActions readingCompleted readingId="reading-1" />);

    fireEvent.click(screen.getByRole("button", { name: "기록 삭제" }));

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("서비스에서 개별 복구할 수 없고"),
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "기록 삭제" })).toBeEnabled();
  });

  it("does not claim lost credits for a failed reading", () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<ReadingRecordActions readingCompleted={false} readingId="reading-1" />);

    fireEvent.click(screen.getByRole("button", { name: "기록 삭제" }));

    const [message] = vi.mocked(window.confirm).mock.calls[0];
    expect(message).toContain("서비스에서 개별 복구할 수 없습니다");
    expect(message).not.toContain("크레딧");
  });

  it("deletes a reading and returns to records", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    render(<ReadingRecordActions readingCompleted readingId="reading-1" />);

    fireEvent.click(screen.getByRole("button", { name: "기록 삭제" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/records"));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/readings/reading-1",
      { method: "DELETE" },
    );
  });

  it("shows a recoverable error when deletion fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    render(<ReadingRecordActions readingCompleted readingId="reading-1" />);

    fireEvent.click(screen.getByRole("button", { name: "기록 삭제" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("기록을 삭제하지 못했어요");
    expect(screen.getByRole("button", { name: "기록 삭제" })).toBeEnabled();
  });
});
