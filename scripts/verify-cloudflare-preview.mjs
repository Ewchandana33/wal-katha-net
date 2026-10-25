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
const sitemap = await get(new URL('/sitemap-index.xml', base), 'Preview sitemap index');
console.log(JSON.stringify({
  status: 'PASS',
  preview: base.origin,
  homepageStatus: home.status,
  homepageXRobotsTag: homeRobots,
  articlePath: articleUrl.pathname,
  articleStatus: article.status,
  articleXRobotsTag: articleRobots,
  sitemapStatus: sitemap.status,
  ageGatePresentAndUntouched: true
}, null, 2));
