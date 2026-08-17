"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import type {
  BirthTimePrecision,
  LuckDirectionBasis,
  SajuApiError,
  SajuBirthPlacesResponse,
  SajuFocusArea,
  SajuReadingCreateRequest,
} from "@/domain/saju/contracts";
import { takeRememberedSajuBirthProfile } from "@/domain/saju/draft-session";
import {
  parseSajuReadingCreatedResponse,
  parseSajuReadingCreateRequest,
} from "@/domain/saju/schema";
import {
  fetchSajuBirthPlaces,
  SajuBirthPlacesClientError,
} from "@/infrastructure/backend/saju-birth-places-client";

import { ConsentGate } from "./consent-gate";
import { ReadingShell } from "./reading-shell";

type Phase = "consent" | "birth-date" | "birth-time" | "birth-place" | "question" | "review" | "loading";
type CatalogStatus = "idle" | "loading" | "ready" | "error";
type FieldKey = "birthDate" | "birthTimePrecision" | "birthTime" | "provinceCode" | "luckDirectionBasis" | "focusArea" | "question" | "request";

interface SajuFormState {
  birthDate: string;
  birthTimePrecision: BirthTimePrecision | "";
  birthTime: string;
  provinceCode: string;
  luckDirectionBasis: LuckDirectionBasis;
  focusArea: SajuFocusArea | "";
  question: string;
}

const TOTAL_STEPS = 6;
const MAX_QUESTION_LENGTH = 300;
const initialForm: SajuFormState = {
  birthDate: "",
  birthTimePrecision: "",
  birthTime: "",
  provinceCode: "",
  luckDirectionBasis: "unspecified",
  focusArea: "",
  question: "",
};

const TIME_OPTIONS: ReadonlyArray<{ value: BirthTimePrecision; label: string; detail: string }> = [
  { value: "exact", label: "정확히 알아요", detail: "기록된 시각을 입력할게요." },
  { value: "approximate", label: "대략적으로 알아요", detail: "입력 시각의 앞뒤 60분을 함께 살펴봐요." },
  { value: "unknown", label: "시간을 몰라요", detail: "시주를 제외하고 공통 흐름만 읽어요." },
];

const LUCK_OPTIONS: ReadonlyArray<{ value: LuckDirectionBasis; label: string }> = [
  { value: "male", label: "남성 기준" },
  { value: "female", label: "여성 기준" },
  { value: "unspecified", label: "선택하지 않음" },
];

const FOCUS_OPTIONS: ReadonlyArray<{ value: SajuFocusArea; label: string; example: string }> = [
  { value: "self", label: "나의 성향", example: "지금 제 강점을 어떻게 활용하면 좋을까요?" },
  { value: "career", label: "일·진로", example: "이직을 준비할 때 무엇을 먼저 살펴볼까요?" },
  { value: "relationship", label: "관계", example: "관계에서 제가 점검할 부분은 무엇일까요?" },
  { value: "life_money", label: "재정·생활", example: "생활의 균형을 위해 무엇부터 정리할까요?" },
];

const LOADING_MESSAGES = [
  "출생정보를 확인하고 있어요.",
  "명식의 공통 구조를 계산하고 있어요.",
  "올해의 흐름을 연결하고 있어요.",
  "질문에 맞는 리딩을 구성하고 있어요.",
] as const;

const FIELD_PHASE: Partial<Record<string, Phase>> = {
  "birthProfile.birthDate": "birth-date",
  "birthProfile.birthTimePrecision": "birth-time",
  "birthProfile.birthTime": "birth-time",
  "birthProfile.provinceCode": "birth-place",
  "birthProfile.luckDirectionBasis": "birth-place",
  focusArea: "question",
  question: "question",
};

const FIELD_KEY: Partial<Record<string, FieldKey>> = {
  "birthProfile.birthDate": "birthDate",
  "birthProfile.birthTimePrecision": "birthTimePrecision",
  "birthProfile.birthTime": "birthTime",
  "birthProfile.provinceCode": "provinceCode",
  "birthProfile.luckDirectionBasis": "luckDirectionBasis",
  focusArea: "focusArea",
  question: "question",
};

function ensureRequestId(requestIdRef: MutableRefObject<string | null>): string {
  if (!requestIdRef.current) requestIdRef.current = globalThis.crypto.randomUUID();
  return requestIdRef.current;
}

export function SajuExperience() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("consent");
  const [form, setForm] = useState<SajuFormState>(initialForm);
  const [catalog, setCatalog] = useState<SajuBirthPlacesResponse | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("idle");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const followUpDraftRef = useRef(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const redirectToLogin = useCallback(() => {
    router.push("/login?next=%2Fsaju");
  }, [router]);

  const loadBirthPlaces = useCallback(async () => {
    setCatalogStatus("loading");
    setCatalogError(null);
    try {
      const loaded = await fetchSajuBirthPlaces();
      setCatalog(loaded);
      setCatalogStatus("ready");
    } catch (error) {
      if (error instanceof SajuBirthPlacesClientError && error.status === 401) {
        redirectToLogin();
        return;
      }
      setCatalogStatus("error");
      setCatalogError(error instanceof Error ? error.message : "출생지 목록을 불러오지 못했어요.");
    }
  }, [redirectToLogin]);

  useEffect(() => {
    const remembered = takeRememberedSajuBirthProfile();
    if (!remembered) return;
    followUpDraftRef.current = true;
    setForm((current) => ({
      ...current,
      birthDate: remembered.birthDate,
      birthTimePrecision: remembered.birthTimePrecision,
      birthTime: remembered.birthTime ?? "",
      provinceCode: remembered.birthTimePrecision === "unknown"
        ? ""
        : remembered.provinceCode ?? "",
      luckDirectionBasis: remembered.luckDirectionBasis,
    }));
  }, []);

  const handleConsentComplete = useCallback(() => {
    setPhase(followUpDraftRef.current ? "question" : "birth-date");
  }, []);

  useEffect(() => {
    if (phase !== "consent"
      && form.birthTimePrecision
      && form.birthTimePrecision !== "unknown"
      && catalogStatus === "idle") {
      void loadBirthPlaces();
    }
  }, [catalogStatus, form.birthTimePrecision, loadBirthPlaces, phase]);

  useEffect(() => {
    if (phase !== "loading") return;
    setLoadingIndex(0);
    const timer = globalThis.setInterval(() => {
      setLoadingIndex((current) => Math.min(current + 1, LOADING_MESSAGES.length - 1));
    }, 1200);
    return () => globalThis.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0 || generalError) {
      errorSummaryRef.current?.focus();
    }
  }, [fieldErrors, generalError, phase]);

  function updateForm(patch: Partial<SajuFormState>) {
    requestIdRef.current = null;
    setFieldErrors({});
    setGeneralError(null);
    setForm((current) => ({ ...current, ...patch }));
  }

  function selectPrecision(value: BirthTimePrecision) {
    updateForm({
      birthTimePrecision: value,
      ...(value === "unknown" ? { birthTime: "", provinceCode: "" } : {}),
    });
  }

  function selectProvince(provinceCode: string) {
    updateForm({ provinceCode });
  }

  async function submitReading() {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);
    setPhase("loading");

    try {
      const body = buildRequest(form, ensureRequestId(requestIdRef));
      const response = await fetch("/api/saju/readings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) {
        const apiError = await readApiError(response);
        handleSubmissionError(apiError);
        return;
      }
      const created = parseSajuReadingCreatedResponse(await response.json());
      router.push(`/saju/results/${encodeURIComponent(created.reading.id)}`);
    } catch (error) {
      setGeneralError(
        error instanceof Error && error.message.includes("schemaVersion")
          ? "리딩 응답 형식이 올바르지 않아요. 잠시 후 다시 시도해 주세요."
          : "리딩 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
      setPhase("review");
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  function handleSubmissionError(error: SajuApiError) {
    if (error.code === "OPENAI_READING_GENERATION_FAILED") {
      requestIdRef.current = null;
    }
    const errorPhase = error.field ? FIELD_PHASE[error.field] : undefined;
    const key = error.field ? FIELD_KEY[error.field] : undefined;
    if (errorPhase && key) {
      setFieldErrors({ [key]: error.message });
      setPhase(errorPhase);
      return;
    }
    setGeneralError(error.message || "리딩 요청을 처리하지 못했어요.");
    setPhase("review");
  }

  if (phase === "consent") {
    return (
      <ReadingShell
        eyebrow="AI SAJU"
        title="사주 리딩을 시작하기 전에"
        description="출생정보는 리딩 생성과 기록 복원을 위해 저장되며, 내 기록에서 언제든 삭제할 수 있어요."
        step={1}
        totalSteps={TOTAL_STEPS}
      >
        <ConsentGate onComplete={handleConsentComplete} onUnauthenticated={redirectToLogin} />
      </ReadingShell>
    );
  }

  if (phase === "birth-date") {
    return (
      <ReadingShell
        eyebrow="BIRTH DATE"
        title="양력 생년월일을 알려주세요"
        description="현재는 양력만 지원하며, 날짜는 명식 계산에 사용됩니다."
        step={2}
        totalSteps={TOTAL_STEPS}
      >
        <div className="wizard-card">
          <ErrorSummary summaryRef={errorSummaryRef} errors={fieldErrors} generalError={generalError} />
          <p className="notice">음력 생일은 아직 지원하지 않아요. 양력 날짜로 입력해 주세요.</p>
          <label className="field" htmlFor="saju-birth-date">
            <span>양력 생년월일</span>
            <input
              id="saju-birth-date"
              aria-describedby={fieldErrors.birthDate ? "birth-date-error" : undefined}
              aria-invalid={Boolean(fieldErrors.birthDate)}
              type="date"
              value={form.birthDate}
              onChange={(event) => updateForm({ birthDate: event.target.value })}
            />
            <FieldError id="birth-date-error" message={fieldErrors.birthDate} />
          </label>
          <button
            className="primary-button full-button"
            disabled={!form.birthDate}
            onClick={() => setPhase("birth-time")}
            type="button"
          >
            다음
          </button>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "birth-time") {
    const timeReady = form.birthTimePrecision === "unknown"
      || Boolean(form.birthTimePrecision && form.birthTime);
    return (
      <ReadingShell
        eyebrow="BIRTH TIME"
        title="태어난 시각을 얼마나 정확히 아나요?"
        description="정확도를 먼저 알려주면 알 수 있는 범위만 해석합니다."
        step={3}
        totalSteps={TOTAL_STEPS}
      >
        <div className="wizard-card">
          <ErrorSummary summaryRef={errorSummaryRef} errors={fieldErrors} generalError={generalError} />
          <fieldset
            className="field"
            aria-describedby={fieldErrors.birthTimePrecision
              ? "birth-time-help birth-time-precision-error"
              : "birth-time-help"}
            aria-invalid={Boolean(fieldErrors.birthTimePrecision)}
          >
            <legend>출생 시각 정확도</legend>
            <div className="saju-option-list">
              {TIME_OPTIONS.map((option) => (
                <label className="saju-option" key={option.value}>
                  <input
                    checked={form.birthTimePrecision === option.value}
                    name="birth-time-precision"
                    onChange={() => selectPrecision(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                </label>
              ))}
            </div>
            <FieldError id="birth-time-precision-error" message={fieldErrors.birthTimePrecision} />
          </fieldset>
          {form.birthTimePrecision && form.birthTimePrecision !== "unknown" ? (
            <label className="field" htmlFor="saju-birth-time">
              <span>태어난 시각</span>
              <input
                id="saju-birth-time"
                aria-describedby={fieldErrors.birthTime ? "birth-time-error" : "birth-time-help"}
                aria-invalid={Boolean(fieldErrors.birthTime)}
                type="time"
                value={form.birthTime}
                onChange={(event) => updateForm({ birthTime: event.target.value })}
              />
              <FieldError id="birth-time-error" message={fieldErrors.birthTime} />
            </label>
          ) : null}
          <p className="muted" id="birth-time-help">
            {form.birthTimePrecision === "approximate"
              ? "입력한 시각을 중심으로 서버가 앞뒤 60분을 함께 계산해 공통되는 내용만 보여줘요."
              : "오전·오후 정도만 안다면 거짓 정밀도를 만들지 않도록 ‘시간을 몰라요’를 선택해 주세요."}
          </p>
          <NavigationButtons
            back={() => setPhase("birth-date")}
            next={() => setPhase("birth-place")}
            nextDisabled={!timeReady}
          />
        </div>
      </ReadingShell>
    );
  }

  if (phase === "birth-place") {
    const birthPlaceRequired = form.birthTimePrecision !== "unknown";
    const placeReady = !birthPlaceRequired
      || (catalogStatus === "ready" && Boolean(form.provinceCode));
    return (
      <ReadingShell
        eyebrow="BIRTH PLACE"
        title={birthPlaceRequired ? "태어난 시·도와 계산 기준을 선택해 주세요" : "대운 계산 기준을 선택해 주세요"}
        description={birthPlaceRequired ? "출생 시·도는 태어난 시각을 보정하는 데 사용됩니다." : "출생 시각을 모르면 출생지는 입력하지 않아도 돼요."}
        step={4}
        totalSteps={TOTAL_STEPS}
      >
        <div className="wizard-card">
          <ErrorSummary summaryRef={errorSummaryRef} errors={fieldErrors} generalError={generalError} />
          {birthPlaceRequired && catalogStatus === "loading" ? <p className="notice" aria-live="polite">출생지 목록을 불러오고 있어요.</p> : null}
          {birthPlaceRequired && catalogStatus === "error" ? (
            <div role="alert" className="notice">
              <p>{catalogError}</p>
              <button className="secondary-button" onClick={() => void loadBirthPlaces()} type="button">다시 불러오기</button>
            </div>
          ) : null}
          {birthPlaceRequired ? <div className="saju-place-grid">
            <label className="field" htmlFor="saju-province">
              <span>출생 시·도</span>
              <select
                id="saju-province"
                aria-describedby={fieldErrors.provinceCode ? "province-error" : undefined}
                aria-invalid={Boolean(fieldErrors.provinceCode)}
                disabled={catalogStatus !== "ready"}
                onChange={(event) => selectProvince(event.target.value)}
                value={form.provinceCode}
              >
                <option value="">시·도 선택</option>
                {catalog?.provinces.map((item) => <option key={item.provinceCode} value={item.provinceCode}>{item.provinceName}</option>)}
              </select>
              <FieldError id="province-error" message={fieldErrors.provinceCode} />
            </label>
          </div> : null}
          <fieldset
            className="field"
            aria-describedby={fieldErrors.luckDirectionBasis ? "luck-help luck-error" : "luck-help"}
            aria-invalid={Boolean(fieldErrors.luckDirectionBasis)}
          >
            <legend>대운 계산 기준</legend>
            <p className="muted" id="luck-help">전통 명리학에서 대운의 순행·역행을 계산할 때만 사용합니다. 성격이나 역할을 성별에 따라 다르게 해석하지 않습니다.</p>
            <div className="saju-choice-row">
              {LUCK_OPTIONS.map((option) => (
                <label className="saju-choice" key={option.value}>
                  <input
                    checked={form.luckDirectionBasis === option.value}
                    name="luck-direction-basis"
                    onChange={() => updateForm({ luckDirectionBasis: option.value })}
                    type="radio"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {form.luckDirectionBasis === "unspecified" ? <p className="notice">원국과 올해 흐름은 제공하지만 대운 계산과 해석은 제외합니다.</p> : null}
            <FieldError id="luck-error" message={fieldErrors.luckDirectionBasis} />
          </fieldset>
          <NavigationButtons back={() => setPhase("birth-time")} next={() => setPhase("question")} nextDisabled={!placeReady} />
        </div>
      </ReadingShell>
    );
  }

  if (phase === "question") {
    const selectedFocus = FOCUS_OPTIONS.find((option) => option.value === form.focusArea);
    const questionReady = Boolean(form.focusArea && form.question.trim().length > 0 && form.question.length <= MAX_QUESTION_LENGTH);
    return (
      <ReadingShell
        eyebrow="YOUR QUESTION"
        title="지금 가장 살펴보고 싶은 한 가지는 무엇인가요?"
        description="관심 분야를 고른 뒤, 현재 선택에 도움이 될 질문을 하나 적어주세요."
        step={5}
        totalSteps={TOTAL_STEPS}
      >
        <div className="wizard-card">
          <ErrorSummary summaryRef={errorSummaryRef} errors={fieldErrors} generalError={generalError} />
          <fieldset
            className="field"
            aria-describedby={fieldErrors.focusArea ? "focus-error" : undefined}
            aria-invalid={Boolean(fieldErrors.focusArea)}
          >
            <legend>관심 분야</legend>
            <div className="category-grid">
              {FOCUS_OPTIONS.map((option) => (
                <label className={`category saju-category${form.focusArea === option.value ? " active" : ""}`} key={option.value}>
                  <input
                    checked={form.focusArea === option.value}
                    name="focus-area"
                    onChange={() => updateForm({ focusArea: option.value })}
                    type="radio"
                  />
                  <strong>{option.label}</strong>
                  <span>{option.example}</span>
                </label>
              ))}
            </div>
            <FieldError id="focus-error" message={fieldErrors.focusArea} />
          </fieldset>
          <label className="field" htmlFor="saju-question">
            <span>질문 한 가지</span>
            <textarea
              id="saju-question"
              aria-describedby={fieldErrors.question ? "question-error" : undefined}
              aria-invalid={Boolean(fieldErrors.question)}
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(event) => updateForm({ question: event.target.value })}
              placeholder={selectedFocus?.example ?? "지금 가장 궁금한 한 가지를 적어주세요."}
              value={form.question}
            />
            <small>{form.question.length} / {MAX_QUESTION_LENGTH}자</small>
            <FieldError id="question-error" message={fieldErrors.question} />
          </label>
          <NavigationButtons back={() => setPhase("birth-place")} next={() => setPhase("review")} nextDisabled={!questionReady} nextLabel="입력 검토" />
        </div>
      </ReadingShell>
    );
  }

  if (phase === "loading") {
    return (
      <ReadingShell eyebrow="AI SAJU" title="사주의 흐름을 읽고 있어요" step={6} totalSteps={TOTAL_STEPS}>
        <div className="wizard-card loading-card" aria-live="polite">
          <p>{LOADING_MESSAGES[loadingIndex]}</p>
          <ol className="saju-loading-steps">
            {LOADING_MESSAGES.map((message, index) => <li className={index <= loadingIndex ? "active" : ""} key={message}>{message}</li>)}
          </ol>
        </div>
      </ReadingShell>
    );
  }

  const province = catalog?.provinces.find((item) => item.provinceCode === form.provinceCode);
  const focus = FOCUS_OPTIONS.find((item) => item.value === form.focusArea);
  return (
    <ReadingShell
      eyebrow="REVIEW"
      title="입력한 내용을 확인해 주세요"
      description="생성 후에는 이 정보와 계산 snapshot이 내 기록에 저장됩니다."
      step={6}
      totalSteps={TOTAL_STEPS}
    >
      <div className="wizard-card confirmation-card">
        <ErrorSummary summaryRef={errorSummaryRef} errors={fieldErrors} generalError={generalError} />
        <dl className="saju-review-list">
          <div><dt>생년월일</dt><dd>{form.birthDate} · 양력</dd></div>
          <div><dt>출생 시각</dt><dd>{timeSummary(form)}</dd></div>
          {form.birthTimePrecision !== "unknown" ? <div><dt>출생지</dt><dd>{province?.provinceName}</dd></div> : null}
          <div><dt>대운</dt><dd>{luckSummary(form.luckDirectionBasis)}</dd></div>
          <div><dt>관심 분야</dt><dd>{focus?.label}</dd></div>
          <div><dt>질문</dt><dd>{form.question.trim()}</dd></div>
        </dl>
        <div className="result-actions">
          <button className="secondary-button" disabled={submitting} onClick={() => setPhase("question")} type="button">이전</button>
          <button className="primary-button" disabled={submitting} onClick={() => void submitReading()} type="button">사주 리딩 생성</button>
        </div>
      </div>
    </ReadingShell>
  );
}

function buildRequest(form: SajuFormState, requestId: string): SajuReadingCreateRequest {
  const request = {
    requestId,
    question: form.question.trim(),
    focusArea: form.focusArea,
    birthProfile: {
      calendarType: "solar",
      birthDate: form.birthDate,
      birthTimePrecision: form.birthTimePrecision,
      ...(form.birthTimePrecision === "unknown" ? {} : { birthTime: form.birthTime }),
      ...(form.birthTimePrecision === "unknown" ? {} : { provinceCode: form.provinceCode }),
      luckDirectionBasis: form.luckDirectionBasis,
    },
  };
  return parseSajuReadingCreateRequest(request);
}

async function readApiError(response: Response): Promise<SajuApiError> {
  try {
    const value = await response.json() as Partial<SajuApiError> & { error?: string };
    return {
      code: typeof value.code === "string" ? value.code : "READING_REQUEST_FAILED",
      ...(typeof value.field === "string" ? { field: value.field } : {}),
      message: typeof value.message === "string"
        ? value.message
        : typeof value.error === "string"
          ? value.error
          : "리딩 요청을 처리하지 못했어요.",
    };
  } catch {
    return { code: "READING_REQUEST_FAILED", message: "리딩 요청을 처리하지 못했어요." };
  }
}

function timeSummary(form: SajuFormState): string {
  if (form.birthTimePrecision === "unknown") return "시간 미상 · 시주 제외";
  if (form.birthTimePrecision === "approximate") return `${form.birthTime} 전후 60분`;
  return `${form.birthTime} · 정확한 시각`;
}

function luckSummary(value: LuckDirectionBasis): string {
  if (value === "male") return "남성 기준으로 계산";
  if (value === "female") return "여성 기준으로 계산";
  return "계산하지 않음";
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p className="form-error" id={id}>{message}</p> : null;
}

const ErrorSummary = ({
  errors,
  generalError,
  summaryRef,
}: {
  errors: Partial<Record<FieldKey, string>>;
  generalError: string | null;
  summaryRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const messages = [...new Set([...Object.values(errors), ...(generalError ? [generalError] : [])])];
  return messages.length > 0 ? (
    <div className="saju-error-summary" ref={summaryRef} role="alert" tabIndex={-1}>
      <strong>입력 내용을 확인해 주세요.</strong>
      {messages.map((message) => <p key={message}>{message}</p>)}
    </div>
  ) : null;
};

function NavigationButtons({
  back,
  next,
  nextDisabled,
  nextLabel = "다음",
}: {
  back: () => void;
  next: () => void;
  nextDisabled: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="result-actions">
      <button className="secondary-button" onClick={back} type="button">이전</button>
      <button className="primary-button" disabled={nextDisabled} onClick={next} type="button">{nextLabel}</button>
    </div>
  );
}
