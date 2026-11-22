import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { EMPTY_BIRTH_VALUES, type SajuBirthValues } from "@/domain/saju/birth-input";

import { SajuBirthFields } from "./saju-birth-fields";

function Harness() {
  const [values, setValues] = useState<SajuBirthValues>(EMPTY_BIRTH_VALUES);
  return <SajuBirthFields catalog={null} catalogStatus="loading" idPrefix="t" onChange={setValues} values={values} />;
}

function dateInput() {
  return screen.getByLabelText(/양력 생년월일/) as HTMLInputElement;
}

describe("birth date field", () => {
  it("is a plain text field that shows eight digits as YYYY-MM-DD and confirms the day", () => {
    render(<Harness />);
    const input = dateInput();
    expect(input).toHaveAttribute("type", "text");
    expect(input).not.toHaveAttribute("inputmode");
    expect(input).toHaveAttribute("placeholder", "예: 1992-08-17");
    expect(screen.getByText("숫자 8자리만 입력하면 돼요. 하이픈은 자동으로 들어가요.")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "199208" } });
    expect(input).toHaveValue("1992-08");
    fireEvent.change(input, { target: { value: "1992-0817" } });
    expect(input).toHaveValue("1992-08-17");
    expect(screen.getByText("1992년 8월 17일 월요일 · 양력")).toBeInTheDocument();
  });

  it("takes the digit before a hyphen when the hyphen alone is deleted", () => {
    render(<Harness />);
    const input = dateInput();
    fireEvent.change(input, { target: { value: "19920" } });
    expect(input).toHaveValue("1992-0");
    // Backspace right after the hyphen of "1992-0" removes only the hyphen: "19920", caret before the 0.
    fireEvent.change(input, { target: { value: "19920", selectionStart: 4, selectionEnd: 4 } });
    // The 2 before the hyphen goes with it; otherwise reformatting would put the hyphen straight back.
    expect(input).toHaveValue("1990");
  });

  it("flags an impossible or out-of-range date as soon as all eight digits are in", () => {
    render(<Harness />);
    const input = dateInput();
    fireEvent.change(input, { target: { value: "19920231" } });
    expect(screen.getByText("2월 31일은 없는 날짜예요.")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(input, { target: { value: "18991231" } });
    expect(screen.getByText("1900년부터 오늘까지의 날짜만 계산할 수 있어요.")).toBeInTheDocument();
  });
});
