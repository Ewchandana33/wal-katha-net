import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import sharp from "sharp";
import PDFDocument from "pdfkit";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const BOTTOM_MARGIN = 74;
const WATERMARK = "https://www.walakatha.net";
const PAGE_BACKGROUND = "#0b0b0b";
const CARD_BACKGROUND = "#141414";
const ACCENT = "#e74c3c";
const BODY_FONT_SIZE = 10.5;
const BODY_LINE_GAP = BODY_FONT_SIZE * 0.72;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BRAND = "WALAKATHA.NET  |  SINHALA READER EDITION";

type ArticlePdfInput = {
  title: string;
  body: string;
  sourceUrl: string;
  coverImagePath: string;
  coverImageAlt?: string;
  publishedDate?: string;
};

type TextBlock = {
  kind: "paragraph" | "heading" | "list" | "dialogue";
  text: string;
};

type PreparedCoverImage = {
  bytes: Buffer;
  width: number;
  height: number;
};

const COVER_IMAGE_PATH = /^\/images\/posts\/[A-Za-z0-9._-]+\.(?:avif|jpe?g|png|webp)$/i;
const QUOTED_DIALOGUE = /“[^”"“\r\n]{1,1600}(?:”|"|“)|„[^”"“\r\n]{1,1600}“|"[^"\r\n]{2,1600}"/gu;

async function prepareCoverImage(imagePath: string): Promise<PreparedCoverImage> {
  if (!COVER_IMAGE_PATH.test(imagePath)) {
    throw new Error(
      "Article PDF cover must be a local /images/posts asset; received: " +
        (imagePath || "(missing)") +
        ".",
    );
  }

  const postsRoot = resolve(process.cwd(), "public/images/posts");
  const sourcePath = resolve(process.cwd(), "public", imagePath.slice(1));
  if (!sourcePath.startsWith(postsRoot + sep)) {
    throw new Error("Article PDF cover path escapes the post image directory: " + imagePath + ".");
  }

  const sourceBytes = readFileSync(sourcePath);
  const sourceImage = sharp(sourceBytes, { failOn: "error" });
  const metadata = await sourceImage.metadata();
  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new Error("Article PDF cover has unreadable image dimensions: " + imagePath + ".");
  }

  // Preserve JPEG and PNG cover bytes exactly when PDFKit can embed them as-is.
  // WebP/AVIF or EXIF-rotated assets are normalized to lossless PNG pixels; no
  // crop, text removal, watermark removal, or lossy re-encoding is applied.
  const pdfKitNative = metadata.format === "jpeg" || metadata.format === "png";
  const needsOrientation = typeof metadata.orientation === "number" && metadata.orientation !== 1;
  if (pdfKitNative && !needsOrientation) {
    return { bytes: sourceBytes, width: metadata.width, height: metadata.height };
  }

  const normalizedBytes = await sharp(sourceBytes, { failOn: "error" })
    .rotate()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const normalized = await sharp(normalizedBytes).metadata();
  if (!normalized.width || !normalized.height) {
    throw new Error("Article PDF cover could not be normalized: " + imagePath + ".");
  }
  return { bytes: normalizedBytes, width: normalized.width, height: normalized.height };
}

function plainInlineText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<https?:\/\/[^>]+>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\x60{1,3}(.*?)\x60{1,3}/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\\([\\\x60*_{}\[\]()#+\-.!>])/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function splitQuotedDialogue(text: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let cursor = 0;
  for (const match of text.matchAll(QUOTED_DIALOGUE)) {
    const start = match.index ?? cursor;
    const preceding = text.slice(cursor, start).trim();
    if (preceding) blocks.push({ kind: "paragraph", text: preceding });
    const dialogue = match[0].trim();
    if (dialogue) blocks.push({ kind: "dialogue", text: dialogue });
    cursor = start + match[0].length;
  }
  const trailing = text.slice(cursor).trim();
  if (trailing) blocks.push({ kind: "paragraph", text: trailing });
  if (!blocks.length && text.trim()) blocks.push({ kind: "paragraph", text: text.trim() });
  return blocks;
}

function markdownToBlocks(markdown: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let paragraph: string[] = [];
  let inCodeFence = false;

  const flushParagraph = () => {
    const text = plainInlineText(paragraph.join(" "));
    if (text) blocks.push(...splitQuotedDialogue(text));
    paragraph = [];
  };

  for (const rawLine of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (/^```/.test(line) || /^~~~/.test(line)) {
      flushParagraph();
      inCodeFence = !inCodeFence;
      continue;
    }
    if (!line) {
      flushParagraph();
      continue;
    }
    if (inCodeFence) {
      paragraph.push(line);
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const text = plainInlineText(heading[1]);
      if (text) blocks.push({ kind: "heading", text });
      continue;
    }

    const listItem = line.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
    if (listItem) {
      flushParagraph();
      const text = plainInlineText(listItem[1]);
      if (text) blocks.push({ kind: "list", text: "• " + text });
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      const text = plainInlineText(line.replace(/^>\s?/, ""));
      if (text) blocks.push({ kind: "dialogue", text });
      continue;
    }

    if (/^(?:---+|\*\*\*+|___+)$/.test(line)) {
      flushParagraph();
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

function drawPageChrome(document: InstanceType<typeof PDFDocument>): void {
  const inset = 18;
  const cardWidth = PAGE_WIDTH - inset * 2;
  const cardHeight = PAGE_HEIGHT - inset * 2;

  document.save();
  document.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(PAGE_BACKGROUND);
  document
    .roundedRect(inset + 4, inset + 4, cardWidth, cardHeight, 8)
    .fillOpacity(0.55)
    .fill("#000000");
  document
    .roundedRect(inset + 4, inset + 4, cardWidth, cardHeight, 8)
    .lineWidth(4)
    .strokeColor("#5b211b")
    .stroke();
  document.restore();

  document.roundedRect(inset, inset, cardWidth, cardHeight, 8).fill(CARD_BACKGROUND);
  document
    .roundedRect(inset, inset, cardWidth, cardHeight, 8)
    .lineWidth(2)
    .strokeColor(ACCENT)
    .stroke();
}

function appendPdf(document: InstanceType<typeof PDFDocument>): Promise<Uint8Array> {
  return new Promise((resolveBuffer, reject) => {
    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolveBuffer(Buffer.concat(chunks)));
    document.on("error", reject);
    document.end();
  });
}

export async function buildArticlePdf(input: ArticlePdfInput): Promise<Uint8Array> {
  const coverImage = await prepareCoverImage(input.coverImagePath);
  const fontBytes = readFileSync(resolve(process.cwd(), "src/assets/fonts/NotoSansSinhala-VF.ttf"));
  const document = new PDFDocument({
    autoFirstPage: false,
    bufferPages: true,
    size: "A4",
    margins: { top: MARGIN, bottom: BOTTOM_MARGIN, left: MARGIN, right: MARGIN },
    compress: true,
    info: {
      Title: input.title,
      Author: "Wala Katha",
      Subject: "Offline reader copy of " + input.title,
      Creator: "walakatha.net article PDF generator",
      Producer: "walakatha.net",
    },
  });
  document.registerFont("Sinhala", fontBytes);

  let nextPageKind: "cover" | "content" | "legal" = "cover";
  document.on("pageAdded", () => {
    const pageKind = nextPageKind;
    drawPageChrome(document);
    if (pageKind === "content") {
      document
        .font("Sinhala")
        .fontSize(8)
        .fillColor("#ffffff")
        .text(input.title, MARGIN, MARGIN - 22, {
          width: CONTENT_WIDTH,
          lineBreak: false,
          ellipsis: true,
        });
      document
        .moveTo(MARGIN, MARGIN + 2)
        .lineTo(PAGE_WIDTH - MARGIN, MARGIN + 2)
        .lineWidth(0.8)
        .strokeColor(ACCENT)
        .stroke();
      document.y = MARGIN + 20;
    } else if (pageKind === "legal") {
      document.y = MARGIN + 52;
    } else {
      document.y = MARGIN;
    }
    nextPageKind = "content";
  });

  nextPageKind = "cover";
  document.addPage();

  const maxImageWidth = CONTENT_WIDTH - 30;
  const maxImageHeight = 404;
  const aspectRatio = coverImage.width / coverImage.height;
  const imageWidth = Math.min(maxImageWidth, maxImageHeight * aspectRatio);
  const imageHeight = imageWidth / aspectRatio;
  const framePadding = 9;
  const frameWidth = imageWidth + framePadding * 2;
  const frameHeight = imageHeight + framePadding * 2;
  const frameX = MARGIN + (CONTENT_WIDTH - frameWidth) / 2;
  const frameY = MARGIN + 2;

  document
    .roundedRect(frameX + 4, frameY + 5, frameWidth, frameHeight, 7)
    .fill("#050505");
  document
    .roundedRect(frameX, frameY, frameWidth, frameHeight, 7)
    .fill("#050505");
  document
    .roundedRect(frameX, frameY, frameWidth, frameHeight, 7)
    .lineWidth(2)
    .strokeColor(ACCENT)
    .stroke();
  document.image(coverImage.bytes, frameX + framePadding, frameY + framePadding, {
    width: imageWidth,
    height: imageHeight,
  });
  document.y = frameY + frameHeight + 14;

  document
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(ACCENT)
    .text(BRAND, { width: CONTENT_WIDTH, characterSpacing: 0.8 });
  document.moveDown(0.28);
  document
    .font("Sinhala")
    .fontSize(19)
    .fillColor("#ffffff")
    .text(input.title, { width: CONTENT_WIDTH, lineGap: 3 });
  document.moveDown(0.28);
  document
    .moveTo(MARGIN, document.y)
    .lineTo(PAGE_WIDTH - MARGIN, document.y)
    .lineWidth(1.2)
    .strokeColor(ACCENT)
    .stroke();
  document.moveDown(0.4);
  document
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(ACCENT)
    .text(WATERMARK, { width: CONTENT_WIDTH, link: WATERMARK });
  if (input.publishedDate) {
    document
      .font("Sinhala")
      .fontSize(9)
      .fillColor("#d0d0d0")
      .text("පළ කළ දිනය: " + input.publishedDate, { width: CONTENT_WIDTH });
  }
  document
    .font("Sinhala")
    .fontSize(8.5)
    .fillColor("#ffffff")
    .text("මූල ලිපිනය: " + input.sourceUrl, {
      width: CONTENT_WIDTH,
      link: input.sourceUrl,
    });

  document.moveDown(0.6);
  const startBoxY = document.y;
  const startBoxHeight = 34;
  document
    .roundedRect(MARGIN, startBoxY, CONTENT_WIDTH, startBoxHeight, 6)
    .fill("#1f1f1f");
  document
    .roundedRect(MARGIN, startBoxY, CONTENT_WIDTH, startBoxHeight, 6)
    .lineWidth(1.2)
    .strokeColor(ACCENT)
    .stroke();
  document
    .font("Sinhala")
    .fontSize(9)
    .fillColor("#ffffff")
    .text("මෙතැන් සිට කතාව නිල වශයෙන් ආරම්භ වේ", MARGIN + 8, startBoxY + 10, {
      width: CONTENT_WIDTH - 16,
      align: "center",
      lineBreak: false,
    });

  nextPageKind = "content";
  document.addPage();
  const contentBottom = PAGE_HEIGHT - BOTTOM_MARGIN;
  let firstParagraph = true;
  const blocks = markdownToBlocks(input.body);

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (block.kind === "heading") {
      document.font("Sinhala").fontSize(14);
      const headingHeight = document.heightOfString(block.text, {
        width: CONTENT_WIDTH,
        lineGap: 2,
      });
      if (document.y + headingHeight + 24 > contentBottom && document.y > MARGIN + 24) {
        nextPageKind = "content";
        document.addPage();
      }
      document
        .font("Sinhala")
        .fontSize(14)
        .fillColor("#ffffff")
        .text(block.text, { width: CONTENT_WIDTH, lineGap: 2 });
      document.moveDown(0.18);
      document
        .moveTo(MARGIN, document.y)
        .lineTo(MARGIN + Math.min(CONTENT_WIDTH * 0.42, 190), document.y)
        .lineWidth(1.5)
        .strokeColor(ACCENT)
        .stroke();
      document.moveDown(0.5);
      continue;
    }

    if (block.kind === "dialogue") {
      const boxX = MARGIN + 2;
      const boxWidth = CONTENT_WIDTH - 4;
      const paddingX = 18;
      const paddingY = 9;
      const textWidth = boxWidth - paddingX * 2;
      document.font("Sinhala").fontSize(BODY_FONT_SIZE);
      const dialogueTextHeight = document.heightOfString(block.text, {
        width: textWidth,
        align: "justify",
        lineGap: BODY_LINE_GAP,
      });
      const boxHeight = dialogueTextHeight + paddingY * 2;
      if (document.y + boxHeight + 8 > contentBottom && document.y > MARGIN + 24) {
        nextPageKind = "content";
        document.addPage();
      }
      const boxY = document.y + 2;
      const gradient = document
        .linearGradient(boxX, boxY, boxX + boxWidth, boxY + boxHeight)
        .stop(0, "#1f1f1f")
        .stop(1, "#2a1515");
      document.roundedRect(boxX, boxY, boxWidth, boxHeight, 6).fill(gradient);
      document
        .moveTo(boxX + 2.5, boxY + 7)
        .lineTo(boxX + 2.5, boxY + boxHeight - 7)
        .lineWidth(5)
        .strokeColor(ACCENT)
        .stroke();
      document
        .font("Sinhala")
        .fontSize(BODY_FONT_SIZE)
        .fillColor("#ffffff")
        .text(block.text, boxX + paddingX, boxY + paddingY, {
          width: textWidth,
          align: "justify",
          lineGap: BODY_LINE_GAP,
        });
      document.y = boxY + boxHeight + 8;
      continue;
    }

    const isList = block.kind === "list";
    const indent = isList ? 10 : firstParagraph ? 0 : 16;
    const textWidth = CONTENT_WIDTH - (isList ? 8 : 0);
    document.font("Sinhala").fontSize(BODY_FONT_SIZE);
    const textOptions = {
      width: textWidth,
      align: isList ? ("left" as const) : ("justify" as const),
      indent,
      lineGap: BODY_LINE_GAP,
    };
    const textHeight = document.heightOfString(block.text, textOptions);
    if (document.y + textHeight + 6 > contentBottom && document.y > MARGIN + 24) {
      nextPageKind = "content";
      document.addPage();
    }
    document
      .font("Sinhala")
      .fontSize(BODY_FONT_SIZE)
      .fillColor("#ffffff")
      .text(block.text, textOptions);
    document.moveDown(isList ? 0.45 : 0.52);
    if (!isList) firstParagraph = false;
  }

  nextPageKind = "legal";
  document.addPage();
  const legalWidth = CONTENT_WIDTH - 32;
  document
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(ACCENT)
    .text("PERSONAL READING COPY", MARGIN + 16, document.y, {
      width: legalWidth,
      align: "center",
      characterSpacing: 1.1,
    });
  document.moveDown(1.1);
  document
    .font("Sinhala")
    .fontSize(17)
    .fillColor("#ffffff")
    .text("අයිතිවාසිකම් සහ භාවිත කොන්දේසි", MARGIN + 16, document.y, {
      width: legalWidth,
      align: "center",
      lineGap: 3,
    });
  document.moveDown(0.5);
  document
    .moveTo(MARGIN + 24, document.y)
    .lineTo(PAGE_WIDTH - MARGIN - 24, document.y)
    .lineWidth(1.5)
    .strokeColor(ACCENT)
    .stroke();
  document.moveDown(0.9);

  const legalParagraphs = [
    "මෙම PDF පිටපත පෞද්ගලික කියවීම සඳහා පමණි.",
    "මෙහි ඇති කතාව, කවර කලාකෘතිය සහ අනෙකුත් අන්තර්ගතයේ හිමිකම් ඒ ඒ අදාළ හිමිකරුවන් සතුය. මෙම PDF පිටපතෙන් කිසිදු හිමිකමක් පවරා දීමක් හෝ වෙනත් අයෙකුට හිමිකමක් ලබා දීමක් සිදු නොවේ.",
    "අදාළ අයිතිවාසිකම් හිමියාගේ පූර්ව ලිඛිත අවසරයකින් තොරව මෙම කතාව හෝ එහි කොටස් පිටපත් කිරීම, වෙනස් කිරීම, නැවත පළ කිරීම, ප්‍රසිද්ධ කිරීම, බෙදාහැරීම හෝ විකිණීම අවසර නැත.",
    "කවරයේ හෝ ලිපියේ දැනටමත් ඇති attribution සහ watermark ඉවත් කිරීම හෝ වෙනස් කිරීම නොකරන්න. නිල මූලාශ්‍රය පහත ලිපිනයයි:",
  ];
  for (let index = 0; index < legalParagraphs.length; index += 1) {
    document
      .font("Sinhala")
      .fontSize(index === 0 ? 11 : 10)
      .fillColor("#ffffff")
      .text(legalParagraphs[index], MARGIN + 16, document.y, {
        width: legalWidth,
        align: index === 0 ? "center" : "justify",
        lineGap: BODY_LINE_GAP,
        indent: index > 0 ? 14 : 0,
      });
    document.moveDown(0.65);
  }
  document
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(ACCENT)
    .text(input.sourceUrl, MARGIN + 16, document.y, {
      width: legalWidth,
      link: input.sourceUrl,
      align: "center",
    });
  document.moveDown(0.7);
  document
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor("#ffffff")
    .text(WATERMARK, MARGIN + 16, document.y, {
      width: legalWidth,
      link: WATERMARK,
      align: "center",
    });

  const range = document.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    document.switchToPage(index);
    document.save();
    document
      .font("Helvetica")
      .fontSize(22)
      .fillColor("#ffffff")
      .fillOpacity(0.18)
      .text(WATERMARK, MARGIN, PAGE_HEIGHT / 2 - 10, {
        width: CONTENT_WIDTH,
        align: "center",
        lineBreak: false,
      });
    document.restore();

    document.save();
    document
      .moveTo(MARGIN, PAGE_HEIGHT - 48)
      .lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 48)
      .lineWidth(0.8)
      .strokeColor(ACCENT)
      .stroke();
    document
      .font("Helvetica")
      .fontSize(8)
      .fillColor(ACCENT)
      .text(WATERMARK, MARGIN, PAGE_HEIGHT - 36, {
        lineBreak: false,
        link: WATERMARK,
      });
    document
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#ffffff")
      .text(
        String(index - range.start + 1) + " / " + String(range.count),
        PAGE_WIDTH - MARGIN - 35,
        PAGE_HEIGHT - 36,
        { lineBreak: false },
      );
    document.restore();
  }

  return appendPdf(document);
}
