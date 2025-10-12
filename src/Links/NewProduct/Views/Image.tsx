import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  CircleTip,
  EmptyComponent,
  Input,
  Line,
  Scroll,
  Tip,
  TitleView,
  Translate,
} from "@biqpod/app/ui/components";
import { useCopyState } from "@biqpod/app/ui/hooks";
import { useFormPhotos } from "../../../apis/getFns";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  compressImage,
  createMediaFile,
  cleanupMediaFile,
  MediaFile,
} from "../../../utils/utilities";
import { snapbuyApi } from "../../../apis/index";
import { MediaRenderer } from "../../../components/MediaRenderer";
export const ProductImages = () => {
  const images = useFormPhotos();
  const url = useCopyState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [drivePhotos, setDrivePhotos] = useState<
    { name: string; link: string }[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      mediaFiles.forEach(cleanupMediaFile);
    };
  }, []);

  // Sync mediaFiles with images state for backward compatibility
  useEffect(() => {
    const urlList = mediaFiles.map((file) => file.url);
    images.set(urlList.length > 0 ? urlList : null);
  }, [mediaFiles]);

  const addMediaFile = async (file: File) => {
    try {
      let mediaFile: MediaFile;

      if (file.type.startsWith("image/")) {
        // For images, compress and create object URL
        const objectURL = URL.createObjectURL(file);
        const compressedDataURL = await compressImage(objectURL, 0.3);

        // Clean up the temporary object URL
        URL.revokeObjectURL(objectURL);

        // Create MediaFile with compressed data URL (for now, could be optimized further)
        mediaFile = {
          url: compressedDataURL,
          type: "image",
          name: file.name,
          size: file.size,
          isObjectURL: false,
        };
      } else if (
        file.name.toLowerCase().endsWith(".gltf") ||
        file.name.toLowerCase().endsWith(".glb")
      ) {
        // For GLTF files, use object URL directly for better performance
        mediaFile = createMediaFile(file);
      } else {
        console.warn("Unsupported file type:", file.type);
        return;
      }

      setMediaFiles((prev) => [...prev, mediaFile]);
    } catch (error) {
      console.error("Failed to add media file:", error);
    }
  };

  const addUrlMedia = async (urlString: string) => {
    try {
      // For URLs, we still use the original approach
      const compressedSrc = await compressImage(urlString, 0.3);
      const mediaFile: MediaFile = {
        url: compressedSrc,
        type:
          urlString.toLowerCase().includes(".gltf") ||
          urlString.toLowerCase().includes(".glb")
            ? "gltf"
            : "image",
        name: urlString.split("/").pop() || "unknown",
        size: 0,
        isObjectURL: false,
      };
      setMediaFiles((prev) => [...prev, mediaFile]);
    } catch (error) {
      console.error("Failed to add URL media:", error);
      // Fallback to original URL
      const mediaFile: MediaFile = {
        url: urlString,
        type:
          urlString.toLowerCase().includes(".gltf") ||
          urlString.toLowerCase().includes(".glb")
            ? "gltf"
            : "image",
        name: urlString.split("/").pop() || "unknown",
        size: 0,
        isObjectURL: false,
      };
      setMediaFiles((prev) => [...prev, mediaFile]);
    }
  };

  const removeMediaFile = (indexToRemove: number) => {
    setMediaFiles((prev) => {
      const fileToRemove = prev[indexToRemove];
      if (fileToRemove) {
        cleanupMediaFile(fileToRemove);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };
  const fetchDrivePhotos = async () => {
    setLoadingPhotos(true);
    try {
      const photos = await snapbuyApi.getDrivePhotos();
      setDrivePhotos(photos || []);
    } catch (error) {
      console.error("Failed to fetch drive photos:", error);
      setDrivePhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/") || item.type.includes("gltf")) {
          const file = item.getAsFile();
          if (file) {
            addMediaFile(file);
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);
  return (
    <div className="flex flex-col h-full">
      <AnimatePresence>
        {url.get.match(/^https?:\/\//) && (
          <EmptyComponent>
            <div className="p-2">
              <motion.div
                initial={{ opacity: 0, width: 0, height: 0 }}
                animate={{ opacity: 1, width: 150, height: 150 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl overflow-hidden"
              >
                <MediaRenderer
                  src={url.get}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
            <Line />
          </EmptyComponent>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-1 p-1">
        <div className="relative w-full">
          <Input
            ref={inputRef}
            value={url.get}
            onChange={(e) => url.set(e.target.value)}
            onFocus={() => {
              if (!drivePhotos.length) fetchDrivePhotos();
              setShowDropdown(true);
            }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Search Drive / Enter image url"
            className="flex-1 rounded-2xl"
          />
          <Tip
            className="top-1/2 right-2 absolute -translate-y-1/2"
            icon={allIcons.regular.faPaste}
            onClick={async () => {
              const uri = await navigator.clipboard.readText();
              url.set(uri);
            }}
          />
          {showDropdown && (
            <div className="top-full right-0 left-0 z-10 absolute bg-white shadow-lg border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
              {loadingPhotos ? (
                <div className="p-2 text-center">
                  <Translate content="loading" />
                </div>
              ) : drivePhotos.length > 0 ? (
                drivePhotos
                  .filter((e) => {
                    if (!url.get) return true;
                    return (
                      e.name.toLowerCase().includes(url.get.toLowerCase()) ||
                      e.link.toLowerCase().includes(url.get.toLowerCase())
                    );
                  })
                  .map((photo, index) => (
                    <div
                      key={index}
                      className="flex items-center hover:bg-gray-100 p-2 cursor-pointer"
                      onClick={async () => {
                        setShowDropdown(false);
                        if (
                          !mediaFiles.some((file) => file.url === photo.link)
                        ) {
                          await addUrlMedia(photo.link);
                        }
                      }}
                    >
                      <img
                        src={photo.link}
                        alt={photo.name}
                        className="mr-2 rounded w-10 h-10 object-cover"
                      />
                      <span className="text-sm">{photo.name}</span>
                    </div>
                  ))
              ) : (
                <div className="p-2 text-gray-500 text-center">
                  <Translate content="no photos found" />
                </div>
              )}
            </div>
          )}
        </div>
        <Button
          className="px-4 py-1 rounded-full w-fit"
          onClick={async () => {
            if (url.get && !mediaFiles.some((file) => file.url === url.get)) {
              await addUrlMedia(url.get);
            }
            url.set("");
          }}
        >
          <Translate content="add" />
        </Button>
      </div>
      <Line />
      <Scroll className="p-1">
        <div className="flex flex-wrap">
          <CircleTip
            className="flex justify-center items-center p-2 rounded-3xl w-[100px] h-[100px]"
            onClick={async () => {
              // Create a hidden file input element
              const fileInput = document.createElement("input");
              fileInput.type = "file";
              fileInput.accept = "image/*,.gltf,.glb";
              fileInput.multiple = true; // Allow multiple file selection
              fileInput.style.display = "none";
              // Handle file selection
              fileInput.onchange = (event) => {
                const files = (event.target as HTMLInputElement).files;
                if (files) {
                  Array.from(files).forEach(async (file) => {
                    await addMediaFile(file);
                  });
                }
                // Clean up the input element
                document.body.removeChild(fileInput);
              };
              // Add to DOM and trigger click
              document.body.appendChild(fileInput);
              fileInput.click();
            }}
            icon={allIcons.solid.faAdd}
          />
          {mediaFiles.map((mediaFile, index) => {
            return (
              <div
                key={index}
                className="relative border border-[--biqpod-borders] border-solid rounded-3xl w-[100px] h-[100px] overflow-hidden cursor-pointer"
                onClick={() => setSelectedMedia(mediaFile)}
              >
                <MediaRenderer
                  mediaFile={mediaFile}
                  className="w-full h-full object-cover"
                />
                <TitleView title="remove" className="right-1 bottom-1 absolute">
                  <Tip
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the image click
                      removeMediaFile(index);
                    }}
                    className="bg-[--biqpod-secondary-background] rounded-full"
                    icon={allIcons.regular.faXmarkCircle}
                  />
                </TitleView>
              </div>
            );
          })}
        </div>
      </Scroll>
      {/* Media Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-75"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative flex flex-col gap-2 max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end w-full">
                <CircleTip
                  icon={allIcons.solid.faXmark}
                  onClick={() => setSelectedMedia(null)}
                />
              </div>
              <MediaRenderer
                mediaFile={selectedMedia}
                className="rounded-lg max-w-full max-h-full object-contain"
                alt="Product media"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
