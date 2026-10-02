import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import GlobalError from "./global-error";

describe("GlobalError", () => {
  it("renders its own document without exposing the error", () => {
    const markup = renderToStaticMarkup(
      <GlobalError error={new Error("internal detail: layout failed")} reset={() => {}} />,
    );

    expect(markup).toMatch(/^<html lang="ko" data-theme="dark">/);
    expect(markup).toContain("잠시 문제가 생겼어요");
    expect(markup).toContain('href="/"');
    expect(markup).toContain("다시 시도");
    expect(markup).not.toContain("internal detail");
  });
});
