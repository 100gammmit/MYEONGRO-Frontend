import fs from "node:fs";
import path from "node:path";

const migrationsDirectory = path.resolve(process.cwd(), "supabase/migrations");
const initialMigration = "20260610120000_initial_persistence.sql";

type MigrationCandidate = {
  file: string;
  sql: string;
};

function selectLatestReadingPersistenceMigration(
  candidates: MigrationCandidate[],
) {
  const matchingCandidates = candidates
    .filter(({ sql }) =>
      /create\s+or\s+replace\s+function\s+public\.reserve_free_reading_quota\s*\(/i.test(
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

  const migration = selectLatestReadingPersistenceMigration(
    migrationCandidates,
  );

  expect(
    migration,
    "an incremental migration must define public.reserve_free_reading_quota",
  ).toBeDefined();

  return migration!;
}

describe("reading persistence and free quota migration contract", () => {
  it("selects the latest valid reserve_free_reading_quota migration candidate", () => {
    const migration = selectLatestReadingPersistenceMigration([
      {
        file: "20260611174940_add_reading_persistence_and_free_quotas.sql",
        sql: "create or replace function public.reserve_free_reading_quota()",
      },
      {
        file: "20260612120000_add_reading_persistence_and_free_quotas.sql",
        sql: "create or replace function public.reserve_free_reading_quota()",
      },
    ]);

    expect(migration?.file).toBe(
      "20260612120000_add_reading_persistence_and_free_quotas.sql",
    );
  });

  it("adds soft delete, request idempotency, input hashes, and active-owner indexes to readings", () => {
    const { sql } = loadIncrementalMigration();

    expect(sql).toMatch(
      /alter\s+table\s+public\.readings\s+add\s+column(?:\s+if\s+not\s+exists)?\s+deleted_at\s+timestamptz/is,
    );
    expect(sql).toMatch(
      /alter\s+table\s+public\.readings\s+add\s+column(?:\s+if\s+not\s+exists)?\s+request_id\s+uuid/is,
    );
    expect(sql).toMatch(
      /update\s+public\.readings\s+set\s+request_id\s*=\s*id\s+where\s+request_id\s+is\s+null/is,
    );
    expect(sql).toMatch(
      /alter\s+table\s+public\.readings\s+alter\s+column\s+request_id\s+set\s+default\s+gen_random_uuid\s*\(\s*\)/is,
    );
    expect(sql).toMatch(
      /alter\s+table\s+public\.readings\s+alter\s+column\s+request_id\s+set\s+not\s+null/is,
    );

    expect(sql).toMatch(
      /alter\s+table\s+public\.readings\s+add\s+column(?:\s+if\s+not\s+exists)?\s+input_hash\s+text/is,
    );
    expect(sql).toMatch(
      /update\s+public\.readings\s+set\s+input_hash\s*=\s*encode\s*\(\s*digest\s*\(\s*coalesce\s*\(\s*input::text\s*,\s*'\{\}'::jsonb::text\s*\)\s*,\s*'sha256'\s*\)\s*,\s*'hex'\s*\)\s+where\s+input_hash\s+is\s+null/is,
    );
    expect(sql).toMatch(
      /check\s*\(\s*length\s*\(\s*btrim\s*\(\s*input_hash\s*\)\s*\)\s*>\s*0\s*\)/is,
    );
    expect(sql).not.toMatch(/input_hash\s*=\s*input::text/is);

    expect(sql).toMatch(
      /create\s+unique\s+index\s+\w+\s+on\s+public\.readings\s*\(\s*user_id\s*,\s*request_id\s*\)\s*where\s+user_id\s+is\s+not\s+null/is,
    );
    expect(sql).toMatch(
      /create\s+unique\s+index\s+\w+\s+on\s+public\.readings\s*\(\s*guest_session_id\s*,\s*request_id\s*\)\s*where\s+guest_session_id\s+is\s+not\s+null/is,
    );
    expect(sql).toMatch(
      /create\s+index\s+\w+\s+on\s+public\.readings\s*\(\s*user_id\s*,\s*created_at\s+desc\s*\)\s*where\s+deleted_at\s+is\s+null/is,
    );
    expect(sql).toMatch(
      /create\s+index\s+\w+\s+on\s+public\.readings\s*\(\s*guest_session_id\s*,\s*created_at\s+desc\s*\)\s*where\s+deleted_at\s+is\s+null/is,
    );
  });

  it("creates a hashed free quota event table with owner and reservation key guards", () => {
    const { sql } = loadIncrementalMigration();

    expect(sql).toMatch(
      /create\s+table\s+public\.free_reading_quota_events\s*\(/is,
    );
    expect(sql).toMatch(
      /id\s+uuid\s+primary\s+key\s+default\s+gen_random_uuid\s*\(\s*\)/is,
    );
    expect(sql).toMatch(
      /user_id\s+uuid\s+references\s+public\.profiles\s*\(\s*id\s*\)\s+on\s+delete\s+cascade/is,
    );
    expect(sql).toMatch(/guest_session_id\s+uuid/is);
    expect(sql).toMatch(
      /ip_hash\s+text\s+not\s+null\s+check\s*\(\s*length\s*\(\s*btrim\s*\(\s*ip_hash\s*\)\s*\)\s*>\s*0\s*\)/is,
    );
    expect(sql).toMatch(
      /reading_id\s+uuid\s+references\s+public\.readings\s*\(\s*id\s*\)/is,
    );
    expect(sql).toMatch(/request_id\s+uuid\s+not\s+null/is);
    expect(sql).toMatch(
      /created_at\s+timestamptz\s+not\s+null\s+default\s+now\s*\(\s*\)/is,
    );
    expect(sql).toMatch(
      /constraint\s+\w+\s+check\s*\(\s*\(\s*user_id\s+is\s+not\s+null\s*\)::integer\s*\+\s*\(\s*guest_session_id\s+is\s+not\s+null\s*\)::integer\s*=\s*1\s*\)/is,
    );
    expect(sql).toMatch(
      /create\s+unique\s+index\s+\w+\s+on\s+public\.free_reading_quota_events\s*\(\s*reading_id\s*\)\s*where\s+reading_id\s+is\s+not\s+null/is,
    );
    expect(sql).toMatch(
      /create\s+unique\s+index\s+\w+\s+on\s+public\.free_reading_quota_events\s*\(\s*user_id\s*,\s*request_id\s*\)\s*where\s+user_id\s+is\s+not\s+null\s+and\s+request_id\s+is\s+not\s+null/is,
    );
    expect(sql).toMatch(
      /create\s+unique\s+index\s+\w+\s+on\s+public\.free_reading_quota_events\s*\(\s*guest_session_id\s*,\s*request_id\s*\)\s*where\s+guest_session_id\s+is\s+not\s+null\s+and\s+request_id\s+is\s+not\s+null/is,
    );
    expect(sql).not.toMatch(/\bip_address\b|\braw_ip\b|\binet\b/is);
  });

  it("defines a server-only reserve_free_reading_quota RPC with subject locking, Seoul-day quotas, and idempotent reuse", () => {
    const { sql } = loadIncrementalMigration();
    const signature =
      String.raw`public\.reserve_free_reading_quota\s*\(\s*requested_user_id\s+uuid,\s*requested_guest_session_id\s+uuid,\s*requested_ip_hash\s+text,\s*requested_reading_id\s+uuid,\s*requested_request_id\s+uuid\s*\)`;

    expect(sql).toMatch(new RegExp(signature, "is"));
    expect(sql).toMatch(/returns\s+table/is);
    expect(sql).toMatch(/language\s+plpgsql/is);
    expect(sql).toMatch(/security\s+definer/is);
    expect(sql).toMatch(/set\s+search_path\s*=\s*pg_catalog/is);
    expect(sql).toContain("Exactly one quota subject is required");
    expect(sql).toContain("Exactly one reservation key is required");
    expect(sql).toContain("IP hash is required");
    expect(sql).toMatch(
      /select\s+readings\.request_id\s+into\s+\w+\s+from\s+public\.readings\s+where\s+readings\.id\s*=\s*requested_reading_id/is,
    );
    expect(sql).toMatch(
      /pg_advisory_xact_lock\s*\(\s*hashtextextended\s*\(\s*coalesce\s*\(\s*'user:'\s*\|\|\s*requested_user_id::text\s*,\s*'guest:'\s*\|\|\s*requested_guest_session_id::text\s*\)\s*,\s*0\s*\)\s*\)/is,
    );
    expect(sql).toMatch(
      /if\s+requested_guest_session_id\s+is\s+not\s+null\s+then\s+perform\s+pg_advisory_xact_lock\s*\(\s*hashtextextended\s*\(\s*'ip:'\s*\|\|\s*normalized_ip_hash/is,
    );
    expect(sql).toMatch(
      /from\s+public\.free_reading_quota_events\s+where\s*\(\s*\(\s*\w+\.reading_id\s*=\s*requested_reading_id\s*\)\s+or\s*\(\s*\(\s*requested_user_id\s+is\s+not\s+null/is,
    );
    expect(sql).toMatch(
      /return\s+query\s+select[\s\S]*true/is,
    );
    expect(sql).toMatch(
      /created_at\s*>=\s*statement_timestamp\s*\(\s*\)\s*-\s*interval\s*'1\s+hour'/is,
    );
    expect(sql).toMatch(
      /where\s*\(\s*free_reading_quota_events\.guest_session_id\s*=\s*requested_guest_session_id\s+or\s+free_reading_quota_events\.ip_hash\s*=\s*normalized_ip_hash\s*\)/is,
    );
    expect(sql).toMatch(
      /guest_hourly_count\s*>=\s*3/is,
    );
    expect(sql).toMatch(
      /timezone\s*\(\s*'Asia\/Seoul'\s*,\s*created_at\s*\)::date\s*=\s*timezone\s*\(\s*'Asia\/Seoul'\s*,\s*statement_timestamp\s*\(\s*\)\s*\)::date/is,
    );
    expect(sql).toMatch(
      /guest_daily_count\s*>=\s*5/is,
    );
    expect(sql).toMatch(
      /user_daily_count\s*>=\s*10/is,
    );
    expect(sql).toMatch(
      /insert\s+into\s+public\.free_reading_quota_events\s*\(\s*user_id\s*,\s*guest_session_id\s*,\s*ip_hash\s*,\s*reading_id\s*,\s*request_id\s*\)/is,
    );
    expect(sql).toMatch(
      /raise\s+exception\s+'FREE_READING_QUOTA_EXCEEDED'\s+using\s+errcode\s*=\s*'RL101'/is,
    );
    expect(sql).toMatch(
      /raise\s+exception\s+'FREE_READING_QUOTA_EXCEEDED'\s+using\s+errcode\s*=\s*'RL102'/is,
    );
    expect(sql).toMatch(
      /raise\s+exception\s+'FREE_READING_QUOTA_EXCEEDED'\s+using\s+errcode\s*=\s*'RL103'/is,
    );
  });

  it("backfills profiles and makes server-owned persistence inaccessible to browser roles", () => {
    const { sql } = loadIncrementalMigration();
    const signature =
      String.raw`public\.reserve_free_reading_quota\s*\(\s*uuid,\s*uuid,\s*text,\s*uuid,\s*uuid\s*\)`;

    expect(sql).toMatch(
      /insert\s+into\s+public\.profiles\s*\(\s*id\s*,\s*display_name\s*\)\s*select\s+users\.id\s*,\s*coalesce\s*\(\s*users\.raw_user_meta_data\s*->>\s*'name'\s*,\s*users\.raw_user_meta_data\s*->>\s*'full_name'\s*\)\s*from\s+auth\.users\s+as\s+users\s+on\s+conflict\s*\(\s*id\s*\)\s*do\s+nothing/is,
    );
    expect(sql).toMatch(
      /alter\s+table\s+public\.free_reading_quota_events\s+enable\s+row\s+level\s+security/is,
    );
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+table\s+public\.free_reading_quota_events\s+from\s+public/is,
    );
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+table\s+public\.free_reading_quota_events\s+from\s+anon/is,
    );
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+table\s+public\.free_reading_quota_events\s+from\s+authenticated/is,
    );
    expect(sql).toMatch(
      /grant\s+select\s*,\s*insert\s+on\s+table\s+public\.free_reading_quota_events\s+to\s+service_role/is,
    );
    for (const role of ["public", "anon", "authenticated"]) {
      expect(sql).toMatch(
        new RegExp(
          String.raw`revoke\s+all\s+on\s+table\s+public\.generation_records\s+from\s+${role}`,
          "is",
        ),
      );
      expect(sql).toMatch(
        new RegExp(
          String.raw`revoke\s+insert\s*,\s*update\s*,\s*delete\s+on\s+table\s+public\.readings\s+from\s+${role}`,
          "is",
        ),
      );
    }
    expect(sql).toMatch(
      /grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+table\s+public\.generation_records\s+to\s+service_role/is,
    );
    expect(sql).toMatch(
      /grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+table\s+public\.readings\s+to\s+service_role/is,
    );
    expect(sql).toMatch(
      /drop\s+policy(?:\s+if\s+exists)?\s+readings_delete_own\s+on\s+public\.readings/is,
    );
    expect(sql).toMatch(
      /drop\s+policy(?:\s+if\s+exists)?\s+readings_select_own\s+on\s+public\.readings/is,
    );
    expect(sql).toMatch(
      /create\s+policy\s+readings_select_own\s+on\s+public\.readings\s+for\s+select\s+using\s*\(\s*user_id\s*=\s*auth\.uid\s*\(\s*\)\s+and\s+deleted_at\s+is\s+null\s*\)/is,
    );
    expect(sql).toMatch(
      /drop\s+policy(?:\s+if\s+exists)?\s+readings_update_own\s+on\s+public\.readings/is,
    );
    expect(sql).not.toMatch(
      /create\s+policy\s+readings_(?:insert|update|delete)_own/is,
    );
    expect(sql).toMatch(
      /drop\s+policy(?:\s+if\s+exists)?\s+generation_records_select_own\s+on\s+public\.generation_records/is,
    );
    expect(sql).toMatch(
      /revoke\s+create\s+on\s+schema\s+public\s+from\s+public/is,
    );
    expect(sql).toMatch(
      /revoke\s+create\s+on\s+schema\s+public\s+from\s+anon/is,
    );
    expect(sql).toMatch(
      /revoke\s+create\s+on\s+schema\s+public\s+from\s+authenticated/is,
    );
    expect(sql).toMatch(
      new RegExp(
        String.raw`revoke\s+all\s+on\s+function\s+${signature}\s+from\s+public`,
        "is",
      ),
    );
    expect(sql).toMatch(
      new RegExp(
        String.raw`revoke\s+all\s+on\s+function\s+${signature}\s+from\s+anon`,
        "is",
      ),
    );
    expect(sql).toMatch(
      new RegExp(
        String.raw`revoke\s+all\s+on\s+function\s+${signature}\s+from\s+authenticated`,
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

  it("defines atomic server-only reading creation and generation transition RPCs", () => {
    const { sql } = loadIncrementalMigration();

    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.create_pending_free_reading\s*\(/is,
    );
    expect(sql).toMatch(
      /perform\s+\*\s+from\s+public\.reserve_free_reading_quota\s*\(/is,
    );
    expect(sql).toMatch(
      /insert\s+into\s+public\.readings[\s\S]*insert\s+into\s+public\.generation_records/is,
    );
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.complete_free_reading_generation\s*\(/is,
    );
    expect(sql).toMatch(
      /update\s+public\.generation_records[\s\S]*status\s*=\s*'completed'[\s\S]*update\s+public\.readings[\s\S]*status\s*=\s*'completed'/is,
    );
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.fail_free_reading_generation\s*\(/is,
    );
    expect(sql).toMatch(
      /update\s+public\.generation_records[\s\S]*status\s*=\s*'failed'[\s\S]*update\s+public\.readings[\s\S]*status\s*=\s*'failed'/is,
    );
    for (const functionName of [
      "create_pending_free_reading",
      "complete_free_reading_generation",
      "fail_free_reading_generation",
    ]) {
      expect(sql).toMatch(
        new RegExp(
          String.raw`revoke\s+all\s+on\s+function\s+public\.${functionName}\s*\([\s\S]*?\)\s+from\s+authenticated`,
          "is",
        ),
      );
      expect(sql).toMatch(
        new RegExp(
          String.raw`grant\s+execute\s+on\s+function\s+public\.${functionName}\s*\([\s\S]*?\)\s+to\s+service_role`,
          "is",
        ),
      );
    }
  });
});
