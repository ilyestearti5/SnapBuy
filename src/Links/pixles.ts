import fcbPixel from "react-facebook-pixel";
import ttq from "tiktok-pixel";
import { getPrice } from "../utils";
import { useMemo } from "react";
import { Nothing } from "@biqpod/app/ui/types";
export function initPixels(store: Snapbuy.Store | Nothing) {
  return useMemo(() => {
    if (!store) {
      return undefined;
    }
    if (store.pixels?.facebook) {
      fcbPixel.init(store.pixels.facebook, undefined, {
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
        fcbPixel.track("Search", {
          search_string: value,
        });
        // TikTok Pixel tracking
        ttq.track("Search", {
          search_string: value,
        });
      },
      favorite(product: Snapbuy.Product) {
        fcbPixel.track("AddToWishlist", {
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
        });
        // TikTok Pixel tracking
        ttq.track("AddToWishlist", {
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
        });
      },
      click(tab: string | Nothing) {
        fcbPixel.track("Click", {
          content_type: "tab",
          content_name: tab,
        });
        // TikTok Pixel tracking
        ttq.track("Click", {
          content_type: "tab",
          content_name: tab,
        });
      },
      view(product: Snapbuy.Product | Nothing) {
        if (!product) {
          return;
        }
        const price = getPrice(product, 1).total;
        fcbPixel.track("ViewContent", {
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
      addToCart(product: Snapbuy.Product, count: number) {
        const price = getPrice(product, count).total;
        fcbPixel.track("AddToCart", {
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
        fcbPixel.track("SubmitApplication", {
          form_id: tab,
        });
        // TikTok Pixel tracking
        ttq.track("SubmitApplication", {
          form_id: tab,
        });
      },
      purchase(order: Snapbuy.Order) {
        const prods = Object.entries(order.products || {}).map(
          ([id, product]) => ({
            id,
            ...product,
          })
        );
        fcbPixel.track("Purchase", {
          content_ids: prods.map((p) => p.id),
          content_name: "Order " + order.id,
          content_type: "product",
          value: order.totalPrice,
          currency: "DZD",
          num_items: prods.length,
        });
        // TikTok Pixel tracking
        ttq.track("Purchase", {
          content_ids: prods.map((p) => p.id),
          content_name: "Order " + order.id,
          content_type: "product",
          value: order.totalPrice,
          currency: "DZD",
          num_items: prods.length,
        });
      },
    };
  }, [store]);
}
