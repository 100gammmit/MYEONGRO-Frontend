import Link from "next/link";

import {
  formatKoreaDate,
  getActiveImportantServiceUpdates,
  koreaDateFromInstant,
  SERVICE_UPDATE_NOTICE_LABELS,
  type ServiceUpdate,
} from "@/domain/service-updates/model";
import { SERVICE_UPDATES } from "@/domain/service-updates/registry";

export function ServiceUpdateBanner({
  updates = SERVICE_UPDATES,
  today = koreaDateFromInstant(),
}: {
  updates?: readonly ServiceUpdate[];
  today?: string;
}) {
  const activeUpdates = getActiveImportantServiceUpdates(updates, today);
  if (activeUpdates.length === 0) return null;

  return (
    <aside aria-label="중요 업데이트" className="service-update-banner">
      <div className="service-update-banner-inner page-width">
        <strong>중요 업데이트</strong>
        <ul>
          {activeUpdates.map((update) => (
            <li key={update.id}>
              <span className={`service-update-level ${update.noticeLevel}`}>
                {SERVICE_UPDATE_NOTICE_LABELS[update.noticeLevel]}
              </span>
              <Link href={`/updates#${update.id}`}>
                {update.title}
                <span className="service-update-date">
                  {` · ${formatKoreaDate(update.effectiveDate)} ${today < update.effectiveDate ? "시행 예정" : "시행"}`}
                </span>
                <span aria-hidden="true"> →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
