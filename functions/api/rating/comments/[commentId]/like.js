import {
  enforceWriteRateLimit,
  hasJsonContentType,
  hasSameOrigin,
  jsonResponse,
  readJsonBody,
  readVoterToken,
  sha256,
  storySlugStatus,
} from "../../../../_shared/story-review-utils.js";

const MAX_BODY_BYTES = 512;

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  }

  const { request } = context;
  if (!hasSameOrigin(request)) return jsonResponse({ error: "origin_not_allowed" }, 403);
  if (!hasJsonContentType(request)) return jsonResponse({ error: "json_required" }, 415);

  const commentId = Number(context.params?.commentId);
  if (!Number.isSafeInteger(commentId) || commentId < 1) {
    return jsonResponse({ error: "invalid_comment" }, 400);
  }

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
  if (
    Object.keys(body).some((key) => !["storySlug", "liked"].includes(key)) ||
    typeof body.storySlug !== "string" ||
    (body.liked !== undefined && typeof body.liked !== "boolean")
  ) {
    return jsonResponse({ error: "invalid_comment" }, 400);
  }
  // Omitted `liked` keeps older callers' POST behavior: set the like to true.
  const shouldBeLiked = body.liked !== false;
  const slugStatus = storySlugStatus(body.storySlug);
  if (slugStatus === "invalid") return jsonResponse({ error: "invalid_story" }, 400);
  if (slugStatus === "missing") return jsonResponse({ error: "story_not_found" }, 404);

  const db = context.env?.DB;
  if (!db) return jsonResponse({ error: "reviews_unavailable" }, 503);
  const voterToken = readVoterToken(request);
  if (!voterToken) return jsonResponse({ error: "voter_cookie_required" }, 400);
  const voterHash = await sha256(`voter:${voterToken}`);

  try {
    const comment = await db
      .prepare("SELECT id FROM story_rating_comments WHERE id = ? AND story_slug = ? LIMIT 1")
      .bind(commentId, body.storySlug)
      .first();
    if (!comment) return jsonResponse({ error: "comment_not_found" }, 404);

    const rateLimitResponse = await enforceWriteRateLimit(request, db);
    if (rateLimitResponse) return rateLimitResponse;

    if (shouldBeLiked) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO story_rating_comment_likes (comment_id, voter_hash)
           VALUES (?, ?)`,
        )
        .bind(commentId, voterHash)
        .run();
    } else {
      await db
        .prepare(
          `DELETE FROM story_rating_comment_likes
           WHERE comment_id = ? AND voter_hash = ?`,
        )
        .bind(commentId, voterHash)
        .run();
    }

    const [countRow, viewerLike] = await Promise.all([
      db
        .prepare("SELECT COUNT(*) AS like_count FROM story_rating_comment_likes WHERE comment_id = ?")
        .bind(commentId)
        .first(),
      db
        .prepare(
          `SELECT 1 AS liked FROM story_rating_comment_likes
           WHERE comment_id = ? AND voter_hash = ? LIMIT 1`,
        )
        .bind(commentId, voterHash)
        .first(),
    ]);
    return jsonResponse({
      liked: Boolean(viewerLike),
      like_count: Number(countRow?.like_count) || 0,
    });
  } catch {
    return jsonResponse({ error: "reviews_unavailable" }, 500);
  }
}
