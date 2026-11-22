"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";

import { getDisplayedReadingCredits } from "@/domain/reading-credit";
import { BrandMark } from "./brand-mark";
import { SAMPLE_PILLARS } from "./home-saju-chart";
import { useReadingCredits } from "./reading-credit-provider";
import { ReturnAwareLoginLink } from "./return-aware-login-link";
import { currentCategory, currentLinkHref, readingCategories, type ReadingCategory } from "./site-header-menu";
import { tarotCardImageSrc } from "./tarot-card-face";

// A renamed card asset should fail loudly here, not as an empty image in the menu.
const FOOL_SRC: string = (() => {
  const src = tarotCardImageSrc("major-00-fool");
  if (!src) throw new Error("Unknown tarot card id in the header menu: major-00-fool");
  return src;
})();

export function SiteHeader({ authenticated, zodiacYear }: { authenticated: boolean; zodiacYear?: number }) {
  const credits = useReadingCredits();
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="site-header-start">
        <Link href="/" className="brand" aria-label="명로 홈">
          <BrandMark seal size={26} />
          <span>명로</span>
        </Link>
        <ReadingMenus pathname={pathname} zodiacYear={zodiacYear} />
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

/**
 * 타로 and 사주 open a full-width band under the header on click (never on hover), one at a time. Escape
 * returns focus to the button; an outside press, a followed link or a new page closes it.
 */
function ReadingMenus({ pathname, zodiacYear }: { pathname: string; zodiacYear?: number }) {
  const [open, setOpen] = useState<ReadingCategory["id"] | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Partial<Record<ReadingCategory["id"], HTMLButtonElement | null>>>({});
  const categories = readingCategories(zodiacYear);
  const here = currentCategory(pathname);
  const currentHref = currentLinkHref(pathname);

  useEffect(() => {
    setOpen(null);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !open) return;
      // Bring focus home only when it is still in the menu; elsewhere on the page it stays put.
      if (rootRef.current?.contains(document.activeElement)) buttonRefs.current[open]?.focus();
      setOpen(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // The band is fixed to the viewport so it spans the screen without a sideways scrollbar. Placed before
  // paint so it never shows at the fallback top, it follows the header's bottom edge while the page
  // scrolls and closes once the header has scrolled away. The header gets a class to rise above fixed
  // action bars while a menu is open.
  useLayoutEffect(() => {
    const header = rootRef.current?.closest(".site-header");
    if (!open || !header) return;
    function place() {
      const { bottom, height } = header!.getBoundingClientRect();
      // A header with no height has no layout yet (or none at all, as in tests); only a laid-out header
      // above the viewport has scrolled away.
      if (height > 0 && bottom <= 0) {
        setOpen(null);
        return;
      }
      rootRef.current?.style.setProperty("--reading-menu-top", `${Math.max(0, bottom)}px`);
    }
    place();
    header.classList.add("menu-open");
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      header.classList.remove("menu-open");
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  return (
    <nav
      aria-label="리딩"
      className="reading-nav"
      // Tabbing past the last link closes the menu so it does not linger over the page. A blur with no
      // new focus target (Safari clicking a link) is left alone so the click still lands.
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && !rootRef.current?.contains(next)) setOpen(null);
      }}
      ref={rootRef}
    >
      {categories.map((category) => {
        const expanded = open === category.id;
        const panelId = `reading-menu-${category.id}`;
        return (
          <div className="reading-menu" key={category.id}>
            <button
              aria-controls={panelId}
              aria-current={here === category.id ? "true" : undefined}
              aria-expanded={expanded}
              className={here === category.id ? "reading-nav-link active" : "reading-nav-link"}
              onClick={() => setOpen((current) => (current === category.id ? null : category.id))}
              ref={(node) => { buttonRefs.current[category.id] = node; }}
              type="button"
            >
              {category.label}
              <svg aria-hidden="true" className="reading-menu-chevron" fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="12"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div className={expanded ? "reading-menu-panel open" : "reading-menu-panel"} id={panelId}>
              <div className="reading-menu-inner">
                {category.groups.map((group) => (
                  <div className="reading-menu-group" key={group.label}>
                    <p>{group.label}</p>
                    <ul>
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link aria-current={link.href === currentHref ? "page" : undefined} href={link.href} onClick={() => setOpen(null)}>
                            {link.label}
                            <svg aria-hidden="true" className="reading-menu-arrow" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {/* The art loads only once a menu is opened, so the first page view fetches no extra image. */}
                {expanded && <MenuArt category={category.id} />}
              </div>
            </div>
          </div>
        );
      })}
      {/* Dims the page under the band. It closes on click, not pointerdown, so it is still there to take the
          tap's click instead of the element beneath it. */}
      {open && <div aria-hidden="true" className="reading-menu-scrim" onClick={() => setOpen(null)} />}
    </nav>
  );
}

/** The landing page's own pictures, as decoration at the band's right end on wide screens. */
function MenuArt({ category }: { category: ReadingCategory["id"] }) {
  if (category === "tarot") {
    return (
      <span aria-hidden="true" className="reading-menu-art tarot">
        <span className="reading-menu-card-back tarot-back-art" />
        <Image alt="" className="reading-menu-card-face" height={773} src={FOOL_SRC} unoptimized width={480} />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="reading-menu-art saju">
      {SAMPLE_PILLARS.map((pillar) => (
        <span className="reading-menu-pillar" key={pillar.label}>
          <small>{pillar.label}</small>
          {pillar.stem ? (
            <span className={pillar.label === "일주" ? "cell day" : "cell"}>
              <span>{pillar.stem}</span>
              <span>{pillar.branch}</span>
            </span>
          ) : (
            <span className="cell unknown">
              <span>시각</span>
              <span>모름</span>
            </span>
          )}
        </span>
      ))}
    </span>
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
  const { data } = getDisplayedReadingCredits(state);
  if (data) {
    return (
      <span className="credit-indicator" title={`오늘 무료 ${data.balance.free} · 추가 ${data.balance.paid}`}>
        크레딧 <strong>{data.balance.total}</strong>
      </span>
    );
  }
  return <span className="credit-indicator" aria-label="크레딧 확인 중">크레딧 ···</span>;
}
