import React, { useState } from "react";
import { Button, Card, Input, Line } from "@biqpod/app/ui/components";
import { GLTFRenderer } from "./GLTFRenderer";
import { MediaRenderer } from "./MediaRenderer";
import { isGLTFFile } from "../utils/utilities";

export const GLTFTester: React.FC = () => {
  const [testUrl, setTestUrl] = useState("");
  const [showRenderer, setShowRenderer] = useState(false);

  // Some test GLTF URLs for debugging
  const testUrls = [
    "https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF/BoxTextured.gltf",
  ];

  return (
    <Card className="mx-auto p-4 max-w-2xl">
      <h2 className="mb-4 font-bold text-xl">GLTF Renderer Tester</h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-2 font-medium text-sm">Test URL:</label>
          <Input
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Enter GLTF/GLB URL or upload file..."
            className="w-full"
          />
        </div>

        <div>
          <h3 className="mb-2 font-medium text-sm">Quick Test URLs:</h3>
          <div className="space-y-1">
            {testUrls.map((url, index) => (
              <Button
                key={index}
                onClick={() => setTestUrl(url)}
                className="block bg-gray-100 hover:bg-gray-200 p-2 w-full text-xs text-left"
              >
                {url}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">File Type Detection:</h3>
          <div className="space-y-1 text-xs">
            <div>
              URL:{" "}
              <code className="bg-gray-100 p-1 rounded">
                {testUrl || "No URL"}
              </code>
            </div>
            <div>
              Is GLTF:{" "}
              <code className="bg-gray-100 p-1 rounded">
                {isGLTFFile(testUrl).toString()}
              </code>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowRenderer(true)}
            disabled={!testUrl}
            className="bg-blue-500 text-white"
          >
            Test with GLTFRenderer
          </Button>
          <Button
            onClick={() => setShowRenderer(false)}
            className="bg-gray-500 text-white"
          >
            Hide Renderer
          </Button>
        </div>

        {showRenderer && testUrl && (
          <>
            <Line />
            <div>
              <h3 className="mb-2 font-medium text-sm">
                Using MediaRenderer (Auto-detect):
              </h3>
              <div className="border rounded w-full h-64">
                <MediaRenderer
                  src={testUrl}
                  className="w-full h-full"
                  alt="Test model"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-medium text-sm">
                Using GLTFRenderer (Direct):
              </h3>
              <div className="border rounded w-full h-64">
                <GLTFRenderer src={testUrl} className="w-full h-full" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-yellow-50 mt-4 p-3 border border-yellow-200 rounded text-sm">
        <strong>Debug Tips:</strong>
        <ul className="space-y-1 mt-1 list-disc list-inside">
          <li>Check browser console for detailed logs</li>
          <li>
            Ensure Three.js is installed:{" "}
            <code>npm install three @types/three</code>
          </li>
          <li>Verify GLTF file is valid and accessible</li>
          <li>Check for CORS issues with external URLs</li>
          <li>Try both .gltf and .glb formats</li>
        </ul>
      </div>
    </Card>
  );
};

export default GLTFTester;
