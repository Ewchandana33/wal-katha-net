import {
  createVoterToken,
  jsonResponse,
  readVoterToken,
  sha256,
  storySlugStatus,
  voterCookieHeader,
} from "../_shared/story-review-utils.js";
import {
  fetchPublicPostComments,
  preparePostComments,
} from "../_shared/legacy-post-comments.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return jsonResponse({ error: "method_not_allowed" }, 405, { Allow: "GET" });
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
