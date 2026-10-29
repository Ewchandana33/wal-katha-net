import assert from "node:assert/strict";
import test from "node:test";
import { onRequest as postComments } from "../functions/api/post-comments.js";
import { onRequest as getComments } from "../functions/api/post-comments.js";
import { onRequest as likeComment } from "../functions/api/post-comments/[commentId]/like.js";
import { onRequest as replyToComment } from "../functions/api/post-comments/[commentId]/replies.js";
import { stablePostCommentId } from "../functions/_shared/legacy-post-comments.js";
import { sha256 } from "../functions/_shared/story-review-utils.js";

const POST_ID = "akkai-nangi-wal-katha";
const TOKEN = "a".repeat(43);
const sourceComment = {
  content: "පැරණි අදහස",
  date: "Oct 29, 2026",
  created_at: "2026-10-29T08:00:00.000Z",
};

class MemoryD1 {
  constructor() {
    this.likes = [];
    this.replies = [];
    this.replyLikes = [];
    this.nextReplyId = 8;
    this.rateCount = 0;
  }

  prepare(sql) {
    const query = sql.replace(/\s+/g, " ").trim().toLowerCase();
    let params = [];
    const statement = {
      bind: (...values) => { params = values; return statement; },
      all: async () => this.all(query, params),
      first: async () => this.first(query, params),
      run: async () => this.run(query, params),
    };
    return statement;
  }

  async all(query, params) {
    if (query.includes("from legacy_post_comment_likes")) {
      const [viewerHash, postId, ...ids] = params;
      const results = ids.map((id) => {
        const rows = this.likes.filter((row) => row.post_id === postId && row.post_comment_id === id);
        return { post_comment_id: id, like_count: rows.length, viewer_liked: rows.some((row) => row.voter_hash === viewerHash) ? 1 : 0 };
      }).filter((row) => row.like_count > 0);
      return { results };
    }
    if (query.includes("from legacy_post_comment_replies")) {
      const [postId, ...parentIds] = params;
      return { results: this.replies
        .filter((row) => row.post_id === postId && parentIds.includes(row.parent_comment_id))
        .sort((a, b) => a.id - b.id) };
    }
    if (query.includes("from legacy_post_comment_reply_likes")) {
      const [viewerHash, ...rawIds] = params;
      const ids = rawIds.map(Number);
      const results = ids.map((id) => {
        const rows = this.replyLikes.filter((row) => row.reply_id === id);
        return { reply_id: id, like_count: rows.length, viewer_liked: rows.some((row) => row.voter_hash === viewerHash) ? 1 : 0 };
      }).filter((row) => row.like_count > 0);
      return { results };
    }
    return { results: [] };
  }

  async first(query, params) {
    if (query.includes("insert into story_rating_rate_limits")) {
      this.rateCount += 1;
      return { request_count: this.rateCount, window_started_at: params[1] };
    }
    if (query.includes("select count(*) as reply_count")) {
      const [postId, parentId] = params;
      return { reply_count: this.replies.filter((row) => row.post_id === postId && row.parent_comment_id === parentId).length };
    }
    if (query.includes("select id from legacy_post_comment_replies")) {
      const [id, postId] = params;
      const row = this.replies.find((reply) => reply.id === id && reply.post_id === postId);
      return row ? { id: row.id } : null;
    }
    if (query.includes("select count(*) as like_count") && query.includes("legacy_post_comment_likes")) {
      const [postId, commentId] = params;
      return { like_count: this.likes.filter((row) => row.post_id === postId && row.post_comment_id === commentId).length };
    }
    if (query.includes("select count(*) as like_count") && query.includes("legacy_post_comment_reply_likes")) {
      const [replyId] = params;
      return { like_count: this.replyLikes.filter((row) => row.reply_id === replyId).length };
    }
    if (query.includes("select 1 as liked") && query.includes("legacy_post_comment_likes")) {
      const [postId, commentId, voterHash] = params;
      return this.likes.some((row) => row.post_id === postId && row.post_comment_id === commentId && row.voter_hash === voterHash) ? { liked: 1 } : null;
    }
    if (query.includes("select 1 as liked") && query.includes("legacy_post_comment_reply_likes")) {
      const [replyId, voterHash] = params;
      return this.replyLikes.some((row) => row.reply_id === replyId && row.voter_hash === voterHash) ? { liked: 1 } : null;
    }
    return null;
  }

  async run(query, params) {
    if (query.startsWith("delete from story_rating_rate_limits")) return { meta: {} };
    if (query.startsWith("insert into legacy_post_comment_replies")) {
      const [postId, parentId, authorHash, body] = params;
      const id = this.nextReplyId++;
      this.replies.push({ id, post_id: postId, parent_comment_id: parentId, author_hash: authorHash, body, created_at: 1800000000 });
      return { meta: { last_row_id: id } };
    }
    if (query.startsWith("insert or ignore into legacy_post_comment_likes")) {
      const [postId, commentId, voterHash] = params;
      if (!this.likes.some((row) => row.post_id === postId && row.post_comment_id === commentId && row.voter_hash === voterHash)) {
        this.likes.push({ post_id: postId, post_comment_id: commentId, voter_hash: voterHash });
      }
      return { meta: {} };
    }
    if (query.startsWith("insert or ignore into legacy_post_comment_reply_likes")) {
      const [replyId, voterHash] = params;
      if (!this.replyLikes.some((row) => row.reply_id === replyId && row.voter_hash === voterHash)) {
        this.replyLikes.push({ reply_id: replyId, voter_hash: voterHash });
      }
      return { meta: {} };
    }
    if (query.startsWith("delete from legacy_post_comment_likes")) {
      const [postId, commentId, voterHash] = params;
      this.likes = this.likes.filter((row) => !(row.post_id === postId && row.post_comment_id === commentId && row.voter_hash === voterHash));
      return { meta: {} };
    }
    if (query.startsWith("delete from legacy_post_comment_reply_likes")) {
      const [replyId, voterHash] = params;
      this.replyLikes = this.replyLikes.filter((row) => !(row.reply_id === replyId && row.voter_hash === voterHash));
      return { meta: {} };
    }
    return { meta: {} };
  }
}

function installWorkerFixture(t, record = sourceComment) {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("https://comments.wala-katha.workers.dev/api/comments")) {
      const method = init?.method || "GET";
      calls.push({
        method,
        body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
      });
      return new Response(JSON.stringify([record]), {
        status: method === "POST" ? 201 : 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  return calls;
}

function makeRequest(path, method = "GET", body, origin = "https://www.walakatha.net") {
  const headers = { Cookie: "wk-rating-voter=" + TOKEN };
  if (method !== "GET") {
    headers.Origin = origin;
    headers["Content-Type"] = "application/json";
    headers["CF-Connecting-IP"] = "203.0.113.5";
  }
  return new Request("https://www.walakatha.net" + path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function context(request, db, commentId) {
  return { request, env: { DB: db }, params: { commentId } };
}

test("legacy post comments receive stable IDs and expose counts and likes", async (t) => {
  installWorkerFixture(t);
  const db = new MemoryD1();
  const parentId = await stablePostCommentId(POST_ID, sourceComment);
  const voterHash = await sha256("voter:" + TOKEN);
  db.likes.push({ post_id: POST_ID, post_comment_id: parentId, voter_hash: voterHash });
  db.replies.push({ id: 7, post_id: POST_ID, parent_comment_id: parentId, author_hash: voterHash, body: "පැරණි පිළිතුර", created_at: 1800000000 });

  const response = await getComments(context(makeRequest("/api/post-comments?postId=" + POST_ID), db));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.interactions_available, true);
  assert.equal(result.total_comments, 1);
  assert.equal(result.comments[0].id, parentId);
  assert.equal(result.comments[0].liked, true);
  assert.equal(result.comments[0].like_count, 1);
  assert.equal(result.comments[0].reply_count, 1);
  assert.equal(result.comments[0].replies[0].id, "r-7");
  assert.equal(result.comments[0].replies[0].is_mine, true);

  const firstVisitor = await getComments(context(
    new Request("https://www.walakatha.net/api/post-comments?postId=" + POST_ID),
    db,
  ));
  assert.match(firstVisitor.headers.get("Set-Cookie") || "", /Path=\/api\/post-comments;/);
});

test("same-origin post-comment proxy rejects links and forwards clean opinions only", async (t) => {
  const calls = installWorkerFixture(t);
  const db = new MemoryD1();

  const wrongOrigin = await postComments(context(
    makeRequest("/api/post-comments", "POST", {
      postId: POST_ID,
      content: "සාමාන්‍ය අදහස",
    }, "https://attacker.example"),
    db,
  ));
  assert.equal(wrongOrigin.status, 403);
  assert.equal(calls.length, 0);

  const rejected = await postComments(context(
    makeRequest("/api/post-comments", "POST", {
      postId: POST_ID,
      content: "මගේ අදහස https://example.com",
    }),
    db,
  ));
  assert.equal(rejected.status, 422);
  assert.deepEqual(await rejected.json(), { error: "links_not_allowed" });
  assert.equal(calls.length, 0, "rejected content must never reach the legacy Worker");
  assert.equal(db.rateCount, 0, "link attempts do not consume the clean-comment rate limit");

  const accepted = await postComments(context(
    makeRequest("/api/post-comments", "POST", {
      postId: POST_ID,
      content: "කතාව ගැන මගේ අදහස",
    }),
    db,
  ));
  assert.equal(accepted.status, 201);
  assert.deepEqual(calls, [{
    method: "POST",
    body: { postId: POST_ID, content: "කතාව ගැන මගේ අදහස" },
  }]);
  assert.equal(db.rateCount, 1);
});

test("post-comment API removes old links without changing stable IDs", async (t) => {
  const oldComment = {
    ...sourceComment,
    content: "පැරණි අදහස https://example.com",
  };
  installWorkerFixture(t, oldComment);
  const db = new MemoryD1();
  const parentId = await stablePostCommentId(POST_ID, oldComment);
  db.replies.push({
    id: 9,
    post_id: POST_ID,
    parent_comment_id: parentId,
    author_hash: "old-reader",
    body: "පිළිතුර www.example.org",
    created_at: 1_800_000_000,
  });

  const response = await getComments(context(
    makeRequest("/api/post-comments?postId=" + POST_ID),
    db,
  ));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.comments[0].id, parentId);
  assert.equal(data.comments[0].content, "පැරණි අදහස");
  assert.equal(data.comments[0].replies[0].content, "පිළිතුර");
  assert.doesNotMatch(JSON.stringify(data), /https:\/\/example\.com|www\.example\.org/);
});

test("readers can add a reply and toggle likes on both comment levels", async (t) => {
  installWorkerFixture(t);
  const db = new MemoryD1();
  const parentId = await stablePostCommentId(POST_ID, sourceComment);
  const replyResponse = await replyToComment(context(
    makeRequest("/api/post-comments/" + parentId + "/replies", "POST", { postId: POST_ID, body: "නව පිළිතුර" }),
    db,
    parentId,
  ));
  assert.equal(replyResponse.status, 201);
  const replyResult = await replyResponse.json();
  assert.equal(replyResult.reply.content, "නව පිළිතුර");
  assert.equal(replyResult.reply_count, 1);
  assert.equal(replyResult.reply.id, "r-8");

  const commentLike = await likeComment(context(
    makeRequest("/api/post-comments/" + parentId + "/like", "POST", { postId: POST_ID, liked: true }), db, parentId,
  ));
  assert.equal(commentLike.status, 200);
  assert.deepEqual(await commentLike.json(), { liked: true, like_count: 1 });
  const repeatedLike = await likeComment(context(
    makeRequest("/api/post-comments/" + parentId + "/like", "POST", { postId: POST_ID, liked: true }), db, parentId,
  ));
  assert.equal((await repeatedLike.json()).like_count, 1);

  const replyLike = await likeComment(context(
    makeRequest("/api/post-comments/r-8/like", "POST", { postId: POST_ID, liked: true }), db, "r-8",
  ));
  assert.equal(replyLike.status, 200);
  assert.deepEqual(await replyLike.json(), { liked: true, like_count: 1 });
});

test("post-comment replies reject links before storing them", async (t) => {
  installWorkerFixture(t);
  const db = new MemoryD1();
  const parentId = await stablePostCommentId(POST_ID, sourceComment);
  const response = await replyToComment(context(
    makeRequest("/api/post-comments/" + parentId + "/replies", "POST", {
      postId: POST_ID,
      body: "https://example.com",
    }),
    db,
    parentId,
  ));
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { error: "links_not_allowed" });
  assert.equal(db.replies.length, 0);
});

test("invalid origins, comments, and payloads cannot create interactions", async (t) => {
  installWorkerFixture(t);
  const db = new MemoryD1();
  const parentId = await stablePostCommentId(POST_ID, sourceComment);
  const badOrigin = await replyToComment(context(
    makeRequest("/api/post-comments/" + parentId + "/replies", "POST", { postId: POST_ID, body: "no" }, "https://evil.example"),
    db,
    parentId,
  ));
  assert.equal(badOrigin.status, 403);

  const unknownParent = await replyToComment(context(
    makeRequest("/api/post-comments/p-" + "0".repeat(64) + "/replies", "POST", { postId: POST_ID, body: "no" }),
    db,
    "p-" + "0".repeat(64),
  ));
  assert.equal(unknownParent.status, 404);
  assert.equal(db.replies.length, 0);
});
