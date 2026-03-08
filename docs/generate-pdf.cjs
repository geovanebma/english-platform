const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname);
const mdPath = path.join(root, "Apresentacao-English-Platform-Duolingo.md");
const pdfPath = path.join(root, "Apresentacao-English-Platform-Duolingo.pdf");

const text = fs.readFileSync(mdPath, "utf8");
const rawLines = text.split(/\r?\n/);

function wrapLine(line, max = 95) {
  if (line.length <= max) return [line];
  const words = line.split(" ");
  const out = [];
  let cur = "";
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (cand.length > max) {
      if (cur) out.push(cur);
      cur = w;
    } else {
      cur = cand;
    }
  }
  if (cur) out.push(cur);
  return out;
}

const lines = [];
for (const ln of rawLines) {
  if (ln.startsWith("# ")) {
    lines.push("");
    lines.push(ln.replace("# ", ""));
    lines.push("");
    continue;
  }
  if (ln.startsWith("## ")) {
    lines.push("");
    lines.push(ln.replace("## ", ""));
    continue;
  }
  if (ln.startsWith("### ")) {
    lines.push("");
    lines.push(ln.replace("### ", ""));
    continue;
  }
  wrapLine(ln).forEach((w) => lines.push(w));
}

const pageWidth = 595;
const pageHeight = 842;
const marginX = 48;
const marginY = 52;
const fontSize = 11;
const lineHeight = 15;
const maxLinesPerPage = Math.floor((pageHeight - marginY * 2) / lineHeight);

const pages = [];
for (let i = 0; i < lines.length; i += maxLinesPerPage) {
  pages.push(lines.slice(i, i + maxLinesPerPage));
}

function escapePdfText(s) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

const objects = [];
function addObject(content) {
  objects.push(content);
  return objects.length;
}

const fontObj = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

const pageObjs = [];
const contentObjs = [];

for (const pageLines of pages) {
  const streamLines = [];
  streamLines.push("BT");
  streamLines.push(`/F1 ${fontSize} Tf`);
  let y = pageHeight - marginY;
  for (const ln of pageLines) {
    const safe = escapePdfText(ln);
    streamLines.push(`1 0 0 1 ${marginX} ${y} Tm (${safe}) Tj`);
    y -= lineHeight;
  }
  streamLines.push("ET");

  const stream = streamLines.join("\n");
  const contentObj = addObject(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
  contentObjs.push(contentObj);

  const pageObj = addObject("PENDING_PAGE");
  pageObjs.push(pageObj);
}

const kidsRef = pageObjs.map((n) => `${n} 0 R`).join(" ");
const pagesObj = addObject(`<< /Type /Pages /Kids [ ${kidsRef} ] /Count ${pageObjs.length} >>`);

for (let i = 0; i < pageObjs.length; i++) {
  const pageDef = `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObjs[i]} 0 R >>`;
  objects[pageObjs[i] - 1] = pageDef;
}

const catalogObj = addObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

let pdf = "%PDF-1.4\n";
const offsets = [0];
for (let i = 0; i < objects.length; i++) {
  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
}

const xrefOffset = Buffer.byteLength(pdf, "utf8");
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += "0000000000 65535 f \n";
for (let i = 1; i <= objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

fs.writeFileSync(pdfPath, pdf, "utf8");
console.log("PDF generated:", pdfPath);
