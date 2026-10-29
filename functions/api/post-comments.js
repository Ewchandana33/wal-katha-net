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
} from "../_shared/story-review-utils.js";
import { containsDisallowedLink } from "../../shared/comment-link-policy.js";
import {
  PUBLIC_POST_COMMENTS_API,
  fetchPublicPostComments,
  preparePostComments,
} from "../_shared/legacy-post-comments.js";

const MAX_BODY_BYTES = 8192;
const MAX_COMMENT_LENGTH = 1000;

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
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (
    Object.keys(body).some((key) => !["postId", "content", "date"].includes(key)) ||
    typeof body.postId !== "string" ||
    typeof body.content !== "string" ||
    !content ||
    Array.from(content).length > MAX_COMMENT_LENGTH ||
    (body.date !== undefined && (typeof body.date !== "string" || body.date.length > 80))
  ) {
    return jsonResponse({ error: "invalid_comment" }, 400);
  }

  const slugStatus = storySlugStatus(body.postId);
  if (slugStatus === "invalid") return jsonResponse({ error: "invalid_story" }, 400);
  if (slugStatus === "missing") return jsonResponse({ error: "story_not_found" }, 404);
  if (containsDisallowedLink(content)) {
    return jsonResponse({ error: "links_not_allowed" }, 422);
  }

  const db = context.env?.DB;
  if (!db) return jsonResponse({ error: "comments_unavailable" }, 503);
  const rateLimitResponse = await enforceWriteRateLimit(request, db);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const upstream = await fetch(PUBLIC_POST_COMMENTS_API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId: body.postId,
        content,
        ...(body.date === undefined ? {} : { date: body.date }),
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!upstream.ok) return jsonResponse({ error: "comment_unavailable" }, 502);
    return jsonResponse({ created: true }, 201);
  } catch {
    return jsonResponse({ error: "comment_unavailable" }, 502);
  }
}

export async function onRequest(context) {
  if (context.request.method === "POST") return handlePost(context);
  if (context.request.method !== "GET") {
    return jsonResponse({ error: "method_not_allowed" }, 405, { Allow: "GET, POST" });
  }
  const url = new URL(context.request.url);
  const postId = url.searchParams.get("postId");
  const slugStatus = storySlugStatus(postId);
  if (slugStatus === "invalid") return jsonResponse({ error: "invalid_story" }, 400);
  if (slugStatus === "missing") return jsonResponse({ error: "story_not_found" }, 404);

  try {
    const records = await fetchPublicPostComments(postId);
    const db = context.env?.DB;
    const currentToken = readVoterToken(context.request);
    const token = currentToken || (db ? createVoterToken() : "");
    const voterHash = token ? await sha256("voter:" + token) : "";
    const prepared = await preparePostComments(db, postId, records, voterHash);
    const headers = token && !currentToken
      ? { "Set-Cookie": voterCookieHeader(token, "/api/post-comments") }
      : {};
    return jsonResponse({
      total_comments: prepared.comments.length,
      comments: prepared.comments,
      interactions_available: prepared.interactionsAvailable,
    }, 200, headers);
  } catch {
    return jsonResponse({ error: "comments_unavailable" }, 502);
  }
}
