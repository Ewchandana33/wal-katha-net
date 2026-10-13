import assert from "node:assert/strict";
import test from "node:test";
import { onRequest } from "../functions/_middleware.js";

async function runMiddleware(url) {
  let nextCalls = 0;
  const response = await onRequest({
    request: new Request(url),
    next: async () => {
      nextCalls += 1;
      return new Response(null, { status: 204 });
    },
  });
  return { response, nextCalls };
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
