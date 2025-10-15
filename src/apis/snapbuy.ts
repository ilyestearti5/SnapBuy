import {
  setTemp,
  getTempFromStore,
  getTemp,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { useMemo, useEffect } from "react";
export const addToCart = (storeId: string, prodId: string, count: number) => {
  setTemp(`cart.${storeId}.${prodId}.count`, count);
};
export const removeCart = (storeId: string, prodId: string) => {
  var fullCart = getTempFromStore<Souqify.Order["products"]>("cart." + storeId);
  var { [prodId]: _, ...rest } = fullCart || {};
  setTemp("cart." + storeId, rest);
};
export const useCart = (storeId: string | Nothing) => {
  const carts = getTemp<Souqify.Order["products"]>("cart." + storeId);
  return carts;
};
export interface FullCartResult {
  prodId: string;
  count: number;
}
export const useFullCart = (storeId: string | Nothing): FullCartResult[] => {
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
