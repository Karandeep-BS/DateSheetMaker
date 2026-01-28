// app/api/upload/route.js - PDF/Excel upload WITHOUT pdf-parse

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

    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1) Excel (.xlsx / .xls) - Direct processing
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const excelPath = path.join(uploadDir, file.name);
      fs.writeFileSync(excelPath, buffer);
      console.log("✅ Excel file saved:", excelPath);

      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
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
        rows, // Send ALL rows data
        rowCount: rows.length,
        fileName: file.name,
      });
    }

    // 2) PDF - Simple text extraction using built-in libraries
    if (fileName.endsWith(".pdf")) {
      // Basic PDF text extraction (works for simple PDFs with tables)
      const text = extractTextFromPDF(buffer);
      const { headers, rows } = parseTableFromText(text);

      if (!headers.length || rows.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Could not extract table data from PDF. Try Excel format instead." 
          },
          { status: 400 }
        );
      }

      // Save as Excel
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
      
      const pdfExcelPath = path.join(uploadDir, "converted_" + Date.now() + ".xlsx");
      XLSX.writeFile(workbook, pdfExcelPath);
      console.log("✅ PDF converted to Excel:", pdfExcelPath);

      return NextResponse.json({
        success: true,
        message: "PDF converted to Excel successfully",
        headers,
        rows, // Send ALL rows data
        rowCount: rows.length,
        fileName: "converted_" + Date.now() + ".xlsx",
      });
    }

    // 3) Unsupported
    return NextResponse.json(
      { 
        success: false, 
        error: "Only PDF and Excel (.xlsx, .xls) files are supported." 
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

// Simple PDF text extraction (no external deps)
function extractTextFromPDF(buffer) {
  try {
    // Convert buffer to string and extract readable text
    const pdfText = buffer.toString("latin1");
    // Basic PDF text extraction - looks for text streams
    const textMatches = pdfText.match(/BT[\s\S]*?ET/g) || [];
    let extractedText = "";
    
    for (const match of textMatches) {
      // Extract text between ( and ) or TJ operators
      const textContent = match.match(/\(([^)]+)\)/g) || [];
      extractedText += textContent.join(" ") + "\n";
    }
    
    return extractedText.trim() || "";
  } catch {
    return "";
  }
}

// Parse table from extracted text
function parseTableFromText(text) {
  const lines = text.split("\n").filter(l => l.trim().length > 1);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Use first non-empty line as headers
  const headerLine = lines.find(line => line.trim().split(/\s+/).length > 1);
  if (!headerLine) return { headers: [], rows: [] };

  const headers = headerLine
    .trim()
    .split(/\s{2,}|\t+/)
    .map(h => h.trim())
    .filter(Boolean);

  const rows = lines.slice(1, 20).map(line => { // Limit to first 20 rows
    return line
      .trim()
      .split(/\s{2,}|\t+/)
      .map(c => c.trim())
      .slice(0, headers.length)
      .concat(Array(headers.length).fill("")); // Pad shorter rows
  }).filter(row => row.some(cell => cell));

  return { headers, rows };
}
