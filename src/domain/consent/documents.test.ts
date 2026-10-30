import { describe, expect, it } from "vitest";

import {
  AWS_PROCESSING_DISCLOSURE,
  OPENAI_DOMESTIC_PROCESSING_COUNTRIES,
  OPENAI_OVERSEAS_PROCESSING_COUNTRIES,
  OPENAI_PUBLISHED_PROCESSING_COUNTRIES,
  OPENAI_TRANSFER_SNAPSHOT,
  PRIVACY_INQUIRY_EMAIL_PROCESSING,
  PRIVACY_DOCUMENT_EFFECTIVE_DATE,
  PRIVACY_DOCUMENT_VERSION,
} from "./documents";

describe("privacy inquiry email processing", () => {
  it("records the Workspace contracting entity and direct mail path", () => {
    expect(Object.keys(PRIVACY_INQUIRY_EMAIL_PROCESSING.processors)).toEqual(["google"]);
    expect(PRIVACY_INQUIRY_EMAIL_PROCESSING.processors.google).toMatchObject({
      name: "Google Asia Pacific Pte. Ltd.",
      address: "70 Pasir Panjang Road, #03-71, Mapletree Business City II Singapore 117371",
      contactUrl: "https://support.google.com/a/contact/googlecloud_dpr",
    });
    expect(PRIVACY_INQUIRY_EMAIL_PROCESSING.processors.google.country).toContain("싱가포르");
    expect(PRIVACY_INQUIRY_EMAIL_PROCESSING.method).toContain("직접 수신·저장·회신");
    expect(PRIVACY_INQUIRY_EMAIL_PROCESSING.items).toContain("메일 인증 및 전달 정보");
    expect(PRIVACY_INQUIRY_EMAIL_PROCESSING.operatorRetention)
      .toContain("완료한 날부터 최대 30일 이내");
    expect(PRIVACY_INQUIRY_EMAIL_PROCESSING.refusalEffect)
      .toContain("이메일을 통한 문의·권리행사");
    expect(PRIVACY_INQUIRY_EMAIL_PROCESSING.verifiedAt).toBe("2026-10-06");
    expect(PRIVACY_DOCUMENT_VERSION).toBe("2026-10-31");
    expect(PRIVACY_DOCUMENT_EFFECTIVE_DATE).toBe("2026-10-31");
  });

  it("separates the operator deadline, administrator recovery and CDPA deletion instruction", () => {
    const { retention, sourceUrls } = PRIVACY_INQUIRY_EMAIL_PROCESSING.processors.google;
    expect(retention).toContain("최대 25일의 관리자 복구 가능 기간");
    expect(retention).toContain("고객이 복구할 수 없는 상태의 삭제 지시 후");
    expect(retention).toContain("최대 180일 이내");
    expect(retention).toContain("법령상 보존 예외");
    expect(retention).toContain("통상적인 운영 목적으로 복구하지 않음");
    expect(sourceUrls.cdpa).toBe("https://cloud.google.com/terms/data-processing-addendum");
    expect(sourceUrls.subprocessors).toBe("https://workspace.google.com/intl/en/terms/subprocessors/");
    expect(sourceUrls.recovery).toBe("https://workspace.google.com/learn-more/security/security-whitepaper/data-recovery/");
  });

  it("keeps dated processing-country groups and their conditional access boundaries", () => {
    const { processingRoles, sourceUpdatedAt } = PRIVACY_INQUIRY_EMAIL_PROCESSING;
    expect(sourceUpdatedAt).toBe("2026-07-23");
    expect(processingRoles.map((entry) => entry.id))
      .toEqual(["data-centers", "maintenance", "support", "security"]);
    expect(processingRoles.map((entry) => entry.countries.length)).toEqual([14, 26, 33, 3]);
    for (const entry of processingRoles) {
      expect(new Set(entry.countries).size).toBe(entry.countries.length);
    }
    expect(processingRoles[0].countries).toEqual(expect.arrayContaining(["독일", "영국"]));
    expect(processingRoles[0].countries).not.toContain("우루과이");
    expect(processingRoles[1].countries).toContain("대한민국");
    expect(processingRoles[2].countries).toEqual(expect.arrayContaining(["대한민국", "콜롬비아", "엘살바도르"]));
    expect(processingRoles[2].condition).toContain("명시적으로 허용");
    expect(processingRoles[3].countries).toEqual(["인도", "필리핀", "미국"]);
    expect(processingRoles[3].condition).toContain("의심스러운 검색어");
  });
});

describe("AWS processing disclosure", () => {
  it("records the direct processor and separates the Seoul region from dynamic edge processing", () => {
    expect(AWS_PROCESSING_DISCLOSURE.processor).toMatchObject({
      name: "Amazon Web Services Korea LLC",
      contact: "aws-korea-privacy@amazon.com",
    });
    expect(AWS_PROCESSING_DISCLOSURE.primaryProcessingLocation)
      .toContain("서울 리전 ap-northeast-2");
    expect(AWS_PROCESSING_DISCLOSURE.primaryProcessingLocation)
      .toContain("Front 서버(Amplify)");
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
    expect(OPENAI_TRANSFER_SNAPSHOT.dynamicProcessor).toMatchObject({
      name: "Cloudflare, Ltd.",
      location: "최종 사용자와 가장 가까운 데이터센터 소재국",
    });
  });
});
