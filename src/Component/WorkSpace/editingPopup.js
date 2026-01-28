"use client";

import { useState, useEffect, useRef } from "react";

export default function EditingPopup({
  cell,
  styleForCell,
  updateCellStyle,
  updateCellSize,
  borderColor,
  setBorderColor,
  sortType,
  setSortType,
  headers,
  sortRows,
  onToggleDragMode,
  dragMode,
  onVirtualDrag,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("editor");
  const [editorMode, setEditorMode] = useState("text"); // "text" | "border"

  // text mode
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [align, setAlign] = useState("left");
  const [valign, setValign] = useState("top");
  const [wrap, setWrap] = useState(true);
  const [fontSize, setFontSize] = useState(11);

  // size
  const [height, setHeight] = useState(24);
  const [width, setWidth] = useState(120);

  // border mode
  const [cellBorderColor, setCellBorderColor] = useState("#9ca3af");
  const [cellBorderStyle, setCellBorderStyle] = useState("solid");
  const [borderWidth, setBorderWidth] = useState(1);

  const [borderTop, setBorderTop] = useState(true);
  const [borderRight, setBorderRight] = useState(true);
  const [borderBottom, setBorderBottom] = useState(true);
  const [borderLeft, setBorderLeft] = useState(true);

  // sorting
  const [sortColumn, setSortColumn] = useState("Date");
  const [sortMode, setSortMode] = useState("date-asc");

  const dragPadState = useRef(null);

  useEffect(() => {
    if (!cell) return;
    const current = styleForCell(cell.rowIdx, cell.colIdx);

    setTextColor(current.color || "#000000");
    setBgColor(current.backgroundColor || "#ffffff");
    setAlign(current.textAlign || "left");
    setValign(current.verticalAlign || "top");
    setWrap(current.whiteSpace === "nowrap" ? false : true);

    const currentFontSize =
      typeof current.fontSize === "number"
        ? current.fontSize
        : parseInt(
            (current.fontSize || "11px").toString().replace("px", ""),
            10
          );
    setFontSize(isNaN(currentFontSize) ? 11 : currentFontSize);

    setHeight(parseInt((current.height || "24px").toString()) || 24);
    setWidth(parseInt((current.width || "120px").toString()) || 120);

    setCellBorderColor(current.borderColor || borderColor);
    setCellBorderStyle(current.borderStyle || "solid");

    const currentBorderWidth =
      typeof current.borderWidth === "number"
        ? current.borderWidth
        : parseInt(
            (current.borderWidth || "1px").toString().replace("px", ""),
            10
          );
    setBorderWidth(isNaN(currentBorderWidth) ? 1 : currentBorderWidth);

    setBorderTop(
      current.borderTop !== "none" && current.borderTop !== undefined
        ? true
        : false
    );
    setBorderRight(
      current.borderRight !== "none" && current.borderRight !== undefined
        ? true
        : false
    );
    setBorderBottom(
      current.borderBottom !== "none" && current.borderBottom !== undefined
        ? true
        : false
    );
    setBorderLeft(
      current.borderLeft !== "none" && current.borderLeft !== undefined
        ? true
        : false
    );
  }, [cell, styleForCell, borderColor]);

  useEffect(() => {
    if (headers && headers.length && !headers.includes(sortColumn)) {
      setSortColumn(headers[0]);
    }
  }, [headers, sortColumn]);

  if (!cell) return null;

  const applyInstant = (changes) => {
    const next = {
      color: textColor || "#000000",
      backgroundColor: bgColor || "#ffffff",
      textAlign: align,
      verticalAlign: valign,
      noWrap: wrap ? false : true,
      fontSize: `${fontSize}px`,
      borderColor: cellBorderColor,
      borderStyle: cellBorderStyle,
      borderWidth,
      borderTop,
      borderRight,
      borderBottom,
      borderLeft,
    };
    Object.assign(next, changes);
    updateCellStyle(cell.rowIdx, cell.colIdx, null, next);
  };

  // text handlers
  const changeColor = (v) => {
    setTextColor(v);
    applyInstant({ color: v });
  };

  const changeBg = (v) => {
    setBgColor(v);
    applyInstant({ backgroundColor: v });
  };

  const changeAlign = (v) => {
    setAlign(v);
    applyInstant({ textAlign: v });
  };

  const changeValign = (v) => {
    setValign(v);
    applyInstant({ verticalAlign: v });
  };

  const changeFontSize = (v) => {
    const value = Math.max(6, Math.min(40, Number(v) || 11));
    setFontSize(value);
    applyInstant({ fontSize: `${value}px` });
  };

  const incFont = () => changeFontSize(fontSize + 1);
  const decFont = () => changeFontSize(fontSize - 1);

  // size handlers
  const changeHeight = (v) => {
    const value = Math.max(1, Number(v) || 1);
    setHeight(value);
    updateCellSize(cell.rowIdx, cell.colIdx, value, width);
  };

  const changeWidth = (v) => {
    const value = Math.max(1, Number(v) || 1);
    setWidth(value);
    updateCellSize(cell.rowIdx, cell.colIdx, height, value);
  };

  const toggleWrap = () => {
    const newWrap = !wrap;
    setWrap(newWrap);
    applyInstant({ noWrap: newWrap ? false : true });
  };

  // border handlers
  const changeCellBorderColor = (v) => {
    setCellBorderColor(v);
    applyInstant({ borderColor: v });
    setBorderColor(v);
  };

  const changeCellBorderStyle = (v) => {
    setCellBorderStyle(v);
    applyInstant({ borderStyle: v });
  };

  const changeBorderWidth = (v) => {
    const value = Math.max(0, Math.min(10, Number(v) || 1));
    setBorderWidth(value);
    applyInstant({ borderWidth: value });
  };

  const incBorderWidth = () => changeBorderWidth(borderWidth + 1);
  const decBorderWidth = () => changeBorderWidth(borderWidth - 1);

  const setAllBorders = (on) => {
    setBorderTop(on);
    setBorderRight(on);
    setBorderBottom(on);
    setBorderLeft(on);
    applyInstant({
      borderTop: on,
      borderRight: on,
      borderBottom: on,
      borderLeft: on,
    });
  };

  const toggleSide = (side) => {
    if (side === "top") {
      const v = !borderTop;
      setBorderTop(v);
      applyInstant({ borderTop: v });
    } else if (side === "right") {
      const v = !borderRight;
      setBorderRight(v);
      applyInstant({ borderRight: v });
    } else if (side === "bottom") {
      const v = !borderBottom;
      setBorderBottom(v);
      applyInstant({ borderBottom: v });
    } else if (side === "left") {
      const v = !borderLeft;
      setBorderLeft(v);
      applyInstant({ borderLeft: v });
    }
  };

  // drag pad
  const startPadPointer = (clientX, clientY) => {
    dragPadState.current = { startX: clientX, startY: clientY };
  };

  const startPadMouse = (e) => {
    e.preventDefault();
    startPadPointer(e.clientX, e.clientY);
    window.addEventListener("mousemove", onPadMove, { passive: false });
    window.addEventListener("mouseup", stopPadDrag);
  };

  const startPadTouch = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    startPadPointer(t.clientX, t.clientY);
    window.addEventListener("touchmove", onPadMove, { passive: false });
    window.addEventListener("touchend", stopPadDrag);
    window.addEventListener("touchcancel", stopPadDrag);
  };

  const onPadMove = (e) => {
    if (!dragPadState.current) return;
    e.preventDefault();
    const point = "touches" in e ? e.touches[0] : e;
    const dx = point.clientX - dragPadState.current.startX;
    const dy = point.clientY - dragPadState.current.startY;
    dragPadState.current.startX = point.clientX;
    dragPadState.current.startY = point.clientY;
    onVirtualDrag(dx, dy);
  };

  const stopPadDrag = () => {
    dragPadState.current = null;
    window.removeEventListener("mousemove", onPadMove);
    window.removeEventListener("mouseup", stopPadDrag);
    window.removeEventListener("touchmove", onPadMove);
    window.removeEventListener("touchend", stopPadDrag);
    window.removeEventListener("touchcancel", stopPadDrag);
  };

  const tabButtonClass = (id) =>
    "px-3 py-1 text-[11px] font-semibold border-b-2 " +
    (activeTab === id
      ? "border-indigo-500 text-black"
      : "border-transparent text-gray-500 hover:text-black");

  const editorModeClass = (id) =>
    "px-2 py-0.5 text-[10px] rounded border " +
    (editorMode === id
      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
      : "border-gray-300 text-gray-700 hover:bg-gray-50");

  return (
    <div className="fixed right-4 top-20 z-40 w-full max-w-xs rounded-lg border border-gray-300 bg-white text-xs text-black shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <div className="text-[11px] font-semibold">
          Cell R{cell.rowIdx} C{cell.colIdx}
        </div>
        <button
          onClick={onClose}
          className="rounded bg-gray-100 px-2 py-0.5 text-[11px] hover:bg-gray-200"
        >
          Close
        </button>
      </div>

      <div className="flex border-b border-gray-200 px-3">
        <button
          className={tabButtonClass("editor")}
          onClick={() => setActiveTab("editor")}
        >
          Editor
        </button>
        <button
          className={tabButtonClass("sorting")}
          onClick={() => setActiveTab("sorting")}
        >
          Sorting
        </button>
        <button
          className={tabButtonClass("mouse")}
          onClick={() => setActiveTab("mouse")}
        >
          Mouse
        </button>
      </div>

      <div className="p-3">
        {activeTab === "editor" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold">Editor</span>
              <div className="flex gap-1">
                <button
                  className={editorModeClass("text")}
                  onClick={() => setEditorMode("text")}
                >
                  Text
                </button>
                <button
                  className={editorModeClass("border")}
                  onClick={() => setEditorMode("border")}
                >
                  Border
                </button>
              </div>
            </div>

            {editorMode === "text" && (
              <div className="grid grid-cols-2 gap-3">
                {/* Text color */}
                <div className="flex items-center gap-2">
                  <span>Text</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => changeColor(e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded border border-gray-300"
                  />
                </div>

                {/* Background */}
                <div className="flex items-center gap-2">
                  <span>Background</span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => changeBg(e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded border border-gray-300"
                  />
                </div>

                {/* Align */}
                <div className="flex items-center gap-2">
                  <span>Align</span>
                  <select
                    value={align}
                    onChange={(e) => changeAlign(e.target.value)}
                    className="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                {/* Vertical align */}
                <div className="flex items-center gap-2">
                  <span>Vertical</span>
                  <select
                    value={valign}
                    onChange={(e) => changeValign(e.target.value)}
                    className="w-24 rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>

                {/* Font size */}
                <div className="col-span-2 flex items-center gap-2">
                  <span>Font size</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={decFont}
                      className="h-6 w-6 rounded border border-gray-300 text-center text-[11px] hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={6}
                      max={40}
                      value={fontSize}
                      onChange={(e) => changeFontSize(e.target.value)}
                      className="w-14 rounded border border-gray-300 px-1 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={incFont}
                      className="h-6 w-6 rounded border border-gray-300 text-center text-[11px] hover:bg-gray-100"
                    >
                      +
                    </button>
                    <span className="text-[10px] text-gray-500">px</span>
                  </div>
                </div>

                {/* Height */}
                <div className="flex items-center gap-2">
                  <span>Height</span>
                  <input
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => changeHeight(e.target.value)}
                    className="w-16 rounded border border-gray-300 px-1 py-1 text-xs"
                  />
                  <span>px</span>
                </div>

                {/* Width */}
                <div className="flex items-center gap-2">
                  <span>Width</span>
                  <input
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => changeWidth(e.target.value)}
                    className="w-16 rounded border border-gray-300 px-1 py-1 text-xs"
                  />
                  <span>px</span>
                </div>

                {/* Wrap */}
                <div className="col-span-2 flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-1 text-[11px]">
                    <input
                      type="checkbox"
                      checked={wrap}
                      onChange={toggleWrap}
                      className="h-3 w-3"
                    />
                    <span>Wrap text</span>
                  </label>
                  <span className="text-[10px] text-gray-500">
                    Off = single line.
                  </span>
                </div>
              </div>
            )}

            {editorMode === "border" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span>Color</span>
                  <input
                    type="color"
                    value={cellBorderColor}
                    onChange={(e) => changeCellBorderColor(e.target.value)}
                    className="h-7 w-10 cursor-pointer rounded border border-gray-300"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span>Style</span>
                  <select
                    value={cellBorderStyle}
                    onChange={(e) => changeCellBorderStyle(e.target.value)}
                    className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="solid">solid</option>
                    <option value="dashed">dashed</option>
                    <option value="dotted">dotted</option>
                    <option value="double">double</option>
                    <option value="groove">groove</option>
                    <option value="ridge">ridge</option>
                    <option value="inset">inset</option>
                    <option value="outset">outset</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span>Width</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={decBorderWidth}
                      className="h-6 w-6 rounded border border-gray-300 text-center text-[11px] hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={borderWidth}
                      onChange={(e) => changeBorderWidth(e.target.value)}
                      className="w-14 rounded border border-gray-300 px-1 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={incBorderWidth}
                      className="h-6 w-6 rounded border border-gray-300 text-center text-[11px] hover:bg-gray-100"
                    >
                      +
                    </button>
                    <span className="text-[10px] text-gray-500">px</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>Sides</span>
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setAllBorders(true)}
                        className="rounded border px-2 py-0.5 hover:bg-gray-100"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllBorders(false)}
                        className="rounded border px-2 py-0.5 hover:bg-gray-100"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => toggleSide("top")}
                      className={
                        "rounded border px-2 py-0.5 hover:bg-gray-100 " +
                        (borderTop ? "bg-slate-200" : "")
                      }
                    >
                      Top
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSide("right")}
                      className={
                        "rounded border px-2 py-0.5 hover:bg-gray-100 " +
                        (borderRight ? "bg-slate-200" : "")
                      }
                    >
                      Right
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSide("bottom")}
                      className={
                        "rounded border px-2 py-0.5 hover:bg-gray-100 " +
                        (borderBottom ? "bg-slate-200" : "")
                      }
                    >
                      Bottom
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSide("left")}
                      className={
                        "rounded border px-2 py-0.5 hover:bg-gray-100 " +
                        (borderLeft ? "bg-slate-200" : "")
                      }
                    >
                      Left
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "sorting" && (
          <div className="space-y-3">
            <div className="text-[11px] font-semibold">Sort workspace rows</div>
            <div className="flex items-center gap-2">
              <span>Column</span>
              <select
                value={sortColumn}
                onChange={(e) => setSortColumn(e.target.value)}
                className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs"
              >
                {headers?.map((h, idx) => (
                  <option key={idx} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span>Mode</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs"
              >
                <option value="date-asc">Date old → new</option>
                <option value="date-desc">Date new → old</option>
                <option value="text-asc">Text A → Z</option>
                <option value="text-desc">Text Z → A</option>
              </select>
            </div>
            <button
              onClick={() => sortRows(sortColumn, sortMode)}
              className="w-full rounded bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700"
            >
              Apply sort
            </button>
          </div>
        )}

        {activeTab === "mouse" && (
          <div className="space-y-3">
            <div className="text-[11px] font-semibold">
              Mouse / touch controls
            </div>
            <p className="text-[11px] text-gray-700">
              Tap a side handle in the table once to arm it (it becomes red),
              then drag on mobile or desktop. You can also use this drag pad.
            </p>

            <button
              onClick={onToggleDragMode}
              className={
                "w-full rounded px-3 py-1.5 text-[11px] font-semibold border " +
                (dragMode
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-gray-400 bg-white text-gray-700")
              }
            >
              Drag mode: {dragMode ? "ON" : "OFF"}
            </button>

            <div
              onMouseDown={startPadMouse}
              onTouchStart={startPadTouch}
              className="mt-2 flex h-20 select-none items-center justify-center rounded border border-gray-300 bg-gray-100 bg-[radial-gradient(circle_at_center,#c7d2fe,#e5e7eb)] text-center text-[11px] text-gray-700"
            >
              Drag inside this area like a mouse to resize the selected cell
              horizontally or vertically.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
