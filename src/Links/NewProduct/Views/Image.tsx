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
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { compressImage } from "../../../utils/utilities";
export const ProductImages = () => {
  const images = useFormPhotos();
  const url = useCopyState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const addCompressedImage = async (imageSrc: string) => {
    try {
      const compressedSrc = await compressImage(imageSrc, 0.3); // 80% quality
      images.set((s) => {
        if (s) {
          return [...s, compressedSrc];
        } else {
          return [compressedSrc];
        }
      });
    } catch (error) {
      console.error("Failed to compress image:", error);
      // Fallback to original image if compression fails
      images.set((s) => {
        if (s) {
          return [...s, imageSrc];
        } else {
          return [imageSrc];
        }
      });
    }
  };
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const imageSrc = event.target?.result as string;
              if (imageSrc) {
                await addCompressedImage(imageSrc);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [images]);
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
                <img src={url.get} className="w-full h-full object-cover" />
              </motion.div>
            </div>
            <Line />
          </EmptyComponent>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-1 p-1">
        <div className="relative w-full">
          <Input
            value={url.get}
            onChange={(e) => url.set(e.target.value)}
            placeholder="Enter image url"
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
        </div>
        <Button
          className="px-4 py-1 rounded-full w-fit"
          onClick={async () => {
            if (url.get && !images.get?.includes(url.get)) {
              await addCompressedImage(url.get);
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
              fileInput.accept = "image/*";
              fileInput.multiple = true; // Allow multiple file selection
              fileInput.style.display = "none";

              // Handle file selection
              fileInput.onchange = (event) => {
                const files = (event.target as HTMLInputElement).files;
                if (files) {
                  Array.from(files).forEach(async (file) => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                      const imageSrc = e.target?.result as string;
                      if (imageSrc) {
                        await addCompressedImage(imageSrc);
                      }
                    };
                    reader.readAsDataURL(file);
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
          {images.get?.map((src, index) => {
            return (
              <div
                key={index}
                className="relative border border-[--biqpod-borders] border-solid rounded-3xl w-[100px] h-[100px] overflow-hidden cursor-pointer"
                onClick={() => setSelectedImage(src)}
              >
                <img
                  draggable={false}
                  src={src}
                  className="w-full h-full object-cover"
                />
                <TitleView title="remove" className="right-1 bottom-1 absolute">
                  <Tip
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the image click
                      images.set(
                        images.get?.filter((file) => {
                          return file != src;
                        }) || []
                      );
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

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-75"
            onClick={() => setSelectedImage(null)}
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
                  onClick={() => setSelectedImage(null)}
                />
              </div>
              <img
                src={selectedImage}
                className="rounded-lg max-w-full max-h-full object-contain"
                alt="Product image"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
