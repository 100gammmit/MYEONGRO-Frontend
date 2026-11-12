import Link from "next/link";
import { ProtectedPageUnavailable } from "@/components/protected-page-unavailable";
import { AccountCreditSummary } from "./account-credit-summary";
import { AccountDeleteButton } from "./account-delete-button";
import { ConsentSettings } from "./consent-settings";
import { isSupportedRecord } from "@/domain/reading/record-list";
import { BackendReadingRecordsClient } from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";
import { deriveDailyCardUserScope } from "@/domain/daily-card-free/account-scope.server";

// The count is a convenience: if the records list fails, the group keeps its link and drops the number.
async function countSavedReadings(cookieHeader: string | null): Promise<number | null> {
  try {
    const readings = await new BackendReadingRecordsClient(cookieHeader).list();
    return readings.filter(isSupportedRecord).length;
  } catch {
    return null;
  }
}

export default async function AccountPage() {
  const cookieHeader = await getBackendCookieHeader();
  const session = await getSpringSessionState(cookieHeader);

  if (session.status === "unavailable") return <ProtectedPageUnavailable />;

  if (session.status === "unauthenticated") {
    return (
      <article className="flow-page page-width">
        <h1>계정</h1>
        <p className="flow-lead">계정 관리는 로그인한 뒤 쓸 수 있어요.</p>
        <div className="account-guest-action">
          <Link href="/login?next=%2Faccount" className="primary-button">
            로그인하기
          </Link>
        </div>
      </article>
    );
  }

  const savedReadings = await countSavedReadings(cookieHeader);

  return (
    <article className="flow-page page-width">
      <h1>계정</h1>
      <p className="flow-lead">크레딧과 저장된 기록, AI 리딩 동의를 확인하고 바꿀 수 있어요.</p>
      <div className="account-summary">
        <section className="account-group" aria-labelledby="account-credit-heading">
          <h2 id="account-credit-heading">크레딧</h2>
          <AccountCreditSummary />
        </section>
        <section className="account-group" aria-labelledby="account-records-heading">
          <h2 id="account-records-heading">리딩 기록</h2>
          {savedReadings === null ? null : (
            <p className="account-value">저장된 리딩 {savedReadings}개</p>
          )}
          <div className="account-actions">
            <Link className="secondary-button" href="/records">내 기록 보기</Link>
          </div>
        </section>
        <ConsentSettings />
      </div>
      <AccountDeleteButton
        dailyCardStorageScope={deriveDailyCardUserScope(session.user.id)}
      />
    </article>
  );
}
