import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import { PluginOption, defineConfig } from "vite";
import project from "./project.json";
import { initVite } from "@biqpod/app/env";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(async ({ mode }) => {
  await initVite();
  const isElectron = mode === "electron";
  const isMobile = mode === "mobile";
  const plugins: PluginOption[] = [
    react({}),
    legacy(),
    isElectron &&
      electron({
        // Main process entry file of the Electron App.
        entry: "electron/index.ts",
        // If this `onstart` is passed, Electron App will not start automatically.
        // However, you can start Electroo App via `startup` function.
        onstart(args) {
          args.startup();
        },
      }),
  ];
  const baseConfig = {
    define: {
      global: "globalThis",
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime"],
    },
    plugins,
    clearScreen: false,
  };
  if (isMobile) {
    return {
      ...baseConfig,
      build: {
        rollupOptions: {
          input: {
            index: "index.html",
          },
        },
      },
      server: {
        host: true,
        port: project.development.mobile.port,
      },
      plugins: [
        ...baseConfig.plugins,
        VitePWA({
          registerType: "autoUpdate",
          manifest: {
            name: project.appName,
            short_name: project.appName,
            description: "SnapBuy - AI-powered e-commerce platform",
            theme_color: "#ffffff",
            background_color: "#ffffff",
            display: "standalone",
            orientation: "portrait",
            start_url: "/",
          },
          workbox: {
            globPatterns: ["**/*.{ico,png,svg,woff,woff2}"],
            maximumFileSizeToCacheInBytes: 1048576 * 12,
          },
        }),
      ],
    };
  } else {
    return {
      ...baseConfig,
      build: {
        rollupOptions: {
          input: {
            index: "index.html",
          },
        },
      },
      server: {
        port: project.development.port,
      },
    };
  }
});
