"use client";

import Link from "next/link";

import "./globals.css";

// Replaces the root layout when the layout itself fails, so it brings its own <html> and styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko" data-theme="dark">
      <body>
        <main>
          <section className="simple-page page-width">
            <p className="eyebrow">ERROR</p>
            <h1>잠시 문제가 생겼어요</h1>
            <div className="empty-state" role="alert">
              <span aria-hidden="true">◇</span>
              <h2>서비스를 불러오지 못했어요</h2>
              <p>잠시 후 다시 시도해 주세요.</p>
              <div className="result-actions">
                <button className="primary-button" onClick={reset} type="button">다시 시도</button>
                <Link className="secondary-button" href="/">홈으로 가기</Link>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
