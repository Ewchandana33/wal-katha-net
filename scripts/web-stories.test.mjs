import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import test from "node:test";
import {
  buildStorySlides,
  isWebStoryEligible,
  selectWebStories,
} from "../src/lib/webStories.mjs";
import { createWebStoryPoster } from "../src/lib/webStoryPoster.mjs";

const COVER = "/images/posts/Akkai-Nangi-Wal-Katha.webp";
const imageExists = () => true;

function post(overrides = {}) {
  return {
    id: "calm-garden-story",
    body: "## A quiet morning\n\nA small garden was bright with rain.\n\nThe neighbors shared fresh flowers.",
    data: {
      title: "A quiet morning",
      description: "A gentle story about a garden.",
      image: COVER,
      image_alt: "Flowers after rain",
      date: "2026-10-20",
      categories: ["fiction"],
      tags: ["gentle"],
      draft: false,
      web_story: true,
    },
    ...overrides,
  };
}

test("requires editorial opt-in and a published source post", () => {
  assert.equal(isWebStoryEligible(post(), new Set(), imageExists), true);
  assert.equal(
    isWebStoryEligible(
      post({ data: { ...post().data, web_story: false } }),
      new Set(),
      imageExists,
    ),
    false,
  );
  assert.equal(
    isWebStoryEligible(
      post({ data: { ...post().data, draft: true } }),
      new Set(),
      imageExists,
    ),
    false,
  );
});

test("preserves source noindex exclusions for story selection", () => {
  assert.equal(
    isWebStoryEligible(post(), new Set(["calm-garden-story"]), imageExists),
    false,
  );
});

test("rejects sensitive metadata and body text even when opted in", () => {
  const sensitiveTitle = post({
    data: { ...post().data, title: "A school story" },
  });
  const sensitiveBody = post({
    body: "A quiet beginning.\n\nThis is explicit sexual content.",
  });
  const adultLabel = post({
    data: { ...post().data, tags: ["18+"] },
  });
  const transliteratedFamily = post({
    data: { ...post().data, title: "A story about akka and nangi" },
  });
  assert.equal(isWebStoryEligible(sensitiveTitle, new Set(), imageExists), false);
  assert.equal(isWebStoryEligible(sensitiveBody, new Set(), imageExists), false);
  assert.equal(isWebStoryEligible(adultLabel, new Set(), imageExists), false);
  assert.equal(isWebStoryEligible(transliteratedFamily, new Set(), imageExists), false);
});

test("requires a local post-cover WebP that exists", () => {
  assert.equal(
    isWebStoryEligible(
      post({ data: { ...post().data, image: "https://example.test/cover.webp" } }),
      new Set(),
      imageExists,
    ),
    false,
  );
  assert.equal(
    isWebStoryEligible(post(), new Set(), () => false),
    false,
  );
});

test("selects eligible posts newest first without drafts or noindex posts", () => {
  const newer = post({
    id: "newer",
    data: { ...post().data, title: "Newer story", date: "2026-10-24" },
  });
  const older = post({
    id: "older",
    data: { ...post().data, title: "Older story", date: "2026-10-19" },
  });
  const excluded = post({
    id: "excluded",
    data: { ...post().data, title: "Noindex story", date: "2026-10-25" },
  });

  assert.deepEqual(
    selectWebStories([older, excluded, newer], new Set(["excluded"]), imageExists).map(
      (story) => story.id,
    ),
    ["newer", "older"],
  );
});

test("converts Markdown to short plain-text slides with Sinhala-safe truncation", () => {
  const slides = buildStorySlides(
    post({
      body: "## ආයුබෝවන්\n\n[කියවන්න](https://example.test) වැස්සෙන් පසුවත් මල් පිපුණා.\n\nතුන්වන කොටස.",
    }),
    { maxSlides: 2, maxCharacters: 18 },
  );

  assert.deepEqual(slides, ["ආයුබෝවන්", "කියවන්න වැස්සෙන්…"]);
  assert.equal(slides.some((slide) => /https?:|<[^>]+>/.test(slide)), false);
});

test("creates a portrait WebP poster without writing or changing source images", async () => {
  const source = await readFile("public/images/app-icon.webp");
  const posterBuffer = await createWebStoryPoster(source);
  const metadata = await sharp(posterBuffer).metadata();

  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 640);
  assert.equal(metadata.height, 853);
  assert.ok(posterBuffer.length > 0);
});
