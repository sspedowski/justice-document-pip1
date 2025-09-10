import http from "node:http";
import request from "supertest";
import { startNextServer } from "./helpers/start-next";

jest.mock("@vercel/blob", () => ({
  put: jest.fn(async (key: string) => ({ url: `https://blob.vercel-storage.com/${key}` }))
}));

let server: http.Server;

beforeAll(async () => {
  process.env.UPLOAD_MAX_BYTES = "1048576"; // 1MB
  process.env.UPLOAD_ALLOWED_MIME = "application/pdf,image/png";
  process.env.BLOB_READ_WRITE_TOKEN = "test-token";
  const started = await startNextServer();
  server = started.server;
}, 30000);

afterAll(async () => {
  await new Promise<void>((res) => server.close(() => res()));
  jest.resetAllMocks();
});

test("persists accepted file to blob and returns storage info", async () => {
  const res = await request(server)
    .post("/api/upload")
    .attach("doc", Buffer.from("%PDF-1.4\n% hello"), {
      filename: "persist.pdf",
      contentType: "application/pdf",
    });

  expect(res.status).toBe(200);
  const f = res.body.files[0];
  expect(f.accepted).toBe(true);
  expect(f.storage.provider).toBe("vercel-blob");
  expect(f.storage.key).toMatch(/^uploads\/[0-9a-f]{64}\/persist\.pdf$/i);
  expect(f.storage.url).toMatch(/^https:\/\/blob\.vercel-storage\.com\/uploads\//);
}, 20000);
