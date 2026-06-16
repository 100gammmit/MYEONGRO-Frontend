"use client";

import Link from "next/link";
import { useRef, useState, type MutableRefObject } from "react";
import { ConsentGate } from "./consent-gate";
import { ReadingShell } from "./reading-shell";

type Gender = "female" | "male" | "unspecified";

type SajuFormState = {
  birthDate: string;
  birthTime: string;
  gender: Gender;
  question: string;
};

type SajuReadingResponse = {
  reading: {
    input: {
      question: string;
      profile: {
        birthDate: string;
        birthTime?: string;
        calendarType: "solar";
        gender: Gender;
        pillars: {
          year: string;
          month: string;
          day: string;
          hour: string;
        };
      };
    };
    result: {
      title: string;
      summary: string;
      sections: Array<{
        heading: string;
        body: string;
      }>;
      guidance: string[];
      disclaimer: string;
    };
  };
};

const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
  { value: "unspecified", label: "선택 안 함" },
];

const PILLAR_LABELS = [
  { key: "year", label: "연주" },
  { key: "month", label: "월주" },
  { key: "day", label: "일주" },
  { key: "hour", label: "시주" },
] as const;

const initialForm: SajuFormState = {
  birthDate: "",
  birthTime: "",
  gender: "unspecified",
  question: "",
};

function ensureRequestId(requestIdRef: MutableRefObject<string | null>): string {
  if (!requestIdRef.current) {
    requestIdRef.current = globalThis.crypto.randomUUID();
  }
  return requestIdRef.current;
}

function normalizeResponse(input: unknown): SajuReadingResponse {
  const candidate = input as { reading?: unknown } | null;
  if (
    !candidate
    || typeof candidate !== "object"
    || !("reading" in candidate)
    || !candidate.reading
  ) {
    throw new Error("리딩 응답 형식이 올바르지 않아요.");
  }

  return candidate as SajuReadingResponse;
}

function SajuResult({ reading }: { reading: SajuReadingResponse["reading"] }) {
  const pillars = reading.input.profile.pillars;

  return (
    <>
      <div className="result-hero saju-result-hero">
        <p className="eyebrow">YOUR READING</p>
        <h2>{reading.result.title}</h2>
        <p>{reading.result.summary}</p>
        <blockquote>{reading.input.question}</blockquote>
      </div>

      <section className="pillars" aria-label="사주 명식">
        {PILLAR_LABELS.map(({ key, label }) => (
          <article key={key}>
            <span>{label}</span>
            <strong>{pillars[key]}</strong>
          </article>
        ))}
      </section>

      <section className="saju-insights" aria-label="구조화된 해석">
        {reading.result.sections.map((section) => (
          <article key={section.heading}>
            <div>
              <p className="eyebrow">해석</p>
              <h3>{section.heading}</h3>
              <p>{section.body}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="guidance-block" aria-label="실천 제안">
        <p className="eyebrow">GUIDANCE</p>
        <ul>
          {reading.result.guidance.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="muted">{reading.result.disclaimer}</p>
      </section>

      <div className="result-actions">
        <Link className="primary-button" href="/saju">
          새 사주 리딩 시작
        </Link>
        <Link className="secondary-button" href="/records">
          내 기록 보기
        </Link>
      </div>
    </>
  );
}

export function SajuExperience() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<SajuFormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<SajuReadingResponse["reading"] | null>(null);
  const requestIdRef = useRef<string | null>(null);

  async function submitReading() {
    if (status === "submitting") return;

    const question = form.question.trim();
    if (!form.birthDate || question.length === 0) return;

    setStatus("submitting");
    setError(null);

    try {
      const requestId = ensureRequestId(requestIdRef);
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind: "saju",
          question,
          requestId,
          birthDate: form.birthDate,
          gender: form.gender,
          ...(form.birthTime ? { birthTime: form.birthTime } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("리딩 요청에 실패했어요. 다시 시도해 주세요.");
      }

      const data = normalizeResponse(await response.json());
      setReading(data.reading);
      setStep(3);
      setStatus("idle");
    } catch (caughtError) {
      setReading(null);
      setStatus("error");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "리딩 요청에 실패했어요. 다시 시도해 주세요.",
      );
    }
  }

  if (step === 1) {
    return (
      <ReadingShell
        eyebrow="AI SAJU"
        title="사주 리딩을 시작하기 전에"
        description="동의가 끝나면 양력만 지원하는 근사 베타 사주를 바로 연결해 드려요."
        step={1}
        totalSteps={3}
      >
        <ConsentGate onComplete={() => setStep(2)} />
      </ReadingShell>
    );
  }

  if (step === 2) {
    const questionLength = form.question.trim().length;
    const canSubmit = form.birthDate.length > 0 && questionLength > 0 && status !== "submitting";

    return (
      <ReadingShell
        eyebrow="AI SAJU"
        title="태어난 정보를 알려주세요"
        description="양력 기준으로만 읽는 근사 베타예요. 음력은 아직 준비 중입니다."
        step={2}
        totalSteps={3}
      >
        <div className="wizard-card">
          <p className="notice">
            양력만 지원하는 근사 베타입니다. 음력은 아직 연결되지 않았어요.
          </p>

          <label className="field" htmlFor="saju-birth-date">
            <span>생년월일</span>
            <input
              id="saju-birth-date"
              aria-label="생년월일"
              required
              type="date"
              value={form.birthDate}
              onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
            />
          </label>

          <label className="field" htmlFor="saju-birth-time">
            <span>태어난 시각</span>
            <input
              id="saju-birth-time"
              aria-label="태어난 시각"
              type="time"
              value={form.birthTime}
              onChange={(event) => setForm({ ...form, birthTime: event.target.value })}
            />
            <small>모르면 비워도 괜찮아요.</small>
          </label>

          <fieldset className="field">
            <legend>성별</legend>
            <div className="gender-row">
              {GENDER_OPTIONS.map((option) => (
                <div key={option.value} className="gender-option">
                  <input
                    id={`saju-gender-${option.value}`}
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={form.gender === option.value}
                    onChange={() => setForm({ ...form, gender: option.value })}
                  />
                  <label htmlFor={`saju-gender-${option.value}`}>
                    <span>{option.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>

          <label className="field" htmlFor="saju-question">
            <span>궁금한 점</span>
            <textarea
              id="saju-question"
              aria-label="궁금한 점"
              maxLength={300}
              value={form.question}
              onChange={(event) => setForm({ ...form, question: event.target.value })}
              placeholder="지금 가장 궁금한 한 가지를 적어주세요."
            />
            <small>{form.question.length} / 300자</small>
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="primary-button full-button"
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              void submitReading();
            }}
          >
            {status === "submitting" ? "읽는 중..." : "사주 읽어보기"}
          </button>

          {error ? (
            <button
              className="secondary-button full-button"
              type="button"
              disabled={status === "submitting"}
              onClick={() => {
                void submitReading();
              }}
            >
              다시 시도
            </button>
          ) : null}
        </div>
      </ReadingShell>
    );
  }

  return (
    <ReadingShell
      eyebrow="AI SAJU"
      title="사주의 구조화된 결과"
      step={3}
      totalSteps={3}
    >
      {reading ? <SajuResult reading={reading} /> : null}
    </ReadingShell>
  );
}
