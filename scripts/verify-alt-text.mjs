#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { isAcceptableCoverAlt, readFrontmatterScalar } from "./alt-text-policy.mjs";
const postsDir = path.join(process.cwd(), "src", "content", "posts");
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---/;
async function listPostFiles(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) return listPostFiles(directory, child);
    if (entry.isFile() && /\.mdx?$/i.test(entry.name) && !entry.name.startsWith("-")) return [child];
    return [];
  }));
  return nested.flat().sort();
}

const files = await listPostFiles(postsDir);
const errors = [];
let covers = 0;
for (const name of files) {
  const content = await readFile(path.join(postsDir, name), "utf8");
  const match = content.match(frontmatterPattern);
  if (!match) continue;
  const frontmatter = match[1];
  if (!readFrontmatterScalar(frontmatter, "image")) continue;
  covers++;
  const title = readFrontmatterScalar(frontmatter, "title");
  const alt = readFrontmatterScalar(frontmatter, "image_alt");
  if (!isAcceptableCoverAlt(alt, title)) errors.push(name + ": missing or unsafe cover alt text");
}
if (covers === 0) errors.push("No cover images found.");
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log("Verified safe, non-empty cover alt text on " + covers + " post(s).");
