"use client";

import Link from "next/link";

// Rendered inside the root layout for errors thrown below it. The error itself is never shown:
// its message may carry internal details, and the page offers nothing the user can act on.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="simple-page page-width">
      <p className="eyebrow">ERROR</p>
      <h1>잠시 문제가 생겼어요</h1>
      <div className="empty-state" role="alert">
        <span aria-hidden="true">◇</span>
        <h2>페이지를 불러오지 못했어요</h2>
        <p>잠시 후 다시 시도해 주세요. 문제가 계속되면 홈에서 다시 시작해 주세요.</p>
        <div className="result-actions">
          <button className="primary-button" onClick={reset} type="button">다시 시도</button>
          <Link className="secondary-button" href="/">홈으로 가기</Link>
        </div>
      </div>
    </section>
  );
}
