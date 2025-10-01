#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const roots = ["./dashboard", "./justice-dashboard"];
const cwd = roots
  .map((p) => resolve(process.cwd(), p))
  .find((dir) => existsSync(dir));

if (!cwd) {
  process.exit(0);
}

const pkgPath = join(cwd, "package.json");
if (!existsSync(pkgPath)) {
  process.exit(0);
}

try {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const hasVitest = Boolean(
    (pkg.devDependencies && pkg.devDependencies.vitest) ||
      (pkg.dependencies && pkg.dependencies.vitest)
  );
  if (!hasVitest) {
    process.exit(0);
  }
} catch (error) {
  console.warn("[run-vitest-changed] Unable to determine Vitest availability:", error);
  // continue; we'll try to run and surface any real failure
}

try {
  execSync("npx vitest --changed", {
    cwd,
    stdio: "inherit",
    shell: true,
  });
} catch (error) {
  const status = typeof error.status === "number" ? error.status : 1;
  process.exit(status);
}
