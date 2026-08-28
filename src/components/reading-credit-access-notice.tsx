"use client";

import type { ReadingCreditAccess } from "@/domain/reading-credit";

export function ReadingCreditAccessNotice({
  access,
  onRetry,
}: {
  access: ReadingCreditAccess;
  onRetry: () => void;
}) {
  if (access.status === "allowed") {
    return <p className="credit-notice">{access.required}크레딧 사용 · 현재 {access.remaining}크레딧</p>;
  }
  if (access.status === "loading") {
    return <p className="credit-notice" aria-live="polite">크레딧을 확인하고 있어요.</p>;
  }
  if (access.status === "generation-in-progress") {
    return <p className="credit-notice" role="alert">이미 생성 중인 리딩이 있어요. 완료 후 다시 시작해 주세요.</p>;
  }
  if (access.status === "insufficient") {
    return (
      <p className="credit-notice" role="alert">
        이 리딩은 {access.required} 크레딧이 필요해요. 현재 {access.remaining} 크레딧이 남아 있어요.
      </p>
    );
  }
  return (
    <div className="credit-notice" role="alert">
      <p>크레딧을 확인하지 못했어요.</p>
      <button className="secondary-button" onClick={onRetry} type="button">다시 확인</button>
    </div>
  );
}
