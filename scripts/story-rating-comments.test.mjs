import assert from "node:assert/strict";
import test from "node:test";
import { onRequest as commentsHandler } from "../functions/api/rating/comments.js";
import { onRequest as likeHandler } from "../functions/api/rating/comments/[commentId]/like.js";
import { sha256 } from "../functions/_shared/story-review-utils.js";

const STORY_SLUG = "akkai-nangi-wal-katha";
const OTHER_STORY = "bus-jack-wal-katha";
const COOKIE = "wk-rating-voter";

class MemoryD1 {
  comments = [
    {
      id: 1,
      story_slug: STORY_SLUG,
      author_hash: "owner-hash",
      review_voter_hash: "owner-hash",
      parent_id: null,
      body: "මෙය මූලික අදහසයි",
      created_at: 1_800_000_000,
    },
    {
      id: 2,
      story_slug: STORY_SLUG,
      author_hash: "reply-hash",
      review_voter_hash: null,
      parent_id: 1,
      body: "මෙයට පිළිතුරක්",
      created_at: 1_800_000_010,
    },
    {
      id: 3,
      story_slug: OTHER_STORY,
      author_hash: "other-hash",
      review_voter_hash: "other-hash",
      parent_id: null,
      body: "වෙනත් කතාවක අදහස",
      created_at: 1_800_000_020,
    },
  ];
  likes = [];
  rateLimits = new Map();

  prepare(sql) {
    const normalized = sql.replace(/\s+/g, " ").trim();
    const db = this;
    return {
      params: [],
      bind(...params) {
        this.params = params;
        return this;
      },
      async first() {
        const p = this.params;
        if (normalized.includes("SELECT COUNT(*) AS comment_count")) {
          return { comment_count: db.comments.filter((row) => row.story_slug === p[0]).length };
        }
        if (normalized.includes("SELECT id FROM story_rating_comments") && normalized.includes("parent_id IS NULL")) {
          return db.comments.find((row) =>
            row.id === p[0] && row.story_slug === p[1] && row.parent_id === null
          ) || null;
        }
        if (normalized.includes("SELECT id FROM story_rating_comments")) {
          return db.comments.find((row) => row.id === p[0] && row.story_slug === p[1]) || null;
        }
        if (normalized.includes("INSERT INTO story_rating_rate_limits")) {
          const [ipHash, now, expiry, newStart] = p;
          const previous = db.rateLimits.get(ipHash);
          const next = !previous || previous.window_started_at <= expiry
            ? { window_started_at: newStart, request_count: 1 }
            : { ...previous, request_count: previous.request_count + 1 };
          db.rateLimits.set(ipHash, next);
          return next;
        }
        if (normalized.includes("SELECT COUNT(*) AS like_count")) {
          return { like_count: db.likes.filter((like) => like.comment_id === p[0]).length };
        }
        if (normalized.includes("SELECT 1 AS liked")) {
          return db.likes.some((like) => like.comment_id === p[0] && like.voter_hash === p[1])
            ? { liked: 1 }
            : null;
        }
        throw new Error(`Unexpected first() query: ${normalized}`);
      },
      async all() {
        const p = this.params;
        if (normalized.includes("c.parent_id IS NULL")) {
          const [voterHash, mineHash, storySlug, before, , limit] = p;
          return {
            results: db.comments
              .filter((row) =>
                row.story_slug === storySlug &&
                row.parent_id === null &&
                (before === null || row.id < before)
              )
              .sort((a, b) => b.id - a.id)
              .slice(0, limit)
              .map((row) => ({
                id: row.id,
                body: row.body,
                created_at: row.created_at,
                like_count: db.likes.filter((like) => like.comment_id === row.id).length,
                viewer_liked: db.likes.some((like) =>
                  like.comment_id === row.id && like.voter_hash === voterHash
                ) ? 1 : 0,
                is_mine: row.author_hash === mineHash ? 1 : 0,
              })),
          };
        }
        if (normalized.includes("c.parent_id IN")) {
          const [voterHash, mineHash, storySlug, ...parentIds] = p;
          return {
            results: db.comments
              .filter((row) => row.story_slug === storySlug && parentIds.includes(row.parent_id))
              .sort((a, b) => a.parent_id - b.parent_id || a.id - b.id)
              .map((row) => ({
                ...row,
                like_count: db.likes.filter((like) => like.comment_id === row.id).length,
                viewer_liked: db.likes.some((like) =>
                  like.comment_id === row.id && like.voter_hash === voterHash
                ) ? 1 : 0,
                is_mine: row.author_hash === mineHash ? 1 : 0,
              })),
          };
        }
        throw new Error(`Unexpected all() query: ${normalized}`);
      },
      async run() {
        const p = this.params;
        if (normalized.startsWith("DELETE FROM story_rating_rate_limits")) return { success: true };
        if (normalized.includes("INSERT INTO story_rating_comments")) {
          const [story_slug, author_hash, parent_id, body] = p;
          const id = Math.max(0, ...db.comments.map((row) => row.id)) + 1;
          const comment = {
            id,
            story_slug,
            author_hash,
            review_voter_hash: null,
            parent_id,
            body,
            created_at: 1_800_000_030,
          };
          db.comments.push(comment);
          return { success: true, meta: { changes: 1, last_row_id: id } };
        }
        if (normalized.includes("INSERT OR IGNORE INTO story_rating_comment_likes")) {
          const [comment_id, voter_hash] = p;
          if (!db.likes.some((like) => like.comment_id === comment_id && like.voter_hash === voter_hash)) {
            db.likes.push({ comment_id, voter_hash });
          }
          return { success: true, meta: { changes: 1 } };
        }
        throw new Error(`Unexpected run() query: ${normalized}`);
      },
    };
  }
}

function makeRequest(path, { method = "GET", body, token = "v".repeat(43), origin = "https://example.test" } = {}) {
  const headers = new Headers();
  if (token) headers.set("Cookie", `${COOKIE}=${token}`);
  if (method !== "GET") {
    headers.set("Origin", origin);
    headers.set("Content-Type", "application/json");
  }
  headers.set("CF-Connecting-IP", "192.0.2.10");
  return new Request(`https://example.test${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function context(request, db, commentId) {
  return {
    request,
    env: { DB: db },
    params: commentId === undefined ? {} : { commentId: String(commentId) },
  };
}

test("count-only response reveals only the total, not comment text", async () => {
  const db = new MemoryD1();
  const response = await commentsHandler(context(
    makeRequest(`/api/rating/comments?story=${STORY_SLUG}&countOnly=1`),
    db,
  ));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.total_comments, 2);
  assert.equal("comments" in data, false);
  assert.equal(JSON.stringify(data).includes("මූලික අදහස"), false);
});

test("comment list returns top-level comments and their replies with safe viewer flags", async () => {
  const db = new MemoryD1();
  const token = "v".repeat(43);
  const viewerHash = await sha256(`voter:${token}`);
  db.likes.push({ comment_id: 1, voter_hash: viewerHash });
  const response = await commentsHandler(context(
    makeRequest(`/api/rating/comments?story=${STORY_SLUG}`, { token }),
    db,
  ));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.total_comments, 2);
  assert.equal(data.comments.length, 1);
  assert.equal(data.comments[0].body, "මෙය මූලික අදහසයි");
  assert.equal(data.comments[0].replies[0].body, "මෙයට පිළිතුරක්");
  assert.equal(data.comments[0].liked, true);
  assert.equal(data.comments[0].is_mine, false);

  const newViewer = await commentsHandler(context(
    makeRequest(`/api/rating/comments?story=${STORY_SLUG}`, { token: null }),
    db,
  ));
  assert.equal(newViewer.status, 200);
  assert.match(newViewer.headers.get("Set-Cookie"), /Path=\/api\/rating;/);
});

test("reply endpoint stores one-level replies and rejects replies to replies", async () => {
  const db = new MemoryD1();
  const request = makeRequest("/api/rating/comments", {
    method: "POST",
    body: { storySlug: STORY_SLUG, parentId: 1, body: "  තවත් අදහසක්  " },
  });
  const response = await commentsHandler(context(request, db));
  const data = await response.json();
  assert.equal(response.status, 201);
  assert.equal(data.comment.body, "තවත් අදහසක්");
  assert.equal(data.total_comments, 3);
  assert.equal(db.comments.at(-1).review_voter_hash, null);
  assert.equal(db.comments.at(-1).parent_id, 1);

  const nested = await commentsHandler(context(makeRequest("/api/rating/comments", {
    method: "POST",
    body: { storySlug: STORY_SLUG, parentId: 2, body: "nested" },
  }), db));
  assert.equal(nested.status, 404);
});

test("like endpoint is idempotent and scopes a comment to its story", async () => {
  const db = new MemoryD1();
  const request = makeRequest("/api/rating/comments/1/like", {
    method: "POST",
    body: { storySlug: STORY_SLUG },
  });
  const first = await likeHandler(context(request, db, 1));
  assert.deepEqual(await first.json(), { liked: true, like_count: 1 });

  const repeated = await likeHandler(context(makeRequest("/api/rating/comments/1/like", {
    method: "POST",
    body: { storySlug: STORY_SLUG },
  }), db, 1));
  assert.deepEqual(await repeated.json(), { liked: true, like_count: 1 });
  assert.equal(db.likes.length, 1);

  const wrongStory = await likeHandler(context(makeRequest("/api/rating/comments/1/like", {
    method: "POST",
    body: { storySlug: OTHER_STORY },
  }), db, 1));
  assert.equal(wrongStory.status, 404);
});

test("write endpoints reject cross-origin and malformed requests", async () => {
  const db = new MemoryD1();
  const crossOrigin = await commentsHandler(context(makeRequest("/api/rating/comments", {
    method: "POST",
    origin: "https://attacker.test",
    body: { storySlug: STORY_SLUG, parentId: 1, body: "no" },
  }), db));
  assert.equal(crossOrigin.status, 403);

  const tooLong = await commentsHandler(context(makeRequest("/api/rating/comments", {
    method: "POST",
    body: { storySlug: STORY_SLUG, parentId: 1, body: "අ".repeat(501) },
  }), db));
  assert.equal(tooLong.status, 400);
  assert.equal(db.comments.length, 3);

  const unknownProperty = await likeHandler(context(makeRequest("/api/rating/comments/1/like", {
    method: "POST",
    body: { storySlug: STORY_SLUG, remove: true },
  }), db, 1));
  assert.equal(unknownProperty.status, 400);
});
