import Link from "next/link";
import type { ReactNode } from "react";

import { AiGeneratedNotice } from "./ai-generated-notice";

// The top of every reading result: the way back, what kind of reading it is and when, the reading's
// own title, and the AI notice as one quiet line. A finished result shows no progress rule.
export function ReadingResultHeader({
  backHref,
  backLabel,
  meta,
  title,
  children,
}: {
  backHref: string;
  backLabel: string;
  /** Short facts read left to right, such as the reading type, the year and the date. */
  meta: ReadonlyArray<string | null | undefined | false>;
  title: string;
  /** Notices that belong right under the title, such as a changed reading focus. */
  children?: ReactNode;
}) {
  const facts = meta.filter((item): item is string => Boolean(item));
  return (
    <header className="result-header">
      <div className="result-top">
        <Link className="back-link" href={backHref}>
          <span aria-hidden="true">←</span> {backLabel}
        </Link>
        {facts.length ? (
          <p className="result-meta">
            {facts.map((fact) => <span key={fact}>{fact}</span>)}
          </p>
        ) : null}
      </div>
      <h1>{title}</h1>
      <AiGeneratedNotice />
      {children}
    </header>
  );
}
