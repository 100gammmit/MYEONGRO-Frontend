"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { BrandMark } from "./brand-mark";
import { useReadingCredits } from "./reading-credit-provider";
import { ReturnAwareLoginLink } from "./return-aware-login-link";

const READING_LINKS = [
  { href: "/tarot", label: "타로" },
  { href: "/saju", label: "사주" },
] as const;

export function SiteHeader({ authenticated }: { authenticated: boolean }) {
  const credits = useReadingCredits();
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="site-header-start">
        <Link href="/" className="brand" aria-label="명로 홈">
          <BrandMark seal size={26} />
          <span>명로</span>
        </Link>
        <nav aria-label="리딩" className="reading-nav">
          {READING_LINKS.map((link) => {
            // Everything under a reading (spreads, daily fortune, results) belongs to that section.
            const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                aria-current={current ? "page" : undefined}
                className={current ? "reading-nav-link active" : "reading-nav-link"}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="site-header-end">
        {authenticated ? (
          <>
            <CreditIndicator
              state={credits.state}
              onRetry={() => void credits.refresh()}
            />
            <AccountMenu pathname={pathname} />
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
      </div>
    </header>
  );
}

// Desktop shows the account links inline; phones fold them behind one menu button.
function AccountMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        aria-controls="account-menu-panel"
        aria-expanded={open}
        aria-label="계정 메뉴"
        className="account-menu-button"
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
        type="button"
      >
        <span aria-hidden="true" className="menu-icon"><i /><i /><i /></span>
      </button>
      <div className={open ? "account-menu-panel open" : "account-menu-panel"} id="account-menu-panel">
        <Link href="/records" onClick={() => setOpen(false)}>내 기록</Link>
        <Link href="/account" onClick={() => setOpen(false)}>계정</Link>
        <form action="/auth/logout" method="post">
          <button type="submit" className="nav-cta nav-button">
            로그아웃
          </button>
        </form>
      </div>
    </div>
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
      <span className="credit-indicator" title={`오늘 무료 ${state.data.balance.free} · 추가 ${state.data.balance.paid}`}>
        크레딧 <strong>{state.data.balance.total}</strong>
      </span>
    );
  }
  return <span className="credit-indicator" aria-label="크레딧 확인 중">크레딧 ···</span>;
}
