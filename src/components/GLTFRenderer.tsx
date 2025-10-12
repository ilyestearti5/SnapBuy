import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

interface GLTFRendererProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function GLTFRenderer({
  src,
  className,
  style,
  onClick,
}: GLTFRendererProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current!;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(2, 2, 2);
    scene.add(directional);

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
      src, // or "/model.glb"
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.position.set(0, -1, 0);
        scene.add(model);
      }
    );

    camera.position.set(0, 1, 3);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      mount.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`bg-black w-full h-screen ${className || ""}`}
      style={style}
      onClick={onClick}
    />
  );
}

export default GLTFRenderer;
