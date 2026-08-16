"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function ReturnAwareLoginLink() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPath = searchParams.size
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const href = pathname === "/login"
    ? "/login"
    : `/login?next=${encodeURIComponent(currentPath)}`;

  return (
    <Link href={href} className="nav-cta">
      로그인
    </Link>
  );
}
