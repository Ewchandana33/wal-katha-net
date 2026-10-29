#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const widths = [280, 320, 390, 461, 640, 700, 768, 1024, 1440, 1920, 2560];
const expectedColumns = [2, 2, 2, 2, 2, 2, 3, 4, 4, 5, 6];
const remoteUrl = process.env.RESPONSIVE_TEST_URL;
const baseUrl = remoteUrl || 'http://127.0.0.1:4321';
let previewServer;
let chrome;
let websocket;
let profile;
let ratingHarnessDirectory;

function findBrowser() {
  const candidates = [process.env.CHROME_PATH, process.env.CHROMIUM_PATH, 'chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable'].filter(Boolean);
  for (const candidate of candidates) {
    const result = spawnSync(candidate, ['--version'], { encoding: 'utf8', stdio: 'ignore' });
    if (result.status === 0) return candidate;
  }
  throw new Error('No Chrome/Chromium executable found. Set CHROME_PATH to a browser executable.');
}

async function getFreePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function waitForHttp(url, child, label) {
  let lastError;
  for (let i = 0; i < 80; i++) {
    if (child?.exitCode !== null && child?.exitCode !== undefined) {
      throw new Error(`${label} exited with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.ok) return response;
      lastError = new Error(`${label} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw new Error(`${label} did not become ready: ${lastError?.message || 'timeout'}`);
}

let fixtureLikeCount = 0;
let fixtureLiked = false;
let fixturePostCommentLikeCount = 0;
let fixturePostCommentLiked = false;
let fixturePostReplyCount = 1;

function ratingApiFixture(request) {
  const url = new URL(request.url);
  const method = String(request.method || "GET").toUpperCase();
  if (url.pathname === "/api/post-comments" && method === "GET") {
    return {
      status: 200,
      body: {
        total_comments: 1,
        interactions_available: true,
        comments: [{
          id: "p-" + "a".repeat(64),
          content: "පරීක්ෂණ post අදහස",
          date: "Oct 29, 2026",
          like_count: fixturePostCommentLikeCount,
          liked: fixturePostCommentLiked,
          reply_count: fixturePostReplyCount,
          replies: [{ id: "r-17", content: "පැරණි පිළිතුර", created_at: 1800000000, like_count: 0, liked: false }],
        }],
      },
    };
  }
  if (/^\/api\/post-comments\/(?:p-[a-f0-9]{64}|r-[1-9][0-9]*)\/like$/.test(url.pathname) && method === "POST") {
    const body = JSON.parse(request.postData || "{}");
    const nextLiked = body.liked === true;
    if (nextLiked !== fixturePostCommentLiked) {
      fixturePostCommentLikeCount += nextLiked ? 1 : -1;
      fixturePostCommentLiked = nextLiked;
    }
    return { status: 200, body: { liked: fixturePostCommentLiked, like_count: fixturePostCommentLikeCount } };
  }
  if (/^\/api\/post-comments\/p-[a-f0-9]{64}\/replies$/.test(url.pathname) && method === "POST") {
    fixturePostReplyCount += 1;
    return {
      status: 201,
      body: {
        reply_count: fixturePostReplyCount,
        reply: { id: "r-18", content: "අලුත් post පිළිතුර", created_at: 1800000030, like_count: 0, liked: false, is_mine: true },
      },
    };
  }
  if (url.pathname === "/api/rating/comments") {
    if (method === "GET" && url.searchParams.get("countOnly") === "1") {
      return { status: 200, body: { total_comments: 1 } };
    }
    if (method === "GET") {
      return {
        status: 200,
        body: {
          total_comments: 1,
          comments: [{
            id: 9,
            body: "පරීක්ෂණ අදහස",
            created_at: 1800000000,
            like_count: fixtureLikeCount,
            liked: fixtureLiked,
            is_mine: false,
            replies: [],
            reply_count: 0,
          }],
          has_more: false,
          next_cursor: null,
        },
      };
    }
    if (method === "POST") {
      return {
        status: 201,
        body: {
          comment: { id: 10, parent_id: 9, body: "පරීක්ෂණ පිළිතුර", created_at: 1800000010 },
          total_comments: 2,
        },
      };
    }
  }
  if (/^\/api\/rating\/comments\/\d+\/like$/.test(url.pathname) && method === "POST") {
    const body = JSON.parse(request.postData || "{}");
    const nextLiked = body.liked === true;
    if (nextLiked !== fixtureLiked) {
      fixtureLikeCount += nextLiked ? 1 : -1;
      fixtureLiked = nextLiked;
    }
    return { status: 200, body: { liked: fixtureLiked, like_count: fixtureLikeCount } };
  }
  if (url.pathname === "/api/rating") {
    if (method === "GET") {
      return {
        status: 200,
        body: {
          average_rating: 0,
          total_votes: 0,
          total_stars: 0,
          rating_counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          has_voted: false,
        },
      };
    }
    if (method === "POST") {
      return {
        status: 201,
        body: {
          average_rating: 4,
          total_votes: 1,
          total_stars: 4,
          rating_counts: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 },
          has_voted: true,
          user_rating: 4,
          comment_saved: true,
        },
      };
    }
  }
  return null;
}

async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), sleep(3000)]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

async function startBrowser() {
  const port = await getFreePort();
  profile = await mkdtemp(join(tmpdir(), 'wal-katha-layout-chrome-'));
  chrome = spawn(findBrowser(), [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    `--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1',
    '--remote-allow-origins=*', `--user-data-dir=${profile}`, 'about:blank'
  ], { stdio: 'ignore' });
  chrome.on('error', error => console.error('Chrome launch error:', error.message));
  const response = await waitForHttp(`http://127.0.0.1:${port}/json/list`, chrome, 'Chrome DevTools');
  const targets = await response.json();
  const target = targets.find(item => item.type === 'page');
  if (!target?.webSocketDebuggerUrl) throw new Error('Chrome did not expose a page target.');
  websocket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    websocket.addEventListener('open', resolve, { once: true });
    websocket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  const fetchTrace = [];
  const pausedRequests = [];
  const networkTrace = [];
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const expressionHint = method === 'Runtime.evaluate' && params.expression
      ? ` (${String(params.expression).replace(/\s+/g, ' ').slice(0, 120)})`
      : '';
    const metricsHint = method === 'Emulation.setDeviceMetricsOverride'
      ? ` ${JSON.stringify(params)}`
      : '';
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Chrome DevTools call timed out: ${method}${metricsHint}${expressionHint}`));
    }, 20000);
    pending.set(id, { resolve, reject, timer });
    websocket.send(JSON.stringify({ id, method, params }));
  });
  websocket.addEventListener('message', event => {
    let message;
    try { message = JSON.parse(String(event.data)); } catch { return; }
    if (message.method === 'Network.requestWillBeSent' && message.params?.request?.url?.includes('/api/rating')) {
      networkTrace.push({
        event: 'request',
        requestId: message.params.requestId,
        method: message.params.request.method,
        url: message.params.request.url
      });
      return;
    }
    if (message.method === 'Network.responseReceived' && message.params?.response?.url?.includes('/api/rating')) {
      networkTrace.push({
        event: 'response',
        status: message.params.response.status,
        url: message.params.response.url
      });
      return;
    }
    if (message.method === 'Network.loadingFailed' && message.params?.requestId) {
      const matchingRequest = networkTrace.findLast?.(entry => entry.event === 'request' && entry.requestId === message.params.requestId);
      if (matchingRequest) {
        networkTrace.push({
          event: 'failed',
          errorText: message.params.errorText,
          blockedReason: message.params.blockedReason
        });
      }
    }
    if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      pausedRequests.push({ method: request.method, url: request.url });
      const fixture = ratingApiFixture(request);
      if (fixture) {
        fetchTrace.push({ method: request.method, url: request.url });
        void call('Fetch.fulfillRequest', {
          requestId,
          responseCode: fixture.status,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
          body: Buffer.from(JSON.stringify(fixture.body), 'utf8').toString('base64')
        }).catch(error => console.error('Rating fixture interception failed:', error.message));
      } else {
        void call('Fetch.continueRequest', { requestId })
          .catch(error => console.error('Rating fixture request continuation failed:', error.message));
      }
      return;
    }
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject, timer } = pending.get(message.id);
    clearTimeout(timer);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message);
  });
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.result?.exceptionDetails) {
      throw new Error(response.result.exceptionDetails.exception?.description || response.result.exceptionDetails.text);
    }
    return response.result?.result?.value;
  };
  await call('Network.enable');
  await call('Network.setBypassServiceWorker', { bypass: true });
  await call('Page.enable');
  await call('Runtime.enable');
  return { call, evaluate, fetchTrace, pausedRequests, networkTrace };
}

async function navigate(browser, url) {
  const result = await browser.call('Page.navigate', { url });
  if (result.result?.errorText) throw new Error(`Navigation failed: ${result.result.errorText}`);
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    if (await browser.evaluate('document.readyState') === 'complete') return;
  }
  throw new Error(`Page did not finish loading: ${url}`);
}

async function setViewport(browser, width) {
  await browser.call('Emulation.setDeviceMetricsOverride', {
    width, height: 900, deviceScaleFactor: 1, mobile: true
  });
  await browser.evaluate('(async () => { await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); return true; })()');
}

async function createRatingHarness(articleSlug) {
  const articlePath = join(process.cwd(), 'dist', 'blog', articleSlug, 'index.html');
  const articleHtml = await readFile(articlePath, 'utf8');
  const widgetHtml = articleHtml.match(/<section\b(?=[^>]*\bdata-rating-widget\b)[\s\S]*?<\/section>/i)?.[0];
  assert.ok(widgetHtml, `Built article ${articleSlug} should contain the story rating widget`);
  const commentsHtml = articleHtml.match(/<div\b(?=[^>]*\bdata-story-comments\b)[\s\S]*?<\/dialog>\s*<\/div>/i)?.[0];
  assert.ok(commentsHtml, `Built article ${articleSlug} should contain the separate story comments dialog`);

  const localOrigin = new URL(baseUrl).origin;
  const localizeAsset = value => {
    const assetUrl = new URL(value, baseUrl);
    return assetUrl.origin === localOrigin ? `${assetUrl.pathname}${assetUrl.search}` : null;
  };
  const stylesheetPaths = [...articleHtml.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => {
      if (!/\brel=["']stylesheet["']/i.test(tag)) return null;
      const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
      return href ? localizeAsset(href) : null;
    })
    .filter(Boolean);
  const inlineStyles = [...articleHtml.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)]
    .map(([styleBlock]) => styleBlock);
  const modulePaths = [...articleHtml.matchAll(/<script\b[^>]*>/gi)]
    .map(([tag]) => {
      if (!/\btype=["']module["']/i.test(tag)) return null;
      const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      return src ? localizeAsset(src) : null;
    })
    .filter(Boolean);
  assert.ok(modulePaths.length > 0, 'Built article should include the module scripts that initialize the rating widget');

  ratingHarnessDirectory = join(process.cwd(), 'dist', '__rating-test__');
  await mkdir(ratingHarnessDirectory, { recursive: true });
  const documentHtml = [
    '<!doctype html>',
    '<html lang="si"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
    ...stylesheetPaths.map(path => `<link rel="stylesheet" href="${path}">`),
    ...inlineStyles,
    '</head><body>',
    widgetHtml,
    commentsHtml,
    ...modulePaths.map(path => `<script type="module" src="${path}"></script>`),
    '</body></html>'
  ].join('');
  await writeFile(join(ratingHarnessDirectory, 'index.html'), documentHtml);
}

async function waitForFeaturedBanner(browser, width) {
  const expectedPath = width <= 767
    ? '/images/slider/online-wal-katha-audio-pdf-mobile.webp'
    : '/images/slider/online-wal-katha-audio-pdf.webp';
  let lastState;
  for (let attempt = 0; attempt < 40; attempt++) {
    lastState = await browser.evaluate(`(() => {
      const image = document.querySelector('#astro-featured-slider #slider-wrapper > div > a > div picture img');
      return {
        source: image?.currentSrc || '',
        width: image?.naturalWidth || 0,
        height: image?.naturalHeight || 0
      };
    })()`);
    if (lastState.source && new URL(lastState.source).pathname === expectedPath && lastState.width > 0 && lastState.height > 0) {
      return lastState;
    }
    await sleep(250);
  }
  throw new Error(`Featured banner did not load at ${width}px: ${JSON.stringify(lastState)}`);
}

async function main() {
  if (!remoteUrl) {
    previewServer = spawn('yarn', ['preview', '--host', '127.0.0.1', '--port', '4321'], {
      stdio: 'ignore',
      // Astro otherwise auto-backgrounds preview servers inside Replit Agent,
      // so this browser test cannot monitor or clean up the child process.
      env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: '0' }
    });
  }
  const rootResponse = await waitForHttp(`${baseUrl}/`, previewServer, remoteUrl ? 'Preview site' : 'Astro preview server');
  assert.equal(rootResponse.status, 200, 'Homepage should return HTTP 200');
  const browser = await startBrowser();
  await navigate(browser, `${baseUrl}/`);

  const articleUrl = await browser.evaluate(`(() => {
    const link = document.querySelector('.post-grid a[href*="/blog/"]');
    return link ? link.href : null;
  })()`);
  assert.ok(articleUrl, 'Homepage post grid should link to an article');
  assert.equal(new URL(articleUrl).origin, new URL(baseUrl).origin, 'Article test route must stay on the test origin');
  assert.match(new URL(articleUrl).pathname, /^\/blog\//, 'Article link should use a blog route');
  const articleSlug = decodeURIComponent(new URL(articleUrl).pathname.split('/').filter(Boolean)[1]);

  const homeResults = [];
  for (let i = 0; i < widths.length; i++) {
    const width = widths[i];
    console.log(`[responsive] Homepage ${width}px`);
    await setViewport(browser, width);
    await waitForFeaturedBanner(browser, width);
    const result = await browser.evaluate(`(async () => {
      const grid = document.querySelector('.post-grid');
      const root = document.documentElement;
      const columns = grid ? getComputedStyle(grid).gridTemplateColumns.trim().split(/\\s+/).filter(Boolean).length : 0;
      const imageBounds = grid ? [...grid.children].flatMap(card => [...card.querySelectorAll('img')].map(image => {
        const imageRect = image.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        return { left: imageRect.left - cardRect.left, right: cardRect.right - imageRect.right };
      })) : [];
      const slider = document.querySelector('#astro-featured-slider');
      const frames = slider ? [...slider.querySelectorAll('#slider-wrapper > div > a > div')] : [];
      const firstFrame = frames[0];
      const nextFrame = frames[1];
      const bannerImage = firstFrame?.querySelector('picture img');
      return {
        viewport: innerWidth, rootScroll: root.scrollWidth, columns,
        cards: grid?.children.length || 0, imageBounds,
        featuredBanner: {
          frameCount: frames.length,
          imageFit: bannerImage ? getComputedStyle(bannerImage).objectFit : null,
          imagePosition: bannerImage ? getComputedStyle(bannerImage).objectPosition : null,
          imageNaturalWidth: bannerImage?.naturalWidth || 0,
          imageNaturalHeight: bannerImage?.naturalHeight || 0,
          imageSource: bannerImage?.currentSrc || '',
          hasBackdrop: Boolean(firstFrame?.querySelector('.slider-banner-backdrop')),
          firstFrameHeight: firstFrame?.getBoundingClientRect().height || null,
          nextFrameHeight: nextFrame?.getBoundingClientRect().height || null
        }
      };
    })()`);
    assert.equal(result.viewport, width, `Homepage viewport should be ${width}px`);
    assert.ok(result.rootScroll <= width + 1, `Homepage should not overflow horizontally at ${width}px (scrollWidth ${result.rootScroll})`);
    assert.equal(result.columns, expectedColumns[i], `Post grid should use ${expectedColumns[i]} columns at ${width}px`);
    assert.ok(result.cards > 0, 'Homepage post grid should contain cards');
    assert.ok(result.featuredBanner.frameCount >= 2, 'Featured slider should contain banner and story slides');
    const expectedBanner = width <= 767
      ? { path: '/images/slider/online-wal-katha-audio-pdf-mobile.webp', width: 700, height: 356 }
      : { path: '/images/slider/online-wal-katha-audio-pdf.webp', width: 1200, height: 610 };
    assert.equal(new URL(result.featuredBanner.imageSource).pathname, expectedBanner.path, `Featured banner should select the expected asset at ${width}px`);
    assert.equal(result.featuredBanner.imageNaturalWidth, expectedBanner.width, `Featured banner must decode at its expected width at ${width}px`);
    assert.equal(result.featuredBanner.imageNaturalHeight, expectedBanner.height, `Featured banner must decode at its expected height at ${width}px`);
    assert.equal(result.featuredBanner.imageFit, 'cover', 'Featured banner artwork should fill the frame without side gutters');
    assert.equal(result.featuredBanner.imagePosition, '50% 0%', 'Featured banner crop should keep the embedded headline and badges visible');
    assert.equal(result.featuredBanner.hasBackdrop, false, 'Featured banner should not rely on a dark blurred side-fill layer');
    assert.ok(Math.abs(result.featuredBanner.firstFrameHeight - result.featuredBanner.nextFrameHeight) <= 1, 'Featured and story slides should retain the same frame height');
    for (const bounds of result.imageBounds) {
      assert.ok(bounds.left >= -1 && bounds.right >= -1, `Post thumbnail should stay inside its card at ${width}px`);
    }
    homeResults.push({ width, columns: result.columns, rootScroll: result.rootScroll, featuredBanner: result.featuredBanner });
  }

  await navigate(browser, articleUrl);
  const ratingReady = await browser.evaluate(`(async () => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const widget = document.querySelector('[data-rating-widget]');
      if (widget?.getAttribute('aria-busy') === 'false') return true;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    return false;
  })()`);
  assert.ok(ratingReady, 'The rating widget should finish loading its initial aggregate');

  const articleResults = [];
  for (const width of widths) {
    console.log(`[responsive] Article ${width}px`);
    await setViewport(browser, width);
    const result = await browser.evaluate(`(() => {
      const root = document.documentElement;
      const image = document.querySelector('article img.max-w-4xl');
      const rating = document.querySelector('[data-rating-widget]');
      const ratingInputs = rating ? [...rating.querySelectorAll('[data-rating-input]')] : [];
      const ratingRect = rating?.getBoundingClientRect();
      if (!image) return {
        viewport: innerWidth, rootScroll: root.scrollWidth, found: false,
        rating: { found: Boolean(rating), slug: rating?.dataset.storySlug || '', width: ratingRect?.width || 0, values: ratingInputs.map(input => input.value),
          labels: ratingInputs.map(input => input.getAttribute('aria-label')),
          hasStatus: Boolean(rating?.querySelector('[role="status"][aria-live="polite"]')),
          hasToast: Boolean(rating?.querySelector('[data-rating-toast][role="status"][aria-live="polite"]')),
          hasToastBackdrop: Boolean(rating?.querySelector('[data-rating-toast-backdrop][aria-hidden="true"]')),
           hasCommentField: Boolean(rating?.querySelector('[data-rating-comment-field]')),
           commentInitiallyHidden: rating?.querySelector('[data-rating-comment-field]')?.hidden === true,
           hasCommentsButton: Boolean(document.querySelector('[data-comments-open][aria-haspopup="dialog"]')),
           hasCommentsDialog: Boolean(document.querySelector('[data-comments-dialog][aria-labelledby]')),
          hasPrivacyNote: Boolean(rating?.querySelector('.rating-privacy')),
          hasSummary: Boolean(rating?.querySelector('[data-rating-average]')),
          hasBreakdown: Boolean(rating?.querySelector('[data-rating-bar="5"]')) }
      };
      const rect = image.getBoundingClientRect();
      return {
        viewport: innerWidth, rootScroll: root.scrollWidth, found: true,
        centerOffset: rect.left + rect.width / 2 - innerWidth / 2,
        width: rect.width, display: getComputedStyle(image).display,
        rating: { found: Boolean(rating), slug: rating?.dataset.storySlug || '', width: ratingRect?.width || 0, values: ratingInputs.map(input => input.value),
          labels: ratingInputs.map(input => input.getAttribute('aria-label')),
          hasStatus: Boolean(rating?.querySelector('[role="status"][aria-live="polite"]')),
          hasToast: Boolean(rating?.querySelector('[data-rating-toast][role="status"][aria-live="polite"]')),
          hasToastBackdrop: Boolean(rating?.querySelector('[data-rating-toast-backdrop][aria-hidden="true"]')),
           hasCommentField: Boolean(rating?.querySelector('[data-rating-comment-field]')),
           commentInitiallyHidden: rating?.querySelector('[data-rating-comment-field]')?.hidden === true,
           hasCommentsButton: Boolean(document.querySelector('[data-comments-open][aria-haspopup="dialog"]')),
           hasCommentsDialog: Boolean(document.querySelector('[data-comments-dialog][aria-labelledby]')),
          hasPrivacyNote: Boolean(rating?.querySelector('.rating-privacy')),
          hasSummary: Boolean(rating?.querySelector('[data-rating-average]')),
          hasBreakdown: Boolean(rating?.querySelector('[data-rating-bar="5"]')) }
      };
    })()`);
    assert.ok(result.rootScroll <= width + 1, `Article should not overflow horizontally at ${width}px (scrollWidth ${result.rootScroll})`);
    assert.ok(result.found, `Article cover image should exist at ${width}px`);
    assert.ok(Math.abs(result.centerOffset) <= 1, `Article cover should be centered at ${width}px (offset ${result.centerOffset}px)`);
    assert.equal(result.display, 'block', `Article cover should remain block-level at ${width}px`);
    assert.ok(result.width <= Math.min(width, 896) + 1, `Article cover should fit its viewport/max-width at ${width}px`);
    assert.ok(result.rating.found, `Story rating widget should render at ${width}px`);
    assert.equal(result.rating.slug, articleSlug, `Story rating widget should use the article route ID at ${width}px`);
    assert.ok(result.rating.width <= width + 1, `Story rating widget should fit its viewport at ${width}px`);
    assert.deepEqual(result.rating.values, ['1', '2', '3', '4', '5'], `Story rating widget should expose five ordered choices at ${width}px`);
    assert.ok(result.rating.labels.every(label => typeof label === 'string' && label.length > 0), `Rating choices should have accessible labels at ${width}px`);
    assert.ok(result.rating.hasToast, `A live-region success toast should be available at ${width}px`);
    assert.ok(result.rating.hasToastBackdrop, `A decorative success backdrop should be available at ${width}px`);
    assert.ok(result.rating.hasCommentField && result.rating.commentInitiallyHidden, `Optional comment field should start hidden at ${width}px`);
    assert.ok(result.rating.hasCommentsButton && result.rating.hasCommentsDialog, `Separate comments dialog should be available at ${width}px`);
    assert.equal(result.rating.hasPrivacyNote, false, `The requested duplicate-vote footnote should be removed at ${width}px`);
    assert.ok(result.rating.hasStatus && result.rating.hasSummary && result.rating.hasBreakdown, `Rating summary, breakdown, and live status should render at ${width}px`);
    articleResults.push({ width, centerOffset: Math.round(result.centerOffset * 100) / 100, rootScroll: result.rootScroll });
  }

  let interaction = {
    status: 'skipped',
    reason: 'Remote Preview checks are read-only; interactive assertions run only in the isolated local fixture.'
  };
  if (!remoteUrl) {
    await createRatingHarness(articleSlug);
    await browser.call('Fetch.enable', {
      patterns: [{ urlPattern: '*://*/api/rating*', requestStage: 'Request' }]
    });
    await setViewport(browser, 390);
    await navigate(browser, `${baseUrl}/__rating-test__/`);
    const harnessReady = await browser.evaluate(`(async () => {
      let lastState;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const widget = document.querySelector('[data-rating-widget]');
        const input = widget?.querySelector('[data-rating-input]');
        lastState = {
          ready: widget?.getAttribute('aria-busy') === 'false' && input?.disabled === false,
          ariaBusy: widget?.getAttribute('aria-busy') || null,
          inputDisabled: input?.disabled ?? null,
          retryVisible: widget?.querySelector('[data-rating-retry]')?.hidden === false,
          message: widget?.querySelector('[data-rating-message]')?.textContent?.trim() || '',
          fetchTrace: window.__ratingTestFetchTrace || []
        };
        if (lastState.ready) return lastState;
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      return lastState || { ready: false, reason: 'rating widget was not rendered' };
    })()`);
    assert.ok(
      harnessReady.ready,
      'The isolated fixture should enable ratings with its API interception: ' +
        JSON.stringify({
          ...harnessReady,
          interceptedRequests: browser.fetchTrace,
          pausedRequests: browser.pausedRequests,
          networkRequests: browser.networkTrace
        })
    );
    assert.ok(
      browser.fetchTrace.some(request => new URL(request.url).pathname === '/api/rating'),
      'The isolated fixture should intercept the rating API request before the widget initializes.'
    );

    const modalResponsiveResults = [];
    await setViewport(browser, 390);
    const initialModal = await browser.evaluate(`(async () => {
      const openButton = document.querySelector('[data-comments-open]');
      const dialog = document.querySelector('[data-comments-dialog]');
      openButton?.click();
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const commentLoaded = Boolean(dialog?.querySelector('[data-comments-list] .story-comment'));
        const status = dialog?.querySelector('[data-comments-status]')?.textContent || '';
        if (dialog?.open && commentLoaded && !status.includes('අදහස් ලබාගනිමින්')) break;
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      return {
        open: Boolean(dialog?.open && dialog.matches(':modal')),
        commentLoaded: Boolean(dialog?.querySelector('[data-comments-list] .story-comment')),
        loading: Boolean(dialog?.querySelector('[data-comments-status]')?.textContent?.includes('අදහස් ලබාගනිමින්'))
      };
    })()`);
    assert.ok(initialModal.open && initialModal.commentLoaded && !initialModal.loading,
      'The isolated comments fixture should finish loading before responsive measurements');
    for (const width of widths) {
      await setViewport(browser, width);
      const modalLayout = await browser.evaluate(`(() => {
        const dialog = document.querySelector('[data-comments-dialog]');
        const rect = dialog?.getBoundingClientRect();
        const result = {
          open: Boolean(dialog?.open && dialog.matches(':modal')),
          left: rect?.left ?? null,
          right: rect?.right ?? null,
          width: rect?.width ?? null,
          height: rect?.height ?? null,
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
          pageWidth: document.documentElement.scrollWidth,
          borderColor: dialog ? getComputedStyle(dialog).borderTopColor : '',
          commentCardWidth: dialog?.querySelector('.story-comment')?.getBoundingClientRect().width ?? null
        };
        return result;
      })()`);
      assert.ok(modalLayout.open, `Comments dialog should open as a modal at ${width}px`);
      assert.ok(modalLayout.left >= -1 && modalLayout.right <= width + 1, `Comments dialog should stay within the ${width}px viewport`);
      assert.ok(modalLayout.height <= modalLayout.viewportHeight + 1, `Comments dialog should fit the ${width}px viewport height`);
      assert.ok(modalLayout.pageWidth <= width + 1, `Comments dialog should not introduce horizontal overflow at ${width}px`);
      assert.equal(modalLayout.borderColor, 'rgb(163, 59, 80)', `Comments dialog should retain its red frame at ${width}px`);
      assert.ok(modalLayout.commentCardWidth > 0 && modalLayout.commentCardWidth <= modalLayout.width,
        `Comment cards should fit inside the modal at ${width}px`);
      modalResponsiveResults.push({ width, dialogWidth: Math.round(modalLayout.width), dialogHeight: Math.round(modalLayout.height) });
    }

    await browser.evaluate(`(() => document.querySelector('[data-comments-close]')?.click())()`);
    await sleep(50);
    await setViewport(browser, 390);
    interaction = await browser.evaluate(`(async () => {
      const root = document.querySelector('[data-rating-widget]');
      const input = root?.querySelector('[data-rating-input][value="4"]');
      const option = input?.closest('[data-rating-option]');
      const star = option?.querySelector('.rating-star');
      const commentField = root?.querySelector('[data-rating-comment-field]');
      const commentInput = root?.querySelector('[data-rating-comment]');
      const commentCount = root?.querySelector('[data-rating-comment-length]');
      const commentInitiallyHidden = Boolean(commentField?.hidden);
      input?.click();
      await new Promise(resolve => setTimeout(resolve, 180));
      const selectedClassAfterClick = Boolean(option?.classList.contains('is-selected'));
      const inputCheckedAfterClick = input?.checked === true;
      const inputDisabledAfterClick = input?.disabled === true;
      const selectedBackground = option ? getComputedStyle(option).backgroundColor : '';
      const selectedStarColor = star ? getComputedStyle(star).color : '';
      const commentVisibleAfterRating = Boolean(commentField && !commentField.hidden);
      if (commentInput) {
        commentInput.value = 'පරීක්ෂණ අදහස';
        commentInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const commentCounter = commentCount?.textContent || '';
      root?.querySelector('[data-rating-submit]')?.click();
      const toast = root?.querySelector('[data-rating-toast]');
      const backdrop = root?.querySelector('[data-rating-toast-backdrop]');
      for (let attempt = 0; attempt < 40 && (toast?.hidden || backdrop?.hidden); attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const toastAppeared = Boolean(toast && !toast.hidden && toast.classList.contains('is-visible'));
      const backdropAppeared = Boolean(backdrop && !backdrop.hidden && backdrop.classList.contains('is-visible'));
      const toastText = toast?.textContent?.trim() || '';
      const toastRect = toast?.getBoundingClientRect();
      const toastStyle = toast ? getComputedStyle(toast) : null;
      const toastCentered = Boolean(toastRect && Math.abs(toastRect.left + toastRect.width / 2 - window.innerWidth / 2) <= 2
        && Math.abs(toastRect.top + toastRect.height / 2 - window.innerHeight / 2) <= 2);
      const toastBackground = toastStyle?.backgroundColor || '';
      const toastPosition = toastStyle?.position || '';
      const backdropRect = backdrop?.getBoundingClientRect();
      const backdropStyle = backdrop ? getComputedStyle(backdrop) : null;
      const backdropCoversViewport = Boolean(backdropRect && Math.abs(backdropRect.left) <= 1 && Math.abs(backdropRect.top) <= 1
        && Math.abs(backdropRect.width - window.innerWidth) <= 1 && Math.abs(backdropRect.height - window.innerHeight) <= 1);
      const backdropBackground = backdropStyle?.backgroundColor || '';
      const backdropFilter = [
        backdropStyle?.backdropFilter,
        backdropStyle?.webkitBackdropFilter,
        backdropStyle?.getPropertyValue('-webkit-backdrop-filter'),
      ].find(value => value && value.trim() !== 'none') || '';
      const backdropFilterSupported = CSS.supports('backdrop-filter', 'blur(1px)')
        || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
      const backdropPosition = backdropStyle?.position || '';
      await new Promise(resolve => setTimeout(resolve, 3900));
      const commentsButton = document.querySelector('[data-comments-open]');
      const dialog = document.querySelector('[data-comments-dialog]');
      commentsButton?.click();
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const commentLoaded = Boolean(dialog?.querySelector('[data-comments-list] .story-comment'));
        const status = dialog?.querySelector('[data-comments-status]')?.textContent || '';
        if (dialog?.open && commentLoaded && !status.includes('අදහස් ලබාගනිමින්')) break;
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      const dialogOpened = Boolean(dialog?.open && dialog.matches(':modal'));
      const pageLocked = Boolean(document.documentElement.classList.contains('story-comments-open')
        && document.body.classList.contains('story-comments-open')
        && document.body.style.overflow === 'hidden');
      const commentCard = dialog?.querySelector('.story-comment');
      const commentCardStyle = commentCard ? getComputedStyle(commentCard) : null;
      const commentCardBorderColor = commentCardStyle?.borderLeftColor || '';
      const commentCardBackground = commentCardStyle?.backgroundImage || '';
      const dialogBorderColor = dialog ? getComputedStyle(dialog).borderTopColor : '';
      const likeButton = dialog?.querySelector('.story-comment-action[aria-pressed]');
      const likeButtonStyle = likeButton ? getComputedStyle(likeButton) : null;
      const likeBorderColor = likeButtonStyle?.borderTopColor || '';
      const likeTapHeight = likeButton?.getBoundingClientRect().height || 0;
      likeButton?.click();
      for (let attempt = 0; attempt < 40 && likeButton?.getAttribute('aria-pressed') !== 'true'; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      const likeWorked = likeButton?.getAttribute('aria-pressed') === 'true'
        && /1/.test(likeButton.textContent || '');
      await new Promise(resolve => setTimeout(resolve, 180));
      const likedBackground = likeButton ? getComputedStyle(likeButton).backgroundColor : '';
      const likeButtonConnected = Boolean(likeButton?.isConnected);
      likeButton?.click();
      for (let attempt = 0; attempt < 40 && likeButton?.getAttribute('aria-pressed') !== 'false'; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      const likeToggleWorked = likeButton?.getAttribute('aria-pressed') === 'false'
        && /0/.test(likeButton.textContent || '');
      const replyDisclosure = dialog?.querySelector('.story-comment-reply-disclosure');
      const replyDisclosureInitiallyClosed = Boolean(replyDisclosure && !replyDisclosure.open);
      const replyCountInitiallyVisible = replyDisclosure?.querySelector('summary')?.textContent?.trim() || '';
      const replySummary = replyDisclosure?.querySelector('summary');
      replySummary?.click();
      const replyClickRevealsList = Boolean(replyDisclosure?.open && replyDisclosure.querySelector('[data-empty-replies]'));
      replySummary?.click();
      const replyButton = [...(dialog?.querySelectorAll('.story-comment-action') || [])]
        .find(button => button.textContent?.includes('පිළිතුරු'));
      replyButton?.click();
      const replyForm = dialog?.querySelector('.story-reply-form');
      const replyInput = replyForm?.querySelector('textarea');
      const replyInputStyle = replyInput ? getComputedStyle(replyInput) : null;
      const replyInputWidth = replyInput?.getBoundingClientRect().width || 0;
      const replyFormWidth = replyForm?.getBoundingClientRect().width || 0;
      const replyInputBackground = replyInputStyle?.backgroundColor || '';
      const replyInputBorderColor = replyInputStyle?.borderTopColor || '';
      if (replyInput) replyInput.value = 'පරීක්ෂණ පිළිතුර';
      replyForm?.requestSubmit();
      for (let attempt = 0; attempt < 40 && !dialog?.querySelector('.story-comment-replies .story-comment'); attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      const replyWorked = Boolean(dialog?.querySelector('.story-comment-replies .story-comment'));
      const replyCountAfterPost = dialog?.querySelector('.story-comment-reply-disclosure summary')?.textContent?.trim() || '';
      const replyListExpandedAfterPost = Boolean(dialog?.querySelector('.story-comment-reply-disclosure')?.open);
      const newReplyHighlighted = Boolean(dialog?.querySelector('.story-comment-new-reply .story-comment'));
      dialog?.querySelector('[data-comments-close]')?.click();
      await new Promise(resolve => setTimeout(resolve, 30));
      const dialogClosed = Boolean(dialog && !dialog.open);
      const pageUnlocked = Boolean(!document.documentElement.classList.contains('story-comments-open')
        && !document.body.classList.contains('story-comments-open')
        && document.body.style.overflow !== 'hidden');
      return {
        selectedClass: selectedClassAfterClick,
        inputCheckedAfterClick,
        inputDisabledAfterClick,
        selectedBackground,
        selectedStarColor,
        commentInitiallyHidden,
        commentVisibleAfterRating,
        commentCounter,
        toastAppeared,
        toastText,
        toastCentered,
        toastBackground,
        toastPosition,
        toastHiddenAfterTimeout: toast?.hidden || false,
        backdropAppeared,
        backdropCoversViewport,
        backdropBackground,
        backdropFilter,
        backdropFilterSupported,
        backdropPosition,
        backdropHiddenAfterTimeout: backdrop?.hidden || false,
        dialogOpened,
        pageLocked,
        dialogBorderColor,
        commentCardBorderColor,
        commentCardBackground,
        likeBorderColor,
        likeTapHeight,
        likedBackground,
        likeButtonConnected,
        likeWorked,
        likeToggleWorked,
        replyInputWidth,
        replyFormWidth,
        replyInputBackground,
        replyInputBorderColor,
        replyWorked,
        replyDisclosureInitiallyClosed,
        replyCountInitiallyVisible,
        replyClickRevealsList,
        replyCountAfterPost,
        replyListExpandedAfterPost,
        newReplyHighlighted,
        dialogClosed,
        pageUnlocked
      };
    })()`);
    const selectedGreen = interaction.selectedBackground.match(/\d+/g)?.map(Number);
    assert.ok(interaction.selectedClass, `Clicking a rating should mark the selected tile (checked=${interaction.inputCheckedAfterClick}, disabled=${interaction.inputDisabledAfterClick})`);
    assert.ok(selectedGreen && selectedGreen.length >= 3 && selectedGreen[1] > selectedGreen[0] && selectedGreen[1] > selectedGreen[2], 'The selected rating tile should turn green');
    const selectedStarChannels = interaction.selectedStarColor.match(/\d+/g)?.map(Number) || [];
    assert.ok(selectedStarChannels.length >= 3
      && selectedStarChannels[0] >= 220 && selectedStarChannels[0] <= 255
      && selectedStarChannels[1] >= 140 && selectedStarChannels[1] <= 205
      && selectedStarChannels[2] <= 100
      && selectedStarChannels[0] > selectedStarChannels[1]
      && selectedStarChannels[1] > selectedStarChannels[2],
    `The selected star should remain visibly gold, not match one browser's exact RGB rounding (computed=${interaction.selectedStarColor})`);
    assert.ok(interaction.commentInitiallyHidden, 'The optional comment field should stay hidden before a rating is chosen');
    assert.ok(interaction.commentVisibleAfterRating, 'Choosing a rating should reveal the optional comment field');
    assert.match(interaction.commentCounter, /[1-9]/, 'The optional comment should update its character counter');
    assert.ok(interaction.toastAppeared, 'A successful vote should display the thank-you toast');
    assert.match(interaction.toastText, /ස්තුතියි/);
    assert.equal(interaction.toastPosition, 'fixed', 'The thank-you toast should float above page content');
    assert.ok(interaction.toastCentered, 'The thank-you toast should be centered in the viewport, not anchored at the top or bottom');
    assert.equal(interaction.toastBackground, 'rgb(16, 53, 40)', 'The thank-you toast should retain its original green appearance');
    assert.ok(interaction.backdropAppeared, 'The transparent backdrop should appear with the thank-you toast');
    assert.equal(interaction.backdropPosition, 'fixed', 'The transparent backdrop should cover the viewport');
    assert.ok(interaction.backdropCoversViewport, 'The transparent backdrop should cover the full viewport');
    assert.equal(interaction.backdropBackground, 'rgba(0, 0, 0, 0)', 'The thank-you backdrop should have no color tint');
    assert.match(
      interaction.backdropFilter,
      /blur\(/,
      `The thank-you backdrop should blur the page without tinting it (CSS.supports=${interaction.backdropFilterSupported}, computed=${interaction.backdropFilter || 'none'})`,
    );
    assert.ok(interaction.toastHiddenAfterTimeout, 'The thank-you toast should dismiss itself');
    assert.ok(interaction.backdropHiddenAfterTimeout, 'The transparent backdrop should disappear with the thank-you toast');
    assert.equal(interaction.toastHiddenAfterTimeout, interaction.backdropHiddenAfterTimeout, 'The toast and backdrop should be dismissed together');
    assert.ok(interaction.dialogOpened, 'The separate comments dialog should open as a modal');
    assert.ok(interaction.pageLocked, 'The open modal should lock background scrolling and interaction');
    assert.equal(interaction.dialogBorderColor, 'rgb(163, 59, 80)', 'The modal should show the red accent frame');
    assert.equal(interaction.commentCardBorderColor, 'rgb(217, 65, 88)', 'Dynamically created comment cards should receive the red border styles');
    assert.match(interaction.commentCardBackground, /linear-gradient/, 'Comment cards should keep their separate dark surfaces');
    assert.equal(interaction.likeBorderColor, 'rgb(116, 49, 63)', 'Dynamically created like buttons should receive their red accent styles');
    assert.ok(interaction.likeTapHeight >= 44, 'The like action should have a comfortable touch target');
    assert.ok(interaction.likeButtonConnected, 'The like control should remain attached while its request completes');
    assert.equal(interaction.likedBackground, 'rgb(74, 24, 35)', 'A liked comment should receive a visible pressed state');
    assert.ok(interaction.likeWorked, 'A comment like should update its pressed state and count');
    assert.ok(interaction.likeToggleWorked, 'Clicking an active like should remove it and update its count');
    assert.ok(interaction.replyInputWidth > 0 && Math.abs(interaction.replyInputWidth - interaction.replyFormWidth) <= 2,
      'The dynamically created reply textarea should fill its card without overflowing');
    assert.equal(interaction.replyInputBackground, 'rgb(11, 9, 12)', 'The reply textarea should use the dark themed surface');
    assert.equal(interaction.replyInputBorderColor, 'rgb(113, 48, 61)', 'The reply textarea should use the red accent border');
    assert.ok(interaction.replyDisclosureInitiallyClosed, 'Existing replies should start collapsed');
    assert.equal(interaction.replyCountInitiallyVisible, 'පිළිතුරු 0', 'The reply count should be visible even when it is zero');
    assert.ok(interaction.replyClickRevealsList, 'Clicking the reply count should reveal the hidden reply list');
    assert.ok(interaction.replyWorked, 'A reply should appear under its parent comment');
    assert.equal(interaction.replyCountAfterPost, 'පිළිතුරු 1', 'Posting a reply should update the visible count');
    assert.ok(interaction.replyListExpandedAfterPost, 'Posting a reply should reveal the new reply');
    assert.ok(interaction.newReplyHighlighted, 'A newly posted reply should be visually highlighted');
    const postModalReady = await browser.evaluate("(async () => {\n  const openButton = document.querySelector('#comment-floating-btn');\n  const modal = document.querySelector('#comment-popup-modal');\n  openButton?.click();\n  for (let attempt = 0; attempt < 40; attempt += 1) {\n    if (modal?.querySelector('#comments-list-hook .post-comment-card')) break;\n    await new Promise(resolve => setTimeout(resolve, 25));\n  }\n  const card = modal?.querySelector('#comments-list-hook .post-comment-card');\n  const disclosure = card?.querySelector('.post-comment-replies');\n  return {\n    opened: Boolean(modal && !modal.classList.contains('hidden')),\n    loaded: Boolean(card),\n    collapsed: Boolean(disclosure && !disclosure.open),\n    replyCount: disclosure?.querySelector('summary')?.textContent?.trim() || '',\n  };\n})()");
    assert.ok(postModalReady.opened && postModalReady.loaded, 'The legacy post-comments dialog should load through the same-origin API');
    assert.ok(postModalReady.collapsed, 'Legacy replies should be collapsed by default');
    assert.equal(postModalReady.replyCount, 'පිළිතුරු 1', 'The legacy reply count should be visible before opening');

    const postModalResponsiveResults = [];
    for (const width of widths) {
      await setViewport(browser, width);
      const layout = await browser.evaluate("(() => {\n  const modal = document.querySelector('#comment-popup-modal');\n  const panel = modal?.querySelector(':scope > .relative');\n  const rect = panel?.getBoundingClientRect();\n  return {\n    left: rect?.left ?? null,\n    right: rect?.right ?? null,\n    width: rect?.width ?? null,\n    height: rect?.height ?? null,\n    pageWidth: document.documentElement.scrollWidth,\n    viewportHeight: innerHeight,\n  };\n})()");
      assert.ok(layout.left >= -1 && layout.right <= width + 1, 'The legacy comments panel should stay inside ' + width + 'px');
      assert.ok(layout.height <= layout.viewportHeight + 1, 'The legacy comments panel should fit vertically at ' + width + 'px');
      assert.ok(layout.pageWidth <= width + 1, 'The legacy comments dialog should not cause horizontal overflow at ' + width + 'px');
      postModalResponsiveResults.push({ width, panelWidth: Math.round(layout.width), panelHeight: Math.round(layout.height) });
    }
    await setViewport(browser, 390);
    const postCommentInteractions = await browser.evaluate("(async () => {\n  const modal = document.querySelector('#comment-popup-modal');\n  const card = modal?.querySelector('#comments-list-hook .post-comment-card');\n  const disclosure = card?.querySelector('.post-comment-replies');\n  const summary = disclosure?.querySelector('summary');\n  summary?.click();\n  const existingReplyRevealed = Boolean(disclosure?.open && disclosure.textContent?.includes('පැරණි පිළිතුර'));\n  const likeButton = card?.querySelector('.post-comment-actions .post-comment-action[aria-pressed]');\n  likeButton?.click();\n  for (let attempt = 0; attempt < 40 && likeButton?.getAttribute('aria-pressed') !== 'true'; attempt += 1) {\n    await new Promise(resolve => setTimeout(resolve, 25));\n  }\n  const likeWorked = likeButton?.getAttribute('aria-pressed') === 'true' && /1/.test(likeButton.textContent || '');\n  const replyButton = [...(card?.querySelectorAll('.post-comment-action') || [])]\n    .find(button => button.textContent?.includes('පිළිතුරක්'));\n  replyButton?.click();\n  const form = card?.querySelector('.post-comment-reply-form');\n  const textarea = form?.querySelector('textarea');\n  if (textarea) textarea.value = 'අලුත් post පිළිතුර';\n  form?.requestSubmit();\n  for (let attempt = 0; attempt < 40 && !card?.querySelector('.post-comment-reply-new .post-comment-reply'); attempt += 1) {\n    await new Promise(resolve => setTimeout(resolve, 25));\n  }\n  const newReplyHighlighted = Boolean(card?.querySelector('.post-comment-reply-new .post-comment-reply'));\n  const replyCount = disclosure?.querySelector('summary')?.textContent?.trim() || '';\n  const repliesExpandedAfterPost = Boolean(disclosure?.open);\n  document.querySelector('#comment-close-btn')?.click();\n  return { existingReplyRevealed, likeWorked, newReplyHighlighted, replyCount, repliesExpandedAfterPost };\n})()");
    assert.ok(postCommentInteractions.existingReplyRevealed, 'Clicking a legacy reply count should reveal its replies');
    assert.ok(postCommentInteractions.likeWorked, 'Legacy post comments should support working likes');
    assert.ok(postCommentInteractions.newReplyHighlighted, 'A newly added legacy reply should be highlighted');
    assert.equal(postCommentInteractions.replyCount, 'පිළිතුරු 2', 'Adding a legacy reply should update its count');
    assert.ok(postCommentInteractions.repliesExpandedAfterPost, 'A new legacy reply should open its reply list');
    assert.deepEqual(postModalResponsiveResults.map(result => result.width), widths);
    interaction.postComments = postCommentInteractions;
    interaction.postModalResponsiveResults = postModalResponsiveResults;

    assert.deepEqual(modalResponsiveResults.map(result => result.width), widths);
    interaction.modalResponsiveResults = modalResponsiveResults;
    interaction.status = 'PASS';
    interaction.fixture = 'isolated local rating and comments UI; all API calls stubbed';
  }

  console.log(JSON.stringify({ status: 'PASS', homepage: homeResults, article: articleResults, interaction, ageGateWasNotInteractedWith: true }, null, 2));
}

try {
  await main();
} finally {
  websocket?.close();
  await stop(chrome);
  await stop(previewServer);
  if (ratingHarnessDirectory) await rm(ratingHarnessDirectory, { recursive: true, force: true });
  if (profile) await rm(profile, { recursive: true, force: true });
}
