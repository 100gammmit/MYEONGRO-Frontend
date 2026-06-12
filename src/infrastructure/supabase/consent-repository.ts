import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ConsentAcceptance,
  ConsentRepository,
} from "@/domain/consent/consent-service";

export class SupabaseConsentRepository implements ConsentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsertMany(consents: ConsentAcceptance[]): Promise<ConsentAcceptance[]> {
    if (consents.length === 0) return [];
    const subject = consents[0];
    const { error } = await this.client.rpc("record_required_consents", {
      requested_user_id: subject.subjectType === "user" ? subject.subjectId : null,
      requested_guest_session_id: subject.subjectType === "guest" ? subject.subjectId : null,
      requested_document_types: consents.map((consent) => consent.documentType),
      requested_document_versions: consents.map((consent) => consent.documentVersion),
      requested_accepted_at: subject.acceptedAt,
    });
    if (error) throw new Error(`Failed to record consent: ${error.message}`);

    const versions: Partial<Record<ConsentAcceptance["documentType"], string>> = {};
    for (const consent of consents) {
      versions[consent.documentType] = consent.documentVersion;
    }

    return this.findBySubjectAndVersions(
      subject.subjectId,
      subject.subjectType,
      versions as Record<ConsentAcceptance["documentType"], string>,
    );
  }

  async findBySubjectAndVersions(
    subjectId: string,
    subjectType: "guest" | "user",
    versions: Record<string, string>,
  ): Promise<ConsentAcceptance[]> {
    const documentTypes = Object.keys(versions);
    const subjectColumn = subjectType === "user" ? "user_id" : "guest_session_id";
    const { data, error } = await this.client
      .from("consents")
      .select("document_type, document_version, accepted_at")
      .eq(subjectColumn, subjectId)
      .in("document_type", documentTypes);

    if (error) throw new Error(`Failed to fetch consent status: ${error.message}`);

    return (data ?? []).flatMap((row) => {
      const documentType = row.document_type as ConsentAcceptance["documentType"];
      if (versions[documentType] !== row.document_version) {
        return [];
      }

      return [{
        subjectId,
        subjectType,
        documentType,
        documentVersion: row.document_version,
        acceptedAt: row.accepted_at,
      }];
    });
  }
}
