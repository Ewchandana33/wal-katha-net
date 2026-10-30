import assert from "node:assert/strict";
import test from "node:test";
import {
  containsDisallowedLink,
  sanitizeCommentText,
  watchCommentLinks,
} from "../shared/comment-link-policy.js";
import { readFile } from "node:fs/promises";

test("rejects explicit, bare-domain, IPv4, and common short links", () => {
  for (const value of [
    "https://example.com/page",
    "ftp://example.org/file",
    "www.example.com",
    "example.lk/story",
    "bit.ly/short",
    "192.0.2.10:8080/path",
    "[read this](https://example.com)",
  ]) {
    assert.equal(containsDisallowedLink(value), true, value);
  }
});

test("rejects common spacing, invisible-character, and dot-obfuscation variants", () => {
  for (const value of [
    "https : / / example . com",
    "example [dot] com",
    "example&#46;com",
    "exa\u200bmple.com",
  ]) {
    assert.equal(containsDisallowedLink(value), true, value);
  }
});

test("does not mistake ordinary prose or a bare email address for a web link", () => {
  for (const value of [
    "මෙම කතාවට මගේ අදහසක් ඇත.",
    "අදහස් සඳහා reader@example.com වෙත ලියන්න.",
    "The characters example and com are not a link.",
  ]) {
    assert.equal(containsDisallowedLink(value), false, value);
  }
});

test("shows one warning per link insertion and resumes after the link is removed", () => {
  const input = new EventTarget();
  input.value = "";
  let warnings = 0;
  const stopWatching = watchCommentLinks(input, () => {
    warnings += 1;
  });
  const type = (value) => {
    input.value = value;
    input.dispatchEvent(new Event("input"));
  };

  type("https://example.com");
  assert.equal(warnings, 1);
  type("https://example.com/another-page");
  assert.equal(warnings, 1);
  type("My opinion about the story");
  assert.equal(warnings, 1);
  type("www.example.lk");
  assert.equal(warnings, 2);

  stopWatching();
  type("https://example.org");
  assert.equal(warnings, 2);
});

test("installs live link warnings on all four comment and reply fields", async () => {
  const entryPoints = [
    ["../src/layouts/partials/PostSingle.astro", /watchCommentLinks\(textarea\b/],
    ["../src/layouts/partials/PostSingle.astro", /watchCommentLinks\(input\b/],
    ["../src/layouts/components/StoryRating.astro", /watchCommentLinks\(commentInput\b/],
    ["../src/layouts/components/StoryRatingComments.astro", /watchCommentLinks\(textarea\b/],
  ];

  for (const [path, pattern] of entryPoints) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(source, pattern, `${path} should detect links while the user types or pastes`);
  }
});

test("removes link targets from older comments while preserving the remaining opinion", () => {
  assert.equal(
    sanitizeCommentText("හොඳ කතාවක්. https://example.com කියවන්න."),
    "හොඳ කතාවක්. කියවන්න.",
  );
  assert.equal(
    sanitizeCommentText("[මෙය බලන්න](https://example.com) මගේ අදහස"),
    "මෙය බලන්න මගේ අදහස",
  );
  assert.equal(
    sanitizeCommentText("https://example.com"),
    "සබැඳිය අඩංගු වූ අදහසක් ඉවත් කර ඇත.",
  );
});
