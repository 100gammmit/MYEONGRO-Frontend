import type { ReadingModeNoticeCopy } from "@/domain/reading/reading-mode";

// Shown before any card or pillar: explains why the reading answers a different focus than the question asked.
export function ReadingModeNotice({ notice }: { notice: ReadingModeNoticeCopy | null }) {
  if (!notice) return null;
  return (
    <div className="reading-mode-notice" role="note">
      <span aria-hidden="true" className="reading-mode-notice-mark">◇</span>
      <div>
        <strong>{notice.headline}</strong>
        <p>{notice.body}</p>
      </div>
    </div>
  );
}
