import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({ 
      filename: 'reports/bundle-analyze.html', 
      template: 'treemap', 
      gzipSize: true, 
      brotliSize: true 
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),

    },
  },
  root: "./client",
  publicDir: "./client/public",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  css: {
    postcss: "./client/postcss.config.cjs",
  },
  server: {
    host: "127.0.0.1",
    port: 5175,
    strictPort: true,
    hmr: {
      host: "127.0.0.1",
      port: 5175,
      protocol: "ws",
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
