"use client";

import { useRouter } from "next/navigation";

export function DeepReadingCta({ kind }: { kind: "tarot" | "saju" }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="primary-button"
      onClick={() => router.push(`/checkout?kind=${kind}`)}
    >
      심층 {kind === "tarot" ? "리딩" : "사주"} 열기
    </button>
  );
}
