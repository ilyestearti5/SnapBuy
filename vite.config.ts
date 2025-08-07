import legacy from "@vitejs/plugin-legacy";
import path from "node:path";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import { PluginOption, defineConfig } from "vite";
import project from "./project.json";
import { initVite } from "@biqpod/app/env";
export default defineConfig(async ({ mode }) => {
  await initVite();
  const isElectron = mode === "electron";
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
  return {
    resolve: {
      alias: {
        "@": path.resolve("./src"),
        Components: path.resolve("./src/Components"),
        database: path.resolve("./src/data/db"),
        models: path.resolve("./src/data"),
        hooks: path.resolve("./src/hooks"),
        api: path.resolve("./src/apis"),
        utils: path.resolve("./utils"),
        main: path.resolve("./"),
        assets: path.resolve("./src/assets"),
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: "index.html",
        },
        external: ["@biqpod/app"],
      },
    },
    define: {
      global: "globalThis",
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime"],
    },
    plugins,
    server: {
      port: project.development.port,
    },
    clearScreen: false,
  };
});
