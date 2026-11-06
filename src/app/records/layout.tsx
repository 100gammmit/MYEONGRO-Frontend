import { PRIVATE_PAGE_METADATA } from "@/infrastructure/site-metadata";
import type { ReactNode } from "react";

import { AuthenticatedPageBoundary } from "@/components/authenticated-page-boundary";

export const metadata = PRIVATE_PAGE_METADATA;

export default function RecordsLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedPageBoundary>{children}</AuthenticatedPageBoundary>;
}
