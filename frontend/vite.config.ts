import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 5137,
    allowedHosts: ["*"],
  },
  preview: {
    host: true,
    allowedHosts: [
      "notes-taker-demo-application.onrender.com",
      ".onrender.com",
      "localhost",
      "127.0.0.1"
    ],
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
