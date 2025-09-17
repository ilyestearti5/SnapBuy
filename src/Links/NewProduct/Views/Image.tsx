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
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
export const ProductImages = () => {
  const images = useFormPhotos();
  const url = useCopyState("");
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
            reader.onload = (event) => {
              const imageSrc = event.target?.result as string;
              if (imageSrc) {
                images.set((s) => {
                  if (s) {
                    return [...s, imageSrc];
                  } else {
                    return [imageSrc];
                  }
                });
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
          onClick={() => {
            if (url.get && !images.get?.includes(url.get)) {
              images.set((s) => {
                if (s) {
                  return [...s, url.get];
                } else {
                  return [url.get];
                }
              });
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
                  Array.from(files).forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const imageSrc = e.target?.result as string;
                      if (imageSrc) {
                        images.set((s) => {
                          if (s) {
                            return [...s, imageSrc];
                          } else {
                            return [imageSrc];
                          }
                        });
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
                className="relative border border-[--biqpod-borders] border-solid rounded-3xl w-[100px] h-[100px] overflow-hidden"
              >
                <img
                  draggable={false}
                  src={src}
                  className="w-full h-full object-cover"
                />
                <TitleView title="remove" className="right-1 bottom-1 absolute">
                  <Tip
                    onClick={() => {
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
    </div>
  );
};
