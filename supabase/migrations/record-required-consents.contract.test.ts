import fs from "node:fs";
import path from "node:path";

const migrationsDirectory = path.resolve(process.cwd(), "supabase/migrations");
const initialMigration = "20260610120000_initial_persistence.sql";

type MigrationCandidate = {
  file: string;
  sql: string;
};

function selectLatestRecordRequiredConsentsMigration(
  candidates: MigrationCandidate[],
) {
  const matchingCandidates = candidates
    .filter(({ sql }) =>
      /create\s+or\s+replace\s+function\s+public\.record_required_consents\s*\(/i.test(
        sql,
      ),
    )
    .sort((left, right) => left.file.localeCompare(right.file));

  return matchingCandidates[matchingCandidates.length - 1];
}

function loadIncrementalMigration() {
  const migrationCandidates = fs
    .readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith(".sql") && file !== initialMigration)
    .sort()
    .map((file) => ({
      file,
      sql: fs.readFileSync(path.join(migrationsDirectory, file), "utf8"),
    }));

  const migration = selectLatestRecordRequiredConsentsMigration(
    migrationCandidates,
  );

  expect(
    migration,
    "an incremental migration must redefine public.record_required_consents",
  ).toBeDefined();

  return migration!;
}

describe("record_required_consents migration contract", () => {
  it("selects the latest valid record_required_consents migration candidate", () => {
    const migration = selectLatestRecordRequiredConsentsMigration([
      {
        file: "20260611110047_preserve_initial_consent_acceptance.sql",
        sql: "create or replace function public.record_required_consents()",
      },
      {
        file: "20260612120000_preserve_initial_consent_acceptance.sql",
        sql: "create or replace function public.record_required_consents()",
      },
    ]);

    expect(migration?.file).toBe(
      "20260612120000_preserve_initial_consent_acceptance.sql",
    );
  });

  it("preserves the existing function contract and validation", () => {
    const { sql } = loadIncrementalMigration();

    expect(sql).toMatch(
      /public\.record_required_consents\s*\(\s*requested_user_id\s+uuid,\s*requested_guest_session_id\s+uuid,\s*requested_document_types\s+public\.consent_document_type\[\],\s*requested_document_versions\s+text\[\],\s*requested_accepted_at\s+timestamptz\s*\)/is,
    );
    expect(sql).toMatch(/returns\s+void/is);
    expect(sql).toMatch(/language\s+plpgsql/is);
    expect(sql).toMatch(/security\s+definer/is);
    expect(sql).toMatch(/set\s+search_path\s*=\s*public/is);
    expect(sql).toContain("Exactly one consent subject is required");
    expect(sql).toContain("All required consent documents are required");
    expect(sql).toMatch(
      /cardinality\s*\(\s*requested_document_types\s*\)\s*<>\s*3/is,
    );
    expect(sql).toMatch(
      /cardinality\s*\(\s*requested_document_versions\s*\)\s*<>\s*3/is,
    );
    expect(sql).toMatch(
      /requested_document_types\s*@>\s*array\s*\[\s*'terms'\s*,\s*'privacy'\s*,\s*'sensitive-data'\s*\]\s*::\s*public\.consent_document_type\[\]/is,
    );
    expect(sql).toMatch(/for\s+item_index\s+in\s+1\.\.3\s+loop/is);
  });

  it("keeps user and guest inserts while ignoring both conflicts", () => {
    const { sql } = loadIncrementalMigration();

    expect(sql).toMatch(
      /insert\s+into\s+public\.consents\s*\(\s*user_id,\s*document_type,\s*document_version,\s*accepted_at\s*\)\s*values\s*\(\s*requested_user_id,\s*requested_document_types\s*\[\s*item_index\s*\],\s*requested_document_versions\s*\[\s*item_index\s*\],\s*requested_accepted_at\s*\)/is,
    );
    expect(sql).toMatch(
      /on\s+conflict\s*\(\s*user_id,\s*document_type,\s*document_version\s*\)\s*where\s+user_id\s+is\s+not\s+null\s*do\s+nothing/is,
    );
    expect(sql).toMatch(
      /insert\s+into\s+public\.consents\s*\(\s*guest_session_id,\s*document_type,\s*document_version,\s*accepted_at\s*\)\s*values\s*\(\s*requested_guest_session_id,\s*requested_document_types\s*\[\s*item_index\s*\],\s*requested_document_versions\s*\[\s*item_index\s*\],\s*requested_accepted_at\s*\)/is,
    );
    expect(sql).toMatch(
      /on\s+conflict\s*\(\s*guest_session_id,\s*document_type,\s*document_version\s*\)\s*where\s+guest_session_id\s+is\s+not\s+null\s*do\s+nothing/is,
    );
    expect(sql).not.toMatch(/do\s+update/is);
  });

  it("keeps execution restricted to service_role", () => {
    const { sql } = loadIncrementalMigration();
    const signature =
      String.raw`public\.record_required_consents\s*\(\s*uuid,\s*uuid,\s*public\.consent_document_type\[\],\s*text\[\],\s*timestamptz\s*\)`;

    expect(sql).toMatch(
      new RegExp(
        String.raw`revoke\s+all\s+on\s+function\s+${signature}\s+from\s+public`,
        "is",
      ),
    );
    expect(sql).toMatch(
      new RegExp(
        String.raw`grant\s+execute\s+on\s+function\s+${signature}\s+to\s+service_role`,
        "is",
      ),
    );
  });
});
