import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionUser } from "@/infrastructure/backend/session-auth";
import "@kfonts/maruburi";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "명로 | AI 사주와 타로",
  description: "오늘의 마음을 비추는 AI 사주·타로 리딩",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authenticated = Boolean(
    await getSpringSessionUser(await getBackendCookieHeader()),
  );

  return (
    <html lang="ko" data-theme="dark">
      <body>
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <SiteHeader authenticated={authenticated} />
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            명로의 해석은 자기 성찰을 위한 콘텐츠이며 중요한 결정을 대신하지 않습니다.
          </p>
          <div>
            <Link href="/privacy">개인정보 처리방침</Link>
            <span>© 2026 MYEONGRO</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
