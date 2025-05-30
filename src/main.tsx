import "./index.css";
import "@biqpod/app/ui/style.css";
import "./server";
import { startApplication } from "@biqpod/app/ui/app";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";
import { settingHooks } from "@biqpod/app/ui/hooks";
import { settings } from "./server";
import { translations } from "./utils";
startApplication(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  {
    isDev: import.meta.env.DEV,
    onPrepare() {
      settingHooks.upsert(settings);
      return {
        translations,
        settings,
      };
    },
  }
);
