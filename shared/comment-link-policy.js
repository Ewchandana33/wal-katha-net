const LINK_TOKEN_SOURCE = [
  String.raw`\b[a-z][a-z\d+.-]*:\/\/[^\s<>"'\x60]+`,
  String.raw`\bwww\.[^\s<>"'\x60]+`,
  String.raw`(?<![\p{L}\p{N}_@.-])(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+\p{L}{2,}(?::\d{1,5})?(?:[/?#][^\s<>"'\x60)]*)?`,
  String.raw`\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?(?:[/?#][^\s<>"'\x60)]*)?`,
].join("|");

const INVISIBLE_CHARACTERS = /[\u00ad\u200b-\u200f\u2060\ufeff]/g;

function normalizeForLinkDetection(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(INVISIBLE_CHARACTERS, "")
    .replace(/&(?:period|dot);/gi, ".")
    .replace(/&#(?:0*46|x0*2e);/gi, ".")
    .replace(/&colon;/gi, ":")
    .replace(/&#0*58;/gi, ":")
    .replace(/&sol;/gi, "/")
    .replace(/&#0*47;/gi, "/")
    .replace(/\[\s*(?:\.|dot)\s*\]|\(\s*(?:\.|dot)\s*\)/gi, ".")
    .replace(/\s+dot\s+/gi, ".")
    .replace(/\s*\.\s*/g, ".")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*\/\s*/g, "/")
    .toLowerCase();
}

function matchesLinkPattern(value) {
  return new RegExp(LINK_TOKEN_SOURCE, "iu").test(value);
}

export function containsDisallowedLink(value) {
  const normalized = normalizeForLinkDetection(value);
  return (
    matchesLinkPattern(normalized) ||
    matchesLinkPattern(normalized.replace(/\s+/g, ""))
  );
}

export function watchCommentLinks(input, onLinkDetected) {
  if (
    !input ||
    typeof input.addEventListener !== "function" ||
    typeof input.removeEventListener !== "function" ||
    typeof onLinkDetected !== "function"
  ) {
    return () => {};
  }

  let hadDisallowedLink = false;
  const checkForLink = () => {
    const hasDisallowedLink = containsDisallowedLink(input.value);
    if (hasDisallowedLink && !hadDisallowedLink) onLinkDetected();
    hadDisallowedLink = hasDisallowedLink;
  };

  input.addEventListener("input", checkForLink);
  checkForLink();
  return () => input.removeEventListener("input", checkForLink);
}

export function sanitizeCommentText(value) {
  const original = typeof value === "string" ? value.trim() : "";
  if (!original || !containsDisallowedLink(original)) return original;

  const markdownLinkPattern = /\[([^\]\n]{1,200})\]\(\s*[^)\n]{1,2048}\s*\)/giu;
  const withoutMarkdownDestinations = original.replace(
    markdownLinkPattern,
    (match, label) => (containsDisallowedLink(match) ? label : match),
  );
  const sanitized = withoutMarkdownDestinations
    .replace(new RegExp(LINK_TOKEN_SOURCE, "giu"), " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized || containsDisallowedLink(sanitized)) {
    return "සබැඳිය අඩංගු වූ අදහසක් ඉවත් කර ඇත.";
  }
  return sanitized;
}
