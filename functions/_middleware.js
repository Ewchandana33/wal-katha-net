import { PUBLISHED_STORY_SLUGS } from "./_shared/published-story-slugs.generated.js";
import {
  renderPostComments,
  renderReviewComments,
} from "./_shared/comment-indexability.js";
import {
  fetchPublicPostComments,
  preparePostComments,
} from "./_shared/legacy-post-comments.js";

// Cloudflare Pages global middleware (runs before static assets are
// served, at the edge, independent of Astro's static build). This is
// the correct equivalent of "Astro Middleware" for a fully static
// (SSG, no adapter) Astro project - Astro's own middleware only runs
// under an SSR runtime, which this project does not use.
// Normalizes: protocol (http -> https), host (apex/other -> www),
// and trailing slash (matches src/lib/utils/urlHelper.ts convention).
const CANONICAL_HOST = "www.walakatha.net";
const APEX_HOST = "walakatha.net";
const MAX_SERVER_RENDERED_REVIEWS = 100;
// Ad-network / third-party site-verification files (ExoClick, Ezoic,
// Google Search Console alternate methods, etc.) are commonly issued
// WITHOUT a file extension and MUST be served at the exact literal
// path the verifying crawler was given - no trailing slash, no
// redirect chain. Verification crawlers typically do not follow
// redirects, so forcing a trailing slash onto these paths (as would
// otherwise happen since an extension-less path looks "directory-like"
// to isFileLikePath()) silently breaks every future site-verification
// flow. Add any new extension-less verification filename here as
// needed - this list is intentionally exact-match only, so it can
// never accidentally exempt a real content route.
//
const VERIFICATION_FILE_EXEMPTIONS = new Set([
  "/113433b046592ff2d58ad8fd7c7c31db",
]);
function isFileLikePath(pathname) {
  const lastSegment = pathname.split("/").pop() || "";
  return lastSegment.includes(".");
}
function isOwnDomain(hostname) {
  return hostname === APEX_HOST || hostname === CANONICAL_HOST || hostname.endsWith("." + APEX_HOST);
}

function isCloudflarePreviewHost(hostname) {
  return hostname.endsWith(".wala-katha.pages.dev");
}

function rewritePreviewRobotsMeta(context, response) {
  let hostname;
  try {
    hostname = new URL(context.request.url).hostname;
  } catch {
    return response;
  }

  if (
    !isCloudflarePreviewHost(hostname) ||
    context.request.method !== "GET" ||
    !response.ok ||
    !response.headers.get("content-type")?.toLowerCase().includes("text/html") ||
    typeof HTMLRewriter === "undefined"
  ) {
    return response;
  }

  try {
    return new HTMLRewriter()
      .on('meta[name="robots"]', {
        element(element) {
          element.setAttribute("content", "noindex,follow");
        },
      })
      .transform(response);
  } catch {
    return response;
  }
}

function storySlugFromPath(pathname) {
  const match = pathname.match(/^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/i);
  if (!match) return null;
  const slug = match[1].toLowerCase();
  return PUBLISHED_STORY_SLUGS.has(slug) ? slug : null;
}

async function loadPublicComments(storySlug, database) {
  try {
    const records = await fetchPublicPostComments(storySlug);
    const prepared = await preparePostComments(database, storySlug, records);
    const html = renderPostComments(prepared.comments);
    return {
      status: "ready",
      html,
      count: prepared.comments.length,
    };
  } catch {
    return { status: "unavailable", html: "", count: 0 };
  }
}

async function loadReviewComments(database, storySlug) {
  if (!database) return { status: "not-configured", html: "", count: 0 };

  try {
    const parentResult = await database
      .prepare(
        `SELECT id, body, created_at
         FROM story_rating_comments
         WHERE story_slug = ? AND parent_id IS NULL
         ORDER BY id DESC
         LIMIT ?`,
      )
      .bind(storySlug, MAX_SERVER_RENDERED_REVIEWS)
      .all();
    const parents = parentResult.results || [];
    const repliesByParent = new Map(parents.map((comment) => [Number(comment.id), []]));

    if (parents.length > 0) {
      const placeholders = parents.map(() => "?").join(", ");
      const replyResult = await database
        .prepare(
          `SELECT id, parent_id, body, created_at
           FROM story_rating_comments
           WHERE story_slug = ? AND parent_id IN (${placeholders})
           ORDER BY parent_id ASC, id ASC`,
        )
        .bind(storySlug, ...parents.map((comment) => Number(comment.id)))
        .all();

      for (const reply of replyResult.results || []) {
        repliesByParent.get(Number(reply.parent_id))?.push(reply);
      }
    }

    const records = parents.map((comment) => ({
      ...comment,
      replies: repliesByParent.get(Number(comment.id)) || [],
    }));
    return {
      status: "ready",
      html: renderReviewComments(records),
      count: records.filter((comment) => typeof comment.body === "string" && comment.body.trim()).length,
    };
  } catch {
    return { status: "unavailable", html: "", count: 0 };
  }
}

async function renderIndexableComments(context, response, storySlug) {
  if (
    !storySlug ||
    context.request.method !== "GET" ||
    !response.ok ||
    !response.headers.get("content-type")?.toLowerCase().includes("text/html") ||
    typeof HTMLRewriter === "undefined"
  ) {
    return response;
  }

  const [postComments, reviewComments] = await Promise.all([
    loadPublicComments(storySlug, context.env?.DB),
    loadReviewComments(context.env?.DB, storySlug),
  ]);

  try {
    return new HTMLRewriter()
      .on("#comments-list-hook", {
        element(element) {
          element.setAttribute("data-server-rendered-comments", postComments.status);
          element.setAttribute("data-server-rendered-count", String(postComments.count));
          if (postComments.html) element.append(postComments.html, { html: true });
        },
      })
      .on("#no-comments-msg", {
        element(element) {
          if (postComments.count > 0) element.setAttribute("style", "display:none");
        },
      })
      .on("[data-comments-list]", {
        element(element) {
          element.setAttribute("data-server-rendered-comments", reviewComments.status);
          element.setAttribute("data-server-rendered-count", String(reviewComments.count));
          if (reviewComments.html) element.append(reviewComments.html, { html: true });
        },
      })
      .transform(response);
  } catch {
    return response;
  }
}

export async function onRequest(context) {
  const { request, next } = context;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return next();
  }
  const storySlug = storySlugFromPath(url.pathname);
  const servePage = async () => {
    const response = await renderIndexableComments(
      context,
      await next(),
      storySlug,
    );
    return rewritePreviewRobotsMeta(context, response);
  };
  // Canonicalize only our own domain variants. Keep *.pages.dev previews,
  // localhost, and unrelated hosts on their original host; eligible story
  // HTML still receives the comment rendering above on those environments.
  if (!isOwnDomain(url.hostname)) {
    return servePage();
  }
  // ACME and other HTTP-based domain-verification probes require the original
  // scheme, host, and literal path. Never canonicalize or add a slash here.
  if (url.pathname === "/.well-known" || url.pathname.startsWith("/.well-known/")) {
    return servePage();
  }
  let needsRedirect = false;
  const target = new URL(url.toString());
  // Force https
  if (target.protocol !== "https:") {
    target.protocol = "https:";
    needsRedirect = true;
  }
  // Force www (non-www apex -> www, any subdomain drift -> www)
  if (target.hostname !== CANONICAL_HOST) {
    target.hostname = CANONICAL_HOST;
    needsRedirect = true;
  }
  // Keep API paths literal: clients send JSON POSTs to the route without a
  // trailing slash, and a 301 can turn those requests into GETs. For page
  // routes, force trailing slashes on directory-style paths only (never on
  // file-like paths such as .xml, .txt, .png, .css, .js, and never on
  // exact-match third-party verification file paths).
  const isApiPath = target.pathname === "/api" || target.pathname.startsWith("/api/");
  if (
    !isApiPath &&
    !isFileLikePath(target.pathname) &&
    !target.pathname.endsWith("/") &&
    !VERIFICATION_FILE_EXEMPTIONS.has(target.pathname)
  ) {
    target.pathname = `${target.pathname}/`;
    needsRedirect = true;
  }
  if (needsRedirect) {
    const status = request.method === "GET" || request.method === "HEAD" ? 301 : 308;
    return Response.redirect(target.toString(), status);
  }
  return servePage();
}