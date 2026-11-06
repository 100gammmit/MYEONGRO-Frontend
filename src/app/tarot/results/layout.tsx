import type { ReactNode } from "react";
import { PRIVATE_PAGE_METADATA } from "@/infrastructure/site-metadata";

export const metadata = PRIVATE_PAGE_METADATA;

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
