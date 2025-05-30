import { useEffect } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  CircleTip,
  ImageField,
  Scroll,
  Tip,
  TitleView,
} from "@biqpod/app/ui/components";
import {
  useTemp,
  showToast,
  useCopyState,
  useColorMerge,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { ProductFormSectionProps } from "../NewProduct";
export const ProductImages = ({ product }: ProductFormSectionProps) => {
  const images = useTemp<string[]>("product-images");
  const currentImageState = useCopyState<string | Nothing>(null);
  useEffect(() => {
    if (currentImageState.get) {
      if (images.get?.includes(currentImageState.get)) {
        showToast("is exists before", "warning");
      } else {
        images.set([currentImageState.get, ...(images.get || [])]);
      }
      currentImageState.set(null);
    }
  }, [currentImageState.get, images.get]);

  useEffect(() => {
    if (product?.photos) {
      images.set(product.photos);
    }
  }, [product?.photos]);

  const colorMerge = useColorMerge();
  return (
    <div className="flex flex-col h-full">
      <Scroll className="p-1">
        <div className="flex flex-wrap">
          <CircleTip
            className="flex justify-center items-center p-2 rounded-3xl w-[100px] h-[100px]"
            onClick={async () => {
              document.getElementById("post-image")?.click();
            }}
            icon={allIcons.solid.faAdd}
          />
          {images.get?.map((src, index) => {
            return (
              <div
                key={index}
                className="relative border border-transparent border-solid rounded-3xl w-[100px] h-[100px] overflow-hidden"
                style={{
                  ...colorMerge({
                    borderColor: "borders",
                  }),
                }}
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
                    className="rounded-full"
                    style={{
                      ...colorMerge("secondary.background"),
                    }}
                    icon={allIcons.regular.faXmarkCircle}
                  />
                </TitleView>
              </div>
            );
          })}
        </div>
      </Scroll>
      <ImageField
        state={currentImageState}
        id="post-image"
        config={{ hidden: true }}
      />
    </div>
  );
};
