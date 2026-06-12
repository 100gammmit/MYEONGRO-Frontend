import Link from "next/link";

export function SiteHeader({ authenticated }: { authenticated: boolean }) {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="명로 홈">
        <span className="brand-mark">명</span>
        <span>명로</span>
      </Link>
      <nav>
        {authenticated ? (
          <>
            <Link href="/records">내 기록</Link>
            <form action="/auth/logout" method="post">
              <button type="submit" className="nav-cta nav-button">
                로그아웃
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="nav-cta">
            카카오 로그인
          </Link>
        )}
      </nav>
    </header>
  );
}
