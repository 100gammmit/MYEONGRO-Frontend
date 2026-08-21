"use client";

import Link from "next/link";
import { Suspense } from "react";

import { useReadingCredits } from "./reading-credit-provider";
import { ReturnAwareLoginLink } from "./return-aware-login-link";

export function SiteHeader({ authenticated }: { authenticated: boolean }) {
  const credits = useReadingCredits();
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="명로 홈">
        <span className="brand-mark">명</span>
        <span>명로</span>
      </Link>
      <nav>
        {authenticated ? (
          <>
            <CreditIndicator
              state={credits.state}
              onRetry={() => void credits.refresh()}
            />
            <Link href="/records">내 기록</Link>
            <Link href="/account">계정</Link>
            <form action="/auth/logout" method="post">
              <button type="submit" className="nav-cta nav-button">
                로그아웃
              </button>
            </form>
          </>
        ) : (
          <Suspense
            fallback={(
              <Link href="/login" className="nav-cta">
                로그인
              </Link>
            )}
          >
            <ReturnAwareLoginLink />
          </Suspense>
        )}
      </nav>
    </header>
  );
}

function CreditIndicator({
  state,
  onRetry,
}: {
  state: ReturnType<typeof useReadingCredits>["state"];
  onRetry: () => void;
}) {
  if (state.status === "error") {
    return (
      <button className="credit-indicator credit-indicator-button" onClick={onRetry} type="button">
        크레딧 다시 확인
      </button>
    );
  }
  if (state.status === "ready") {
    return (
      <span className="credit-indicator" title={`무료 ${state.data.balance.free} · 지급 ${state.data.balance.paid}`}>
        크레딧 <strong>{state.data.balance.total}</strong>
      </span>
    );
  }
  return <span className="credit-indicator" aria-label="크레딧 확인 중">크레딧 ···</span>;
}
