import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { query, column } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ rows: [], headers: [] });
    }

    const SEARCH = query.trim().toLowerCase();

    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json({ rows: [], headers: [] });
    }

    const files = fs.readdirSync(uploadDir);
    if (!files.length) {
      return NextResponse.json({ rows: [], headers: [] });
    }

    const filePath = path.join(uploadDir, files[files.length - 1]);
    const fileBuffer = fs.readFileSync(filePath);

    const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const allRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: true,
    });

    const headerRowIndex = allRows.findIndex(
      (row) => row[0]?.toString().trim().toLowerCase() === "date"
    );
    if (headerRowIndex === -1) {
      return NextResponse.json({ rows: [], headers: [] });
    }

    const headers = allRows[headerRowIndex];
    const dataRows = allRows.slice(headerRowIndex + 1);

    const dateColIndex = headers.findIndex(
      (h) => h.toString().trim().toLowerCase() === "date"
    );

    const formattedRows = dataRows.map((row) => {
      const newRow = [...row];
      const v = newRow[dateColIndex];

      if (v instanceof Date) {
        newRow[dateColIndex] = v.toISOString().slice(0, 10);
      } else if (typeof v === "number") {
        const parsed = XLSX.SSF.parse_date_code(v);
        if (parsed) {
          const d = new Date(parsed.y, parsed.m - 1, parsed.d);
          newRow[dateColIndex] = d.toISOString().slice(0, 10);
        }
      }

      return newRow;
    });

    let matchedRows = [];

    if (column && column.toLowerCase() !== "all") {
      const columnIndex = headers.findIndex(
        (h) => h.toString().trim().toLowerCase() === column.toLowerCase()
      );
      if (columnIndex === -1) {
        return NextResponse.json({ rows: [], headers });
      }

      // exact match (case-insensitive), not contains
      matchedRows = formattedRows.filter((row) => {
        const cellValue = row[columnIndex]?.toString().trim().toLowerCase() || "";
        return cellValue === SEARCH;
      });

      if (!matchedRows.length) {
        return NextResponse.json({
          rows: [],
          headers,
          error: `Value not found in ${column}`,
        });
      }
    } else {
      // "All" → search all cells, still contains search
      matchedRows = formattedRows.filter((row) =>
        row.some((cell) =>
          cell
            ?.toString()
            .trim()
            .toLowerCase()
            .includes(SEARCH)
        )
      );
    }

    return NextResponse.json({ rows: matchedRows, headers });
  } catch (error) {
    console.error("SEARCH API ERROR:", error);
    return NextResponse.json(
      { rows: [], headers: [], error: error.message },
      { status: 500 }
    );
  }
}
