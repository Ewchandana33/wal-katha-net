import { PUBLISHED_STORY_SLUGS } from "./published-story-slugs.generated.js";

export const STORY_REVIEW_COOKIE = "wk-rating-voter";
export const STORY_REVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const STORY_REVIEW_RATE_WINDOW_SECONDS = 10 * 60;
export const STORY_REVIEW_RATE_LIMIT = 20;
export const STORY_REVIEW_RATE_RETENTION_SECONDS = 24 * 60 * 60;
export const MAX_REVIEW_COMMENT_LENGTH = 500;

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  const headers = new Headers(JSON_HEADERS);
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return new Response(JSON.stringify(body), { status, headers });
}

export function storySlugStatus(value) {
  if (typeof value !== "string" || value.length > 120) return "invalid";
  if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(value)) return "invalid";
  return PUBLISHED_STORY_SLUGS.has(value) ? "published" : "missing";
}

export function readVoterToken(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  for (const item of cookieHeader.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() !== STORY_REVIEW_COOKIE) continue;
    const value = item.slice(separator + 1).trim();
    return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
  }
  return null;
}

export function createVoterToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function voterCookieHeader(token) {
  return `${STORY_REVIEW_COOKIE}=${token}; Path=/api/rating; Max-Age=${STORY_REVIEW_COOKIE_MAX_AGE}; Secure; HttpOnly; SameSite=Lax`;
}

export function hasSameOrigin(request) {
  const origin = request.headers.get("Origin");
  return Boolean(origin) && origin === new URL(request.url).origin;
}

export function hasJsonContentType(request) {
  return /^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type") || "");
}

export async function readJsonBody(request, maxBytes) {
  const declaredLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
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
    if (size > maxBytes) {
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

export async function enforceWriteRateLimit(request, db) {
  const clientIp = request.headers.get("CF-Connecting-IP");
  if (!clientIp || clientIp.length > 45) {
    return jsonResponse({ error: "request_identity_unavailable" }, 503);
  }

  try {
    const ipHash = await sha256(`ip:${clientIp}`);
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare("DELETE FROM story_rating_rate_limits WHERE window_started_at < ?")
      .bind(now - STORY_REVIEW_RATE_RETENTION_SECONDS)
      .run();

    const limit = await db
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
        now - STORY_REVIEW_RATE_WINDOW_SECONDS,
        now,
        now - STORY_REVIEW_RATE_WINDOW_SECONDS,
      )
      .first();

    if (!limit || Number(limit.request_count) > STORY_REVIEW_RATE_LIMIT) {
      const retryAfter = limit
        ? Math.max(1, Number(limit.window_started_at) + STORY_REVIEW_RATE_WINDOW_SECONDS - now)
        : STORY_REVIEW_RATE_WINDOW_SECONDS;
      return jsonResponse(
        { error: "rate_limited" },
        429,
        { "Retry-After": String(retryAfter) },
      );
    }
    return null;
  } catch {
    return jsonResponse({ error: "reviews_unavailable" }, 500);
  }
}
