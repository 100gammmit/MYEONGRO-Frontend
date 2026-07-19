import type { ReactNode } from "react";

import { AuthenticatedPageBoundary } from "@/components/authenticated-page-boundary";

export default function TarotLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedPageBoundary>{children}</AuthenticatedPageBoundary>;
}
