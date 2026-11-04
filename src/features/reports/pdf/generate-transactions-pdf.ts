import regularFontUrl from "@/assets/fonts/roboto-regular-subset.ttf?url";
import boldFontUrl from "@/assets/fonts/roboto-bold-subset.ttf?url";
import { formatPesoCentavos, type ReportModel } from "../report-model";

const FONT_FAMILY = "RobotoReport";
const PAGE_MARGIN = 14;
const FOOTER_Y = 291;

async function fetchFontBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not load the report font.");
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  const CHUNK_SIZE = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + CHUNK_SIZE),
    );
  }
  return btoa(binary);
}

export async function generateTransactionsPdf(
  model: ReportModel,
): Promise<Blob> {
  const [{ jsPDF }, autoTableModule, regularFont, boldFont] = await Promise.all(
    [
      import("jspdf"),
      import("jspdf-autotable"),
      fetchFontBase64(regularFontUrl),
      fetchFontBase64(boldFontUrl),
    ],
  );
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  doc.addFileToVFS("roboto-regular-subset.ttf", regularFont);
  doc.addFileToVFS("roboto-bold-subset.ttf", boldFont);
  doc.addFont("roboto-regular-subset.ttf", FONT_FAMILY, "normal");
  doc.addFont("roboto-bold-subset.ttf", FONT_FAMILY, "bold");

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont(FONT_FAMILY, "bold");
  doc.setFontSize(13);
  doc.text(model.businessName, PAGE_MARGIN, 18);
  doc.setFontSize(11);
  doc.text(model.title, PAGE_MARGIN, 24);

  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(9);
  doc.text(`Generated ${model.generatedAtText}`, pageWidth - PAGE_MARGIN, 18, {
    align: "right",
  });
  doc.setFontSize(9.5);
  doc.text(`Account: ${model.accountText}`, PAGE_MARGIN, 30);
  doc.text(`Period: ${model.periodText}`, PAGE_MARGIN, 35);

  doc.setLineWidth(0.3);
  doc.line(PAGE_MARGIN, 38, pageWidth - PAGE_MARGIN, 38);

  autoTable(doc, {
    startY: 42,
    head: [
      [
        "Total Cash In",
        "Total Cash Out",
        "Total Income (Fees)",
        "Transactions",
      ],
    ],
    body: [
      [
        formatPesoCentavos(model.summary.inCentavos),
        formatPesoCentavos(model.summary.outCentavos),
        formatPesoCentavos(model.summary.totalFeeCentavos),
        String(model.count),
      ],
    ],
    theme: "grid",
    styles: {
      font: FONT_FAMILY,
      fontSize: 9,
      halign: "center",
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: 1.8,
    },
    headStyles: { fontStyle: "bold" },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });

  const summaryFinalY =
    (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ??
    42;

  autoTable(doc, {
    startY: summaryFinalY + 8,
    head: [
      ["Date & Time", "Type", "Account", "Note", "Amount", "Fee", "Status"],
    ],
    body: model.rows.map((row) => [
      row.dateTime,
      row.type,
      row.account,
      row.note,
      row.amount,
      row.fee,
      row.status,
    ]),
    theme: "grid",
    styles: {
      font: FONT_FAMILY,
      fontSize: 8.5,
      cellPadding: 1.6,
      lineColor: [120, 120, 120],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 17 },
      2: { cellWidth: 36 },
      3: { cellWidth: 30 },
      4: { cellWidth: 26, halign: "right" },
      5: { cellWidth: 21, halign: "right" },
      6: { cellWidth: 20 },
    },
    rowPageBreak: "avoid",
    showHead: "everyPage",
    margin: {
      left: PAGE_MARGIN,
      right: PAGE_MARGIN,
      top: 20,
      bottom: 20,
    },
  });

  const pageCount = doc.getNumberOfPages();
  doc.setFont(FONT_FAMILY, "normal");
  doc.setFontSize(8.5);
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth / 2, FOOTER_Y, {
      align: "center",
    });
  }

  return doc.output("blob");
}
