import type { Metadata } from "next";
import { FooterLink } from "@/components/footer-link";
import { ReadingCreditProvider } from "@/components/reading-credit-provider";
import { ServiceUpdateBanner } from "@/components/service-update-banner";
import { SiteHeader } from "@/components/site-header";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionUser } from "@/infrastructure/backend/session-auth";
import "@kfonts/maruburi";
import "@fontsource-variable/noto-serif-kr";
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

  // globals.css scrolls in-page links smoothly; the attribute tells Next.js that is intended, so it
  // keeps jumping straight to the top on route changes (and stays that way after Next.js 16).
  return (
    <html lang="ko" data-theme="dark" data-scroll-behavior="smooth">
      <body>
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <ReadingCreditProvider authenticated={authenticated}>
          <SiteHeader authenticated={authenticated} />
          <ServiceUpdateBanner />
          <main>{children}</main>
          <footer className="site-footer">
            <p>
              명로의 해석은 자기 성찰을 위한 콘텐츠이며 중요한 결정을 대신하지 않습니다.
            </p>
            <div>
              <FooterLink href="/about/reading">명로의 리딩 방식</FooterLink>
              <FooterLink href="/updates">업데이트 소식</FooterLink>
              <FooterLink href="/terms">서비스 이용약관</FooterLink>
              <FooterLink href="/privacy">개인정보 처리방침</FooterLink>
              <span>© 2026 MYEONGRO</span>
            </div>
          </footer>
        </ReadingCreditProvider>
      </body>
    </html>
  );
}
