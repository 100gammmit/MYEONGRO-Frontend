"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReadingRecordActions({ readingId }: { readingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteReading() {
    if (pending) return;
    setPending(true);
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
      setPending(false);
    }
  }

  return (
    <div className="record-actions">
      {error ? <p role="alert">{error}</p> : null}
      <div>
        <button
          className="record-delete-button"
          disabled={pending}
          onClick={() => void deleteReading()}
          type="button"
        >
          {pending ? "삭제 중..." : "기록 삭제"}
        </button>
      </div>
    </div>
  );
}
