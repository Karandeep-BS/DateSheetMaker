"use client";
import { useState, useEffect } from "react";

export default function Uplode({ onDataLoaded }) { // Add callback prop
  const [popup, setPopup] = useState(null);
  const [message, setMessage] = useState("");

  const showPopup = (type, msg = "") => {
    setPopup(type);
    setMessage(msg);
    setTimeout(() => setPopup(null), 3000);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isValidFile = fileName.endsWith(".pdf") || 
                       fileName.endsWith(".xlsx") || 
                       fileName.endsWith(".xls");

    if (!isValidFile) {
      showPopup("error", "Only PDF and Excel files are supported");
      return;
    }

    const formData = new FormData();
    formData.append("excelFile", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok) {
        showPopup("success", data.message);
        
        // Send data to parent (workspace)
        if (onDataLoaded && data.rows) {
          onDataLoaded({
            headers: data.headers,
            rows: data.rows,
            fileName: data.fileName
          });
        }
      } else {
        showPopup("error", data.error || "Upload failed");
      }
    } catch (error) {
      showPopup("error", "Upload failed: " + error.message);
    }

    // Reset input
    e.target.value = "";
  };

  return (
    <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
      <label className="block text-sm font-semibold mb-3 text-gray-800">
        📁 Upload PDF/Excel
      </label>
      <input
        type="file"
        accept=".pdf,.xlsx,.xls"
        onChange={handleUpload}
        className="block w-full text-sm text-gray-500
                   file:mr-4 file:py-2 file:px-4 
                   file:rounded-full file:border-0 
                   file:text-sm file:font-semibold 
                   file:bg-gradient-to-r file:from-blue-500 file:to-blue-600
                   file:text-white hover:file:from-blue-600 hover:file:to-blue-700
                   cursor-pointer"
      />
      {popup && (
        <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${
          popup === "success"
            ? "bg-green-100 border border-green-200 text-green-800"
            : "bg-red-100 border border-red-200 text-red-800"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
