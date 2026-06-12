import { describe, expect, it } from "vitest";

import {
  ConsentService,
  type ConsentAcceptance,
  type ConsentRepository,
} from "./consent-service";

class MemoryConsentRepository implements ConsentRepository {
  saved: ConsentAcceptance[] = [];

  async upsertMany(consents: ConsentAcceptance[]) {
    this.saved = consents;
    return consents;
  }

  async findBySubjectAndVersions(
    subjectId: string,
    subjectType: "guest" | "user",
    versions: Record<string, string>,
  ) {
    return this.saved.filter((consent) =>
      consent.subjectId === subjectId
      && consent.subjectType === subjectType
      && versions[consent.documentType] === consent.documentVersion,
    );
  }
}

describe("ConsentService", () => {
  it("records all three required documents with their configured versions", async () => {
    const repository = new MemoryConsentRepository();
    const service = new ConsentService(repository, {
      terms: "2026-06-10",
      privacy: "2026-06-10",
      "sensitive-data": "2026-06-10",
    }, () => new Date("2026-06-10T12:00:00.000Z"));

    const result = await service.acceptRequired({
      subjectId: "user-1",
      subjectType: "user",
      acceptedDocumentTypes: ["terms", "privacy", "sensitive-data"],
    });

    expect(result).toEqual(repository.saved);
    expect(result.map(({ documentType, documentVersion, acceptedAt }) => ({
      documentType,
      documentVersion,
      acceptedAt,
    }))).toEqual([
      {
        documentType: "terms",
        documentVersion: "2026-06-10",
        acceptedAt: "2026-06-10T12:00:00.000Z",
      },
      {
        documentType: "privacy",
        documentVersion: "2026-06-10",
        acceptedAt: "2026-06-10T12:00:00.000Z",
      },
      {
        documentType: "sensitive-data",
        documentVersion: "2026-06-10",
        acceptedAt: "2026-06-10T12:00:00.000Z",
      },
    ]);
  });

  it("rejects acceptance when any required document is missing", async () => {
    const service = new ConsentService(new MemoryConsentRepository(), {
      terms: "1",
      privacy: "1",
      "sensitive-data": "1",
    });

    await expect(service.acceptRequired({
      subjectId: "guest-1",
      subjectType: "guest",
      acceptedDocumentTypes: ["terms", "privacy"],
    })).rejects.toThrow("Missing required consent: sensitive-data");
  });

  it("returns status only for the current document versions", async () => {
    const repository = new MemoryConsentRepository();
    repository.saved = [
      {
        subjectId: "guest-1",
        subjectType: "guest",
        documentType: "terms",
        documentVersion: "current",
        acceptedAt: "2026-06-10T00:00:00.000Z",
      },
      {
        subjectId: "guest-1",
        subjectType: "guest",
        documentType: "privacy",
        documentVersion: "outdated",
        acceptedAt: "2026-06-10T00:00:00.000Z",
      },
    ];
    const service = new ConsentService(repository, {
      terms: "current",
      privacy: "current",
      "sensitive-data": "current",
    });

    await expect(service.getStatus({
      subjectId: "guest-1",
      subjectType: "guest",
    })).resolves.toEqual({
      acceptedDocumentTypes: ["terms"],
      requiredDocumentTypes: ["terms", "privacy", "sensitive-data"],
      hasAcceptedRequired: false,
    });
  });
});
