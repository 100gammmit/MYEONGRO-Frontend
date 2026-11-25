import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("next/script", () => ({
  default: ({ src }: { src: string }) => <script data-testid="adsense" data-src={src} />,
}));

import { AdSenseScript } from "./adsense-script";

const CLIENT = "ca-pub-1234567890123456";

describe("AdSenseScript", () => {
  const reload = vi.fn();
  const originalLocation = window.location;

  afterEach(() => {
    document.querySelectorAll("body > a").forEach((link) => link.remove());
    reload.mockReset();
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  // Plain anchors stand in for rendered links; Next.js Link handles clicks after the capture phase.
  function addLink(href: string, text: string): HTMLAnchorElement {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    document.body.append(link);
    return link;
  }

  function stubReload() {
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, reload } });
  }

  it("loads nothing without a publisher ID", () => {
    navigation.pathname = "/zodiac";
    const { container } = render(<AdSenseScript client={null} />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("loads the script on ad pages and not on ad-free screens", () => {
    navigation.pathname = "/guide/tarot";
    const { getByTestId, unmount } = render(<AdSenseScript client={CLIENT} />);
    expect(getByTestId("adsense")).toHaveAttribute("data-src", expect.stringContaining(`client=${CLIENT}`));
    unmount();

    navigation.pathname = "/saju";
    const { container } = render(<AdSenseScript client={CLIENT} />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("reloads when leaving an ad page for an ad-free screen so no script stays behind", () => {
    stubReload();
    navigation.pathname = "/zodiac/rat";
    const { rerender } = render(<AdSenseScript client={CLIENT} />);

    navigation.pathname = "/faq";
    rerender(<AdSenseScript client={CLIENT} />);
    expect(reload).not.toHaveBeenCalled();

    navigation.pathname = "/records";
    rerender(<AdSenseScript client={CLIENT} />);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("lets links to ad-free screens load natively once the script is loaded", () => {
    navigation.pathname = "/zodiac";
    render(<AdSenseScript client={CLIENT} />);
    addLink("/records", "기록");
    addLink("/faq", "FAQ");
    addLink("/records", "새 탭").target = "_blank";
    const clientRouter = vi.fn();
    document.addEventListener("click", clientRouter);
    try {
      for (const [name, expected] of [["기록", 0], ["FAQ", 1], ["새 탭", 1]] as const) {
        clientRouter.mockClear();
        const link = [...document.querySelectorAll("a")].find((a) => a.textContent === name)!;
        link.addEventListener("click", (event) => event.preventDefault(), { once: true });
        link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
        expect(clientRouter).toHaveBeenCalledTimes(expected);
      }
    } finally {
      document.removeEventListener("click", clientRouter);
    }
  });

  it("does not intercept links before any script was loaded", () => {
    navigation.pathname = "/tarot";
    render(<AdSenseScript client={CLIENT} />);
    addLink("/records", "기록");
    const clientRouter = vi.fn();
    document.addEventListener("click", clientRouter);
    const link = [...document.querySelectorAll("a")].find((a) => a.textContent === "기록")!;
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
    document.removeEventListener("click", clientRouter);
    expect(clientRouter).toHaveBeenCalledTimes(1);
  });

  it("does not reload on ad-free screens when no script was ever loaded", () => {
    stubReload();
    navigation.pathname = "/tarot";
    const { rerender } = render(<AdSenseScript client={CLIENT} />);
    navigation.pathname = "/records";
    rerender(<AdSenseScript client={CLIENT} />);
    expect(reload).not.toHaveBeenCalled();
  });
});
