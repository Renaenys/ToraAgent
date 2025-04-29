"use client";

import { useEffect } from "react";

export default function Modal({ children, onClose }) {
  // Close on Esc
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#2e2e3e",
          color: "#e5e5e5",
          borderRadius: "8px",
          padding: "1.5rem",
          minWidth: "320px",
          maxWidth: "90%",
          boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
