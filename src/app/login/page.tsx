import { AuthButtons } from "@/components/auth-buttons";
import { normalizeNextPath } from "@/infrastructure/auth/next-path";

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[]; reason?: string | string[] }>;
}

// Reasons come from the backend's OAuth redirects; any other value in the address shows nothing.
const LOGIN_NOTICES = new Map([
  ["rate-limited", "로그인 요청이 많아 잠시 제한됐어요. 1분 뒤 다시 시도해 주세요."],
  ["signup-limited", "이 네트워크에서 가입 요청이 많았어요. 내일 다시 시도해 주세요."],
  ["signup-eligibility-missing", "로그인을 완료하지 못했어요. 다시 시도해 주세요."],
]);

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = normalizeNextPath(requestedNext);
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const notice = reason ? LOGIN_NOTICES.get(reason) : undefined;

  return (
    <section className="simple-page page-width auth-page">
      <p className="eyebrow">KEEP YOUR STORY</p>
      <h1>리딩을 안전하게 보관하세요</h1>
      <p>로그인하면 리딩 기록을 안전하게 저장하고 다른 기기에서도 이어서 볼 수 있습니다.</p>
      <div className="auth-card">
        {notice ? <p className="credit-notice" role="alert">{notice}</p> : null}
        <AuthButtons next={next} />
        <small>카카오 또는 Google 계정으로 간편하게 시작할 수 있어요.</small>
      </div>
    </section>
  );
}
