import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260613190000_add_reading_record_actions.sql",
  ),
  "utf8",
);

describe("reading record actions migration", () => {
  it("starts retries only for an active failed reading owned by the user", () => {
    expect(migration).toMatch(
      /where readings\.id = requested_reading_id[\s\S]*readings\.user_id = requested_user_id[\s\S]*readings\.status = 'failed'[\s\S]*readings\.deleted_at is null/is,
    );
    expect(migration).toMatch(/for update/is);
  });

  it("creates a new generation and atomically returns the reading to generating", () => {
    expect(migration).toMatch(/insert into public\.generation_records/is);
    expect(migration).toMatch(
      /update public\.readings[\s\S]*set status = 'generating'/is,
    );
  });

  it("allows only the service role to execute the retry function", () => {
    expect(migration).toMatch(
      /revoke all on function public\.start_failed_reading_retry[\s\S]*from authenticated/is,
    );
    expect(migration).toMatch(
      /grant execute on function public\.start_failed_reading_retry[\s\S]*to service_role/is,
    );
  });
});
