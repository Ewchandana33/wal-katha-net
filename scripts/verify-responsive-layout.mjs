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
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
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
  websocket.addEventListener('message', event => {
    let message;
    try { message = JSON.parse(String(event.data)); } catch { return; }
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject, timer } = pending.get(message.id);
    clearTimeout(timer);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message);
  });
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
  const evaluate = async expression => {
    const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (response.result?.exceptionDetails) {
      throw new Error(response.result.exceptionDetails.exception?.description || response.result.exceptionDetails.text);
    }
    return response.result?.result?.value;
  };
  await call('Page.enable');
  await call('Runtime.enable');
  return { call, evaluate };
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

  if (!remoteUrl) {
    await browser.call('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
        const nativeFetch = window.fetch.bind(window);
        const makeResponse = (data, status = 200) => new Response(JSON.stringify(data), {
          status,
          headers: { 'Content-Type': 'application/json' }
        });
        window.fetch = async (input, init = {}) => {
          const rawUrl = typeof input === 'string' ? input : input?.url;
          const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
          const pathname = rawUrl ? new URL(rawUrl, location.href).pathname : '';
          if (pathname !== '/api/rating') return nativeFetch(input, init);
          if (method === 'GET') return makeResponse({
            average_rating: 0, total_votes: 0, total_stars: 0,
            rating_counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, has_voted: false
          });
          if (method === 'POST') return makeResponse({
            average_rating: 4, total_votes: 1, total_stars: 4,
            rating_counts: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 0 },
            has_voted: true, user_rating: 4
          }, 201);
          return nativeFetch(input, init);
        };
      })();`
    });
  }

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
    await setViewport(browser, 390);
    await navigate(browser, `${baseUrl}/__rating-test__/`);
    const harnessReady = await browser.evaluate(`(async () => {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const widget = document.querySelector('[data-rating-widget]');
        if (widget?.getAttribute('aria-busy') === 'false') return true;
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      return false;
    })()`);
    assert.ok(harnessReady, 'The isolated rating fixture should initialize against the stub API');

    interaction = await browser.evaluate(`(async () => {
      const root = document.querySelector('[data-rating-widget]');
      const input = root?.querySelector('[data-rating-input][value="4"]');
      const option = input?.closest('[data-rating-option]');
      const star = option?.querySelector('.rating-star');
      input?.click();
      await new Promise(resolve => setTimeout(resolve, 180));
      const selectedBackground = option ? getComputedStyle(option).backgroundColor : '';
      const selectedStarColor = star ? getComputedStyle(star).color : '';
      root?.querySelector('[data-rating-submit]')?.click();
      const toast = root?.querySelector('[data-rating-toast]');
      for (let attempt = 0; attempt < 40 && toast?.hidden; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      const toastAppeared = Boolean(toast && !toast.hidden && toast.classList.contains('is-visible'));
      const toastText = toast?.textContent?.trim() || '';
      await new Promise(resolve => setTimeout(resolve, 3900));
      return {
        selectedClass: option?.classList.contains('is-selected') || false,
        selectedBackground,
        selectedStarColor,
        toastAppeared,
        toastText,
        toastHiddenAfterTimeout: toast?.hidden || false
      };
    })()`);
    const selectedGreen = interaction.selectedBackground.match(/\d+/g)?.map(Number);
    assert.ok(interaction.selectedClass, 'Clicking a rating should mark the selected tile');
    assert.ok(selectedGreen && selectedGreen.length >= 3 && selectedGreen[1] > selectedGreen[0] && selectedGreen[1] > selectedGreen[2], 'The selected rating tile should turn green');
    assert.equal(interaction.selectedStarColor, 'rgb(243, 180, 59)', 'The selected star should remain gold');
    assert.ok(interaction.toastAppeared, 'A successful vote should display the thank-you toast');
    assert.match(interaction.toastText, /ස්තුතියි/);
    assert.ok(interaction.toastHiddenAfterTimeout, 'The thank-you toast should dismiss itself');
    interaction.status = 'PASS';
    interaction.fixture = 'isolated local widget; all rating API calls stubbed';
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
