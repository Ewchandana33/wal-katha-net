import assert from "node:assert/strict";
import test from "node:test";
import { PUBLISHED_STORY_SLUGS } from "../functions/_shared/published-story-slugs.generated.js";
import { onRequest } from "../functions/api/rating.js";

const BASE_URL = "https://preview.wala-katha.pages.dev/api/rating";
const STORY_SLUG = "akkai-nangi-wal-katha";
const IP = "203.0.113.10";

class MemoryD1 {
  votes = [];
  comments = [];
  rateLimits = new Map();
  fail = false;
  failCommentInsert = false;
  batchQueue = Promise.resolve();

  batch(statements) {
    const task = this.batchQueue.then(async () => {
      const votesBefore = [...this.votes];
      const commentsBefore = [...this.comments];
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        return results;
      } catch (error) {
        this.votes = votesBefore;
        this.comments = commentsBefore;
        throw error;
      }
    });
    this.batchQueue = task.then(() => undefined, () => undefined);
    return task;
  }

  prepare(sql) {
    const db = this;
    const normalizedSql = sql.replace(/\s+/g, " ").trim();
    return {
      bind(...params) {
        return {
          async first() {
            if (db.fail) throw new Error("simulated internal database detail");
            if (normalizedSql.includes("INSERT INTO story_rating_rate_limits")) {
              const [key, now, resetBefore, resetAt, resetAgainBefore] = params;
              const previous = db.rateLimits.get(key);
              const expired = previous && previous.window_started_at <= resetBefore;
              const value = previous && !expired
                ? { window_started_at: previous.window_started_at, request_count: previous.request_count + 1 }
                : { window_started_at: resetAt, request_count: 1 };
              assert.equal(resetBefore, resetAgainBefore);
              assert.ok(now > 0);
              db.rateLimits.set(key, value);
              return value;
            }
            if (normalizedSql.includes("SELECT rating FROM story_ratings")) {
              const [story, voter] = params;
              return db.votes.find((vote) => vote.story_slug === story && vote.voter_hash === voter) || null;
            }
            throw new Error(`Unexpected first() query: ${normalizedSql}`);
          },
          async all() {
            if (db.fail) throw new Error("simulated internal database detail");
            if (normalizedSql.includes("SELECT rating, COUNT(*) AS vote_count FROM story_ratings")) {
              const [story] = params;
              const counts = new Map();
              for (const vote of db.votes.filter((item) => item.story_slug === story)) {
                counts.set(vote.rating, (counts.get(vote.rating) || 0) + 1);
              }
              return {
                results: [...counts].map(([rating, vote_count]) => ({ rating, vote_count })),
              };
            }
            throw new Error(`Unexpected all() query: ${normalizedSql}`);
          },
          async run() {
            if (db.fail) throw new Error("simulated internal database detail");
            if (normalizedSql.includes("DELETE FROM story_rating_rate_limits")) return { success: true };
            if (normalizedSql.includes("INSERT INTO story_ratings")) {
              const [story_slug, voter_hash, rating] = params;
              if (db.votes.some((vote) => vote.story_slug === story_slug && vote.voter_hash === voter_hash)) {
                throw new Error("UNIQUE constraint failed");
              }
              db.votes.push({ story_slug, voter_hash, rating });
              return { success: true, meta: { changes: 1 } };
            }
            if (normalizedSql.includes("INSERT INTO story_rating_comments")) {
              if (db.failCommentInsert) throw new Error("simulated comment insert failure");
              const [story_slug, author_hash, review_voter_hash, body] = params;
              if (db.comments.some((comment) =>
                comment.story_slug === story_slug && comment.review_voter_hash === review_voter_hash
              )) {
                throw new Error("UNIQUE constraint failed");
              }
              const id = db.comments.length + 1;
              db.comments.push({
                id, story_slug, author_hash, review_voter_hash, parent_id: null, body,
              });
              return { success: true, meta: { changes: 1, last_row_id: id } };
            }
            throw new Error(`Unexpected run() query: ${normalizedSql}`);
          },
        };
      },
    };
  }
}

function makeContext({
  method = "GET",
  url = `${BASE_URL}?story=${encodeURIComponent(STORY_SLUG)}`,
  body,
  headers = {},
  db = new MemoryD1(),
} = {}) {
  const requestHeaders = new Headers(headers);
  const request = new Request(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : body,
  });
  return { request, env: { DB: db } };
}

function makePostContext({
  rating = 5,
  token = "a".repeat(43),
  db = new MemoryD1(),
  headers = {},
  ...overrides
} = {}) {
  return makeContext({
    method: "POST",
    body: JSON.stringify({ storySlug: STORY_SLUG, rating }),
    headers: {
      Origin: new URL(BASE_URL).origin,
      "Content-Type": "application/json",
      Cookie: `wk-rating-voter=${token}`,
      "CF-Connecting-IP": IP,
      ...headers,
    },
    db,
    ...overrides,
  });
}

test("allowlist contains published story IDs and excludes private/draft files", () => {
  assert.ok(PUBLISHED_STORY_SLUGS.has(STORY_SLUG));
  assert.ok(PUBLISHED_STORY_SLUGS.has("nimali-saha-boss"));
  assert.ok(!PUBLISHED_STORY_SLUGS.has("Akkai-Nangi-wal-katha"));
  assert.ok(!PUBLISHED_STORY_SLUGS.has("-index"));
  assert.ok(!PUBLISHED_STORY_SLUGS.has("not-a-real-story"));
});

test("GET reports a real empty state and issues a secure voter cookie", async () => {
  const response = await onRequest(makeContext());
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.average_rating, 0);
  assert.equal(data.total_votes, 0);
  assert.deepEqual(data.rating_counts, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  assert.equal(data.has_voted, false);
  assert.match(response.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
  assert.match(response.headers.get("set-cookie"), /Secure/);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("GET rejects invalid or unpublished story identifiers", async () => {
  const invalid = await onRequest(makeContext({ url: `${BASE_URL}?story=../secret` }));
  assert.equal(invalid.status, 400);
  const missing = await onRequest(makeContext({ url: `${BASE_URL}?story=not-a-real-story` }));
  assert.equal(missing.status, 404);
});

test("POST validates method, origin, content type, JSON, slug, and integer rating", async () => {
  const db = new MemoryD1();
  const invalidRating = await onRequest(makePostContext({ rating: 5.5, db }));
  assert.equal(invalidRating.status, 400);

  const invalidJson = await onRequest(makeContext({
    method: "POST",
    body: "{",
    headers: {
      Origin: new URL(BASE_URL).origin,
      "Content-Type": "application/json",
      Cookie: `wk-rating-voter=${"b".repeat(43)}`,
      "CF-Connecting-IP": IP,
    },
    db,
  }));
  assert.equal(invalidJson.status, 400);

  const wrongContentType = await onRequest(makePostContext({
    db,
    headers: { "Content-Type": "text/plain" },
  }));
  assert.equal(wrongContentType.status, 415);

  const wrongOrigin = await onRequest(makePostContext({
    db,
    headers: { Origin: "https://attacker.example" },
  }));
  assert.equal(wrongOrigin.status, 403);

  const unknownSlug = await onRequest(makeContext({
    method: "POST",
    body: JSON.stringify({ storySlug: "not-a-real-story", rating: 5 }),
    headers: {
      Origin: new URL(BASE_URL).origin,
      "Content-Type": "application/json",
      Cookie: `wk-rating-voter=${"c".repeat(43)}`,
      "CF-Connecting-IP": IP,
    },
    db,
  }));
  assert.equal(unknownSlug.status, 404);
  assert.equal(db.votes.length, 0);
});

test("ratings 1 through 5 are stored and aggregate statistics are accurate", async () => {
  const db = new MemoryD1();
  for (let rating = 1; rating <= 5; rating += 1) {
    const response = await onRequest(makePostContext({
      rating,
      token: String(rating).repeat(43),
      db,
    }));
    assert.equal(response.status, 201);
  }

  const response = await onRequest(makeContext({
    headers: { Cookie: `wk-rating-voter=${"3".repeat(43)}` },
    db,
  }));
  const data = await response.json();
  assert.equal(data.average_rating, 3);
  assert.equal(data.total_votes, 5);
  assert.equal(data.total_stars, 15);
  assert.deepEqual(data.rating_counts, { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 });
  assert.equal(data.has_voted, true);
  assert.equal(data.user_rating, 3);
});

test("repeated and concurrent votes from one browser produce one vote only", async () => {
  const db = new MemoryD1();
  const [first, second] = await Promise.all([
    onRequest(makePostContext({ db, token: "d".repeat(43), rating: 4 })),
    onRequest(makePostContext({ db, token: "d".repeat(43), rating: 4 })),
  ]);
  const statuses = [first.status, second.status].sort();
  assert.deepEqual(statuses, [201, 409]);
  assert.equal(db.votes.length, 1);

  const duplicate = await onRequest(makePostContext({ db, token: "d".repeat(43), rating: 2 }));
  assert.equal(duplicate.status, 409);
  assert.equal(db.votes.length, 1);
});

test("rating and optional comment are stored together using the same private voter identity", async () => {
  const db = new MemoryD1();
  const token = "r".repeat(43);
  const response = await onRequest(makePostContext({
    db,
    token,
    body: JSON.stringify({ storySlug: STORY_SLUG, rating: 4, comment: "  හොඳ කතාවක්  " }),
  }));
  const data = await response.json();
  assert.equal(response.status, 201);
  assert.equal(data.comment_saved, true);
  assert.equal(db.votes.length, 1);
  assert.equal(db.comments.length, 1);
  assert.equal(db.comments[0].body, "හොඳ කතාවක්");
  assert.equal(db.comments[0].author_hash, db.votes[0].voter_hash);
  assert.equal(db.comments[0].review_voter_hash, db.votes[0].voter_hash);

  const duplicate = await onRequest(makePostContext({
    db,
    token,
    body: JSON.stringify({ storySlug: STORY_SLUG, rating: 2, comment: "duplicate" }),
  }));
  assert.equal(duplicate.status, 409);
  assert.equal(db.comments.length, 1);
});

test("comment validation rejects non-text and overlong feedback", async () => {
  const db = new MemoryD1();
  for (const comment of [null, "අ".repeat(501)]) {
    const response = await onRequest(makePostContext({
      db,
      body: JSON.stringify({ storySlug: STORY_SLUG, rating: 5, comment }),
    }));
    assert.equal(response.status, 400);
  }
  assert.equal(db.votes.length, 0);
  assert.equal(db.comments.length, 0);
});

test("failed comment insertion rolls the rating back with its D1 batch", async () => {
  const db = new MemoryD1();
  db.failCommentInsert = true;
  const response = await onRequest(makePostContext({
    db,
    body: JSON.stringify({ storySlug: STORY_SLUG, rating: 5, comment: "atomic test" }),
  }));
  assert.equal(response.status, 500);
  assert.equal(db.votes.length, 0);
  assert.equal(db.comments.length, 0);
});

test("API throttles excessive submissions by a short-lived hashed IP identity", async () => {
  const db = new MemoryD1();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await onRequest(makePostContext({
      db,
      token: String.fromCharCode(65 + attempt).repeat(43),
      rating: 3,
    }));
    assert.equal(response.status, 201);
  }
  const limited = await onRequest(makePostContext({ db, token: "z".repeat(43), rating: 3 }));
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.equal(db.votes.length, 20);
});

test("database failures return a generic error without leaking internals", async () => {
  const db = new MemoryD1();
  db.fail = true;
  const response = await onRequest(makeContext({ db }));
  const body = await response.text();
  assert.equal(response.status, 500);
  assert.ok(!body.includes("simulated internal database detail"));
});

test("unsupported methods return 405 with an Allow header", async () => {
  const response = await onRequest(makeContext({ method: "PUT" }));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, POST");
});
