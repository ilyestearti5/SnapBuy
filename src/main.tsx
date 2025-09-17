import "./index.css";
import "@biqpod/app/ui/style.css";
import { startApplication } from "@biqpod/app/ui/app";
import {
  ColorIds,
  setLangs,
  setLightColor,
  settingHooks,
} from "@biqpod/app/ui/hooks";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";
import { settings } from "./server";
import { translations } from "./translations";
// Add debug tools in development
startApplication(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  {
    isDev: import.meta.env.DEV,
    onPrepare() {
      settingHooks.upsert(settings);
      setLangs(translations);
      setLightColor("primary.background" as ColorIds, "#fff");
      setLightColor("secondary.background" as ColorIds, "#fff");
      setLightColor("borders" as ColorIds, "#dedede");
      return {
        settings,
        commands: [
          {
            commandId: "open-ai-assistance/send",
            private: true,
            commands: [
              {
                type: "action/exec",
                payload: ["interpretCommand"],
              },
            ],
            keys: [
              {
                value: "enter",
                when: "focused === 'ai-input'",
                only: true,
                type: "down",
                preventDefault: true,
              },
            ],
          },
        ],
      };
    },
  }
);
