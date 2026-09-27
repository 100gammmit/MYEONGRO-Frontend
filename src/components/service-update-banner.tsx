import {
  getPublishedServiceUpdates,
  koreaDateFromInstant,
  type ServiceUpdate,
} from "@/domain/service-updates/model";
import { SERVICE_UPDATES } from "@/domain/service-updates/registry";

import { ServiceUpdateBannerLive } from "./service-update-banner-live";

export function ServiceUpdateBanner({
  updates = SERVICE_UPDATES,
  today = koreaDateFromInstant(),
}: {
  updates?: readonly ServiceUpdate[];
  today?: string;
}) {
  return (
    <ServiceUpdateBannerLive
      initialToday={today}
      publishedUpdates={getPublishedServiceUpdates(updates, today)}
    />
  );
}
