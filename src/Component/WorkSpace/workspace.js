"use client";

import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import Input from "./inputBox";
import EditingBox from "./editingBox";
import EditingPopup from "./editingPopup";
import {
  errorAlert,
  successAlert,
  confirmDownloadAlert,
} from "../SweetAlerts/SweetAlerts";

export default function Workspace() {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [cellStyles, setCellStyles] = useState({});
  const [cellSizes, setCellSizes] = useState({});
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingPopupCell, setEditingPopupCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [borderColor, setBorderColor] = useState("#9ca3af");
  const [borderStyle, setBorderStyle] = useState("solid");
  const [infoMessage, setInfoMessage] = useState("");
  const [dragMode, setDragMode] = useState(false);
  const [sortType, setSortType] = useState("none");
  const [activeHandle, setActiveHandle] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // which columns are visible
  const [visibleColumns, setVisibleColumns] = useState([]);

  // header index being edited
  const [editingHeaderIdx, setEditingHeaderIdx] = useState(null);

  const workspaceRef = useRef(null);
  const exportTableRef = useRef(null);
  const resizingInfo = useRef(null);

  const askFilename = (defaultName) => {
    const name = window.prompt("File name (without extension):", defaultName);
    if (!name) return null;
    return name.trim();
  };

  const keyFor = (rowIdx, colIdx) => `${rowIdx}-${colIdx}`;

  // ✅ NEW: exam time from session (M/E)
  const getExamStartTime = (sessionCode) => {
    const code = sessionCode?.toString().toUpperCase().trim();
    if (code === "M") return "9:30 AM";
    if (code === "E") return "1:30 PM";
    return "";
  };

  const findSessionCodeColumn = () => {
    return headers.findIndex((h) =>
      h &&
      ["session", "sem", "type", "shift"].some((k) =>
        h.toString().toLowerCase().includes(k)
      )
    );
  };

  // when headers change, default all columns to visible
  useEffect(() => {
    if (headers && headers.length) {
      setVisibleColumns((prev) => {
        if (!prev.length) return headers.map((_, i) => i);
        return prev.filter((i) => i < headers.length);
      });
    }
  }, [headers]);

  const toggleColumnVisibility = (index) => {
    setVisibleColumns((prev) => {
      if (prev.includes(index)) {
        if (prev.length === 1) return prev;
        return prev.filter((i) => i !== index);
      }
      return [...prev, index].sort((a, b) => a - b);
    });
  };

  const withFullHeightCapture = async (fn) => {
    const el = workspaceRef.current;
    if (!el) return;

    const scrollDiv = el.querySelector(".workspace-scroll");

    let prevMaxHeight;
    let prevOverflowY;

    if (scrollDiv) {
      prevMaxHeight = scrollDiv.style.maxHeight;
      prevOverflowY = scrollDiv.style.overflowY;

      scrollDiv.style.maxHeight = "none";
      scrollDiv.style.overflowY = "visible";
    }

    try {
      await fn();
    } finally {
      if (scrollDiv) {
        scrollDiv.style.maxHeight = prevMaxHeight || "70vh";
        scrollDiv.style.overflowY = prevOverflowY || "auto";
      }
    }
  };

  // ---------- CSV DOWNLOAD ----------
  const downloadCSV = async () => {
    if (!rows || rows.length <= 1) {
      errorAlert("No data to download.");
      return;
    }

    const base = askFilename("workspace-data");
    if (!base) return;

    const cols = visibleColumns.length
      ? visibleColumns
      : headers.map((_, i) => i);

    const csvRows = [];

    csvRows.push(
      cols
        .map((idx) => {
          let h = headers[idx] || `Col ${idx + 1}`;
          h = String(h).replace(/"/g, '""');
          return `"${h}"`;
        })
        .join(",")
    );

    rows.slice(1).forEach((row) => {
      const line = cols
        .map((cIdx) => {
          let v = row[cIdx] ?? "";
          v = String(v).replace(/"/g, '""');
          return `"${v}"`;
        })
        .join(",");
      csvRows.push(line);
    });

    const csvString = csvRows.join("\n");

    const blob = new Blob([csvString], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    successAlert("CSV downloaded.");
  };

  // ---------- COMMON EXPORT HELPERS ----------
  const captureExportTable = async () => {
    if (!exportTableRef.current) {
      errorAlert("Nothing to export.");
      return null;
    }

    const canvas = await html2canvas(exportTableRef.current, {
      scale: 2,
      useCORS: true,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: "#ffffff",
    });

    return canvas;
  };

  const handleDownloadPNG = async () => {
    if (!rows || rows.length <= 1) {
      errorAlert("No data to export.");
      return;
    }

    const base = askFilename("workspace");
    if (!base) return;

    setDownloading(true);
    try {
      const canvas = await captureExportTable();
      if (!canvas) {
        setDownloading(false);
        return;
      }

      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `${base}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      successAlert("PNG downloaded.");
    } catch {
      errorAlert("Could not download PNG.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!rows || rows.length <= 1) {
      errorAlert("No data to export.");
      return;
    }

    const base = askFilename("workspace");
    if (!base) return;

    setDownloading(true);
    try {
      const canvas = await captureExportTable();
      if (!canvas) {
        setDownloading(false);
        return;
      }

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
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

      pdf.save(`${base}.pdf`);
      successAlert("PDF downloaded.");
    } catch {
      errorAlert("Could not download PDF.");
    } finally {
      setDownloading(false);
    }
  };

  // ---------- CLEAR HELPERS ----------
  const clearWorkspace = () => {
    setRows([]);
    setHeaders([]);
    setCellStyles({});
    setCellSizes({});
    setSelectedCell(null);
    setEditingPopupCell(null);
    setEditingCell(null);
    setInfoMessage("");
    setDragMode(false);
    setSortType("none");
    setActiveHandle(null);
    setVisibleColumns([]);
  };

  const clearFormats = () => {
    setCellStyles({});
    setCellSizes({});
    setBorderColor("#9ca3af");
    setBorderStyle("solid");
    setDragMode(false);
    setActiveHandle(null);
  };

  // ---------- SEARCH ----------
  const ensureHeaders = (newHeaders) => {
    if (!headers.length && newHeaders && newHeaders.length) {
      setHeaders(newHeaders);
      setVisibleColumns(newHeaders.map((_, i) => i));
      const newRows = [newHeaders];
      setRows(newRows);
      return newRows;
    }
    return rows;
  };

  const searchExcel = async (text, column) => {
    setInfoMessage("");
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text, column }),
    });

    const data = await res.json();

    if (data.error || !data.rows || !data.rows.length) {
      if (column && column !== "All") {
        setInfoMessage("Input correct column, no exact match found.");
      } else {
        setInfoMessage("No matching rows found for this search.");
      }
      return;
    }

    let newRows = ensureHeaders(data.headers || headers);

    if (!newRows.length && data.headers?.length) {
      newRows = [data.headers, ...data.rows];
      setHeaders(data.headers);
      setVisibleColumns(data.headers.map((_, i) => i));
      setRows(newRows);
      setInfoMessage("Matching rows added to workspace.");
      return;
    }

    const dateIndex = headers.findIndex(
      (h) => h?.toString().trim().toLowerCase() === "date"
    );
    const codeIndex = headers.findIndex(
      (h) => h?.toString().trim().toLowerCase() === "sub code"
    );

    let anyAdded = false;
    let anyExisting = false;

    data.rows.forEach((r) => {
      if (!newRows.length) {
        newRows.push(r);
        anyAdded = true;
        return;
      }

      if (dateIndex === -1 || codeIndex === -1) {
        newRows.push(r);
        anyAdded = true;
        return;
      }

      const d = r[dateIndex]?.toString().trim().toLowerCase();
      const c = r[codeIndex]?.toString().trim().toLowerCase();

      const exists = newRows.some((row, ridx) => {
        if (ridx === 0) return false;
        const d2 = row[dateIndex]?.toString().trim().toLowerCase();
        const c2 = row[codeIndex]?.toString().trim().toLowerCase();
        return d === d2 && c === c2;
      });

      if (exists) {
        anyExisting = true;
      } else {
        newRows.push(r);
        anyAdded = true;
      }
    });

    setRows([...newRows]);

    if (anyAdded && anyExisting) {
      setInfoMessage("Some rows were added, some were already present.");
    } else if (anyAdded) {
      setInfoMessage("Matching rows added to workspace.");
    } else if (anyExisting) {
      setInfoMessage("All matching rows already exist in workspace.");
    }
  };

  // ---------- STYLE / SIZE ----------
  const updateCellStyle = (rowIdx, colIdx, styleKey, valueOrObj) => {
    const k = keyFor(rowIdx, colIdx);
    setCellStyles((prev) => {
      const current = prev[k] || {};
      let next;
      if (styleKey === null && typeof valueOrObj === "object") {
        next = { ...current, ...valueOrObj };
      } else {
        next = { ...current, [styleKey]: valueOrObj };
      }
      return { ...prev, [k]: next };
    });
  };

  const updateCellSize = (rowIdx, colIdx, height, width) => {
    const k = keyFor(rowIdx, colIdx);
    setCellSizes((prev) => ({
      ...prev,
      [k]: {
        height: height === undefined ? prev[k]?.height : height,
        width: width === undefined ? prev[k]?.width : width,
      },
    }));
  };

  const styleForCell = (rowIdx, colIdx) => {
    const base = cellStyles[keyFor(rowIdx, colIdx)] || {};
    const size = cellSizes[keyFor(rowIdx, colIdx)] || {};

    const noWrap = base.noWrap ?? true;

    const cellBorderColor = base.borderColor || borderColor || "#e5e7eb";
    const cellBorderStyle = base.borderStyle || borderStyle || "solid";
    const cellBorderWidth =
      base.borderWidth !== undefined ? base.borderWidth : 1;

    const borderTop = base.borderTop !== undefined ? base.borderTop : true;
    const borderRight = base.borderRight !== undefined ? base.borderRight : true;
    const borderBottom =
      base.borderBottom !== undefined ? base.borderBottom : true;
    const borderLeft = base.borderLeft !== undefined ? base.borderLeft : true;

    const style = {
      color: base.color || "#000000",
      fontSize: base.fontSize || "11px",
      verticalAlign: base.verticalAlign || "top",
      backgroundColor: base.backgroundColor || "#ffffff",
      textAlign: base.textAlign || "left",
      whiteSpace: noWrap ? "nowrap" : "normal",
      overflowWrap: noWrap ? "normal" : "break-word",
    };

    const b = `${cellBorderWidth}px ${cellBorderStyle} ${cellBorderColor}`;
    style.borderTop = borderTop ? b : "none";
    style.borderRight = borderRight ? b : "none";
    style.borderBottom = borderBottom ? b : "none";
    style.borderLeft = borderLeft ? b : "none";

    if (size.height) style.height = `${size.height}px`;
    if (size.width) style.width = `${size.width}px`;

    return style;
  };

  // ---------- DRAG RESIZE ----------
  const startResizePointer = (rowIdx, colIdx, direction, clientX, clientY) => {
    if (!dragMode) return;
    if (activeHandle && activeHandle !== direction && direction !== "corner")
      return;

    resizingInfo.current = {
      rowIdx,
      colIdx,
      direction,
      startX: clientX,
      startY: clientY,
      initial: {
        ...(cellSizes[keyFor(rowIdx, colIdx)] || {}),
        width: (cellSizes[keyFor(rowIdx, colIdx)] || {}).width || 120,
        height: (cellSizes[keyFor(rowIdx, colIdx)] || {}).height || 24,
      },
    };
  };

  const onResizeMove = (e) => {
    if (!resizingInfo.current) return;

    e.preventDefault();

    const info = resizingInfo.current;
    const point = "touches" in e ? e.touches[0] : e;

    const dx = point.clientX - info.startX;
    const dy = point.clientY - info.startY;

    info.startX = point.clientX;
    info.startY = point.clientY;

    let newWidth = info.initial.width || 120;
    let newHeight = info.initial.height || 24;

    if (info.direction === "right" || info.direction === "corner") {
      newWidth += dx;
    }
    if (info.direction === "bottom" || info.direction === "corner") {
      newHeight += dy;
    }
    if (info.direction === "left") {
      newWidth -= dx;
    }
    if (info.direction === "top") {
      newHeight -= dy;
    }

    if (newWidth < 10) newWidth = 10;
    if (newHeight < 10) newHeight = 10;

    updateCellSize(info.rowIdx, info.colIdx, newHeight, newWidth);

    info.initial.width = newWidth;
    info.initial.height = newHeight;
  };

  const stopResize = () => {
    resizingInfo.current = null;
    window.removeEventListener("mousemove", onResizeMove);
    window.removeEventListener("mouseup", stopResize);
    window.removeEventListener("touchmove", onResizeMove);
    window.removeEventListener("touchend", stopResize);
    window.removeEventListener("touchcancel", stopResize);
  };

  const startResizeMouse = (rowIdx, colIdx, direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    startResizePointer(rowIdx, colIdx, direction, e.clientX, e.clientY);
    window.addEventListener("mousemove", onResizeMove, { passive: false });
    window.addEventListener("mouseup", stopResize);
  };

  const startResizeTouch = (rowIdx, colIdx, direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    const t = e.touches[0];
    startResizePointer(rowIdx, colIdx, direction, t.clientX, t.clientY);
    window.addEventListener("touchmove", onResizeMove, { passive: false });
    window.addEventListener("touchend", stopResize);
    window.addEventListener("touchcancel", stopResize);
  };

  // ---------- CELL SELECTION ----------
  const handleCellClick = (rowIdx, colIdx) => {
    const cell = { rowIdx, colIdx };
    setSelectedCell(cell);
    setEditingPopupCell(cell);
  };

  const handleCellDoubleClick = (rowIdx, colIdx) => {
    setDragMode((prev) => !prev);
    setActiveHandle(null);
    const cell = { rowIdx, colIdx };
    setSelectedCell(cell);
    setEditingPopupCell(cell);
  };

  // ---------- HEADER EDITING ----------
  const startHeaderEdit = (idx) => {
    setEditingHeaderIdx(idx);
  };

  const applyHeaderChange = (idx, newText) => {
    const next = [...headers];
    next[idx] = newText || "";
    setHeaders(next);

    if (rows.length > 0) {
      const newRows = [...rows];
      if (newRows[0] && newRows[0][idx] !== undefined) {
        newRows[0] = [...newRows[0]];
        newRows[0][idx] = newText || "";
        setRows(newRows);
      }
    }

    setEditingHeaderIdx(null);
  };

  // ---------- DATE FILTER / SORT ----------
  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getWeekRange = (d) => {
    const day = d.getDay() || 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    monday.setHours(0, 0, 0, 0);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };

  const applySortFilter = () => {
    const dataRows = rows.slice(1);
    if (!sortType || sortType === "none") return dataRows;

    const dateIndex = headers.findIndex(
      (h) => h?.toString().trim().toLowerCase() === "date"
    );
    if (dateIndex === -1) return dataRows;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const thisWeek = getWeekRange(now);
    const prevWeek = (() => {
      const lastWeekEnd = new Date(thisWeek.start);
      lastWeekEnd.setDate(thisWeek.start.getDate() - 1);
      return getWeekRange(lastWeekEnd);
    })();

    if (sortType === "today") {
      return dataRows.filter((row) => {
        const d = parseDate(row[dateIndex]);
        return d && isSameDay(d, now);
      });
    }

    if (sortType === "tomorrow") {
      return dataRows.filter((row) => {
        const d = parseDate(row[dateIndex]);
        return d && isSameDay(d, tomorrow);
      });
    }

    if (sortType === "yesterday") {
      return dataRows.filter((row) => {
        const d = parseDate(row[dateIndex]);
        return d && isSameDay(d, yesterday);
      });
    }

    if (sortType === "this-week") {
      return dataRows.filter((row) => {
        const d = parseDate(row[dateIndex]);
        return d && d >= thisWeek.start && d <= thisWeek.end;
      });
    }

    if (sortType === "prev-week") {
      return dataRows.filter((row) => {
        const d = parseDate(row[dateIndex]);
        return d && d >= prevWeek.start && d <= prevWeek.end;
      });
    }

    return dataRows;
  };

  const visibleRows = applySortFilter();

  const sortRows = (columnName, mode) => {
    const dataRows = rows.slice(1);
    const colIndex = headers.findIndex(
      (h) => h?.toString().trim().toLowerCase() === columnName.toLowerCase()
    );
    if (colIndex === -1) return;

    let sorted = [...dataRows];

    if (mode === "date-asc" || mode === "date-desc") {
      sorted.sort((a, b) => {
        const da = parseDate(a[colIndex]);
        const db = parseDate(b[colIndex]);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return mode === "date-asc" ? da - db : db - da;
      });
    } else if (mode === "text-asc" || mode === "text-desc") {
      sorted.sort((a, b) => {
        const sa = (a[colIndex] ?? "").toString().toLowerCase();
        const sb = (b[colIndex] ?? "").toString().toLowerCase();
        if (sa < sb) return mode === "text-asc" ? -1 : 1;
        if (sa > sb) return mode === "text-asc" ? 1 : -1;
        return 0;
      });
    }

    setRows([rows[0], ...sorted]);
  };

  const armHandle = (direction) => {
    if (!dragMode) return;
    setActiveHandle((prev) => (prev === direction ? null : direction));
  };

  const onVirtualDrag = (dx, dy) => {
    if (!selectedCell) return;

    const { rowIdx, colIdx } = selectedCell;
    const k = keyFor(rowIdx, colIdx);
    const current = cellSizes[k] || { width: 120, height: 24 };

    let newWidth = current.width + dx;
    let newHeight = current.height + dy;

    if (newWidth < 10) newWidth = 10;
    if (newHeight < 10) newHeight = 10;

    updateCellSize(rowIdx, colIdx, newHeight, newWidth);
  };

  useEffect(() => {
    return () => {
      stopResize();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colsToRender =
    visibleColumns.length && headers.length
      ? visibleColumns
      : headers.map((_, i) => i);

  return (
    <section className="mx-auto max-w-7xl px  -4 py-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Input onSearch={searchExcel} onColumnChange={() => {}} />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={clearFormats}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear format
          </button>
          <button
            onClick={clearWorkspace}
            className="h-9 rounded-md border border-rose-300 bg-white px-3 text-xs font-medium text-rose-700 hover:bg-rose-50"
          >
            Clear workspace
          </button>
          <button
            onClick={downloadCSV}
            disabled={downloading}
            className="h-9 rounded-md bg-slate-700 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Download CSV
          </button>
          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="h-9 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Download PNG
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Column visibility controls */}
      {headers.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-semibold text-slate-700">Columns:</span>
          {headers.map((h, idx) => (
            <label
              key={idx}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px]"
            >
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={colsToRender.includes(idx)}
                onChange={() => toggleColumnVisibility(idx)}
              />
              <span className="text-slate-700">
                {idx === 10 ? "Time" : h || `Col ${idx + 1}`}
              </span>
            </label>
          ))}
        </div>
      )}

      <EditingBox
        rows={rows}
        setRows={setRows}
        updateCellStyle={updateCellStyle}
        updateCellSize={updateCellSize}
        borderColor={borderColor}
        setBorderColor={setBorderColor}
        infoMessage={infoMessage}
      />

      {infoMessage && (
        <div className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
          {infoMessage}
        </div>
      )}

      {/* Visible workspace */}
      <div ref={workspaceRef} className="workspace-capture">
        {rows.length === 0 ? (
          <p className="mt-6 rounded-lg bg-gray-100 p-6 text-center text-sm text-gray-600">
            No data in workspace. Search rows to bring them here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-700">
              <span>Rows in workspace: {rows.length - 1}</span>
              <span>Tap a side handle once to arm it (red), then drag.</span>
            </div>

            <div className="max-h-[70vh] overflow-auto workspace-scroll">
              <div className="w-full overflow-x-auto">
                <table className="min-w-max border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      {colsToRender.map((idx) => (
                        <th
                          key={idx}
                          className="border border-slate-300 px-2 py-1 text-[11px] font-semibold text-black"
                          style={{ borderColor: "#e5e7eb" }}
                          onDoubleClick={() => startHeaderEdit(idx)}
                        >
                          {editingHeaderIdx === idx ? (
                            <input
                              autoFocus
                              defaultValue={headers[idx] || ""}
                              className="w-full rounded border border-indigo-400 px-1 py-0.5 text-[11px] text-black focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              onBlur={(e) =>
                                applyHeaderChange(idx, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  applyHeaderChange(
                                    idx,
                                    e.currentTarget.value
                                  );
                                } else if (e.key === "Escape") {
                                  setEditingHeaderIdx(null);
                                }
                              }}
                            />
                          ) : idx === 10 ? (
                            "Time"
                          ) : (
                            headers[idx] || `Col ${idx + 1}`
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row, visibleIdx) => {
                      const realRowIdx = rows.indexOf(row);
                      return (
                        <tr key={visibleIdx} className="hover:bg-gray-50">
                          {row.map((cell, cIdx) => {
                            if (!colsToRender.includes(cIdx)) return null;

                            const isSelected =
                              selectedCell &&
                              selectedCell.rowIdx === realRowIdx &&
                              selectedCell.colIdx === cIdx;

                            let displayValue = cell;
                            if (cIdx === 10 && realRowIdx > 0) {
                              const sCol = findSessionCodeColumn();
                              const sessionCode =
                                sCol >= 0 ? row[sCol] : undefined;
                              displayValue = getExamStartTime(sessionCode);
                            }

                            const style = styleForCell(realRowIdx, cIdx);

                            return (
                              <td
                                key={cIdx}
                                className={
                                  "relative px-2 py-1 text-[11px] text-slate-900 " +
                                  (isSelected
                                    ? "ring-1 ring-indigo-500 ring-offset-0"
                                    : "")
                                }
                                style={style}
                                onClick={() =>
                                  handleCellClick(realRowIdx, cIdx)
                                }
                                onDoubleClick={() =>
                                  handleCellDoubleClick(realRowIdx, cIdx)
                                }
                              >
                                {editingCell &&
                                editingCell.rowIdx === realRowIdx &&
                                editingCell.colIdx === cIdx ? (
                                  <input
                                    autoFocus
                                    defaultValue={displayValue}
                                    className="w-full border border-indigo-400 px-1 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    onBlur={(e) => {
                                      const newRows = [...rows];
                                      newRows[realRowIdx][cIdx] =
                                        e.target.value;
                                      setRows(newRows);
                                      setEditingCell(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        const newRows = [...rows];
                                        newRows[realRowIdx][cIdx] =
                                          e.target.value;
                                        setRows(newRows);
                                        setEditingCell(null);
                                      }
                                    }}
                                  />
                                ) : (
                                  (cIdx === 10 && realRowIdx > 0 && displayValue) ||
                                  String(displayValue ?? "")
                                )}

                                {selectedCell &&
                                  selectedCell.rowIdx === realRowIdx &&
                                  selectedCell.colIdx === cIdx &&
                                  dragMode && (
                                    <>
                                      {/* LEFT */}
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          armHandle("left");
                                        }}
                                        onTouchStart={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          armHandle("left");
                                        }}
                                        onMouseDown={(e) =>
                                          startResizeMouse(
                                            realRowIdx,
                                            cIdx,
                                            "left",
                                            e
                                          )
                                        }
                                        onTouchMove={(e) =>
                                          startResizeTouch(
                                            realRowIdx,
                                            cIdx,
                                            "left",
                                            e
                                          )
                                        }
                                        className={
                                          "absolute left-0 top-1/2 h-3 w-1 -translate-y-1/2 cursor-col-resize " +
                                          (activeHandle === "left"
                                            ? "bg-red-500"
                                            : "bg-indigo-400")
                                        }
                                      />
                                      {/* RIGHT */}
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          armHandle("right");
                                        }}
                                        onTouchStart={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          armHandle("right");
                                        }}
                                        onMouseDown={(e) =>
                                          startResizeMouse(
                                            realRowIdx,
                                            cIdx,
                                            "right",
                                            e
                                          )
                                        }
                                        onTouchMove={(e) =>
                                          startResizeTouch(
                                            realRowIdx,
                                            cIdx,
                                            "right",
                                            e
                                          )
                                        }
                                        className={
                                          "absolute right-0 top-1/2 h-3 w-1 -translate-y-1/2 cursor-col-resize " +
                                          (activeHandle === "right"
                                            ? "bg-red-500"
                                            : "bg-indigo-400")
                                        }
                                      />
                                      {/* TOP */}
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          armHandle("top");
                                        }}
                                        onTouchStart={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          armHandle("top");
                                        }}
                                        onMouseDown={(e) =>
                                          startResizeMouse(
                                            realRowIdx,
                                            cIdx,
                                            "top",
                                            e
                                          )
                                        }
                                        onTouchMove={(e) =>
                                          startResizeTouch(
                                            realRowIdx,
                                            cIdx,
                                            "top",
                                            e
                                          )
                                        }
                                        className={
                                          "absolute left-1/2 top-0 h-1 w-3 -translate-x-1/2 cursor-row-resize " +
                                          (activeHandle === "top"
                                            ? "bg-red-500"
                                            : "bg-indigo-400")
                                        }
                                      />
                                      {/* BOTTOM */}
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          armHandle("bottom");
                                        }}
                                        onTouchStart={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          armHandle("bottom");
                                        }}
                                        onMouseDown={(e) =>
                                          startResizeMouse(
                                            realRowIdx,
                                            cIdx,
                                            "bottom",
                                            e
                                          )
                                        }
                                        onTouchMove={(e) =>
                                          startResizeTouch(
                                            realRowIdx,
                                            cIdx,
                                            "bottom",
                                            e
                                          )
                                        }
                                        className={
                                          "absolute bottom-0 left-1/2 h-1 w-3 -translate-x-1/2 cursor-row-resize " +
                                          (activeHandle === "bottom"
                                            ? "bg-red-500"
                                            : "bg-indigo-400")
                                        }
                                      />
                                      {/* CORNER */}
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          armHandle("corner");
                                        }}
                                        onTouchStart={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          armHandle("corner");
                                        }}
                                        onMouseDown={(e) =>
                                          startResizeMouse(
                                            realRowIdx,
                                            cIdx,
                                            "corner",
                                            e
                                          )
                                        }
                                        onTouchMove={(e) =>
                                          startResizeTouch(
                                            realRowIdx,
                                            cIdx,
                                            "corner",
                                            e
                                          )
                                        }
                                        className={
                                          "absolute bottom-0 right-0 h-2 w-2 cursor-nwse-resize " +
                                          (activeHandle === "corner"
                                            ? "bg-red-600"
                                            : "bg-indigo-600")
                                        }
                                      />
                                    </>
                                  )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden export table */}
      {rows.length > 0 && (
        <div
          style={{
            position: "fixed",
            left: -99999,
            top: -99999,
            zIndex: -1,
            backgroundColor: "#ffffff",
          }}
        >
          <div ref={exportTableRef}>
            <table
              style={{
                borderCollapse: "collapse",
                fontSize: "10px",
                width: "auto",
                maxWidth: "none",
              }}
            >
              <thead>
                <tr>
                  {colsToRender.map((idx) => (
                    <th
                      key={idx}
                      style={{
                        border: "1px solid #d1d5db",
                        padding: "4px 6px",
                        fontWeight: 600,
                        backgroundColor: "#f3f4f6",
                        textAlign: "left",
                        color: "#000000",
                      }}
                    >
                      {idx === 10 ? "Time" : headers[idx] || `Col ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => {
                      if (!colsToRender.includes(cIdx)) return null;

                      let exportValue = cell;
                      if (cIdx === 10) {
                        const sCol = findSessionCodeColumn();
                        const sessionCode =
                          sCol >= 0 ? row[sCol] : undefined;
                        exportValue = getExamStartTime(sessionCode);
                      }

                      const style = styleForCell(rIdx + 1, cIdx);
                      const {
                        borderTop,
                        borderRight,
                        borderBottom,
                        borderLeft,
                        ...restStyle
                      } = style;

                      return (
                        <td
                          key={cIdx}
                          style={{
                            borderTop,
                            borderRight,
                            borderBottom,
                            borderLeft,
                            padding: "4px 6px",
                            verticalAlign: "top",
                            ...restStyle,
                          }}
                        >
                          {String(exportValue ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingPopupCell && (
        <EditingPopup
          cell={editingPopupCell}
          styleForCell={styleForCell}
          updateCellStyle={updateCellStyle}
          updateCellSize={updateCellSize}
          borderColor={borderColor}
          setBorderColor={setBorderColor}
          sortType={sortType}
          setSortType={setSortType}
          headers={headers}
          sortRows={sortRows}
          onToggleDragMode={() => setDragMode((p) => !p)}
          dragMode={dragMode}
          onVirtualDrag={onVirtualDrag}
          onClose={() => setEditingPopupCell(null)}
        />
      )}
    </section>
  );
}
