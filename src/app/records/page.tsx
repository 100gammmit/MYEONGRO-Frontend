import Link from "next/link";

import { BackendReadingRecordsClient } from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionUser } from "@/infrastructure/backend/session-auth";

const statusLabels = {
  generating: "생성 중",
  completed: "완료",
  failed: "재시도 필요",
} as const;

function getQuestion(input: Record<string, unknown>): string {
  return typeof input.question === "string" ? input.question : "저장된 리딩";
}

export default async function RecordsPage() {
  const cookieHeader = await getBackendCookieHeader();
  const user = await getSpringSessionUser(cookieHeader);
  const readings = user
    ? await new BackendReadingRecordsClient(cookieHeader).list()
    : [];

  return (
    <section className="simple-page page-width records-page">
      <p className="eyebrow">MY READINGS</p>
      <h1>나의 리딩 기록</h1>

      {readings.length === 0 ? (
        <div className="empty-state">
          <span>◇</span>
          <h2>아직 저장된 이야기가 없어요</h2>
          <p>무료 타로와 사주 리딩을 완료하면 이곳에서 다시 볼 수 있어요.</p>
          <Link className="primary-button" href="/">
            첫 리딩 시작하기
          </Link>
        </div>
      ) : (
        <div className="records-list">
          {readings.map((reading) => (
            <Link
              className="record-card"
              href={`/records/${reading.id}`}
              key={reading.id}
            >
              <div>
                <span className="record-kind">
                  {reading.kind === "tarot" ? "AI 타로" : "AI 사주"}
                </span>
                <h2>
                  {reading.status === "completed"
                    ? reading.title
                    : getQuestion(reading.input)}
                </h2>
                <p>{getQuestion(reading.input)}</p>
              </div>
              <div className="record-meta">
                <span className={`record-status ${reading.status}`}>
                  {statusLabels[reading.status]}
                </span>
                <time dateTime={reading.createdAt}>
                  {new Intl.DateTimeFormat("ko-KR", {
                    dateStyle: "medium",
                  }).format(new Date(reading.createdAt))}
                </time>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
