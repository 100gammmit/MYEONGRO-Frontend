import { SignupAgeConfirmation } from "./signup-age-confirmation";

export default function SignupAgePage() {
  return (
    <section className="simple-page page-width auth-page signup-age-page">
      <p className="eyebrow">MEMBERSHIP</p>
      <h1>가입 자격을 확인해 주세요</h1>
      <p>소셜 계정 확인이 완료되었습니다. 회원 가입을 마치기 전에 연령을 확인합니다.</p>
      <div className="auth-card">
        <SignupAgeConfirmation />
      </div>
    </section>
  );
}
