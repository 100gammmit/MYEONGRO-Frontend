"use client";

import { useRef, useState } from "react";

const DELETE_ERROR = "계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.";

export function AccountDeleteButton() {
  const [message, setMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const pendingRef = useRef(false);

  async function deleteAccount() {
    if (
      pendingRef.current ||
      !window.confirm(
        "저장한 리딩과 계정을 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.",
      )
    ) {
      return;
    }

    pendingRef.current = true;
    setIsDeleting(true);
    setMessage("");

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (response.ok) {
        window.location.assign("/");
        return;
      }
      setMessage(DELETE_ERROR);
    } catch {
      setMessage(DELETE_ERROR);
    } finally {
      pendingRef.current = false;
      setIsDeleting(false);
    }
  }

  return (
    <div className="danger-zone">
      <h2>계정과 데이터 삭제</h2>
      <p>회원 탈퇴 시 저장한 리딩과 계정 데이터를 삭제합니다.</p>
      <button type="button" onClick={deleteAccount} disabled={isDeleting}>
        {isDeleting ? "삭제 중..." : "회원 탈퇴"}
      </button>
      {message ? (
        <p className="form-error" role="alert" aria-live="assertive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
