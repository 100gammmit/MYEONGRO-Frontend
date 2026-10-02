import type { ReactNode } from "react";

// Shared body of the not-found and error screens; each screen supplies its own actions.
export function StatusPanel({
  eyebrow,
  title,
  heading,
  description,
  alert = false,
  children,
}: {
  eyebrow: string;
  title: string;
  heading: string;
  description: string;
  alert?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="simple-page page-width">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <div className="empty-state" role={alert ? "alert" : undefined}>
        <span aria-hidden="true">◇</span>
        <h2>{heading}</h2>
        <p>{description}</p>
        <div className="result-actions">{children}</div>
      </div>
    </section>
  );
}
