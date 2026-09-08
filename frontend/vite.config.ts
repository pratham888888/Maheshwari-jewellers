import path from "node:path";
import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiProxyTarget = (process.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      // lucide 1.x dropped brand logos; src/lib/lucide-react.tsx restores them on top of the real package.
      { find: /^lucide-react$/, replacement: path.resolve(__dirname, "./src/lib/lucide-react.tsx") },
      { find: "lucide-react-upstream", replacement: path.resolve(__dirname, "./node_modules/lucide-react") },
    ],
  },
  // Every shipped dep, pre-bundled up front. Vite discovers deps lazily, so the first
  // import outside the initial graph would trigger a re-optimize + reload mid-session.
  optimizeDeps: {
    include: [
      "@base-ui/react/button",
      "@base-ui/react/checkbox",
      "@base-ui/react/dialog",
      "@base-ui/react/input",
      "@base-ui/react/menu",
      "@base-ui/react/merge-props",
      "@base-ui/react/popover",
      "@base-ui/react/select",
      "@base-ui/react/tabs",
      "@base-ui/react/use-render",
      "@tanstack/react-query",
      "class-variance-authority",
      "clsx",
      "date-fns",
      "@icons-pack/react-simple-icons",
      "lucide-react-upstream",
      "motion/react",
      "next-themes",
      "react",
      "react-day-picker",
      "react-dom/client",
      "react-is",
      "react-router-dom",
      "recharts",
      "sonner",
      "tailwind-merge",
    ],
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Used when VITE_API_URL is unset (relative /api calls). When VITE_API_URL is set,
      // the browser talks to the backend directly and CORS applies instead.
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
} satisfies UserConfig);
