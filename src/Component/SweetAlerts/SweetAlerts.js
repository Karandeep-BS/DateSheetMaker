"use client";

import Swal from "sweetalert2";

const TailwindAlert = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    popup:
      "rounded-xl p-6 bg-white shadow-xl border border-slate-200 max-w-sm",
    title: "text-base font-semibold text-slate-900",
    htmlContainer: "mt-2 text-sm text-slate-700",
    confirmButton:
      "inline-flex items-center justify-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
    cancelButton:
      "inline-flex items-center justify-center rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2",
  },
});

export const errorAlert = (text = "Something went wrong") =>
  TailwindAlert.fire({
    icon: "error",
    title: "Error",
    text,
  });

export const successAlert = (text = "Done successfully") =>
  TailwindAlert.fire({
    icon: "success",
    title: "Success",
    text,
  });

export const infoAlert = (text = "Information") =>
  TailwindAlert.fire({
    icon: "info",
    title: "Info",
    text,
  });

  export const confirmDownloadAlert = () =>
  TailwindAlert.fire({
    icon: "question",
    title: "Download file?",
    text: "Do you want to download the workspace as a file?",
    showCancelButton: true,
    confirmButtonText: "Yes, download",
    cancelButtonText: "Cancel",
  });



  export const confirmApplyAllAlert = () =>
  TailwindAlert.fire({
    icon: "warning",
    title: "Apply to all cells?",
    text: "This will update every cell in the workspace (except headers) with the current formatting.",
    showCancelButton: true,
    confirmButtonText: "Yes, apply",
    cancelButtonText: "Cancel",
  });

