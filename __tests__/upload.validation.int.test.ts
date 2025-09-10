import http from "node:http";
import path from "node:path";
import next from "next";
import request from "supertest";

let app: any;
let server: http.Server;

beforeAll(async () => {
  process.env.UPLOAD_MAX_BYTES = "64"; // 64 bytes for oversize test
  process.env.UPLOAD_ALLOWED_MIME = "application/pdf,image/png";

  app = next({ dev: true, dir: path.join(__dirname, "..") });
  await app.prepare();
  const handle = app.getRequestHandler();
  server = http.createServer((req, res) => handle(req, res));
  await new Promise<void>((res) => server.listen(0, res));
}, 30000);

afterAll(async () => {
  await new Promise<void>((res) => server.close(() => res()));
});

const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test("accepts PDF with docId + sha256", async () => {
  const res = await request(server)
    .post("/api/upload")
    .field("note", "trial")
    .attach("doc", Buffer.from("%PDF-1.4\n%"), {
      filename: "a.pdf",
      contentType: "application/pdf",
    });

  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
  const f = res.body.files[0];
  expect(res.body.count).toBe(1);
  expect(f.docId && uuidLike.test(f.docId)).toBe(true);
  expect(typeof f.sha256).toBe("string");
  expect(f.accepted).toBe(true);
  expect(f.sniffedMime).toBe("application/pdf");
  expect(res.body.fields).toEqual({ note: "trial" });
}, 20000);

test("disallows unknown type", async () => {
  const res = await request(server)
    .post("/api/upload")
    .attach("doc", Buffer.from("MZ\x90\x00..."), {
      filename: "bad.exe",
      contentType: "application/octet-stream",
    });

  expect(res.status).toBe(200);
  const f = res.body.files[0];
  expect(f.accepted).toBe(false);
  expect((f.reasons || []).join(" ")).toMatch(/Disallowed type/i);
}, 20000);

test("marks duplicate content within same run", async () => {
  const buf = Buffer.from("%PDF-1.4\n%");
  const res = await request(server)
    .post("/api/upload")
    .attach("doc", buf, { filename: "dup1.pdf", contentType: "application/pdf" })
    .attach("doc", buf, { filename: "dup2.pdf", contentType: "application/pdf" });

  expect(res.status).toBe(200);
  const [a, b] = res.body.files;
  expect(a.isDuplicate).toBe(false);
  expect(b.isDuplicate).toBe(true);
}, 20000);

test("rejects oversize", async () => {
  const big = Buffer.alloc(1024, 1); // 1 KB > 64B limit set above
  const res = await request(server)
    .post("/api/upload")
    .attach("doc", big, { filename: "big.pdf", contentType: "application/pdf" });

  expect(res.status).toBe(200);
  const f = res.body.files[0];
  expect(f.accepted).toBe(false);
  expect((f.reasons || []).join(" ")).toMatch(/exceeds limit/i);
}, 20000);
