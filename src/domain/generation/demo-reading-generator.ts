import type {
  ReadingGenerationInput,
  ReadingGenerationOutput,
  ReadingGenerator,
} from "./contracts";

export class DemoReadingGenerator implements ReadingGenerator {
  async generate(input: ReadingGenerationInput): Promise<ReadingGenerationOutput> {
    const subject = input.kind === "tarot" ? "타로" : "사주";

    return {
      title: `${subject} 간단 데모 리딩`,
      summary:
        "현재의 선택지를 차분히 살피고, 통제할 수 있는 작은 행동부터 시작해 보세요.",
      sections: [
        {
          heading: "현재의 흐름",
          body: `${input.question}에 관한 상징을 자기성찰의 관점에서 살펴보는 데모 결과입니다.`,
        },
        {
          heading: "균형 있게 볼 점",
          body: "한 가지 해석을 확정된 미래로 받아들이기보다 현실의 정보와 함께 판단해 보세요.",
        },
      ],
      guidance: [
        "오늘 실행할 수 있는 가장 작은 한 가지를 적어 보세요.",
        "중요한 결정은 신뢰할 수 있는 정보와 전문가의 조언을 함께 확인하세요.",
      ],
      disclaimer:
        "이 리딩은 오락과 자기성찰을 위한 참고 자료이며 전문적인 조언을 대신하지 않습니다.",
    };
  }
}
