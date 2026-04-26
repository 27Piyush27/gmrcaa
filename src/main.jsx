import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { initializeSampleData } from "./lib/initializeData";

// Defer sample data init — don't block initial render
if ("requestIdleCallback" in window) {
  requestIdleCallback(initializeSampleData, { timeout: 2000 });
} else {
  setTimeout(initializeSampleData, 100);
}

const root = document.getElementById("root");

try {
  createRoot(root).render(<App />);
} catch (err) {
  console.error("[App] Fatal error during initialization:", err);
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;padding:2rem;text-align:center">
      <div>
        <h1 style="font-size:1.5rem;margin-bottom:0.5rem">Something went wrong</h1>
        <p style="color:#666">The application failed to load. Please try refreshing the page.</p>
        <pre style="margin-top:1rem;text-align:left;background:#f5f5f5;padding:1rem;border-radius:8px;font-size:0.75rem;max-width:600px;overflow:auto">${err?.message || err}</pre>
      </div>
    </div>
  `;
}