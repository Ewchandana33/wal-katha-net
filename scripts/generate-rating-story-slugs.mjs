import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listPostFiles } from "./post-files.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsDirectory = path.join(repoRoot, "src/content/posts");
const outputPath = path.join(
  repoRoot,
  "functions/_shared/published-story-slugs.generated.js",
);

const files = await listPostFiles(postsDirectory);
const slugs = [];

for (const file of files) {
  const source = await readFile(path.join(postsDirectory, file), "utf8");
  const frontmatter = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || "";

  // Keep this allowlist consistent with getSinglePage(): private files and
  // drafts must not be rateable, even if their URL is guessed.
  if (/^[ \t]*draft[ \t]*:[ \t]*true[ \t]*(?:#.*)?$/m.test(frontmatter)) continue;

  const slug = file.replaceAll(path.sep, "/").replace(/\.mdx?$/i, "");
  if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(slug)) {
    throw new Error(`Unsupported published story slug: ${slug}`);
  }
  slugs.push(slug);
}

if (slugs.length === 0) {
  throw new Error("No published stories found; refusing to generate an empty rating allowlist.");
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `// Generated from published Astro posts. Do not edit by hand.\nexport const PUBLISHED_STORY_SLUGS = new Set(${JSON.stringify(slugs)});\n`,
  "utf8",
);

console.log(`Generated rating allowlist for ${slugs.length} published stories.`);
