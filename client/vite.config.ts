// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/auth': 'http://127.0.0.1:3000',
      '/tickets': 'http://127.0.0.1:3000',
      '/admin': 'http://127.0.0.1:3000',
      '/staff': {
        target: 'http://127.0.0.1:3000',
        bypass: (req) => {
          // If the request is a browser navigation (asking for HTML), don't proxy it!
          // Return the SPA index.html instead.
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html';
          }
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/tests/setup.ts",
    include: ["src/tests/**/*.test.tsx"],
  },
});