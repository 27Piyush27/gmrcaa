import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import localPaymentPlugin from "./src/lib/localPaymentPlugin";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  plugins: [
    react(),
    localPaymentPlugin(),   // Handles /api/create-razorpay-order & /api/verify-razorpay-payment
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force a single React instance to prevent "Invalid hook call" in dev mode
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    // Modern output — latest syntax, less polyfill = smaller bundles
    target: "esnext",
    // Strip console.log/warn in prod bundles to avoid data leaks
    // console.error is kept for error tracking
    minify: "esbuild",
    // Minify CSS aggressively
    cssMinify: "esbuild",
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,
    // Split vendor code into separate cacheable chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — changes rarely, cached long-term
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI framework
          "vendor-ui": ["framer-motion", "@tanstack/react-query"],
          // Heavy libs — loaded only when their pages are visited
          "vendor-charts": ["recharts"],
          // Supabase client
          "vendor-supabase": ["@supabase/supabase-js"],
          // Icon library — large, used everywhere, cache separately
          "vendor-icons": ["lucide-react"],
          // Date utilities — moderately heavy, used across many pages
          "vendor-date": ["date-fns"],
          // PDF generation — only used on invoice/export pages
          "vendor-pdf": ["jspdf", "jspdf-autotable"],
          // Markdown renderer — only used in chatbot/blog
          "vendor-markdown": ["react-markdown"],
        },
      },
    },
    // Increase chunk warning threshold (we're code-splitting intentionally)
    chunkSizeWarningLimit: 600,
    // Generate source maps for debugging but exclude from deployment
    sourcemap: false,
  },
  esbuild: {
    // Drop console.log/warn in production builds but keep console.error for debugging
    drop: process.env.NODE_ENV === "production" ? ["debugger"] : [],
    pure: process.env.NODE_ENV === "production" ? ["console.log", "console.warn"] : [],
  },
});
