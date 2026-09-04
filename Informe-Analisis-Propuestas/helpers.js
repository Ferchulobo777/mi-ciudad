const fs = require("fs");
const {
  Paragraph, TextRun, HeadingLevel, AlignmentType,
  ImageRun, Table, TableRow, TableCell, WidthType, ShadingType,
  Header, Footer, PageNumber, PageBreak, TableOfContents, BorderStyle,
  VerticalAlign,
} = require("docx");

const ASSETS = __dirname + "\\assets\\";
const CONTENT_WIDTH = 9000;
const AZUL = "2E4E7E";

const img = (name) => fs.readFileSync(ASSETS + name);

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 160 }, pageBreakBefore: true });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, keepNext: true });
}
function h3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    keepNext: true,
    children: [new TextRun({ text, bold: true, size: 22, color: AZUL })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 160 } });
}
function callout(text) {
  return new Paragraph({
    spacing: { before: 120, after: 200 },
    shading: { type: ShadingType.CLEAR, fill: "FBF0DC" },
    border: {
      left: { style: BorderStyle.SINGLE, size: 24, color: "C9962C", space: 8 },
    },
    indent: { left: 100 },
    children: [new TextRun({ text, italics: true, size: 20, color: "6B5216" })],
  });
}
function spacer(h) {
  return new Paragraph({ spacing: { after: h || 200 } });
}

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: AZUL } : (opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill } : undefined),
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : undefined,
      children: [new TextRun({ text, bold: !!opts.header || !!opts.bold, color: opts.color || (opts.header ? "FFFFFF" : undefined), size: opts.size || 18 })],
    })],
  });
}

function multiCell(paragraphs, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: AZUL } : undefined,
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: paragraphs.map((t) => new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: "- " + t, size: 18 })],
    })),
  });
}

function table(headerRow, rows, widths, opts = {}) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headerRow }),
      ...rows.map((r) => new TableRow({
        cantSplit: true,
        children: r.map((t, j) => cell(t, { width: widths[j], size: opts.size || 18, center: opts.center })),
      })),
    ],
  });
}

function textOn(hex) {
  const r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "1F1F1F" : "FFFFFF";
}

function swatchTable(rows) {
  const widths = [2400, 3600, 2000];
  const header = [cell("Color", { header: true, width: widths[0] }), cell("Uso en la aplicación", { header: true, width: widths[1] }), cell("Valor", { header: true, width: widths[2], center: true })];
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: header }), ...rows.map(([nombre, uso, hex]) => new TableRow({
      cantSplit: true,
      children: [
        cell(nombre, { width: widths[0], size: 18 }),
        cell(uso, { width: widths[1], size: 18 }),
        cell("#" + hex, { width: widths[2], fill: hex, color: textOn(hex), center: true, bold: true, size: 18 }),
      ],
    }))],
  });
}

function categoriaSwatchTable(rows) {
  const widths = [3000, 2000, 4000];
  const header = [cell("Categoría del catálogo", { header: true, width: widths[0] }), cell("Color", { header: true, width: widths[1], center: true }), cell("Nota", { header: true, width: widths[2] })];
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: header }), ...rows.map(([nombre, hex, nota]) => new TableRow({
      cantSplit: true,
      children: [
        cell(nombre, { width: widths[0] }),
        cell("#" + hex, { width: widths[1], fill: hex, color: textOn(hex), center: true, bold: true }),
        cell(nota, { width: widths[2], size: 16 }),
      ],
    }))],
  });
}

function coverBase({ titulo, subtitulo, bajada }) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new ImageRun({ type: "png", data: img("logo-uner.png"), transformation: { width: 118, height: 112 } })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "Universidad Nacional de Entre Ríos", bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "Facultad de Ciencias de la Administración", size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: "Tecnicatura Universitaria en Desarrollo Web", size: 22 })] }),

    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 120 }, children: [new TextRun({ text: "TRABAJO INTEGRADOR", bold: true, size: 40 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: "Desarrollo para Móviles", bold: true, size: 30, color: AZUL })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: titulo, size: 26, italics: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: bajada, size: 18, color: "777777" })] }),

    new Paragraph({ spacing: { before: 700, after: 60 }, children: [new TextRun({ text: "Integrantes del equipo", bold: true, size: 22 })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Fernando Ruben Bareiro Ruiz", size: 20 })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Natalia Ailén Gonzalez", size: 20 })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Ballejo Micaela Celeste", size: 20 })] }),
    new Paragraph({ spacing: { after: 260 }, children: [new TextRun({ text: "Fernando Rodriguez", size: 20 })] }),

    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Profesor Titular: Lic. Franco Ruis Dias", size: 20 })] }),
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Jefe de Trabajos Prácticos: Lic. Germán Cueva", size: 20 })] }),
    new Paragraph({ spacing: { after: 400 } }),
    new Paragraph({ children: [new TextRun({ text: "Año 2026, segundo cuatrimestre", size: 20 })] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200 },
    children: [new TextRun({ text, italics: true, size: 17, color: "666666" })],
  });
}

function phonePair(nameA, nameB, captionText) {
  const w = 230, h = Math.round(w * (1688 / 780));
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 0 },
      children: [
        new ImageRun({ type: "png", data: img(nameA), transformation: { width: w, height: h } }),
        new TextRun({ text: "   " }),
        new ImageRun({ type: "png", data: img(nameB), transformation: { width: w, height: h } }),
      ],
    }),
    caption(captionText),
  ];
}

function paletteFigure(name, captionText) {
  const w = 560, h = Math.round(w * (600 / 2000));
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 0 },
      children: [new ImageRun({ type: "png", data: img(name), transformation: { width: w, height: h } })],
    }),
    caption(captionText),
  ];
}

function phoneRow(names, captionText, opts = {}) {
  const w = opts.width || 168, h = Math.round(w * (1688 / 780));
  const children = [];
  names.forEach((name, i) => {
    if (i > 0) children.push(new TextRun({ text: "  " }));
    children.push(new ImageRun({ type: "png", data: img(name), transformation: { width: w, height: h } }));
  });
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 0 }, children }),
    caption(captionText),
  ];
}

function diagramFigure(name, captionText, aspect, widthPx) {
  const w = widthPx || 620;
  const h = Math.round(w / aspect);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 0 },
      children: [new ImageRun({ type: "png", data: img(name), transformation: { width: w, height: h } })],
    }),
    caption(captionText),
  ];
}

function toc() {
  return [
    new Paragraph({ text: "Índice", heading: HeadingLevel.HEADING_1, spacing: { before: 0, after: 160 } }),
    new TableOfContents("Índice", { hyperlink: true, headingStyleRange: "1-2" }),
  ];
}

function headerFooter(titulo) {
  return {
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA", space: 4 } },
          children: [new TextRun({ text: titulo, size: 16, color: "777777" })],
        })],
      }),
      first: new Header({ children: [new Paragraph("")] }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA", space: 4 } },
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "777777" })],
        })],
      }),
      first: new Footer({ children: [new Paragraph("")] }),
    },
  };
}

module.exports = {
  AZUL, CONTENT_WIDTH, img,
  h1, h2, h3, p, callout, spacer, cell, multiCell, table, textOn, swatchTable, categoriaSwatchTable,
  coverBase, toc, headerFooter, caption, phonePair, paletteFigure, phoneRow, diagramFigure,
};
