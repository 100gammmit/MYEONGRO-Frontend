import Link from "next/link";
import type { ReactNode } from "react";

import type { DeclinedReadingView } from "@/domain/reading/declined-result";

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
  const question = typeof view.input.question === "string" ? view.input.question : null;

  return (
    <article className="simple-page page-width record-detail">
      <Link className="back-link" href={backHref}>← {backLabel}</Link>
      <header className="record-detail-header">
        <p className="eyebrow">{view.kind === "tarot" ? "AI TAROT" : "AI SAJU"}</p>
        <h1>{view.result.title}</h1>
        <p>{view.result.message}</p>
        {question ? <blockquote>{question}</blockquote> : null}
      </header>
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
