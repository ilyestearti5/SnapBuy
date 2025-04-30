import { setTemp } from "biqpod/ui/hooks";

export const addToCart = (prodId: string, count: number) => {
  setTemp("cart." + prodId, { count });
};
