import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import GlobalError from "./global-error";

describe("GlobalError", () => {
  it("renders its own document with a retry and a way home", () => {
    const markup = renderToStaticMarkup(<GlobalError />);

    expect(markup).toMatch(/^<html lang="ko" data-theme="dark">/);
    expect(markup).toContain("잠시 문제가 생겼어요");
    expect(markup).toContain('href="/"');
    expect(markup).toContain("다시 시도");
  });
});
