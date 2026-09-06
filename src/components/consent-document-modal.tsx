"use client";

import { useEffect, useRef, useState } from "react";

import {
  ConsentDocumentContent,
  type ConsentDocumentType,
} from "./consent-document-content";

export function ConsentDocumentModal({
  documentType,
  title,
  onAgree,
  onClose,
  returnFocusTo,
}: {
  documentType: ConsentDocumentType;
  title: string;
  onAgree: () => Promise<void>;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!submittingRef.current) onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (document.activeElement === dialogRef.current) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      (returnFocusTo ?? previouslyFocused)?.focus();
    };
  }, [onClose, returnFocusTo]);

  async function agree() {
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await onAgree();
      submittingRef.current = false;
      onClose();
    } catch (agreementError) {
      setError(
        agreementError instanceof Error
          ? agreementError.message
          : "동의를 저장하지 못했어요. 다시 시도해 주세요.",
      );
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div
      className="consent-modal-backdrop"
      onMouseDown={(event) => {
        if (!submitting && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby={`consent-modal-title-${documentType}`}
        aria-modal="true"
        className="consent-modal"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="consent-modal-header">
          <div>
            <p className="eyebrow">REQUIRED AGREEMENT</p>
            <h2 id={`consent-modal-title-${documentType}`}>{title}</h2>
          </div>
          <button
            aria-label={`${title} 닫기`}
            className="consent-modal-close"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="consent-modal-body">
          <ConsentDocumentContent documentType={documentType} headingLevel="h3" />
        </div>
        <div className="consent-modal-feedback">
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </div>
        <footer className="consent-modal-actions">
          <button className="secondary-button" disabled={submitting} onClick={onClose} type="button">
            닫기
          </button>
          <button
            aria-label={`${title} 확인하고 동의`}
            className="primary-button"
            disabled={submitting}
            onClick={() => void agree()}
            type="button"
          >
            {submitting ? "동의 저장 중..." : "확인하고 동의"}
          </button>
        </footer>
      </section>
    </div>
  );
}
