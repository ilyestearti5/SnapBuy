import { useState, useEffect } from "react";
import { CardWait, Icon, IconProps } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import type { SnapbuyBasicFile } from "../../../utils/utilities";
import { tw } from "@biqpod/app/ui/utils";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
type Props = {
  mediaFile: SnapbuyBasicFile;
};
const colors: Record<string, string> = {
  pdf: "text-red-600",
  zip: "text-yellow-600",
  csv: "text-green-600",
  doc: "text-blue-600",
  xls: "text-green-600",
  ppt: "text-orange-600",
  json: "text-purple-600",
  txt: "text-gray-600",
  html: "text-orange-600",
};
const icons: Record<string, IconProps["icon"]> = {
  pdf: allIcons.solid.faFilePdf,
  zip: allIcons.solid.faFileZipper,
  csv: allIcons.solid.faFileCsv,
  doc: allIcons.solid.faFileWord,
  xls: allIcons.solid.faFileExcel,
  ppt: allIcons.solid.faFilePowerpoint,
  json: allIcons.solid.faFileCode,
  txt: allIcons.solid.faFileLines,
  html: allIcons.solid.faFileCode,
};
export const MediaPreview: React.FC<Props> = ({ mediaFile }) => {
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const blob = useAsyncMemo(async () => {
    if (!mediaFile.url) return undefined;
    try {
      const response = await fetch(mediaFile.url);
      const data = await response.blob();
      return data;
    } catch (error) {
      return undefined;
    }
  }, [mediaFile]);
  const isImage = mediaFile.type === "image";
  const isVideo = mediaFile.type === "video";
  const isAudio = mediaFile.type === "audio";
  const isModel = mediaFile.type === "model";
  useEffect(() => {
    if (!isVideo || !mediaFile.url) return;
    const video = document.createElement("video");
    video.src = mediaFile.url;
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = Math.min(1, video.duration / 2); // seek to 1s or half if shorter
    });
    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg", 0.8);
        setVideoThumbnail(dataURL);
      }
    });
    video.load();
  }, [isVideo, mediaFile.url]);

  interface RenderProps {
    icon: IconProps["icon"];
    color?: string;
  }

  const Render = ({ icon, color }: RenderProps) => {
    return (
      <div
        className={tw(
          "flex flex-col justify-center h-full w-full items-center",
          color
        )}
      >
        <Icon icon={icon} className="text-5xl" />
      </div>
    );
  };
  if (blob === null) {
    return <CardWait className="w-full h-full" />;
  }
  if (isModel) {
    return <Render icon={allIcons.solid.faCube} color="text-orange-500" />;
  }
  if (isImage) {
    return (
      <div className="relative flex flex-shrink-0 justify-center items-center w-full h-full overflow-hidden cursor-pointer">
        <img
          draggable="false"
          src={mediaFile.url}
          loading="eager"
          className="opacity-40 blur-lg w-full h-full object-cover"
        />
        <div className="top-1/2 left-1/2 absolute inset-y-0 flex justify-center w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 transform">
          <img
            draggable="false"
            src={mediaFile.url}
            className={tw("object-contain w-full h-full")}
          />
        </div>
      </div>
    );
  }
  if (isVideo) {
    if (videoThumbnail) {
      return (
        <img
          src={videoThumbnail}
          className={tw("w-full h-full object-cover")}
        />
      );
    } else {
      return <Render icon={allIcons.solid.faFileVideo} />;
    }
  }
  if (isAudio) {
    return <Render icon={allIcons.solid.faFileAudio} />;
  }
  // default: unknown / other file types
  // pick icon by extension for common types

  const fileMimeType = blob?.type.split("/").at(-1)?.toLowerCase();
  const chosenIcon =
    fileMimeType && icons[fileMimeType]
      ? icons[fileMimeType]
      : allIcons.solid.faFile;

  const chosenColor =
    fileMimeType && colors[fileMimeType]
      ? colors[fileMimeType]
      : "text-gray-600";
  return <Render icon={chosenIcon} color={chosenColor} />;
};
