import Link from "next/link";
import { notFound } from "next/navigation";

import { ReadingRecordActions } from "@/components/reading-record-actions";
import { ProtectedPageUnavailable } from "@/components/protected-page-unavailable";
import {
  MAJOR_ARCANA,
  TAROT_SPREADS,
  type TarotPositionId,
  type TarotSpreadType,
} from "@/domain/tarot";
import {
  BackendReadingRecordsClient,
  type PublicReadingRecord,
} from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";

const CARD_NAMES = new Map<string, string>(
  MAJOR_ARCANA.map((card) => [card.id, card.name]),
);

type TarotRecordView = {
  spreadName: string;
  items: Array<{
    position: TarotPositionId;
    positionLabel: string;
    cardName: string;
    heading: string;
    body: string;
  }>;
};

function getTarotRecordView(reading: PublicReadingRecord): TarotRecordView | null {
  if (
    reading.kind !== "tarot"
    || reading.schemaVersion !== 1
    || !reading.spreadType
    || !(reading.spreadType in TAROT_SPREADS)
    || !reading.result
  ) {
    return null;
  }
  const definition = TAROT_SPREADS[reading.spreadType as TarotSpreadType];
  const inputCards = reading.input.cards;
  if (!Array.isArray(inputCards) || inputCards.length !== definition.cardCount
    || reading.result.sections.length !== definition.cardCount) {
    return null;
  }

  const items = definition.positions.map((position, index) => {
    const inputCard = inputCards[index];
    const section = reading.result?.sections[index];
    if (!isRecord(inputCard) || typeof inputCard.cardId !== "string"
      || inputCard.position !== position.id || section?.position !== position.id) {
      return null;
    }
    const cardName = CARD_NAMES.get(inputCard.cardId);
    if (!cardName) return null;
    return {
      position: position.id,
      positionLabel: position.label,
      cardName,
      heading: section.heading,
      body: section.body,
    };
  });
  if (items.some((item) => item === null)) return null;
  return { spreadName: definition.name, items: items as TarotRecordView["items"] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export default async function ReadingDetailPage({
  params,
}: {
  params: Promise<{ readingId: string }>;
}) {
  const cookieHeader = await getBackendCookieHeader();
  const session = await getSpringSessionState(cookieHeader);
  const { readingId } = await params;
  if (session.status === "unavailable") return <ProtectedPageUnavailable />;
  if (session.status === "unauthenticated") notFound();

  const reading = await new BackendReadingRecordsClient(cookieHeader).get(readingId);
  if (!reading) notFound();

  const question = typeof reading.input.question === "string"
    ? reading.input.question
    : "저장된 리딩";
  const tarotView = getTarotRecordView(reading);
  const unreadableTarot = reading.kind === "tarot"
    && reading.status === "completed"
    && !tarotView;

  return (
    <article className="simple-page page-width record-detail">
      <Link className="back-link" href="/records">
        ← 내 기록
      </Link>
      <p className="eyebrow">
        {reading.kind === "tarot" ? "AI TAROT" : "AI SAJU"}
      </p>

      {unreadableTarot ? (
        <div className="record-state" role="alert">
          <h1>이 리딩은 현재 형식으로 표시할 수 없어요</h1>
          <p>저장된 위치 정보를 확인할 수 없어 새 타로 결과 형식으로 표시할 수 없어요.</p>
        </div>
      ) : reading.status === "completed" && reading.result ? (
        <>
          <header className="record-detail-header">
            {tarotView ? <p className="record-spread-name">{tarotView.spreadName}</p> : null}
            <h1>{reading.result.title}</h1>
            <p>{reading.result.summary}</p>
            <blockquote>{question}</blockquote>
          </header>
          <div className="reading-sections">
            {tarotView
              ? tarotView.items.map((item) => (
                <section key={item.position}>
                  <p className="record-card-name">
                    <span>{item.positionLabel}</span>
                    <strong>{item.cardName}</strong>
                  </p>
                  <h2>{item.heading}</h2>
                  <p>{item.body}</p>
                </section>
              ))
              : reading.result.sections.map((section) => (
                <section key={section.position ?? section.heading}>
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
