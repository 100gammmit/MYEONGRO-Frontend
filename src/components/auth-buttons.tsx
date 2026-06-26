import Link from "next/link";

import { normalizeNextPath } from "@/infrastructure/auth/next-path";

export function AuthButtons({ next }: { next?: string }) {
  const loginUrl = new URLSearchParams({
    next: normalizeNextPath(next),
  });

  return (
    <Link className="social-button kakao" href={`/auth/login/kakao?${loginUrl}`}>
      카카오로 계속하기
    </Link>
  );
}
