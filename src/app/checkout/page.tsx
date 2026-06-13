import Link from "next/link";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; guestTransfer?: string | string[] }>;
}) {
  const { kind, guestTransfer } = await searchParams;
  const guestTransferStatus = Array.isArray(guestTransfer) ? guestTransfer[0] : guestTransfer;
  const showGuestTransferFailure = guestTransferStatus === "failed";
  const productName = kind === "saju" ? "AI 사주 심층 리딩" : "AI 타로 심층 리딩";

  return (
    <section className="simple-page page-width checkout-page">
      <p className="eyebrow">DEEP READING</p>
      <h1>{productName}</h1>
      <div className="checkout-card">
        <div>
          <h2>심층 리딩은 준비 중입니다</h2>
          <p>무료 MVP에서는 타로와 사주의 무료 구조화 리딩에 집중하고 있어요.</p>
        </div>
        <div className="checkout-notice">
          결제와 후속 질문은 아직 제공하지 않습니다. 준비가 끝나면 서비스 안에서 다시 안내할게요.
        </div>
        {showGuestTransferFailure ? (
          <div className="checkout-notice" role="alert" aria-live="assertive">
            로그인은 완료됐지만 이전 기록 연결에 실패했어요. 다시 로그인하시거나 잠시 후 재시도해 주세요.
          </div>
        ) : null}
        <Link className="secondary-button full-button" href={kind === "saju" ? "/saju" : "/tarot"}>
          무료 리딩으로 돌아가기
        </Link>
      </div>
    </section>
  );
}
