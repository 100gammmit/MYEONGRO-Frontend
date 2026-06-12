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
          <h2>{productName}</h2>
          <p>심층 해석과 같은 리딩에 대한 후속 질문 2회가 포함됩니다.</p>
        </div>
        <strong>3,900원</strong>
        <div className="checkout-notice">
          결제 전 로그인과 무료 리딩 저장이 필요합니다. Supabase와 토스페이먼츠 키를 설정하면 서버의
          주문 소유권 검증과 결제 승인 API를 사용할 수 있습니다.
        </div>
        {showGuestTransferFailure ? (
          <div className="checkout-notice" role="alert" aria-live="assertive">
            로그인은 완료됐지만 이전 기록 연결에 실패했어요. 다시 로그인하시거나 잠시 후 재시도해 주세요.
          </div>
        ) : null}
        <Link className="primary-button full-button" href="/login?next=/checkout">
          로그인하고 결제 계속하기
        </Link>
        <Link className="secondary-button full-button" href={kind === "saju" ? "/saju" : "/tarot"}>
          무료 리딩으로 돌아가기
        </Link>
      </div>
    </section>
  );
}
