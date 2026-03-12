import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { initializeSampleData } from "./lib/initializeData";

// Initialize sample data for demo
initializeSampleData();

createRoot(document.getElementById("root")).render(<App />);