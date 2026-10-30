import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConsentDocumentContent } from "./consent-document-content";

describe("legal document effective dates", () => {
  it.each([
    ["privacy", "2026-10-31", "2026-10-31"],
    ["terms", "2026-09-27", "2026-10-02"],
    ["ai-overseas-transfer", "2026-09-25", "2026-10-02"],
  ] as const)("uses the independent date for %s without changing consent documents", (documentType, version, date) => {
    render(<ConsentDocumentContent documentType={documentType} />);
    expect(screen.getByText(`문서 버전 ${version} · 시행일 ${date}`)).toBeInTheDocument();
  });
});
