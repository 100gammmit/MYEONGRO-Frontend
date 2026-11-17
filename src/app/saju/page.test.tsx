import type { ReactElement } from "react";
import { vi } from "vitest";

vi.mock("@/components/saju-experience", () => ({ SajuExperience: () => null }));

import SajuPage from "./page";

async function initialReportType(report?: string | string[]) {
  const element = (await SajuPage({ searchParams: Promise.resolve(report === undefined ? {} : { report }) })) as ReactElement<{ initialReportType: string }>;
  return element.props.initialReportType;
}

describe("SajuPage", () => {
  it("preselects the annual report only for ?report=annual", async () => {
    expect(await initialReportType("annual")).toBe("annual_monthly");
    expect(await initialReportType()).toBe("birth_annual_question");
    expect(await initialReportType("monthly")).toBe("birth_annual_question");
    expect(await initialReportType(["annual", "annual"])).toBe("birth_annual_question");
  });
});
