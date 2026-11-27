import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

import { SHARE_IMAGE_SIZE } from "@/infrastructure/site-metadata";

export { SHARE_IMAGE_SIZE };

const FONT_DIR = path.join(process.cwd(), "node_modules/pretendard/dist/public/static");
// PNG copies of the card fronts: next/og cannot decode the WebP files the pages use.
const CARD_ART_DIR = path.join(process.cwd(), "assets/share/tarot");

const FRAME_STYLE = {
  width: "100%",
  height: "100%",
  display: "flex",
  padding: "72px 80px",
  background: "linear-gradient(160deg, #11131c 0%, #0b0c10 70%)",
  color: "#e6ebf7",
  fontFamily: "Pretendard",
} as const;

function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#c3cce6", fontSize: 28 }}>
      {/* Same drawing as src/app/icon.svg. */}
      <svg width="36" height="36" viewBox="0 0 64 64">
        <rect x="2.5" y="2.5" width="59" height="59" rx="7" fill="none" stroke="#c9503c" strokeWidth="5" />
        <path d="M13 19V45M51 19V45" fill="none" stroke="#e07655" strokeWidth="5" strokeLinecap="square" />
        <rect x="22" y="12" width="20" height="40" rx="2" fill="none" stroke="#e07655" strokeWidth="5" />
      </svg>
      명로
    </div>
  );
}

async function render(element: ReactElement) {
  const [regular, bold] = await Promise.all([
    readFile(path.join(FONT_DIR, "Pretendard-Regular.otf")),
    readFile(path.join(FONT_DIR, "Pretendard-Bold.otf")),
  ]);
  return new ImageResponse(element, {
    ...SHARE_IMAGE_SIZE,
    fonts: [
      { name: "Pretendard", data: regular, weight: 400, style: "normal" },
      { name: "Pretendard", data: bold, weight: 700, style: "normal" },
    ],
  });
}

// Text-only share cards for the zodiac pages, drawn at build time. No sign illustration: the copy
// carries the page, and the policy keeps illustrations out of the description.
export function zodiacShareImage({ kicker, title, summary }: { kicker: string; title: string; summary: string }) {
  return render(
    <div style={{ ...FRAME_STYLE, flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", color: "#e8b54a", fontSize: 30, fontWeight: 700 }}>{kicker}</div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 700, letterSpacing: -1 }}>{title}</div>
        <div style={{ display: "flex", maxWidth: 980, color: "#c3cce6", fontSize: 36, lineHeight: 1.5 }}>{summary}</div>
      </div>
      <Brand />
    </div>,
  );
}

// A shared daily card: the card front beside its name and the reading's title.
export async function dailyCardShareImage({ cardId, cardName, title }: { cardId: string; cardName: string; title: string }) {
  const art = await readFile(path.join(CARD_ART_DIR, `${cardId}.png`));
  return render(
    <div style={{ ...FRAME_STYLE, alignItems: "center", gap: 64 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain img elements. */}
      <img alt="" height={486} src={`data:image/png;base64,${art.toString("base64")}`} style={{ borderRadius: 18 }} width={302} />
      <div style={{ display: "flex", flex: 1, height: "100%", flexDirection: "column", justifyContent: "space-between", padding: "8px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", color: "#e8b54a", fontSize: 30, fontWeight: 700 }}>오늘의 카드 · {cardName}</div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, letterSpacing: -1, lineHeight: 1.3 }}>{title}</div>
          <div style={{ display: "flex", color: "#c3cce6", fontSize: 32 }}>나도 오늘의 카드 한 장 뽑아 보기</div>
        </div>
        <Brand />
      </div>
    </div>,
  );
}
