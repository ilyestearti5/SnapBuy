import React from "react";
import { Icon, Image } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { isImageFile, isGLTFFile, MediaFile } from "../utils/utilities";
import GLTFRenderer from "./GLTFRenderer";
import { tw } from "@biqpod/app/ui/utils";

interface MediaRendererProps {
  src?: string;
  mediaFile?: MediaFile;
  className?: string;
  alt?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Enhanced MediaRenderer component that can work with URLs or MediaFile objects
 * Automatically detects and renders either images or GLTF 3D models
 */
export const MediaRenderer: React.FC<MediaRendererProps> = ({
  src,
  mediaFile,
  className = "",
  alt,
  onClick,
  style,
}) => {
  // Determine the actual source and type
  const actualSrc = mediaFile?.url || src;
  const fileType = mediaFile?.type;

  if (!actualSrc) {
    console.warn("MediaRenderer: No src or mediaFile provided");
    return (
      <div
        className={`flex flex-col justify-center items-center bg-gray-100 rounded-lg ${className}`}
        style={style}
        onClick={onClick}
      >
        <Icon
          icon={allIcons.solid.faExclamationTriangle}
          iconClassName="text-2xl text-gray-400 mb-2"
        />
        <span className="px-2 text-gray-500 text-xs text-center">
          No media source
        </span>
      </div>
    );
  }

  // Debug logging (reduced for performance)
  if (process.env.NODE_ENV === "development") {
    console.log("MediaRenderer - src:", actualSrc);
    console.log("MediaRenderer - fileType:", fileType);
    console.log("MediaRenderer - isObjectURL:", actualSrc.startsWith("blob:"));
  }

  // Use explicit type from MediaFile if available, otherwise detect from URL
  const isGLTF = fileType === "gltf" || (!fileType && isGLTFFile(actualSrc));
  const isImage = fileType === "image" || (!fileType && isImageFile(actualSrc));

  // Render based on type
  if (isGLTF) {
    return (
      <GLTFRenderer
        src={actualSrc}
        className={className}
        onClick={onClick}
        style={style}
      />
    );
  }

  if (isImage) {
    return (
      <Image
        src={actualSrc}
        className={tw("rounded-none", className)}
        alt={alt || mediaFile?.name}
        onClick={onClick}
        style={style}
      />
    );
  }

  // Fallback for unknown file types
  return (
    <div
      className={`flex flex-col justify-center items-center bg-gray-100 rounded-lg ${className}`}
      style={style}
      onClick={onClick}
    >
      <Icon
        icon={allIcons.solid.faFile}
        iconClassName="text-4xl text-gray-400 mb-2"
      />
      <span className="px-2 text-gray-500 text-sm text-center">
        {alt || mediaFile?.name || "Unsupported file type"}
      </span>
    </div>
  );
};

export default MediaRenderer;
