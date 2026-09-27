import type { Metadata } from "next";

import { ServiceUpdatesPageContent } from "@/components/service-updates-page-content";
import { SERVICE_UPDATES } from "@/domain/service-updates/registry";

export const metadata: Metadata = {
  title: "업데이트 소식 | 명로",
  description: "명로의 기능, 정책, 크레딧과 서비스 변경 소식",
};

// Publication and banner windows depend on the current Korea calendar date.
export const dynamic = "force-dynamic";

export default function UpdatesPage() {
  return <ServiceUpdatesPageContent updates={SERVICE_UPDATES} />;
}
