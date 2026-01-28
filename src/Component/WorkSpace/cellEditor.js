"use client";

import { useState } from "react";

export default function CellEditor({ rowIdx, onUpdateStyle, onClose }) {
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [fontWeight, setFontWeight] = useState("normal");
  const [fontStyle, setFontStyle] = useState("normal");

  const applyToAllCells = () => {
    // apply style to first 50 columns (safe upper bound)
    for (let colIdx = 0; colIdx < 50; colIdx++) {
      onUpdateStyle(rowIdx, colIdx, "color", textColor);
      onUpdateStyle(rowIdx, colIdx, "backgroundColor", bgColor);
      onUpdateStyle(rowIdx, colIdx, "fontWeight", fontWeight);
      onUpdateStyle(rowIdx, colIdx, "fontStyle", fontStyle);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          🎨 Format Row {rowIdx + 1}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-gray-700">
              Text color
            </label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-gray-700">
              Background color
            </label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-gray-300"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={fontWeight === "bold"}
              onChange={(e) =>
                setFontWeight(e.target.checked ? "bold" : "normal")
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            Bold
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={fontStyle === "italic"}
              onChange={(e) =>
                setFontStyle(e.target.checked ? "italic" : "normal")
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            Italic
          </label>

          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-center text-sm">
            <span
              style={{
                color: textColor,
                backgroundColor: bgColor,
                fontWeight,
                fontStyle,
              }}
              className="rounded px-2 py-1"
            >
              Preview text for this row
            </span>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={applyToAllCells}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              ✅ Apply to row
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
