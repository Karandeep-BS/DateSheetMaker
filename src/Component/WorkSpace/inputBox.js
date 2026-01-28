"use client";
import { useState } from "react";

export default function Input({ onSearch, onColumnChange }) {
  const [value, setValue] = useState("");
  const [column, setColumn] = useState("Sub Code");

  const columns = [
    "All",
    "Date",
    "Session",
    "Sem",
    "Sub Code",
    "Sub Title",
    "P_ ID",
    "Branch Code",
    "Course/Branch",
    "Type",
    "Remarks",
  ];

  const handleColumnChange = (e) => {
    const newColumn = e.target.value;
    setColumn(newColumn);
    if (onColumnChange) onColumnChange(newColumn);
  };

  const handleSearch = () => {
    if (!value.trim()) {
      alert("Please type something to search");
      return;
    }
    onSearch(value, column);
  };

  return (
    <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center">
      <select
        value={column}
        onChange={handleColumnChange}
        className="rounded border border-gray-300 px-2 py-1 text-xs"
      >
        {columns.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type to search"
        className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
      />

      <button
        type="button"
        onClick={handleSearch}
        className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
      >
        Search & add to workspace
      </button>
    </div>
  );
}
