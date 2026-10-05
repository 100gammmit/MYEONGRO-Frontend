import { readFileSync, readdirSync, statSync } from "node:fs";
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

describe("Spring backend boundary", () => {
  // OpenAI keys and calls belong to the Spring backend; the frontend bundle must never carry them.
  it("keeps the OpenAI SDK and API key out of the frontend runtime", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(projectRoot, "package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };

    expect(packageJson.dependencies).not.toHaveProperty("openai");

    const forbiddenFragments = ["OPENAI_API_KEY", "from \"openai\""];
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
