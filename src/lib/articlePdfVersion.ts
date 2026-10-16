import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

type ArticlePdfVersionInput = {
  title: string;
  body: string;
  coverImagePath: string;
  coverImageAlt: string;
  publishedDate?: string;
  sourceUrl: string;
};

// Keep this allowlist in sync with articlePdf.ts: only local post-cover assets
// are accepted; remote URLs and arbitrary filesystem paths are rejected.
const COVER_IMAGE_PATH = /^\/images\/posts\/[A-Za-z0-9._-]+\.(?:avif|jpe?g|png|webp)$/i;
const PDF_RENDER_INPUT_FILES = [
  "src/lib/articlePdf.ts",
  "src/pages/downloads/[slug].pdf.ts",
  "src/assets/fonts/NotoSansSinhala-VF.ttf",
  "package.json",
  "yarn.lock",
];

/**
 * Produce a stable cache key from the exact PDF content and renderer inputs.
 * The article page uses this SHA-256 as a query version so a long-lived cached
 * copy can never shadow a changed story, cover image, renderer, or font.
 */
export function getArticlePdfVersion(input: ArticlePdfVersionInput): string {
  if (!COVER_IMAGE_PATH.test(input.coverImagePath)) {
    throw new Error("Article PDF cache version requires a local /images/posts cover asset.");
  }

  const projectRoot = process.cwd();
  const postsRoot = resolve(projectRoot, "public/images/posts");
  const coverPath = resolve(projectRoot, "public", input.coverImagePath.slice(1));
  if (!coverPath.startsWith(postsRoot + sep)) {
    throw new Error("Article PDF cover path escapes the post image directory.");
  }

  const hash = createHash("sha256");
  hash.update(JSON.stringify(input));
  hash.update(readFileSync(coverPath));
  for (const sourceFile of PDF_RENDER_INPUT_FILES) {
    hash.update(readFileSync(resolve(projectRoot, sourceFile)));
  }
  return hash.digest("hex");
}
