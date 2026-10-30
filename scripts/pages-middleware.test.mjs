import assert from "node:assert/strict";
import test from "node:test";
import { onRequest } from "../functions/_middleware.js";

async function runMiddleware(url, options = {}) {
  let nextCalls = 0;
  let forwardedMethod = null;
  let forwardedBody = null;
  const request = new Request(url, options);
  const response = await onRequest({
    request,
    next: async () => {
      nextCalls += 1;
      forwardedMethod = request.method;
      if (request.method !== "GET" && request.method !== "HEAD") {
        forwardedBody = await request.clone().text();
      }
      return new Response(null, { status: 204 });
    },
  });
  return { response, nextCalls, forwardedMethod, forwardedBody };
}

test("passes .well-known probes through without changing scheme, host, or path", async () => {
  const urls = [
    "http://walakatha.net/.well-known/acme-challenge/test-token",
    "https://walakatha.net/.well-known/acme-challenge/test-token",
    "http://www.walakatha.net/.well-known/acme-challenge/test-token",
    "https://www.walakatha.net/.well-known/google-site-verification",
    "https://walakatha.net/.well-known",
  ];

  for (const url of urls) {
    const { response, nextCalls } = await runMiddleware(url);
    assert.equal(nextCalls, 1, url + " should reach the Pages handler");
    assert.equal(response.status, 204, url + " should not be redirected");
    assert.equal(response.headers.get("location"), null, url + " should keep its literal URL");
  }
});

test("keeps canonical redirects for ordinary production content routes", async () => {
  const { response, nextCalls } = await runMiddleware(
    "http://walakatha.net/blog/sample-story?source=feed",
  );
  assert.equal(nextCalls, 0);
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://www.walakatha.net/blog/sample-story/?source=feed",
  );
});

test("forwards slashless API routes without redirecting requests or JSON bodies", async () => {
  const routes = [
    "/api/post-comments",
    "/api/post-comments/1/like",
    "/api/post-comments/1/replies",
    "/api/rating",
    "/api/rating/comments",
    "/api/rating/comments/1/like",
  ];
  const body = JSON.stringify({ comment: "test" });

  for (const route of routes) {
    const { response, nextCalls, forwardedMethod, forwardedBody } = await runMiddleware(
      `https://www.walakatha.net${route}`,
      { method: "POST", headers: { "content-type": "application/json" }, body },
    );
    assert.equal(nextCalls, 1, `${route} should reach its Pages API handler`);
    assert.equal(response.status, 204, `${route} should not redirect`);
    assert.equal(response.headers.get("location"), null, `${route} should keep its literal path`);
    assert.equal(forwardedMethod, "POST", `${route} should preserve its method`);
    assert.equal(forwardedBody, body, `${route} should preserve its JSON body`);
  }

  const { response, nextCalls } = await runMiddleware(
    "https://www.walakatha.net/api/post-comments?postId=sample-story",
  );
  assert.equal(nextCalls, 1, "GET API requests should also reach their handler without a slash redirect");
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("location"), null);
});

test("preserves write methods when an API request needs a canonical-host redirect", async () => {
  const { response, nextCalls } = await runMiddleware(
    "http://walakatha.net/api/rating?story=sample-story",
    { method: "POST", body: "{}" },
  );
  assert.equal(nextCalls, 0);
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://www.walakatha.net/api/rating?story=sample-story",
  );
});

test("does not redirect Cloudflare Pages preview hosts", async () => {
  const { response, nextCalls } = await runMiddleware(
    "https://feature-branch.wala-katha.pages.dev/blog/sample-story",
  );
  assert.equal(nextCalls, 1);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("location"), null);
});

test("preserves the existing exact-match verification-file exception", async () => {
  const { response, nextCalls } = await runMiddleware(
    "https://www.walakatha.net/113433b046592ff2d58ad8fd7c7c31db",
  );
  assert.equal(nextCalls, 1);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("location"), null);
});
