import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export type ReportMeta = {
  title: string;
  subtitle?: string;
  generatedFor?: string;
};

export type ReportSection = {
  heading: string;
  /** Rendered as a table when `rows` is present, otherwise as paragraph text. */
  columns?: string[];
  rows?: (string | number)[][];
  text?: string;
};

const BRAND = "KinetIQ · Sports Injury Risk Detection";

function fileStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "report"
  );
}

/** Builds a branded, print-quality PDF from report sections and downloads it. */
export function exportReportPdf(meta: ReportMeta, sections: ReportSection[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(meta.title, margin, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(BRAND, margin, 52);

  doc.setTextColor(30, 30, 30);
  let cursor = 96;
  if (meta.subtitle) {
    doc.setFontSize(11);
    doc.text(meta.subtitle, margin, cursor);
    cursor += 16;
  }
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Generated ${new Date().toLocaleString()}${meta.generatedFor ? ` · ${meta.generatedFor}` : ""}`,
    margin,
    cursor,
  );
  cursor += 18;
  doc.setTextColor(30, 30, 30);

  for (const section of sections) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (cursor > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      cursor = 60;
    }
    doc.text(section.heading, margin, cursor);
    cursor += 10;

    if (section.rows && section.columns) {
      autoTable(doc, {
        startY: cursor,
        head: [section.columns],
        body: section.rows.map((r) => r.map((c) => String(c))),
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        alternateRowStyles: { fillColor: [246, 248, 251] },
      });
      cursor = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;
    } else if (section.text) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(section.text, pageWidth - margin * 2);
      doc.text(lines, margin, cursor + 12);
      cursor += 12 + lines.length * 13 + 16;
    }
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`${BRAND} — page ${i} of ${total}`, margin, doc.internal.pageSize.getHeight() - 20);
    doc.text(
      "Rule-based triage signal, not a medical diagnosis.",
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" },
    );
  }

  doc.save(`${slugify(meta.title)}-${fileStamp()}.pdf`);
}

/** Exports one or more sheets of tabular data to an .xlsx workbook. */
export function exportWorkbook(
  fileName: string,
  sheets: { name: string; columns: string[]; rows: (string | number)[][] }[],
) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.columns, ...sheet.rows]);
    ws["!cols"] = sheet.columns.map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  XLSX.writeFile(wb, `${slugify(fileName)}-${fileStamp()}.xlsx`);
}

export function exportCsv(fileName: string, columns: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join(
    "\n",
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(fileName)}-${fileStamp()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
