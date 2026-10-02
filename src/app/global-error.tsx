"use client";

import Link from "next/link";
import "@kfonts/maruburi";
import "@fontsource-variable/noto-serif-kr";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";

import { StatusPanel } from "@/components/status-panel";
import "./globals.css";

// Replaces the root layout when the layout itself fails, so it brings its own <html>, fonts and
// styles. Retrying reloads the page: the failure is in the root layout, so nothing below it can be
// re-rendered.
export default function GlobalError() {
  return (
    <html lang="ko" data-theme="dark">
      <body>
        <main>
          <StatusPanel
            alert
            eyebrow="ERROR"
            title="잠시 문제가 생겼어요"
            heading="서비스를 불러오지 못했어요"
            description="잠시 후 다시 시도해 주세요."
          >
            <button className="primary-button" onClick={() => window.location.reload()} type="button">다시 시도</button>
            <Link className="secondary-button" href="/">홈으로 가기</Link>
          </StatusPanel>
        </main>
      </body>
    </html>
  );
}
