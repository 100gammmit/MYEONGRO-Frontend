import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요 | 명로",
};

export default function NotFound() {
  return (
    <section className="simple-page page-width">
      <p className="eyebrow">NOT FOUND</p>
      <h1>페이지를 찾을 수 없어요</h1>
      <div className="empty-state">
        <span aria-hidden="true">◇</span>
        <h2>주소가 바뀌었거나 삭제된 페이지예요</h2>
        <p>입력한 주소를 다시 확인해 주세요. 삭제한 리딩 기록은 다시 열 수 없어요.</p>
        <div className="result-actions">
          <Link className="primary-button" href="/">홈으로 가기</Link>
          <Link className="secondary-button" href="/records">내 기록 보기</Link>
        </div>
      </div>
    </section>
  );
}
