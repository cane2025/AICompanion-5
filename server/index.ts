import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { devRoutes } from "./routes/dev";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// dev API
app.use("/api", devRoutes);

// Serve static files from dist/public (built frontend)
app.use(express.static(path.join(__dirname, "../dist/public")));

// Serve all other routes to index.html (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/public/index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("[express] serving on port", PORT));
