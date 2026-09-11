"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CONSENT_DOCUMENT_VERSIONS,
  type ConsentDocumentType,
  type ConsentScope,
} from "@/domain/consent/documents";
import { ConsentDocumentModal } from "./consent-document-modal";

type ConsentStatus = {
  acceptedDocumentTypes: ConsentDocumentType[];
  requiredDocumentTypes: ConsentDocumentType[];
  hasAcceptedRequired: boolean;
};

const SCOPE_DOCUMENTS: Readonly<Record<ConsentScope, readonly ConsentDocumentType[]>> = {
  tarot: ["terms", "ai-overseas-transfer"],
  saju: ["terms", "ai-overseas-transfer", "saju-input"],
};

const agreementDetails: Readonly<Record<ConsentDocumentType, {
  label: string;
  detail: string;
}>> = {
  terms: {
    label: "서비스 이용약관 동의",
    detail: "리딩 콘텐츠의 성격과 이용 조건을 확인합니다.",
  },
  "ai-overseas-transfer": {
    label: "AI 리딩 정보 국외이전 동의",
    detail: "OpenAI로 전송되는 정보, 처리 가능 국가와 보유기간을 확인합니다.",
  },
  "saju-input": {
    label: "사주 출생정보 처리 동의",
    detail: "명식 계산과 기록 저장에 필요한 출생정보의 처리 범위를 확인합니다.",
  },
};

export function ConsentGate({
  scope,
  onComplete,
  onUnauthenticated,
}: {
  scope: ConsentScope;
  onComplete: () => void;
  onUnauthenticated?: () => void;
}) {
  const [accepted, setAccepted] = useState<Partial<Record<ConsentDocumentType, boolean>>>({});
  const [activeAgreement, setActiveAgreement] = useState<ConsentDocumentType | null>(null);
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const reviewButtonRef = useRef<HTMLButtonElement | null>(null);

  const requiredAgreements = useMemo<readonly ConsentDocumentType[]>(
    () => status?.requiredDocumentTypes ?? SCOPE_DOCUMENTS[scope],
    [scope, status],
  );
  const complete = requiredAgreements.every((id) => accepted[id]);
  const closeDocument = useCallback(() => setActiveAgreement(null), []);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/consents?scope=${encodeURIComponent(scope)}`, {
        credentials: "same-origin",
      });
      if (response.status === 401) {
        onUnauthenticated?.();
        return;
      }
      if (!response.ok) throw new Error("failed");

      const payload = await response.json() as { status: ConsentStatus };
      if (payload.status.hasAcceptedRequired) {
        setCompleted(true);
        onComplete();
        return;
      }

      setStatus(payload.status);
      setAccepted(Object.fromEntries(
        payload.status.acceptedDocumentTypes.map((documentType) => [documentType, true] as const),
      ));
    } catch {
      setError("동의 상태를 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, [onComplete, onUnauthenticated, scope]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function reviewAgreement(documentType: ConsentDocumentType) {
    setAccepted((current) => ({ ...current, [documentType]: true }));
  }

  async function completeAgreements() {
    if (!complete || submitting) return;
    setSubmitting(true);
    setError(null);

    let response: Response;
    try {
      response = await fetch("/api/consents", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          documentVersions: Object.fromEntries(
            requiredAgreements.map((documentType) => [
              documentType,
              CONSENT_DOCUMENT_VERSIONS[documentType],
            ]),
          ),
        }),
      });
    } catch {
      setError("동의를 저장하지 못했어요. 다시 시도해 주세요.");
      setSubmitting(false);
      return;
    }
    if (response.status === 401) {
      onUnauthenticated?.();
      setError("로그인이 만료되었어요. 다시 로그인해 주세요.");
      setSubmitting(false);
      return;
    }
    if (!response.ok) {
      const payload = await readConsentError(response);
      setError(
        response.status === 409
          ? "동의 문서가 변경되었어요. 페이지를 새로고침한 뒤 다시 확인해 주세요."
          : payload ?? "동의를 저장하지 못했어요. 다시 시도해 주세요.",
      );
      setSubmitting(false);
      return;
    }
    setCompleted(true);
    onComplete();
  }

  if (loading) {
    return (
      <div className="consent-panel">
        <p className="muted">동의 상태를 확인하고 있어요...</p>
      </div>
    );
  }

  if (completed) return null;

  return (
    <>
      <div className="consent-panel">
        <div className="consent-heading">
          <span aria-hidden="true" className="lock-icon">◇</span>
          <div>
            <p className="eyebrow">BEFORE WE BEGIN</p>
            <h2>당신의 이야기를 안전하게 다룰게요</h2>
          </div>
        </div>
        <p className="muted">
          이 리딩에 필요한 항목만 안내합니다. 각 문서를 확인한 뒤 마지막 단계에서 모든 동의를 한 번에 저장합니다.
        </p>
        <div className="agreement-list">
          {requiredAgreements.map((agreementId) => (
            <div key={agreementId} className="agreement">
              <div className="agreement-copy">
                <span aria-hidden="true" className="agreement-mark">
                  {accepted[agreementId] ? "✓" : null}
                </span>
                <span className="agreement-text">
                  <strong>[필수] {agreementDetails[agreementId].label}</strong>
                  <small>{agreementDetails[agreementId].detail}</small>
                </span>
              </div>
              <div className="agreement-action">
                <span
                  aria-label={`${agreementDetails[agreementId].label} 상태`}
                  className={accepted[agreementId] ? "agreement-status accepted" : "agreement-status"}
                  role="status"
                >
                  {accepted[agreementId] ? "동의 완료" : "내용 확인 필요"}
                </span>
                <button
                  aria-label={`${agreementDetails[agreementId].label} 내용 확인`}
                  className="agreement-review-button"
                  disabled={submitting}
                  onClick={(event) => {
                    reviewButtonRef.current = event.currentTarget;
                    setActiveAgreement(agreementId);
                  }}
                  type="button"
                >
                  {accepted[agreementId] ? "다시 보기" : "내용 확인"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        {error && status === null ? (
          <button className="secondary-button full-button" onClick={() => void loadStatus()} type="button">
            다시 시도
          </button>
        ) : null}
        <button
          className="primary-button full-button"
          type="button"
          disabled={!complete || submitting}
          onClick={() => void completeAgreements()}
        >
          {submitting ? "동의 저장 중..." : "동의 완료하고 계속"}
        </button>
      </div>
      {activeAgreement ? (
        <ConsentDocumentModal
          documentType={activeAgreement}
          onAgree={() => reviewAgreement(activeAgreement)}
          onClose={closeDocument}
          returnFocusTo={reviewButtonRef.current}
          title={agreementDetails[activeAgreement].label}
        />
      ) : null}
    </>
  );
}

async function readConsentError(response: Response): Promise<string | null> {
  try {
    const payload = await response.json() as { message?: unknown; error?: unknown };
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.error === "string") return payload.error;
    return null;
  } catch {
    return null;
  }
}
