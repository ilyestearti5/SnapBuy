import {
  getFieldValue,
  getTemp,
  getTempFromStore,
  setFieldValue,
  setTemp,
  useAsyncMemo,
  useTemp,
} from "@biqpod/app/ui/hooks";
import {
  deleteDoc,
  functions,
  getCurrentAuth,
  getDoc,
  getDocs,
  getDownloadURL,
  onDocSnapshot,
  setDoc,
  uploadFile,
} from "../server";
import { Biqpod, Nothing, SettingValueType } from "@biqpod/app/ui/types";
import { and, orderBy, Path, where } from "@biqpod/app/ui/apis";
import {
  delay,
  mapAsync,
  mergeArray,
  unpackPromise,
} from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { useField } from "../Links/NewProduct/NewProduct";
export interface OverviewProps {
  orders: number;
  customers: number;
  totalSales: number;
}
export interface PlanRecord {
  duration: {
    week: number;
    month: number;
    year: number;
  };
  features: string[];
}
export interface Plan {
  basic: PlanRecord;
  pro: PlanRecord;
  company: PlanRecord;
}
export interface CreateOrderOptions {
  products: SnapBuy.Order["products"];
  client: SnapBuy.Client;
  key: string;
  delivery: boolean;
}
export const buildFunction = (name: string) => {
  return {
    getUserFunction: async <T, R = any>(fnId: string) => {
      return await functions.getUserFunction<T, R>([name, fnId].join("-"));
    },
    getFunction: async <T, R = any>(fnId: string) => {
      return await functions.getFunction<T, R>([name, fnId].join("-"));
    },
  };
};
const { getUserFunction, getFunction } = buildFunction("snapbuy");
const uploadFiles = async (
  images: string[],
  collection: (index: number) => Path
) => {
  const photos = await mapAsync(images, async (photo, index) => {
    if (photo.startsWith("data:")) {
      const blob = await fetch(photo).then((s) => s.blob());
      const ref = [
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        collection(index),
      ];
      await uploadFile(ref, blob);
      const result = await getDownloadURL(ref);
      return result!;
    } else {
      return photo;
    }
  });
  return photos;
};
interface Action {
  name: string;
  params: string[];
  description: string;
}

interface GetExploreStoresOptions {
  limit?: number;
  startAt?: string;
  orderBy?: keyof SnapBuy.Store;
  orderDir?: "asc" | "desc";
  useRecommendations?: boolean;
}

export type Duration = keyof PlanRecord["duration"];
export const snapbuyApi = {
  async getProduct(productId: string) {
    const product = getTempFromStore<SnapBuy.Product>("products." + productId);
    if (!product) {
      const doc = await getDoc<SnapBuy.Product>([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "products",
        productId,
      ]);
      if (doc) {
        setTemp("products." + productId, doc);
      }
      return doc;
    }
    return product;
  },
  async getAllProducts() {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const products = await getDocs<SnapBuy.Product>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "products"],
      {
        where: and(where("uid", "==", uid)),
      }
    );
    return (
      products?.map((product) => ({ ...product.data, id: product.id })) || []
    );
  },
  async addStore(store: SnapBuy.Store) {
    const {
      address = null,
      name = null,
      deliveryPrice = 0,
      phone = null,
      photo = null,
    } = store;
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    var image: string | null = null;
    const ref = [
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "stores",
      store.id,
    ];
    const data = await getDoc(ref);
    if (data) {
      throw "THIS STORE IS USED";
    }
    if (photo) {
      const [file] = await uploadFiles([photo], () => {
        return ["stores", store.id];
      });
      image = file;
    }
    await setDoc(ref, {
      id: store.id,
      address,
      name,
      phone,
      photo: image,
      uid,
      deliveryPrice,
    });
  },
  deleteStore: async (id: string) => {
    const fn = await getUserFunction("delete-store");
    await fn?.({
      id,
    });
  },
  async deleteAccount(accountId: string) {
    await deleteDoc([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "accounts",
      accountId,
    ]);
  },
  async updateStore(storeId: string, store: Partial<SnapBuy.Store>) {
    const {
      address = null,
      name = null,
      deliveryPrice = 0,
      phone = null,
      photo = null,
    } = store;
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    var image: string | null = null;
    if (photo) {
      const [file] = await uploadFiles([photo], () => {
        return ["stores", storeId];
      });
      image = file;
    }
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "stores", storeId],
      {
        id: storeId,
        address,
        name,
        phone,
        photo: image,
        uid,
        deliveryPrice,
      }
    );
  },
  async upsertAccount(account: SnapBuy.Account) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const { id = crypto.randomUUID(), ...rest } = account;
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "accounts", id],
      {
        ...rest,
        id,
        uid,
      }
    );
  },
  async getStores() {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const stores = await getDocs<SnapBuy.Store>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "stores"],
      {
        where: and(where("uid", "==", uid)),
      }
    );
    return stores?.map((store) => ({ ...store.data })) || [];
  },

  async getStore(storeId: string) {
    const store = getTempFromStore<SnapBuy.Store>("stores." + storeId);
    if (store) {
      return store;
    }
    const doc = await getDoc<SnapBuy.Store>([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "stores",
      storeId,
    ]);
    if (doc) {
      setTemp("stores." + storeId, doc);
    }
    return doc;
  },
  async getStoresOf(uid: string) {
    const stores = await getDocs<SnapBuy.Store>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "stores"],
      {
        where: and(where("uid", "==", uid)),
      }
    );
    return stores?.map((store) => ({ ...store.data, id: store.id })) || [];
  },
  async follow(followed: string) {
    const doFollow = await getUserFunction<{
      followed: string;
    }>("follow");
    await doFollow?.({
      followed,
    });
  },
  async unfollow(followed: string) {
    const doUnfollow = await getUserFunction<{
      followed: string;
    }>("unfollow");
    await doUnfollow?.({
      followed,
    });
  },
  async isFollowing(followed: string) {
    const isFollowing = await getUserFunction<boolean>("is-following");
    return isFollowing?.({
      followed,
    });
  },
  async getOrder(orderId: string) {
    const fn = await getUserFunction<SnapBuy.Order>("get-order");
    const order = await fn?.({
      orderId,
    });
    return order;
  },
  async getFollowed(limit?: number, from?: SnapBuy.Follow | null) {
    var uid = await getCurrentAuth();
    if (!uid) {
      throw "User not authenticated";
    }
    const follows = await getDocs<SnapBuy.Follow>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "follows"],
      {
        where: and(where("follower", "==", uid), where("follow", "==", true)),
        limit,
        startAt: from?.followed && mergeArray(from?.followed),
        orders: [orderBy("followed", "desc")],
      }
    );
    return mapAsync(follows || [], async (follow) => {
      const followed = follow.data.followed;
      const user = await getDoc<Biqpod.Account.User>(["users", followed]);
      if (user) {
        setTemp("users." + followed, user);
      }
      return {
        user,
        follow: follow.data,
      };
    });
  },
  async upsertProducts(
    storeId: string,
    products: Partial<SnapBuy.Product>[],
    onBeforeStart?: (
      product: Partial<SnapBuy.Product>,
      index: number
    ) => void | Promise<void>
  ) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const projectInfo = await getDoc<SnapBuyApi>([
      "users",
      uid,
      "projects",
      import.meta.env.VITE_PROJECT_ID,
    ]);
    const categorys = projectInfo?.categorys || [];
    await mapAsync(products, async (product, index) => {
      var {
        available = false,
        category = null,
        colors = [],
        description = null,
        id: prodId,
        keys = [],
        limited = false,
        photos: images = [],
        quantity = null,
        sizes = [],
        theme = {},
        type = "single",
        ...rest
      } = product;
      await unpackPromise(() => {
        return onBeforeStart?.(product, index);
      });
      !categorys.includes(category) && categorys.push(category);
      const photos = await uploadFiles(images, (index) => {
        return ["products", prodId + " " + Date.now(), "photos", "" + index];
      });
      await setDoc(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products", prodId],
        {
          ...rest,
          available,
          category,
          colors,
          description,
          id: prodId,
          keys,
          limited,
          photos,
          quantity,
          sizes,
          theme,
          type,
          uid,
          storeId,
        }
      );
    });
    await setDoc(["users", uid, "projects", import.meta.env.VITE_PROJECT_ID], {
      categorys,
    });
  },
  onCategoryAndMarketChange(uid: string) {
    if (!uid) {
      return () => {};
    }
    return onDocSnapshot<SnapBuyApi>(
      ["users", uid, "projects", import.meta.env.VITE_PROJECT_ID],
      (records) => {
        const markets = records?.markets;
        const categorys = records?.categorys;
        setTemp("markets", markets);
        setTemp("categorys", categorys);
      }
    );
  },
  async deleteProduct(productId: string) {
    const deleteProduct = await getUserFunction("delete-product");
    await deleteProduct?.({
      id: productId,
    });
  },
  async createOrder(order: CreateOrderOptions) {
    const createOrder = await getFunction("create-order");
    await createOrder?.(order);
  },
  async getOrderProducts(orderId: string) {
    interface ProductsResult extends SnapBuy.Product {
      count: number;
      price: number;
    }
    const order = getTempFromStore<ProductsResult[]>(
      "order-products." + orderId
    );
    if (order) {
      return order;
    }
    const fn = await getUserFunction<ProductsResult[]>("get-order-products");
    const products = await fn?.({
      orderId,
    });
    setTemp("order-products." + orderId, products || []);
    return products;
  },
  async todayOrdersCount(storeId: string) {
    const fn = await getUserFunction<number>("get-today-orders-count");
    const result = await fn?.({
      storeId,
    });
    return result;
  },
  async getPlans() {
    const plans = getTempFromStore<Plan>("plans");
    if (plans) {
      return plans;
    }
    const getPlans = await getFunction<Plan>("get-plans");
    const result = await getPlans?.({});
    result && setTemp("plans", result);
    return result;
  },
  async subscribe(plan: keyof Plan, duration: Duration) {
    const snapbuySub = await getUserFunction<{ url: string }>("subscribe");
    const result = await snapbuySub?.({
      plan,
      duration,
    });
    if (result?.url) {
      const a = document.createElement("a");
      a.href = result.url;
      a.target = "_blank";
      a.click();
    }
  },
  async isSubscribed() {
    const uid = await getCurrentAuth();
    if (!uid) {
      return undefined;
    }
    const snapbuySub = await functions.getUserFunction<{
      isSubscribed: boolean;
      label?: string;
      duration?: number;
    }>("check-user-subscribed");
    const result = await snapbuySub?.({
      projectId: import.meta.env.VITE_PROJECT_ID,
    });
    return result;
  },
  async getSales(storeId: string) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const getSales = await getUserFunction<number[]>("get-sales-of-week");
    const sales = await getSales?.({
      storeId,
    });
    return sales?.map((s, index) => {
      return {
        day: days[index],
        sales: s,
      };
    });
  },
  async getOverview(storeId: string): Promise<OverviewProps | undefined> {
    await delay(1500);
    const getOverview = await getUserFunction<OverviewProps>("get-overview");
    const result = await getOverview?.({
      storeId,
    });
    return result || undefined;
  },
  async getCategories() {
    return [
      {
        category: "Food",
        emoji: "🍔",
      },
      {
        category: "Travel",
        emoji: "✈️",
      },
      {
        category: "Technology",
        emoji: "💻",
      },
      {
        category: "Sports",
        emoji: "⚽",
      },
      {
        category: "Music",
        emoji: "🎵",
      },
      {
        category: "Books",
        emoji: "📚",
      },
      {
        category: "Movies",
        emoji: "🎬",
      },
      {
        category: "Fashion",
        emoji: "👗",
      },
      {
        category: "Health",
        emoji: "⚕️",
      },
      {
        category: "Animals",
        emoji: "🐶",
      },
      {
        category: "Home",
        emoji: "🏠",
      },
      {
        category: "Work",
        emoji: "💼",
      },
      {
        category: "Finance",
        emoji: "💰",
      },
      {
        category: "Games",
        emoji: "🎮",
      },
      {
        category: "Gardening",
        emoji: "🪴",
      },
    ];
  },
  async getAIActions() {
    const savedActions = getTempFromStore<Action[]>("ai-actions");
    if (Array.isArray(savedActions)) {
      return savedActions;
    }
    const getActions = await getFunction<Action[]>("get-actions");
    const actions = await getActions?.({});
    setTemp("ai-actions", actions || []);
    return actions || [];
  },
  async getExploreStores(options: GetExploreStoresOptions) {
    const action = await getUserFunction<
      SnapBuy.Store[],
      GetExploreStoresOptions
    >("get-explore-stores");
    const result = await action?.(options);
    return result || [];
  },
  async interpretCommand(command: string) {
    interface ActionInterpret {
      action: string;
      params?: Record<string, string | number | undefined>;
    }
    const interpret = await getFunction<ActionInterpret, { command: string }>(
      "interpret-command"
    );
    return await interpret?.({
      command,
    });
  },
  async generateProductDescription(product: Partial<SnapBuy.Product>) {
    const generateDescription = await getFunction<
      string,
      Partial<SnapBuy.Product>
    >("generate-product-description");
    return await generateDescription?.(product);
  },
  async addPack(pack: SnapBuy.Pack) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const { id = crypto.randomUUID(), ...rest } = pack;
    await setDoc(["projects", import.meta.env.VITE_PROJECT_ID, "packs", id], {
      ...rest,
      id,
      uid,
    });
  },
  async updatePack(packId: string, pack: SnapBuy.Pack) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const { id = packId, ...rest } = pack;
    await setDoc(["projects", import.meta.env.VITE_PROJECT_ID, "packs", id], {
      ...rest,
      id,
      uid,
    });
  },
  async getPacks(storeId: string) {
    const packs = await getDocs<SnapBuy.Pack>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "packs"],
      {
        where: and(where("storeId", "==", storeId)),
      }
    );
    return packs?.map((pack) => ({ ...pack.data, id: pack.id })) || [];
  },
  async getPack(packId: string) {
    const pack = getTempFromStore<SnapBuy.Pack>("packs." + packId);
    if (pack) {
      return pack;
    }
    const doc = await getDoc<SnapBuy.Pack>([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "packs",
      packId,
    ]);
    if (doc) {
      setTemp("packs." + packId, doc);
    }
    return doc;
  },
  // account config auth
};
export const useCategories = () => {
  return useAsyncMemo(async () => {
    return snapbuyApi.getCategories();
  }, []);
};
export const useMarkets = () => {
  return getTemp<string[]>("markets");
};
export const useFocused = () => {
  return getTemp<string>("input.focused");
};
export const useFormProduct = () => {
  const photos = getFormPhotos();
  const price = getFormPrice();
  const category = getFormCategory();
  const limited = getFormLimited();
  const prices = getFormPrices();
  const quantity = getFormQuantity();
  const description = getFormDescription();
  const name = getFormName();
  const theme = getFormTheme();
  const colorsState = getFormColors();
  const sizesState = getFormSizes();
  const keysState = getFormKeys();
  const isAvailable = getFormAvailable();
  const type = getFormType();
  const product = useMemo(() => {
    const result: Partial<SnapBuy.Product> = {
      photos: photos || [],
      type: type || "single",
      name: name || "",
      available: isAvailable || false,
      theme: theme || {},
      colors: colorsState || [],
      sizes: sizesState || [],
      keys: keysState || [],
      quantity: quantity || 0,
      description: description || "",
      limited: limited || false,
      category: category || "",
    };
    if (type === "multiple") {
      result.multiple = {
        prices: prices || [],
      };
    } else {
      result.single = {
        price: price || 0,
      };
    }
    return result;
  }, [
    photos,
    price,
    category,
    limited,
    prices,
    quantity,
    description,
    name,
    theme,
    colorsState,
    sizesState,
    keysState,
    isAvailable,
    type,
  ]);
  return product;
};
export const getFormPhotos = () => {
  return getTemp<string[]>("product-images");
};
export const getFormPrice = () => {
  return getTemp<number>("product-price");
};
export const getFormCategory = () => {
  return getTemp<string>("post-category");
};
export const getFormLimited = () => {
  return getTemp<boolean>("product-limited");
};
export const getFormPrices = () => {
  return getTemp<Required<SnapBuy.Product>["multiple"]["prices"] | undefined>(
    "product-prices"
  );
};
export const getFormQuantity = () => {
  return getTemp<number>("post-quantity");
};
export const getFormDescription = () => {
  return getFieldValue("product-form-description");
};
export const getFormName = () => {
  return getFieldValue("product-form-name");
};
export const getFormTheme = () => {
  return getTemp<SnapBuy.Product["theme"]>("product-choised-theme");
};
export const getFormColors = () => {
  return getTemp<string[]>("post-colors");
};
export const getFormSizes = () => {
  return getTemp<SettingValueType["filter"]>("post-sizes");
};
export const getFormKeys = () => {
  return getTemp<SettingValueType["array"]>("post-keys");
};
export const getFormAvailable = () => {
  return getTemp<boolean>("product-form-available");
};
export const getFormType = () => {
  return getTemp<"single" | "multiple">("post-type");
};
export const setFormPhotos = (photos: string[]) => {
  setTemp("product-images", photos);
};
export const setFormPrice = (price: number) => {
  setTemp("product-price", price);
};
export const setFormCategory = (category: string) => {
  setTemp("post-category", category);
};
export const setFormLimited = (limited: boolean) => {
  setTemp("product-limited", limited);
};
export const setFormPrices = (
  prices: Required<SnapBuy.Product>["multiple"]["prices"] | undefined
) => {
  setTemp("product-prices", prices);
};
export const setFormQuantity = (quantity: number) => {
  setTemp("post-quantity", quantity);
};
export const setFormDescription = (description: string) => {
  setFieldValue("product-form-description", description);
};
export const setFormName = (name: string) => {
  setFieldValue("product-form-name", name);
};
export const setFormTheme = (theme: SnapBuy.Product["theme"]) => {
  setTemp("product-choised-theme", theme);
};
export const setFormColors = (colors: string[]) => {
  setTemp("post-colors", colors);
};
export const setFormSizes = (sizes: SettingValueType["filter"]) => {
  setTemp("post-sizes", sizes);
};
export const setFormKeys = (keys: SettingValueType["array"]) => {
  setTemp("post-keys", keys);
};
export const setFormAvailable = (available: boolean) => {
  setTemp("product-form-available", available);
};
export const setFormType = (type: "single" | "multiple") => {
  setTemp("post-type", type);
};

export const useFormName = () => {
  return useField("product-form-name");
};
export const useFormDescription = () => {
  return useField("product-form-description");
};
export const useFormCategory = () => {
  return useTemp<string | Nothing>("post-category");
};
export const useFormLimited = () => {
  return useTemp<boolean>("product-limited");
};
export const useFormPrice = () => {
  return useTemp<number | undefined>("product-price");
};
export const useFormPrices = () => {
  return useTemp<Required<SnapBuy.Product>["multiple"]["prices"] | undefined>(
    "product-prices"
  );
};
export const useFormQuantity = () => {
  return useTemp<number | undefined>("post-quantity");
};
export const useFormTheme = () => {
  return useTemp<SnapBuy.Product["theme"]>("product-choised-theme");
};
export const useFormColors = () => {
  return useTemp<string[]>("post-colors");
};
export const useFormSizes = () => {
  return useTemp<SettingValueType["filter"]>("post-sizes");
};
export const useFormKeys = () => {
  return useTemp<SettingValueType["array"]>("post-keys");
};
export const useFormAvailable = () => {
  return useTemp<boolean>("product-form-available");
};
export const useFormType = () => {
  return useTemp<"single" | "multiple">("post-type");
};
export const useFormPhotos = () => {
  return useTemp<string[]>("product-images");
};
