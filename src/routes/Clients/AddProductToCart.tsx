import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CircleTip,
  Line,
  Field,
  Button,
  Translate,
  Icon,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  ColorIds,
  getFieldValue,
  setFieldValue,
  useAsyncMemo,
} from "@biqpod/app/ui/hooks";
import { setFocused } from "@biqpod/app/ui/utils";
import { useEffect, useMemo } from "react";
import { ImageSlider } from "../../Links/ImageSlider";
import { getPrice } from "../../utils";
import { useLocation } from "react-router";
import { snapbuyApi } from "../../apis";
import { initPixels } from "../../Links/pixles";
import { addToCart, useCartCount } from "../../apis/snapbuy";
import { Biqpod } from "@biqpod/app/ui/types";
export interface ProductPopupProps {
  product: Biqpod.Snapbuy.Product;
}
export const useSearchParams = () => {
  const loc = useLocation();
  return useMemo(() => {
    const searchParams = new URLSearchParams(loc.search);
    return {
      showPhoto: searchParams.has("photo")
        ? !!+searchParams.get("photo")!
        : true,
      darkMode: searchParams.has("dark") ? !!+searchParams.get("dark")! : false,
      getColor(name: ColorIds) {
        return searchParams.get("color." + name);
      },
    };
  }, [loc.search]);
};
export const AddProductInCart = ({ product }: ProductPopupProps) => {
  const prod = product;
  const storeId = product.storeId!;
  const currentCount = getFieldValue("prod-count");
  const cartCount = useCartCount(storeId, product.id!);
  const photos = product.photos || [];
  const priceDetected = getPrice(prod, +(currentCount || ""));
  useEffect(() => {
    setFocused("prod-count");
    setFieldValue("prod-count", (cartCount || 1).toString());
  }, [cartCount]);
  const { showPhoto } = useSearchParams();
  const count = useMemo(() => {
    return parseInt(currentCount || "") || 0;
  }, [currentCount]);
  const store = useAsyncMemo(async () => {
    return await snapbuyApi.store.get(storeId);
  }, [storeId]);
  const pixles = initPixels(store);
  return (
    <Card className="max-md:w-10/12 md:w-1/2 md:max-h-[70vh]">
      <div className="flex justify-between items-center p-2">
        <h1 className="md:text-xl text-2xl">{prod.name}</h1>
        <div>
          <CircleTip
            onClick={() => {
              closePopup();
            }}
            icon={allIcons.solid.faXmark}
          />
        </div>
      </div>
      <Line />
      {showPhoto && (
        <EmptyComponent>
          <div className="h-[300px]">
            <ImageSlider photos={photos} />
          </div>
          <Line />
        </EmptyComponent>
      )}
      <div className="p-2 text-center">
        <span className="font-bold text-[--biqpod-success] text-2xl">
          {priceDetected.total} DA{" "}
          {priceDetected.choised && (
            <sub>/ {priceDetected.choised.price} DA</sub>
          )}
        </span>
      </div>
      <Line />
      <div className="flex justify-center items-center gap-x-2 p-2">
        <div>
          <div
            className="inline-flex justify-center items-center rounded-full w-[50px] h-[50px] font-bold bg-[--biqpod-text-color] text-[--biqpod-primary-background] text-xl cursor-pointer"
            onClick={() => {
              setFieldValue("prod-count", Math.max(1, count - 1).toString());
            }}
          >
            <Icon icon={allIcons.solid.faMinus} />
          </div>
        </div>
        <Field
          inputName="prod-count"
          inputMode="numeric"
          className="focus:border-[--biqpod-primary] border-solid rounded-2xl text-3xl text-center"
        />
        <div>
          <div
            className="inline-flex justify-center items-center rounded-full w-[50px] h-[50px] font-bold bg-[--biqpod-text-color] text-[--biqpod-primary-background] text-xl cursor-pointer"
            onClick={() => {
              setFieldValue("prod-count", (count + 1).toString());
            }}
          >
            <Icon icon={allIcons.solid.faPlus} />
          </div>
        </div>
      </div>
      {!!count && (
        <EmptyComponent>
          <Line />
          <div className="flex gap-2 p-2">
            <Button
              icon={allIcons.solid.faPlus}
              onClick={() => {
                pixles?.addToCart(prod, count);
                addToCart(storeId, prod.id!, count);
                closePopup();
              }}
            >
              <Translate content="add" />
            </Button>
          </div>
        </EmptyComponent>
      )}
    </Card>
  );
};
