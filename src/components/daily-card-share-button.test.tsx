import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDailyCardContent } from "@/domain/daily-card-free";

import { DailyCardShareButton } from "./daily-card-share-button";

const content = getDailyCardContent("major-17-star", 2)!;
const SHARE_PATH = "/tarot/daily/AbCdEf1234";

function renderButton() {
  render(<DailyCardShareButton cardId="major-17-star" content={content} variantIndex={2} />);
  return screen.getByRole("button", { name: "오늘의 카드 공유하기" });
}

function mockShareApi(response: Response = Response.json({ path: SHARE_PATH })) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
}

function setNavigator(key: "share" | "clipboard", value: unknown) {
  Object.defineProperty(navigator, key, { configurable: true, value });
}

// Touch-first screens match "(pointer: coarse)"; a mouse-driven desktop does not.
function setTouchDevice(touch: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(pointer: coarse)" && touch }));
}

describe("DailyCardShareButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setNavigator("share", undefined);
    setNavigator("clipboard", undefined);
    setTouchDevice(true);
    window.gtag = vi.fn();
  });

  afterEach(() => {
    setNavigator("share", undefined);
    setNavigator("clipboard", undefined);
    vi.unstubAllGlobals();
    delete window.gtag;
  });

  it("copies the link on a desktop even when the browser offers a share sheet", async () => {
    setTouchDevice(false);
    mockShareApi();
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator("share", share);
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator("clipboard", { writeText });

    fireEvent.click(renderButton());

    expect(await screen.findByText("링크를 복사했어요")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}${SHARE_PATH}`);
    expect(share).not.toHaveBeenCalled();
    expect(window.gtag).toHaveBeenCalledWith("event", "share", { method: "copy_link", content_type: "daily_card" });
  });

  it("asks for this result's link and opens the phone's share sheet", async () => {
    const fetchMock = mockShareApi();
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator("share", share);

    fireEvent.click(renderButton());

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ cardId: "major-17-star", variantIndex: 2 });
    expect(share).toHaveBeenCalledWith({
      title: "오늘의 카드: 별",
      text: `오늘의 카드: 별 · ${content.title}`,
      url: `${window.location.origin}${SHARE_PATH}`,
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await waitFor(() => expect(window.gtag).toHaveBeenCalledWith(
      "event", "share", { method: "share_sheet", content_type: "daily_card" },
    ));
  });

  it("fetches the link as the result shows, so the click opens the sheet at once", async () => {
    const fetchMock = mockShareApi();
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator("share", share);

    const button = renderButton();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => undefined);
    fireEvent.click(button);

    // Called inside the click itself, while the browser still counts it as the user's gesture.
    expect(share).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("copies the link when the share sheet is refused", async () => {
    mockShareApi();
    setNavigator("share", vi.fn().mockRejectedValue(new DOMException("no gesture", "NotAllowedError")));
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator("clipboard", { writeText });

    fireEvent.click(renderButton());

    expect(await screen.findByText("링크를 복사했어요")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}${SHARE_PATH}`);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("treats closing the share sheet as no error", async () => {
    mockShareApi();
    setNavigator("share", vi.fn().mockRejectedValue(new DOMException("closed", "AbortError")));

    const button = renderButton();
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("copies the link where there is no share sheet", async () => {
    mockShareApi();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator("clipboard", { writeText });

    fireEvent.click(renderButton());

    expect(await screen.findByText("링크를 복사했어요")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}${SHARE_PATH}`);
    await waitFor(() => expect(screen.queryByText("링크를 복사했어요")).not.toBeInTheDocument(), { timeout: 4000 });
  });

  it("says so when the link cannot be made", async () => {
    mockShareApi(Response.json({ message: "지원하지 않는 오늘의 카드입니다." }, { status: 400 }));
    const share = vi.fn();
    setNavigator("share", share);

    fireEvent.click(renderButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("공유 링크를 만들지 못했어요.");
    expect(share).not.toHaveBeenCalled();
  });

  it("asks for the link once while a request is in flight", async () => {
    let resolve: (response: Response) => void = () => undefined;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise((done) => { resolve = done; }));
    setNavigator("share", vi.fn().mockResolvedValue(undefined));

    const button = renderButton();
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    resolve(Response.json({ path: SHARE_PATH }));

    await waitFor(() => expect(button).toBeEnabled());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
