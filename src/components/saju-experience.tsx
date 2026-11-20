"use client";

import { ReadingGuideLink } from "./reading-help-links";
import { getSajuCurrentYear } from "@/domain/saju/monthly-calendar";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import type {
  SajuApiError,
  SajuBirthPlacesResponse,
  SajuFocusArea,
  SajuReadingCreateRequest,
} from "@/domain/saju/contracts";
import {
  parseSajuReadingCreatedResponse,
  parseSajuReadingCreateRequest,
} from "@/domain/saju/schema";
import {
  BIRTH_FIELD_BY_REQUEST_PATH,
  EMPTY_BIRTH_VALUES,
  birthPlaceName,
  birthProfileOf,
  birthTimeSummary,
  calculationOptionsOf,
  calculationOptionsSummary,
  findMissingBirthFields,
  isBirthTimeKnown,
  luckBasisSummary,
  type SajuBirthFieldKey,
  type SajuBirthValues,
} from "@/domain/saju/birth-input";
import { getDisplayedReadingCredits, getReadingCreditAccess } from "@/domain/reading-credit";
import {
  containsDirectIdentifier,
  DIRECT_IDENTIFIER_INPUT_MESSAGE,
} from "@/domain/reading/direct-identifier";
import {
  fetchSajuBirthPlaces,
  SajuBirthPlacesClientError,
} from "@/infrastructure/backend/saju-birth-places-client";

import { ReadingLoading } from "./reading-loading";
import { ConsentGate } from "./consent-gate";
import { ReadingCreditAccessNotice, readingCreationErrorMessage } from "./reading-credit-access-notice";
import { useReadingCredits } from "./reading-credit-provider";
import { ReadingShell } from "./reading-shell";
import { PrivacyNotice } from "./privacy-notice";
import { FieldError } from "./field-error";
import { ReviewGroup } from "./review-group";
import { SajuBirthFields, birthFieldInputId } from "./saju-birth-fields";

type Phase = "consent" | "question" | "birth" | "review" | "loading";
type WizardStep = "question" | "birth" | "review";
type CatalogStatus = "idle" | "loading" | "ready" | "error";
type FieldKey = SajuBirthFieldKey | "focusArea" | "question" | "request" | "targetYear";

export type SajuReportType = "birth_annual_question" | "annual_monthly";

interface SajuFormState {
  reportType: SajuReportType;
  targetYear: number;
  birth: SajuBirthValues;
  focusArea: SajuFocusArea | "";
  question: string;
}

// Consent is a one-time threshold, not a step: question 1, birth 2, review 3; loading stays on 3.
const TOTAL_STEPS = 3;
const MAX_QUESTION_LENGTH = 300;
const initialForm: SajuFormState = {
  reportType: "birth_annual_question",
  targetYear: 0,
  birth: EMPTY_BIRTH_VALUES,
  focusArea: "",
  question: "",
};

const FOCUS_OPTIONS: ReadonlyArray<{ value: SajuFocusArea; label: string; example: string }> = [
  { value: "self", label: "나의 성향", example: "지금 제 강점을 어떻게 활용하면 좋을까요?" },
  { value: "career", label: "일·진로", example: "이직을 준비할 때 무엇을 먼저 살펴볼까요?" },
  { value: "relationship", label: "관계", example: "관계에서 제가 점검할 부분은 무엇일까요?" },
  { value: "life_money", label: "재정·생활", example: "생활의 균형을 위해 무엇부터 정리할까요?" },
];

// One message per stroke of the brand mark.
const LOADING_MESSAGES = [
  "출생정보를 확인하고 있어요.",
  "명식의 공통 구조를 계산하고 있어요.",
  "선택한 연도의 흐름을 연결하고 있어요.",
  "질문에 맞는 리딩을 구성하고 있어요.",
] as const;

const BIRTH_ID_PREFIX = "saju";

const QUESTION_FIELDS: Partial<Record<string, FieldKey>> = {
  targetYear: "targetYear",
  focusArea: "focusArea",
  question: "question",
};

// Server field errors point at a request path; birth paths reuse the shared map.
function fieldForPath(path: string): { key: FieldKey; phase: Phase } | undefined {
  const question = QUESTION_FIELDS[path];
  if (question) return { key: question, phase: "question" };
  const birth = BIRTH_FIELD_BY_REQUEST_PATH[path];
  return birth ? { key: birth, phase: "birth" } : undefined;
}

function isQuestionReady(form: SajuFormState): boolean {
  const currentYear = getSajuCurrentYear();
  return Boolean((form.targetYear === currentYear || form.targetYear === currentYear + 1)
    && form.focusArea && (form.reportType === "annual_monthly" || form.question.trim().length > 0) && form.question.length <= MAX_QUESTION_LENGTH);
}

// The browser's forward button can land on a later step; only allow it when the steps before it still pass their checks.
function canEnterStep(step: WizardStep, form: SajuFormState): boolean {
  if (step === "question") return true;
  const questionPasses = isQuestionReady(form) && !containsDirectIdentifier(form.question);
  if (step === "birth") return questionPasses;
  return questionPasses && Object.keys(findMissingBirthFields(form.birth)).length === 0;
}

function isWizardStep(value: unknown): value is WizardStep {
  return value === "question" || value === "birth" || value === "review";
}

function ensureRequestId(requestIdRef: MutableRefObject<string | null>): string {
  if (!requestIdRef.current) requestIdRef.current = globalThis.crypto.randomUUID();
  return requestIdRef.current;
}

/** `initialReportType` lets an entry link (e.g. the zodiac pages) open with the annual report chosen. */
export function SajuExperience({ initialReportType = "birth_annual_question" }: { initialReportType?: SajuReportType } = {}) {
  const currentYear = getSajuCurrentYear();
  const router = useRouter();
  const credits = useReadingCredits();
  const [phase, setPhase] = useState<Phase>("consent");
  const [form, setForm] = useState<SajuFormState>(() => ({ ...initialForm, reportType: initialReportType, targetYear: getSajuCurrentYear() }));
  const [catalog, setCatalog] = useState<SajuBirthPlacesResponse | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("idle");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [creditUntouched, setCreditUntouched] = useState(false);
  const requestIdRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const editingFromReviewRef = useRef(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const focusFieldRef = useRef<string | null>(null);
  const formRef = useRef(form);
  const historyPhaseRef = useRef<Phase>("consent");
  const poppedRef = useRef(false);
  const displayedCredits = getDisplayedReadingCredits(credits.state);
  const creditData = displayedCredits.data;
  const creditCost = (form.reportType === "annual_monthly" ? creditData?.costs.sajuAnnual ?? creditData?.costs.saju : creditData?.costs.saju) ?? null;
  const submitLabel = form.reportType === "annual_monthly" ? "한 해 리포트 생성" : "사주 리딩 생성";
  const creditAccess = getReadingCreditAccess(
    creditData,
    credits.state.status === "idle" || displayedCredits.loading,
    creditCost,
  );
  const questionReady = isQuestionReady(form);

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
    formRef.current = form;
  }, [form]);

  const handleConsentComplete = useCallback(() => {
    setPhase("question");
  }, []);

  // Load the province list as soon as the birth step opens, so choosing a known time never waits on it.
  useEffect(() => {
    if (catalogStatus !== "idle") return;
    if (phase === "birth" || (phase !== "consent" && isBirthTimeKnown(form.birth.birthTimePrecision))) {
      void loadBirthPlaces();
    }
  }, [catalogStatus, form.birth.birthTimePrecision, loadBirthPlaces, phase]);

  const shownPhaseRef = useRef<Phase>("consent");
  useEffect(() => {
    if (shownPhaseRef.current === phase) return;
    shownPhaseRef.current = phase;
    // Steps swap in place; start each one at its title, not at the previous step's scroll offset.
    window.scrollTo({ top: 0 });
  }, [phase]);

  // Each step gets a history entry so the phone's back button steps back instead of leaving the wizard.
  // A refresh starts over by design: the question is never stored.
  useEffect(() => {
    const previous = historyPhaseRef.current;
    historyPhaseRef.current = phase;
    if (phase === "review") editingFromReviewRef.current = false;
    if (!isWizardStep(phase) || previous === phase) return;
    if (poppedRef.current) {
      poppedRef.current = false;
      return;
    }
    // Next's patched history methods add their router markers, so its popstate handler keeps this page instead of reloading.
    const state = { sajuStep: phase };
    const url = `${window.location.pathname}?step=${phase}`;
    // The first step and returns from generation reuse the current entry; generation itself adds none.
    if (previous === "consent" || previous === "loading") {
      window.history.replaceState(state, "", url);
    } else {
      window.history.pushState(state, "", url);
    }
  }, [phase]);

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const step = (event.state as { sajuStep?: unknown } | null)?.sajuStep;
      // After a refresh the old step entries survive, but consent and login must be checked again first.
      if (!isWizardStep(step) || inFlightRef.current || historyPhaseRef.current === "consent") return;
      if (step === historyPhaseRef.current || !canEnterStep(step, formRef.current)) return;
      poppedRef.current = true;
      setFieldErrors({});
      setGeneralError(null);
      setPhase(step);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0 && !generalError) return;
    const fieldId = focusFieldRef.current;
    focusFieldRef.current = null;
    const field = fieldId ? document.getElementById(fieldId) : null;
    if (field && !(field as HTMLInputElement).disabled) {
      field.focus();
      return;
    }
    errorSummaryRef.current?.focus();
  }, [fieldErrors, generalError, phase]);

  function updateForm(patch: Partial<SajuFormState>) {
    requestIdRef.current = null;
    setFieldErrors({});
    setGeneralError(null);
    setCreditUntouched(false);
    setForm((current) => ({ ...current, ...patch }));
  }

  // Locked time and place values are kept; buildRequest leaves them out when the time is unknown.
  function updateBirth(birth: SajuBirthValues) {
    updateForm({ birth });
  }

  // A generation failure belongs to review; carrying it back would read as an input mistake.
  function leaveReview(step: "question" | "birth", editing: boolean) {
    editingFromReviewRef.current = editing;
    setGeneralError(null);
    setCreditUntouched(false);
    setPhase(step);
  }

  function submitQuestion() {
    if (!questionReady || creditAccess.status !== "allowed") return;
    if (containsDirectIdentifier(form.question)) {
      setFieldErrors({ question: DIRECT_IDENTIFIER_INPUT_MESSAGE });
      setGeneralError(null);
      return;
    }
    // A follow-up reading already carries the birth profile, and an edit from review returns there filled in.
    setPhase(editingFromReviewRef.current ? "review" : "birth");
  }

  function submitBirth() {
    const missing = findMissingBirthFields(form.birth);
    const first = (Object.keys(missing) as SajuBirthFieldKey[])[0];
    if (first) {
      focusFieldRef.current = birthFieldInputId(BIRTH_ID_PREFIX, first);
      setGeneralError(null);
      setFieldErrors(missing);
      return;
    }
    setPhase("review");
  }

  async function submitReading() {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);
    setCreditUntouched(false);
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
        if (
          apiError.code === "READING_GENERATION_IN_PROGRESS"
          || apiError.code === "INSUFFICIENT_READING_CREDITS"
        ) {
          void credits.refresh({ discardCurrent: true });
        }
        handleSubmissionError(apiError);
        return;
      }
      const created = parseSajuReadingCreatedResponse(await response.json());
      void credits.refresh();
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
    // Both end the stored attempt as failed, so the same request id would only replay that failure.
    const attemptFailed = error.code === "OPENAI_READING_GENERATION_FAILED"
      || error.code === "READING_GENERATION_EXPIRED";
    if (attemptFailed) {
      requestIdRef.current = null;
    }
    const target = error.field ? fieldForPath(error.field) : undefined;
    if (target) {
      setFieldErrors({ [target.key]: error.message });
      setPhase(target.phase);
      return;
    }
    // Credits are charged only when a reading completes, so a confirmed generation failure charged nothing.
    // Network and proxy failures stay silent on credits: the backend may still have finished.
    setCreditUntouched(attemptFailed);
    setGeneralError(
      readingCreationErrorMessage(error.code)
      ?? (error.message || "리딩 요청을 처리하지 못했어요."),
    );
    setPhase("review");
  }

  if (phase === "consent") {
    return (
      <ReadingShell
        eyebrow="AI 사주"
        title="사주 리딩을 시작하기 전에"
        description="원본 출생정보는 사주 계산과 최소 계산정보 생성에만 사용하고 요청 처리가 끝나면 별도로 보유하지 않아요. 내 기록에는 최소 계산정보와 리딩 결과만 저장돼요."
        stepLabel="시작하기 전에"
      >
        <ReadingGuideLink kind="saju" />
        <ConsentGate
          scope="saju"
          onComplete={handleConsentComplete}
          onUnauthenticated={redirectToLogin}
        />
      </ReadingShell>
    );
  }

  if (phase === "question") {
    const selectedFocus = FOCUS_OPTIONS.find((option) => option.value === form.focusArea);
    return (
      <ReadingShell
        eyebrow="AI 사주"
        title="어떤 흐름을 살펴볼까요?"
        description={form.reportType === "annual_monthly" ? "한 해의 흐름을 월별로 읽습니다. 질문 없이도 시작할 수 있습니다." : "관심 분야를 고른 뒤, 현재 선택에 도움이 될 질문을 하나 적어주세요."}
        step={1}
        totalSteps={TOTAL_STEPS}
        // The first step has no step before it, and a home link here would drop every answer.
        back={null}
        actions={(
          <>
            <ReadingCreditAccessNotice access={creditAccess} onRetry={() => void credits.refresh()} />
            <button
              className="primary-button full-button"
              disabled={!questionReady || creditAccess.status !== "allowed"}
              onClick={submitQuestion}
              type="button"
            >
              다음
            </button>
          </>
        )}
      >
        <div className="wizard-card">
          <ErrorSummary summaryRef={errorSummaryRef} errors={fieldErrors} generalError={generalError} />
          <ReadingGuideLink kind="saju" />
          <fieldset className="field">
            <legend>리포트 종류</legend>
            <div className="choice-list two-columns">
              {([['birth_annual_question', '종합 사주', '나의 성향과 연간 흐름, 질문을 함께 읽습니다.'], ['annual_monthly', '한 해 리포트', '연간 개요와 12개월의 흐름을 다시 찾아 읽습니다.']] as const).map(([value, label, description]) => (
                <label className="choice-card" key={value}>
                  <input className="sr-only" type="radio" name="report-type" checked={form.reportType === value} onChange={() => updateForm({ reportType: value })} />
                  <span className="choice-head"><span aria-hidden="true" className="choice-dot" /><strong>{label}</strong><span className="choice-price">{creditCost ?? "…"}크레딧</span></span>
                  <span className="choice-desc">{description}</span>
                </label>
              ))}
            </div>
            {form.reportType === "annual_monthly" ? <p className="field-guidance">출생 시각을 모르면 나를 읽는 기준(일간)을 확정하지 못해 간략형으로 제공될 수 있어요. 상세형과 간략형 모두 {creditCost ?? 4}크레딧이며, 저장된 리포트는 추가 차감 없이 다시 읽을 수 있습니다.</p> : null}
          </fieldset>
          <label className="field" htmlFor="saju-target-year">
            <span id="saju-target-year-label">살펴볼 연도</span>
            <select id="saju-target-year" value={form.targetYear === currentYear || form.targetYear === currentYear + 1 ? form.targetYear : ""} aria-invalid={Boolean(fieldErrors.targetYear)}
              aria-labelledby="saju-target-year-label"
              aria-describedby={fieldErrors.targetYear ? "saju-target-year-hint target-year-error" : "saju-target-year-hint"} onChange={(event) => updateForm({ targetYear: Number(event.target.value) })}>
              <option value="" disabled>살펴볼 연도를 선택해 주세요</option>
              {[currentYear, currentYear + 1].map((year) => <option key={year} value={year}>{year}년 ({year === currentYear ? "올해" : "내년"})</option>)}
            </select>
            <p className="field-guidance" id="saju-target-year-hint">{form.reportType === "annual_monthly" ? "달력의 1~12월을 기준으로, 각 월의 절입 전·후 흐름을 구분합니다." : "질문과 연간 해석은 선택한 연도를 기준으로 읽습니다."}</p>
            <FieldError id="target-year-error" message={fieldErrors.targetYear} />
          </label>
          <fieldset
            className="field"
            aria-describedby={fieldErrors.focusArea ? "focus-error" : undefined}
            aria-invalid={Boolean(fieldErrors.focusArea)}
          >
            <legend>관심 분야</legend>
            <div className="choice-list two-columns keep-columns">
              {FOCUS_OPTIONS.map((option) => (
                <label className="choice-card" key={option.value}>
                  <input
                    checked={form.focusArea === option.value}
                    className="sr-only"
                    name="focus-area"
                    onChange={() => updateForm({ focusArea: option.value })}
                    type="radio"
                  />
                  <span className="choice-head"><span aria-hidden="true" className="choice-dot" /><strong>{option.label}</strong></span>
                  <span className="choice-desc">{option.example}</span>
                </label>
              ))}
            </div>
            <FieldError id="focus-error" message={fieldErrors.focusArea} />
          </fieldset>
          <label className="field" htmlFor="saju-question">
            <span id="saju-question-label">{form.reportType === "annual_monthly" ? "질문 (선택)" : "질문 한 가지"}</span>
            <textarea
              // The label also holds the character count, so the field is named by its title alone.
              aria-labelledby="saju-question-label"
              id="saju-question"
              aria-describedby={fieldErrors.question
                ? "saju-question-guidance question-error"
                : "saju-question-guidance"}
              aria-invalid={Boolean(fieldErrors.question)}
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(event) => updateForm({ question: event.target.value })}
              placeholder={selectedFocus ? `예시) ${selectedFocus.example}` : "지금 가장 궁금한 한 가지를 적어주세요."}
              value={form.question}
            />
            <small>{form.question.length} / {MAX_QUESTION_LENGTH}</small>
            <FieldError id="question-error" message={fieldErrors.question} />
          </label>
          <PrivacyNotice id="saju-question-guidance">
            이름·이메일·전화번호·주소·주민등록번호·계좌나 카드번호와 진단·복약, 성생활, 정치·종교 신념 등 개인을 알아보거나 민감할 수 있는 내용은 입력하지 마세요. 작성한 질문은 AI 리딩 생성을 위해 OpenAI API로 전송되지만 명로의 리딩 기록에는 저장되지 않습니다. 자동 검사는 일부 식별정보 형식만 확인하므로 전송하기 전에 불필요한 개인정보가 없는지 직접 확인해 주세요.
          </PrivacyNotice>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "birth") {
    return (
      <ReadingShell
        eyebrow="AI 사주"
        title="출생 정보를 알려주세요"
        description="입력한 출생정보로 명식을 계산해요. 처리 방식은 아래 안내에서 확인할 수 있어요."
        step={2}
        totalSteps={TOTAL_STEPS}
        back={{ label: "이전", onClick: () => setPhase("question") }}
        actions={<button className="primary-button full-button" onClick={submitBirth} type="button">다음</button>}
      >
        <div className="wizard-card">
          <ErrorSummary summaryRef={errorSummaryRef} errors={fieldErrors} generalError={generalError} />
          <aside aria-label="사주 출생정보 처리 안내" className="notice">
            생년월일, 출생시각·정확도, 출생 시·도·시·군·구, 성별과 계산 방식 설정은 사주 계산 중에만 사용합니다. 원본 출생정보는 데이터베이스에 저장하거나 OpenAI에 전송하지 않으며, 요청 처리가 끝나면 별도로 보유하지 않습니다. 계산 기준과 계산된 최소 정보, 리딩 결과는 내 기록에 저장되며 언제든 삭제할 수 있습니다. 자세한 내용은 <Link href="/privacy">개인정보 처리방침</Link>에서 확인할 수 있습니다.
          </aside>
          <ReadingGuideLink kind="saju" />
          <SajuBirthFields
            catalog={catalog}
            catalogError={catalogError}
            catalogStatus={catalogStatus}
            errors={fieldErrors}
            idPrefix={BIRTH_ID_PREFIX}
            onChange={updateBirth}
            onRetryCatalog={() => void loadBirthPlaces()}
            values={form.birth}
          />
        </div>
      </ReadingShell>
    );
  }

  if (phase === "loading") {
    return (
      <ReadingShell
        eyebrow="AI 사주"
        title="사주의 흐름을 읽고 있어요"
        step={3}
        totalSteps={TOTAL_STEPS}
        back={null}
      >
        <ReadingLoading messages={LOADING_MESSAGES} />
      </ReadingShell>
    );
  }

  const focus = FOCUS_OPTIONS.find((item) => item.value === form.focusArea);
  return (
    <ReadingShell
      eyebrow="AI 사주"
      title="입력한 내용을 확인해 주세요"
      description="원본 출생정보와 질문 원문은 저장하지 않아요. 내 기록에는 화면 복원에 필요한 최소 계산정보와 리딩 결과만 저장돼요."
      step={3}
      totalSteps={TOTAL_STEPS}
      back={{ label: "이전", onClick: () => leaveReview("birth", false), disabled: submitting }}
      actions={(
        <>
          <ReadingCreditAccessNotice access={creditAccess} onRetry={() => void credits.refresh()} />
          <button
            className="primary-button full-button"
            disabled={submitting || creditAccess.status !== "allowed"}
            onClick={() => void submitReading()}
            type="button"
          >{creditCost ?? "…"}크레딧으로 {submitLabel}</button>
        </>
      )}
    >
      <div className="wizard-card confirmation-card">
        {/* Only field problems are the user's to fix; anything reaching review is a failure to generate. */}
        <ErrorSummary
          summaryRef={errorSummaryRef}
          errors={fieldErrors}
          generalError={generalError}
          title={generalError ? "리딩을 만들지 못했어요." : undefined}
          note={creditUntouched ? "크레딧은 차감되지 않았어요." : undefined}
        />
        <ReviewGroup id="review-question" title="리딩 내용" onEdit={() => leaveReview("question", true)} disabled={submitting}>
          <dl className="saju-review-list">
          <div><dt>리포트 종류</dt><dd>{form.reportType === "annual_monthly" ? "한 해 리포트" : "종합 사주"}</dd></div>
          <div><dt>리딩 연도</dt><dd>{form.targetYear}년</dd></div>
          <div><dt>관심 분야</dt><dd>{focus?.label}</dd></div>
          <div><dt>질문</dt><dd>{form.question.trim() || "입력하지 않음"}</dd></div>
          </dl>
        </ReviewGroup>
        <ReviewGroup id="review-birth" title="출생 정보" onEdit={() => leaveReview("birth", true)} disabled={submitting}>
          <dl className="saju-review-list">
          <div><dt>생년월일</dt><dd>{formatBirthDate(form.birth.birthDate)} · 양력</dd></div>
          <div><dt>출생 시각</dt><dd>{birthTimeSummary(form.birth)}</dd></div>
          {isBirthTimeKnown(form.birth.birthTimePrecision) ? <div><dt>출생지</dt><dd>{birthPlaceName(catalog, form.birth)}</dd></div> : null}
          <div><dt>성별</dt><dd>{luckBasisSummary(form.birth.luckDirectionBasis)}</dd></div>
          <div><dt>계산 방식</dt><dd>{calculationOptionsSummary(form.birth)}</dd></div>
          </dl>
        </ReviewGroup>
      </div>
    </ReadingShell>
  );
}

function buildRequest(form: SajuFormState, requestId: string): SajuReadingCreateRequest {
  const request = {
    ...(form.reportType === "annual_monthly" ? { reportType: form.reportType } : {}),
    targetYear: form.targetYear,
    requestId,
    question: form.question.trim(),
    focusArea: form.focusArea,
    birthProfile: birthProfileOf(form.birth),
  };
  const options = calculationOptionsOf(form.birth);
  return parseSajuReadingCreateRequest(options ? { ...request, calculationOptions: options } : request);
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

function formatBirthDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? `${year}년 ${month}월 ${day}일` : value;
}




const ErrorSummary = ({
  errors,
  generalError,
  summaryRef,
  title = "입력 내용을 확인해 주세요.",
  note,
}: {
  errors: Partial<Record<FieldKey, string>>;
  generalError: string | null;
  summaryRef: React.RefObject<HTMLDivElement | null>;
  title?: string;
  note?: string;
}) => {
  const messages = [...new Set([...Object.values(errors), ...(generalError ? [generalError] : [])])];
  return messages.length > 0 ? (
    <div className="saju-error-summary" ref={summaryRef} role="alert" tabIndex={-1}>
      <strong>{title}</strong>
      {messages.map((message) => <p key={message}>{message}</p>)}
      {note ? <p>{note}</p> : null}
    </div>
  ) : null;
};
