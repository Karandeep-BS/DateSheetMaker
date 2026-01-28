// app/api/upload/route.js
// PDF / Excel upload WITHOUT pdf-parse (Vercel safe)

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("excelFile");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file received" },
        { status: 400 }
      );
    }

    // ✅ Vercel: only /tmp is writable
    const uploadDir = "/tmp/uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    /* =========================
       1) EXCEL (.xlsx / .xls)
       ========================= */
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      // (Optional) Save temporarily
      const excelPath = path.join(uploadDir, file.name);
      fs.writeFileSync(excelPath, buffer);

      const workbook = XLSX.read(buffer, {
        type: "buffer",
        cellDates: true,
      });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const allRows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: true,
      });

      const headers = allRows[0] || [];
      const rows = allRows.slice(1);

      return NextResponse.json({
        success: true,
        message: "Excel file uploaded successfully",
        headers,
        rows,
        rowCount: rows.length,
        fileName: file.name,
      });
    }

    /* =========================
       2) PDF → TEXT → EXCEL
       ========================= */
    if (fileName.endsWith(".pdf")) {
      const text = extractTextFromPDF(buffer);
      const { headers, rows } = parseTableFromText(text);

      if (!headers.length || rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Could not extract table data from PDF. Try Excel format instead.",
          },
          { status: 400 }
        );
      }

      // Convert to Excel
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");

      const outputName = `converted_${Date.now()}.xlsx`;
      const outputPath = path.join(uploadDir, outputName);
      XLSX.writeFile(workbook, outputPath);

      return NextResponse.json({
        success: true,
        message: "PDF converted to Excel successfully",
        headers,
        rows,
        rowCount: rows.length,
        fileName: outputName,
      });
    }

    /* =========================
       3) UNSUPPORTED FILE
       ========================= */
    return NextResponse.json(
      {
        success: false,
        error: "Only PDF and Excel (.xlsx, .xls) files are supported.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Upload failed",
      },
      { status: 500 }
    );
  }
}

/* =========================
   SIMPLE PDF TEXT EXTRACTION
   ========================= */
function extractTextFromPDF(buffer) {
  try {
    const pdfText = buffer.toString("latin1");
    const textBlocks = pdfText.match(/BT[\s\S]*?ET/g) || [];
    let extractedText = "";

    for (const block of textBlocks) {
      const matches = block.match(/\(([^)]+)\)/g) || [];
      extractedText += matches.join(" ") + "\n";
    }

    return extractedText.trim();
  } catch {
    return "";
  }
}

/* =========================
   PARSE TABLE FROM TEXT
   ========================= */
function parseTableFromText(text) {
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return { headers: [], rows: [] };

  const headerLine = lines.find(l => l.split(/\s+/).length > 1);
  if (!headerLine) return { headers: [], rows: [] };

  const headers = headerLine
    .split(/\s{2,}|\t+/)
    .map(h => h.trim())
    .filter(Boolean);

  const rows = lines.slice(1, 20).map(line =>
    line
      .split(/\s{2,}|\t+/)
      .map(c => c.trim())
      .slice(0, headers.length)
      .concat(Array(headers.length).fill(""))
  );

  return { headers, rows };
}
