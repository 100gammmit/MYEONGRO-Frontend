import Link from "next/link";
import styles from "./reading-help.module.css";

export function ReadingHelpEntry() {
  return (
    <section className={`page-width ${styles.entry}`} aria-labelledby="reading-help-title">
      <p className="eyebrow">READING GUIDE</p>
      <h2 id="reading-help-title">처음이라면, 여기서 시작하세요</h2>
      <p>질문을 준비하는 방법부터 결과 읽기까지. 이용 중 궁금한 점은 FAQ에서 확인할 수 있습니다.</p>
      <nav className={styles.links} aria-label="리딩 이용 안내">
        <Link href="/guide/tarot">타로 사용 가이드</Link>
        <Link href="/guide/saju">사주 사용 가이드</Link>
        <Link href="/faq">자주 묻는 질문</Link>
      </nav>
    </section>
  );
}

// Forms keep their inputs in memory. Help must not navigate the editing tab away.
export function ReadingGuideLink({ kind }: { kind: "tarot" | "saju" }) {
  return (
    <p className={styles.inline}>
      <Link href={`/guide/${kind}`} target="_blank" rel="noopener noreferrer">
        {kind === "tarot" ? "타로" : "사주"} 사용 가이드 <span>(새 탭)</span>
      </Link>
    </p>
  );
}
