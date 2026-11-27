import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "@/components/daily-card-experience.module.css";
import { DailyCardResultCard } from "@/components/daily-card-result-card";
import { ReadingShell } from "@/components/reading-shell";
import { getDailyCardContent } from "@/domain/daily-card-free";
import { DAILY_CARD_SHARE_IDS, dailyCardFromShareId, dailyCardSharePath } from "@/domain/daily-card-free/share-ids.server";
import { generatedShareImage, sharedPageMetadata } from "@/infrastructure/site-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return DAILY_CARD_SHARE_IDS.map((id) => ({ id }));
}

interface SharedDailyCardPageProps {
  params: Promise<{ id: string }>;
}

async function sharedCard(params: SharedDailyCardPageProps["params"]) {
  const { id } = await params;
  const target = dailyCardFromShareId(id);
  const content = target ? getDailyCardContent(target.cardId, target.variantIndex) : null;
  return target && content ? { id, cardId: target.cardId, content } : null;
}

export async function generateMetadata({ params }: SharedDailyCardPageProps) {
  const card = await sharedCard(params);
  if (!card) return {};
  const path = dailyCardSharePath(card.id);
  return sharedPageMetadata(
    path,
    `누군가 뽑은 오늘의 카드: ${card.content.cardName} | 명로`,
    `${card.content.title}. 나도 로그인 없이 오늘의 카드 한 장 뽑아 보기`,
    generatedShareImage(path, `오늘의 카드 · ${card.content.cardName}`),
  );
}

// The result someone drew and shared, exactly as they saw it, with the way to draw one's own.
export default async function SharedDailyCardPage({ params }: SharedDailyCardPageProps) {
  const card = await sharedCard(params);
  if (!card) notFound();

  return (
    <ReadingShell
      eyebrow="공유받은 오늘의 카드"
      title={card.content.title}
      description="누군가 뽑은 오늘의 카드예요."
      back={{ href: "/tarot", label: "타로" }}
    >
      <DailyCardResultCard cardId={card.cardId} content={card.content} />
      <div className="reading-actions">
        <Link className="primary-button full-button" href="/tarot/daily">나도 오늘의 카드 뽑기</Link>
        <p className={styles.shareStatus}>로그인 없이 무료로, 하루 한 장 뽑을 수 있어요.</p>
      </div>
    </ReadingShell>
  );
}
