import Link from "next/link";
import { notFound } from "next/navigation";

import { ReadingRecordActions } from "@/components/reading-record-actions";
import { BackendReadingRecordsClient } from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionUser } from "@/infrastructure/backend/session-auth";

export default async function ReadingDetailPage({
  params,
}: {
  params: Promise<{ readingId: string }>;
}) {
  const cookieHeader = await getBackendCookieHeader();
  const user = await getSpringSessionUser(cookieHeader);
  const { readingId } = await params;
  if (!user) notFound();

  const reading = await new BackendReadingRecordsClient(cookieHeader).get(readingId);
  if (!reading) notFound();

  const question = typeof reading.input.question === "string"
    ? reading.input.question
    : "저장된 리딩";

  return (
    <article className="simple-page page-width record-detail">
      <Link className="back-link" href="/records">
        ← 내 기록
      </Link>
      <p className="eyebrow">
        {reading.kind === "tarot" ? "AI TAROT" : "AI SAJU"}
      </p>

      {reading.status === "completed" && reading.result ? (
        <>
          <header className="record-detail-header">
            <h1>{reading.result.title}</h1>
            <p>{reading.result.summary}</p>
            <blockquote>{question}</blockquote>
          </header>
          <div className="reading-sections">
            {reading.result.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
          <section className="reading-guidance">
            <h2>조언</h2>
            <ul>
              {reading.result.guidance.map((guidance) => (
                <li key={guidance}>{guidance}</li>
              ))}
            </ul>
          </section>
          <p className="reading-disclaimer">{reading.result.disclaimer}</p>
        </>
      ) : reading.status === "failed" ? (
        <div className="record-state" role="alert">
          <h1>리딩 생성에 실패했어요</h1>
          <p>저장된 질문과 입력을 그대로 사용해 다시 생성할 수 있습니다.</p>
        </div>
      ) : (
        <div className="record-state" aria-live="polite">
          <h1>리딩을 생성하고 있어요</h1>
          <p>잠시 후 다시 확인해 주세요.</p>
        </div>
      )}

      <ReadingRecordActions
        readingId={reading.id}
        retryable={reading.status === "failed"}
      />
    </article>
  );
}
