import Link from "next/link";

import { normalizeNextPath } from "@/infrastructure/auth/next-path";

const LOGIN_PROVIDERS = [
  { id: "kakao", label: "카카오로 계속하기", Logo: KakaoLogo },
  { id: "google", label: "Google로 계속하기", Logo: GoogleLogo },
] as const;

export function AuthButtons({ next }: { next?: string }) {
  const loginUrl = new URLSearchParams({
    next: normalizeNextPath(next),
  });

  return (
    <>
      {LOGIN_PROVIDERS.map((provider) => (
        <Link
          className={`social-button ${provider.id}`}
          href={`/auth/login/${provider.id}?${loginUrl}`}
          key={provider.id}
        >
          <provider.Logo />
          <span>{provider.label}</span>
        </Link>
      ))}
    </>
  );
}

function KakaoLogo() {
  return (
    <svg
      aria-hidden="true"
      className="social-logo"
      data-testid="kakao-login-logo"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 4C6.48 4 2 7.52 2 11.86c0 2.82 1.91 5.3 4.77 6.68l-.66 2.42a.5.5 0 0 0 .75.55l2.9-1.93c.72.1 1.47.15 2.24.15 5.52 0 10-3.52 10-7.87S17.52 4 12 4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      className="social-logo"
      data-testid="google-login-logo"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d="M21.6 12.23c0-.77-.07-1.51-.2-2.23H12v4.22h5.37a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.99-4.31 2.99-7.52Z" fill="#4285F4" />
      <path d="M12 22c2.7 0 4.97-.9 6.61-2.25l-3.23-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.08v2.59A9.98 9.98 0 0 0 12 22Z" fill="#34A853" />
      <path d="M6.41 14.08A6.01 6.01 0 0 1 6.09 12c0-.72.12-1.42.32-2.08V7.33H3.08A9.98 9.98 0 0 0 2 12c0 1.61.39 3.14 1.08 4.67l3.33-2.59Z" fill="#FBBC05" />
      <path d="M12 5.8c1.47 0 2.79.51 3.82 1.5l2.86-2.86C16.96 2.84 14.69 2 12 2a9.98 9.98 0 0 0-8.92 5.33l3.33 2.59C7.2 7.56 9.4 5.8 12 5.8Z" fill="#EA4335" />
    </svg>
  );
}
