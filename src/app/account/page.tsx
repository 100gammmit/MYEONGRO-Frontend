import Link from "next/link";
import { AccountDeleteButton } from "./account-delete-button";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionUser } from "@/infrastructure/backend/session-auth";

export default async function AccountPage() {
  const cookieHeader = await getBackendCookieHeader();
  const user = await getSpringSessionUser(cookieHeader);

  if (!user) {
    return (
      <article className="simple-page page-width">
        <p className="eyebrow">ACCOUNT</p>
        <h1>계정 설정</h1>
        <p>계정 관리는 로그인 후 사용할 수 있습니다.</p>
        <Link href="/login?next=%2Faccount" className="primary-button narrow-button">
          로그인하기
        </Link>
      </article>
    );
  }

  return (
    <article className="simple-page page-width">
      <p className="eyebrow">ACCOUNT</p>
      <h1>계정 설정</h1>
      <p>현재 로그인한 계정의 저장 기록과 연결 상태를 관리합니다.</p>
      <AccountDeleteButton />
    </article>
  );
}
