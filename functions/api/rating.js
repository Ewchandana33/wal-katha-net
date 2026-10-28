import { PUBLISHED_STORY_SLUGS } from "../_shared/published-story-slugs.generated.js";

const COOKIE_NAME = "wk-rating-voter";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const RATE_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT = 20;
const RATE_LIMIT_RETENTION_SECONDS = 24 * 60 * 60;
const MAX_BODY_BYTES = 4096;
const MAX_COMMENT_LENGTH = 500;

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  const headers = new Headers(JSON_HEADERS);
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return new Response(JSON.stringify(body), { status, headers });
}

function storySlugStatus(value) {
  if (typeof value !== "string" || value.length > 120) return "invalid";
  if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(value)) return "invalid";
  return PUBLISHED_STORY_SLUGS.has(value) ? "published" : "missing";
}

function readCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const item of cookieHeader.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() !== name) continue;
    const value = item.slice(separator + 1).trim();
    return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
  }
  return null;
}

function createVoterToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function cookieHeader(token) {
  return `${COOKIE_NAME}=${token}; Path=/api/rating; Max-Age=${COOKIE_MAX_AGE}; Secure; HttpOnly; SameSite=Lax`;
}

function databaseFor(context) {
  return context.env?.DB;
}

async function loadStatistics(db, storySlug) {
  const result = await db
    .prepare(
      `SELECT rating, COUNT(*) AS vote_count
       FROM story_ratings
       WHERE story_slug = ?
       GROUP BY rating`,
    )
    .bind(storySlug)
    .all();

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of result.results || []) {
    const rating = Number(row.rating);
    const count = Number(row.vote_count);
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5 && Number.isSafeInteger(count) && count > 0) {
      counts[rating] = count;
    }
  }

  const totalVotes = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const totalStars = Object.entries(counts).reduce(
    (sum, [rating, count]) => sum + Number(rating) * count,
    0,
  );

  return {
    average_rating: totalVotes === 0 ? 0 : Number((totalStars / totalVotes).toFixed(1)),
    total_votes: totalVotes,
    total_stars: totalStars,
    rating_counts: counts,
  };
}

async function getVoterRating(db, storySlug, voterHash) {
  const row = await db
    .prepare("SELECT rating FROM story_ratings WHERE story_slug = ? AND voter_hash = ? LIMIT 1")
    .bind(storySlug, voterHash)
    .first();
  return row ? Number(row.rating) : null;
}

async function handleGet(context) {
  const requestUrl = new URL(context.request.url);
  const storySlug = requestUrl.searchParams.get("story");
  const slugStatus = storySlugStatus(storySlug);
  if (slugStatus === "invalid") return jsonResponse({ error: "invalid_story" }, 400);
  if (slugStatus === "missing") return jsonResponse({ error: "story_not_found" }, 404);

  const db = databaseFor(context);
  if (!db) return jsonResponse({ error: "ratings_unavailable" }, 503);

  const currentToken = readCookie(context.request, COOKIE_NAME);
  const voterToken = currentToken || createVoterToken();
  const voterHash = await sha256(`voter:${voterToken}`);

  try {
    const [statistics, userRating] = await Promise.all([
      loadStatistics(db, storySlug),
      getVoterRating(db, storySlug, voterHash),
    ]);
    const headers = currentToken ? {} : { "Set-Cookie": cookieHeader(voterToken) };
    return jsonResponse(
      {
        ...statistics,
        has_voted: userRating !== null,
        user_rating: userRating,
      },
      200,
      headers,
    );
  } catch {
    return jsonResponse({ error: "ratings_unavailable" }, 500);
  }
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return { error: "too_large" };
  }

  if (!request.body) return { error: "invalid_json" };
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return { error: "too_large" };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { error: "invalid_json" };
  }
}

async function recordRateLimit(db, ipHash, now) {
  await db
    .prepare("DELETE FROM story_rating_rate_limits WHERE window_started_at < ?")
    .bind(now - RATE_LIMIT_RETENTION_SECONDS)
    .run();

  return db
    .prepare(
      `INSERT INTO story_rating_rate_limits (voter_hash, window_started_at, request_count)
       VALUES (?, ?, 1)
       ON CONFLICT(voter_hash) DO UPDATE SET
         window_started_at = CASE
           WHEN story_rating_rate_limits.window_started_at <= ? THEN ?
           ELSE story_rating_rate_limits.window_started_at
         END,
         request_count = CASE
           WHEN story_rating_rate_limits.window_started_at <= ? THEN 1
           ELSE story_rating_rate_limits.request_count + 1
         END
       RETURNING request_count, window_started_at`,
    )
    .bind(
      ipHash,
      now,
      now - RATE_WINDOW_SECONDS,
      now,
      now - RATE_WINDOW_SECONDS,
    )
    .first();
}

async function handlePost(context) {
  const { request } = context;
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return jsonResponse({ error: "origin_not_allowed" }, 403);
  }

  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type") || "")) {
    return jsonResponse({ error: "json_required" }, 415);
  }

  let parsed;
  try {
    parsed = await readJsonBody(request);
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }
  if (parsed.error === "too_large") return jsonResponse({ error: "body_too_large" }, 413);
  if (parsed.error || !parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const body = parsed.value;
  const commentText = typeof body.comment === "string" ? body.comment.trim() : "";
  const commentLength = Array.from(commentText).length;
  if (
    Object.keys(body).some((key) => !["storySlug", "rating", "comment"].includes(key)) ||
    typeof body.storySlug !== "string" ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5 ||
    (Object.hasOwn(body, "comment") &&
      (typeof body.comment !== "string" || commentLength > MAX_COMMENT_LENGTH))
  ) {
    return jsonResponse({ error: "invalid_rating" }, 400);
  }

  const slugStatus = storySlugStatus(body.storySlug);
  if (slugStatus === "invalid") return jsonResponse({ error: "invalid_story" }, 400);
  if (slugStatus === "missing") return jsonResponse({ error: "story_not_found" }, 404);

  const db = databaseFor(context);
  if (!db) return jsonResponse({ error: "ratings_unavailable" }, 503);

  const voterToken = readCookie(request, COOKIE_NAME);
  if (!voterToken) return jsonResponse({ error: "voter_cookie_required" }, 400);
  const clientIp = request.headers.get("CF-Connecting-IP");
  if (!clientIp || clientIp.length > 45) {
    return jsonResponse({ error: "request_identity_unavailable" }, 503);
  }

  try {
    const voterHash = await sha256(`voter:${voterToken}`);
    const ipHash = await sha256(`ip:${clientIp}`);
    const existingRating = await getVoterRating(db, body.storySlug, voterHash);
    if (existingRating !== null) {
      const statistics = await loadStatistics(db, body.storySlug);
      return jsonResponse(
        {
          ...statistics,
          code: "already_voted",
          has_voted: true,
          user_rating: existingRating,
        },
        409,
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const limit = await recordRateLimit(db, ipHash, now);
    if (!limit || Number(limit.request_count) > RATE_LIMIT) {
      const retryAfter = limit
        ? Math.max(1, Number(limit.window_started_at) + RATE_WINDOW_SECONDS - now)
        : RATE_WINDOW_SECONDS;
      return jsonResponse(
        { error: "rate_limited" },
        429,
        { "Retry-After": String(retryAfter) },
      );
    }

    try {
      const statements = [
        db
          .prepare(
            "INSERT INTO story_ratings (story_slug, voter_hash, rating) VALUES (?, ?, ?)",
          )
          .bind(body.storySlug, voterHash, body.rating),
      ];
      if (commentText) {
        statements.push(
          db
            .prepare(
              `INSERT INTO story_rating_comments
                (story_slug, author_hash, review_voter_hash, body)
               VALUES (?, ?, ?, ?)`,
            )
            .bind(body.storySlug, voterHash, voterHash, commentText),
        );
      }
      await db.batch(statements);
    } catch {
      // D1 batch keeps the rating and optional comment atomic. The rating
      // uniqueness constraint remains authoritative when two votes race.
      const racedRating = await getVoterRating(db, body.storySlug, voterHash);
      if (racedRating === null) throw new Error("rating_insert_failed");
      const statistics = await loadStatistics(db, body.storySlug);
      return jsonResponse(
        {
          ...statistics,
          code: "already_voted",
          has_voted: true,
          user_rating: racedRating,
        },
        409,
      );
    }

    const statistics = await loadStatistics(db, body.storySlug);
    return jsonResponse(
      {
        ...statistics,
        code: "vote_saved",
        has_voted: true,
        user_rating: body.rating,
        comment_saved: Boolean(commentText),
      },
      201,
    );
  } catch {
    return jsonResponse({ error: "ratings_unavailable" }, 500);
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
