"use client";

import { useRouter } from "next/navigation";

import { rememberSajuBirthProfile } from "@/domain/saju/draft-session";
import type { SajuBirthProfile } from "@/domain/saju/result";

export function SajuFollowUpAction({ birthProfile }: { birthProfile: SajuBirthProfile }) {
  const router = useRouter();

  function startFollowUp() {
    rememberSajuBirthProfile(birthProfile);
    router.push("/saju");
  }

  return (
    <button className="primary-button" onClick={startFollowUp} type="button">
      같은 출생정보로 새 질문
    </button>
  );
}
