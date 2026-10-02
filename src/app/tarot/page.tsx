import { TarotExperience } from "@/components/tarot-experience";
import { parseAiTarotSpreadType } from "@/domain/tarot";

interface TarotPageProps {
  searchParams: Promise<{ spread?: string | string[] }>;
}

// `spread` brings back the AI spread a guest picked before being sent to log in.
export default async function TarotPage({ searchParams }: TarotPageProps) {
  const { spread } = await searchParams;
  const initialSpread = parseAiTarotSpreadType(Array.isArray(spread) ? spread[0] : spread);
  return <TarotExperience initialSpread={initialSpread ?? undefined} />;
}
