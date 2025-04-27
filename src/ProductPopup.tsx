import { allIcons } from "biqpod/ui/apis";
import {
  Card,
  CircleTip,
  Line,
  Field,
  Button,
  Translate,
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
  const count = getFieldValue("prod-count");
  const cartCount = useCartCount(product.id);
  useEffect(() => {
    setFocused("prod-count");
    setFieldValue("prod-count", (cartCount || 1).toString());
  }, [cartCount]);
  return (
    <Card className="max-md:rounded-none w-1/2 max-md:w-full max-md:h-full">
      <div className="flex justify-between items-center gap-2 p-2">
        <h1 className="text-2xl">
          {product.name}
          <sub className="ml-2 rounded-full text-xs italic">
            {product.market}
          </sub>
        </h1>
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
      <div className="flex justify-center items-center p-2 font-bold max-md:text-2xl text-4xl">
        <span className="text-[--biqpod-success]">{product.price || 0}DA</span>
      </div>{" "}
      <Line />
      <div className="flex flex-col justify-between p-2 h-full">
        <div className="flex justify-center items-center gap-2 min-h-[100px]">
          <CircleTip
            icon={allIcons.solid.faMinus}
            onClick={() => {
              const value = +(count || "1") - 1;
              if (value > 0) {
                setFieldValue("prod-count", value.toString());
              }
            }}
          />
          <div className="w-1/3">
            <Field
              className="max-md:text-xl text-3xl text-center"
              placeholder="Enter Count"
              inputMode="numeric"
              inputName="prod-count"
              controls={{
                "^[0-9]+$": {
                  succ: "Valide Data",
                  err: "Enter a valid number",
                },
              }}
              controlsPosition="top"
            />
          </div>
          <CircleTip
            icon={allIcons.solid.faPlus}
            onClick={() => {
              const value = +(count || "1") + 1;
              setFieldValue("prod-count", value.toString());
            }}
          />
        </div>
      </div>
      <Line />
      <div className="flex justify-center items-center p-2 font-bold max-md:text-2xl text-4xl">
        <span className="text-[--biqpod-success]">
          {(product.price * +(count || "1")).toFixed(2)}DA
        </span>
      </div>
      <Line />
      <div className="p-2">
        <Button
          onClick={() => {
            addToCart(product.id, +(count || "1"));
            closePopup();
          }}
          icon={allIcons.solid.faShoppingCart}
        >
          <Translate content="add" />
        </Button>
      </div>
    </Card>
  );
};
