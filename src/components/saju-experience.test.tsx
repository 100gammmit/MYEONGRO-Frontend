import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearRememberedSajuBirthProfile,
  rememberSajuBirthProfile,
} from "@/domain/saju/draft-session";

import { SajuExperience } from "./saju-experience";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
const credits = vi.hoisted(() => ({
  state: {
    status: "ready",
    data: {
      dailyFreeGrant: 10,
      balance: { free: 10, paid: 0, total: 10 },
      nextResetAt: "2026-08-22T00:00:00+09:00",
      generationInProgress: false,
      costs: {
        tarot: {
          daily_one_card: 1,
          mind_three_card: 2,
          relationship_three_card: 2,
          choice_five_card: 3,
        },
        saju: 4,
      },
    },
  },
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("./reading-credit-provider", () => ({
  useReadingCredits: () => credits,
}));

const REQUIRED_CONSENTS = ["terms", "privacy", "sensitive-data"] as const;
const REQUEST_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_REQUEST_ID = "22222222-2222-4222-8222-222222222222";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

function consentStatus(hasAcceptedRequired: boolean) {
  return {
    status: {
      acceptedDocumentTypes: hasAcceptedRequired ? [...REQUIRED_CONSENTS] : [],
      requiredDocumentTypes: [...REQUIRED_CONSENTS],
      hasAcceptedRequired,
    },
  };
}

function birthPlaces() {
  return {
    version: "kr-admin-v1-province",
    provinces: [
      {
        provinceCode: "11",
        provinceName: "서울특별시",
      },
      {
        provinceCode: "36",
        provinceName: "세종특별자치시",
      },
    ],
  };
}

function createdReading() {
  return {
    reading: {
      id: "reading-1",
      kind: "saju",
      schemaVersion: 3,
      status: "completed",
    },
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

afterEach(() => {
  vi.restoreAllMocks();
  navigation.push.mockReset();
  clearRememberedSajuBirthProfile();
  credits.state.status = "ready";
  credits.state.data.balance = { free: 10, paid: 0, total: 10 };
  credits.state.data.generationInProgress = false;
  credits.refresh.mockReset();
});

async function startWithAcceptedConsent() {
  render(<SajuExperience />);
  await screen.findByRole("heading", { name: "양력 생년월일을 알려주세요" });
}

async function reachBirthPlace(precision: "exact" | "approximate" | "unknown" = "unknown") {
  fireEvent.change(screen.getByLabelText("양력 생년월일"), { target: { value: "1992-08-17" } });
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  fireEvent.click(screen.getByRole("radio", {
    name: precision === "exact" ? /정확히 알아요/
      : precision === "approximate" ? /대략적으로 알아요/
        : /시간을 몰라요/,
  }));
  if (precision !== "unknown") {
    fireEvent.change(screen.getByLabelText("태어난 시각"), { target: { value: "14:30" } });
  }
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  await screen.findByRole("heading", {
    name: precision === "unknown"
      ? "대운 계산 기준을 선택해 주세요"
      : "태어난 시·도와 계산 기준을 선택해 주세요",
  });
  if (precision !== "unknown") {
    await waitFor(() => expect(screen.getByLabelText("출생 시·도")).toBeEnabled());
  }
}

async function reachReview(precision: "exact" | "approximate" | "unknown" = "exact") {
  await reachBirthPlace(precision);
  if (precision !== "unknown") {
    fireEvent.change(screen.getByLabelText("출생 시·도"), { target: { value: "36" } });
  }
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
  fireEvent.click(screen.getByRole("radio", { name: /일·진로/ }));
  fireEvent.change(screen.getByRole("textbox", { name: /질문 한 가지/ }), {
    target: { value: "올해 이직을 준비해도 괜찮을까요?" },
  });
  fireEvent.click(screen.getByRole("button", { name: "입력 검토" }));
  await screen.findByRole("heading", { name: "입력한 내용을 확인해 주세요" });
}

describe("SajuExperience", () => {
  it("keeps birth inputs hidden until authentication and required consent finish", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(false)))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse(birthPlaces()));

    render(<SajuExperience />);
    expect(screen.queryByLabelText("양력 생년월일")).not.toBeInTheDocument();
    expect(screen.getByText(/내 기록에서 언제든 삭제/)).toBeInTheDocument();

    for (const checkbox of await screen.findAllByRole("checkbox")) fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "동의하고 계속" }));

    expect(await screen.findByLabelText("양력 생년월일")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/consents", { credentials: "same-origin" });
  });

  it("blocks the input journey when the saju cost exceeds the current balance", async () => {
    credits.state.data.balance = { free: 3, paid: 0, total: 3 };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse(consentStatus(true)));

    render(<SajuExperience />);

    expect(await screen.findByRole("heading", { name: "사주 리딩 크레딧을 확인해요" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("4 크레딧이 필요");
    expect(screen.queryByLabelText("양력 생년월일")).not.toBeInTheDocument();
  });

  it("blocks the input journey while another reading is generating", async () => {
    credits.state.data.generationInProgress = true;
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse(consentStatus(true)));

    render(<SajuExperience />);

    expect(await screen.findByRole("heading", { name: "사주 리딩 크레딧을 확인해요" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("이미 생성 중인 리딩");
  });

  it("builds the nested v3 payload and omits birth time and place when unknown", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(REQUEST_ID);
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(jsonResponse(createdReading()));
    await startWithAcceptedConsent();
    await reachReview("unknown");

    expect(screen.getByText("시간 미상 · 시주 제외")).toBeInTheDocument();
    expect(screen.getByText("계산하지 않음")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "사주 리딩 생성" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/saju/results/reading-1"));
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/saju/readings");
    const body = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(body).toEqual({
      requestId: REQUEST_ID,
      question: "올해 이직을 준비해도 괜찮을까요?",
      focusArea: "career",
      birthProfile: {
        calendarType: "solar",
        birthDate: "1992-08-17",
        birthTimePrecision: "unknown",
        luckDirectionBasis: "unspecified",
      },
    });
    expect(body.birthProfile).not.toHaveProperty("birthTime");
    expect(body).not.toHaveProperty("pillars");
  });

  it("explains approximate time and submits the server-defined precision", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(REQUEST_ID);
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(jsonResponse(birthPlaces()))
      .mockResolvedValueOnce(jsonResponse(createdReading()));
    await startWithAcceptedConsent();
    fireEvent.change(screen.getByLabelText("양력 생년월일"), { target: { value: "1992-08-17" } });
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    fireEvent.click(screen.getByRole("radio", { name: /대략적으로 알아요/ }));
    expect(screen.getByText(/앞뒤 60분을 함께 계산/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("태어난 시각"), { target: { value: "14:30" } });
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    await waitFor(() => expect(screen.getByLabelText("출생 시·도")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("출생 시·도"), { target: { value: "36" } });
    fireEvent.click(screen.getByRole("radio", { name: "여성 기준" }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    fireEvent.click(screen.getByRole("radio", { name: /일·진로/ }));
    fireEvent.change(screen.getByRole("textbox", { name: /질문 한 가지/ }), { target: { value: "질문" } });
    fireEvent.click(screen.getByRole("button", { name: "입력 검토" }));
    fireEvent.click(screen.getByRole("button", { name: "사주 리딩 생성" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalled());
    const body = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body));
    expect(body.birthProfile).toMatchObject({
      birthTimePrecision: "approximate",
      birthTime: "14:30",
      luckDirectionBasis: "female",
    });
  });

  it("requires only a province when birth time is known", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(jsonResponse(birthPlaces()));
    await startWithAcceptedConsent();
    await reachBirthPlace("exact");

    fireEvent.change(screen.getByLabelText("출생 시·도"), { target: { value: "11" } });
    expect(screen.getByLabelText("출생 시·도")).toHaveValue("11");
    expect(screen.queryByLabelText("출생 시·군·구")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("출생 시·도"), { target: { value: "36" } });
    expect(screen.getByLabelText("출생 시·도")).toHaveValue("36");
  });

  it("blocks duplicate submits and reuses the request id for a network retry", async () => {
    const requestIdSpy = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(REQUEST_ID);
    const deferred = createDeferred<Response>();
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(jsonResponse(birthPlaces()))
      .mockImplementationOnce(() => deferred.promise)
      .mockResolvedValueOnce(jsonResponse(createdReading()));
    await startWithAcceptedConsent();
    await reachReview();

    const submit = screen.getByRole("button", { name: "사주 리딩 생성" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect((await screen.findAllByText("출생정보를 확인하고 있어요.")).length).toBeGreaterThan(0);
    deferred.resolve(jsonResponse({ code: "BACKEND_UNAVAILABLE", message: "잠시 후 다시 시도해 주세요." }, { status: 502 }));

    expect(await screen.findByRole("alert")).toHaveTextContent("잠시 후 다시 시도해 주세요.");
    fireEvent.click(screen.getByRole("button", { name: "사주 리딩 생성" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalled());
    const first = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body));
    const second = JSON.parse(String(fetchMock.mock.calls[3]?.[1]?.body));
    expect(first.requestId).toBe(REQUEST_ID);
    expect(second.requestId).toBe(REQUEST_ID);
    expect(requestIdSpy).toHaveBeenCalledTimes(1);
  });

  it("creates a new request id after a confirmed OpenAI generation failure", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce(REQUEST_ID)
      .mockReturnValueOnce(SECOND_REQUEST_ID);
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(jsonResponse(birthPlaces()))
      .mockResolvedValueOnce(jsonResponse({
        code: "OPENAI_READING_GENERATION_FAILED",
        message: "리딩 생성에 실패했어요. 다시 시도해 주세요.",
      }, { status: 502 }))
      .mockResolvedValueOnce(jsonResponse(createdReading()));
    await startWithAcceptedConsent();
    await reachReview();

    fireEvent.click(screen.getByRole("button", { name: "사주 리딩 생성" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("리딩 생성에 실패했어요.");
    fireEvent.click(screen.getByRole("button", { name: "사주 리딩 생성" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalled());
    const first = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body));
    const second = JSON.parse(String(fetchMock.mock.calls[3]?.[1]?.body));
    expect(first.requestId).toBe(REQUEST_ID);
    expect(second.requestId).toBe(SECOND_REQUEST_ID);
  });

  it("creates a new request id after the user changes an input", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce(REQUEST_ID)
      .mockReturnValueOnce(SECOND_REQUEST_ID);
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(jsonResponse(birthPlaces()))
      .mockResolvedValueOnce(jsonResponse({
        code: "BACKEND_UNAVAILABLE",
        message: "잠시 후 다시 시도해 주세요.",
      }, { status: 502 }))
      .mockResolvedValueOnce(jsonResponse(createdReading()));
    await startWithAcceptedConsent();
    await reachReview();

    fireEvent.click(screen.getByRole("button", { name: "사주 리딩 생성" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("잠시 후 다시 시도해 주세요.");
    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    fireEvent.change(screen.getByRole("textbox", { name: /질문 한 가지/ }), {
      target: { value: "올해 이직 준비에서 먼저 점검할 것은 무엇인가요?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "입력 검토" }));
    fireEvent.click(screen.getByRole("button", { name: "사주 리딩 생성" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalled());
    const first = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body));
    const second = JSON.parse(String(fetchMock.mock.calls[3]?.[1]?.body));
    expect(first.requestId).toBe(REQUEST_ID);
    expect(second.requestId).toBe(SECOND_REQUEST_ID);
  });

  it("moves a backend field error to its input and focuses the error summary", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(REQUEST_ID);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(jsonResponse(birthPlaces()))
      .mockResolvedValueOnce(jsonResponse({
        code: "INVALID_BIRTH_TIME",
        field: "birthProfile.birthTime",
        message: "출생 시각을 다시 확인해 주세요.",
      }, { status: 400 }));
    await startWithAcceptedConsent();
    await reachReview("exact");
    fireEvent.click(screen.getByRole("button", { name: "사주 리딩 생성" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("출생 시각을 다시 확인해 주세요.");
    expect(alert).toHaveFocus();
    expect(screen.getByLabelText(/태어난 시각/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/태어난 시각/)).toHaveAttribute("aria-describedby", "birth-time-error");
  });

  it("shows the stable credit error and refreshes shared status after a 429", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(REQUEST_ID);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(jsonResponse(birthPlaces()))
      .mockResolvedValueOnce(jsonResponse({
        code: "INSUFFICIENT_READING_CREDITS",
        message: "리딩 크레딧이 부족합니다.",
        required: 4,
        balance: { free: 2, paid: 0, total: 2 },
        nextResetAt: "2026-08-22T00:00:00+09:00",
      }, { status: 429 }));
    await startWithAcceptedConsent();
    await reachReview("exact");

    fireEvent.click(screen.getByRole("button", { name: "사주 리딩 생성" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("크레딧이 부족");
    expect(credits.refresh).toHaveBeenCalledTimes(1);
  });

  it("redirects to login when consent status is unauthenticated", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({
      code: "UNAUTHENTICATED",
      message: "로그인이 필요합니다.",
    }, { status: 401 }));

    render(<SajuExperience />);

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/login?next=%2Fsaju"));
    expect(screen.queryByLabelText("양력 생년월일")).not.toBeInTheDocument();
  });

  it("consumes remembered birth information and starts at a new question", async () => {
    rememberSajuBirthProfile({
      calendarType: "solar",
      birthDate: "1992-08-17",
      birthTimePrecision: "unknown",
      provinceCode: "36",
      cityCode: "36110",
      luckDirectionBasis: "unspecified",
    });
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(jsonResponse(birthPlaces()));

    render(<SajuExperience />);

    expect(await screen.findByRole("heading", {
      name: "지금 가장 살펴보고 싶은 한 가지는 무엇인가요?",
    })).toBeInTheDocument();
    expect(screen.queryByLabelText("양력 생년월일")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /일·진로/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(await screen.findByRole("heading", { name: "대운 계산 기준을 선택해 주세요" })).toBeInTheDocument();
    expect(screen.queryByLabelText("출생 시·도")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(screen.getByRole("radio", { name: /시간을 몰라요/ })).toBeChecked();
  });
});
