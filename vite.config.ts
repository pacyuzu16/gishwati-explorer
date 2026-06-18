import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // relative base so it works on GitHub Pages project sites
  base: "./",
  plugins: [tailwindcss()],
  build: {
    chunkSizeWarningLimit: 900, // maplibre is one large lib; already in its own chunk
    rollupOptions: {
      output: {
        // split the big libraries into their own cacheable chunks
        manualChunks: {
          maplibre: ["maplibre-gl"],
          charts: ["chart.js"],
        },
      },
    },
  },
});
