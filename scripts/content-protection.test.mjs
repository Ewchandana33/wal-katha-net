import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const layoutSource = readFileSync(
  resolve(repoRoot, "src/layouts/Base.astro"),
  "utf8",
);
const protectionSource = readFileSync(
  resolve(repoRoot, "public/scripts/deferred-perf.js"),
  "utf8",
);

function createProtectionHarness() {
  const listeners = new Map();
  const timers = new Map();
  let nextTimerId = 0;
  let now = 10_000;

  class FakeElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.attributes = {};
      this.className = "";
      this.textContent = "";
      this.allowSelect = false;
      this.classes = new Set();
      this.classList = {
        add: (...names) => names.forEach((name) => this.classes.add(name)),
        remove: (...names) => names.forEach((name) => this.classes.delete(name)),
        contains: (name) => this.classes.has(name),
      };
    }

    setAttribute(name, value) {
      this.attributes[name] = value;
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }

    querySelector(selector) {
      const className = selector.startsWith(".") ? selector.slice(1) : "";
      return this.children.find((child) => child.className === className) ?? null;
    }

    closest() {
      return this.allowSelect ? this : null;
    }
  }

  const document = {
    body: new FakeElement("body"),
    addEventListener(type, listener) {
      const registered = listeners.get(type) ?? [];
      registered.push(listener);
      listeners.set(type, registered);
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    getElementById(id) {
      return this.body.children.find((child) => child.id === id) ?? null;
    },
  };

  const window = {};
  vm.runInNewContext(
    protectionSource,
    {
      Date: { now: () => now },
      PerformanceObserver: undefined,
      clearTimeout(id) {
        timers.delete(id);
      },
      document,
      navigator: {},
      setTimeout(callback, delay) {
        const id = ++nextTimerId;
        timers.set(id, { callback, delay });
        return id;
      },
      window,
    },
    { filename: "public/scripts/deferred-perf.js" },
  );

  return {
    advanceTime(milliseconds) {
      now += milliseconds;
    },
    createTarget(tagName, allowSelect = false) {
      const target = new FakeElement(tagName);
      target.allowSelect = allowSelect;
      return target;
    },
    dispatch(type, target) {
      const event = {
        defaultPrevented: false,
        target,
        preventDefault() {
          this.defaultPrevented = true;
        },
      };
      for (const listener of listeners.get(type) ?? []) listener(event);
      return event;
    },
    document,
    fireTimer(id) {
      const timer = timers.get(id);
      assert.ok(timer, `expected timer ${id} to be scheduled`);
      timers.delete(id);
      timer.callback();
    },
    getTimers() {
      return [...timers.entries()];
    },
    window,
  };
}

test("copy protection blocks casual selection and restores the centered toast", () => {
  assert.match(layoutSource, /body\s*\{[^}]*user-select:\s*none/s);
  assert.match(layoutSource, /#content-protection-toast\s*\{[^}]*position:\s*fixed/s);
  assert.match(layoutSource, /#content-protection-toast\s*\{[^}]*opacity:\s*0/s);
  assert.match(layoutSource, /#content-protection-toast\.show\s*\{[^}]*opacity:\s*1/s);
  assert.match(layoutSource, /\[data-allow-select\]\s*\{[^}]*user-select:\s*text/s);
});

test("copy and context-menu attempts show a notice that auto-dismisses", () => {
  const harness = createProtectionHarness();
  const articleText = harness.createTarget("p");

  const contextMenu = harness.dispatch("contextmenu", articleText);
  assert.equal(contextMenu.defaultPrevented, true);

  const toast = harness.document.getElementById("content-protection-toast");
  assert.ok(toast);
  assert.equal(toast.attributes.role, "status");
  assert.equal(toast.attributes["aria-live"], "polite");
  assert.equal(toast.classList.contains("show"), true);
  assert.ok(toast.querySelector(".cp-text")?.textContent.length > 0);

  const [[timerId, timer]] = harness.getTimers();
  assert.equal(timer.delay, 2600);
  harness.fireTimer(timerId);
  assert.equal(toast.classList.contains("show"), false);

  harness.advanceTime(2201);
  const copy = harness.dispatch("copy", articleText);
  assert.equal(copy.defaultPrevented, true);
  assert.equal(toast.classList.contains("show"), true);
});

test("editable controls and explicitly allowed UI remain usable", () => {
  const harness = createProtectionHarness();

  assert.equal(
    harness.dispatch("copy", harness.createTarget("textarea")).defaultPrevented,
    false,
  );
  assert.equal(
    harness.dispatch(
      "contextmenu",
      harness.createTarget("div", true),
    ).defaultPrevented,
    false,
  );
  assert.equal(harness.window.__wkPerfBundleLoaded, true);
});
