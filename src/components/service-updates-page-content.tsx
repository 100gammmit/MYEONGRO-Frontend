import Link from "next/link";

import {
  findServiceUpdateCorrection,
  formatKoreaDate,
  getPublishedServiceUpdates,
  getServiceUpdateStatus,
  koreaDateFromInstant,
  SERVICE_UPDATE_CATEGORY_LABELS,
  SERVICE_UPDATE_NOTICE_LABELS,
  type ServiceUpdate,
} from "@/domain/service-updates/model";

export function ServiceUpdatesPageContent({
  updates,
  today = koreaDateFromInstant(),
}: {
  updates: readonly ServiceUpdate[];
  today?: string;
}) {
  const publishedUpdates = getPublishedServiceUpdates(updates, today);

  return (
    <article className="simple-page updates-page page-width">
      <p className="eyebrow">UPDATES</p>
      <h1>업데이트 내역</h1>
      {publishedUpdates.length === 0 ? (
        <div className="updates-empty">
          <h2>아직 등록된 소식이 없습니다.</h2>
        </div>
      ) : (
        <ol aria-label="명로 업데이트 목록" className="updates-list">
          {publishedUpdates.map((update) => {
            const status = getServiceUpdateStatus(update, today);
            const correction = findServiceUpdateCorrection(publishedUpdates, update.id);
            return (
              <li className="update-entry" id={update.id} key={update.id}>
                <div className="update-entry-meta">
                  <span className={`update-kind ${update.category}`}>
                    {SERVICE_UPDATE_CATEGORY_LABELS[update.category]}
                  </span>
                  <span className={`update-status ${status}`}>
                    {status === "upcoming" ? "시행 예정" : "적용됨"}
                  </span>
                  {update.noticeLevel !== "routine" ? (
                    <span className="update-notice-level">
                      {SERVICE_UPDATE_NOTICE_LABELS[update.noticeLevel]}
                    </span>
                  ) : null}
                  {update.correctionOf ? <span className="update-correction-label">정정</span> : null}
                </div>
                <h2>{update.title}</h2>
                <p className="update-summary">{update.summary}</p>
                <dl className="update-dates">
                  <div>
                    <dt>게시일</dt>
                    <dd><time dateTime={update.publishedDate}>{formatKoreaDate(update.publishedDate)}</time></dd>
                  </div>
                  <div>
                    <dt>시행일</dt>
                    <dd><time dateTime={update.effectiveDate}>{formatKoreaDate(update.effectiveDate)}</time></dd>
                  </div>
                </dl>
                {update.emergencyReason ? (
                  <p className="update-emergency-reason">
                    <strong>긴급 조치 사유</strong> {update.emergencyReason}
                  </p>
                ) : null}
                <ul className="update-changes">
                  {update.changes.map((change) => <li key={change}>{change}</li>)}
                </ul>
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
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}
