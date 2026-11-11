import Link from "next/link";
import type { ReactNode } from "react";

import { StepHeading } from "./step-heading";

type Progress =
  | { step: number; totalSteps: number; stepLabel?: undefined }
  | { stepLabel: string; step?: undefined; totalSteps?: undefined }
  | { step?: undefined; totalSteps?: undefined; stepLabel?: undefined };

export type ReadingShellBack =
  | { href: string; label: string }
  | { onClick: () => void; label: string; disabled?: boolean };

// One frame for every reading step, tarot and saju alike: the way back on the left, the reading's
// name and step count on the right, a progress rule, then a left-aligned title.
export function ReadingShell({
  eyebrow,
  title,
  description,
  actions,
  back = { href: "/", label: "홈" },
  focusOnChange = true,
  children,
  ...progress
}: {
  /** The reading's name, shown beside the step count. */
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: ReadingShellBack | null;
  /** Off when the step moves focus itself, as the daily card does to its result heading. */
  focusOnChange?: boolean;
  children: ReactNode;
} & Progress) {
  const { step, totalSteps, stepLabel } = progress;
  const counted = Boolean(step && totalSteps);
  const label = stepLabel ?? (counted ? `${step} / ${totalSteps}` : null);
  const width = counted && step && totalSteps ? (step / totalSteps) * 100 : 0;

  return (
    <section className="reading-shell page-width">
      <div className="step-top">
        {back === null ? <span /> : "href" in back ? (
          <Link className="back-link" href={back.href}>
            <span aria-hidden="true">←</span> {back.label}
          </Link>
        ) : (
          <button className="back-link" disabled={back.disabled} onClick={back.onClick} type="button">
            <span aria-hidden="true">←</span> {back.label}
          </button>
        )}
        <p className="step-meta">
          <span className="step-flow">{eyebrow}</span>
          {label ? <span>{label}</span> : null}
        </p>
      </div>
      {counted ? (
        <div className="progress-track">
          <span style={{ width: `${width}%` }} />
        </div>
      ) : null}
      <div className="wizard-heading">
        <StepHeading focusOnChange={focusOnChange} title={title} />
        {description ? <p>{description}</p> : null}
      </div>
      {children}
      {actions ? <div className="reading-actions">{actions}</div> : null}
    </section>
  );
}
