import { readdir } from "node:fs/promises";
import path from "node:path";

export async function listPostFiles(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) return listPostFiles(directory, child);
    if (entry.isFile() && /\.mdx?$/i.test(entry.name) && !entry.name.startsWith("-")) return [child];
    return [];
  }));
  return nested.flat().sort();
}
