"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  formatKoreaDate,
  getActiveImportantServiceUpdates,
  koreaDateFromInstant,
  millisecondsUntilNextKoreaDate,
  SERVICE_UPDATE_NOTICE_LABELS,
  type ServiceUpdate,
} from "@/domain/service-updates/model";

export function ServiceUpdateBannerLive({
  publishedUpdates,
  initialToday,
}: {
  publishedUpdates: readonly ServiceUpdate[];
  initialToday: string;
}) {
  const router = useRouter();
  const [today, setToday] = useState(initialToday);
  const activeUpdates = getActiveImportantServiceUpdates(publishedUpdates, today);

  useEffect(() => {
    function refreshPublishedUpdates() {
      setToday(koreaDateFromInstant());
      router.refresh();
    }

    // A small offset ensures the Korea calendar date has crossed even if the
    // timer fires a few milliseconds early. Visibility refresh covers throttled tabs.
    const midnightTimer = window.setTimeout(
      refreshPublishedUpdates,
      millisecondsUntilNextKoreaDate() + 50,
    );
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refreshPublishedUpdates();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearTimeout(midnightTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, today]);

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
