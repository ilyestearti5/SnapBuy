import React, { useState, useEffect } from "react";
import { Button, Card } from "@biqpod/app/ui/components";

export const ThreeJSDiagnostic: React.FC = () => {
  const [threeStatus, setThreeStatus] = useState<{
    core: boolean;
    gltfLoader: boolean;
    orbitControls: boolean;
    error?: string;
  }>({
    core: false,
    gltfLoader: false,
    orbitControls: false,
  });

  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const result = {
      core: false,
      gltfLoader: false,
      orbitControls: false,
      error: undefined as string | undefined,
    };

    try {
      // Test Three.js core
      const THREE = await import("three");
      result.core = !!THREE && !!THREE.Scene;

      if (result.core) {
        // Test GLTFLoader
        try {
          const { GLTFLoader } = await import(
            "three/examples/jsm/loaders/GLTFLoader.js"
          );
          result.gltfLoader = !!GLTFLoader;
        } catch (gltfError) {
          console.error("GLTFLoader error:", gltfError);
          result.error = `GLTFLoader: ${gltfError}`;
        }

        // Test OrbitControls
        try {
          const { OrbitControls } = await import(
            "three/examples/jsm/controls/OrbitControls.js"
          );
          result.orbitControls = !!OrbitControls;
        } catch (controlsError) {
          console.error("OrbitControls error:", controlsError);
          result.error = result.error || `OrbitControls: ${controlsError}`;
        }
      }
    } catch (coreError) {
      console.error("Three.js core error:", coreError);
      result.error = `Three.js core: ${coreError}`;
    }

    setThreeStatus(result);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusColor = (status: boolean) =>
    status ? "text-green-600" : "text-red-600";
  const getStatusText = (status: boolean) => (status ? "✓ OK" : "✗ FAIL");

  return (
    <Card className="mx-auto p-4 max-w-lg">
      <h2 className="mb-4 font-bold text-lg">Three.js Diagnostic</h2>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>Three.js Core:</span>
          <span className={getStatusColor(threeStatus.core)}>
            {getStatusText(threeStatus.core)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>GLTFLoader:</span>
          <span className={getStatusColor(threeStatus.gltfLoader)}>
            {getStatusText(threeStatus.gltfLoader)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>OrbitControls:</span>
          <span className={getStatusColor(threeStatus.orbitControls)}>
            {getStatusText(threeStatus.orbitControls)}
          </span>
        </div>
      </div>

      {threeStatus.error && (
        <div className="bg-red-100 mb-4 p-3 border border-red-300 rounded text-sm">
          <strong>Error:</strong> {threeStatus.error}
        </div>
      )}

      <Button
        onClick={runDiagnostic}
        disabled={isRunning}
        className="bg-blue-500 w-full text-white"
      >
        {isRunning ? "Running..." : "Run Diagnostic"}
      </Button>

      {!threeStatus.core && (
        <div className="bg-yellow-100 mt-4 p-3 border border-yellow-300 rounded text-sm">
          <strong>Installation needed:</strong>
          <pre className="mt-2 text-xs">npm install three @types/three</pre>
        </div>
      )}
    </Card>
  );
};

export default ThreeJSDiagnostic;
