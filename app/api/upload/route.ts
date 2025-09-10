// Iteration 2 hardened upload route
import { NextRequest, NextResponse } from "next/server";
import Busboy from "busboy";
import { Readable } from "node:stream";
import { randomUUID, createHash } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";

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

// Ephemeral duplicate detector (per-process)
const KNOWN_HASHES = new Set<string>();

type FileResult = {
  fieldname: string;
  filename: string;
  mimeType: string;     // from client/form
  sniffedMime?: string; // from magic bytes
  size: number;
  docId: string;
  sha256?: string;
  accepted: boolean;
  isDuplicate?: boolean;
  reasons?: string[];
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
      });

      file.on("end", async () => {
        const result: FileResult = {
          fieldname,
          filename,
          mimeType,
          size,
          docId,
          accepted: true,
          reasons,
        };

        // Finalize hash
        result.sha256 = hash.digest("hex");

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

        files.push(result);
        resolve();
      });

      file.on("error", reject);
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
    service: "upload-api",
    ts: new Date().toISOString(),
  });
}
