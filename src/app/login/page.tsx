import { AuthButtons } from "@/components/auth-buttons";
import { normalizeNextPath } from "@/infrastructure/auth/next-path";

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = normalizeNextPath(requestedNext);

  return (
    <section className="simple-page page-width auth-page">
      <p className="eyebrow">KEEP YOUR STORY</p>
      <h1>리딩을 안전하게 보관하세요</h1>
      <p>결과 저장과 결제는 로그인 후 이용할 수 있습니다.</p>
      <div className="auth-card">
        <AuthButtons next={next} />
        <small>카카오 계정으로 간편하게 시작할 수 있습니다.</small>
      </div>
    </section>
  );
}
