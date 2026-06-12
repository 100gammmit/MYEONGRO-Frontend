import fs from "node:fs";
import path from "node:path";

const migrationsDirectory = path.resolve(process.cwd(), "supabase/migrations");
const initialMigration = "20260610120000_initial_persistence.sql";

type MigrationCandidate = {
  file: string;
  sql: string;
};

function selectLatestTransferGuestOwnershipMigration(
  candidates: MigrationCandidate[],
) {
  const matchingCandidates = candidates
    .filter(({ sql }) =>
      /create\s+or\s+replace\s+function\s+public\.transfer_guest_ownership\s*\(/i.test(
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

  const migration = selectLatestTransferGuestOwnershipMigration(
    migrationCandidates,
  );

  expect(
    migration,
    "an incremental migration must redefine public.transfer_guest_ownership",
  ).toBeDefined();

  return migration!;
}

function loadAllIncrementalMigrations() {
  return fs
    .readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith(".sql") && file !== initialMigration)
    .sort()
    .map((file) => fs.readFileSync(path.join(migrationsDirectory, file), "utf8"))
    .join("\n");
}

describe("transfer_guest_ownership migration contract", () => {
  it("selects the latest valid transfer_guest_ownership migration candidate", () => {
    const migration = selectLatestTransferGuestOwnershipMigration([
      {
        file: "20260612120000_secure_guest_ownership_transfer.sql",
        sql: "create or replace function public.transfer_guest_ownership()",
      },
      {
        file: "20260612121000_secure_guest_ownership_transfer.sql",
        sql: "create or replace function public.transfer_guest_ownership()",
      },
    ]);

    expect(migration?.file).toBe(
      "20260612121000_secure_guest_ownership_transfer.sql",
    );
  });

  it("redefines the function with the service-role-only signature and no auth.uid dependency", () => {
    const { sql } = loadIncrementalMigration();

    expect(sql).toMatch(
      /public\.transfer_guest_ownership\s*\(\s*requested_guest_session_id\s+uuid,\s*requested_user_id\s+uuid\s*\)/is,
    );
    expect(sql).toMatch(/returns\s+table/is);
    expect(sql).toMatch(/language\s+plpgsql/is);
    expect(sql).toMatch(/security\s+definer/is);
    expect(sql).toMatch(/set\s+search_path\s*=\s*pg_catalog/is);
    expect(sql).not.toMatch(/auth\.uid\s*\(/i);
    expect(sql).toMatch(
      /pg_advisory_xact_lock\s*\(\s*hashtextextended\s*\(\s*requested_guest_session_id::text\s*,\s*0\s*\)\s*\)/is,
    );
    expect(sql).toMatch(
      /if\s+prior\.user_id\s*<>\s*requested_user_id\s+then\s+raise\s+exception\s+'Guest session was transferred to another user'/is,
    );
  });

  it("keeps readings transfer and merges consent conflicts by earliest timestamps before deleting guest rows", () => {
    const { sql } = loadIncrementalMigration();

    expect(sql).toMatch(
      /update\s+public\.readings\s+set\s+user_id\s*=\s*requested_user_id\s*,\s*guest_session_id\s*=\s*null\s+where\s+readings\.guest_session_id\s*=\s*requested_guest_session_id\s+and\s+readings\.user_id\s+is\s+null/is,
    );
    expect(sql).toMatch(
      /insert\s+into\s+public\.consents\s*\(\s*user_id,\s*document_type,\s*document_version,\s*accepted_at,\s*created_at\s*\)\s*select\s+requested_user_id\s*,\s*document_type\s*,\s*document_version\s*,\s*accepted_at\s*,\s*created_at\s+from\s+public\.consents\s+where\s+consents\.guest_session_id\s*=\s*requested_guest_session_id/is,
    );
    expect(sql).toMatch(
      /on\s+conflict\s*\(\s*user_id,\s*document_type,\s*document_version\s*\)\s*where\s+user_id\s+is\s+not\s+null\s*do\s+update\s+set\s+accepted_at\s*=\s*least\s*\(\s*public\.consents\.accepted_at\s*,\s*excluded\.accepted_at\s*\)\s*,\s*created_at\s*=\s*least\s*\(\s*public\.consents\.created_at\s*,\s*excluded\.created_at\s*\)/is,
    );
    expect(sql).toMatch(
      /delete\s+from\s+public\.consents\s+where\s+consents\.guest_session_id\s*=\s*requested_guest_session_id/is,
    );
  });

  it("moves guest quota events to the authenticated owner", () => {
    const { sql } = loadIncrementalMigration();

    expect(sql).toMatch(
      /update\s+public\.free_reading_quota_events[\s\S]*set\s+user_id\s*=\s*requested_user_id\s*,\s*guest_session_id\s*=\s*null[\s\S]*guest_session_id\s*=\s*requested_guest_session_id/is,
    );
  });

  it("restricts both legacy and new execute permissions to service_role only", () => {
    const { sql } = loadIncrementalMigration();
    const allSql = loadAllIncrementalMigrations();
    const newSignature = String.raw`public\.transfer_guest_ownership\s*\(\s*uuid\s*,\s*uuid\s*\)`;
    const legacySignature = String.raw`public\.transfer_guest_ownership\s*\(\s*uuid\s*\)`;

    expect(allSql).toMatch(
      new RegExp(
        String.raw`revoke\s+all\s+on\s+function\s+${legacySignature}\s+from\s+public`,
        "is",
      ),
    );
    expect(sql).toMatch(
      new RegExp(
        String.raw`revoke\s+all\s+on\s+function\s+${newSignature}\s+from\s+public`,
        "is",
      ),
    );
    expect(sql).toMatch(
      new RegExp(
        String.raw`revoke\s+all\s+on\s+function\s+${newSignature}\s+from\s+anon`,
        "is",
      ),
    );
    expect(sql).toMatch(
      new RegExp(
        String.raw`revoke\s+all\s+on\s+function\s+${newSignature}\s+from\s+authenticated`,
        "is",
      ),
    );
    expect(sql).toMatch(
      new RegExp(
        String.raw`grant\s+execute\s+on\s+function\s+${newSignature}\s+to\s+service_role`,
        "is",
      ),
    );
    expect(sql).not.toMatch(
      new RegExp(
        String.raw`grant\s+execute\s+on\s+function\s+${newSignature}\s+to\s+(public|anon|authenticated)`,
        "is",
      ),
    );
    expect(allSql).not.toMatch(
      new RegExp(
        String.raw`grant\s+execute\s+on\s+function\s+${legacySignature}\s+to\s+\w+`,
        "is",
      ),
    );
  });
});
