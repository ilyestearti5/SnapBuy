import {
  execAction,
  getTemp,
  getTempFromStore,
  setTemp,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { useMemo } from "react";
import { useLocation } from "react-router";
import { mergeArray } from "@biqpod/app/ui/utils";

export const toId = (value: string) => {
  return value.toLowerCase().replaceAll(/( |\.)+/gi, "-");
};

export const getStringTimeLeave = (from: Date | number, to: Date | number) => {
  const fromTime = new Date(from);
  const toTime = new Date(to);
  const timeDifference = Math.floor(
    (toTime.getTime() - fromTime.getTime()) / 1000
  );
  let time = "";
  if (timeDifference < 60) {
    time = `${timeDifference} sec${timeDifference > 1 ? "s" : ""}`;
  } else if (timeDifference < 3600) {
    const minutes = Math.floor(timeDifference / 60);
    time = `${minutes} min${minutes > 1 ? "s" : ""}`;
  } else if (timeDifference < 86400) {
    const hours = Math.floor(timeDifference / 3600);
    time = `${hours} hour${hours > 1 ? "s" : ""}`;
  } else if (timeDifference < 604800) {
    const days = Math.floor(timeDifference / 86400);
    time = `${days} day${days > 1 ? "s" : ""}`;
  } else if (timeDifference < 2419200) {
    const weeks = Math.floor(timeDifference / 604800);
    time = `${weeks} week${weeks > 1 ? "s" : ""}`;
  } else if (timeDifference < 29030400) {
    const months = Math.floor(timeDifference / 2419200);
    time = `${months} month${months > 1 ? "s" : ""}`;
  } else {
    const years = Math.floor(timeDifference / 29030400);
    time = `${years} year${years > 1 ? "s" : ""}`;
  }
  return time;
};

export const useSub = () => {
  return getTemp<
    {
      isSubscribed: boolean;
    } & Biqpod.Account.Payout
  >("subed");
};

export const initStoreIdSave = () => {
  const loc = useLocation();
  return useMemo(() => {
    if (loc.pathname.startsWith("/store/")) {
      const storeId = loc.pathname.split("/").at(2);
      setTemp("storeId", storeId);
    } else {
      setTemp("storeId", null);
    }
  }, [loc.pathname]);
};

export let initialHeight = window.innerHeight;

export const isAndroidWeb = navigator.userAgent.match(
  /Android.*(wv|Chrome)\/(\d+)\.(\d+)(?:\.(\d+))?/gi
);

export const useClientStoreId = () => {
  return getTemp<string>("client-store-id");
};

export function useFetchMoreAction<T>(
  actionName: string,
  PAGE_SIZE: number,
  callback: (props: {
    next: boolean;
    lastDoc: T | null;
    hasMore: boolean;
    PAGE_SIZE: number;
  }) => Promise<T[] | Nothing>,
  deps: any[] = []
) {
  const data = useCopyState<T[]>([]); // Replace with your actual product data
  const lastDoc = useCopyState<T | null>(null);
  const hasMore = useCopyState(true);
  const action = useAction(
    actionName,
    async (next = false) => {
      const list = await callback({
        next,
        lastDoc: lastDoc.get,
        hasMore: hasMore.get,
        PAGE_SIZE,
      });
      if (!list) {
        return;
      }
      data.set((prev) => (next ? [...prev, ...list] : list));
      const lastDocRef = list.at(-1);
      lastDoc.set(lastDocRef ? lastDocRef : null);
      hasMore.set(list.length === PAGE_SIZE);
    },
    [...deps, lastDoc.get, hasMore.get]
  );
  return {
    data,
    lastDoc,
    hasMore,
    action,
    fetchMore() {
      execAction(actionName, true);
    },
    fetchInit() {
      execAction(actionName, false);
    },
  };
}

export interface ConfigForm<T extends keyof Biqpod.System.Setting.Config> {
  value: Biqpod.System.Setting.Config[T];
  onChange: (value: Biqpod.System.Setting.Config[T]) => void;
}

export const getPrice = (product?: SnapBuy.Product | Nothing, count = 1) => {
  var total = 0;
  var choised:
    | null
    | Required<Required<SnapBuy.Product>["multiple"]>["prices"][number] = null;
  var price: null | number = null;
  if (!product) {
    return {
      total,
      choised,
      price,
    };
  }
  if (product.type === "multiple") {
    var prices = mergeArray(product.multiple?.prices).flat();
    choised =
      prices
        ?.sort((a, b) => {
          return b.quantity - a.quantity;
        })
        ?.find((price) => price.quantity <= count) || null;
    price = choised?.price || 0;
    total = price * count;
  } else {
    price = product.single?.client || 0;
    total = price * count;
  }
  return {
    total,
    price,
    choised,
  };
};

export const useStoreId = () => {
  return getTemp<string>("storeId");
};

export const getStoreId = () => {
  return getTempFromStore<string>("storeId");
};

// Generate random metadata for customers
export const generateRandomCustomerMetadata = (): Record<string, any> => {
  const preferences = [
    "electronic",
    "fashion",
    "home",
    "sports",
    "books",
    "beauty",
    "automotive",
  ];
  const sources = [
    "google",
    "facebook",
    "instagram",
    "referral",
    "direct",
    "email",
    "tiktok",
  ];
  const devices = ["mobile", "desktop", "tablet"];
  const browsers = ["chrome", "safari", "firefox", "edge"];
  const locations = [
    "Algiers",
    "Oran",
    "Constantine",
    "Setif",
    "Batna",
    "Djelfa",
    "Sidi Bel Abbes",
  ];

  return {
    age: Math.floor(Math.random() * 50) + 18, // 18-67 years old
    gender: Math.random() > 0.5 ? "male" : "female",
    preferences: preferences
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1), // 1-3 preferences
    source: sources[Math.floor(Math.random() * sources.length)],
    device: devices[Math.floor(Math.random() * devices.length)],
    browser: browsers[Math.floor(Math.random() * browsers.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    loyaltyScore: Math.floor(Math.random() * 100), // 0-99
    totalOrders: Math.floor(Math.random() * 20), // 0-19 previous orders
    averageOrderValue: Math.floor(Math.random() * 5000) + 500, // 500-5500 DA
    lastActivity:
      Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
    newsletter: Math.random() > 0.3, // 70% subscribed to newsletter
    language:
      Math.random() > 0.7
        ? "french"
        : Math.random() > 0.5
        ? "arabic"
        : "english",
  };
};
