"use client";

import { useState } from "react";

import { confirmApplyAllAlert } from "../SweetAlerts/SweetAlerts";

export default function EditingBox({
  rows,
  setRows,
  updateCellStyle,
  updateCellSize,
  borderColor,
  setBorderColor,
}) {
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [align, setAlign] = useState("left");
  const [valign, setValign] = useState("top");
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  const applyToAll = async () => {
  if (!rows.length) return;

  const result = await confirmApplyAllAlert();
  if (!result.isConfirmed) return;

  const totalRows = rows.length;
  const totalCols = rows[0].length;

  for (let r = 1; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      updateCellStyle(r, c, null, {
        color: textColor || "#000000",
        backgroundColor: bgColor || "#ffffff",
        textAlign: align,
        verticalAlign: valign,
        borderColor: borderColor,
      });
      if (height || width) {
        updateCellSize(r, c, height || undefined, width || undefined);
      }
    }
  }
};


  const addEmptyRow = () => {
    if (!rows.length) return;
    const cols = rows[0].length;
    const emptyRow = new Array(cols).fill("");
    setRows([...rows, emptyRow]);
  };

  const deleteLastRow = () => {
    if (rows.length <= 1) return;
    setRows(rows.slice(0, rows.length - 1));
  };

  const copyAllToClipboard = () => {
    if (!rows.length) return;
    const text = rows.map((r) => r.join("\t")).join("\n");
    navigator.clipboard.writeText(text);
    alert("All rows copied to clipboard");
  };

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3 text-xs text-black shadow-sm">
      <div className="mb-2 w-full text-[11px] font-semibold">
        Global tools (apply to entire workspace)
      </div>

      <div className="flex items-center gap-2">
        <span>Text</span>
        <input
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-gray-300"
        />
      </div>

      <div className="flex items-center gap-2">
        <span>Background</span>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-gray-300"
        />
      </div>

      <div className="flex items-center gap-2">
        <span>Align</span>
        <select
          value={align}
          onChange={(e) => setAlign(e.target.value)}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span>Vertical</span>
        <select
          value={valign}
          onChange={(e) => setValign(e.target.value)}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
        >
          <option value="top">Top</option>
          <option value="middle">Middle</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span>Height</span>
        <input
          type="number"
          min={0}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value) || 0)}
          className="w-16 rounded border border-gray-300 px-1 py-1 text-xs"
        />
        <span>px (0 = auto)</span>
      </div>

      <div className="flex items-center gap-2">
        <span>Width</span>
        <input
          type="number"
          min={0}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value) || 0)}
          className="w-16 rounded border border-gray-300 px-1 py-1 text-xs"
        />
        <span>px (0 = auto)</span>
      </div>

      <div className="flex items-center gap-2">
        <span>Border</span>
        <input
          type="color"
          value={borderColor}
          onChange={(e) => setBorderColor(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-gray-300"
        />
      </div>

      <button
        onClick={applyToAll}
        className="ml-auto rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
      >
        Apply to all cells
      </button>

      <button
        onClick={addEmptyRow}
        className="rounded border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
      >
        ➕ Add empty row
      </button>

      <button
        onClick={deleteLastRow}
        className="rounded border border-red-500 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        🗑 Delete last row
      </button>

      <button
        onClick={copyAllToClipboard}
        className="rounded border border-gray-400 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
      >
        📋 Copy all
      </button>
    </div>
  );
}
