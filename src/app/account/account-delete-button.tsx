"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FAILURE_MESSAGE = "계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.";

export function AccountDeleteButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    const confirmed = window.confirm(
      "계정을 삭제할까요? 계정과 저장된 리딩은 즉시 이용할 수 없게 되고 현재 로그인도 종료됩니다.",
    );
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        cache: "no-store",
      });

      if (!response.ok) {
        setError(FAILURE_MESSAGE);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError(FAILURE_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="danger-zone">
      <h2>계정 삭제</h2>
      <p>계정을 삭제하면 계정과 저장된 리딩을 더 이상 이용할 수 없고 로그인 연결이 해제됩니다.</p>
      <button type="button" onClick={deleteAccount} disabled={submitting}>
        {submitting ? "삭제 중" : "계정 삭제"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
