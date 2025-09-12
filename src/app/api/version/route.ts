import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getGitSha() {
  return process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_SHA ?? null;
}

function getName() {
  return process.env.APP_NAME ?? 'justice-dashboard';
}

function getVersion() {
  return process.env.APP_VERSION ?? '0.0.0';
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: getName(),
    version: getVersion(),
    gitSha: getGitSha(),
    at: new Date().toISOString(),
    service: process.env.APP_SERVICE_NAME ?? 'justice-dashboard-main',
  });
}
