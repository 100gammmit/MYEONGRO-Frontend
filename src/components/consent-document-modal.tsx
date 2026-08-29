"use client";

import { useEffect, useRef } from "react";

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
  onAgree: () => void;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}) {
  const dialogRef = useRef<HTMLElement>(null);

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
        onClose();
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

  return (
    <div
      className="consent-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
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
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="consent-modal-body">
          <ConsentDocumentContent documentType={documentType} headingLevel="h3" />
        </div>
        <footer className="consent-modal-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            닫기
          </button>
          <button
            aria-label={`${title} 확인하고 동의`}
            className="primary-button"
            onClick={onAgree}
            type="button"
          >
            확인하고 동의
          </button>
        </footer>
      </section>
    </div>
  );
}
