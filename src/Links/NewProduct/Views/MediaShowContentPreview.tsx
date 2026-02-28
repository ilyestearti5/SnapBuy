import type { SnapbuyBasicFile } from "../../../utils/utilities";
import { tw } from "@biqpod/app/ui/utils";
import MediaAudioPlayer from "./MediaAudioPlayer";
import { MediaVideoPlayer } from "./MediaVideoPlayer";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { ModelViewer } from "./ModelViewer";
import { CardWait } from "@biqpod/app/ui/components";
type Props = {
  mediaFile: SnapbuyBasicFile;
  className?: string;
};
export const MediaShowContentPreview: React.FC<Props> = ({
  mediaFile,
  className,
}) => {
  const blob = useAsyncMemo(async () => {
    if (!mediaFile.url) return undefined;
    try {
      const response = await fetch(mediaFile.url);
      const data = await response.blob();
      return data;
    } catch (error) {
      return undefined;
    }
  }, [mediaFile.url]);
  const isImage = mediaFile.type === "image";
  const isVideo = mediaFile.type === "video";
  const isAudio = mediaFile.type === "audio";
  const isModel = mediaFile.type === "model";
  const isPdf = blob?.type === "application/pdf";
  if (blob === null) {
    return <CardWait className="w-full h-full" />;
  }
  // video player controls (space toggles play/pause)
  if (isImage) {
    return (
      <div className="flex justify-center w-full">
        <img
          draggable={false}
          src={mediaFile.url}
          className={tw("h-[50vh] object-contain", className)}
        />
      </div>
    );
  }
  if (isModel) {
    return (
      <div className={tw("w-full h-[500px] bg-gray-100", className)}>
        <ModelViewer url={mediaFile.url} />
      </div>
    );
  }
  if (isVideo) {
    return (
      <div className={tw("w-full p-2", className)}>
        <MediaVideoPlayer src={mediaFile.url} poster={undefined} />
      </div>
    );
  }
  if (isAudio) {
    return (
      <div className={tw("flex flex-col w-full h-full gap-2 p-2", className)}>
        <MediaAudioPlayer src={mediaFile.url} />
      </div>
    );
  }
  if (isPdf) {
    return (
      <div className={tw("w-full h-[80vh] ", className)}>
        <iframe src={mediaFile.url} className="border-0 w-full h-full" />
      </div>
    );
  }
  // Unknown file type: show icon, name and download
  return (
    <div
      className={tw(
        "flex flex-col items-center justify-center gap-4 p-4",
        className
      )}
    >
      <div className="text-sm">{mediaFile.type}</div>
      <div className="flex gap-2">
        <a
          href={mediaFile.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline"
        >
          Open
        </a>
        <a href={mediaFile.url} download className="text-sm">
          Download
        </a>
      </div>
    </div>
  );
};
