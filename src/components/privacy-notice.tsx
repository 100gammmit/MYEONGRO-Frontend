import type { ReactNode } from "react";

// The notice under a question box: the rule leads in one line, the detail follows. It sits outside
// the field's label so a screen reader names the field by its label alone and reads this as its
// description.
export function PrivacyNotice({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="privacy-notice" id={id}>
      <strong>개인정보는 제외하고 상황만 작성해 주세요.</strong>
      <p>{children}</p>
    </div>
  );
}
