#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PUBLISHED_STORY_SLUGS } from '../functions/_shared/published-story-slugs.generated.js';
import { sanitizeCommentText } from '../shared/comment-link-policy.js';

const noindexPostIds = new Set(JSON.parse(readFileSync(
  new URL('../src/config/noindex-post-ids.json', import.meta.url),
  'utf8',
)));
const siteConfig = JSON.parse(readFileSync(
  new URL('../src/config/config.json', import.meta.url),
  'utf8',
));
const canonicalOrigin = new URL(siteConfig.site.base_url).origin;

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

function assertNoindexMeta(html, label) {
  const robotsTags = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => /\bname=["']robots["']/i.test(tag));
  assert.ok(robotsTags.length > 0, label + ' must include a robots meta tag.');
  for (const tag of robotsTags) {
    const content = tag.match(/\bcontent=["']([^"']*)["']/i)?.[1] || '';
    assert.match(content, /(?:^|,)\s*noindex(?:\s*,|$)/i, label + ' must include a noindex meta directive.');
    assert.doesNotMatch(content, /(?:^|,)\s*index(?:\s*,|$)/i, label + ' must not contradict noindex with index.');
  }
}

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(match => match[1].trim());
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const boundedEscapedText = (value, maximumLength) => {
  const text = sanitizeCommentText(String(value ?? '').trim());
  return escapeHtml(Array.from(text).slice(0, maximumLength).join(''));
};
const renderedCommentCount = (html, kind) =>
  [...html.matchAll(new RegExp(`data-server-rendered-comment=["']${kind}["']`, 'g'))].length;

function assertCommentContainers(html, label) {
  const publicCommentsContainer = html.match(/<div\b(?=[^>]*\bid=["']comments-list-hook["'])[^>]*>/i)?.[0];
  assert.ok(publicCommentsContainer, `${label} should keep the public-comments list.`);
  assert.match(
    publicCommentsContainer,
    /\bdata-server-rendered-comments=["']ready["']/i,
    `${label} should include public comments in its initial HTML.`,
  );
  const reviewCommentsContainer = html.match(/<ol\b(?=[^>]*\bdata-comments-list\b)[^>]*>/i)?.[0];
  assert.ok(reviewCommentsContainer, `${label} should keep the story-review comments list.`);
  assert.match(
    reviewCommentsContainer,
    /\bdata-server-rendered-comments=["']ready["']/i,
    `${label} should server-render review comments when the Preview D1 binding is available.`,
  );
}

const home = await get(base, 'Preview homepage');
const homeRobots = assertNoindex(home, 'Preview homepage');
const html = await home.text();
assertNoindexMeta(html, 'Preview homepage');
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
assertNoindexMeta(articleHtml, 'Preview article');
assertCommentContainers(articleHtml, 'Homepage-linked article');
const sitemap = await get(new URL('/sitemap-index.xml', base), 'Preview sitemap index');
const storySlug = decodeURIComponent(articleUrl.pathname.slice('/blog/'.length).replace(/\/+$/, ''));
assert.match(storySlug, /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/, 'Article URL should provide a valid story ID.');
assert.ok(PUBLISHED_STORY_SLUGS.has(storySlug), 'Homepage article should be one of the published story routes.');

const sitemapQueue = sitemapLocations(await sitemap.text());
const sitemapPageUrls = new Set();
while (sitemapQueue.length > 0) {
  const sitemapUrl = new URL(sitemapQueue.shift(), canonicalOrigin);
  assert.equal(sitemapUrl.origin, canonicalOrigin, 'Sitemap entries should stay on the canonical host.');
  const previewSitemapUrl = new URL(sitemapUrl.pathname + sitemapUrl.search, base);
  const childSitemap = await get(previewSitemapUrl, 'Preview child sitemap');
  const childXml = await childSitemap.text();
  const locations = sitemapLocations(childXml);
  if (/<sitemapindex\b/i.test(childXml)) {
    sitemapQueue.push(...locations);
  } else {
    for (const location of locations) sitemapPageUrls.add(new URL(location, canonicalOrigin).href);
  }
}

const storyAudit = [];
for (const publishedSlug of PUBLISHED_STORY_SLUGS) {
  const expectedUrl = new URL(`/blog/${publishedSlug}/`, canonicalOrigin).href;
  if (noindexPostIds.has(publishedSlug)) {
    assert.ok(!sitemapPageUrls.has(expectedUrl), `Configured noindex article should stay out of the Preview sitemap: ${expectedUrl}`);
  } else {
    assert.ok(sitemapPageUrls.has(expectedUrl), `Published indexable article should appear in the Preview sitemap: ${expectedUrl}`);
  }

  let storyHtml = articleHtml;
  if (publishedSlug !== storySlug) {
    const storyUrl = new URL(`/blog/${publishedSlug}/`, base);
    const storyResponse = await get(storyUrl, `Preview article ${publishedSlug}`);
    assertNoindex(storyResponse, `Preview article ${publishedSlug}`);
    storyHtml = await storyResponse.text();
    assertNoindexMeta(storyHtml, `Preview article ${publishedSlug}`);
    assertCommentContainers(storyHtml, `Preview article ${publishedSlug}`);
  }

  const publicCommentsResponse = await fetch(
    `https://comments.wala-katha.workers.dev/api/comments?postId=${encodeURIComponent(publishedSlug)}`,
    { signal: AbortSignal.timeout(20000) }
  );
  assert.equal(publicCommentsResponse.status, 200, `Public-comments API should return HTTP 200 for ${publishedSlug}.`);
  const publicComments = await publicCommentsResponse.json();
  assert.ok(Array.isArray(publicComments), `Public-comments API should return a comment array for ${publishedSlug}.`);
  const expectedPostBodies = publicComments
    .map(comment => boundedEscapedText(comment?.content, 1000))
    .filter(Boolean);
  assert.equal(
    renderedCommentCount(storyHtml, 'post'),
    expectedPostBodies.length,
    `Every current public post comment should be in the initial HTML for ${publishedSlug}.`,
  );
  for (const body of expectedPostBodies) {
    assert.ok(storyHtml.includes(body), `A public post comment body should be in the initial HTML for ${publishedSlug}.`);
  }

  const postApiResponse = await get(
    new URL(`/api/post-comments?postId=${encodeURIComponent(publishedSlug)}`, base),
    `Preview post-comment replies API for ${publishedSlug}`,
  );
  const postApiData = await postApiResponse.json();
  assert.ok(Array.isArray(postApiData.comments), `Post-comment API should return a comment array for ${publishedSlug}.`);
  const expectedPostReplyBodies = postApiData.comments.flatMap(comment =>
    Array.isArray(comment.replies)
      ? comment.replies.map(reply => boundedEscapedText(reply?.content ?? reply?.body, 1000)).filter(Boolean)
      : []
  );
  assert.equal(
    renderedCommentCount(storyHtml, 'post-reply'),
    expectedPostReplyBodies.length,
    `Every current public post reply should be in the initial HTML for ${publishedSlug}.`,
  );
  for (const body of expectedPostReplyBodies) {
    assert.ok(storyHtml.includes(body), `A public post reply body should be in the initial HTML for ${publishedSlug}.`);
  }

  let reviewCursor = '';
  let reviewTotal = null;
  let reviewBodies = [];
  let reviewPage = 0;
  while (true) {
    const reviewUrl = new URL(`/api/rating/comments?story=${encodeURIComponent(publishedSlug)}`, base);
    if (reviewCursor) reviewUrl.searchParams.set('before', reviewCursor);
    const reviewResponse = await get(reviewUrl, `Preview review comments API for ${publishedSlug}`);
    const reviewData = await reviewResponse.json();
    assert.ok(Array.isArray(reviewData.comments), `Review-comments API should return a comment array for ${publishedSlug}.`);
    assert.ok(Number.isSafeInteger(reviewData.total_comments) && reviewData.total_comments >= 0, `Review-comments API should return a total for ${publishedSlug}.`);
    if (reviewTotal === null) reviewTotal = reviewData.total_comments;
    else assert.equal(reviewData.total_comments, reviewTotal, `Review-comment total should stay stable during the ${publishedSlug} audit.`);
    for (const comment of reviewData.comments) {
      const body = boundedEscapedText(comment?.body, 500);
      if (body) reviewBodies.push(body);
      if (Array.isArray(comment?.replies)) {
        reviewBodies.push(...comment.replies.map(reply => boundedEscapedText(reply?.body, 500)).filter(Boolean));
      }
    }
    if (!reviewData.has_more) break;
    assert.ok(reviewData.next_cursor, `Review-comment pagination should provide a cursor for ${publishedSlug}.`);
    reviewCursor = String(reviewData.next_cursor);
    reviewPage += 1;
    assert.ok(reviewPage < 20, `Review-comment audit exceeded its 400-parent safety bound for ${publishedSlug}.`);
  }
  assert.equal(
    renderedCommentCount(storyHtml, 'review'),
    reviewBodies.length,
    `Every current review comment and reply should be in the initial HTML for ${publishedSlug}.`,
  );
  for (const body of reviewBodies) {
    assert.ok(storyHtml.includes(body), `A review comment body should be in the initial HTML for ${publishedSlug}.`);
  }

  storyAudit.push({
    slug: publishedSlug,
    postComments: expectedPostBodies.length,
    postReplies: expectedPostReplyBodies.length,
    reviewComments: reviewBodies.length,
    reviewTotal,
  });
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
  publishedStoriesAudited: storyAudit.length,
  serverRenderedCommentsByStory: storyAudit,
  ageGatePresentAndUntouched: true
}, null, 2));
