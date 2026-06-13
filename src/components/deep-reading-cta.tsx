export function DeepReadingCta({ kind }: { kind: "tarot" | "saju" }) {
  return (
    <button
      type="button"
      className="primary-button"
      disabled
    >
      심층 {kind === "tarot" ? "리딩" : "사주"} 준비 중
    </button>
  );
}
