"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  BIRTH_FIELD_BY_REQUEST_PATH,
  EMPTY_BIRTH_VALUES,
  birthProfileOf,
  calculationOptionsOf,
  findMissingBirthFields,
  type SajuBirthFieldKey,
  type SajuBirthValues,
} from "@/domain/saju/birth-input";
import type { SajuBirthPlacesResponse } from "@/domain/saju/contracts";
import type { ManseryeokChart } from "@/domain/manseryeok/schema";
import {
  calculateManseryeok,
  fetchPublicBirthPlaces,
  type ManseryeokOutcome,
} from "@/infrastructure/backend/manseryeok-client";

import { SajuBirthFields, birthFieldInputId, type BirthPlaceCatalogStatus } from "../saju-birth-fields";
import { ManseryeokResult, type MonthlyYearChoice } from "./manseryeok-result";
import styles from "./manseryeok.module.css";

const ID_PREFIX = "manseryeok";
const RATE_LIMIT_MS = 60_000;

type Phase = "input" | "result" | "unavailable";
type Notice = null | "retrying" | "busy" | "rateLimited" | "failed";

export interface ManseryeokExperienceProps {
  readonly calculateEndpoint: string;
  readonly birthPlacesEndpoint: string;
}

/**
 * Input and result share one page: the result replaces the form, the browser back button returns to
 * it, and a reload starts over because nothing is stored. Only the step goes into the address.
 */
export function ManseryeokExperience({ calculateEndpoint, birthPlacesEndpoint }: ManseryeokExperienceProps) {
  const [phase, setPhase] = useState<Phase>("input");
  const [birth, setBirth] = useState<SajuBirthValues>(EMPTY_BIRTH_VALUES);
  const [confirmed, setConfirmed] = useState(false);
  const [catalog, setCatalog] = useState<SajuBirthPlacesResponse | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<BirthPlaceCatalogStatus>("loading");
  const [errors, setErrors] = useState<Partial<Record<SajuBirthFieldKey, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [chart, setChart] = useState<ManseryeokChart | null>(null);
  const [yearChoice, setYearChoice] = useState<MonthlyYearChoice>("current");
  const [nextYearChart, setNextYearChart] = useState<ManseryeokChart | null>(null);
  const [nextYearState, setNextYearState] = useState<"idle" | "loading" | "failed" | "limited">("idle");
  const summaryRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("input");
  const pendingFocusRef = useRef<string | null>(null);

  // After returning to the form, move focus where the result asked (e.g. the gender choice).
  const focusPending = useCallback(() => {
    window.setTimeout(() => {
      const id = pendingFocusRef.current;
      pendingFocusRef.current = null;
      if (id) document.getElementById(id)?.focus();
    }, 0);
  }, []);

  const loadPlaces = useCallback(async () => {
    setCatalogStatus("loading");
    const outcome = await fetchPublicBirthPlaces(birthPlacesEndpoint);
    if (outcome.kind === "unavailable") {
      setPhase("unavailable");
      return;
    }
    if (outcome.kind === "ok") {
      setCatalog(outcome.places);
      setCatalogStatus("ready");
    } else {
      setCatalogStatus("error");
    }
  }, [birthPlacesEndpoint]);

  useEffect(() => { void loadPlaces(); }, [loadPlaces]);

  // A reload starts at the form (nothing is stored), so drop a step left in the address.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("step")) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // A 429 locks the button for the minute the server asked for, then opens it again.
  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setTimeout(() => {
      setLockedUntil(0);
      setNotice((current) => (current === "rateLimited" ? null : current));
    }, Math.max(0, lockedUntil - Date.now()));
    return () => clearTimeout(timer);
  }, [lockedUntil]);

  // The result is one history entry, so the phone's back button returns to the form.
  useEffect(() => {
    const previous = phaseRef.current;
    phaseRef.current = phase;
    if (previous === phase) return;
    if (phase === "result") window.history.pushState({ manseryeokStep: "result" }, "", `${window.location.pathname}?step=result`);
    window.scrollTo({ top: 0 });
    if (phase === "input") focusPending();
  }, [focusPending, phase]);

  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      const step = (event.state as { manseryeokStep?: unknown } | null)?.manseryeokStep;
      if (step !== "result" && phaseRef.current === "result") {
        phaseRef.current = "input";
        setPhase("input");
        window.scrollTo({ top: 0 });
        focusPending();
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [focusPending]);

  useEffect(() => {
    if (!Object.keys(errors).length && !generalError) return;
    const target = focusRef.current ? document.getElementById(focusRef.current) : null;
    focusRef.current = null;
    if (target && !(target as HTMLInputElement).disabled) target.focus();
    else summaryRef.current?.focus();
  }, [errors, generalError]);

  function changeBirth(next: SajuBirthValues) {
    setBirth(next);
    setErrors({});
    setGeneralError(null);
  }

  function applyOutcome(outcome: ManseryeokOutcome) {
    if (outcome.kind === "ok") {
      setNotice(null);
      setChart(outcome.chart);
      setNextYearChart(null);
      setNextYearState("idle");
      setYearChoice("current");
      setPhase("result");
      return;
    }
    if (outcome.kind === "unavailable") { setPhase("unavailable"); return; }
    if (outcome.kind === "rateLimited") {
      setNotice("rateLimited");
      setLockedUntil(Date.now() + RATE_LIMIT_MS);
      return;
    }
    if (outcome.kind === "busy") { setNotice("busy"); return; }
    if (outcome.kind === "invalid") {
      setNotice(null);
      const field = outcome.field ? BIRTH_FIELD_BY_REQUEST_PATH[outcome.field] : undefined;
      if (field) {
        focusRef.current = birthFieldInputId(ID_PREFIX, field);
        setErrors({ [field]: outcome.message });
      } else {
        setGeneralError(outcome.message);
      }
      return;
    }
    setNotice("failed");
  }

  async function submit() {
    if (calculating || lockedUntil) return;
    const missing = findMissingBirthFields(birth);
    const first = (Object.keys(missing) as SajuBirthFieldKey[])[0];
    if (first) {
      focusRef.current = birthFieldInputId(ID_PREFIX, first);
      setErrors(missing);
      return;
    }
    setCalculating(true);
    setNotice(null);
    setGeneralError(null);
    const options = calculationOptionsOf(birth);
    const outcome = await calculateManseryeok(calculateEndpoint, {
      birthProfile: birthProfileOf(birth),
      ...(options ? { options } : {}),
    }, { onRetry: () => setNotice("retrying") });
    setCalculating(false);
    applyOutcome(outcome);
  }

  async function chooseYear(choice: MonthlyYearChoice) {
    setYearChoice(choice);
    if (choice === "current" || !chart || nextYearChart || nextYearState === "loading") return;
    if (lockedUntil) { setNextYearState("limited"); return; }
    setNextYearState("loading");
    const options = calculationOptionsOf(birth);
    // Only next year is sent as a number; "this year" stays the server's default.
    const outcome = await calculateManseryeok(calculateEndpoint, {
      birthProfile: birthProfileOf(birth),
      ...(options ? { options } : {}),
      referenceYear: chart.referenceYear + 1,
    });
    if (outcome.kind === "ok") {
      setNextYearChart(outcome.chart);
      setNextYearState("idle");
    } else if (outcome.kind === "rateLimited") {
      setLockedUntil(Date.now() + RATE_LIMIT_MS);
      setNextYearState("limited");
    } else {
      setNextYearState("failed");
    }
  }

  function editInput(focusField?: "luck") {
    pendingFocusRef.current = focusField === "luck" ? birthFieldInputId(ID_PREFIX, "luckDirectionBasis") : null;
    // Going back through history keeps the entries tidy; the popstate handler shows the form.
    if ((window.history.state as { manseryeokStep?: unknown } | null)?.manseryeokStep === "result") window.history.back();
    else setPhase("input");
  }

  // FM3 fills this with the hand-off to the AI saju form.
  function askAi() {
    window.location.assign("/saju");
  }

  function startOver() {
    setBirth((current) => ({ ...EMPTY_BIRTH_VALUES, dayBoundary: current.dayBoundary, equationOfTime: current.equationOfTime }));
    setConfirmed(false);
    setChart(null);
    editInput();
  }

  if (phase === "unavailable") {
    return (
      <article className={`flow-page page-width ${styles.page}`}>
        <h1>무료 만세력을 준비하고 있어요</h1>
        <p className="flow-lead">곧 로그인 없이 명식을 계산해 볼 수 있게 열어 둘게요. 그동안 AI 사주 리딩이나 띠별 신년운세를 둘러보세요.</p>
        <div className={styles.links}>
          <Link href="/saju">AI 사주 리딩 알아보기</Link>
          <Link href="/zodiac">2027 띠별 신년운세</Link>
        </div>
      </article>
    );
  }

  if (phase === "result" && chart) {
    return (
      <ManseryeokResult
        birth={birth}
        catalog={catalog}
        chart={chart}
        monthlyChart={yearChoice === "next" ? nextYearChart : chart}
        monthlyState={yearChoice === "next" ? nextYearState : "idle"}
        onChooseYear={(choice) => void chooseYear(choice)}
        onAskAi={askAi}
        onEdit={editInput}
        onStartOver={startOver}
        yearChoice={yearChoice}
      />
    );
  }

  const messages = [...new Set([...Object.values(errors), ...(generalError ? [generalError] : [])])];
  const locked = calculating || Boolean(lockedUntil);
  return (
    <article className={`flow-page page-width ${styles.page}`}>
      <h1>무료 만세력</h1>
      <p className="flow-lead">생년월일과 태어난 시각으로 사주 명식을 계산해요.</p>
      <ul className={styles.chips} aria-label="계산 결과에 담기는 것">
        <li>명식표</li><li>오행·관계·공망</li><li>대운</li><li>세운 10년</li><li>올해 월운</li>
      </ul>

      <form className={styles.form} aria-label="만세력 계산" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        {messages.length ? (
          <div className="saju-error-summary" ref={summaryRef} role="alert" tabIndex={-1}>
            <strong>입력을 확인해 주세요</strong>
            {messages.map((message) => <p key={message}>{message}</p>)}
          </div>
        ) : null}
        <SajuBirthFields
          catalog={catalog}
          catalogStatus={catalogStatus}
          disabled={calculating}
          errors={errors}
          idPrefix={ID_PREFIX}
          onChange={changeBirth}
          onRetryCatalog={() => void loadPlaces()}
          values={birth}
        />
        <div className={styles.consent}>
          <label className={styles.check}>
            <input checked={confirmed} disabled={calculating} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
            <span>만 14세 이상이에요. 다른 사람의 정보라면 그 사람의 동의를 받고 입력해요.</span>
          </label>
          <p>입력한 생년월일·시각·지역은 계산에만 쓰고 저장하지 않아요. 짧은 시간에 요청이 많으면 잠시 이용이 제한될 수 있어요. <Link href="/privacy">개인정보 처리방침</Link></p>
        </div>
        <StatusNotice notice={notice} />
        <button className={`primary-button full-button ${styles.submit}`} disabled={!confirmed || locked} type="submit">
          {calculating ? (notice === "retrying" ? "다시 시도하는 중이에요" : "계산하는 중이에요") : "만세력 계산하기"}
        </button>
      </form>
    </article>
  );
}

function StatusNotice({ notice }: { notice: Notice }) {
  if (notice === "retrying") {
    return <div className={styles.notice} role="status"><strong>요청이 몰려 잠깐 기다리고 있어요</strong><p>자동으로 한 번 더 계산해 볼게요. 화면을 닫지 않아도 돼요.</p></div>;
  }
  if (notice === "busy") {
    return <div className={`${styles.notice} ${styles.warn}`} role="alert"><strong>지금은 계산 요청이 많아요</strong><p>잠시 뒤에 다시 시도해 주세요. 입력한 내용은 그대로 남아 있어요.</p></div>;
  }
  if (notice === "rateLimited") {
    return <div className={`${styles.notice} ${styles.warn}`} role="alert"><strong>짧은 시간에 계산을 많이 했어요</strong><p>1분 뒤에 다시 시도해 주세요.</p></div>;
  }
  if (notice === "failed") {
    return <div className={`${styles.notice} ${styles.warn}`} role="alert"><strong>계산하지 못했어요</strong><p>잠시 뒤에 다시 시도해 주세요. 입력한 내용은 그대로 남아 있어요.</p></div>;
  }
  return null;
}
