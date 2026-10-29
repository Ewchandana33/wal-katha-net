#!/usr/bin/env node
import assert from 'node:assert/strict';

const raw = process.env.PREVIEW_URL;
assert.ok(raw, 'PREVIEW_URL must be set from the Cloudflare Pages check summary.');
const base = new URL(raw);
assert.equal(base.protocol, 'https:', 'Preview must use HTTPS.');
assert.ok(base.hostname.endsWith('.wala-katha.pages.dev'), 'Refusing to test a host outside this project\'s Cloudflare Pages previews.');
base.pathname = '/';
base.search = '';
base.hash = '';

async function get(url, label) {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `${label} should return HTTP 200, got ${response.status}.`);
  return response;
}
function assertNoindex(response, label) {
  const value = response.headers.get('x-robots-tag') || '';
  assert.match(value, /\bnoindex\b/i, `${label} must include X-Robots-Tag: noindex; got ${JSON.stringify(value)}.`);
  return value;
}

const home = await get(base, 'Preview homepage');
const homeRobots = assertNoindex(home, 'Preview homepage');
const html = await home.text();
assert.ok(html.includes('id="age-gate-overlay"'), 'The 18+ confirmation gate must remain present. The test does not click it or modify cookies/storage.');
const articleLink = [...html.matchAll(/href=["'](\/blog\/[^"'?#]+\/?)["']/gi)]
  .map(match => match[1])
  .find(path => path.split('/').filter(Boolean).length >= 2);
assert.ok(articleLink, 'Homepage should link to at least one article.');
const articleUrl = new URL(articleLink, base);
assert.equal(articleUrl.origin, base.origin, 'Article route must remain on the Preview origin.');
const article = await get(articleUrl, 'Preview article');
const articleRobots = assertNoindex(article, 'Preview article');
const articleHtml = await article.text();
const publicCommentsContainer = articleHtml.match(/<div\b(?=[^>]*\bid=["']comments-list-hook["'])[^>]*>/i)?.[0];
assert.ok(publicCommentsContainer, 'The article should keep the existing public-comments list.');
assert.match(
  publicCommentsContainer,
  /\bdata-server-rendered-comments=["']ready["']/i,
  'Public comments should be included in the initial article HTML for crawlers.',
);
const reviewCommentsContainer = articleHtml.match(/<ol\b(?=[^>]*\bdata-comments-list\b)[^>]*>/i)?.[0];
assert.ok(reviewCommentsContainer, 'The article should keep the story-review comments list.');
assert.match(
  reviewCommentsContainer,
  /\bdata-server-rendered-comments=["']ready["']/i,
  'Story-review comments should be server-rendered when the Preview D1 binding is available.',
);
const sitemap = await get(new URL('/sitemap-index.xml', base), 'Preview sitemap index');
const storySlug = decodeURIComponent(articleUrl.pathname.slice('/blog/'.length).replace(/\/+$/, ''));
assert.match(storySlug, /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/, 'Article URL should provide a valid story ID.');
const publicCommentsResponse = await fetch(
  `https://comments.wala-katha.workers.dev/api/comments?postId=${encodeURIComponent(storySlug)}`,
  { signal: AbortSignal.timeout(20000) }
);
assert.equal(publicCommentsResponse.status, 200, `Public-comments API should return HTTP 200, got ${publicCommentsResponse.status}.`);
const publicComments = await publicCommentsResponse.json();
assert.ok(Array.isArray(publicComments), 'Public-comments API should return a comment array.');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const boundedEscapedText = (value, maximumLength) =>
  escapeHtml(Array.from(String(value ?? '').trim()).slice(0, maximumLength).join(''));
if (publicComments[0]?.content) {
  assert.ok(
    articleHtml.includes(boundedEscapedText(publicComments[0].content, 1000)),
    'A public post comment should be present in the initial article HTML.',
  );
}
const reviewCommentsResponse = await get(
  new URL(`/api/rating/comments?story=${encodeURIComponent(storySlug)}`, base),
  'Preview review comments API',
);
const reviewData = await reviewCommentsResponse.json();
assert.ok(Array.isArray(reviewData.comments), 'Preview review-comments API should return a comment array.');
if (reviewData.comments[0]?.body) {
  assert.ok(
    articleHtml.includes(boundedEscapedText(reviewData.comments[0].body, 500)),
    'A story-review comment should be present in the initial article HTML.',
  );
}
const ratingResponse = await fetch(
  new URL(`/api/rating?story=${encodeURIComponent(storySlug)}`, base),
  { redirect: 'follow', signal: AbortSignal.timeout(20000) }
);
assert.equal(ratingResponse.status, 200, `Rating API should return HTTP 200, got ${ratingResponse.status}.`);
const ratingData = await ratingResponse.json();
assert.ok(Number.isSafeInteger(ratingData.total_votes) && ratingData.total_votes >= 0, 'Rating API should return a non-negative integer vote total.');
assert.ok(Number.isSafeInteger(ratingData.total_stars) && ratingData.total_stars >= 0, 'Rating API should return a non-negative integer star total.');
assert.equal(typeof ratingData.average_rating, 'number', 'Rating API should return a numeric average.');
assert.ok(ratingData.rating_counts && typeof ratingData.rating_counts === 'object' && !Array.isArray(ratingData.rating_counts), 'Rating API should return per-star counts.');
assert.deepEqual(Object.keys(ratingData.rating_counts).sort(), ['1', '2', '3', '4', '5'], 'Rating API should include every star-count bucket.');
const ratingCounts = [1, 2, 3, 4, 5].map(value => ratingData.rating_counts[value]);
assert.ok(ratingCounts.every(count => Number.isSafeInteger(count) && count >= 0), 'Rating counts should be non-negative integers.');
assert.equal(ratingCounts.reduce((sum, count) => sum + count, 0), ratingData.total_votes, 'Rating breakdown should match the total vote count.');
const calculatedAverage = ratingData.total_votes === 0
  ? 0
  : Number((ratingData.total_stars / ratingData.total_votes).toFixed(1));
assert.equal(ratingData.average_rating, calculatedAverage, 'Rating API average should match its real vote totals.');
assert.equal(typeof ratingData.has_voted, 'boolean', 'Rating API should return the current browser vote state.');
console.log(JSON.stringify({
  status: 'PASS',
  preview: base.origin,
  homepageStatus: home.status,
  homepageXRobotsTag: homeRobots,
  articlePath: articleUrl.pathname,
  articleStatus: article.status,
  articleXRobotsTag: articleRobots,
  sitemapStatus: sitemap.status,
  ratingApiStatus: ratingResponse.status,
  ratingStorySlug: storySlug,
  ratingVotes: ratingData.total_votes,
  ratingAverage: ratingData.average_rating,
  serverRenderedPostComments: publicComments.length,
  serverRenderedReviewComments: reviewData.comments.length,
  ageGatePresentAndUntouched: true
}, null, 2));
