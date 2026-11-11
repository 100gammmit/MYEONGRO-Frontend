import Link from "next/link";
import type { ReactNode } from "react";

import type { DeclinedReadingView } from "@/domain/reading/declined-result";
import { ReadingResultHeader } from "./reading-result-header";

export function ReadingDeclinedResult({
  view,
  backHref,
  backLabel,
  footer,
}: {
  view: DeclinedReadingView;
  backHref: string;
  backLabel: string;
  footer?: ReactNode;
}) {
  return (
    <article className="simple-page page-width record-detail">
      <ReadingResultHeader
        backHref={backHref}
        backLabel={backLabel}
        meta={[view.kind === "tarot" ? "AI 타로" : "AI 사주"]}
        title={view.result.title}
      >
        <p className="result-lead">{view.result.message}</p>
      </ReadingResultHeader>
      <section className="reading-guidance">
        <h2>지금 할 수 있는 일</h2>
        <ul>
          {view.result.guidance.map((guidance) => <li key={guidance}>{guidance}</li>)}
        </ul>
      </section>
      <p className="reading-disclaimer">{view.result.disclaimer}</p>
      <div className="result-actions">
        <Link className="primary-button" href={view.kind === "tarot" ? "/tarot" : "/saju"}>
          질문 바꿔보기
        </Link>
        <Link className="secondary-button" href="/records">내 기록 보기</Link>
      </div>
      {footer}
    </article>
  );
}
