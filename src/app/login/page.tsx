import { redirect } from "next/navigation";

import { AuthButtons } from "@/components/auth-buttons";
import { normalizeNextPath } from "@/infrastructure/auth/next-path";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[]; reason?: string | string[] }>;
}

// Reasons come from the backend's OAuth redirects; any other value in the address shows nothing.
const LOGIN_NOTICES = new Map([
  ["rate-limited", "로그인 요청이 많아 잠시 제한됐어요. 1분 뒤 다시 시도해 주세요."],
  ["signup-eligibility-missing", "로그인을 완료하지 못했어요. 다시 시도해 주세요."],
]);

function pathOf(next: string): string {
  return next.split(/[?#]/, 1)[0];
}

// A signed-in redirect back to the login page would bounce forever, so it falls back to records.
function signedInDestination(next: string): string {
  const path = pathOf(next);
  return path === "/login" || path.startsWith("/login/") ? "/records" : next;
}

// Shown only when the login interrupted a reading, so the person knows their choices wait for them.
function resumeNotice(next: string): string | null {
  const path = pathOf(next);
  if (path === "/tarot" || path.startsWith("/tarot/")) return "로그인을 마치면 고르던 타로 리딩으로 돌아가요.";
  if (path === "/saju" || path.startsWith("/saju/")) return "로그인을 마치면 고르던 사주 리딩으로 돌아가요.";
  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = normalizeNextPath(requestedNext);

  // Someone already signed in has nothing to do here; send them where the login would have.
  // An unavailable session check falls through to the login screen rather than blocking it.
  const session = await getSpringSessionState(await getBackendCookieHeader());
  if (session.status === "authenticated") redirect(signedInDestination(next));

  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const notice = reason ? LOGIN_NOTICES.get(reason) : undefined;
  const resume = resumeNotice(next);

  return (
    <section className="flow-page page-width auth-page">
      <h1>로그인</h1>
      <p className="flow-lead">로그인하면 리딩이 기록에 저장되고, 다른 기기에서도 이어서 볼 수 있어요.</p>
      {resume ? <p className="auth-resume">{resume}</p> : null}
      <div className="auth-options">
        {notice ? <p className="credit-notice" role="alert">{notice}</p> : null}
        <AuthButtons next={next} />
      </div>
      <p className="auth-hint">처음 로그인하면 가입 전에 연령과 이용약관을 확인하는 단계가 이어져요.</p>
    </section>
  );
}
