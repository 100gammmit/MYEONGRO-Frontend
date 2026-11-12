import Link from "next/link";

import { SignupAgeConfirmation } from "./signup-age-confirmation";

export default function SignupAgePage() {
  return (
    <section className="flow-page page-width signup-page">
      <div className="step-top">
        <Link className="back-link" href="/login"><span aria-hidden="true">←</span> 로그인</Link>
        <p className="step-meta"><span className="step-flow">회원 가입</span></p>
      </div>
      <SignupAgeConfirmation />
    </section>
  );
}
