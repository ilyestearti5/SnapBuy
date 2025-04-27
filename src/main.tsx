import "./index.css";
import "biqpod/ui/biqpod.css";
import "./server";
import { startApplication } from "biqpod/ui/app";
import { App } from "./App";
import { BrowserRouter } from "react-router-dom";
startApplication(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  {
    onPrepare() {},
    isDev: import.meta.env.DEV,
  }
);
