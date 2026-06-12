import Link from "next/link";
import { AccountDeleteButton } from "@/components/account-delete-button";

interface RecordsPageProps {
  searchParams: Promise<{ guestTransfer?: string | string[] }>;
}

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const params = await searchParams;
  const guestTransfer = Array.isArray(params.guestTransfer)
    ? params.guestTransfer[0]
    : params.guestTransfer;
  const showGuestTransferFailure = guestTransfer === "failed";

  return (
    <section className="simple-page page-width">
      <p className="eyebrow">MY READINGS</p>
      <h1>나의 리딩 기록</h1>
      {showGuestTransferFailure ? (
        <div role="alert" aria-live="assertive">
          로그인은 완료했지만 이전 기록 연결에 실패했어요. 다시 로그인해 보거나 잠시 후 재시도해 주세요.
        </div>
      ) : null}
      <div className="empty-state">
        <span>◇</span>
        <h2>아직 저장된 이야기가 없어요</h2>
        <p>로그인하면 무료 결과와 구매한 심층 리딩을 어느 기기에서든 다시 볼 수 있어요.</p>
        <Link className="primary-button" href="/login">
          로그인하고 기록 보관하기
        </Link>
      </div>
      <AccountDeleteButton />
    </section>
  );
}
