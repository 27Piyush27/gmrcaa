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
    },
  },
});
