// Iteration 2 hardened upload route
import { NextRequest, NextResponse } from "next/server";
import Busboy from "busboy";
import { Readable } from "node:stream";
import { randomUUID, createHash } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

// Config (env overrideable)
const DEFAULT_ALLOWED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_MIME = (process.env.UPLOAD_ALLOWED_MIME ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const ALLOWED = ALLOWED_MIME.length ? ALLOWED_MIME : DEFAULT_ALLOWED;
const MAX_FILE_BYTES = Number(process.env.UPLOAD_MAX_BYTES ?? 25 * 1024 * 1024); // 25MB

const HAVE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// Ephemeral duplicate detector (per-process)
const KNOWN_HASHES = new Set<string>();

type FileResult = {
  fieldname: string;
  filename: string;
  mimeType: string;     // client-provided
  sniffedMime?: string; // magic-bytes
  size: number;
  docId: string;        // stable per upload
  sha256?: string;
  accepted: boolean;
  isDuplicate?: boolean;
  reasons?: string[];
  storage?: {
    provider: "vercel-blob" | "none";
    key?: string;
    url?: string;
  };
};

export async function POST(req: NextRequest) {
  const ctype = req.headers.get("content-type") || "";
  if (!ctype.includes("multipart/form-data")) {
    return NextResponse.json({ ok: false, error: "Expected multipart/form-data" }, { status: 400 });
  }

  const files: FileResult[] = [];
  const fields: Record<string, string> = {};
  const finalizePromises: Promise<void>[] = [];

  const bodyStream = Readable.fromWeb(req.body as any);
  const bb = Busboy({
    headers: { "content-type": ctype },
    limits: { fileSize: MAX_FILE_BYTES },
  });

  bb.on("file", (fieldname: any, file: any, infoOrFilename: any, _enc?: any, _mt?: any) => {
    const docId = randomUUID();
    const reasons: string[] = [];
    let filename: string;
    let mimeType: string;

    if (typeof infoOrFilename === "object" && infoOrFilename) {
      filename = infoOrFilename.filename;
      // @ts-ignore different busboy typings
      mimeType = infoOrFilename.mimeType || infoOrFilename.mimetype || "";
    } else {
      filename = infoOrFilename;
      mimeType = _mt || "";
    }

    let size = 0;
    let oversize = false;

    // For sniffing + hashing
  const HEADER_MAX = 4100;
    let headerLen = 0;
    const headerChunks: Buffer[] = [];
    const hash = createHash("sha256");
  // Optional buffer for storage
  const contentChunks: Buffer[] = [];

  const p = new Promise<void>((resolve, reject) => {
      file.on("limit", () => {
        oversize = true;
        reasons.push(`File exceeds limit of ${MAX_FILE_BYTES} bytes`);
      });

  file.on("data", (chunk: Buffer) => {
        size += chunk.length;
        hash.update(chunk);

        if (headerLen < HEADER_MAX) {
          const remaining = HEADER_MAX - headerLen;
          headerChunks.push(chunk.subarray(0, Math.min(remaining, chunk.length)));
          headerLen += Math.min(remaining, chunk.length);
        }
        if (!oversize && size <= MAX_FILE_BYTES) {
          contentChunks.push(chunk);
        }
      });

      let digested = false;
      const safeDigest = () => {
        if (!digested) {
          try { return hash.digest("hex"); }
          finally { digested = true; }
        }
        return undefined;
      };

      file.once("end", async () => {
        const result: FileResult = {
          fieldname,
          filename,
          mimeType,
          size,
          docId,
          accepted: true,
          reasons,
      storage: { provider: HAVE_BLOB ? "vercel-blob" : "none" }
        };

        // Finalize hash
        result.sha256 = safeDigest();

        // Duplicate detection (best-effort, per-process)
        if (result.sha256) {
          result.isDuplicate = KNOWN_HASHES.has(result.sha256);
          if (result.isDuplicate) reasons.push("Duplicate content (sha256 already seen)");
          KNOWN_HASHES.add(result.sha256);
        }

        // Sniff magic bytes
        try {
          const headerBuf = Buffer.concat(headerChunks);
          const ft = headerBuf.length ? await fileTypeFromBuffer(headerBuf) : undefined;
          if (ft?.mime) {
            result.sniffedMime = ft.mime;
          }
        } catch {
          // ignore sniff errors, rely on client mime
        }

        // Decide acceptance
        const effectiveMime = result.sniffedMime || result.mimeType || "";
        if (!ALLOWED.includes(effectiveMime)) {
          result.accepted = false;
          reasons.push(
            `Disallowed type: ${effectiveMime || "(unknown)"}. Allowed: ${ALLOWED.join(", ")}`
          );
        }
        if (oversize) result.accepted = false;
        if (size === 0) {
          result.accepted = false;
          reasons.push("Empty file");
        }

        // Persist if accepted and token present
        if (result.accepted && HAVE_BLOB) {
          try {
            const key = `uploads/${result.sha256}/${encodeURIComponent(filename)}`;
            const buf = Buffer.concat(contentChunks);
            const putRes = await put(key, buf, {
              access: "public",
              token: process.env.BLOB_READ_WRITE_TOKEN,
              contentType: effectiveMime || "application/octet-stream",
              addRandomSuffix: false,
            });
            result.storage = {
              provider: "vercel-blob",
              key,
              url: (putRes as any)?.url || undefined,
            };
          } catch (e: any) {
            result.accepted = false;
            reasons.push(`Storage error: ${e?.message || "unknown"}`);
          }
        }

        files.push(result);
        try {
          // Structured one-line log (avoid PII beyond filename)
          console.log(JSON.stringify({
            evt: "upload_result",
            docId: result.docId,
            filename: result.filename,
            size: result.size,
            mime: result.mimeType,
            sniffed: result.sniffedMime,
            sha256: result.sha256,
            accepted: result.accepted,
            isDuplicate: result.isDuplicate || false,
            reasons: result.reasons,
            storage: result.storage?.provider,
            ts: new Date().toISOString()
          }));
        } catch {}
        resolve();
      });

      file.once("error", (err: any) => { digested = true; reject(err); });
    });

    finalizePromises.push(p);
  });

  bb.on("field", (name: string, val: string) => {
    fields[name] = val;
  });

  const finished = new Promise<void>((resolve, reject) => {
    bb.on("error", reject);
    bb.on("finish", resolve);
  });

  bodyStream.pipe(bb);
  await finished;
  await Promise.all(finalizePromises);

  return NextResponse.json({
    ok: true,
    count: files.length,
    rejected: files.filter(f => !f.accepted).length,
    files,
    fields,
    limits: { maxBytes: MAX_FILE_BYTES, allowed: ALLOWED },
    storage: { enabled: HAVE_BLOB, provider: HAVE_BLOB ? "vercel-blob" : "none" },
    service: "upload-api",
    ts: new Date().toISOString(),
  });
}
