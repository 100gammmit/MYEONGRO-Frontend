import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const filePath = path.join(directory, entry);
    if (statSync(filePath).isDirectory()) {
      return listSourceFiles(filePath);
    }
    return [filePath];
  });
}

describe("Spring auth boundary", () => {
  it("keeps removed Supabase Auth routes and clients out of the frontend runtime", () => {
    expect(existsSync(path.join(sourceRoot, "app/auth/callback"))).toBe(false);
    expect(existsSync(path.join(sourceRoot, "app/api/account"))).toBe(false);
    expect(existsSync(path.join(sourceRoot, "infrastructure/supabase"))).toBe(false);

    const packageJson = JSON.parse(
      readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };

    expect(packageJson.dependencies).not.toHaveProperty("@supabase/ssr");
    expect(packageJson.dependencies).not.toHaveProperty("@supabase/supabase-js");

    const forbiddenFragments = [
      "@supabase/",
      "@/infrastructure/supabase",
      "exchangeCodeForSession",
      "clearSupabaseAuthCookies",
      "/api/account",
    ];
    const files = listSourceFiles(sourceRoot)
      .filter((filePath) => filePath !== __filename);

    for (const filePath of files) {
      const source = readFileSync(filePath, "utf8");
      for (const fragment of forbiddenFragments) {
        expect(source, `${path.relative(projectRoot, filePath)} contains ${fragment}`)
          .not.toContain(fragment);
      }
    }
  });
});
