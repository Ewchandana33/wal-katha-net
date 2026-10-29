import { sanitizeCommentText } from "../../shared/comment-link-policy.js";

const MAX_INDEXED_TEXT_LENGTH = 1000;
const MAX_INDEXED_REVIEW_LENGTH = 500;
const MAX_INDEXED_REPLIES_PER_REVIEW = 100;
const MAX_INDEXED_POST_REPLIES = 100;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[character];
  });
}

function boundedText(value, maximumLength) {
  if (typeof value !== "string") return "";
  const trimmed = sanitizeCommentText(value);
  return Array.from(trimmed).slice(0, maximumLength).join("");
}

function renderDate(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const raw = String(value).trim().slice(0, 80);
  const numeric = Number(raw);
  const timestamp =
    Number.isFinite(numeric) && /^\d{9,13}$/.test(raw)
      ? numeric < 1_000_000_000_000
        ? numeric * 1000
        : numeric
      : Date.parse(raw);

  if (Number.isFinite(timestamp)) {
    try {
      return escapeHtml(
        new Intl.DateTimeFormat("si-LK", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(timestamp)),
      );
    } catch {
      // Fall back to the escaped source value if the runtime lacks this locale.
    }
  }

  return escapeHtml(raw);
}

export function renderPostComments(records) {
  if (!Array.isArray(records)) return "";

  return records
    .slice(0, 100)
    .map((record) => {
      const body = boundedText(record?.content, MAX_INDEXED_TEXT_LENGTH);
      if (!body) return "";
      const id = typeof record.id === "string" && /^p-[a-f0-9]{64}$/.test(record.id) ? record.id : "";
      const date = renderDate(record.date ?? record.created_at);
      const replyCount = Math.max(0, Number(record.reply_count) || (Array.isArray(record.replies) ? record.replies.length : 0));
      const replies = Array.isArray(record.replies)
        ? record.replies.slice(0, MAX_INDEXED_POST_REPLIES).map((reply) => {
            const replyBody = boundedText(reply?.content ?? reply?.body, MAX_INDEXED_TEXT_LENGTH);
            if (!replyBody) return "";
            const replyId = typeof reply.id === "string" && /^r-[1-9][0-9]{0,14}$/.test(reply.id) ? reply.id : "";
            const replyDate = renderDate(reply.created_at ?? reply.date);
            return [
              '<li><article class="post-comment-reply" data-server-rendered-comment="post-reply" data-comment-id="' + escapeHtml(replyId) + '">',
              '<div class="post-comment-meta"><span>Anonymous Reader</span><time>' + replyDate + '</time></div>',
              '<p>' + escapeHtml(replyBody) + '</p>',
              '</article></li>',
            ].join("");
          }).join("")
        : "";
      const disclosure = [
        '<details class="post-comment-replies" data-post-replies>',
        '<summary>පිළිතුරු ' + String(replyCount) + '</summary>',
        '<ol class="post-comment-reply-list">' + replies + '</ol>',
        '</details>',
      ].join("");
      return [
        '<article class="post-comment-card" data-server-rendered-comment="post" data-comment-id="' + escapeHtml(id) + '">',
        '<div class="post-comment-meta"><span>Anonymous Reader</span><time>' + date + '</time></div>',
        '<p class="post-comment-body">' + escapeHtml(body) + '</p>',
        disclosure,
        '</article>',
      ].join("");
    })
    .join("");
}

function renderReview(record, isReply = false) {
  const body = boundedText(record?.body, MAX_INDEXED_REVIEW_LENGTH);
  if (!body) return "";

  const date = renderDate(record.created_at);
  const article = [
    '<article class="story-comment" data-server-rendered-comment="review">',
    '<div class="story-comment-header">',
    '<span class="story-comment-author">නිර්නාමික පාඨකයෙක්</span>',
    `<time class="story-comment-date">${date}</time>`,
    "</div>",
    `<p class="story-comment-body">${escapeHtml(body)}</p>`,
    "</article>",
  ].join("");

  if (isReply) return article;

  const replyCount = Math.max(
    Number(record.reply_count) || 0,
    Array.isArray(record.replies) ? record.replies.length : 0,
  );
  const replies = Array.isArray(record.replies)
    ? record.replies
        .slice(0, MAX_INDEXED_REPLIES_PER_REVIEW)
        .map((reply) => {
          const renderedReply = renderReview(reply, true);
          return renderedReply ? "<li>" + renderedReply + "</li>" : "";
        })
        .join("")
    : "";
  const disclosure = [
    '<details class="story-comment-reply-disclosure" data-review-replies>',
    '<summary>පිළිතුරු ' + String(replyCount) + '</summary>',
    '<ol class="story-comment-replies">' + replies + '</ol>',
    '</details>',
  ].join("");

  return "<li>" + article + disclosure + "</li>";
}

export function renderReviewComments(records) {
  if (!Array.isArray(records)) return "";
  return records.slice(0, 100).map((record) => renderReview(record)).join("");
}
