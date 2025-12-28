import { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  SceneLoader,
  Tools,
  Mesh,
  Color4,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import JSZip from "jszip";
type ZipModelViewerProps = {
  zipFile: File;
};
export const ZipModelViewer: React.FC<ZipModelViewerProps> = ({ zipFile }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!zipFile || !canvasRef.current) return;
    // Babylon setup
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 2.3,
      5,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    new HemisphericLight("light", new Vector3(1, 1, 0), scene);
    engine.runRenderLoop(() => scene.render());
    const callback = () => engine.resize();
    addEventListener("resize", callback);
    loadZipModel(scene, zipFile);
    return () => {
      removeEventListener("resize", callback);
      engine.dispose();
    };
  }, [zipFile]);
  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100vh", touchAction: "none" }}
    />
  );
};
async function loadZipModel(scene: Scene, zipFile: File) {
  const zip = await JSZip.loadAsync(zipFile);
  const fileMap: Record<string, string> = {};
  let modelPath: string | null = null;
  // Extract ZIP → Blob URLs
  for (const path in zip.files) {
    const entry = zip.files[path];
    if (entry.dir) continue;
    const blob = await entry.async("blob");
    fileMap[path] = URL.createObjectURL(blob);
    if (/\.(glb|gltf|fbx)$/i.test(path)) {
      modelPath = path;
    }
  }
  if (!modelPath) {
    console.error("❌ No 3D model found in zip");
    return;
  }
  // Intercept Babylon file loading (Type-safe workaround)
  const originalLoadFile = Tools.LoadFile;
  (Tools.LoadFile as any) = function (
    url: string,
    onSuccess: (data: string | ArrayBuffer) => void,
    onProgress?: (data: any) => void,
    offlineProvider?: any,
    useArrayBuffer?: boolean,
    onError?: (request?: any, exception?: any) => void
  ) {
    const cleanPath = decodeURIComponent(url.replace("zip://", ""));
    if (fileMap[cleanPath]) {
      return {} as any; // Babylon expects IFileRequest
    }
    return originalLoadFile(
      url,
      onSuccess,
      onProgress,
      offlineProvider,
      useArrayBuffer,
      onError
    );
  };
  // Load model
  SceneLoader.Append(
    "zip://",
    modelPath,
    scene,
    () => {
      centerAndScale(scene);
      console.log("✅ Model loaded");
    },
    undefined,
    (_, msg) => console.error("❌ Load error:", msg)
  );
}
// Auto center & scale
function centerAndScale(scene: Scene) {
  const meshes = scene.meshes.filter(
    (m): m is Mesh => m instanceof Mesh && m.getTotalVertices() > 0
  );
  if (!meshes.length) return;
  const root = Mesh.MergeMeshes(meshes, true, true, undefined, false);
  if (!root) return;
  const boundingInfo = root.getBoundingInfo();
  const size = boundingInfo.boundingBox.extendSizeWorld.length();
  root.scaling.scaleInPlace(1 / size);
  root.position = Vector3.Zero();
}
type ModelViewerProps = {
  url: string; // blob:// or http://
  type?: string; // glb | gltf | fbx | zip
};
export function ModelViewer({ url, type }: ModelViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);
    // Camera
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 2.5,
      5,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    // Zoom control
    camera.lowerRadiusLimit = 4;
    camera.upperRadiusLimit = 7;
    camera.wheelDeltaPercentage = 0.01;
    // Light
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.9;
    const loadModel = async () => {
      try {
        // 🧠 ZIP HANDLING
        if (type === "zip") {
          const res = await fetch(url);
          const zipData = await res.arrayBuffer();
          const zip = await JSZip.loadAsync(zipData);
          // Find first supported model
          const modelEntry = Object.values(zip.files).find((f) =>
            /\.(glb|gltf|fbx|obj|stl)$/i.test(f.name)
          );
          if (!modelEntry) {
            throw new Error("No supported 3D model found in ZIP");
          }
          const extension = "." + modelEntry.name.split(".").pop()!;
          const blob = new Blob([await modelEntry.async("arraybuffer")]);
          const blobUrl = URL.createObjectURL(blob);
          await SceneLoader.AppendAsync(
            "",
            blobUrl,
            scene,
            undefined,
            extension
          );
          return;
        }
        // 🧱 Normal file loading
        const pluginExtension = type ? `.${type}` : undefined;
        await SceneLoader.AppendAsync(
          "",
          url,
          scene,
          undefined,
          pluginExtension
        );
      } catch (err) {
        console.error("Model load error:", err);
      }
    };
    loadModel();
    engine.runRenderLoop(() => scene.render());
    const resize = () => engine.resize();
    window.addEventListener("resize", resize);
    return () => {
      engine.dispose();
      window.removeEventListener("resize", resize);
    };
  }, [url, type]);
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
