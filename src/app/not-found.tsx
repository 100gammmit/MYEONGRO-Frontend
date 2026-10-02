import type { Metadata } from "next";
import Link from "next/link";

import { StatusPanel } from "@/components/status-panel";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없어요 | 명로",
};

export default function NotFound() {
  return (
    <StatusPanel
      eyebrow="NOT FOUND"
      title="페이지를 찾을 수 없어요"
      heading="주소가 바뀌었거나 삭제된 페이지예요"
      description="입력한 주소를 다시 확인해 주세요. 삭제한 리딩 기록은 다시 열 수 없어요."
    >
      <Link className="primary-button" href="/">홈으로 가기</Link>
      <Link className="secondary-button" href="/records">내 기록 보기</Link>
    </StatusPanel>
  );
}
