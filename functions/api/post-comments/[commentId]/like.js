import {
  createVoterToken,
  enforceWriteRateLimit,
  hasJsonContentType,
  hasSameOrigin,
  jsonResponse,
  readJsonBody,
  readVoterToken,
  sha256,
  storySlugStatus,
  voterCookieHeader,
} from "../../../_shared/story-review-utils.js";
import {
  fetchPublicPostComments,
  stablePostCommentId,
} from "../../../_shared/legacy-post-comments.js";

const MAX_BODY_BYTES = 512;
const PARENT_ID_PATTERN = /^p-[a-f0-9]{64}$/;
const REPLY_ID_PATTERN = /^r-[1-9][0-9]{0,14}$/;

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  }
  const { request } = context;
  if (!hasSameOrigin(request)) return jsonResponse({ error: "origin_not_allowed" }, 403);
  if (!hasJsonContentType(request)) return jsonResponse({ error: "json_required" }, 415);
  const commentId = String(context.params?.commentId || "");
  const isParent = PARENT_ID_PATTERN.test(commentId);
  const isReply = REPLY_ID_PATTERN.test(commentId);
  if (!isParent && !isReply) return jsonResponse({ error: "invalid_comment" }, 400);

  let parsed;
  try {
    parsed = await readJsonBody(request, MAX_BODY_BYTES);
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  if (parsed.error === "too_large") return jsonResponse({ error: "body_too_large" }, 413);
  if (parsed.error || !parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  const body = parsed.value;
  if (Object.keys(body).some((key) => !["postId", "liked"].includes(key)) || typeof body.postId !== "string" || typeof body.liked !== "boolean") {
    return jsonResponse({ error: "invalid_comment" }, 400);
  }
  const slugStatus = storySlugStatus(body.postId);
  if (slugStatus === "invalid") return jsonResponse({ error: "invalid_story" }, 400);
  if (slugStatus === "missing") return jsonResponse({ error: "story_not_found" }, 404);
  const db = context.env?.DB;
  if (!db) return jsonResponse({ error: "comments_unavailable" }, 503);

  try {
    if (isParent) {
      const sourceComments = await fetchPublicPostComments(body.postId);
      let exists = false;
      for (const comment of sourceComments) {
        if (await stablePostCommentId(body.postId, comment) === commentId) {
          exists = true;
          break;
        }
      }
      if (!exists) return jsonResponse({ error: "comment_not_found" }, 404);
    } else {
      const replyId = Number(commentId.slice(2));
      const reply = await db.prepare(
        "SELECT id FROM legacy_post_comment_replies WHERE id = ? AND post_id = ? LIMIT 1",
      ).bind(replyId, body.postId).first();
      if (!reply) return jsonResponse({ error: "comment_not_found" }, 404);
    }

    const currentToken = readVoterToken(request);
    const token = currentToken || createVoterToken();
    const voterHash = await sha256("voter:" + token);
    const rateLimitResponse = await enforceWriteRateLimit(request, db);
    if (rateLimitResponse) return rateLimitResponse;
    const table = isParent ? "legacy_post_comment_likes" : "legacy_post_comment_reply_likes";
    const targetId = isParent ? commentId : Number(commentId.slice(2));
    if (body.liked) {
      const columns = isParent ? "post_id, post_comment_id, voter_hash" : "reply_id, voter_hash";
      const values = isParent ? "?, ?, ?" : "?, ?";
      const params = isParent ? [body.postId, targetId, voterHash] : [targetId, voterHash];
      await db.prepare("INSERT OR IGNORE INTO " + table + " (" + columns + ") VALUES (" + values + ")").bind(...params).run();
    } else {
      const sql = isParent
        ? "DELETE FROM " + table + " WHERE post_id = ? AND post_comment_id = ? AND voter_hash = ?"
        : "DELETE FROM " + table + " WHERE reply_id = ? AND voter_hash = ?";
      const params = isParent ? [body.postId, targetId, voterHash] : [targetId, voterHash];
      await db.prepare(sql).bind(...params).run();
    }
    const countSql = isParent
      ? "SELECT COUNT(*) AS like_count FROM " + table + " WHERE post_id = ? AND post_comment_id = ?"
      : "SELECT COUNT(*) AS like_count FROM " + table + " WHERE reply_id = ?";
    const viewerSql = isParent
      ? "SELECT 1 AS liked FROM " + table + " WHERE post_id = ? AND post_comment_id = ? AND voter_hash = ? LIMIT 1"
      : "SELECT 1 AS liked FROM " + table + " WHERE reply_id = ? AND voter_hash = ? LIMIT 1";
    const targetParams = isParent ? [body.postId, targetId] : [targetId];
    const viewerParams = isParent ? [body.postId, targetId, voterHash] : [targetId, voterHash];
    const [count, viewerLike] = await Promise.all([
      db.prepare(countSql).bind(...targetParams).first(),
      db.prepare(viewerSql).bind(...viewerParams).first(),
    ]);
    const headers = currentToken ? {} : { "Set-Cookie": voterCookieHeader(token, "/api/post-comments") };
    return jsonResponse({ liked: Boolean(viewerLike), like_count: Number(count?.like_count) || 0 }, 200, headers);
  } catch {
    return jsonResponse({ error: "comments_unavailable" }, 503);
  }
}
