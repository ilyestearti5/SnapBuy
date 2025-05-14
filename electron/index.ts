import {
  createMainWindow,
  setUpAppEnv,
  startApplicationForDesktop,
} from "@biqpod/app/electron";
import project from "../project.json";
setUpAppEnv({
  devUrl: `http://localhost:${project.development.port}`,
  prodUrl: project.production.url,
});
export var mainWindow: Electron.BrowserWindow | null = null;
startApplicationForDesktop(async () => {
  mainWindow = await createMainWindow();
});
