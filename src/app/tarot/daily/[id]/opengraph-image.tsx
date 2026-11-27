import { SHARE_IMAGE_SIZE, dailyCardShareImage } from "@/app/zodiac/share-image";
import { getDailyCardContent } from "@/domain/daily-card-free";
import { DAILY_CARD_SHARE_IDS, dailyCardFromShareId } from "@/domain/daily-card-free/share-ids.server";

export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "공유받은 오늘의 카드";
export const dynamicParams = false;

export function generateStaticParams() {
  return DAILY_CARD_SHARE_IDS.map((id) => ({ id }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const target = dailyCardFromShareId((await params).id);
  const content = target ? getDailyCardContent(target.cardId, target.variantIndex) : null;
  if (!target || !content) {
    return new Response("Not Found", { status: 404 });
  }
  return dailyCardShareImage({ cardId: target.cardId, cardName: content.cardName, title: content.title });
}
