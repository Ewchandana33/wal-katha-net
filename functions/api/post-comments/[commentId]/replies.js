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
import { containsDisallowedLink } from "../../../../shared/comment-link-policy.js";
import {
  fetchPublicPostComments,
  stablePostCommentId,
} from "../../../_shared/legacy-post-comments.js";

const MAX_BODY_BYTES = 2048;
const MAX_REPLY_LENGTH = 1000;
const PARENT_ID_PATTERN = /^p-[a-f0-9]{64}$/;

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  }
  const { request } = context;
  if (!hasSameOrigin(request)) return jsonResponse({ error: "origin_not_allowed" }, 403);
  if (!hasJsonContentType(request)) return jsonResponse({ error: "json_required" }, 415);
  const parentId = String(context.params?.commentId || "");
  if (!PARENT_ID_PATTERN.test(parentId)) return jsonResponse({ error: "invalid_comment" }, 400);

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
  if (Object.keys(body).some((key) => !["postId", "body"].includes(key)) || typeof body.postId !== "string" || typeof body.body !== "string") {
    return jsonResponse({ error: "invalid_comment" }, 400);
  }
  const slugStatus = storySlugStatus(body.postId);
  if (slugStatus === "invalid") return jsonResponse({ error: "invalid_story" }, 400);
  if (slugStatus === "missing") return jsonResponse({ error: "story_not_found" }, 404);
  const text = body.body.trim();
  if (!text || Array.from(text).length > MAX_REPLY_LENGTH) return jsonResponse({ error: "invalid_comment" }, 400);
  if (containsDisallowedLink(text)) return jsonResponse({ error: "links_not_allowed" }, 422);

  const db = context.env?.DB;
  if (!db) return jsonResponse({ error: "comments_unavailable" }, 503);
  try {
    const sourceComments = await fetchPublicPostComments(body.postId);
    let parentExists = false;
    for (const comment of sourceComments) {
      if (await stablePostCommentId(body.postId, comment) === parentId) {
        parentExists = true;
        break;
      }
    }
    if (!parentExists) return jsonResponse({ error: "comment_not_found" }, 404);

    const currentToken = readVoterToken(request);
    const token = currentToken || createVoterToken();
    const voterHash = await sha256("voter:" + token);
    const rateLimitResponse = await enforceWriteRateLimit(request, db);
    if (rateLimitResponse) return rateLimitResponse;
    const inserted = await db.prepare(
      "INSERT INTO legacy_post_comment_replies (post_id, parent_comment_id, author_hash, body) VALUES (?, ?, ?, ?)",
    ).bind(body.postId, parentId, voterHash, text).run();
    const id = Number(inserted.meta?.last_row_id);
    if (!Number.isSafeInteger(id) || id < 1) throw new Error("reply_id_unavailable");
    const row = await db.prepare(
      "SELECT COUNT(*) AS reply_count FROM legacy_post_comment_replies WHERE post_id = ? AND parent_comment_id = ?",
    ).bind(body.postId, parentId).first();
    const headers = currentToken ? {} : { "Set-Cookie": voterCookieHeader(token, "/api/post-comments") };
    return jsonResponse({
      reply: {
        id: "r-" + String(id),
        content: text,
        created_at: Math.floor(Date.now() / 1000),
        like_count: 0,
        liked: false,
        is_mine: true,
      },
      reply_count: Number(row?.reply_count) || 1,
    }, 201, headers);
  } catch {
    return jsonResponse({ error: "comments_unavailable" }, 503);
  }
}
