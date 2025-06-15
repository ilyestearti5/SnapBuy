import biqpodConfig from "./project.json";
import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: `com.${biqpodConfig.appId}.app`,
  appName: biqpodConfig.appName,
  server: {
    url: "https://snapbuy.biqpod.com",
  },
};
export default config;
