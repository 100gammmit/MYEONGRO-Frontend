import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION,
  TERMS_DOCUMENT_VERSION,
} from "@/domain/consent/documents";
import { ConsentGate } from "./consent-gate";

const tarotStatus = {
  acceptedDocumentTypes: [],
  requiredDocumentTypes: ["terms", "ai-overseas-transfer"],
  hasAcceptedRequired: false,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConsentGate", () => {
  it("requests the status for the selected feature scope", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ status: tarotStatus }),
    );

    render(<ConsentGate scope="tarot" onComplete={vi.fn()} />);

    await screen.findByRole("button", { name: "서비스 이용약관 동의 내용 확인" });
    expect(fetchMock).toHaveBeenCalledWith("/api/consents?scope=tarot", {
      credentials: "same-origin",
    });
    expect(screen.getByText("[필수] AI 리딩 정보 국외이전 동의")).toBeInTheDocument();
    expect(screen.queryByText("[필수] 사주 출생정보 처리 동의")).not.toBeInTheDocument();
    expect(screen.queryByText(/개인정보 수집·이용 동의/)).not.toBeInTheDocument();
  });

  it("leaves the heading to the wizard and puts the continue button in the shared action bar", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ status: tarotStatus }));

    render(<ConsentGate scope="tarot" onComplete={vi.fn()} />);

    const continueButton = await screen.findByRole("button", { name: "동의 완료하고 계속" });
    expect(continueButton.closest(".reading-actions")).not.toBeNull();
    expect(continueButton.closest(".consent-panel")).toBeNull();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByText("BEFORE WE BEGIN")).not.toBeInTheDocument();
    expect(screen.getByText(/마지막 단계에서 모든 동의를 한 번에 저장합니다/)).toBeInTheDocument();
  });

  it("uses the shared terms and overseas transfer documents for the saju scope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      status: tarotStatus,
    }));

    render(<ConsentGate scope="saju" onComplete={vi.fn()} />);

    expect(await screen.findByText("[필수] 서비스 이용약관 동의"))
      .toBeInTheDocument();
    expect(screen.getByText("[필수] AI 리딩 정보 국외이전 동의"))
      .toBeInTheDocument();
    expect(screen.queryByText("[필수] 사주 출생정보 처리 동의"))
      .not.toBeInTheDocument();
  });

  it("routes a 401 response back through the login gate", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ code: "UNAUTHENTICATED" }, { status: 401 }),
    );
    const onUnauthenticated = vi.fn();

    render(
      <ConsentGate
        scope="tarot"
        onComplete={vi.fn()}
        onUnauthenticated={onUnauthenticated}
      />,
    );

    await waitFor(() => expect(onUnauthenticated).toHaveBeenCalledOnce());
  });

  it("skips the saju gate when terms and overseas transfer are already accepted", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      status: {
        ...tarotStatus,
        acceptedDocumentTypes: ["terms", "ai-overseas-transfer"],
        hasAcceptedRequired: true,
      },
    }));
    const onComplete = vi.fn();

    render(<ConsentGate scope="saju" onComplete={onComplete} />);

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(screen.queryByRole("button", { name: "동의 완료하고 계속" }))
      .not.toBeInTheDocument();
    expect(screen.queryByText("[필수] 사주 출생정보 처리 동의"))
      .not.toBeInTheDocument();
  });

  it("does not agree on close and marks a reviewed document locally", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ status: tarotStatus }));

    render(<ConsentGate scope="tarot" onComplete={vi.fn()} />);

    const continueButton = await screen.findByRole("button", {
      name: "동의 완료하고 계속",
    });
    const termsReview = screen.getByRole("button", {
      name: "서비스 이용약관 동의 내용 확인",
    });
    expect(continueButton).toBeDisabled();

    fireEvent.click(termsReview);
    const dialog = screen.getByRole("dialog", { name: "서비스 이용약관 동의" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`문서 버전 ${TERMS_DOCUMENT_VERSION}`)))
      .toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(termsReview).toHaveFocus();
    expect(screen.getByRole("status", { name: "서비스 이용약관 동의 상태" }))
      .toHaveTextContent("내용 확인 필요");

    fireEvent.click(termsReview);
    fireEvent.click(screen.getByRole("button", {
      name: "서비스 이용약관 동의 확인하고 동의",
    }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("status", { name: "서비스 이용약관 동의 상태" }))
      .toHaveTextContent("확인 완료");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(continueButton).toBeDisabled();
  });

  it("submits only terms and overseas transfer consent for saju", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({
        status: tarotStatus,
      }))
      .mockResolvedValueOnce(Response.json({
        status: {
          acceptedDocumentTypes: ["terms", "ai-overseas-transfer"],
          requiredDocumentTypes: ["terms", "ai-overseas-transfer"],
          hasAcceptedRequired: true,
        },
      }));
    const onComplete = vi.fn();

    render(<ConsentGate scope="saju" onComplete={onComplete} />);

    fireEvent.click(await screen.findByRole("button", {
      name: "서비스 이용약관 동의 내용 확인",
    }));
    fireEvent.click(screen.getByRole("button", {
      name: "서비스 이용약관 동의 확인하고 동의",
    }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", {
      name: "AI 리딩 정보 국외이전 동의 내용 확인",
    }));
    fireEvent.click(screen.getByRole("button", {
      name: "AI 리딩 정보 국외이전 동의 확인하고 동의",
    }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "동의 완료하고 계속" }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/consents",
      expect.objectContaining({
        body: JSON.stringify({
          scope: "saju",
          documentVersions: {
            terms: TERMS_DOCUMENT_VERSION,
            "ai-overseas-transfer": AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION,
          },
        }),
      }),
    );
  });

  it("saves all reviewed documents atomically and retries only the final request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ status: tarotStatus }))
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(Response.json({
        status: {
          ...tarotStatus,
          acceptedDocumentTypes: ["terms", "ai-overseas-transfer"],
          hasAcceptedRequired: true,
        },
      }));
    const onComplete = vi.fn();

    render(<ConsentGate scope="tarot" onComplete={onComplete} />);

    await screen.findByRole("button", { name: "서비스 이용약관 동의 내용 확인" });
    fireEvent.click(screen.getByRole("button", {
      name: "서비스 이용약관 동의 내용 확인",
    }));
    fireEvent.click(screen.getByRole("button", {
      name: "서비스 이용약관 동의 확인하고 동의",
    }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", {
      name: "AI 리딩 정보 국외이전 동의 내용 확인",
    }));
    expect(screen.getByText(new RegExp(
      `문서 버전 ${AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION}`,
    ))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {
      name: "AI 리딩 정보 국외이전 동의 확인하고 동의",
    }));

    const continueButton = screen.getByRole("button", { name: "동의 완료하고 계속" });
    await waitFor(() => expect(continueButton).toBeEnabled());
    fireEvent.click(continueButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "동의를 저장하지 못했어요. 다시 시도해 주세요.",
    );
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "동의 완료하고 계속" }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/consents",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          scope: "tarot",
          documentVersions: {
            terms: TERMS_DOCUMENT_VERSION,
            "ai-overseas-transfer": AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION,
          },
        }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("asks for a refresh when the server rejects an outdated document version", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ status: tarotStatus }))
      .mockResolvedValueOnce(Response.json(
        { code: "CONSENT_VERSION_MISMATCH" },
        { status: 409 },
      ));

    render(<ConsentGate scope="tarot" onComplete={vi.fn()} />);

    fireEvent.click(await screen.findByRole("button", {
      name: "AI 리딩 정보 국외이전 동의 내용 확인",
    }));
    expect(screen.getByRole("heading", { name: "이전되는 개인정보 항목" }))
      .toBeInTheDocument();
    expect(screen.getByText("privacy@openai.com")).toBeInTheDocument();
    expect(screen.getByText(/무료 오늘의 운세와 기존 기록의 열람·삭제/))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {
      name: "AI 리딩 정보 국외이전 동의 확인하고 동의",
    }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", {
      name: "서비스 이용약관 동의 내용 확인",
    }));
    fireEvent.click(screen.getByRole("button", {
      name: "서비스 이용약관 동의 확인하고 동의",
    }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "동의 완료하고 계속" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "동의 문서가 변경되었어요. 페이지를 새로고침한 뒤 다시 확인해 주세요.",
    );
  });
});
