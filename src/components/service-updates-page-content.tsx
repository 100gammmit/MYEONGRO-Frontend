import Link from "next/link";

import {
  findServiceUpdateCorrection,
  getPublishedServiceUpdates,
  getServiceUpdateDateLabel,
  getServiceUpdateStatus,
  groupServiceUpdatesByMonth,
  koreaDateFromInstant,
  SERVICE_UPDATE_CATEGORY_LABELS,
  SERVICE_UPDATE_NOTICE_LABELS,
  type ServiceUpdate,
} from "@/domain/service-updates/model";

import { ServiceUpdateAnchorOpener } from "./service-update-anchor-opener";

// Most notices are routine and already in effect, so only the exceptions get a mark.
function getServiceUpdateMarks(
  update: ServiceUpdate,
  today: string,
): { label: string; tone: "accent" | "danger" }[] {
  const marks: { label: string; tone: "accent" | "danger" }[] = [];
  if (getServiceUpdateStatus(update, today) === "upcoming") marks.push({ label: "시행 예정", tone: "accent" });
  const noticeLabel = SERVICE_UPDATE_NOTICE_LABELS[update.noticeLevel];
  // An emergency notice already says 긴급 안내 as its category, so the level would only repeat it.
  if (update.noticeLevel !== "routine" && noticeLabel !== SERVICE_UPDATE_CATEGORY_LABELS[update.category]) {
    marks.push({ label: noticeLabel, tone: update.noticeLevel === "general" ? "accent" : "danger" });
  }
  if (update.correctionOf) marks.push({ label: "정정", tone: "accent" });
  return marks;
}

export function ServiceUpdatesPageContent({
  updates,
  today = koreaDateFromInstant(),
}: {
  updates: readonly ServiceUpdate[];
  today?: string;
}) {
  const publishedUpdates = getPublishedServiceUpdates(updates, today);

  return (
    <article className="flow-page page-width">
      <h1>업데이트 소식</h1>
      <p className="flow-lead">명로의 기능, 정책, 크레딧과 서비스 변경을 알려 드립니다.</p>
      {publishedUpdates.length === 0 ? (
        <div className="updates-empty">
          <h2>아직 등록된 소식이 없습니다.</h2>
        </div>
      ) : (
        <>
          <ServiceUpdateAnchorOpener />
          {groupServiceUpdatesByMonth(publishedUpdates).map((group, groupIndex) => (
            <section className="updates-month" key={group.month} aria-labelledby={`updates-month-${groupIndex}`}>
              <h2 id={`updates-month-${groupIndex}`}>{group.month}</h2>
              <ol aria-label={`${group.month} 업데이트 목록`} className="updates-list">
                {group.updates.map((update) => {
                  const correction = findServiceUpdateCorrection(publishedUpdates, update.id);
                  return (
                    <li className="update-entry" id={update.id} key={update.id}>
                      <p className="update-when">{getServiceUpdateDateLabel(update)}</p>
                      <div className="update-body">
                        <p className="update-meta">
                          <span className="update-kind">{SERVICE_UPDATE_CATEGORY_LABELS[update.category]}</span>
                          {getServiceUpdateMarks(update, today).map((mark) => (
                            <span className={`update-mark ${mark.tone}`} key={mark.label}>{mark.label}</span>
                          ))}
                        </p>
                        <h3>{update.title}</h3>
                        <p className="update-summary">{update.summary}</p>
                        {update.emergencyReason ? (
                          <p className="update-emergency-reason">
                            <strong>긴급 조치 사유</strong> {update.emergencyReason}
                          </p>
                        ) : null}
                        <details className="update-details">
                          <summary>자세히 보기</summary>
                          <ul className="update-changes">
                            {update.changes.map((change) => <li key={change}>{change}</li>)}
                          </ul>
                        </details>
                        {update.links?.length ? (
                          <nav aria-label={`${update.title} 관련 문서`} className="update-links">
                            {update.links.map((link) => (
                              <Link href={link.href} key={`${link.href}-${link.label}`}>{link.label}</Link>
                            ))}
                          </nav>
                        ) : null}
                        {update.correctionOf ? (
                          <p className="update-correction">
                            <Link href={`/updates#${update.correctionOf}`}>정정 대상 원문 보기</Link>
                          </p>
                        ) : null}
                        {correction ? (
                          <p className="update-correction">
                            이 내용은 이후 정정되었습니다. <Link href={`/updates#${correction.id}`}>정정 내용 보기</Link>
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </>
      )}
    </article>
  );
}
