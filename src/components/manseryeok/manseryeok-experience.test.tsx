import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import fixture from "@/test-fixtures/manseryeok-chart.json";

import { BIRTH_HANDOFF_KEY } from "@/domain/saju/birth-handoff";

import { ManseryeokExperience } from "./manseryeok-experience";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const CALCULATE = "https://api.example.test/api/saju/calculations";
const PLACES = "https://api.example.test/api/saju/calculations/birth-places";
const places = {
  version: "kr-admin-v1",
  provinces: [{ provinceCode: "11", provinceName: "서울특별시", cities: [{ cityCode: "11110", cityName: "종로구" }] }],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function renderPage() {
  return render(<ManseryeokExperience birthPlacesEndpoint={PLACES} calculateEndpoint={CALCULATE} />);
}

async function fillExact() {
  fireEvent.change(screen.getByLabelText("양력 생년월일"), { target: { value: "1992-08-17" } });
  fireEvent.click(screen.getByRole("radio", { name: /정확히 알아요/ }));
  fireEvent.change(screen.getByLabelText("태어난 시"), { target: { value: "14" } });
  fireEvent.change(screen.getByLabelText("태어난 분"), { target: { value: "30" } });
  await waitFor(() => expect(screen.getByLabelText("출생 시·도")).toBeEnabled());
  fireEvent.change(screen.getByLabelText("출생 시·도"), { target: { value: "11" } });
  fireEvent.click(screen.getByRole("radio", { name: "남성" }));
}

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("ManseryeokExperience", () => {
  it("opens the calculate button only after the age and consent check", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json(places));
    renderPage();
    await fillExact();
    const button = screen.getByRole("button", { name: "만세력 계산하기" });
    expect(button).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    expect(button).toBeEnabled();
  });

  it("calculates this year without a reference year and shows the result without birth data in the address", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(places))
      .mockResolvedValueOnce(json(fixture));
    renderPage();
    await fillExact();
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    fireEvent.click(screen.getByRole("button", { name: "만세력 계산하기" }));

    expect(await screen.findByRole("heading", { level: 1, name: "만세력 결과" })).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(CALCULATE);
    expect(init.credentials).toBe("omit");
    const body = JSON.parse(String(init.body));
    expect(body).not.toHaveProperty("referenceYear");
    expect(body.birthProfile).toMatchObject({ birthTime: "14:30", provinceCode: "11", luckDirectionBasis: "male" });
    expect(window.history.state).toMatchObject({ manseryeokStep: "result" });
    expect(window.location.search).toBe("?step=result");
    expect(window.location.href).not.toMatch(/1992|14:30/);
    expect(within(screen.getByRole("region", { name: "입력한 정보와 보정한 시각" })).getByText("13:54")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "결과 목차" })).toBeInTheDocument();
    // The luck strip reads the display periods: hanja glyphs plus the stem ten god.
    const luck = within(screen.getByRole("list", { name: "대운 흐름" })).getAllByRole("listitem");
    expect(luck).toHaveLength(fixture.luckCycle.periods.length);
    expect(luck[2]).toHaveTextContent(/2019–2028.*27.*정관.*辛.*亥/);
    const firstPeriod = fixture.luckCycle.periods[0];
    expect(luck[0]).toHaveTextContent(`${firstPeriod.startYear}–${firstPeriod.endYear}${fixture.luckCycle.integerStartAge}${firstPeriod.stemTenGod}`);
    expect(screen.getByRole("list", { name: "대운 흐름" })).not.toHaveTextContent("세");
    // Chart ten gods and element counts open their dictionary pages, read with a "뜻 보기" name.
    const tenGodLinks = screen.getAllByRole("link", { name: / 뜻 보기$/ }).filter((link) => link.getAttribute("href")?.startsWith("/saju/dictionary/ten-gods/"));
    expect(tenGodLinks.length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /^목 \d개, 목 뜻 보기$/ })).toHaveAttribute("href", "/saju/dictionary/elements/wood");
    // Both sideways strips take keyboard focus so they can be scrolled without a pointer.
    expect(screen.getByRole("list", { name: "대운 흐름" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("list", { name: "세운" })).toHaveAttribute("tabindex", "0");
  });

  it("asks for next year's monthly flow by number and marks a relation in the chart", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(places))
      .mockResolvedValueOnce(json(fixture))
      .mockResolvedValueOnce(json({ ...fixture, referenceYear: 2027, monthlyCalendar: { ...fixture.monthlyCalendar, targetYear: 2027, months: fixture.monthlyCalendar.months.map((month) => ({ ...month, periods: month.periods.map((period) => ({ ...period, startInclusive: period.startInclusive.replace(/^2026|^2027/, (y) => String(Number(y) + 1)), endExclusive: period.endExclusive.replace(/^2026|^2027/, (y) => String(Number(y) + 1)) })) })) } }));
    renderPage();
    await fillExact();
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    fireEvent.click(screen.getByRole("button", { name: "만세력 계산하기" }));
    await screen.findByRole("heading", { level: 1, name: "만세력 결과" });

    fireEvent.click(screen.getByRole("button", { name: /원진/ }));
    expect(screen.getByRole("status")).toHaveTextContent("원진");

    fireEvent.click(screen.getByRole("button", { name: /2027년 · 내년/ }));
    expect(await screen.findByRole("list", { name: "2027년 월운" })).toBeInTheDocument();
    expect(JSON.parse(String((fetchMock.mock.calls[2] as [string, RequestInit])[1].body)).referenceYear).toBe(2027);
  });

  it("drops a late next-year answer that belongs to an earlier calculation", async () => {
    let answerStale: (response: Response) => void = () => {};
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(places))
      .mockResolvedValueOnce(json(fixture))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { answerStale = resolve; }))
      .mockResolvedValueOnce(json(fixture))
      .mockImplementationOnce(() => new Promise<Response>(() => {}));
    renderPage();
    await fillExact();
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    fireEvent.click(screen.getByRole("button", { name: "만세력 계산하기" }));
    await screen.findByRole("heading", { level: 1, name: "만세력 결과" });
    fireEvent.click(screen.getByRole("button", { name: /2027년 · 내년/ }));

    fireEvent.click(screen.getByRole("button", { name: "입력 바꾸기" }));
    fireEvent.popState(window, { state: null });
    fireEvent.click(await screen.findByRole("button", { name: "만세력 계산하기" }));
    await screen.findByRole("heading", { level: 1, name: "만세력 결과" });
    answerStale(json({ ...fixture, referenceYear: 2027 }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    fireEvent.click(screen.getByRole("button", { name: /2027년 · 내년/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
  });

  it("goes back to the filled form and starts over with only the calculation settings kept", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(places))
      .mockResolvedValueOnce(json(fixture));
    renderPage();
    await fillExact();
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    fireEvent.click(screen.getByRole("button", { name: "만세력 계산하기" }));
    await screen.findByRole("heading", { level: 1, name: "만세력 결과" });

    fireEvent.click(screen.getByRole("button", { name: "다른 생년월일 계산하기" }));
    fireEvent.popState(window, { state: null });
    expect(await screen.findByRole("heading", { level: 1, name: "만세력 계산" })).toBeInTheDocument();
    expect(screen.getByLabelText("양력 생년월일")).toHaveValue("");
    expect(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ })).not.toBeChecked();
  });

  it("says it is retrying when the server is busy and shows the result once it frees up", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(places))
      .mockResolvedValueOnce(json({ code: "SAJU_CALCULATION_BUSY" }, 503))
      .mockResolvedValueOnce(json(fixture));
    renderPage();
    await fillExact();
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    fireEvent.click(screen.getByRole("button", { name: "만세력 계산하기" }));

    expect(await screen.findByText("요청이 몰려 잠깐 기다리고 있어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도하는 중이에요" })).toBeDisabled();
    expect(await screen.findByRole("heading", { level: 1, name: "만세력 결과" }, { timeout: 4000 })).toBeInTheDocument();
  });

  it("leaves the hour pillar and luck cycle empty with their reasons when the time and gender are not given", async () => {
    const unknown = structuredClone(fixture);
    Object.assign(unknown.chart.pillars, { time: null });
    Object.assign(unknown.hiddenStems, { time: null });
    Object.assign(unknown.twelveStages, { time: null });
    Object.assign(unknown, { luckCycle: null, timeCorrection: null });
    Object.assign(unknown.uncertainty, { precision: "unknown", candidateCount: 12 });
    Object.assign(unknown.appliedOptions, { coordinateSource: "reference", longitude: 127.5, birthTimeKnown: false });
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(places))
      .mockResolvedValueOnce(json(unknown));
    renderPage();
    fireEvent.change(screen.getByLabelText("양력 생년월일"), { target: { value: "1992-08-17" } });
    fireEvent.click(screen.getByRole("radio", { name: /몰라요/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    fireEvent.click(screen.getByRole("button", { name: "만세력 계산하기" }));

    await screen.findByRole("heading", { level: 1, name: "만세력 결과" });
    expect(screen.getByText("시각을 몰라 비워 뒀어요")).toBeInTheDocument();
    expect(screen.getByText("보정할 시각이 없어서 보정 시각은 못 보여 드려요.")).toBeInTheDocument();
    expect(screen.getByText("성별을 고르지 않아 대운은 계산하지 않았어요.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "성별 고르고 다시 계산하기" }));
    fireEvent.popState(window, { state: null });
    await screen.findByRole("heading", { level: 1, name: "만세력 계산" });
    await waitFor(() => expect(screen.getByRole("radio", { name: "남성" })).toHaveFocus());
  });

  it("starts at the form with a clean address after a reload on the result step", async () => {
    window.history.replaceState(null, "", "/manseryeok?step=result");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(json(places));
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "만세력 계산" })).toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("hands the input to the AI saju form through this tab only", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(places))
      .mockResolvedValueOnce(json(fixture));
    renderPage();
    await fillExact();
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    fireEvent.click(screen.getByRole("button", { name: "만세력 계산하기" }));
    await screen.findByRole("heading", { level: 1, name: "만세력 결과" });

    fireEvent.click(screen.getByRole("button", { name: "이 명식으로 AI 풀이 받기" }));
    expect(router.push).toHaveBeenCalledWith("/saju");
    const saved = JSON.parse(window.sessionStorage.getItem(BIRTH_HANDOFF_KEY) ?? "{}");
    expect(saved.values).toMatchObject({ birthDate: "1992-08-17", birthHour: "14", birthMinute: "30", provinceCode: "11" });
    expect(window.localStorage.length).toBe(0);
    window.sessionStorage.clear();
  });

  it("treats a missing API like any other failure and keeps the input", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(places))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));
    renderPage();
    await fillExact();
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    fireEvent.click(screen.getByRole("button", { name: "만세력 계산하기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("계산하지 못했어요");
    expect(screen.getByRole("heading", { level: 1, name: "만세력 계산" })).toBeInTheDocument();
    expect(screen.getByLabelText("양력 생년월일")).toHaveValue("1992-08-17");
  });

  it("locks the button for a minute after a rate limit and keeps the input", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(places))
      .mockResolvedValueOnce(json({ code: "SAJU_CALCULATION_RATE_LIMITED" }, 429));
    renderPage();
    await fillExact();
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    fireEvent.click(screen.getByRole("button", { name: "만세력 계산하기" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("1분 뒤에 다시 시도해 주세요.");
    expect(screen.getByRole("button", { name: "만세력 계산하기" })).toBeDisabled();
    expect(screen.getByLabelText("양력 생년월일")).toHaveValue("1992-08-17");
  });

  it("returns a field error to its input", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(json(places))
      .mockResolvedValueOnce(json({ code: "INVALID_BIRTH_DATE", field: "birthProfile.birthDate", error: "1900년부터 2099년 사이의 날짜만 계산할 수 있어요." }, 400));
    renderPage();
    await fillExact();
    fireEvent.click(screen.getByRole("checkbox", { name: /만 14세 이상이에요/ }));
    fireEvent.click(screen.getByRole("button", { name: "만세력 계산하기" }));

    const summary = await screen.findByRole("alert");
    expect(within(summary).getByText("1900년부터 2099년 사이의 날짜만 계산할 수 있어요.")).toBeInTheDocument();
    expect(screen.getByLabelText("양력 생년월일")).toHaveAttribute("aria-invalid", "true");
  });
});
