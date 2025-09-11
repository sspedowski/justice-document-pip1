import { NextResponse } from "next/server";
import { execSync } from "node:child_process";

export const runtime = "nodejs";

function safeExec(cmd: string): string | null {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

export async function GET() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    safeExec("git rev-parse HEAD") ||
    null;

  const short = sha ? sha.slice(0, 7) : null;
  const buildTime = process.env.BUILD_TIME || new Date().toISOString();
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";
  const version = process.env.npm_package_version || null;

  return NextResponse.json({ ok: true, sha, short, buildTime, env, version });
}

