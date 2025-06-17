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
  getTemp,
  getTempFromStore,
  setFieldValue,
  setTemp,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { setFocused } from "@biqpod/app/ui/utils";
import { useEffect, useMemo } from "react";
import { ImageSlider } from "./Links/ImageSlider";
import { getPrice } from "./CartPopup";
import { useLocation } from "react-router";
export interface ProductPopupProps {
  product: SnapBuy.Product;
}
export const addToCart = (storeId: string, prodId: string, count: number) => {
  setTemp(`cart.${storeId}.${prodId}.count`, count);
};
export const removeCart = (storeId: string, prodId: string) => {
  var fullCart = getTempFromStore<SnapBuy.Order["products"]>("cart." + storeId);
  var { [prodId]: _, ...rest } = fullCart || {};
  setTemp("cart." + storeId, rest);
};
export const useCart = (storeId: string) => {
  const carts = getTemp<SnapBuy.Order["products"]>("cart." + storeId);
  return carts;
};
export interface FullCartResult {
  prodId: string;
  count: number;
}
export const useFullCart = (storeId: string): FullCartResult[] => {
  const carts = useCart(storeId);
  const result = useMemo(() => {
    return Object.entries(carts || {}).map(([prodId, r]) => {
      const count = r?.count || 0;
      return {
        prodId,
        count,
      };
    });
  }, [carts]);
  return result;
};
export const deleteCart = (storeId: string) => {
  setTemp("cart." + storeId, null);
};
export const useCartCount = (storeId: string, prodId: string) => {
  const carts = useCart(storeId);
  return useMemo(() => {
    return carts?.[prodId]?.count || 0;
  }, [carts, prodId]);
};
export const useCartLine = (uid: string, prodId: string) => {
  const carts = useCart(uid);
  return useMemo(() => {
    return carts?.[prodId];
  }, [carts, prodId]);
};
export function initCart() {
  const fullCarts = getTemp("cart");
  const cartsLoaded = useCopyState(false);
  useEffect(() => {
    const cart = localStorage.getItem("cart");
    try {
      const parsedCart = cart ? JSON.parse(cart) : {};
      setTemp("cart", parsedCart);
    } catch {}
    cartsLoaded.set(true);
  }, []);
  useEffect(() => {
    if (cartsLoaded.get) {
      localStorage.setItem("cart", JSON.stringify(fullCarts));
    }
  }, [fullCarts, cartsLoaded.get]);
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
  const cartCount = useCartCount(storeId, product.id);
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
                addToCart(storeId, prod.id, count);
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
