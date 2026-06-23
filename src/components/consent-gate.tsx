"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
    detail: "입력 정보의 수집 목적과 보관 기간을 확인합니다.",
  },
  "sensitive-data": {
    label: "출생 정보·고민 내용 처리 동의",
    detail: "리딩 생성에 필요한 민감한 입력의 처리를 허용합니다.",
  },
};

export function ConsentGate({ onComplete }: { onComplete: () => void }) {
  const [checked, setChecked] = useState<Partial<Record<AgreementId, boolean>>>({});
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ConsentError | null>(null);
  const [completed, setCompleted] = useState(false);

  const requiredAgreements = useMemo<AgreementId[]>(
    () => status?.requiredDocumentTypes ?? [...AGREEMENT_IDS],
    [status],
  );
  const complete = requiredAgreements.every((id) => checked[id]);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/consents");
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
      setChecked(
        Object.fromEntries(
          payload.status.acceptedDocumentTypes.map((documentType) => [documentType, true] as const),
        ) as Partial<Record<AgreementId, boolean>>,
      );
    } catch {
      setError({
        mode: "load",
        message: "동의 상태를 불러오지 못했어요. 다시 시도해주세요.",
      });
    } finally {
      setLoading(false);
    }
  }, [onComplete]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function submitConsent() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptedDocumentTypes: requiredAgreements,
        }),
      });
      if (!response.ok) {
        throw new Error("failed");
      }

      setCompleted(true);
      onComplete();
    } catch {
      setError({
        mode: "submit",
        message: "동의 저장에 실패했어요. 다시 시도해주세요.",
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
          <label key={agreementId} className="agreement">
            <input
              type="checkbox"
              checked={Boolean(checked[agreementId])}
              disabled={submitting}
              onChange={(event) =>
                setChecked((current) => ({ ...current, [agreementId]: event.target.checked }))
              }
            />
            <span className="custom-check">✓</span>
            <span>
              <strong>[필수] {agreementDetails[agreementId].label}</strong>
              <small>{agreementDetails[agreementId].detail}</small>
            </span>
          </label>
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
  );
}
