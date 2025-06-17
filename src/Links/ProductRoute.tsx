import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  CardWait,
  EmptyComponent,
  Line,
  MarkDown,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  setDarkColor,
  setDefaultColor,
  setLightColor,
  showPopup,
  useAsyncMemo,
} from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { useParams } from "react-router";
import { snapbuyApi } from "../apis";
import {
  AddProductInCart,
  useCartCount,
  useSearchParams,
} from "../AddProductToCart";
import { CartPopup } from "../CartPopup";
import { ImageSlider } from "./ImageSlider";
import { FormSection } from "./FormSection";
import { useEffect } from "react";
import { colorIds } from "../utils";
export const ProductRoute = () => {
  const prodId = useParams<{ prodId: string }>().prodId;
  const product = useAsyncMemo(async () => {
    return await snapbuyApi.getProduct(prodId);
  }, [prodId]);
  const cart = useCartCount(product?.storeId || "", product?.id || "");
  const { getColor } = useSearchParams();
  useEffect(() => {
    for (const colorId of colorIds) {
      const color = getColor(colorId);
      if (color) {
        setDarkColor(colorId, color);
        setLightColor(colorId, color);
        setDefaultColor(colorId, color);
      }
    }
  }, [getColor]);
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
                  showPopup(<CartPopup storeId={product.storeId!} />);
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
