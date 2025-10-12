import React, { useState } from "react";
import {
  createMediaFile,
  cleanupMediaFile,
  MediaFile,
} from "../utils/utilities";
import { MediaRenderer } from "./MediaRenderer";

/**
 * Component to test object URL optimization vs data URL performance
 */
export const MediaObjectURLTester: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [performanceData, setPerformanceData] = useState<{
    objectURLTime: number;
    dataURLTime: number;
    memoryUsage: string;
  } | null>(null);

  const testObjectURLPerformance = async (file: File) => {
    // Test Object URL approach
    const objectURLStart = performance.now();
    const mediaFile = createMediaFile(file);
    const objectURLEnd = performance.now();

    // Test Data URL approach
    const dataURLStart = performance.now();
    const reader = new FileReader();

    return new Promise<void>((resolve) => {
      reader.onload = () => {
        const dataURLEnd = performance.now();

        setPerformanceData({
          objectURLTime: objectURLEnd - objectURLStart,
          dataURLTime: dataURLEnd - dataURLStart,
          memoryUsage: `Object URL: ~${
            file.size
          } bytes, Data URL: ~${Math.round(file.size * 1.37)} bytes`,
        });

        setMediaFiles((prev) => [...prev, mediaFile]);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.gltf,.glb";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        testObjectURLPerformance(file);
      }
    };
    input.click();
  };

  const clearAll = () => {
    mediaFiles.forEach(cleanupMediaFile);
    setMediaFiles([]);
    setPerformanceData(null);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="mb-4 font-bold text-lg">Object URL Performance Tester</h3>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleFileUpload}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
        >
          Test File Upload
        </button>
        <button
          onClick={clearAll}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white"
        >
          Clear All
        </button>
      </div>

      {performanceData && (
        <div className="bg-gray-100 mb-4 p-3 rounded">
          <h4 className="font-semibold">Performance Results:</h4>
          <p>
            Object URL Creation: {performanceData.objectURLTime.toFixed(2)}ms
          </p>
          <p>Data URL Creation: {performanceData.dataURLTime.toFixed(2)}ms</p>
          <p>Memory Usage: {performanceData.memoryUsage}</p>
          <p className="font-semibold text-green-600">
            Performance Gain:{" "}
            {(
              ((performanceData.dataURLTime - performanceData.objectURLTime) /
                performanceData.dataURLTime) *
              100
            ).toFixed(1)}
            %
          </p>
        </div>
      )}

      <div className="gap-4 grid grid-cols-3">
        {mediaFiles.map((mediaFile, index) => (
          <div key={index} className="relative">
            <MediaRenderer
              mediaFile={mediaFile}
              className="border rounded w-full h-32 object-cover"
            />
            <div className="bg-gray-800 mt-1 p-1 rounded text-white text-xs">
              <div>Type: {mediaFile.type}</div>
              <div>Size: {Math.round(mediaFile.size / 1024)}KB</div>
              <div>Object URL: {mediaFile.isObjectURL ? "Yes" : "No"}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-gray-600 text-sm">
        <p>
          <strong>Benefits of Object URL optimization:</strong>
        </p>
        <ul className="list-disc list-inside">
          <li>Faster file processing (no base64 encoding)</li>
          <li>Lower memory usage (no data duplication)</li>
          <li>Better performance for large files</li>
          <li>Immediate availability (no encoding wait time)</li>
        </ul>
      </div>
    </div>
  );
};
