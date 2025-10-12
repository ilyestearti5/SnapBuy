import React, { useRef, useEffect, useState } from "react";
import { Icon } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
interface SimpleGLTFRendererProps {
  src: string;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export const SimpleGLTFRenderer: React.FC<SimpleGLTFRendererProps> = ({
  src,
  className = "",
  onClick,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    const initSimpleThreeJS = async () => {
      try {
        console.log("SimpleGLTFRenderer: Loading Three.js...");
        // Try to import Three.js with simpler error handling
        const THREE = await import("three");
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js"
        );
        if (!mounted || !containerRef.current) return;
        console.log("SimpleGLTFRenderer: Three.js loaded successfully");
        const container = containerRef.current;
        const width = container.clientWidth || 200;
        const height = container.clientHeight || 200;
        // Simple scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xcccccc);
        // Simple camera
        const camera = new THREE.PerspectiveCamera(
          50,
          width / height,
          0.1,
          1000
        );
        camera.position.set(0, 0, 3);
        // Simple renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        // Clear and add to container
        container.innerHTML = "";
        container.appendChild(renderer.domElement);
        // Simple lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        scene.add(light);
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
        // Load GLTF
        const loader = new GLTFLoader();
        console.log("SimpleGLTFRenderer: Loading model from:", src);
        loader.load(
          src,
          (gltf: any) => {
            if (!mounted) return;
            console.log("SimpleGLTFRenderer: Model loaded:", gltf);
            const model = gltf.scene;
            // Simple scaling
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
              model.scale.multiplyScalar(1 / maxDim);
            }
            scene.add(model);
            // Simple animation loop
            let rotationSpeed = 0.01;
            const animate = () => {
              if (!mounted) return;
              requestAnimationFrame(animate);
              model.rotation.y += rotationSpeed;
              renderer.render(scene, camera);
            };
            animate();
            setLoading(false);
            console.log("SimpleGLTFRenderer: Rendering started");
          },
          (progress: any) => {
            console.log("SimpleGLTFRenderer: Progress:", progress);
          },
          (loadError: any) => {
            console.error("SimpleGLTFRenderer: Load error:", loadError);
            setError(`Load failed: ${loadError.message || "Unknown error"}`);
            setLoading(false);
          }
        );
      } catch (initError) {
        console.error("SimpleGLTFRenderer: Init error:", initError);
        setError(`Three.js error: ${initError}`);
        setLoading(false);
      }
    };
    initSimpleThreeJS();
    return () => {
      mounted = false;
    };
  }, [src]);
  if (error) {
    return (
      <div
        className={`flex flex-col justify-center items-center bg-red-100 rounded-lg p-4 ${className}`}
        style={style}
        onClick={onClick}
      >
        <Icon
          icon={allIcons.solid.faExclamationTriangle}
          iconClassName="text-2xl text-red-500 mb-2"
        />
        <span className="text-red-700 text-xs text-center">{error}</span>
      </div>
    );
  }
  if (loading) {
    return (
      <div
        className={`flex flex-col justify-center items-center bg-blue-100 rounded-lg p-4 ${className}`}
        style={style}
        onClick={onClick}
      >
        <Icon
          icon={allIcons.solid.faSpinner}
          iconClassName="text-2xl text-blue-500 mb-2 animate-spin"
        />
        <span className="text-blue-700 text-xs">Loading 3D Model...</span>
      </div>
    );
  }
  return (
    <div
      ref={containerRef}
      className={`relative bg-gray-200 rounded-lg ${className}`}
      style={style}
      onClick={onClick}
    >
      <div className="bottom-1 left-1 absolute bg-black bg-opacity-50 px-1 py-0.5 rounded text-white text-xs">
        3D Model
      </div>
    </div>
  );
};
export default SimpleGLTFRenderer;
