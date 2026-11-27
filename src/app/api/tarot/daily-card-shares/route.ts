import { NextResponse } from "next/server";
import { z } from "zod";

import { dailyCardSharePath, dailyCardShareId } from "@/domain/daily-card-free/share-ids.server";

const requestSchema = z.object({
  cardId: z.string().min(1).max(64),
  variantIndex: z.number().int().min(0),
}).strict();

// Looks up the fixed share link for a daily card result. Nothing is stored, so it does not go
// through the backend; the ID table stays on this server.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const parsed = requestSchema.safeParse(body);
  const id = parsed.success ? dailyCardShareId(parsed.data.cardId, parsed.data.variantIndex) : null;
  if (!id) {
    return NextResponse.json({ message: "지원하지 않는 오늘의 카드입니다." }, { status: 400 });
  }
  return NextResponse.json({ path: dailyCardSharePath(id) });
}
