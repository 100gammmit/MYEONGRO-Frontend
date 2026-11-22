import { describe, expect, it } from "vitest";

import { birthDateConfirmation, birthDateProblem, birthDateProblemMessage, formatBirthDateInput, seoulToday } from "./birth-date";

describe("birth date input", () => {
  it("groups up to eight digits 4·2·2 and reads pasted dates the same way", () => {
    expect(formatBirthDateInput("1992")).toBe("1992");
    expect(formatBirthDateInput("19920")).toBe("1992-0");
    expect(formatBirthDateInput("1992081")).toBe("1992-08-1");
    for (const pasted of ["19920817", "1992-08-17", "1992.08.17", " 1992/08/17 ", "199208179"]) {
      expect(formatBirthDateInput(pasted), pasted).toBe("1992-08-17");
    }
    expect(formatBirthDateInput("abc")).toBe("");
  });

  it("tells an unfinished, an impossible and an out-of-range date apart", () => {
    const today = "2026-11-22";
    expect(birthDateProblem("1992-08", today)).toBe("incomplete");
    expect(birthDateProblem("1992-02-31", today)).toBe("invalid");
    expect(birthDateProblem("2023-02-29", today)).toBe("invalid");
    expect(birthDateProblem("1900-02-29", today)).toBe("invalid");
    expect(birthDateProblem("2000-02-29", today)).toBeNull();
    expect(birthDateProblem("1899-12-31", today)).toBe("outOfRange");
    expect(birthDateProblem("1900-01-01", today)).toBeNull();
    expect(birthDateProblem("2026-11-22", today)).toBeNull();
    expect(birthDateProblem("2026-11-23", today)).toBe("outOfRange");
  });

  it("words each problem for the field and confirms a real date with its weekday", () => {
    expect(birthDateProblemMessage("1992-08-1", "incomplete")).toBe("숫자 8자리로 입력해 주세요 (예: 1992-08-17)");
    expect(birthDateProblemMessage("1992-02-31", "invalid")).toBe("2월 31일은 없는 날짜예요.");
    expect(birthDateProblemMessage("1899-12-31", "outOfRange")).toBe("1900년부터 오늘까지의 날짜만 계산할 수 있어요.");
    expect(birthDateConfirmation("1992-08-17")).toBe("1992년 8월 17일 월요일 · 양력");
    expect(birthDateConfirmation("2000-02-29")).toBe("2000년 2월 29일 화요일 · 양력");
    expect(birthDateConfirmation("1992-02-31")).toBeNull();
  });

  it("takes today in Korea, not in the browser's zone", () => {
    expect(seoulToday(new Date("2026-11-21T15:30:00Z"))).toBe("2026-11-22");
  });
});
