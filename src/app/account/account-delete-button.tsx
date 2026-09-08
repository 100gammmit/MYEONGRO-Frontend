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
      "계정을 영구 삭제할까요? 프로필, 로그인 연결, 리딩과 동의 이력이 명로 운영 데이터베이스에서 즉시 삭제되며 복구할 수 없습니다.",
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
      <p>계정을 삭제하면 프로필, 로그인 연결, 리딩과 동의 이력이 명로 운영 데이터베이스에서 즉시 영구 삭제되며 복구할 수 없습니다.</p>
      <button type="button" onClick={deleteAccount} disabled={submitting}>
        {submitting ? "삭제 중" : "계정 삭제"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
