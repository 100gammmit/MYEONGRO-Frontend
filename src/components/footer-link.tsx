"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// The footer is rendered by the server layout; only the current-page marker needs the pathname.
export function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <Link aria-current={pathname === href ? "page" : undefined} href={href}>
      {children}
    </Link>
  );
}
