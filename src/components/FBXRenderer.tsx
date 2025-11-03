import React, { useRef, useEffect, useState } from "react";
import { Icon } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";

interface GLTFRendererProps {
  src: string;
  className?: string;
  alt?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const GLTFRenderer: React.FC<GLTFRendererProps> = ({
  src,
  className = "",
  onClick,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    let mounted = true;

    const initThreeJS = async () => {
      try {
        // Dynamically import Three.js modules
        const THREE = await import("three");
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js"
        );
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js"
        );

        if (!mounted || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 300;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
          75,
          width / height,
          0.1,
          1000
        );
        camera.position.set(0, 0, 5);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Clear container and add renderer
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // Lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(
          0xffffff,
          0x444444,
          0.6
        );
        scene.add(hemisphereLight);

        // Controls setup
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2.0;

        // Store references
        sceneRef.current = scene;
        rendererRef.current = renderer;

        // Load GLTF model
        const loader = new GLTFLoader();

        loader.load(
          src,
          (gltf: any) => {
            if (!mounted) return;

            const model = gltf.scene;

            // Scale and position the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Normalize the model size
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            model.scale.multiplyScalar(scale);

            // Center the model
            model.position.sub(center.multiplyScalar(scale));

            // Enable shadows
            model.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            scene.add(model);
            setLoading(false);
          },
          (progress: any) => {
            // Loading progress
            const loaded = (progress.loaded / progress.total) * 100;
            console.log(`GLTFLoader: ${loaded.toFixed(2)}% loaded`);
          },
          (error: any) => {
            console.error("Error loading GLTF:", error);
            setError("Failed to load 3D model");
            setLoading(false);
          }
        );

        // Animation loop
        const animate = () => {
          if (!mounted) return;

          animationRef.current = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
          if (!mounted || !containerRef.current) return;

          const newWidth = containerRef.current.clientWidth || 300;
          const newHeight = containerRef.current.clientHeight || 300;

          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          controls.dispose();
          renderer.dispose();
        };
      } catch (err) {
        console.error("Error initializing Three.js:", err);
        setError(
          "Three.js not available. Please install three.js to view 3D models."
        );
        setLoading(false);
      }
    };

    initThreeJS();

    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [src]);

  if (error) {
    return (
      <div
        className={`flex flex-col justify-center items-center bg-gray-100 rounded-lg ${className}`}
        style={style}
        onClick={onClick}
      >
        <Icon
          icon={allIcons.solid.faCube}
          iconClassName="text-4xl text-gray-400 mb-2"
        />
        <span className="px-2 text-gray-500 text-sm text-center">{error}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`flex flex-col justify-center items-center bg-gray-100 rounded-lg ${className}`}
        style={style}
        onClick={onClick}
      >
        <Icon
          icon={allIcons.solid.faSpinner}
          iconClassName="text-4xl text-gray-400 mb-2 animate-spin"
        />
        <span className="text-gray-500 text-sm">Loading 3D Model...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={style}
      onClick={onClick}
    >
      {/* Controls info overlay */}
      <div className="bottom-2 left-2 absolute bg-black bg-opacity-50 px-2 py-1 rounded text-white text-xs">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default GLTFRenderer;
