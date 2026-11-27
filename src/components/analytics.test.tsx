import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetAnalyticsForTests } from "@/infrastructure/analytics-client";

import { Analytics } from "./analytics";
import { TrackOnView } from "./track-on-view";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("next/script", () => ({
  default: ({ src }: { src: string }) => <script data-testid="gtag" data-src={src} />,
}));

const READING_ID = "6f1c2a9e-3b4d-4e5f-8a7b-9c0d1e2f3a4b";

// gtag pushes its arguments objects; copied to arrays they are easy to compare.
function commands(): unknown[][] {
  return (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
}

function visit(path: string) {
  const url = new URL(path, window.location.origin);
  window.history.replaceState(null, "", url.pathname + url.search);
  navigation.pathname = url.pathname;
}

describe("Analytics", () => {
  beforeEach(() => {
    resetAnalyticsForTests();
    delete window.dataLayer;
    delete window.gtag;
    document.title = "띠별 신년운세 | 명로";
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("loads gtag.js and configures it without automatic page views or Google signals", () => {
    visit("/zodiac/horse");
    const { getByTestId } = render(<Analytics measurementId="G-AB12CD34EF" />);

    expect(getByTestId("gtag")).toHaveAttribute("data-src", "https://www.googletagmanager.com/gtag/js?id=G-AB12CD34EF");
    expect(commands()).toContainEqual(["config", "G-AB12CD34EF", {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    }]);
  });

  it("sends a page view with only the campaign tags kept", () => {
    visit("/zodiac/horse?utm_source=instagram&utm_medium=social&utm_campaign=2027_zodiac&fbclid=abc");
    render(<Analytics measurementId="G-AB12CD34EF" />);

    expect(commands().slice(-2)).toEqual([
      ["set", {
        page_location: `${window.location.origin}/zodiac/horse?utm_source=instagram&utm_medium=social&utm_campaign=2027_zodiac`,
        page_referrer: "",
        page_title: "띠별 신년운세 | 명로",
      }],
      ["event", "page_view"],
    ]);
  });

  it("hides the reading ID, query and title of a private page, and names the previous page as referrer", () => {
    visit("/tarot");
    const { rerender } = render(<Analytics measurementId="G-AB12CD34EF" />);

    visit(`/tarot/results/${READING_ID}?question=secret`);
    document.title = "비공개 | 명로";
    rerender(<Analytics measurementId="G-AB12CD34EF" />);

    expect(commands().slice(-2)).toEqual([
      ["set", {
        page_location: `${window.location.origin}/tarot/results/:id`,
        page_referrer: `${window.location.origin}/tarot`,
        page_title: "명로",
      }],
      ["event", "page_view"],
    ]);
    expect(JSON.stringify(commands())).not.toContain(READING_ID);
    expect(JSON.stringify(commands())).not.toContain("secret");
  });

  it("sends a page event after the page view that sets its address", () => {
    visit("/tarot/daily/AbCdEf1234");
    render(
      <>
        <Analytics measurementId="G-AB12CD34EF" />
        <TrackOnView event={{ name: "daily_card_share_view" }} />
      </>,
    );

    expect(commands().slice(-3).map((command) => command.slice(0, 2))).toEqual([
      ["set", expect.objectContaining({ page_location: `${window.location.origin}/tarot/daily/AbCdEf1234` })],
      ["event", "page_view"],
      ["event", "daily_card_share_view"],
    ]);
  });
});
