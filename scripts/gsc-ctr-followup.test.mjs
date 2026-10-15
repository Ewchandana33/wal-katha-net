import assert from "node:assert/strict";
import test from "node:test";
import {
  addDays,
  aggregateRows,
  BASELINE_WINDOW,
  compareMetrics,
  getPostWindow,
  hasEnoughGlobalImpressions,
  MIN_GLOBAL_IMPRESSIONS,
  RELEASE_AT,
} from "./gsc-ctr-followup.mjs";

test("baseline is an inclusive 28-day pre-release window", () => {
  assert.equal(BASELINE_WINDOW.startDate, "2026-09-15");
  assert.equal(BASELINE_WINDOW.endDate, "2026-10-12");
  assert.equal((Date.parse(BASELINE_WINDOW.endDate + "T00:00:00Z") - Date.parse(BASELINE_WINDOW.startDate + "T00:00:00Z")) / 86400000 + 1, 28);
});

test("post window waits at least seven days after release and after a verified crawl", () => {
  assert.equal(getPostWindow("2026-10-15T09:24:29Z"), null);
  assert.deepEqual(getPostWindow(RELEASE_AT), { startDate: "2026-10-22", endDate: "2026-11-18" });
  assert.deepEqual(getPostWindow("2026-10-20T23:59:59Z"), { startDate: "2026-10-22", endDate: "2026-11-18" });
  assert.deepEqual(getPostWindow("2026-10-22T00:01:00Z"), { startDate: "2026-10-23", endDate: "2026-11-19" });
});

test("date arithmetic handles month and year boundaries", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
});

test("aggregates clicks, impressions, CTR and impression-weighted average position", () => {
  assert.deepEqual(aggregateRows([
    { clicks: 5, impressions: 100, position: 4 },
    { clicks: 3, impressions: 100, position: 8 },
  ]), { clicks: 8, impressions: 200, ctr: 0.04, position: 6 });
  assert.deepEqual(aggregateRows([]), { clicks: 0, impressions: 0, ctr: null, position: null });
});

test("CTR change is reported in percentage points and relative percent", () => {
  assert.deepEqual(compareMetrics({ ctr: 0.02 }, { ctr: 0.03 }), { deltaPp: 1, relativeChangePct: 49.99999999999999 });
  assert.deepEqual(compareMetrics({ ctr: null }, { ctr: 0.03 }), { deltaPp: null, relativeChangePct: null });
});

test("the result waits for the minimum global impressions in both windows", () => {
  assert.equal(hasEnoughGlobalImpressions({ impressions: MIN_GLOBAL_IMPRESSIONS }, { impressions: MIN_GLOBAL_IMPRESSIONS }), true);
  assert.equal(hasEnoughGlobalImpressions({ impressions: MIN_GLOBAL_IMPRESSIONS - 1 }, { impressions: MIN_GLOBAL_IMPRESSIONS }), false);
  assert.equal(hasEnoughGlobalImpressions({ impressions: MIN_GLOBAL_IMPRESSIONS }, { impressions: 0 }), false);
});
