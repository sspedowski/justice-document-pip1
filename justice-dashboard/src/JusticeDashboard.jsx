import React, { useEffect } from "react";

// Minimal React wrapper for the existing Justice Dashboard logic.
// This component intentionally keeps JS integration light — it mounts the legacy
// global behaviors (if any) or can be extended to render a new React UI.

export default function JusticeDashboard() {
  useEffect(() => {
    // If the legacy script attaches a global initializer, call it.
    if (typeof window.JusticeDashboard !== "undefined" && typeof window.JusticeDashboard.EventHandlers?.init === "function") {
      try {
        window.JusticeDashboard.DOMElements.init();
        window.JusticeDashboard.EventHandlers.init();
      } catch (e) {
        // silent fail — app can still render
        // eslint-disable-next-line no-console
        console.warn("Legacy JusticeDashboard init failed:", e);
      }
    }
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Justice Dashboard (React wrapper)</h2>
      <p className="text-sm text-gray-600">This page uses the legacy dashboard integration. Use the UI controls already present in the DOM.</p>
    </div>
  );
}
