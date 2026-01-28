// exportHelpers.js
import html2canvas from "html2canvas"; // [web:22]
import jsPDF from "jspdf"; // [web:20]

export async function exportWorkspacePNG(element, filename = "workspace.png") {
  if (!element) return;
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
  });
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  link.click();
}

export async function exportWorkspacePDF(element, filename = "workspace.pdf") {
  if (!element) return;
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
  });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("l", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let position = 0;
  let heightLeft = imgHeight;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

// rows: full workspace rows including header row 0
export function exportWorkspaceCSV(rows, filename = "workspace.csv") {
  if (!rows || !rows.length) return;

  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? "" : String(cell);
          // Escape " and wrap with quotes
          const escaped = value.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportWorkspaceJSON(headers, rows, filename = "workspace.json") {
  const data = { headers, rows };
  const json = JSON.stringify(data, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
