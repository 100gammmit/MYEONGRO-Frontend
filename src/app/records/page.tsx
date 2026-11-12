import Link from "next/link";

import { ProtectedPageUnavailable } from "@/components/protected-page-unavailable";
import {
  formatRecordDay,
  getRecordRowMeta,
  getRecordRowState,
  groupRecordsByMonth,
  isSupportedRecord,
  parseRecordKindFilter,
  type RecordKindFilter,
} from "@/domain/reading/record-list";
import { BackendReadingRecordsClient } from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";

interface RecordsPageProps {
  searchParams: Promise<{ kind?: string | string[] }>;
}

const FILTER_TABS: readonly { filter: RecordKindFilter; label: string; href: string }[] = [
  { filter: "all", label: "전체", href: "/records" },
  { filter: "tarot", label: "타로", href: "/records?kind=tarot" },
  { filter: "saju", label: "사주", href: "/records?kind=saju" },
];

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const cookieHeader = await getBackendCookieHeader();
  const session = await getSpringSessionState(cookieHeader);
  if (session.status === "unavailable") return <ProtectedPageUnavailable />;

  const filter = parseRecordKindFilter((await searchParams).kind);
  const readings = session.status === "authenticated"
    ? (await new BackendReadingRecordsClient(cookieHeader).list()).filter(isSupportedRecord)
    : [];

  if (readings.length === 0) return <EmptyRecords />;

  const counts: Record<RecordKindFilter, number> = {
    all: readings.length,
    tarot: readings.filter((reading) => reading.kind === "tarot").length,
    saju: readings.filter((reading) => reading.kind === "saju").length,
  };
  const shown = filter === "all" ? readings : readings.filter((reading) => reading.kind === filter);

  return (
    <section className="flow-page page-width records-page">
      <h1>내 기록</h1>
      <p className="flow-lead">완료한 리딩을 다시 볼 수 있어요. 질문 원문은 저장하지 않아서 제목과 해석만 남아요.</p>

      <div className="records-bar">
        <nav aria-label="기록 종류" className="records-tabs">
          {FILTER_TABS.map((tab) => (
            <Link
              aria-current={tab.filter === filter ? "page" : undefined}
              href={tab.href}
              key={tab.filter}
            >
              {tab.label} <span className="records-tab-count">{counts[tab.filter]}</span>
            </Link>
          ))}
        </nav>
        <div className="records-start">
          <Link className="secondary-button" href="/tarot">타로 시작</Link>
          <Link className="secondary-button" href="/saju">사주 시작</Link>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="records-filter-empty">
          {filter === "tarot" ? "타로" : "사주"} 리딩이 아직 없어요.{" "}
          <Link href={filter === "tarot" ? "/tarot" : "/saju"}>{filter === "tarot" ? "타로" : "사주"} 시작하기</Link>
        </p>
      ) : (
        groupRecordsByMonth(shown).map((group, index) => (
          <section className="records-month" key={group.month} aria-labelledby={`records-month-${index}`}>
            <h2 id={`records-month-${index}`}>{group.month}</h2>
            <ul className="records-list">
              {group.readings.map((reading) => {
                const meta = getRecordRowMeta(reading);
                const state = getRecordRowState(reading);
                return (
                  <li className={state.muted ? "muted" : undefined} key={reading.id}>
                    <Link className="record-row" href={`/records/${reading.id}`}>
                      <span className="record-row-meta">
                        <span className="record-kind">{meta.kind}</span>
                        {meta.detail ? <span>{meta.detail}</span> : null}
                      </span>
                      <span className="record-row-title">{state.title}</span>
                      <time className="record-row-date" dateTime={reading.createdAt}>
                        {formatRecordDay(reading.createdAt)}
                      </time>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}

function EmptyRecords() {
  return (
    <section className="flow-page page-width records-page">
      <h1>내 기록</h1>
      <h2 className="records-empty-title">아직 저장된 리딩이 없어요</h2>
      <p className="flow-lead">AI 타로나 사주 리딩을 마치면 이곳에서 다시 볼 수 있어요.</p>
      <div className="records-empty-starts">
        <Link className="records-empty-start" href="/tarot">
          <strong>AI 타로</strong>
          <span>카드의 자리로 가까운 고민의 지금과 다음 전개를 읽어요.</span>
          <span className="records-empty-go" aria-hidden="true">타로로 시작</span>
        </Link>
        <Link className="records-empty-start" href="/saju">
          <strong>AI 사주</strong>
          <span>명식을 먼저 계산해 타고난 성향과 한 해의 흐름을 읽어요.</span>
          <span className="records-empty-go" aria-hidden="true">사주로 시작</span>
        </Link>
      </div>
      <p className="records-empty-note">로그인 없이 보는 오늘의 운세는 기록에 남지 않아요.</p>
    </section>
  );
}
