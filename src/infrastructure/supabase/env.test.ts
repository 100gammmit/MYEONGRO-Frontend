import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("Supabase environment variables", () => {
  it("uses static NEXT_PUBLIC references so Next.js can inline them in the browser", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/infrastructure/supabase/env.ts"),
      "utf8",
    );

    expect(source).toContain("process.env.NEXT_PUBLIC_SUPABASE_URL");
    expect(source).toContain("process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });
});
