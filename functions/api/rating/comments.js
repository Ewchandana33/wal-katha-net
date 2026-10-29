import {
  createVoterToken,
  enforceWriteRateLimit,
  hasJsonContentType,
  hasSameOrigin,
  jsonResponse,
  MAX_REVIEW_COMMENT_LENGTH,
  readJsonBody,
  readVoterToken,
  sha256,
  storySlugStatus,
  voterCookieHeader,
} from "../../_shared/story-review-utils.js";
import { containsDisallowedLink, sanitizeCommentText } from "../../../shared/comment-link-policy.js";

const MAX_BODY_BYTES = 4096;
const COMMENT_PAGE_SIZE = 20;

function databaseFor(context) {
  return context.env?.DB;
}

async function getCommentCount(db, storySlug) {
  const row = await db
    .prepare("SELECT COUNT(*) AS comment_count FROM story_rating_comments WHERE story_slug = ?")
    .bind(storySlug)
    .first();
  return Number(row?.comment_count) || 0;
}

function publicComment(row) {
  return {
    id: Number(row.id),
    body: sanitizeCommentText(String(row.body)),
    created_at: Number(row.created_at),
    like_count: Number(row.like_count) || 0,
    liked: Number(row.viewer_liked) === 1 || row.viewer_liked === true,
    is_mine: Number(row.is_mine) === 1 || row.is_mine === true,
  };
}

async function handleGet(context) {
  const url = new URL(context.request.url);
  const storySlug = url.searchParams.get("story");
  const slugStatus = storySlugStatus(storySlug);
  if (slugStatus === "invalid") return jsonResponse({ error: "invalid_story" }, 400);
  if (slugStatus === "missing") return jsonResponse({ error: "story_not_found" }, 404);

  const db = databaseFor(context);
  if (!db) return jsonResponse({ error: "reviews_unavailable" }, 503);

  try {
    const commentCount = await getCommentCount(db, storySlug);
    if (url.searchParams.get("countOnly") === "1") {
      return jsonResponse({ total_comments: commentCount });
    }

    const beforeValue = url.searchParams.get("before");
    const before = beforeValue === null ? null : Number(beforeValue);
    if (before !== null && (!Number.isSafeInteger(before) || before < 1)) {
      return jsonResponse({ error: "invalid_cursor" }, 400);
    }

    const currentToken = readVoterToken(context.request);
    const voterToken = currentToken || createVoterToken();
    const voterHash = await sha256(`voter:${voterToken}`);
    const result = await db
      .prepare(
        `SELECT c.id, c.body, c.created_at,
                (SELECT COUNT(*) FROM story_rating_comment_likes l WHERE l.comment_id = c.id) AS like_count,
                EXISTS(
                  SELECT 1 FROM story_rating_comment_likes l
                  WHERE l.comment_id = c.id AND l.voter_hash = ?
                ) AS viewer_liked,
                (c.author_hash = ?) AS is_mine
         FROM story_rating_comments c
         WHERE c.story_slug = ? AND c.parent_id IS NULL
           AND (? IS NULL OR c.id < ?)
         ORDER BY c.id DESC
         LIMIT ?`,
      )
      .bind(voterHash, voterHash, storySlug, before, before, COMMENT_PAGE_SIZE + 1)
      .all();

    const rows = result.results || [];
    const hasMore = rows.length > COMMENT_PAGE_SIZE;
    const topLevelRows = rows.slice(0, COMMENT_PAGE_SIZE);
    const parentIds = topLevelRows.map((row) => Number(row.id));
    const repliesByParent = new Map(parentIds.map((id) => [id, []]));

    if (parentIds.length > 0) {
      const placeholders = parentIds.map(() => "?").join(", ");
      const replies = await db
        .prepare(
          `SELECT c.id, c.parent_id, c.body, c.created_at,
                  (SELECT COUNT(*) FROM story_rating_comment_likes l WHERE l.comment_id = c.id) AS like_count,
                  EXISTS(
                    SELECT 1 FROM story_rating_comment_likes l
                    WHERE l.comment_id = c.id AND l.voter_hash = ?
                  ) AS viewer_liked,
                  (c.author_hash = ?) AS is_mine
           FROM story_rating_comments c
           WHERE c.story_slug = ? AND c.parent_id IN (${placeholders})
           ORDER BY c.parent_id ASC, c.id ASC`,
        )
        .bind(voterHash, voterHash, storySlug, ...parentIds)
        .all();

      for (const row of replies.results || []) {
        repliesByParent.get(Number(row.parent_id))?.push(publicComment(row));
      }
    }

    const comments = topLevelRows.map((row) => ({
      ...publicComment(row),
      replies: repliesByParent.get(Number(row.id)) || [],
    }));
    const headers = currentToken ? {} : { "Set-Cookie": voterCookieHeader(voterToken) };
    return jsonResponse(
      {
        total_comments: commentCount,
        comments,
        has_more: hasMore,
        next_cursor: hasMore ? String(topLevelRows.at(-1)?.id || "") : null,
      },
      200,
      headers,
    );
  } catch {
    return jsonResponse({ error: "reviews_unavailable" }, 500);
  }
}

async function handlePost(context) {
  const { request } = context;
  if (!hasSameOrigin(request)) return jsonResponse({ error: "origin_not_allowed" }, 403);
  if (!hasJsonContentType(request)) return jsonResponse({ error: "json_required" }, 415);

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
  const commentText = typeof body.body === "string" ? body.body.trim() : "";
  if (
    Object.keys(body).some((key) => !["storySlug", "parentId", "body"].includes(key)) ||
    typeof body.storySlug !== "string" ||
    !Number.isSafeInteger(body.parentId) ||
    body.parentId < 1 ||
    typeof body.body !== "string" ||
    Array.from(commentText).length < 1 ||
    Array.from(commentText).length > MAX_REVIEW_COMMENT_LENGTH
  ) {
    return jsonResponse({ error: "invalid_comment" }, 400);
  }
  if (containsDisallowedLink(commentText)) {
    return jsonResponse({ error: "links_not_allowed" }, 422);
  }

  const slugStatus = storySlugStatus(body.storySlug);
  if (slugStatus === "invalid") return jsonResponse({ error: "invalid_story" }, 400);
  if (slugStatus === "missing") return jsonResponse({ error: "story_not_found" }, 404);

  const db = databaseFor(context);
  if (!db) return jsonResponse({ error: "reviews_unavailable" }, 503);
  const voterToken = readVoterToken(request);
  if (!voterToken) return jsonResponse({ error: "voter_cookie_required" }, 400);
  const voterHash = await sha256(`voter:${voterToken}`);

  try {
    const parent = await db
      .prepare(
        `SELECT id FROM story_rating_comments
         WHERE id = ? AND story_slug = ? AND parent_id IS NULL
         LIMIT 1`,
      )
      .bind(body.parentId, body.storySlug)
      .first();
    if (!parent) return jsonResponse({ error: "comment_not_found" }, 404);

    const rateLimitResponse = await enforceWriteRateLimit(request, db);
    if (rateLimitResponse) return rateLimitResponse;

    const inserted = await db
      .prepare(
        `INSERT INTO story_rating_comments
          (story_slug, author_hash, review_voter_hash, parent_id, body)
         VALUES (?, ?, NULL, ?, ?)`,
      )
      .bind(body.storySlug, voterHash, body.parentId, commentText)
      .run();

    return jsonResponse(
      {
        comment: {
          id: Number(inserted.meta?.last_row_id) || null,
          parent_id: body.parentId,
          body: commentText,
          created_at: Math.floor(Date.now() / 1000),
        },
        total_comments: await getCommentCount(db, body.storySlug),
      },
      201,
    );
  } catch {
    return jsonResponse({ error: "reviews_unavailable" }, 500);
  }
}

export async function onRequest(context) {
  if (context.request.method === "GET") return handleGet(context);
  if (context.request.method === "POST") return handlePost(context);
  return jsonResponse(
    { error: "method_not_allowed" },
    405,
    { Allow: "GET, POST" },
  );
}
