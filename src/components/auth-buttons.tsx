import Link from "next/link";

import { normalizeNextPath } from "@/infrastructure/auth/next-path";

const LOGIN_PROVIDERS = [
  { id: "kakao", label: "카카오로 계속하기" },
  { id: "google", label: "Google로 계속하기" },
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
          {provider.label}
        </Link>
      ))}
    </>
  );
}
