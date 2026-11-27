import type { Ref } from "react";

import type { DailyCardContent } from "@/domain/daily-card-free";

import styles from "./daily-card-experience.module.css";
import { TarotCardFace } from "./tarot-card-face";

// One daily card result, as the person who drew it sees it and as a shared link shows it.
export function DailyCardResultCard({
  cardId,
  content,
  headingRef,
}: {
  cardId: string;
  content: DailyCardContent;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <article className={`wizard-card ${styles.result}`}>
      {/* The line beneath names the card, so the front itself is shown without a caption. */}
      <div className={styles.cardImage}>
        <TarotCardFace cardId={cardId} />
      </div>
      <p className={styles.cardName}>오늘의 카드 · {content.cardName}</p>
      <h2 ref={headingRef} tabIndex={headingRef ? -1 : undefined}>{content.today.heading}</h2>
      <p>{content.today.body}</p>
      <p className={styles.guidance}>{content.guidance[0]}</p>
      <small>{content.disclaimer}</small>
    </article>
  );
}
