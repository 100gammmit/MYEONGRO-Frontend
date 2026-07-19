"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type BoundaryStatus = "checking" | "authenticated" | "redirecting" | "error";

export function AuthenticatedPageBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<BoundaryStatus>("checking");

  const verifySession = useCallback(async (refreshOnSuccess = false) => {
    setStatus("checking");
    try {
      const response = await fetch("/api/me", { credentials: "same-origin" });
      if (response.status === 401) {
        setStatus("redirecting");
        redirectToLogin((href) => router.push(href));
        return;
      }
      if (!response.ok) {
        setStatus("error");
        return;
      }

      const payload = await response.json() as { authenticated?: unknown };
      if (payload.authenticated === true) {
        setStatus("authenticated");
        if (refreshOnSuccess) router.refresh();
        return;
      }
      if (payload.authenticated === false) {
        setStatus("redirecting");
        redirectToLogin((href) => router.push(href));
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }, [router]);

  useEffect(() => {
    void verifySession();
  }, [verifySession]);

  if (status === "checking" || status === "redirecting") return null;

  if (status === "error") {
    return (
      <section className="simple-page page-width">
        <div className="wizard-card" role="alert">
          <h1>페이지를 불러오지 못했어요</h1>
          <p>잠시 후 다시 시도해 주세요.</p>
          <button className="secondary-button narrow-button" onClick={() => void verifySession(true)} type="button">
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  return children;
}

function redirectToLogin(push: (href: string) => void) {
  const nextPath = `${window.location.pathname}${window.location.search}`;
  push(`/login?next=${encodeURIComponent(nextPath)}`);
}
