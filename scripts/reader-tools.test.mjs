import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("reader-tools auto-scroll proof passes against the shipped component", () => {
  const result = spawnSync(
    process.execPath,
    [
      "scripts/verify-autoscroll.cjs",
      "src/layouts/components/reader-tools.js",
    ],
    { cwd: repoRoot, encoding: "utf8" },
  );

  assert.ifError(result.error);
  assert.equal(
    result.status,
    0,
    [result.stdout, result.stderr].filter(Boolean).join("\n"),
  );
  assert.match(result.stdout, /RESULT: ALL CHECKS PASSED/);
});
