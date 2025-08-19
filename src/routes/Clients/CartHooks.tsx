import { useMemo } from "react";
import { Nothing } from "@biqpod/app/ui/types";
import { useFullCart } from "@biqpod/snapbuy";
/**
 * Hook to get total cart item count for a store
 */
export const useCartTotalCount = (storeId: string | Nothing): number => {
  const cartItems = useFullCart(storeId);
  return useMemo(() => {
    return cartItems.reduce((total, item) => total + item.count, 0);
  }, [cartItems]);
};
/**
 * Hook to check if cart has any items
 */
export const useHasCartItems = (storeId: string | Nothing): boolean => {
  const cartItems = useFullCart(storeId);
  return useMemo(() => {
    return cartItems.length > 0;
  }, [cartItems]);
};
/**
 * Hook to get cart summary
 */
export const useCartSummary = (storeId: string | Nothing) => {
  const cartItems = useFullCart(storeId);
  return useMemo(() => {
    const totalItems = cartItems.reduce((total, item) => total + item.count, 0);
    const uniqueProducts = cartItems.length;
    return {
      totalItems,
      uniqueProducts,
      isEmpty: totalItems === 0,
    };
  }, [cartItems]);
};
