const MAX_INDEXED_TEXT_LENGTH = 1000;
const MAX_INDEXED_REVIEW_LENGTH = 500;
const MAX_INDEXED_REPLIES_PER_REVIEW = 20;

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
  const trimmed = value.trim();
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

      const date = renderDate(record.date ?? record.created_at);
      return [
        '<article class="p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-left shadow-sm" data-server-rendered-comment="post">',
        '<div class="flex items-center justify-between mb-1.5">',
        '<span class="text-xs font-bold text-[#01AD9F]">Anonymous Reader</span>',
        `<time class="text-[11px] text-white/30">${date}</time>`,
        "</div>",
        `<p class="text-sm text-white/80 leading-relaxed">${escapeHtml(body)}</p>`,
        "</article>",
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

  const replies = Array.isArray(record.replies)
    ? record.replies
        .slice(0, MAX_INDEXED_REPLIES_PER_REVIEW)
        .map((reply) => {
          const renderedReply = renderReview(reply, true);
          return renderedReply ? `<li>${renderedReply}</li>` : "";
        })
        .join("")
    : "";

  return `<li>${article}${replies ? `<ol class="story-comment-replies">${replies}</ol>` : ""}</li>`;
}

export function renderReviewComments(records) {
  if (!Array.isArray(records)) return "";
  return records.slice(0, 100).map((record) => renderReview(record)).join("");
}
