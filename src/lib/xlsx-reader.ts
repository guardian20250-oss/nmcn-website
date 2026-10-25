// Minimal, dependency-free .xlsx reader (first worksheet only).
// Supports shared strings, inline strings, numbers and booleans, which is all
// the TikTok LIVE Backstage "Manage creators" export uses. Includes size
// limits to guard against zip bombs. Server-side only.
import { inflateRawSync } from "zlib";

export type Cell = string | number | boolean | null;

const MAX_ENTRY_BYTES = 25 * 1024 * 1024;

function readZip(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Not a valid .xlsx file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("Corrupt .xlsx file");
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (!name.endsWith(".xml") && !name.endsWith(".rels")) continue;
    if (size > MAX_ENTRY_BYTES) throw new Error("File too large");
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(start, start + compSize);
    if (method === 0) files.set(name, Buffer.from(raw));
    else if (method === 8) files.set(name, inflateRawSync(raw, { maxOutputLength: MAX_ENTRY_BYTES }));
  }
  return files;
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&");
}

function textOf(xml: string): string {
  let out = "";
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += m[1];
  return decode(out);
}

function colIndex(ref: string): number {
  const letters = ref.replace(/[^A-Z]/gi, "").toUpperCase();
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function firstSheetPath(files: Map<string, Buffer>): string {
  const wb = files.get("xl/workbook.xml")?.toString("utf8") || "";
  const rels = files.get("xl/_rels/workbook.xml.rels")?.toString("utf8") || "";
  const rid = wb.match(/<sheet\b[^>]*\br:id="([^"]+)"/)?.[1];
  if (rid) {
    for (const m of rels.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
      if (m[1].includes(`Id="${rid}"`)) {
        const target = m[1].match(/Target="([^"]+)"/)?.[1];
        if (target) {
          const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
          if (files.has(path)) return path;
        }
      }
    }
  }
  const sheets = [...files.keys()].filter(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort();
  if (!sheets.length) throw new Error("No worksheet found in file");
  return sheets[0];
}

/** Returns the first worksheet as a 2D array of cell values. */
export function readFirstSheet(buf: Buffer): Cell[][] {
  const files = readZip(buf);
  const shared: string[] = [];
  const ss = files.get("xl/sharedStrings.xml")?.toString("utf8");
  if (ss) for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(textOf(m[1]));

  const sheet = files.get(firstSheetPath(files))!.toString("utf8");
  const rows: Cell[][] = [];
  for (const rm of sheet.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rIdx = Number(rm[1].match(/\br="(\d+)"/)?.[1] || rows.length + 1) - 1;
    const row: Cell[] = [];
    for (const cm of rm[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1];
      const body = cm[2] || "";
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      const ci = ref ? colIndex(ref) : row.length;
      const t = attrs.match(/\bt="([^"]+)"/)?.[1] || "n";
      const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let val: Cell = null;
      if (t === "s") val = v !== undefined ? shared[Number(v)] ?? null : null;
      else if (t === "inlineStr") val = textOf(body);
      else if (t === "str") val = v !== undefined ? decode(v) : null;
      else if (t === "b") val = v === "1";
      else if (t === "e") val = null;
      else if (v !== undefined) { const num = Number(v); val = Number.isFinite(num) ? num : decode(v); }
      row[ci] = val;
    }
    for (let i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = null;
    rows[rIdx] = row;
  }
  for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
  return rows;
}
