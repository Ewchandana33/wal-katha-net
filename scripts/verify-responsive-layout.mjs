#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
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
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Chrome DevTools call timed out: ${method}`));
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

async function main() {
  if (!remoteUrl) {
    previewServer = spawn('yarn', ['preview', '--host', '127.0.0.1', '--port', '4321'], { stdio: 'ignore' });
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

  const homeResults = [];
  for (let i = 0; i < widths.length; i++) {
    const width = widths[i];
    await setViewport(browser, width);
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
      if (bannerImage) {
        try { await bannerImage.decode(); } catch {}
      }
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
  const articleResults = [];
  for (const width of widths) {
    await setViewport(browser, width);
    const result = await browser.evaluate(`(() => {
      const root = document.documentElement;
      const image = document.querySelector('article img.max-w-4xl');
      if (!image) return { viewport: innerWidth, rootScroll: root.scrollWidth, found: false };
      const rect = image.getBoundingClientRect();
      return {
        viewport: innerWidth, rootScroll: root.scrollWidth, found: true,
        centerOffset: rect.left + rect.width / 2 - innerWidth / 2,
        width: rect.width, display: getComputedStyle(image).display
      };
    })()`);
    assert.ok(result.rootScroll <= width + 1, `Article should not overflow horizontally at ${width}px (scrollWidth ${result.rootScroll})`);
    assert.ok(result.found, `Article cover image should exist at ${width}px`);
    assert.ok(Math.abs(result.centerOffset) <= 1, `Article cover should be centered at ${width}px (offset ${result.centerOffset}px)`);
    assert.equal(result.display, 'block', `Article cover should remain block-level at ${width}px`);
    assert.ok(result.width <= Math.min(width, 896) + 1, `Article cover should fit its viewport/max-width at ${width}px`);
    articleResults.push({ width, centerOffset: Math.round(result.centerOffset * 100) / 100, rootScroll: result.rootScroll });
  }

  console.log(JSON.stringify({ status: 'PASS', homepage: homeResults, article: articleResults, ageGateWasNotInteractedWith: true }, null, 2));
}

try {
  await main();
} finally {
  websocket?.close();
  await stop(chrome);
  await stop(previewServer);
  if (profile) await rm(profile, { recursive: true, force: true });
}
