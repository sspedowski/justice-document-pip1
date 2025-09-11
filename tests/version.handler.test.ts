import { GET, HEAD } from "../app/api/version/route";

describe("/api/version", () => {
  beforeAll(() => {
    process.env.BUILD_TIME = "2025-01-01T00:00:00.000Z";
    process.env.VERCEL_ENV = "development";
    process.env.npm_package_version = "0.1.0";
  });

  it("returns version metadata", async () => {
    const res: any = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(["production", "preview", "development"]).toContain(json.env);
    expect(json.buildTime).toBe("2025-01-01T00:00:00.000Z");
  });

  it("sets cache headers and ETag", async () => {
    const head: any = await HEAD();
    const cc = head.headers.get("cache-control") || "";
    const etag = head.headers.get("etag") || "";
    expect(cc).toMatch(/no-store|s-maxage=\d+/);
    expect(etag).toMatch(/^".*\"-2025-01-01T00:00:00.000Z"$/);
  });
});

