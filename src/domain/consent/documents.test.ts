import { describe, expect, it } from "vitest";

import {
  AWS_PROCESSING_DISCLOSURE,
  OPENAI_DOMESTIC_PROCESSING_COUNTRIES,
  OPENAI_OVERSEAS_PROCESSING_COUNTRIES,
  OPENAI_PUBLISHED_PROCESSING_COUNTRIES,
  OPENAI_TRANSFER_SNAPSHOT,
} from "./documents";

describe("AWS processing disclosure", () => {
  it("records the direct processor and separates the Seoul region from dynamic edge processing", () => {
    expect(AWS_PROCESSING_DISCLOSURE.processor).toMatchObject({
      name: "Amazon Web Services Korea LLC",
      contact: "aws-korea-privacy@amazon.com",
    });
    expect(AWS_PROCESSING_DISCLOSURE.primaryProcessingLocation)
      .toContain("서울 리전 ap-northeast-2");
    expect(AWS_PROCESSING_DISCLOSURE.dynamicProcessingLocation)
      .toContain("CloudFront 엣지 로케이션 소재국");
    expect(AWS_PROCESSING_DISCLOSURE.transferItems).toContain("원본 출생정보");
    expect(AWS_PROCESSING_DISCLOSURE.refusalMethod).toContain("계정을 삭제");
    expect(AWS_PROCESSING_DISCLOSURE.refusalEffect).toContain("웹 서비스 전체");
    expect(AWS_PROCESSING_DISCLOSURE.verifiedAt).toBe("2026-10-02");
  });
});

describe("OpenAI transfer snapshot", () => {
  it("keeps the dated official country snapshot complete and separates Korea", () => {
    expect(OPENAI_TRANSFER_SNAPSHOT.sourceUpdatedAt).toBe("2026-07-09");
    expect(OPENAI_TRANSFER_SNAPSHOT.verifiedAt).toBe("2026-09-25");
    expect(OPENAI_PUBLISHED_PROCESSING_COUNTRIES).toEqual(expect.arrayContaining([
      "대한민국", "미국", "영국", "아일랜드", "독일", "프랑스", "스웨덴",
      "핀란드", "노르웨이", "네덜란드", "스위스", "스페인", "이탈리아",
      "폴란드", "캐나다", "멕시코", "브라질", "남아프리카공화국",
      "아랍에미리트", "인도", "싱가포르", "말레이시아", "인도네시아",
      "필리핀", "일본", "호주",
    ]));
    expect(OPENAI_PUBLISHED_PROCESSING_COUNTRIES).toHaveLength(26);
    expect(new Set(OPENAI_PUBLISHED_PROCESSING_COUNTRIES).size).toBe(26);
    expect(OPENAI_DOMESTIC_PROCESSING_COUNTRIES).toEqual(["대한민국"]);
    expect(OPENAI_OVERSEAS_PROCESSING_COUNTRIES).toHaveLength(25);
    expect(OPENAI_OVERSEAS_PROCESSING_COUNTRIES).not.toContain("대한민국");
  });

  it("records every API processor group and the dynamic Cloudflare location", () => {
    const processors = OPENAI_TRANSFER_SNAPSHOT.processorGroups.flatMap((group) =>
      group.processors.map((processor) => processor.name),
    );

    expect(processors).toEqual([
      "OpenAI, LLC",
      "OpenAI Ireland Ltd.",
      "OpenAI UK Ltd.",
      "OpenAI Japan Ltd.",
      "Microsoft Corporation",
      "CoreWeave, Inc.",
      "Oracle Cloud Infrastructure",
      "Google Cloud Platform",
      "Amazon Web Services, Inc.",
      "Cerebras",
      "Snowflake, Inc.",
      "Confluent",
      "TaskUs, LLC",
      "Intercom, Inc.",
      "Salesforce",
      "Pylon Labs",
      "Accenture International Limited",
      "Cinder Technologies, Inc.",
      "Okta, Inc.",
    ]);
    expect(processors).not.toContain("Fivetran, Inc.");
    expect(processors).not.toContain("WorkOS, Inc.");
    expect(processors).not.toContain("Merge API, Inc.");
    expect(OPENAI_TRANSFER_SNAPSHOT.dynamicProcessor).toMatchObject({
      name: "Cloudflare, Ltd.",
      location: "최종 사용자와 가장 가까운 데이터센터 소재국",
    });
  });
});
