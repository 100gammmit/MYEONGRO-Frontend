"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ConsentDocumentModal } from "@/components/consent-document-modal";
import { StepHeading } from "@/components/step-heading";
import { TERMS_DOCUMENT_VERSION } from "@/domain/consent/documents";
import { normalizeNextPath } from "@/infrastructure/auth/next-path";

type ViewState =
  | "loading"
  | "ready"
  | "submitting"
  | "expired"
  | "terms-outdated"
  | "error";

interface SignupStatusResponse {
  pending?: boolean;
  completed?: boolean;
  next?: unknown;
  provider?: unknown;
}

interface SignupCompletionResponse {
  next?: unknown;
}

interface SignupErrorResponse {
  code?: unknown;
  message?: unknown;
}

export function SignupAgeConfirmation() {
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [provider, setProvider] = useState<string | null>(null);
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isTermsDocumentOpen, setIsTermsDocumentOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const termsReviewButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeTermsDocument = useCallback(() => setIsTermsDocumentOpen(false), []);

  const navigateToCompletedSignup = useCallback((next: unknown) => {
    router.replace(normalizeNextPath(typeof next === "string" ? next : undefined));
    router.refresh();
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    void loadSignupStatus(controller.signal);
    return () => controller.abort();

    async function loadSignupStatus(signal: AbortSignal) {
      try {
        const response = await fetch("/api/signup", {
          credentials: "same-origin",
          cache: "no-store",
          signal,
        });
        if (response.status === 401 || response.status === 410) {
          setViewState("expired");
          return;
        }
        if (!response.ok) {
          setErrorMessage("가입 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
          setViewState("error");
          return;
        }
        const body = await response.json() as SignupStatusResponse;
        if (body.completed === true) {
          navigateToCompletedSignup(body.next);
          return;
        }
        if (body.pending !== true) {
          setViewState("expired");
          return;
        }
        setProvider(typeof body.provider === "string" ? body.provider : null);
        setViewState("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage("가입 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setViewState("error");
      }
    }
  }, [navigateToCompletedSignup]);

  async function confirmAdultEligibility() {
    if (!isAdultConfirmed || !isTermsAccepted || viewState !== "ready") return;
    setViewState("submitting");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adultEligibilityConfirmed: true,
          termsAccepted: true,
          termsVersion: TERMS_DOCUMENT_VERSION,
        }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          const error = await safeErrorResponse(response);
          if (error.code === "CONSENT_VERSION_MISMATCH") {
            setIsTermsAccepted(false);
            setIsTermsDocumentOpen(false);
            setErrorMessage(null);
            setViewState("terms-outdated");
            return;
          }
        }
        if (await recoverCompletedSignup()) return;
        if (response.status === 401 || response.status === 410) {
          setViewState("expired");
          return;
        }
        setErrorMessage("회원 가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setViewState("ready");
        return;
      }
      const body = await response.json() as SignupCompletionResponse;
      navigateToCompletedSignup(body.next);
    } catch {
      if (await recoverCompletedSignup()) return;
      setErrorMessage("회원 가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setViewState("ready");
    }
  }

  async function recoverCompletedSignup(): Promise<boolean> {
    try {
      const response = await fetch("/api/signup", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) return false;
      const body = await response.json() as SignupStatusResponse;
      if (body.completed !== true) return false;
      navigateToCompletedSignup(body.next);
      return true;
    } catch {
      return false;
    }
  }

  async function cancelSignup() {
    setViewState("submitting");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/signup", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (response.status === 401 || response.status === 410) {
        setViewState("expired");
        return;
      }
      if (!response.ok) {
        const body = (await safeErrorResponse(response)).message;
        setErrorMessage(
          body ?? "외부 계정 연결 해제를 확인하지 못했습니다. 계정 설정에서 직접 연결을 해제해 주세요.",
        );
        setViewState("error");
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage(
        "외부 계정 연결 해제를 확인하지 못했습니다. 계정 설정에서 직접 연결을 해제해 주세요.",
      );
      setViewState("error");
    }
  }

  if (viewState === "loading") {
    return (
      <>
        <StepHeading focusOnChange title="가입 상태를 확인하고 있어요" />
        <p className="flow-lead" role="status">잠시만 기다려 주세요.</p>
      </>
    );
  }

  if (viewState === "expired") {
    return (
      <>
        <StepHeading focusOnChange title="가입 대기 시간이 지났어요" />
        <p className="flow-lead">계정 확인 뒤 가입을 마치지 않으면 임시 연결이 끝나요. 로그인부터 다시 시작해 주세요.</p>
        <div className="signup-actions single">
          <Link className="primary-button" href="/login">로그인 다시 시작</Link>
        </div>
      </>
    );
  }

  if (viewState === "terms-outdated") {
    return (
      <>
        <StepHeading focusOnChange title="서비스 이용약관이 바뀌었어요" />
        <p className="flow-lead" role="alert">최신 약관을 다시 불러온 뒤 전문을 확인하고 동의해 주세요.</p>
        <div className="signup-actions">
          <button className="signup-cancel" onClick={() => void cancelSignup()} type="button">
            가입 취소
          </button>
          <button className="primary-button" onClick={() => window.location.reload()} type="button">
            최신 약관 다시 불러오기
          </button>
        </div>
      </>
    );
  }

  if (viewState === "error") {
    return (
      <>
        <StepHeading focusOnChange title="가입을 마무리하지 못했어요" />
        <p className="flow-lead signup-age-error" role="alert">{errorMessage}</p>
        <div className="signup-actions single">
          <Link className="primary-button" href="/login">로그인 화면으로 돌아가기</Link>
        </div>
      </>
    );
  }

  const submitting = viewState === "submitting";
  const providerName = provider ? providerLabel(provider) : null;

  return (
    <>
      <StepHeading focusOnChange title="가입 전에 두 가지만 확인해 주세요" />
      <p className="flow-lead">
        {providerName ? `${providerName} 계정` : "계정"} 확인이 끝났어요. 아래 두 항목에 동의하면 가입이 완료돼요.
      </p>
      <div className="signup-notice">
        <strong>만 19세 이상만 가입할 수 있습니다.</strong>
        <p>
          생년월일이나 신분증 정보는 수집하지 않습니다.
          {providerName ? ` ${providerName} 계정은 가입 완료 전까지 임시로만 연결됩니다.` : ""}
        </p>
      </div>
      {errorMessage ? <p className="signup-age-error" role="alert">{errorMessage}</p> : null}
      <fieldset className="signup-checks" disabled={submitting}>
        <legend className="sr-only">가입 확인 항목</legend>
        <div className="signup-check">
          <label className="signup-check-label">
            <input
              checked={isAdultConfirmed}
              className="sr-only signup-check-input"
              onChange={(event) => setIsAdultConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span className="signup-check-box" aria-hidden="true" />
            <span className="signup-check-copy">
              <strong>만 19세 이상입니다</strong>
              <small>만 19세 미만이라면 가입을 취소해 주세요.</small>
            </span>
          </label>
        </div>
        {/* Terms acceptance only comes from agreeing inside the full text, so this row shows the
            state and opens the document instead of offering a checkbox of its own. */}
        <div className={isTermsAccepted ? "signup-check accepted" : "signup-check"}>
          <div className="signup-check-label">
            <span className="signup-check-box" aria-hidden="true" />
            <span className="signup-check-copy">
              <strong>[필수] 서비스 이용약관에 동의합니다</strong>
              <small>전문을 열어 확인한 뒤 동의할 수 있어요.</small>
              <span className="sr-only" role="status" aria-label="서비스 이용약관 동의 상태">
                {isTermsAccepted ? "동의 완료" : "내용 확인 필요"}
              </span>
            </span>
          </div>
          <button
            aria-label="서비스 이용약관 동의 내용 확인"
            className="signup-view"
            onClick={(event) => {
              termsReviewButtonRef.current = event.currentTarget;
              setIsTermsDocumentOpen(true);
            }}
            type="button"
          >
            {isTermsAccepted ? "전문 다시 보기" : "전문 보기"}
          </button>
        </div>
      </fieldset>
      <p className="signup-later">
        AI 타로·사주 리딩을 처음 생성할 때 OpenAI 국외이전 동의를 별도로 요청합니다.
      </p>
      <div className="signup-actions">
        <button
          className="signup-cancel"
          disabled={submitting}
          onClick={() => void cancelSignup()}
          type="button"
        >
          가입 취소
        </button>
        <button
          className="primary-button"
          disabled={submitting || !isAdultConfirmed || !isTermsAccepted}
          onClick={() => void confirmAdultEligibility()}
          type="button"
        >
          동의하고 가입하기
        </button>
      </div>
      {isTermsDocumentOpen ? (
        <ConsentDocumentModal
          documentType="terms"
          onAgree={async () => setIsTermsAccepted(true)}
          onClose={closeTermsDocument}
          returnFocusTo={termsReviewButtonRef.current}
          title="서비스 이용약관 동의"
        />
      ) : null}
    </>
  );
}

async function safeErrorResponse(
  response: Response,
): Promise<{ code: string | null; message: string | null }> {
  try {
    const body = await response.json() as SignupErrorResponse;
    return {
      code: typeof body.code === "string" ? body.code : null,
      message: typeof body.message === "string" ? body.message : null,
    };
  } catch {
    return { code: null, message: null };
  }
}

function providerLabel(provider: string): string {
  if (provider === "kakao") return "카카오";
  if (provider === "google") return "Google";
  return "소셜";
}
