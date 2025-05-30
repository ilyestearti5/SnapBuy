import {
  getTemp,
  getTempFromStore,
  setTemp,
  useAsyncMemo,
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
import { Biqpod } from "@biqpod/app/ui/types";
import { and, orderBy, Path, where } from "@biqpod/app/ui/apis";
import {
  delay,
  mapAsync,
  mergeArray,
  unpackPromise,
} from "@biqpod/app/ui/utils";
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
    const { address = null, name = null, phone = null, photo = null } = store;
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    var image: string | null = null;
    if (photo) {
      const [file] = await uploadFiles([photo], () => {
        return [
          "projects",
          import.meta.env.VITE_PROJECT_ID,
          "stores",
          store.id,
        ];
      });
      image = file;
    }
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "stores", store.id],
      {
        id: store.id,
        address,
        name,
        phone,
        photo: image,
        uid,
      }
    );
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
    const { address = null, name = null, phone = null, photo = null } = store;
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    var image: string | null = null;
    if (photo) {
      const [file] = await uploadFiles([photo], () => {
        return ["projects", import.meta.env.VITE_PROJECT_ID, "stores", storeId];
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
    return stores?.map((store) => ({ ...store.data, id: store.id })) || [];
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
    const fn = await getUserFunction<ProductsResult[]>("get-order-products");
    const products = await fn?.({
      orderId,
    });
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
    const getPlans = await getFunction<Plan>("get-plans");
    const result = await getPlans?.({});
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
