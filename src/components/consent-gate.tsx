"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ConsentDocumentModal } from "./consent-document-modal";

const AGREEMENT_IDS = ["terms", "privacy", "sensitive-data"] as const;

type AgreementId = typeof AGREEMENT_IDS[number];

type ConsentStatus = {
  acceptedDocumentTypes: AgreementId[];
  requiredDocumentTypes: AgreementId[];
  hasAcceptedRequired: boolean;
};

type ConsentError = {
  mode: "load" | "submit";
  message: string;
};

const agreementDetails: Record<AgreementId, { label: string; detail: string }> = {
  terms: {
    label: "서비스 이용약관 동의",
    detail: "리딩 콘텐츠의 성격과 이용 조건을 확인합니다.",
  },
  privacy: {
    label: "개인정보 수집·이용 동의",
    detail: "입력 정보의 처리 목적과 이용 범위를 확인합니다.",
  },
  "sensitive-data": {
    label: "출생 정보와 질문 내용 처리 동의",
    detail: "리딩 생성에 필요한 출생 정보와 질문 내용을 처리합니다.",
  },
};

export function ConsentGate({
  onComplete,
  onUnauthenticated,
}: {
  onComplete: () => void;
  onUnauthenticated?: () => void;
}) {
  const [accepted, setAccepted] = useState<Partial<Record<AgreementId, boolean>>>({});
  const [activeAgreement, setActiveAgreement] = useState<AgreementId | null>(null);
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ConsentError | null>(null);
  const [completed, setCompleted] = useState(false);
  const reviewButtonRef = useRef<HTMLButtonElement | null>(null);

  const requiredAgreements = useMemo<AgreementId[]>(
    () => status?.requiredDocumentTypes ?? [...AGREEMENT_IDS],
    [status],
  );
  const complete = requiredAgreements.every((id) => accepted[id]);
  const closeDocument = useCallback(() => setActiveAgreement(null), []);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/consents", { credentials: "same-origin" });
      if (response.status === 401) {
        onUnauthenticated?.();
        return;
      }
      if (!response.ok) {
        throw new Error("failed");
      }

      const payload = await response.json() as { status: ConsentStatus };
      if (payload.status.hasAcceptedRequired) {
        setCompleted(true);
        onComplete();
        return;
      }

      setStatus(payload.status);
      setAccepted(
        Object.fromEntries(
          payload.status.acceptedDocumentTypes.map((documentType) => [documentType, true] as const),
        ) as Partial<Record<AgreementId, boolean>>,
      );
    } catch {
      setError({
        mode: "load",
        message: "동의 상태를 불러오지 못했어요. 다시 시도해 주세요.",
      });
    } finally {
      setLoading(false);
    }
  }, [onComplete, onUnauthenticated]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function submitConsent() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/consents", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptedDocumentTypes: requiredAgreements,
        }),
      });
      if (response.status === 401) {
        onUnauthenticated?.();
        return;
      }
      if (!response.ok) {
        throw new Error("failed");
      }

      setCompleted(true);
      onComplete();
    } catch {
      setError({
        mode: "submit",
        message: "동의 저장에 실패했어요. 다시 시도해 주세요.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="consent-panel">
        <p className="muted">동의 상태를 확인하고 있어요...</p>
      </div>
    );
  }

  if (completed) {
    return null;
  }

  return (
    <>
      <div className="consent-panel">
        <div className="consent-heading">
          <span className="lock-icon">◇</span>
          <div>
            <p className="eyebrow">BEFORE WE BEGIN</p>
            <h2>당신의 이야기를 안전하게 다룰게요</h2>
          </div>
        </div>
        <p className="muted">
          아래 항목은 리딩을 시작하기 위해 꼭 필요한 동의입니다. 동의 기록은 문서 버전과 시각을 함께 보관합니다.
        </p>
        <div className="agreement-list">
          {requiredAgreements.map((agreementId) => (
            <div key={agreementId} className="agreement">
              <div className="agreement-copy">
                <span aria-hidden="true" className="agreement-mark">
                  {accepted[agreementId] ? "✓" : "◇"}
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
                  내용 확인
                </button>
              </div>
            </div>
          ))}
        </div>
        {error ? (
          <p className="form-error" role="alert">
            {error.message}
          </p>
        ) : null}
        {error ? (
          <button
            className="secondary-button full-button"
            type="button"
            disabled={submitting}
            onClick={() => {
              if (error.mode === "load") {
                void loadStatus();
              } else if (complete) {
                void submitConsent();
              }
            }}
          >
            다시 시도
          </button>
        ) : null}
        <button
          className="primary-button full-button"
          type="button"
          disabled={!complete || submitting}
          onClick={() => {
            if (complete) {
              void submitConsent();
            }
          }}
        >
          {submitting ? "동의 저장 중..." : "동의하고 계속"}
        </button>
      </div>
      {activeAgreement ? (
        <ConsentDocumentModal
          documentType={activeAgreement}
          onAgree={() => {
            setAccepted((current) => ({ ...current, [activeAgreement]: true }));
            closeDocument();
          }}
          onClose={closeDocument}
          returnFocusTo={reviewButtonRef.current}
          title={agreementDetails[activeAgreement].label}
        />
      ) : null}
    </>
  );
}
