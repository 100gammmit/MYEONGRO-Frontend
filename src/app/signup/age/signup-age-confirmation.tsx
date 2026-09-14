"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { normalizeNextPath } from "@/infrastructure/auth/next-path";

type ViewState = "loading" | "ready" | "submitting" | "expired" | "error";

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
  message?: unknown;
}

export function SignupAgeConfirmation() {
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [provider, setProvider] = useState<string | null>(null);
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    if (!isAdultConfirmed || viewState !== "ready") return;
    setViewState("submitting");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) {
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
        const body = await safeErrorBody(response);
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
    return <p role="status">가입 상태를 확인하고 있어요.</p>;
  }

  if (viewState === "expired") {
    return (
      <div className="adult-eligibility-result" role="status">
        <strong>가입 대기 시간이 만료되었어요.</strong>
        <p>소셜 로그인을 다시 시작해 주세요.</p>
        <Link className="primary-button adult-eligibility-button" href="/login">
          로그인 화면으로 돌아가기
        </Link>
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="adult-eligibility-result">
        <strong>가입을 안전하게 마무리하지 못했어요.</strong>
        <p className="signup-age-error" role="alert">{errorMessage}</p>
        <Link className="primary-button adult-eligibility-button" href="/login">
          로그인 화면으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="adult-eligibility" aria-labelledby="adult-eligibility-title">
      <div className="adult-eligibility-copy">
        <strong id="adult-eligibility-title">만 19세 이상만 가입할 수 있습니다</strong>
        <p>
          생년월일이나 신분증 정보는 수집하지 않습니다.
          {provider ? ` ${providerLabel(provider)} 계정은 가입 완료 전까지 임시로만 연결됩니다.` : ""}
        </p>
      </div>
      {errorMessage ? <p className="signup-age-error" role="alert">{errorMessage}</p> : null}
      <label className="adult-eligibility-check">
        <input
          checked={isAdultConfirmed}
          className="sr-only adult-eligibility-check-input"
          disabled={viewState === "submitting"}
          onChange={(event) => setIsAdultConfirmed(event.target.checked)}
          type="checkbox"
        />
        <span className="adult-eligibility-check-control" aria-hidden="true" />
        <span className="adult-eligibility-check-copy">
          <strong>만 19세 이상임을 확인합니다</strong>
          <small>만 19세 미만이라면 가입을 취소해 주세요.</small>
        </span>
      </label>
      <button
        className="primary-button adult-eligibility-button"
        disabled={viewState === "submitting" || !isAdultConfirmed}
        onClick={() => void confirmAdultEligibility()}
        type="button"
      >
        확인하고 가입하기
      </button>
      <button
        className="secondary-button adult-eligibility-button"
        disabled={viewState === "submitting"}
        onClick={() => void cancelSignup()}
        type="button"
      >
        가입 취소
      </button>
    </div>
  );
}

async function safeErrorBody(response: Response): Promise<string | null> {
  try {
    const body = await response.json() as SignupErrorResponse;
    return typeof body.message === "string" ? body.message : null;
  } catch {
    return null;
  }
}

function providerLabel(provider: string): string {
  if (provider === "kakao") return "카카오";
  if (provider === "google") return "Google";
  return "소셜";
}
