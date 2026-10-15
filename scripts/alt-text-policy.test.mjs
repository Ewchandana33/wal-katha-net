import assert from "node:assert/strict";
import test from "node:test";
import { coverAltForTitle, hasBrandTerm, isAcceptableCoverAlt, isSensitiveTitle, SAFE_COVER_ALT } from "./alt-text-policy.mjs";

test("safe title-derived labels are deterministic and brand-free", () => {
  const expected = "නිමාලි සහ බොස් කතාවේ කවර රූපය";
  assert.equal(coverAltForTitle("නිමාලි සහ බොස් - office wal katha"), expected);
  assert.equal(coverAltForTitle("නිමාලි සහ බොස් - office wal katha"), expected);
  assert.equal(hasBrandTerm(expected), false);
});

test("all Sinhala and Latin brand variants are detected and removed", () => {
  for (const term of ["Wal Katha", "Sinhala Wal Katha", "wala katha", "වැල් කතා", "වැල කතා", "වල් කතා"]) assert.equal(hasBrandTerm(term), true, term);
  assert.equal(coverAltForTitle("නෙතූගේ වැල කතා - Nethuge Wal Katha"), "නෙතූගේ කතාවේ කවර රූපය");
});

test("age-sensitive English and Sinhala titles use only the generic fallback", () => {
  for (const title of ["School Wal Katha", "A student story", "Mage Nangi", "Thaththa Duwa", "ප්‍රථම පාසල් ප්‍රේමය", "තාත්තයි දුවයි"]) {
    assert.equal(isSensitiveTitle(title), true, title);
    assert.equal(coverAltForTitle(title), SAFE_COVER_ALT, title);
    assert.equal(isAcceptableCoverAlt(SAFE_COVER_ALT, title), true, title);
  }
});

test("missing, branded, sensitive, and overlong alt values are rejected", () => {
  assert.equal(isAcceptableCoverAlt("", "Wanamalee"), false);
  assert.equal(isAcceptableCoverAlt("Wal Katha cover", "Wanamalee"), false);
  assert.equal(isAcceptableCoverAlt("School story cover", "School Wal Katha"), false);
  assert.equal(isAcceptableCoverAlt("x".repeat(126), "Wanamalee"), false);
  assert.equal(isAcceptableCoverAlt("Wanamalee කතාවේ කවර රූපය", "Wanamalee"), true);
});
