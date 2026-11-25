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
    reload.mockReset();
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

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

  it("does not reload on ad-free screens when no script was ever loaded", () => {
    stubReload();
    navigation.pathname = "/tarot";
    const { rerender } = render(<AdSenseScript client={CLIENT} />);
    navigation.pathname = "/records";
    rerender(<AdSenseScript client={CLIENT} />);
    expect(reload).not.toHaveBeenCalled();
  });
});
