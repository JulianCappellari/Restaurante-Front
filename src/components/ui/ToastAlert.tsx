"use client";
import React, { useEffect } from "react";

interface ToastAlertProps {
  open: boolean;
  message: string;
  type?: "success" | "error";
  onClose: () => void;
  duration?: number;
}

const ToastAlert: React.FC<ToastAlertProps> = ({ open, message, type = "success", onClose, duration = 2500 }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!open) return null;
  return (
    <div className={`inline-flex px-4 py-2 rounded-full shadow text-white items-center gap-2 transition-all animate-fade-in ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
      {type === "success" ? (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

export default ToastAlert;
