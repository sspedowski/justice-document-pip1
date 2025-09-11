import { NextResponse } from "next/server";

export const runtime = "nodejs"; // keep node runtime (we shell in local fallback)

// Declare require for TS in ESM context
declare const require: any;

function safeExec(cmd: string): string | null {
  try {
    const { execSync } = require("node:child_process");
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

function envLabel(): "production" | "preview" | "development" {
  const v = process.env.VERCEL_ENV as string | undefined;
  if (v === "production" || v === "preview" || v === "development") return v;
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function cacheHeaders(label: "production" | "preview" | "development", sha: string | null, buildTime: string) {
  const h = new Headers();
  const short = sha ? sha.slice(0, 7) : null;

  // cache strategy: prod=CDN 60s SWR, preview=CDN 30s SWR, dev=no-store
  const sMaxAge = label === "production" ? 60 : label === "preview" ? 30 : 0;
  if (sMaxAge > 0) {
    h.set("Cache-Control", `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=300`);
  } else {
    h.set("Cache-Control", "no-store");
  }

  h.set("ETag", `"${short ?? "na"}-${buildTime}"`);
  if (short) h.set("X-Commit", short);
  h.set("X-Build-Time", buildTime);
  return h;
}

export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || safeExec("git rev-parse HEAD") || null;
  const short = sha ? sha.slice(0, 7) : null;
  const buildTime = process.env.BUILD_TIME || new Date().toISOString();
  const env = envLabel();
  const version = process.env.npm_package_version || null;
  const deployment = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

  const headers = cacheHeaders(env, sha, buildTime);
  return new NextResponse(
    JSON.stringify({ ok: true, sha, short, buildTime, env, version, deployment }),
    { status: 200, headers }
  );
}

export async function HEAD() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || null;
  const buildTime = process.env.BUILD_TIME || new Date().toISOString();
  const headers = cacheHeaders(envLabel(), sha, buildTime);
  return new NextResponse(null, { status: 200, headers });
}
