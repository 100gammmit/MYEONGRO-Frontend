import Link from "next/link";

export function ReadingShell({
  eyebrow,
  title,
  description,
  step,
  totalSteps,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  step: number;
  totalSteps: number;
  children: React.ReactNode;
}) {
  return (
    <section className="reading-shell page-width">
      <Link href="/" className="back-link">
        ← 홈으로
      </Link>
      <div className="progress-meta">
        <span>{eyebrow}</span>
        <span>
          {step} / {totalSteps}
        </span>
      </div>
      <div className="progress-track">
        <span style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>
      <div className="wizard-heading">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
