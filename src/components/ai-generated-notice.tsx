export const AI_GENERATED_NOTICE = "이 결과는 생성형 AI를 활용해 생성되었습니다.";

export function AiGeneratedNotice() {
  return (
    <p aria-label="생성형 AI 사용 안내" className="ai-generated-notice">
      {AI_GENERATED_NOTICE}
    </p>
  );
}
