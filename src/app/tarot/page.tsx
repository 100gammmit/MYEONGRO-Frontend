import { publicPageMetadata } from "@/infrastructure/site-metadata";
import { TarotExperience } from "@/components/tarot-experience";
import { parseAiTarotSpreadType } from "@/domain/tarot";

export const metadata = publicPageMetadata(
  "/tarot",
  "AI 타로와 무료 오늘의 카드 | 명로",
  "로그인 없이 오늘의 카드를 보거나 질문에 맞는 고민·관계 3장과 선택 5장 AI 타로 리딩을 골라 보세요.",
);

interface TarotPageProps {
  searchParams: Promise<{ spread?: string | string[] }>;
}

// `spread` brings back the AI spread a guest picked before being sent to log in.
export default async function TarotPage({ searchParams }: TarotPageProps) {
  const { spread } = await searchParams;
  const initialSpread = parseAiTarotSpreadType(Array.isArray(spread) ? spread[0] : spread);
  return <TarotExperience initialSpread={initialSpread ?? undefined} />;
}
