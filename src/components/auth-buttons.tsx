"use client";

import { useState } from "react";
import { normalizeNextPath } from "@/infrastructure/auth/next-path";
import { createBrowserSupabaseClient } from "@/infrastructure/supabase/browser-client";

export function AuthButtons({ next }: { next?: string }) {
  const [error, setError] = useState("");

  async function signIn() {
    setError("");
    try {
      const supabase = createBrowserSupabaseClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", normalizeNextPath(next));

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: callbackUrl.toString() },
      });
      if (authError) setError(authError.message);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "로그인 설정을 확인해 주세요.",
      );
    }
  }

  return (
    <>
      <button type="button" className="social-button kakao" onClick={signIn}>
        카카오로 계속하기
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </>
  );
}
