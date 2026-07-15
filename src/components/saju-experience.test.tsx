import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SajuExperience } from "./saju-experience";

const REQUIRED_CONSENTS = ["terms", "privacy", "sensitive-data"] as const;
const REQUEST_ID = "11111111-1111-4111-8111-111111111111";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
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

function acceptedReading() {
  return {
    reading: {
      id: "reading-1",
      kind: "saju",
      tier: "free",
      status: "completed",
      input: {
        question: "올해 이직운이 궁금해요",
        profile: {
          birthDate: "1990-01-01",
          birthTime: "13:10",
          calendarType: "solar",
          gender: "female",
          pillars: {
            year: "甲子",
            month: "乙丑",
            day: "丙寅",
            hour: "丁卯",
          },
        },
      },
      result: {
        title: "사주의 구조화된 결과",
        summary: "양력 기준 명식과 질문을 함께 읽은 요약입니다.",
        sections: [
          {
            heading: "일간",
            body: "오늘의 선택은 속도를 조절하는 쪽으로 유리합니다.",
          },
          {
            heading: "흐름",
            body: "정리한 뒤에 움직일수록 결과가 또렷해집니다.",
          },
        ],
        guidance: [
          "이번 달엔 먼저 기준을 세워두세요.",
          "결정은 서두르지 말고 한 번 더 비교해 보세요.",
        ],
        disclaimer: "이 결과는 무료 베타용 참고 해석입니다.",
      },
    },
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SajuExperience", () => {
  it("keeps the consent gate before the solar-only form", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(false)))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    render(<SajuExperience />);

    for (const checkbox of await screen.findAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }

    fireEvent.click(screen.getByRole("button", { name: "동의하고 계속" }));

    expect(
      await screen.findByRole("heading", { name: "태어난 정보를 알려주세요" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("양력만 지원하는 근사 베타입니다. 음력은 아직 연결되지 않았어요."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "음력" })).not.toBeInTheDocument();

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/consents", {
      credentials: "same-origin",
    });
  });

  it("posts the saju payload without client-side pillars and omits blank birthTime", async () => {
    const requestIdSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue(REQUEST_ID);
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(jsonResponse(acceptedReading()));

    render(<SajuExperience />);

    await screen.findByRole("heading", { name: "태어난 정보를 알려주세요" });

    fireEvent.change(screen.getByLabelText("생년월일"), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByLabelText("궁금한 점"), {
      target: { value: "올해 이직운이 궁금해요" },
    });

    fireEvent.click(screen.getByRole("button", { name: "사주 읽어보기" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const postInit = fetchMock.mock.calls[1]?.[1];
    expect(postInit?.method).toBe("POST");

    const body = JSON.parse(String(postInit?.body));
    expect(body).toEqual({
      kind: "saju",
      question: "올해 이직운이 궁금해요",
      requestId: REQUEST_ID,
      birthDate: "1990-01-01",
      gender: "unspecified",
    });
    expect(body).not.toHaveProperty("birthTime");
    expect(body).not.toHaveProperty("pillars");
    expect(requestIdSpy).toHaveBeenCalledTimes(1);
  });

  it("blocks duplicate submits while loading and reuses the same requestId on retry", async () => {
    const requestIdSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue(REQUEST_ID);
    const deferred = createDeferred<Response>();
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockImplementationOnce(() => deferred.promise)
      .mockResolvedValueOnce(jsonResponse(acceptedReading()));

    render(<SajuExperience />);

    await screen.findByRole("heading", { name: "태어난 정보를 알려주세요" });

    fireEvent.change(screen.getByLabelText("생년월일"), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByLabelText("태어난 시각"), {
      target: { value: "13:10" },
    });
    fireEvent.change(screen.getByLabelText("궁금한 점"), {
      target: { value: "올해 이직운이 궁금해요" },
    });
    fireEvent.click(screen.getByLabelText("여성"));

    const submit = screen.getByRole("button", { name: "사주 읽어보기" });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(submit).toBeDisabled();

    deferred.resolve(jsonResponse(acceptedReading()));

    expect(
      await screen.findByRole("heading", {
        name: "사주의 구조화된 결과",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("甲子")).toBeInTheDocument();
    expect(screen.getByText("乙丑")).toBeInTheDocument();
    expect(screen.getByText("올해 이직운이 궁금해요")).toBeInTheDocument();

    const firstPost = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(firstPost.requestId).toBe(REQUEST_ID);
    expect(requestIdSpy).toHaveBeenCalledTimes(1);
  });

  it("shows an error, retries, and renders the structured reading result", async () => {
    const requestIdSpy = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue(REQUEST_ID);
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(consentStatus(true)))
      .mockResolvedValueOnce(
        jsonResponse({ error: "잠시 후 다시 시도해 주세요." }, { status: 500 }),
      )
      .mockResolvedValueOnce(jsonResponse(acceptedReading()));

    render(<SajuExperience />);

    await screen.findByRole("heading", { name: "태어난 정보를 알려주세요" });

    fireEvent.change(screen.getByLabelText("생년월일"), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByLabelText("태어난 시각"), {
      target: { value: "13:10" },
    });
    fireEvent.change(screen.getByLabelText("궁금한 점"), {
      target: { value: "올해 이직운이 궁금해요" },
    });
    fireEvent.click(screen.getByLabelText("여성"));

    fireEvent.click(screen.getByRole("button", { name: "사주 읽어보기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "리딩 요청에 실패했어요. 다시 시도해 주세요.",
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(
      await screen.findByRole("heading", {
        name: "사주의 구조화된 결과",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("양력 기준 명식과 질문을 함께 읽은 요약입니다.")).toBeInTheDocument();
    expect(screen.getByText("일간")).toBeInTheDocument();
    expect(screen.getByText("흐름")).toBeInTheDocument();
    expect(screen.getByText("이번 달엔 먼저 기준을 세워두세요.")).toBeInTheDocument();
    expect(screen.getByText("이 결과는 무료 베타용 참고 해석입니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 사주 리딩 시작" })).toHaveAttribute(
      "href",
      "/saju",
    );
    expect(screen.getByRole("link", { name: "내 기록 보기" })).toHaveAttribute(
      "href",
      "/records",
    );
    expect(screen.queryByText("3,900원")).not.toBeInTheDocument();
    expect(screen.queryByText(/심층|후속 질문/)).not.toBeInTheDocument();
    expect(requestIdSpy).toHaveBeenCalledTimes(1);

    const firstPost = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    const secondPost = JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body));
    expect(firstPost.requestId).toBe(REQUEST_ID);
    expect(secondPost.requestId).toBe(REQUEST_ID);
  });
});
