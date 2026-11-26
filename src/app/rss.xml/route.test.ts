// @vitest-environment node
import { GET } from "./route";

describe("GET /rss.xml", () => {
  it("serves the published notices as RSS", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8");
    const body = await response.text();
    expect(body).toContain("<title>명로 업데이트 소식</title>");
    expect(body).toContain("<link>https://www.myeongro.com/zodiac</link>");
  });
});
