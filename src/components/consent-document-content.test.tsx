import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConsentDocumentContent } from "./consent-document-content";

describe("legal document effective dates", () => {
  it.each([
    ["privacy", "2026-11-07", "2026-11-07"],
    ["terms", "2026-09-27", "2026-10-02"],
    ["ai-overseas-transfer", "2026-09-25", "2026-10-02"],
  ] as const)("uses the independent date for %s without changing consent documents", (documentType, version, date) => {
    render(<ConsentDocumentContent documentType={documentType} />);
    expect(screen.getByText(`문서 버전 ${version} · 시행일 ${date}`)).toBeInTheDocument();
  });
});

describe("legal document tables", () => {
  it.each(["privacy", "ai-overseas-transfer"] as const)(
    "names every %s table cell after its column so phones can stack the rows",
    (documentType) => {
      const { container } = render(<ConsentDocumentContent documentType={documentType} />);
      const tables = [...container.querySelectorAll("table")];
      for (const table of tables) {
        const columns = [...table.querySelectorAll("thead th")].map((th) => th.textContent);
        for (const row of table.querySelectorAll("tbody tr")) {
          const cells = [...row.querySelectorAll("td")];
          // A row-header column comes first; cells fill the remaining columns from the right.
          const offset = columns.length - cells.length;
          cells.forEach((cell, index) => {
            expect(cell.getAttribute("data-label")).toBe(columns[offset + index]);
          });
        }
      }
    },
  );
});
