import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Feature flag: AKTIVERAD för att testa den nya kompakta UI:n
(window as any).__UI_CAREPLAN_COMPACT__ = 1;

createRoot(document.getElementById("root")!).render(<App />);
