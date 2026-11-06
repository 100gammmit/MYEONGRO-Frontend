// @vitest-environment node
import nextConfig from "../../next.config";

describe("public page redirects", () => {
  it("permanently redirects the old reading-method URL to the single about page", async () => {
    const config = nextConfig("phase-development-server");
    expect(await config.redirects?.()).toContainEqual({
      source: "/about/reading", destination: "/about", permanent: true,
    });
  });
});
