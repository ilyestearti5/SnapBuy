import "./index.css";
import "@biqpod/app/ui/style.css";
import "./server";
import { startApplication } from "@biqpod/app/ui/app";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";
startApplication(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  {
    isDev: import.meta.env.DEV,
  }
);
