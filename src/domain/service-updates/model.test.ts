import {
  defineServiceUpdates,
  findServiceUpdateCorrection,
  getActiveImportantServiceUpdates,
  getPublishedServiceUpdates,
  koreaDateFromInstant,
  type ServiceUpdate,
} from "./model";

function update(overrides: Partial<ServiceUpdate> = {}): ServiceUpdate {
  return {
    id: "2026-10-01-reading-update",
    category: "release",
    noticeLevel: "routine",
    title: "리딩 화면을 개선했어요",
    summary: "결과를 더 편하게 읽을 수 있습니다.",
    changes: ["결과 화면의 읽기 흐름을 정리했습니다."],
    publishedDate: "2026-10-01",
    effectiveDate: "2026-10-01",
    ...overrides,
  };
}

describe("service update registry", () => {
  it("validates identifiers, dates, notice periods, and correction targets", () => {
    expect(() => defineServiceUpdates([
      update(),
      update(),
    ])).toThrow(/Duplicate/);
    expect(() => defineServiceUpdates([
      update({ id: "not anchor safe" }),
    ])).toThrow(/anchor-safe/);
    expect(() => defineServiceUpdates([
      update({ publishedDate: "2026-02-30" }),
    ])).toThrow(/Invalid Korea calendar date/);
    expect(() => defineServiceUpdates([
      update({ effectiveDate: "2026-09-30" }),
    ])).toThrow(/before publication/);
    expect(() => defineServiceUpdates([
      update({ noticeLevel: "general", effectiveDate: "2026-10-07" }),
    ])).toThrow(/at least 7 days/);
    expect(() => defineServiceUpdates([
      update({ noticeLevel: "adverse", effectiveDate: "2026-10-30" }),
    ])).toThrow(/at least 30 days/);
    expect(() => defineServiceUpdates([
      update({ noticeLevel: "emergency" }),
    ])).toThrow(/needs a reason/);
    expect(() => defineServiceUpdates([
      update({
        category: "emergency",
        noticeLevel: "emergency",
        effectiveDate: "2026-10-02",
        emergencyReason: "즉시 조치가 필요했습니다.",
      }),
    ])).toThrow(/effective date/);
    expect(() => defineServiceUpdates([
      update({
        category: "emergency",
        noticeLevel: "routine",
      }),
    ])).toThrow(/category and level must match/);
    expect(() => defineServiceUpdates([
      update({ correctionOf: "missing-update" }),
    ])).toThrow(/target does not exist/);
    expect(() => defineServiceUpdates([
      update({ id: "correction", correctionOf: "original" }),
      update({ id: "original" }),
    ])).toThrow(/must follow its target/);
  });

  it("accepts exact notice boundaries and same-day emergencies", () => {
    expect(() => defineServiceUpdates([
      update({
        id: "2026-10-01-general",
        noticeLevel: "general",
        effectiveDate: "2026-10-08",
      }),
      update({
        id: "2026-10-01-adverse",
        noticeLevel: "adverse",
        effectiveDate: "2026-10-31",
      }),
      update({
        id: "2026-10-01-emergency",
        category: "emergency",
        noticeLevel: "emergency",
        emergencyReason: "외부 서비스 장애로 즉시 조치했습니다.",
      }),
    ])).not.toThrow();
  });

  it("hides unpublished entries and orders upcoming before recent applied entries", () => {
    const updates = defineServiceUpdates([
      update({ id: "future", publishedDate: "2026-11-01", effectiveDate: "2026-11-01" }),
      update({ id: "later", publishedDate: "2026-09-02", effectiveDate: "2026-10-20" }),
      update({ id: "sooner", publishedDate: "2026-09-01", effectiveDate: "2026-10-10" }),
      update({ id: "applied-new", publishedDate: "2026-09-20", effectiveDate: "2026-09-20" }),
      update({ id: "applied-old", publishedDate: "2026-09-10", effectiveDate: "2026-09-10" }),
    ]);

    expect(getPublishedServiceUpdates(updates, "2026-10-01").map(({ id }) => id))
      .toEqual(["sooner", "later", "applied-new", "applied-old"]);
  });

  it("shows important notices through the seventh Korea date after effect", () => {
    const updates = defineServiceUpdates([
      update({
        id: "general",
        category: "policy",
        noticeLevel: "general",
        publishedDate: "2026-12-24",
        effectiveDate: "2026-12-31",
      }),
      update({
        id: "adverse",
        category: "credit",
        noticeLevel: "adverse",
        publishedDate: "2026-12-01",
        effectiveDate: "2026-12-31",
      }),
      update({ id: "routine" }),
    ]);

    expect(getActiveImportantServiceUpdates(updates, "2027-01-07").map(({ id }) => id))
      .toEqual(["adverse", "general"]);
    expect(getActiveImportantServiceUpdates(updates, "2027-01-08")).toEqual([]);
  });

  it("preserves originals and links a later correction", () => {
    const original = update({ id: "original" });
    const correction = update({
      id: "correction",
      publishedDate: "2026-10-02",
      effectiveDate: "2026-10-02",
      correctionOf: original.id,
    });
    const updates = defineServiceUpdates([original, correction]);

    expect(updates).toContain(original);
    expect(findServiceUpdateCorrection(updates, original.id)).toBe(correction);
  });

  it("derives the calendar date in Asia/Seoul", () => {
    expect(koreaDateFromInstant(new Date("2026-12-31T15:00:00.000Z")))
      .toBe("2027-01-01");
  });
});
