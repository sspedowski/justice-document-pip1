#!/usr/bin/env node
import { existsSync, rmSync } from "node:fs";

const mjsPath = "next.config.mjs";
const tsPath = "next.config.ts";

// Prefer .mjs; ensure we don't have conflicting .ts
if (existsSync(tsPath)) {
  try {
    rmSync(tsPath);
    console.log("[prepare-next-config] Removed next.config.ts; using next.config.mjs");
  } catch (e) {
    const reason = e && e.message ? e.message : e;
    console.warn("[prepare-next-config] Could not remove next.config.ts:", reason);
  }
} else if (existsSync(mjsPath)) {
  console.log("[prepare-next-config] Using existing next.config.mjs");
} else {
  console.log("[prepare-next-config] No Next config found; Next will use defaults");
}
