"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReadingCredits } from "./reading-credit-provider";

export function ReadingRecordActions({
  readingId,
  retryable,
  retrySuccessHref,
}: {
  readingId: string;
  retryable: boolean;
  retrySuccessHref?: string;
}) {
  const router = useRouter();
  const credits = useReadingCredits();
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
      if (!response.ok) {
        const body = await readRetryError(response);
        if (
          body.code === "READING_GENERATION_IN_PROGRESS"
          || body.code === "INSUFFICIENT_READING_CREDITS"
        ) {
          void credits.refresh();
        }
        throw new Error(retryErrorMessage(body));
      }
      const body = await response.json() as { reading?: { status?: string } };
      void credits.refresh();
      if (retrySuccessHref && body.reading?.status === "completed") {
        router.push(retrySuccessHref);
      }
      router.refresh();
    } catch (retryError) {
      setError(retryError instanceof Error
        ? retryError.message
        : "리딩을 다시 생성하지 못했어요. 잠시 후 재시도해 주세요.");
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

async function readRetryError(response: Response): Promise<{ code: string; message: string }> {
  try {
    const body = await response.json() as { code?: unknown; message?: unknown; error?: unknown };
    return {
      code: typeof body.code === "string" ? body.code : "RETRY_FAILED",
      message: typeof body.message === "string"
        ? body.message
        : typeof body.error === "string" ? body.error : "",
    };
  } catch {
    return { code: "RETRY_FAILED", message: "" };
  }
}

function retryErrorMessage(error: { code: string; message: string }): string {
  if (error.code === "READING_GENERATION_IN_PROGRESS") {
    return "이미 생성 중인 리딩이 있어요. 완료 후 다시 시도해 주세요.";
  }
  if (error.code === "INSUFFICIENT_READING_CREDITS") {
    return "크레딧이 부족해 리딩을 다시 생성할 수 없어요.";
  }
  return error.message || "리딩을 다시 생성하지 못했어요. 잠시 후 재시도해 주세요.";
}
