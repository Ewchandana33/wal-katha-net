import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import test from "node:test";
import os from "node:os";
import path from "node:path";
import { recordAiChange } from "./ai-changelog.mjs";

function datedEntry(date, title, detail = "historical detail") {
  return "## " + date + " — " + title + "\n\n- " + detail;
}

test("prepends new changelog entries and archives the oldest while preserving the index", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wal-katha-changelog-"));
  try {
    await mkdir(path.join(root, "archive"), { recursive: true });
    const archivedEntries = Array.from({ length: 25 }, (_, index) => datedEntry("2026-09-" + String(1 + Math.floor(index / 3)).padStart(2, "0"), "Prior " + index));
    const archivePath = path.join(root, "archive", "AI_CHANGELOG-2026-Q3.md");
    await writeFile(archivePath, "# Archived AI Change Log — 2026 Q3\n\nCoverage: 2026-09-01 through 2026-09-09; 25 dated entries.\n\n" + archivedEntries.join("\n\n") + "\n", "utf8");
    const activePath = path.join(root, "AI_CHANGELOG.md");
    const currentEntries = [16, 15, 14, 13, 12].map((day, index) => datedEntry("2026-09-" + String(day).padStart(2, "0"), "Active " + index));
    const active = "# AI Change Log\n\n## Archive index\n\n- archive/AI_CHANGELOG-2026-Q3.md — 25 earlier dated entries from 2026-09-01 through 2026-09-09; dated sections are retained verbatim.\n\n## Recent entries\n\n" + currentEntries.join("\n\n") + "\n";
    await writeFile(activePath, active, "utf8");
    const entry = datedEntry("2026-09-17", "Automated regression fix", "CI verified");
    assert.equal(await recordAiChange(activePath, entry), true);
    const updated = await readFile(activePath, "utf8");
    const recent = updated.slice(updated.indexOf("## Recent entries"));
    const activeHeadings = recent.match(/^## \d{4}-\d{2}-\d{2} — .*$/gm) || [];
    assert.equal(activeHeadings.length, 5);
    assert.match(activeHeadings[0], /2026-09-17/);
    assert.doesNotMatch(recent, /2026-09-12 — Active 4/);
    const archived = await readFile(archivePath, "utf8");
    assert.equal((archived.match(/^## \d{4}-\d{2}-\d{2} — .*$/gm) || []).length, 26);
    assert.match(archived, /2026-09-12 — Active 4/);
    assert.match(archived, /Coverage: 2026-09-01 through 2026-09-12; 26 dated entries\./);
    assert.match(updated, /26 earlier dated entries from 2026-09-01 through 2026-09-12/);
    assert.equal(await recordAiChange(activePath, entry), false);
    assert.equal((await readFile(archivePath, "utf8")).match(/^## \d{4}-\d{2}-\d{2} — .*$/gm).length, 26);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
