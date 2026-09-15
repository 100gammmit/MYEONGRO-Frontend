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
import { getReadingCreditAccess } from "@/domain/reading-credit";
import {
  containsDirectIdentifier,
  DIRECT_IDENTIFIER_INPUT_MESSAGE,
} from "@/domain/reading/direct-identifier";
import {
  fetchSajuBirthPlaces,
  SajuBirthPlacesClientError,
} from "@/infrastructure/backend/saju-birth-places-client";

import { BrandMark } from "./brand-mark";
import { ConsentGate } from "./consent-gate";
import { ReadingCreditAccessNotice } from "./reading-credit-access-notice";
import { useReadingCredits } from "./reading-credit-provider";
import { ReadingShell } from "./reading-shell";

type Phase = "consent" | "question" | "birth" | "review" | "loading";
type WizardStep = "question" | "birth" | "review";
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

// Consent is a one-time threshold, not a step: question 1, birth 2, review 3, loading 4.
const TOTAL_STEPS = 4;
const MAX_QUESTION_LENGTH = 300;
const SLOW_GENERATION_MS = 15_000;
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

// One message per stroke of the brand mark.
const LOADING_MESSAGES = [
  "출생정보를 확인하고 있어요.",
  "명식의 공통 구조를 계산하고 있어요.",
  "올해의 흐름을 연결하고 있어요.",
  "질문에 맞는 리딩을 구성하고 있어요.",
] as const;

const FIELD_PHASE: Partial<Record<string, Phase>> = {
  "birthProfile.birthDate": "birth",
  "birthProfile.birthTimePrecision": "birth",
  "birthProfile.birthTime": "birth",
  "birthProfile.provinceCode": "birth",
  "birthProfile.luckDirectionBasis": "birth",
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

// Where focus goes when the birth step finds an empty required field.
const FIELD_INPUT_ID: Partial<Record<FieldKey, string>> = {
  birthDate: "saju-birth-date",
  birthTimePrecision: "saju-precision-exact",
  birthTime: "saju-birth-time",
  provinceCode: "saju-province",
};

const REVEAL_ANNOUNCEMENT = "태어난 시각과 출생 시·도 칸이 열렸어요.";

function isTimeKnown(precision: SajuFormState["birthTimePrecision"]): boolean {
  return precision === "exact" || precision === "approximate";
}

function findMissingBirthFields(form: SajuFormState): Partial<Record<FieldKey, string>> {
  const missing: Partial<Record<FieldKey, string>> = {};
  if (!form.birthDate) missing.birthDate = "양력 생년월일을 입력해 주세요.";
  if (!form.birthTimePrecision) {
    missing.birthTimePrecision = "출생 시각의 정확도를 골라 주세요.";
  } else if (isTimeKnown(form.birthTimePrecision)) {
    if (!form.birthTime) missing.birthTime = "태어난 시각을 입력해 주세요.";
    if (!form.provinceCode) missing.provinceCode = "출생 시·도를 선택해 주세요.";
  }
  return missing;
}

function isQuestionReady(form: SajuFormState): boolean {
  return Boolean(form.focusArea && form.question.trim().length > 0 && form.question.length <= MAX_QUESTION_LENGTH);
}

// The browser's forward button can land on a later step; only allow it when the steps before it still pass their checks.
function canEnterStep(step: WizardStep, form: SajuFormState): boolean {
  if (step === "question") return true;
  const questionPasses = isQuestionReady(form) && !containsDirectIdentifier(form.question);
  if (step === "birth") return questionPasses;
  return questionPasses && Object.keys(findMissingBirthFields(form)).length === 0;
}

function isWizardStep(value: unknown): value is WizardStep {
  return value === "question" || value === "birth" || value === "review";
}

function ensureRequestId(requestIdRef: MutableRefObject<string | null>): string {
  if (!requestIdRef.current) requestIdRef.current = globalThis.crypto.randomUUID();
  return requestIdRef.current;
}

export function SajuExperience() {
  const router = useRouter();
  const credits = useReadingCredits();
  const [phase, setPhase] = useState<Phase>("consent");
  const [form, setForm] = useState<SajuFormState>(initialForm);
  const [catalog, setCatalog] = useState<SajuBirthPlacesResponse | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("idle");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [slowGeneration, setSlowGeneration] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [creditUntouched, setCreditUntouched] = useState(false);
  const [revealAnnouncement, setRevealAnnouncement] = useState("");
  const requestIdRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const followUpDraftRef = useRef(false);
  const editingFromReviewRef = useRef(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const focusFieldRef = useRef<string | null>(null);
  const formRef = useRef(form);
  const historyPhaseRef = useRef<Phase>("consent");
  const poppedRef = useRef(false);
  const creditData = credits.state.status === "ready" ? credits.state.data : null;
  const creditCost = creditData?.costs.saju ?? null;
  const creditAccess = getReadingCreditAccess(
    creditData,
    credits.state.status === "idle" || credits.state.status === "loading",
    creditCost,
  );
  // Blocking states surface at the top of the question step; allowed and loading stay next to the button.
  const creditBlocked = creditAccess.status === "insufficient"
    || creditAccess.status === "generation-in-progress"
    || creditAccess.status === "unavailable";
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

  useEffect(() => {
    const remembered = takeRememberedSajuBirthProfile();
    if (!remembered) return;
    followUpDraftRef.current = true;
    setForm((current) => ({
      ...current,
      birthDate: remembered.birthDate,
      birthTimePrecision: remembered.birthTimePrecision,
      birthTime: "birthTime" in remembered ? remembered.birthTime ?? "" : "",
      provinceCode: remembered.birthTimePrecision === "unknown"
        ? ""
        : remembered.provinceCode ?? "",
      luckDirectionBasis: remembered.luckDirectionBasis,
    }));
  }, []);

  const handleConsentComplete = useCallback(() => {
    setPhase("question");
  }, []);

  // Load the province list as soon as the birth step opens, so choosing a known time never waits on it.
  // A remembered profile with a known time also needs it on review to show the province name.
  useEffect(() => {
    if (catalogStatus !== "idle") return;
    if (phase === "birth" || (phase !== "consent" && isTimeKnown(form.birthTimePrecision))) {
      void loadBirthPlaces();
    }
  }, [catalogStatus, form.birthTimePrecision, loadBirthPlaces, phase]);

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
      if (!isWizardStep(step) || inFlightRef.current) return;
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
    if (phase !== "loading") return;
    setLoadingIndex(0);
    setSlowGeneration(false);
    const timer = globalThis.setInterval(() => {
      setLoadingIndex((current) => Math.min(current + 1, LOADING_MESSAGES.length - 1));
    }, 1200);
    const slowTimer = globalThis.setTimeout(() => setSlowGeneration(true), SLOW_GENERATION_MS);
    return () => {
      globalThis.clearInterval(timer);
      globalThis.clearTimeout(slowTimer);
    };
  }, [phase]);

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

  function selectPrecision(value: BirthTimePrecision) {
    // Keep any time and province already entered; buildRequest leaves them out when the time is unknown.
    const opening = isTimeKnown(value) && !isTimeKnown(form.birthTimePrecision);
    setRevealAnnouncement(opening ? REVEAL_ANNOUNCEMENT : "");
    updateForm({ birthTimePrecision: value });
  }

  function selectProvince(provinceCode: string) {
    updateForm({ provinceCode });
  }

  function editStep(step: "question" | "birth") {
    editingFromReviewRef.current = true;
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
    setPhase(followUpDraftRef.current || editingFromReviewRef.current ? "review" : "birth");
  }

  function submitBirth() {
    const missing = findMissingBirthFields(form);
    const first = (Object.keys(missing) as FieldKey[])[0];
    if (first) {
      focusFieldRef.current = FIELD_INPUT_ID[first] ?? null;
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
          void credits.refresh();
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
    // Credits are charged only when a reading completes, so a confirmed generation failure charged nothing.
    // Network and proxy failures stay silent on credits: the backend may still have finished.
    setCreditUntouched(error.code === "OPENAI_READING_GENERATION_FAILED");
    setGeneralError(
      error.code === "READING_GENERATION_IN_PROGRESS"
        ? "이미 생성 중인 리딩이 있어요. 완료 후 다시 시도해 주세요."
        : error.code === "INSUFFICIENT_READING_CREDITS"
          ? "크레딧이 부족해요. 크레딧은 내일 0시에 다시 채워지니, 내일 다시 시도해 주세요."
          : error.message || "리딩 요청을 처리하지 못했어요.",
    );
    setPhase("review");
  }

  if (phase === "consent") {
    return (
      <ReadingShell
        eyebrow="AI SAJU"
        title="사주 리딩을 시작하기 전에"
        description="출생 정보는 리딩 생성과 기록 복원을 위해 저장되며, 내 기록에서 언제든 삭제할 수 있어요."
        stepLabel="시작하기 전에"
      >
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
        eyebrow="AI SAJU"
        title="지금 가장 살펴보고 싶은 한 가지는 무엇인가요?"
        description="관심 분야를 고른 뒤, 현재 선택에 도움이 될 질문을 하나 적어주세요."
        step={1}
        totalSteps={TOTAL_STEPS}
        showHomeLink={false}
        actions={(
          <>
            {creditBlocked ? null : (
              <ReadingCreditAccessNotice access={creditAccess} onRetry={() => void credits.refresh()} />
            )}
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
        {creditBlocked ? (
          <ReadingCreditAccessNotice access={creditAccess} onRetry={() => void credits.refresh()} />
        ) : null}
        <div className="wizard-card">
          <ErrorSummary summaryRef={errorSummaryRef} errors={fieldErrors} generalError={generalError} />
          <fieldset
            className="field"
            aria-describedby={fieldErrors.focusArea ? "focus-error" : undefined}
            aria-invalid={Boolean(fieldErrors.focusArea)}
          >
            <legend>관심 분야</legend>
            <div className="category-grid saju-focus-grid">
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
              aria-describedby={fieldErrors.question
                ? "saju-question-guidance question-error"
                : "saju-question-guidance"}
              aria-invalid={Boolean(fieldErrors.question)}
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(event) => updateForm({ question: event.target.value })}
              placeholder={selectedFocus?.example ?? "지금 가장 궁금한 한 가지를 적어주세요."}
              value={form.question}
            />
            <p className="field-guidance" id="saju-question-guidance">
              개인정보는 제외하고 상황만 작성해 주세요. 이름·이메일·전화번호·주소·주민등록번호·계좌나 카드번호와 진단·복약, 성생활, 정치·종교 신념 등 개인을 알아보거나 민감할 수 있는 내용은 입력하지 마세요. 작성한 질문은 AI 리딩 생성을 위해 OpenAI API로 전송되지만 명로의 리딩 기록에는 저장되지 않습니다. 자동 검사는 일부 식별정보 형식만 확인하므로 전송하기 전에 불필요한 개인정보가 없는지 직접 확인해 주세요.
            </p>
            <small>{form.question.length} / {MAX_QUESTION_LENGTH}자</small>
            <FieldError id="question-error" message={fieldErrors.question} />
          </label>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "birth") {
    const timeKnown = isTimeKnown(form.birthTimePrecision);
    return (
      <ReadingShell
        eyebrow="AI SAJU"
        title="출생 정보를 알려주세요"
        description="출생 정보는 리딩 생성과 기록 복원을 위해 저장되며, 내 기록에서 언제든 삭제할 수 있어요."
        step={2}
        totalSteps={TOTAL_STEPS}
        showHomeLink={false}
        actions={<NavigationButtons back={() => setPhase("question")} next={submitBirth} />}
      >
        <div className="wizard-card">
          <ErrorSummary summaryRef={errorSummaryRef} errors={fieldErrors} generalError={generalError} />
          <p className="sr-only" aria-live="polite">{revealAnnouncement}</p>
          <div className="field">
            <label htmlFor="saju-birth-date">양력 생년월일</label>
            <input
              id="saju-birth-date"
              aria-describedby={fieldErrors.birthDate ? "birth-date-hint birth-date-error" : "birth-date-hint"}
              aria-invalid={Boolean(fieldErrors.birthDate)}
              type="date"
              value={form.birthDate}
              onChange={(event) => updateForm({ birthDate: event.target.value })}
            />
            <p className="field-guidance" id="birth-date-hint">음력 생일은 아직 지원하지 않아요. 양력 날짜로 입력해 주세요.</p>
            <FieldError id="birth-date-error" message={fieldErrors.birthDate} />
          </div>
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
                    id={`saju-precision-${option.value}`}
                    checked={form.birthTimePrecision === option.value}
                    name="birth-time-precision"
                    onChange={() => selectPrecision(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    {form.birthTimePrecision === option.value ? <small>{option.detail}</small> : null}
                  </span>
                </label>
              ))}
            </div>
            {form.birthTimePrecision === "unknown" ? (
              <p className="field-guidance">출생 시각을 모르면 출생지는 입력하지 않아도 돼요.</p>
            ) : null}
            <p className="field-guidance" id="birth-time-help">
              {form.birthTimePrecision === "approximate"
                ? "입력한 시각 전후 60분을 함께 계산해 공통되는 내용만 보여줘요."
                : "태어난 시각이 확실하지 않다면 ‘시간을 몰라요’를 선택해 주세요."}
            </p>
            <FieldError id="birth-time-precision-error" message={fieldErrors.birthTimePrecision} />
          </fieldset>
          {timeKnown ? (
            <div className="birth-reveal">
              <div className="field">
                <label htmlFor="saju-birth-time">태어난 시각</label>
                <input
                  id="saju-birth-time"
                  aria-describedby={fieldErrors.birthTime ? "birth-time-error" : "birth-time-help"}
                  aria-invalid={Boolean(fieldErrors.birthTime)}
                  type="time"
                  value={form.birthTime}
                  onChange={(event) => updateForm({ birthTime: event.target.value })}
                />
                <FieldError id="birth-time-error" message={fieldErrors.birthTime} />
              </div>
              <div className="field">
                <label htmlFor="saju-province">출생 시·도</label>
                <select
                  id="saju-province"
                  aria-describedby={fieldErrors.provinceCode ? "province-hint province-error" : "province-hint"}
                  aria-invalid={Boolean(fieldErrors.provinceCode)}
                  disabled={catalogStatus !== "ready"}
                  onChange={(event) => selectProvince(event.target.value)}
                  value={form.provinceCode}
                >
                  <option value="">시·도 선택</option>
                  {catalog?.provinces.map((item) => <option key={item.provinceCode} value={item.provinceCode}>{item.provinceName}</option>)}
                </select>
                {catalogStatus === "idle" || catalogStatus === "loading" ? (
                  <p className="field-guidance" aria-live="polite">출생지 목록을 불러오고 있어요.</p>
                ) : null}
                {catalogStatus === "error" ? (
                  <div className="field-inline-error" role="alert">
                    <p className="form-error">{catalogError}</p>
                    <button className="secondary-button" onClick={() => void loadBirthPlaces()} type="button">다시 불러오기</button>
                  </div>
                ) : null}
                <p className="field-guidance" id="province-hint">출생 시·도는 태어난 시각을 보정하는 데 사용됩니다.</p>
                <FieldError id="province-error" message={fieldErrors.provinceCode} />
              </div>
            </div>
          ) : null}
          <fieldset
            className="field"
            aria-describedby={fieldErrors.luckDirectionBasis ? "luck-help luck-error" : "luck-help"}
            aria-invalid={Boolean(fieldErrors.luckDirectionBasis)}
          >
            <legend>대운 계산 기준</legend>
            <p className="muted" id="luck-help">전통 명리학에서 대운의 순행·역행을 계산할 때만 사용합니다. 성격이나 역할을 성별에 따라 다르게 해석하지 않습니다.</p>
            <div className="saju-choice-row chips">
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
        </div>
      </ReadingShell>
    );
  }

  if (phase === "loading") {
    return (
      <ReadingShell
        eyebrow="AI SAJU"
        title="사주의 흐름을 읽고 있어요"
        step={4}
        totalSteps={TOTAL_STEPS}
        showHomeLink={false}
      >
        <div className="wizard-card saju-loading">
          {/* After the fourth stroke the centre card breathes until the response arrives. */}
          <BrandMark
            breathing={loadingIndex === LOADING_MESSAGES.length - 1}
            lit={loadingIndex + 1}
            size={104}
          />
          <div aria-live="polite">
            <p>{LOADING_MESSAGES[loadingIndex]}</p>
            {slowGeneration ? <p className="muted">조금 더 걸리고 있어요. 잠시만 기다려 주세요.</p> : null}
          </div>
        </div>
      </ReadingShell>
    );
  }

  const province = catalog?.provinces.find((item) => item.provinceCode === form.provinceCode);
  const focus = FOCUS_OPTIONS.find((item) => item.value === form.focusArea);
  return (
    <ReadingShell
      eyebrow="AI SAJU"
      title="입력한 내용을 확인해 주세요"
      description="출생정보와 계산 기준은 내 기록에 저장되지만 질문 원문은 저장되지 않아요."
      step={3}
      totalSteps={TOTAL_STEPS}
      showHomeLink={false}
      actions={(
        <>
          <ReadingCreditAccessNotice access={creditAccess} onRetry={() => void credits.refresh()} />
          <div className="wizard-nav">
            <button className="secondary-button" disabled={submitting} onClick={() => setPhase("birth")} type="button">이전</button>
            <button
              aria-label="사주 리딩 생성"
              className="primary-button"
              disabled={submitting || creditAccess.status !== "allowed"}
              onClick={() => void submitReading()}
              type="button"
            >사주 리딩 생성 · {creditCost ?? "…"} 크레딧</button>
          </div>
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
        <ReviewGroup id="review-question" title="질문" onEdit={() => editStep("question")} disabled={submitting}>
          <div><dt>관심 분야</dt><dd>{focus?.label}</dd></div>
          <div><dt>질문</dt><dd>{form.question.trim()}</dd></div>
        </ReviewGroup>
        <ReviewGroup id="review-birth" title="출생 정보" onEdit={() => editStep("birth")} disabled={submitting}>
          <div><dt>생년월일</dt><dd>{formatBirthDate(form.birthDate)} · 양력</dd></div>
          <div><dt>출생 시각</dt><dd>{timeSummary(form)}</dd></div>
          {form.birthTimePrecision !== "unknown" ? <div><dt>출생지</dt><dd>{province?.provinceName}</dd></div> : null}
          <div><dt>대운</dt><dd>{luckSummary(form.luckDirectionBasis)}</dd></div>
        </ReviewGroup>
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

function formatBirthDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? `${year}년 ${month}월 ${day}일` : value;
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

function ReviewGroup({
  id,
  title,
  onEdit,
  disabled,
  children,
}: {
  id: string;
  title: string;
  onEdit: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="saju-review-group" aria-labelledby={id}>
      <div className="saju-review-head">
        <h2 id={id}>{title}</h2>
        <button
          aria-label={`${title} 고치기`}
          className="saju-review-edit"
          disabled={disabled}
          onClick={onEdit}
          type="button"
        >고치기</button>
      </div>
      <dl className="saju-review-list">{children}</dl>
    </section>
  );
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

function NavigationButtons({
  back,
  next,
  nextLabel = "다음",
}: {
  back: () => void;
  next: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="wizard-nav">
      <button className="secondary-button" onClick={back} type="button">이전</button>
      <button className="primary-button" onClick={next} type="button">{nextLabel}</button>
    </div>
  );
}
