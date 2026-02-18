import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize IndexedDB early - before React mounts
// This ensures the DB connection is ready when components need it
import { torahDB } from "@/utils/torahDB";
torahDB.init().catch(() => {
  // Graceful fallback - app works without IndexedDB, just slower
  console.warn('IndexedDB not available, data will load from bundle each time');
});

createRoot(document.getElementById("root")!).render(<App />);
