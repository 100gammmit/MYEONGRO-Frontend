import Link from "next/link";
import styles from "./reading-help.module.css";

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
