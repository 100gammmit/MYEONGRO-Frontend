"use client";

import { useReadingCredits } from "@/components/reading-credit-provider";
import { getDisplayedReadingCredits } from "@/domain/reading-credit";

export function AccountCreditSummary() {
  const { state, refresh } = useReadingCredits();
  const { data } = getDisplayedReadingCredits(state);

  if (state.status === "error") {
    return (
      <>
        <p className="account-value">크레딧을 확인하지 못했어요.</p>
        <div className="account-actions">
          <button className="secondary-button" onClick={() => void refresh()} type="button">
            다시 확인
          </button>
        </div>
      </>
    );
  }

  if (!data) return <p className="account-value" role="status">크레딧을 확인하고 있어요.</p>;

  return (
    <>
      <p className="account-value"><strong>{data.balance.total}</strong>크레딧 남았어요</p>
      <p className="account-sub">
        오늘 무료 {data.balance.free} · 추가 {data.balance.paid}. AI 타로와 사주 리딩을 만들 때 사용해요.
      </p>
    </>
  );
}
