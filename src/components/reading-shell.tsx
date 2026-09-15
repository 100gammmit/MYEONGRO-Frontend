import Link from "next/link";
import type { ReactNode } from "react";

type Progress =
  | { step: number; totalSteps: number; stepLabel?: undefined }
  | { stepLabel: string; step?: undefined; totalSteps?: undefined };

export function ReadingShell({
  eyebrow,
  title,
  description,
  actions,
  showHomeLink = true,
  form = false,
  children,
  ...progress
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  showHomeLink?: boolean;
  /** Input wizards sit in one reading column with the title aligned to the card's edge. */
  form?: boolean;
  children: ReactNode;
} & Progress) {
  const { step, totalSteps, stepLabel } = progress;
  const label = stepLabel ?? `${step} / ${totalSteps}`;
  const width = stepLabel !== undefined || !step || !totalSteps ? 0 : (step / totalSteps) * 100;

  return (
    <section className={form ? "reading-shell page-width form-shell" : "reading-shell page-width"}>
      {showHomeLink ? (
        <Link href="/" className="back-link">
          ← 홈으로
        </Link>
      ) : null}
      <div className="progress-meta">
        <span>{eyebrow}</span>
        <span>{label}</span>
      </div>
      <div className="progress-track">
        <span style={{ width: `${width}%` }} />
      </div>
      <div className="wizard-heading">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
      {actions ? <div className="reading-actions">{actions}</div> : null}
    </section>
  );
}
