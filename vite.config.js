import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  appType: "mpa",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: Number(process.env.PORT || 4173),
    strictPort: true,
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    rolldownOptions: {
      output: {
        entryFileNames: "js/[name]-[hash].js",
        chunkFileNames: "js/[name]-[hash].js",
        assetFileNames(asset) {
          const name = asset.names?.[0] || asset.name || "";
          if (/\.css$/i.test(name)) return "css/[name]-[hash][extname]";
          if (/\.(woff2?|ttf|otf)$/i.test(name)) {
            return "fonts/[name]-[hash][extname]";
          }
          if (/\.(webp|avif|png|jpe?g|svg|gif|ico)$/i.test(name)) {
            return "images/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
