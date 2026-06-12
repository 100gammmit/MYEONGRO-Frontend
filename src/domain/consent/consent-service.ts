export const REQUIRED_CONSENT_DOCUMENTS = [
  "terms",
  "privacy",
  "sensitive-data",
] as const;

export type ConsentDocumentType = typeof REQUIRED_CONSENT_DOCUMENTS[number];
export type ConsentSubjectType = "guest" | "user";
export type ConsentVersions = Record<ConsentDocumentType, string>;

export interface ConsentAcceptance {
  subjectId: string;
  subjectType: ConsentSubjectType;
  documentType: ConsentDocumentType;
  documentVersion: string;
  acceptedAt: string;
}

export interface ConsentStatus {
  acceptedDocumentTypes: ConsentDocumentType[];
  requiredDocumentTypes: ConsentDocumentType[];
  hasAcceptedRequired: boolean;
}

export interface ConsentRepository {
  upsertMany(consents: ConsentAcceptance[]): Promise<ConsentAcceptance[]>;
  findBySubjectAndVersions(
    subjectId: string,
    subjectType: ConsentSubjectType,
    versions: ConsentVersions,
  ): Promise<ConsentAcceptance[]>;
}

export class ConsentService {
  constructor(
    private readonly repository: ConsentRepository,
    private readonly versions: ConsentVersions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async acceptRequired(input: {
    subjectId: string;
    subjectType: ConsentSubjectType;
    acceptedDocumentTypes: ConsentDocumentType[];
  }): Promise<ConsentAcceptance[]> {
    if (!input.subjectId.trim()) throw new Error("Consent subject is required");

    const accepted = new Set(input.acceptedDocumentTypes);
    for (const documentType of REQUIRED_CONSENT_DOCUMENTS) {
      if (!accepted.has(documentType)) {
        throw new Error(`Missing required consent: ${documentType}`);
      }
    }

    const acceptedAt = this.now().toISOString();
    return this.repository.upsertMany(REQUIRED_CONSENT_DOCUMENTS.map((documentType) => ({
      subjectId: input.subjectId,
      subjectType: input.subjectType,
      documentType,
      documentVersion: this.versions[documentType],
      acceptedAt,
    })));
  }

  async getStatus(input: {
    subjectId: string;
    subjectType: ConsentSubjectType;
  }): Promise<ConsentStatus> {
    if (!input.subjectId.trim()) throw new Error("Consent subject is required");

    const accepted = await this.repository.findBySubjectAndVersions(
      input.subjectId,
      input.subjectType,
      this.versions,
    );
    const acceptedDocumentTypes = REQUIRED_CONSENT_DOCUMENTS.filter((documentType) =>
      accepted.some((consent) => consent.documentType === documentType),
    );

    return {
      acceptedDocumentTypes,
      requiredDocumentTypes: [...REQUIRED_CONSENT_DOCUMENTS],
      hasAcceptedRequired: REQUIRED_CONSENT_DOCUMENTS.every((documentType) =>
        acceptedDocumentTypes.includes(documentType),
      ),
    };
  }
}
