import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/faq-list";
import { FAQ_GROUPS } from "@/content/reading-help";
import styles from "@/components/reading-help.module.css";

export const metadata: Metadata = {
  title: "자주 묻는 질문 | 명로",
  description: "크레딧, 기록, 개인정보, 사주 입력과 타로 이용 중 궁금한 점을 확인하세요.",
};

export default function FaqPage() {
  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <p className="eyebrow">FAQ</p>
        <h1>자주 묻는 질문</h1>
        <p>이용 중 궁금한 점을 모았습니다. 질문 준비부터 결과 읽기까지는 사용 가이드에서 안내합니다.</p>
        <div className={styles.links}><Link href="/guide/tarot">타로 사용 가이드</Link><Link href="/guide/saju">사주 사용 가이드</Link></div>
      </header>
      <nav className={styles.toc} aria-label="질문 분류">
        {FAQ_GROUPS.map((group) => <a key={group.id} href={`#${group.id}`}>{group.title}</a>)}
      </nav>
      <FaqList groups={FAQ_GROUPS} />
    </article>
  );
}
