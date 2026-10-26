import { existsSync } from "node:fs";
import path from "node:path";

const BLOCKED_TEXT_PATTERNS = [
  /\b(?:adult|sex(?:ual)?|erotic|porn(?:ography)?|nude|incest|rape|underage|minor|child|children|kid|teen|school|student|family|mother|father|daughter|son|sister|brother|aunt(?:y|ie)|akka(?:i)?|nangi|step[- ]?(?:mother|father|sister|brother))\b/iu,
  /(?:^|[\s/_-])18\s*\+(?:$|[\s/_-])/u,
  /(?:පාසල්|ශිෂ්‍ය|ළම|බාලවයස්|ලිංගික|කාමුක|නිරුවත්|සංසර්ග|නංගි|නැන්ද|අම්මා|තාත්තා|දුව|මව|පියා)/u,
];

const MAX_STORY_SLIDES = 6;
const MAX_SLIDE_CHARACTERS = 180;

/**
 * @typedef {{
 *   id: string,
 *   body?: string,
 *   data?: {
 *     title?: string,
 *     description?: string,
 *     image?: string,
 *     image_alt?: string,
 *     categories?: string[],
 *     tags?: string[],
 *     date?: Date | string,
 *     updated?: Date | string,
 *     draft?: boolean,
 *     web_story?: boolean
 *   }
 * }} WebStoryPost
 */

function localCoverPath(image) {
  if (
    typeof image !== "string" ||
    !image.startsWith("/images/posts/") ||
    image.includes("?") ||
    image.includes("#") ||
    image.includes("\\")
  ) {
    return null;
  }

  const relativePath = image.slice(1);
  if (relativePath.split("/").includes("..") || !/\.webp$/i.test(relativePath)) {
    return null;
  }

  return path.resolve(process.cwd(), "public", relativePath);
}

function hasLocalCover(image, imageExists) {
  const filePath = localCoverPath(image);
  return Boolean(filePath && imageExists(filePath));
}

function isSensitive(post) {
  const data = post?.data ?? {};
  const searchableText = [
    data.title,
    data.description,
    ...(Array.isArray(data.categories) ? data.categories : []),
    ...(Array.isArray(data.tags) ? data.tags : []),
    post?.body,
  ]
    .filter((value) => typeof value === "string")
    .join(" ");

  return BLOCKED_TEXT_PATTERNS.some((pattern) => pattern.test(searchableText));
}

function postDate(post) {
  const value = post?.data?.updated ?? post?.data?.date;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

/**
 * A story requires a positive editorial opt-in, a published source post,
 * a local cover, no existing noindex rule, and no known sensitive markers.
 *
 * @param {WebStoryPost} post
 * @param {Set<string>} noindexIds
 * @param {(filePath: string) => boolean} imageExists
 */
export function isWebStoryEligible(
  post,
  noindexIds = new Set(),
  imageExists = existsSync,
) {
  if (!post?.id || !post.data || post.data.draft === true) return false;
  if (post.data.web_story !== true) return false;
  if (noindexIds.has(post.id)) return false;
  if (!hasLocalCover(post.data.image, imageExists)) return false;
  if (isSensitive(post)) return false;

  return Boolean(
    String(post.data.title ?? "").trim() &&
      (String(post.body ?? "").trim() || String(post.data.description ?? "").trim()),
  );
}

/**
 * @param {WebStoryPost[]} posts
 * @param {Set<string>} noindexIds
 * @param {(filePath: string) => boolean} imageExists
 * @returns {WebStoryPost[]}
 */
export function selectWebStories(
  posts,
  noindexIds = new Set(),
  imageExists = existsSync,
) {
  return (Array.isArray(posts) ? posts : [])
    .filter((post) => isWebStoryEligible(post, noindexIds, imageExists))
    .sort(
      (a, b) =>
        postDate(b) - postDate(a) ||
        String(a.data.title ?? "").localeCompare(String(b.data.title ?? "")),
    );
}

function cleanMarkdown(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/[`*_~]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function limitCharacters(value, maxCharacters) {
  const characters = Array.from(value);
  if (characters.length <= maxCharacters) return value;
  return `${characters.slice(0, maxCharacters - 1).join("").trimEnd()}…`;
}

/**
 * Convert already-reviewed Markdown into short, plain-text story panels.
 *
 * @param {WebStoryPost} post
 * @param {{ maxSlides?: number, maxCharacters?: number }} options
 * @returns {string[]}
 */
export function buildStorySlides(
  post,
  { maxSlides = MAX_STORY_SLIDES, maxCharacters = MAX_SLIDE_CHARACTERS } = {},
) {
  const plainText = cleanMarkdown(post?.body);
  const paragraphs = plainText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (paragraphs.length === 0 && post?.data?.description) {
    paragraphs.push(cleanMarkdown(post.data.description).replace(/\s+/g, " "));
  }

  return paragraphs
    .slice(0, Math.max(0, maxSlides))
    .map((paragraph) => limitCharacters(paragraph, maxCharacters))
    .filter(Boolean);
}
