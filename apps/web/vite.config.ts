import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

const basePath = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  server: {
    host: true, // expose on 0.0.0.0 for local network access
    port: 5173
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Cookies & Coquillettes",
        short_name: "C&C",
        description: "Capture, organise et cuisine tes recettes facilement.",
        theme_color: "#1f4f46",
        background_color: "#f8f4ec",
        display: "standalone",
        start_url: ".",
        scope: ".",
        lang: "fr",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml"
          }
        ],
        share_target: {
          action: "import",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            title: "title",
            text: "text",
            url: "url",
            files: [
              {
                name: "files",
                accept: ["image/*", "text/plain"]
              }
            ]
          }
        }
      }
    })
  ]
});
