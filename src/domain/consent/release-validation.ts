import {
  AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION,
  PRIVACY_DOCUMENT_VERSION,
  TERMS_DOCUMENT_VERSION,
} from "./documents";
import { LEGAL_METADATA } from "./legal-metadata";

type ReleaseLegalConfiguration = {
  legalMetadata: Readonly<Record<string, string>>;
  documentVersions: readonly string[];
};

const CURRENT_CONFIGURATION: ReleaseLegalConfiguration = {
  legalMetadata: LEGAL_METADATA,
  documentVersions: [
    TERMS_DOCUMENT_VERSION,
    PRIVACY_DOCUMENT_VERSION,
    AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION,
  ],
};

export function assertReleaseLegalConfiguration(
  configuration: ReleaseLegalConfiguration = CURRENT_CONFIGURATION,
) {
  const placeholders = Object.entries(configuration.legalMetadata)
    .filter(([, value]) => value.trim() === "" || /^\[.+\]$/.test(value))
    .map(([key]) => key);
  const draftVersions = configuration.documentVersions.filter(
    (version) => version.trim() === "" || version.startsWith("draft-"),
  );

  if (placeholders.length === 0 && draftVersions.length === 0) {
    return;
  }

  throw new Error(
    [
      "Production legal configuration is incomplete.",
      placeholders.length > 0
        ? `Replace placeholders in src/domain/consent/legal-metadata.ts: ${placeholders.join(", ")}.`
        : null,
      draftVersions.length > 0
        ? "Replace draft consent versions in src/domain/consent/documents.ts."
        : null,
    ]
      .filter(Boolean)
      .join(" "),
  );
}
