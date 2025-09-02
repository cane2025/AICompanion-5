import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Feature flag: default disabled; enable if env says or if window flag set
(window as any).__UI_CAREPLAN_COMPACT__ =
  (typeof window !== "undefined" && (window as any).__UI_CAREPLAN_COMPACT__) ??
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_UI_CAREPLAN_COMPACT === "1" ? 1 : 0);

createRoot(document.getElementById("root")!).render(<App />);
