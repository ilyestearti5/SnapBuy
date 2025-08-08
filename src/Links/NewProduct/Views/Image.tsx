import { allIcons } from "@biqpod/app/ui/apis";
import { CircleTip, Scroll, Tip, TitleView } from "@biqpod/app/ui/components";
import { imageExtensions, openPath } from "@biqpod/app/ui/hooks";
import { useFormPhotos } from "../../../apis/getFns";
import { useEffect } from "react";

export const ProductImages = () => {
  const images = useFormPhotos();

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
      <Scroll className="p-1">
        <div className="flex flex-wrap">
          <CircleTip
            className="flex justify-center items-center p-2 rounded-3xl w-[100px] h-[100px]"
            onClick={async () => {
              const files = await openPath({
                filters: [
                  {
                    name: "*",
                    extensions: imageExtensions,
                  },
                ],
                properties: ["multiSelections"],
              });
              images.set((s) => {
                if (s) {
                  return [...s, ...files];
                } else {
                  return files;
                }
              });
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
