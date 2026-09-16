import {
  readingModeHeadline,
  readingModeNotice,
  type ReadingMode,
} from "@/domain/reading/reading-mode";

// Shown before any card or pillar: a redirected reading answers a changed focus, not the original question.
export function ReadingModeNotice({
  mode,
  visible = true,
  body: bodyOverride,
}: {
  mode: ReadingMode;
  visible?: boolean;
  body?: string | null;
}) {
  const headline = readingModeHeadline(mode);
  const body = bodyOverride === undefined ? readingModeNotice(mode) : bodyOverride;
  if (!visible || !headline || !body) return null;
  return (
    <div className="reading-mode-notice" role="note">
      <span aria-hidden="true" className="reading-mode-notice-mark">◇</span>
      <div>
        <strong>{headline}</strong>
        <p>{body}</p>
      </div>
    </div>
  );
}
