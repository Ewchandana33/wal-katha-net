import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const distDirectory = path.resolve("dist");
const homePagePath = path.join(distDirectory, "index.html");
const blogDirectory = path.join(distDirectory, "blog");
const siteConfig = JSON.parse(readFileSync("src/config/config.json", "utf8"));
const siteOrigin = new URL(siteConfig.site.base_url).origin;
const failures = [];

function collectHtmlFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
  });
}

function getAttribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(
    new RegExp(`\\b${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
  );
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function metaTagsFor(head, attributeName, expectedValue) {
  return [...head.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => getAttribute(tag, attributeName)?.toLowerCase() === expectedValue);
}

function getPngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function getWebpDimensions(buffer) {
  if (
    buffer.length < 30 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }

  const readUint24LE = (offset) =>
    buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);

  for (let chunkOffset = 12; chunkOffset + 8 <= buffer.length; ) {
    const chunkType = buffer.toString("ascii", chunkOffset, chunkOffset + 4);
    const chunkSize = buffer.readUInt32LE(chunkOffset + 4);
    const dataOffset = chunkOffset + 8;

    if (chunkType === "VP8X" && chunkSize >= 10) {
      return {
        width: 1 + readUint24LE(dataOffset + 4),
        height: 1 + readUint24LE(dataOffset + 7),
      };
    }

    if (chunkType === "VP8L" && chunkSize >= 5 && buffer[dataOffset] === 0x2f) {
      const b1 = buffer[dataOffset + 1];
      const b2 = buffer[dataOffset + 2];
      const b3 = buffer[dataOffset + 3];
      const b4 = buffer[dataOffset + 4];
      return {
        width: 1 + (((b2 & 0x3f) << 8) | b1),
        height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
      };
    }

    if (chunkType === "VP8 " && chunkSize >= 10) {
      const frameOffset = dataOffset + 3;
      if (
        buffer[frameOffset] === 0x9d &&
        buffer[frameOffset + 1] === 0x01 &&
        buffer[frameOffset + 2] === 0x2a
      ) {
        return {
          width: buffer.readUInt16LE(frameOffset + 3) & 0x3fff,
          height: buffer.readUInt16LE(frameOffset + 5) & 0x3fff,
        };
      }
    }

    chunkOffset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return null;
}

function getImageDimensions(filePath) {
  const image = readFileSync(filePath);
  return getPngDimensions(image) ?? getWebpDimensions(image);
}

function addPage(filePath, label, isArticle) {
  if (!existsSync(filePath)) {
    failures.push(`${label}: generated HTML file is missing.`);
    return;
  }

  const html = readFileSync(filePath, "utf8");
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  if (!head) {
    failures.push(`${label}: <head> was not generated.`);
    return;
  }

  const ogImageTags = metaTagsFor(head, "property", "og:image");
  const secureImageTags = metaTagsFor(head, "property", "og:image:secure_url");
  const thumbnailTags = metaTagsFor(head, "name", "thumbnail");
  const twitterImageTags = metaTagsFor(head, "name", "twitter:image");
  const widthTags = metaTagsFor(head, "property", "og:image:width");
  const heightTags = metaTagsFor(head, "property", "og:image:height");
  const robotsTags = metaTagsFor(head, "name", "robots");

  const oneContent = (tags, name) => {
    if (tags.length !== 1) {
      failures.push(`${label}: expected exactly one ${name} tag; found ${tags.length}.`);
      return null;
    }

    const content = getAttribute(tags[0], "content");
    if (!content) failures.push(`${label}: ${name} has no content value.`);
    return content;
  };

  const ogImage = oneContent(ogImageTags, "og:image");
  const secureImage = oneContent(secureImageTags, "og:image:secure_url");
  const thumbnail = oneContent(thumbnailTags, "thumbnail");
  const twitterImage = oneContent(twitterImageTags, "twitter:image");
  const width = oneContent(widthTags, "og:image:width");
  const height = oneContent(heightTags, "og:image:height");
  const robots = oneContent(robotsTags, "robots");

  if (!ogImage) return;
  if (thumbnail && thumbnail !== ogImage) {
    failures.push(`${label}: thumbnail must use the same image as og:image.`);
  }
  if (secureImage && secureImage !== ogImage) {
    failures.push(`${label}: og:image:secure_url does not match og:image.`);
  }
  if (twitterImage && twitterImage !== ogImage) {
    failures.push(`${label}: twitter:image does not match og:image.`);
  }

  if (robots && !robots.toLowerCase().includes("noindex") && !robots.toLowerCase().includes("max-image-preview:large")) {
    failures.push(`${label}: indexable page is missing max-image-preview:large.`);
  }

  let imageUrl;
  try {
    imageUrl = new URL(ogImage);
  } catch {
    failures.push(`${label}: og:image is not an absolute URL: ${ogImage}`);
    return;
  }

  if (imageUrl.protocol !== "https:" || imageUrl.origin !== siteOrigin) {
    failures.push(`${label}: og:image must be an HTTPS asset on ${siteOrigin}.`);
    return;
  }

  const relativeImagePath = decodeURIComponent(imageUrl.pathname).replace(/^\/+/, "");
  const imageFilePath = path.resolve(distDirectory, relativeImagePath);
  if (!imageFilePath.startsWith(`${distDirectory}${path.sep}`) || !existsSync(imageFilePath)) {
    failures.push(`${label}: og:image asset is missing from the build: ${imageUrl.pathname}`);
    return;
  }

  const dimensions = getImageDimensions(imageFilePath);
  if (!dimensions) {
    failures.push(`${label}: could not read dimensions for ${imageUrl.pathname}.`);
    return;
  }

  if (Number(width) !== dimensions.width || Number(height) !== dimensions.height) {
    failures.push(
      `${label}: OG dimensions say ${width}x${height}, but ${imageUrl.pathname} is ${dimensions.width}x${dimensions.height}.`
    );
  }

  if (isArticle && (dimensions.width !== 1200 || dimensions.height !== 630)) {
    failures.push(
      `${label}: article image must be 1200x630 for large previews; found ${dimensions.width}x${dimensions.height}.`
    );
  }
}

addPage(homePagePath, "/", false);
const articleFiles = collectHtmlFiles(blogDirectory);
if (articleFiles.length === 0) failures.push("No generated article pages were found under dist/blog.");
for (const articleFile of articleFiles) {
  addPage(articleFile, path.relative(distDirectory, articleFile), true);
}

if (failures.length > 0) {
  console.error("[social-image-meta] FAIL:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `[social-image-meta] PASS: ${articleFiles.length + 1} homepage/article pages have matching thumbnail, Open Graph, Twitter, robots, and image-dimension metadata.`
);
