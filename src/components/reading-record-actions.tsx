"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReadingRecordActions({
  readingId,
  retryable,
}: {
  readingId: string;
  retryable: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"delete" | "retry" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteReading() {
    if (pending) return;
    setPending("delete");
    setError(null);

    try {
      const response = await fetch(`/api/readings/${readingId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("delete failed");
      router.push("/records");
      router.refresh();
    } catch {
      setError("기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(null);
    }
  }

  async function retryReading() {
    if (pending) return;
    setPending("retry");
    setError(null);

    try {
      const response = await fetch(`/api/readings/${readingId}/retry`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("retry failed");
      router.refresh();
    } catch {
      setError("리딩을 다시 생성하지 못했어요. 잠시 후 재시도해 주세요.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="record-actions">
      {error ? <p role="alert">{error}</p> : null}
      <div>
        {retryable ? (
          <button
            className="primary-button"
            disabled={Boolean(pending)}
            onClick={() => void retryReading()}
            type="button"
          >
            {pending === "retry" ? "다시 생성 중..." : "다시 생성"}
          </button>
        ) : null}
        <button
          className="record-delete-button"
          disabled={Boolean(pending)}
          onClick={() => void deleteReading()}
          type="button"
        >
          {pending === "delete" ? "삭제 중..." : "기록 삭제"}
        </button>
      </div>
    </div>
  );
}
