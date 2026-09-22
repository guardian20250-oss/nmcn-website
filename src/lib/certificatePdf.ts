import { jsPDF } from "jspdf";

export function downloadCertificatePdf(opts: {
  learnerName: string;
  courseTitle: string;
  code: string;
  date: string;
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, w, h, "F");

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, w - 16, h - 16);
  doc.setLineWidth(0.4);
  doc.rect(11, 11, w - 22, h - 22);

  doc.setTextColor(212, 175, 55);
  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.text("NEXUS MAFIA", w / 2, 28, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("CREATOR NETWORK LLC", w / 2, 34, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(240, 242, 245);
  doc.text("Certificate of Completion", w / 2, 50, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text("This certifies that", w / 2, 64, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.setTextColor(212, 175, 55);
  doc.text(opts.learnerName, w / 2, 78, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text("has successfully completed the course", w / 2, 90, {
    align: "center",
  });

  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(240, 242, 245);
  doc.text(opts.courseTitle, w / 2, 104, { align: "center" });

  const issued = new Date(opts.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued: ${issued}`, 30, h - 24);
  doc.text(`Code: ${opts.code}`, w - 30, h - 24, { align: "right" });
  doc.text("Nexus Mafia Creator Network", w / 2, h - 24, { align: "center" });

  doc.setFontSize(8);
  doc.text(
    "Verify this code via the NMCN staff dashboard.",
    w / 2,
    h - 18,
    { align: "center" }
  );

  const safe = opts.learnerName.replace(/[^a-z0-9-_ ]/gi, "").trim() || "creator";
  doc.save(`NMCN-Certificate-${safe}-${opts.code}.pdf`);
}
