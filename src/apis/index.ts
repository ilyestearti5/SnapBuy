import {
  getTemp,
  getTempFromStore,
  setTemp,
  useAsyncMemo,
} from "@biqpod/app/ui/hooks";
import {
  deleteDoc,
  getCurrentAuth,
  getDoc,
  getDocs,
  getDownloadURL,
  onDocSnapshot,
  setDoc,
  uploadFile,
} from "../server";
import { Biqpod } from "@biqpod/app/ui/types";
import {
  and,
  getFunction,
  getUserFunction,
  orderBy,
  where,
} from "@biqpod/app/ui/apis";
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
export type Duration = keyof PlanRecord["duration"];
export const api = {
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
  async follow(followed: string) {
    const doFollow = await getUserFunction<{
      followed: string;
    }>("snapbuy-follow");
    await doFollow?.({
      followed,
    });
  },
  async unfollow(followed: string) {
    const doUnfollow = await getUserFunction<{
      followed: string;
    }>("snapbuy-unfollow");
    await doUnfollow?.({
      followed,
    });
  },
  async isFollowing(followed: string) {
    const isFollowing = await getUserFunction<boolean>("snapbuy-is-following");
    return isFollowing?.({
      followed,
    });
  },
  async getOrder(orderId: string) {
    const fn = await getUserFunction<SnapBuy.Order>("snapbuy-get-order");
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
      const photos = await mapAsync(images, async (photo) => {
        if (photo.startsWith("data:")) {
          const blob = await fetch(photo).then((s) => s.blob());
          const ref = [
            "projects",
            import.meta.env.VITE_PROJECT_ID,
            "products",
            product.id + " " + Date.now(),
          ];
          await uploadFile(ref, blob);
          const result = await getDownloadURL(ref);
          return result!;
        } else {
          return photo;
        }
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
    const deleteProduct = await getUserFunction("snapbuy-delete-product");
    await deleteProduct?.({
      id: productId,
    });
  },
  async createOrder(order: CreateOrderOptions) {
    const createOrder = await getUserFunction("snapbuy-create-order");
    await createOrder?.(order);
  },
  async getOrderProducts(orderId: string) {
    interface ProductsResult extends SnapBuy.Product {
      count: number;
      price: number;
    }
    const fn = await getUserFunction<ProductsResult[]>(
      "snapbuy-get-order-products"
    );
    const products = await fn?.({
      orderId,
    });
    return products;
  },
  async todayOrdersCount() {
    const fn = await getUserFunction<number>("snapbuy-get-today-orders-count");
    const result = await fn?.({});
    return result;
  },
  async getPlans() {
    const getPlans = await getFunction<Plan>("snapbuy-get-plans");
    const result = await getPlans?.({});
    return result;
  },
  async subscribe(plan: keyof Plan, duration: Duration) {
    const snapbuySub = await getUserFunction<{ url: string }>(
      "snapbuy-subscribe"
    );
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
    const snapbuySub = await getUserFunction<{
      isSubscribed: boolean;
    }>("check-user-subscribed");
    const result = await snapbuySub?.({
      projectId: import.meta.env.VITE_PROJECT_ID,
    });
    return !!result?.isSubscribed;
  },
  async getSales() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const getSales = await getUserFunction<number[]>(
      "snapbuy-get-sales-of-week"
    );
    const sales = await getSales?.({});
    return sales?.map((s, index) => {
      return {
        day: days[index],
        sales: s,
      };
    });
  },
  async getOverview(): Promise<OverviewProps | undefined> {
    await delay(1500);
    const getOverview = await getUserFunction<OverviewProps>(
      "snapbuy-get-overview"
    );
    const result = await getOverview?.({});
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
    return api.getCategories();
  }, []);
};
export const useMarkets = () => {
  return getTemp<string[]>("markets");
};
export const useFocused = () => {
  return getTemp<string>("input.focused");
};
