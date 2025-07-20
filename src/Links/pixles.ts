import FacebookPixel from "react-facebook-pixel";
import ttq from "tiktok-pixel";
import { getPrice } from "../utils";
import { useMemo } from "react";
import { Nothing } from "@biqpod/app/ui/types";
export function initPixels(store: SnapBuy.Store | Nothing) {
  return useMemo(() => {
    if (!store) {
      return undefined;
    }
    if (store.pixels?.facebook) {
      FacebookPixel.init(store.pixels.facebook, undefined, {
        autoConfig: true,
        debug: false,
      });
    }
    if (store.pixels?.tiktok) {
      ttq.init(store.pixels.tiktok, undefined, {
        debug: false,
      });
    }
    return {
      search(value: string) {
        FacebookPixel.track("Search", {
          search_string: value,
        });
        // TikTok Pixel tracking
        ttq.track("Search", {
          search_string: value,
        });
      },
      click(tab: string | Nothing) {
        FacebookPixel.track("Click", {
          content_type: "tab",
          content_name: tab,
        });
        // TikTok Pixel tracking
        ttq.track("Click", {
          content_type: "tab",
          content_name: tab,
        });
      },
      view(product: SnapBuy.Product | Nothing) {
        if (!product) {
          return;
        }
        const price = getPrice(product, 1).total;
        FacebookPixel.track("ViewContent", {
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
          value: price,
          currency: "DZD",
        });
        // TikTok Pixel tracking
        ttq.track("ViewContent", {
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
          value: price,
          currency: "DZD",
        });
      },
      addToCart(product: SnapBuy.Product, count: number) {
        const price = getPrice(product, count).total;
        FacebookPixel.track("AddToCart", {
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
          value: price,
          currency: "DZD",
          num_items: count,
        });
        // TikTok Pixel tracking
        ttq.track("AddToCart", {
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
          value: price,
          currency: "DZD",
          num_items: count,
        });
      },
      submit(tab: string) {
        FacebookPixel.track("SubmitApplication", {
          form_id: tab,
        });
        // TikTok Pixel tracking
        ttq.track("SubmitApplication", {
          form_id: tab,
        });
      },
      purchase(order: SnapBuy.Order) {
        const price = getPrice(order, 1).total;
        const prods = Object.entries(order.products || {}).map(
          ([id, product]) => ({
            id,
            ...product,
          })
        );
        FacebookPixel.track("Purchase", {
          content_ids: prods.map((p) => p.id),
          content_name: "Order " + order.id,
          content_type: "product",
          value: price,
          currency: "DZD",
          num_items: prods.length,
        });
        // TikTok Pixel tracking
        ttq.track("Purchase", {
          content_ids: prods.map((p) => p.id),
          content_name: "Order " + order.id,
          content_type: "product",
          value: price,
          currency: "DZD",
          num_items: prods.length,
        });
      },
    };
  }, [store]);
}
