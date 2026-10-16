import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import test from "node:test";
import os from "node:os";
import path from "node:path";
import { listPostFiles } from "./post-files.mjs";

test("discovers sorted nested Markdown posts and excludes drafts and unrelated files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wal-katha-posts-"));
  try {
    await mkdir(path.join(root, "nested"), { recursive: true });
    for (const name of ["article.md", "nested/chapter.MDX", "nested/ending.mdx", "-draft.md", "nested/-draft.mdx", "notes.txt"]) {
      const file = path.join(root, name);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, "test", "utf8");
    }
    assert.deepEqual(await listPostFiles(root), ["article.md", path.join("nested", "chapter.MDX"), path.join("nested", "ending.mdx")]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
