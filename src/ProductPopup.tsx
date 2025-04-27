import { allIcons } from "biqpod/ui/apis";
import {
  Card,
  CircleTip,
  Line,
  Field,
  Button,
  Translate,
  Icon,
} from "biqpod/ui/components";
import {
  closePopup,
  getFieldValue,
  getTemp,
  setFieldValue,
  setTemp,
} from "biqpod/ui/hooks";
import { setFocused } from "biqpod/ui/utils";
import { useEffect, useMemo } from "react";
interface ProductPopupProps {
  product: SnapBuy.Product;
}
export const addToCart = (prodId: string, count: number) => {
  setTemp("cart." + prodId, count);
};
export const removeCart = (prodId: string) => {
  setTemp("cart." + prodId, null);
};
export const useFullCart = () => {
  const carts = getTemp<Record<string, number>>("cart");
  const result = useMemo(() => {
    return Object.entries(carts || {})
      .filter(([_, count]) => typeof count === "number")
      .map(([prodId, count]) => {
        return {
          prodId,
          count,
        };
      });
  }, [carts]);
  return result;
};
export const deleteCart = () => {
  setTemp("cart", null);
};

export const useCartCount = (prodId: string) => {
  const carts = getTemp<Record<string, number>>("cart");
  return useMemo(() => {
    return carts?.[prodId] || 0;
  }, [carts, prodId]);
};

export const ProductPopup = ({ product }: ProductPopupProps) => {
  const prod = product;
  const currentCount = getFieldValue("prod-count");
  const cartCount = useCartCount(product.id);
  useEffect(() => {
    setFocused("prod-count");
    setFieldValue("prod-count", (cartCount || 1).toString());
  }, [cartCount]);
  return (
    <Card className="w-1/2 md:max-h-[70vh]">
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
      <div className="flex justify-center items-center gap-x-2 p-2">
        <div>
          <div
            className="inline-flex justify-center items-center rounded-full w-[50px] h-[50px] font-bold bg-[--biqpod-text-color] text-[--biqpod-primary-background] text-xl cursor-pointer"
            onClick={() => {
              const count = parseInt(currentCount || "") || 0;
              setFieldValue("prod-count", Math.max(1, count - 1).toString());
            }}
          >
            <Icon icon={allIcons.solid.faMinus} />
          </div>
        </div>
        <Field
          inputName="prod-count"
          inputMode="numeric"
          className="bg-[--biqpod-primary-background] border border-[--biqpod-borders] focus:border-[--biqpod-primary] border-solid rounded-2xl text-3xl text-center"
        />
        <div>
          <div
            className="inline-flex justify-center items-center rounded-full w-[50px] h-[50px] font-bold bg-[--biqpod-text-color] text-[--biqpod-primary-background] text-xl cursor-pointer"
            onClick={() => {
              const count = parseInt(currentCount || "") || 0;
              setFieldValue("prod-count", (count + 1).toString());
            }}
          >
            <Icon icon={allIcons.solid.faPlus} />
          </div>
        </div>
      </div>
      <Line />
      <div className="flex gap-2 p-2">
        <Button
          icon={allIcons.solid.faPlus}
          onClick={() => {
            const count = parseInt(currentCount || "") || 0;
            addToCart(prod.id, count);
            closePopup();
          }}
        >
          <Translate content="add" />
        </Button>
      </div>
    </Card>
  );
};
