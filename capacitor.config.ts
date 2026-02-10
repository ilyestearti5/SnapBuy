import biqpodConfig from "./project.json";
import type { CapacitorConfig } from "@capacitor/cli";
import os from "os";

// Toggle between dev mode (Vite dev server) and production (dist folder)
const isDev = process.env.NODE_ENV !== "production";
const ip4 = Object.values(os.networkInterfaces())
  .flat()
  .find(
    (details) => details?.family === "IPv4" && details?.address !== "127.0.0.1",
  )?.address;

const config: CapacitorConfig = {
  appId: `com.${biqpodConfig.appId}.app`,
  appName: biqpodConfig.appName,
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
      androidSplashResourceName: "splash",
      iosSplashResourceName: "Splash",
    },
    // Keyboard plugin configuration for proper input handling
    Keyboard: {
      resize: "body", // Resize the entire body when keyboard opens
      style: "dark", // Match app theme
      resizeOnFullScreen: true, // Handle fullscreen inputs properly
    },
  },
};

// Development mode: Use Vite dev server for hot reload
if (isDev && ip4) {
  const port = biqpodConfig.development.mobile.port;
  config.server = {
    url: `http://${ip4}:${port}/`,
    cleartext: true, // Allow HTTP in development
    androidScheme: "snapbuy",
    iosScheme: "snapbuy",
  };
  console.log(
    `🚀 Development mode: Using Vite dev server at http://${ip4}:${port}/`,
  );
} else {
  // Production mode: Use production URL
  config.server = {
    url: biqpodConfig.production.url,
    androidScheme: "snapbuy",
    iosScheme: "snapbuy",
  };
  console.log(
    `📦 Production mode: Using production URL ${biqpodConfig.production.url}`,
  );
}

export default config;
