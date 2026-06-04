import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";
import { createHtmlPlugin } from "vite-plugin-html";
import copy from "rollup-plugin-copy";

export default defineConfig(({ mode }) => {
  const envVars = loadEnv(mode, `../`);

  return {
    server: {
      port: Number(envVars.VITE_APP_PORT || 3002),
      open: true,
    },
    envDir: "../",
    base: "./",
    resolve: {
      alias: [
        {
          find: /^firebase(?:.*?)$/,
          replacement: path.resolve(__dirname, "./dummy.ts"),
        },
        {
          find: /^socket\.io-client$/,
          replacement: path.resolve(__dirname, "./dummy.ts"),
        },
        {
          find: /^@sentry\/browser$/,
          replacement: path.resolve(__dirname, "./dummy.ts"),
        },
        {
          find: /^@excalidraw\/common$/,
          replacement: path.resolve(
            __dirname,
            "../packages/common/src/index.ts",
          ),
        },
        {
          find: /^@excalidraw\/common\/(.*?)/,
          replacement: path.resolve(__dirname, "../packages/common/src/$1"),
        },
        {
          find: /^@excalidraw\/element$/,
          replacement: path.resolve(
            __dirname,
            "../packages/element/src/index.ts",
          ),
        },
        {
          find: /^@excalidraw\/element\/(.*?)/,
          replacement: path.resolve(__dirname, "../packages/element/src/$1"),
        },
        {
          find: /^@excalidraw\/excalidraw$/,
          replacement: path.resolve(
            __dirname,
            "../packages/excalidraw/index.tsx",
          ),
        },
        {
          find: /^@excalidraw\/excalidraw\/(.*?)/,
          replacement: path.resolve(__dirname, "../packages/excalidraw/$1"),
        },
        {
          find: /^@excalidraw\/math$/,
          replacement: path.resolve(__dirname, "../packages/math/src/index.ts"),
        },
        {
          find: /^@excalidraw\/math\/(.*?)/,
          replacement: path.resolve(__dirname, "../packages/math/src/$1"),
        },
        {
          find: /^@excalidraw\/utils$/,
          replacement: path.resolve(
            __dirname,
            "../packages/utils/src/index.ts",
          ),
        },
        {
          find: /^@excalidraw\/utils\/(.*?)/,
          replacement: path.resolve(__dirname, "../packages/utils/src/$1"),
        },
        {
          find: /^@excalidraw\/fractional-indexing$/,
          replacement: path.resolve(
            __dirname,
            "../packages/fractional-indexing/src/index.ts",
          ),
        },
      ],
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          assetFileNames(chunkInfo) {
            if (chunkInfo?.name?.endsWith(".woff2")) {
              const family = chunkInfo.name.split("-")[0];
              return `fonts/${family}/[name][extname]`;
            }

            return "assets/[name]-[hash][extname]";
          },
          // Keep locale chunks separate for caching
          manualChunks(id) {
            if (
              id.includes("packages/excalidraw/locales") &&
              id.match(/en.json|percentages.json/) === null
            ) {
              const index = id.indexOf("locales/");
              return `locales/${id.substring(index + 8)}`;
            }

            if (id.includes("@excalidraw/mermaid-to-excalidraw")) {
              return "mermaid-to-excalidraw";
            }

            if (id.includes("@codemirror/") || id.includes("@lezer/")) {
              return "codemirror.chunk";
            }
          },
        },
        plugins: [
          copy({
            targets: [
              // Copy manifest.json to dist
              { src: "manifest.json", dest: "dist" },
              // Copy icons from public/
              { src: "../public/favicon-16x16.png", dest: "dist/icons" },
              { src: "../public/favicon-32x32.png", dest: "dist/icons" },
              {
                src: "../public/android-chrome-192x192.png",
                dest: "dist/icons",
              },
              {
                src: "../public/android-chrome-512x512.png",
                dest: "dist/icons",
              },
            ],
            hook: "writeBundle",
          }),
        ],
      },
      sourcemap: false,
      assetsInlineLimit: 0,
    },
    plugins: [
      react(),
      svgrPlugin(),
      createHtmlPlugin({
        minify: true,
      }),
    ],
    publicDir: "../public",
  };
});
