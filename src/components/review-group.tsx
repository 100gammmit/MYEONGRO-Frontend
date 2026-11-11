import type { ReactNode } from "react";

// A confirm step's group of answers with its own way back to change them. Shared by the tarot and
// saju confirm steps so both read the same before credits are spent.
export function ReviewGroup({
  id,
  title,
  editLabel = "고치기",
  onEdit,
  disabled,
  children,
}: {
  id: string;
  title: string;
  editLabel?: string;
  onEdit: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <section className="saju-review-group" aria-labelledby={id}>
      <div className="saju-review-head">
        <h2 id={id}>{title}</h2>
        <button
          aria-label={`${title} ${editLabel}`}
          className="saju-review-edit"
          disabled={disabled}
          onClick={onEdit}
          type="button"
        >{editLabel}</button>
      </div>
      {children}
    </section>
  );
}
