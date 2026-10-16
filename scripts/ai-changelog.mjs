import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_ACTIVE_ENTRIES = 5;
const MAX_ACTIVE_BYTES = 20 * 1024;
const RECENT_HEADING = "## Recent entries";

function datedSections(text) {
  const headings = [...text.matchAll(/^## (\d{4}-\d{2}-\d{2}) — [^\r\n]+$/gm)];
  return headings.map((heading, index) => ({
    date: heading[1],
    heading: heading[0],
    start: heading.index,
    end: index + 1 < headings.length ? headings[index + 1].index : text.length,
  }));
}

function archivePathFor(activePath, date) {
  const year = date.slice(0, 4);
  const month = Number(date.slice(5, 7));
  const quarter = Math.floor((month - 1) / 3) + 1;
  return {
    relativePath: "archive/AI_CHANGELOG-" + year + "-Q" + quarter + ".md",
    absolutePath: path.join(path.dirname(activePath), "archive", "AI_CHANGELOG-" + year + "-Q" + quarter + ".md"),
  };
}

function archiveMetadata(text) {
  const dates = datedSections(text).map((entry) => entry.date).sort();
  if (!dates.length) throw new Error("Refusing to index an archive without dated entries.");
  return { count: dates.length, first: dates[0], last: dates[dates.length - 1] };
}

function updateArchiveCoverage(text) {
  const meta = archiveMetadata(text);
  const line = "Coverage: " + meta.first + " through " + meta.last + "; " + meta.count + " dated entries.";
  if (/^Coverage:.*$/m.test(text)) return text.replace(/^Coverage:.*$/m, line);
  const firstParagraphEnd = text.indexOf("\n\n");
  if (firstParagraphEnd < 0) return text.trimEnd() + "\n\n" + line + "\n";
  return text.slice(0, firstParagraphEnd + 2) + line + "\n\n" + text.slice(firstParagraphEnd + 2);
}

function updateArchiveIndex(active, relativePath, archiveText) {
  const start = active.indexOf("## Archive index");
  if (start < 0) throw new Error("AI_CHANGELOG.md has no Archive index heading.");
  const next = active.indexOf("\n## ", start + RECENT_HEADING.length);
  const end = next < 0 ? active.length : next;
  const block = active.slice(start, end);
  const meta = archiveMetadata(archiveText);
  const line = "- " + relativePath + " — " + meta.count + " earlier dated entries from " + meta.first + " through " + meta.last + "; dated sections are retained verbatim.";
  const lines = block.split(/\r?\n/);
  const existing = lines.findIndex((item) => item.startsWith("- " + relativePath + " —"));
  if (existing >= 0) lines[existing] = line;
  else lines.push(line);
  const replacement = lines.join("\n").replace(/\n+$/, "") + "\n";
  return active.slice(0, start) + replacement + active.slice(end);
}

async function appendArchiveEntry(activePath, section) {
  const dateMatch = section.match(/^## (\d{4}-\d{2}-\d{2}) — /);
  if (!dateMatch) throw new Error("Cannot archive a changelog section without a dated heading.");
  const destination = archivePathFor(activePath, dateMatch[1]);
  let archive = "";
  try {
    archive = await readFile(destination.absolutePath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (archive.includes(section)) return { ...destination, content: archive };
  if (!archive) {
    const month = Number(dateMatch[1].slice(5, 7));
    const quarter = Math.floor((month - 1) / 3) + 1;
    archive = "# Archived AI Change Log — " + dateMatch[1].slice(0, 4) + " Q" + quarter + "\n\n" +
      "Historical entries moved from AI_CHANGELOG.md under the active-log retention policy. Dated sections retain their original wording and chronological order. Read AI_CHANGELOG.md first for active instructions and the latest status.\n\n";
  }
  archive = archive.replace(/\s+$/, "") + "\n\n" + section.replace(/\s+$/, "") + "\n";
  archive = updateArchiveCoverage(archive);
  await mkdir(path.dirname(destination.absolutePath), { recursive: true });
  await writeFile(destination.absolutePath, archive, "utf8");
  return { ...destination, content: archive };
}

export async function recordAiChange(activePath, entry) {
  const cleanEntry = String(entry || "").trim();
  const headingMatch = cleanEntry.match(/^(## \d{4}-\d{2}-\d{2} — [^\r\n]+)/);
  if (!headingMatch) throw new Error("A changelog entry must start with a dated level-two heading.");
  let active = await readFile(activePath, "utf8");
  const marker = active.indexOf(RECENT_HEADING);
  if (marker < 0) throw new Error("AI_CHANGELOG.md has no Recent entries heading.");
  const markerEnd = marker + RECENT_HEADING.length;
  if (active.includes(cleanEntry)) return false;
  const dateMatch = headingMatch[1].match(/^## (\d{4}-\d{2}-\d{2}) — /);
  const sameQuarterArchive = archivePathFor(activePath, dateMatch[1]);
  try {
    const archived = await readFile(sameQuarterArchive.absolutePath, "utf8");
    if (archived.includes(cleanEntry)) return false;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const existingTail = active.slice(markerEnd).replace(/^(?:\r?\n)+/, "").replace(/\s+$/, "");
  active = active.slice(0, markerEnd) + "\n\n" + cleanEntry + (existingTail ? "\n\n" + existingTail : "\n");

  while (true) {
    const tail = active.slice(markerEnd);
    const leading = (tail.match(/^(?:\r?\n)+/) || [""])[0].length;
    const recent = tail.slice(leading);
    const sections = datedSections(recent);
    const overLimit = sections.length > MAX_ACTIVE_ENTRIES || Buffer.byteLength(active, "utf8") > MAX_ACTIVE_BYTES;
    if (!overLimit) break;
    if (sections.length <= 1) throw new Error("A single active changelog entry exceeds the 20 KiB limit; refusing to archive it automatically.");
    const oldest = sections[sections.length - 1];
    const section = recent.slice(oldest.start, oldest.end).replace(/\s+$/, "");
    const absoluteStart = markerEnd + leading + oldest.start;
    const archived = await appendArchiveEntry(activePath, section);
    active = active.slice(0, absoluteStart).replace(/\s+$/, "") + "\n";
    active = updateArchiveIndex(active, archived.relativePath, archived.content);
  }
  await writeFile(activePath, active, "utf8");
  return true;
}
