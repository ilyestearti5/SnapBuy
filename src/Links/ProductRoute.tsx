import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  CardWait,
  EmptyComponent,
  FilterField,
  Line,
  MarkDown,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  setColorFor,
  showPopup,
  useAsyncEffect,
  useAsyncMemo,
  useColorMerge,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { Nothing } from "@biqpod/app/ui/types";
import { useParams } from "react-router";
import { snapbuyApi } from "../apis";
import { AddProductInCart, useCartCount } from "../AddProductToCart";
import { CartPopup } from "../CartPopup";
import { ImageSlider } from "./ImageSlider";
import { FormSection } from "./FormSection";
export const ProductRoute = () => {
  const colorMerge = useColorMerge();
  const sizes = useCopyState<string[] | Nothing>([]);
  const colors = useCopyState<string[] | Nothing>([]);
  const prodId = useParams<{ prodId: string }>().prodId;
  const product = useAsyncMemo(async () => {
    return await snapbuyApi.getProduct(prodId);
  }, [prodId]);
  const cart = useCartCount(product?.uid || "", product?.id || "");
  useAsyncEffect(async () => {
    if (product?.theme) {
      for (const themeName in product.theme) {
        var color = product.theme?.[themeName as keyof typeof product.theme];
        if (color) {
          setColorFor(themeName, color, "default");
          setColorFor(themeName, "", "dark");
          setColorFor(themeName, "", "light");
        }
      }
    }
  }, [product?.theme]);
  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {product && (
        <EmptyComponent>
          <Scroll>
            <div className="h-[40vh]">
              <ImageSlider photos={product?.photos || []} />
            </div>
            <FormSection title="description : " />
            <div className="p-4">
              <MarkDown
                value={product?.description || "No Description Found"}
              />
            </div>
            {!!product?.colors?.length && (
              <EmptyComponent>
                <FormSection title="color" />
                <div className="p-3">
                  <div className="flex flex-wrap max-md:justify-center gap-2">
                    {product?.colors?.map((color, index) => {
                      const isSelected =
                        colors.get && colors.get.includes(color);
                      return (
                        <div key={index} onClick={() => {}}>
                          <div
                            className={tw(
                              "rounded-full outline-1 outline-solid outline-offset-2 w-[20px] h-[20px] transition-[outline-width] cursor-pointer",
                              isSelected && "outline-4"
                            )}
                            style={{
                              ...colorMerge(
                                {
                                  outlineColor: "borders",
                                },
                                isSelected && {
                                  outlineColor: "primary",
                                }
                              ),
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </EmptyComponent>
            )}
            {!!product?.sizes?.length && (
              <EmptyComponent>
                <FormSection title="sizes" />
                <div className="flex flex-wrap justify-center gap-2 p-2">
                  <FilterField
                    state={sizes}
                    id="sizes-request"
                    config={{
                      list: product.sizes.map((size) => {
                        return {
                          content: size.toUpperCase(),
                          value: size,
                        };
                      }),
                    }}
                  />
                </div>
              </EmptyComponent>
            )}
          </Scroll>
          <Line />
          <div className="flex gap-2 p-3">
            <Button
              onClick={() => {
                showPopup(<AddProductInCart product={product} />);
              }}
              icon={cart <= 0 ? allIcons.solid.faPlus : allIcons.solid.faCheck}
            >
              {cart <= 0 ? (
                <Translate content="add to cart" />
              ) : (
                <Translate content="see" />
              )}
            </Button>
            {cart > 0 && (
              <Button
                icon={allIcons.solid.faPaperPlane}
                onClick={() => {
                  showPopup(<CartPopup uid={product.uid!} />);
                }}
                className={tw("bg-[--biqpod-secondary]")}
              >
                <Translate content="send order" />
              </Button>
            )}
          </div>
        </EmptyComponent>
      )}
      {!product && <CardWait className="w-full h-full" />}
    </div>
  );
};
