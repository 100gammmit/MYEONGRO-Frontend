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
  });

  it("deletes a reading and returns to records", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    render(<ReadingRecordActions readingId="reading-1" retryable={false} />);

    fireEvent.click(screen.getByRole("button", { name: "기록 삭제" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/records"));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/readings/reading-1",
      { method: "DELETE" },
    );
  });

  it("retries a failed reading and refreshes the detail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ reading: {} }));
    render(<ReadingRecordActions readingId="reading-1" retryable />);

    fireEvent.click(screen.getByRole("button", { name: "다시 생성" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/readings/reading-1/retry",
      { method: "POST" },
    );
  });

  it("opens the canonical saju result URL after a successful retry", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      reading: { id: "reading-1", status: "completed" },
    }));
    render(
      <ReadingRecordActions
        readingId="reading-1"
        retryable
        retrySuccessHref="/saju/results/reading-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 생성" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/saju/results/reading-1"));
    expect(refresh).toHaveBeenCalled();
  });
});
