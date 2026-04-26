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

createRoot(document.getElementById("root")).render(<App />);