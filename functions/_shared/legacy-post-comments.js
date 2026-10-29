import { sha256 } from "./story-review-utils.js";
import { sanitizeCommentText } from "../../shared/comment-link-policy.js";

export const PUBLIC_POST_COMMENTS_API = "https://comments.wala-katha.workers.dev/api/comments";
const MAX_PUBLIC_POST_COMMENTS = 100;

export async function fetchPublicPostComments(storySlug) {
  const url = new URL(PUBLIC_POST_COMMENTS_API);
  url.searchParams.set("postId", storySlug);
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("post_comments_unavailable");
  const records = await response.json();
  if (!Array.isArray(records)) throw new Error("invalid_post_comments");
  return records.slice(0, MAX_PUBLIC_POST_COMMENTS).filter((record) =>
    record && typeof record.content === "string" && record.content.trim(),
  );
}

export async function stablePostCommentId(postId, record) {
  const legacyId = record?.id == null ? "" : String(record.id).trim();
  const identity = legacyId
    ? [postId, "id", legacyId]
    : [postId, "content", String(record?.created_at ?? record?.date ?? ""), String(record?.content ?? "")];
  return "p-" + await sha256(JSON.stringify(identity));
}

function emptyInteractionState(record, id) {
  return {
    id,
    content: sanitizeCommentText(String(record.content).slice(0, 1000)),
    date: typeof record.date === "string" ? record.date.slice(0, 80) : "",
    created_at: record.created_at ?? null,
    like_count: 0,
    liked: false,
    reply_count: 0,
    replies: [],
  };
}

export async function preparePostComments(db, postId, records, voterHash = "") {
  const source = Array.isArray(records) ? records.slice(0, MAX_PUBLIC_POST_COMMENTS) : [];
  const comments = await Promise.all(source
    .filter((record) => record && typeof record.content === "string" && record.content.trim())
    .map(async (record) => emptyInteractionState(record, await stablePostCommentId(postId, record))));
  if (!db || comments.length === 0) return { comments, interactionsAvailable: false };

  const commentIds = comments.map((comment) => comment.id);
  const placeholders = commentIds.map(() => "?").join(", ");
  try {
    const [likeResult, replyResult] = await Promise.all([
      db.prepare(
        "SELECT post_comment_id, COUNT(*) AS like_count, " +
        "MAX(CASE WHEN voter_hash = ? THEN 1 ELSE 0 END) AS viewer_liked " +
        "FROM legacy_post_comment_likes WHERE post_id = ? AND post_comment_id IN (" + placeholders + ") " +
        "GROUP BY post_comment_id",
      ).bind(voterHash || "", postId, ...commentIds).all(),
      db.prepare(
        "SELECT id, parent_comment_id, body, author_hash, created_at " +
        "FROM legacy_post_comment_replies WHERE post_id = ? AND parent_comment_id IN (" + placeholders + ") " +
        "ORDER BY parent_comment_id ASC, id ASC",
      ).bind(postId, ...commentIds).all(),
    ]);
    const likesByComment = new Map((likeResult.results || []).map((row) => [String(row.post_comment_id), row]));
    const repliesByComment = new Map(commentIds.map((id) => [id, []]));
    for (const row of replyResult.results || []) {
      const replies = repliesByComment.get(String(row.parent_comment_id));
      if (replies) replies.push(row);
    }

    const replyIds = (replyResult.results || []).map((row) => Number(row.id)).filter(Number.isSafeInteger);
    const likesByReply = new Map();
    if (replyIds.length > 0) {
      const replyPlaceholders = replyIds.map(() => "?").join(", ");
      const replyLikes = await db.prepare(
        "SELECT reply_id, COUNT(*) AS like_count, " +
        "MAX(CASE WHEN voter_hash = ? THEN 1 ELSE 0 END) AS viewer_liked " +
        "FROM legacy_post_comment_reply_likes WHERE reply_id IN (" + replyPlaceholders + ") " +
        "GROUP BY reply_id",
      ).bind(voterHash || "", ...replyIds).all();
      for (const row of replyLikes.results || []) likesByReply.set(Number(row.reply_id), row);
    }

    return {
      interactionsAvailable: true,
      comments: comments.map((comment) => {
        const like = likesByComment.get(comment.id);
        const replyRows = repliesByComment.get(comment.id) || [];
        return {
          ...comment,
          like_count: Number(like?.like_count) || 0,
          liked: Number(like?.viewer_liked) === 1 || like?.viewer_liked === true,
          reply_count: replyRows.length,
          replies: replyRows.map((row) => {
            const replyLike = likesByReply.get(Number(row.id));
            return {
              id: "r-" + String(row.id),
              content: sanitizeCommentText(String(row.body).slice(0, 1000)),
              created_at: Number(row.created_at) || 0,
              like_count: Number(replyLike?.like_count) || 0,
              liked: Number(replyLike?.viewer_liked) === 1 || replyLike?.viewer_liked === true,
              is_mine: Boolean(voterHash) && row.author_hash === voterHash,
            };
          }),
        };
      }),
    };
  } catch {
    return { comments, interactionsAvailable: false };
  }
}
