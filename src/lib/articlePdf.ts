import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import PDFDocument from "pdfkit";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;
const BOTTOM_MARGIN = 66;
const WATERMARK = "https://www.walakatha.net";

type ArticlePdfInput = {
  title: string;
  body: string;
  sourceUrl: string;
  publishedDate?: string;
};

type TextBlock = {
  kind: "paragraph" | "heading" | "list";
  text: string;
};

function plainInlineText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<https?:\/\/[^>]+>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/(`{1,3})(.*?)\1/g, "$2")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\\([\\`*_{}\[\]()#+\-.!>])/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function markdownToBlocks(markdown: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let paragraph: string[] = [];
  let inCodeFence = false;

  const flushParagraph = () => {
    const text = plainInlineText(paragraph.join(" "));
    if (text) blocks.push({ kind: "paragraph", text });
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
      if (text) blocks.push({ kind: "list", text: `• ${text}` });
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      const text = plainInlineText(line.replace(/^>\s?/, ""));
      if (text) blocks.push({ kind: "paragraph", text });
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
  const fontBytes = readFileSync(
    resolve(process.cwd(), "src/assets/fonts/NotoSansSinhala-VF.ttf"),
  );
  const document = new PDFDocument({
    autoFirstPage: false,
    bufferPages: true,
    size: "A4",
    margins: { top: MARGIN, bottom: BOTTOM_MARGIN, left: MARGIN, right: MARGIN },
    // PDF.js verifies the decoded page content, so keep the downloads compact.
    compress: true,
    info: {
      Title: input.title,
      Author: "Wala Katha",
      Subject: `Offline reader copy of ${input.title}`,
      Creator: "walakatha.net article PDF generator",
      Producer: "walakatha.net",
    },
  });
  document.registerFont("Sinhala", fontBytes);

  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const addPage = (continuation: boolean) => {
    document.addPage();
    if (continuation) {
      document
        .font("Sinhala")
        .fontSize(8)
        .fillColor("#59636b")
        .text(input.title, MARGIN, MARGIN - 22, {
          width: contentWidth,
          lineBreak: false,
          ellipsis: true,
        });
      document
        .moveTo(MARGIN, MARGIN + 2)
        .lineTo(PAGE_WIDTH - MARGIN, MARGIN + 2)
        .lineWidth(0.5)
        .strokeColor("#d1d5d8")
        .stroke();
      document.y = MARGIN + 20;
    } else {
      document.y = MARGIN;
    }
  };

  addPage(false);
  document
    .font("Sinhala")
    .fontSize(21)
    .fillColor("#141c23")
    .text(input.title, { width: contentWidth, lineGap: 5 });
  document
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#247a73")
    .text(WATERMARK, { width: contentWidth });
  if (input.publishedDate) {
    document
      .font("Sinhala")
      .fontSize(9)
      .fillColor("#525c65")
      .text(`පළ කළ දිනය: ${input.publishedDate}`, { width: contentWidth });
  }
  document
    .font("Sinhala")
    .fontSize(9)
    .fillColor("#2e638f")
    .text("මුල් ලිපිය:", { width: contentWidth });
  document
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#2e638f")
    .text(input.sourceUrl, { width: contentWidth, link: input.sourceUrl });
  document
    .moveDown(0.7)
    .moveTo(MARGIN, document.y)
    .lineTo(PAGE_WIDTH - MARGIN, document.y)
    .lineWidth(0.8)
    .strokeColor("#c2c9ce")
    .stroke();
  document.moveDown(0.7);

  for (const block of markdownToBlocks(input.body)) {
    const size = block.kind === "heading" ? 14 : 11.5;
    const lineGap = block.kind === "heading" ? 3 : 5;
    document.font("Sinhala").fontSize(size);
    const blockHeight = document.heightOfString(block.text, {
      width: contentWidth - (block.kind === "list" ? 8 : 0),
      lineGap,
    });
    if (document.y + blockHeight > PAGE_HEIGHT - BOTTOM_MARGIN && document.y > MARGIN + 20) {
      addPage(true);
      document.font("Sinhala").fontSize(size);
    }
    document
      .fillColor(block.kind === "heading" ? "#19292f" : "#1f2429")
      .text(block.text, {
        width: contentWidth - (block.kind === "list" ? 8 : 0),
        indent: block.kind === "list" ? 8 : 0,
        lineGap,
      });
    document.moveDown(block.kind === "heading" ? 0.3 : 0.55);
  }

  const range = document.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    document.switchToPage(index);
    document.save();
    document
      .font("Helvetica")
      .fontSize(22)
      .fillColor("#59636b")
      .fillOpacity(0.2)
      .text(WATERMARK, MARGIN, PAGE_HEIGHT / 2 - 10, {
        width: contentWidth,
        align: "center",
        lineBreak: false,
      });
    document.restore();

    document.save();
    document
      .moveTo(MARGIN, PAGE_HEIGHT - 48)
      .lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 48)
      .lineWidth(0.45)
      .strokeColor("#c5cbd0")
      .stroke();
    document
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#37434a")
      .text(WATERMARK, MARGIN, PAGE_HEIGHT - 36, { lineBreak: false });
    document.text(`${index - range.start + 1} / ${range.count}`, PAGE_WIDTH - MARGIN - 35, PAGE_HEIGHT - 36, {
      lineBreak: false,
    });
    document.restore();
  }

  return appendPdf(document);
}
