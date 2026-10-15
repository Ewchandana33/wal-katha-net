export const SAFE_COVER_ALT = "මෙම කතාවේ කවර රූපය";

const BRAND_RE = /\b(?:sinhala\s+)?(?:wal|wala|val|vael)[\s._-]*kath(?:a)?\b|\b(?:walkatha|walakatha)\b|(?:වල්|වල|වැල්|වැල)[\s\u200d._-]*කතා/iu;
const BRAND_RE_GLOBAL = /\b(?:sinhala\s+)?(?:wal|wala|val|vael)[\s._-]*kath(?:a)?\b|\b(?:walkatha|walakatha)\b|(?:වල්|වල|වැල්|වැල)[\s\u200d._-]*කතා/giu;
const SENSITIVE_TITLE_RE = /\b(?:school|student|teen(?:ager|age)?|underage|minor|child(?:ren)?|kids?|youth|girl|boy|sister|brother|daughter|son|nangi|akka|duwa|podi|young|virgin)\b|(?:පාසල්|ඉස්කෝල|ශිෂ්‍ය|සිසු|නංගි|අක්කා|දුව|දියණිය|තාත්තා|පුතා|ළමා|දරුවා|යෞවන|දැරිය|කුඩා)/iu;
const EXPLICIT_RE = /\b(?:sex(?:ual)?|nude|nudity|naked|porn(?:o)?|erotic|adult|xxx|rape|incest)\b|(?:ලිංගික|නිරුවත්|අසභ්‍ය|කාම)/iu;

export function hasBrandTerm(value) {
  return BRAND_RE.test(String(value || ""));
}

export function isSensitiveTitle(value) {
  const text = String(value || "");
  return SENSITIVE_TITLE_RE.test(text) || EXPLICIT_RE.test(text);
}

export function readFrontmatterScalar(frontmatter, field) {
  const line = frontmatter.split(/\r?\n/).find((row) => new RegExp("^" + field + "\\s*:").test(row));
  if (!line) return "";
  let value = line.replace(new RegExp("^" + field + "\\s*:\\s*"), "").trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value); } catch { return value.slice(1, -1); }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
  return value.replace(/\s+#.*$/, "").trim();
}

export function coverAltForTitle(title) {
  const raw = String(title || "").normalize("NFC").trim();
  if (!raw || isSensitiveTitle(raw)) return SAFE_COVER_ALT;
  let candidate = raw.split(/\s+[—–-]\s+/u)[0];
  candidate = candidate
    .replace(BRAND_RE_GLOBAL, " ")
    .replace(/\b(?:sinhala|new|latest|free|read|online|story|stories|collection|202\d)\b/giu, " ")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  if (!candidate || hasBrandTerm(candidate) || isSensitiveTitle(candidate)) return SAFE_COVER_ALT;
  if (candidate.length > 85) candidate = candidate.slice(0, 85).replace(/\s+\S*$/u, "").trim();
  if (!candidate) return SAFE_COVER_ALT;
  return candidate + " කතාවේ කවර රූපය";
}

export function isAcceptableCoverAlt(alt, title) {
  const value = String(alt || "").normalize("NFC").trim();
  if (!value || value.length > 125 || hasBrandTerm(value) || isSensitiveTitle(value)) return false;
  if (isSensitiveTitle(title)) return value === SAFE_COVER_ALT;
  return true;
}
