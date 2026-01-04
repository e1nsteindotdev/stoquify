import { spawn } from 'node:child_process'
import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite'
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 60_001,
  },
  worker: { format: 'es' },
  plugins: [
    tanstackRouter({ autoCodeSplitting: true }),
    tailwindcss(),
    viteReact(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Stoquify Dashboard",
        short_name: "Stoquify",
        description: "Premium Inventory and POS Dashboard",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "logo192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "logo512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
    livestoreDevtoolsPlugin({ schemaPath: './src/livestore/schema/index.ts' }),
    // Running `wrangler dev` as part of `vite dev` needed for `@livestore/sync-cf`
    // {
    //   name: 'wrangler-dev',
    //   configureServer: async (server) => {
    //     const wrangler = spawn('./node_modules/.bin/wrangler', ['dev', '--port', '8780'], {
    //       stdio: ['ignore', 'inherit', 'inherit'],
    //     })
    //
    //     const shutdown = () => {
    //       if (wrangler.killed === false) {
    //         wrangler.kill()
    //       }
    //       process.exit(0)
    //     }
    //
    //     server.httpServer?.on('close', shutdown)
    //     process.on('SIGTERM', shutdown)
    //     process.on('SIGINT', shutdown)
    //
    //     wrangler.on('exit', (code) => console.error(`wrangler dev exited with code ${code}`))
    //   }
    // }
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
