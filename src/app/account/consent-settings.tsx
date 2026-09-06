"use client";

import { useEffect, useState } from "react";

type ConsentStatus = {
  acceptedDocumentTypes: string[];
};

export function ConsentSettings() {
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/consents?scope=tarot", {
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("failed");
        const payload = await response.json() as { status: ConsentStatus };
        if (active) {
          setAccepted(payload.status.acceptedDocumentTypes.includes("ai-overseas-transfer"));
        }
      } catch {
        if (active) setError("동의 상태를 불러오지 못했어요. 페이지를 새로고침해 주세요.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function withdraw() {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/consents/ai-overseas-transfer", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("failed");
      setAccepted(false);
      setConfirming(false);
      setMessage("AI 리딩 정보 국외이전 동의를 철회했어요.");
    } catch {
      setError("동의를 철회하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="account-setting-section" aria-labelledby="ai-consent-heading">
      <div>
        <p className="eyebrow">AI DATA CONSENT</p>
        <h2 id="ai-consent-heading">AI 리딩 정보 국외이전</h2>
        <p>
          {loading
            ? "동의 상태를 확인하고 있어요."
            : accepted
              ? "현재 동의되어 있어 AI 타로·사주 리딩을 생성할 수 있어요."
              : "현재 동의하지 않은 상태예요. AI 리딩을 다시 시작할 때 내용을 확인하고 동의할 수 있어요."}
        </p>
      </div>
      {accepted && !confirming ? (
        <button
          className="secondary-button"
          disabled={loading}
          onClick={() => setConfirming(true)}
          type="button"
        >
          동의 철회
        </button>
      ) : null}
      {confirming ? (
        <div className="account-consent-confirmation">
          <p>철회하면 신규 AI 타로·사주 리딩 생성이 중단됩니다. 기존 기록의 열람과 삭제, 무료 오늘의 운세는 계속 이용할 수 있어요.</p>
          <div className="result-actions">
            <button
              className="secondary-button"
              disabled={submitting}
              onClick={() => setConfirming(false)}
              type="button"
            >
              취소
            </button>
            <button
              className="danger-button"
              disabled={submitting}
              onClick={() => void withdraw()}
              type="button"
            >
              {submitting ? "철회 중..." : "AI 국외이전 동의 철회"}
            </button>
          </div>
        </div>
      ) : null}
      {message ? <p className="notice" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </section>
  );
}
