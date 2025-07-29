import {
  getFieldValue,
  getTemp,
  getTempFromStore,
  setFieldValue,
  setTemp,
  useAsyncMemo,
  useTemp,
  useFieldValue,
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
import { and, createDoc, or, orderBy, Path, where } from "@biqpod/app/ui/apis";
import {
  delay,
  mapAsync,
  mergeArray,
  unpackPromise,
} from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { SnapBuyCollection, SnapBuyProp } from "../Forms/Orders/OrderIndex";
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
  delivery: boolean;
  metaData?: Record<string, SettingValueType>;
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
  async getZone(zoneId: string) {
    return getDoc<SnapBuy.Zone>([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "zones",
      zoneId,
    ]);
  },
  async setPixelId(storeId: string, id: SnapBuy.PixelId, value: string | null) {
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "stores", storeId],
      {
        pixels: {
          [id]: value,
        },
      }
    );
  },
  async getProductsOfCollection(collection: string | SnapBuy.Collection) {
    const collectionDoc =
      typeof collection === "string"
        ? await this.getCollection(collection)
        : collection;
    const products = await mapAsync(
      collectionDoc?.products || [],
      async (prodId) => {
        const product = await this.getProduct(prodId);
        return product!;
      }
    );
    return products;
  },
  async getCollection(collectionId: string) {
    const doc = await getDoc<SnapBuy.Collection>([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "collections",
      collectionId,
    ]);
    return doc;
  },
  async submitStore(storeId: string, stars: number) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    await setDoc(
      [
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "stores",
        storeId,
        "stars",
        uid,
      ],
      {
        value: stars,
      }
    );
  },
  async getStoresStars(storeId: string, stars: number) {
    const result = await getDocs<{}>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "stores", storeId],
      {
        where: and(where("stars", "==", stars)),
      }
    );
    return result?.length;
  },
  async upsertCollection(props: SnapBuy.Collection) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "collections", props.id],
      {
        ...props,
        uid,
      }
    );
  },
  async deleteCollection(collectionId: string) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    await deleteDoc([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "collections",
      collectionId,
    ]);
  },
  async getCollections(storeId: string) {
    const collections = await getDocs<SnapBuy.Collection>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "collections"],
      {
        where: and(where("storeId", "==", storeId)),
      }
    );
    return (
      collections?.map((collection) => ({
        ...collection.data,
        id: collection.id,
      })) || []
    );
  },
  async getSinglePack(storeId: string) {
    const packs = await getDocs<SnapBuy.Pack>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "packs"],
      {
        where: and(where("storeId", "==", storeId)),
        limit: 1,
      }
    );
    return packs?.at(0);
  },
  async setStorePixels(storeId: string, pixels: SnapBuy.Store["pixels"]) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "stores", storeId],
      {
        pixels,
      }
    );
  },
  async ordersWillDeletingAfter7Day(storeId: string) {
    const time = new Date();
    time.setMonth(time.getMonth() - 3);
    time.setDate(time.getDate() + 7);
    const orders = await getDocs<SnapBuy.Order>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "orders"],
      {
        where: and(
          where("storeId", "==", storeId),
          where("createdAt", "<=", time.getTime())
        ),
      }
    );
    return orders?.map(({ data }) => {
      const dataTime = new Date(data.createdAt || 0);
      const resetDays = time.getDay() - dataTime.getDay();
      return {
        data,
        resetDays,
        dataTime,
      };
    });
  },
  async todayDeliverys() {
    const fn = await getUserFunction<SnapBuy.Order[]>("today-deliverys");
    const result = await fn?.({});
    return result;
  },
  async getDeliveryOverview() {
    const fn = await getUserFunction<OverviewProps>("get-delivery-overview");
    const result = await fn?.({});
    return result || undefined;
  },
  async getDeliverysSales() {
    const fn = await getUserFunction<number[]>("get-deliverys-sales");
    const result = await fn?.({});
    return result || [];
  },
  async addZone(zone: SnapBuy.Zone) {
    const uid = await getCurrentAuth();
    const zoneId = crypto.randomUUID();
    await createDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "zones", zoneId],
      {
        id: zoneId,
        ...zone,
        uid,
      }
    );
  },
  async getZonesLinkTo(zoneId: string) {
    const docs = await getDocs<SnapBuy.LinkZone>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "zone-links"],
      {
        where: or(where("first", "==", zoneId), where("second", "==", zoneId)),
      }
    );
    return docs?.map((doc) => doc.data) || [];
  },
  async linkZone(firstZone: string, secondZone: string, price: number) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const zoneId = `${firstZone}+${secondZone}`;
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "zone-links", zoneId],
      {
        id: zoneId,
        first: firstZone,
        second: secondZone,
        price,
        uid,
      }
    );
  },
  async deleteLinkZone(linkId: string) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    await deleteDoc([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "zone-links",
      linkId,
    ]);
  },
  async deleteZone(zoneId: string) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    await deleteDoc([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "zones",
      zoneId,
    ]);
    const zones = await this.getZonesLinkTo(zoneId);
    await mapAsync(zones, async (zone) => {
      await this.deleteLinkZone(zone.id!);
    });
  },
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
    const { address = null, name = null, phone = null, photo = null } = store;
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
  async getProductsOf(storeId: string) {
    const products = await getDocs<SnapBuy.Product>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "products"],
      {
        where: and(where("storeId", "==", storeId)),
      }
    );
    const result = products?.map(({ data }) => data);
    result?.forEach((prod) => {
      setTemp("products." + prod.id, prod);
    });
    return result;
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
    await mapAsync(products, async (product, index) => {
      var {
        available = null,
        category = null,
        description = null,
        id: prodId,
        keys = null,
        limited = null,
        photos: images = null,
        quantity = null,
        type = "single",
        ...rest
      } = product;
      await unpackPromise(() => {
        return onBeforeStart?.(product, index);
      });
      const photos = images
        ? await uploadFiles(images, (index) => {
            return [
              "products",
              prodId + " " + Date.now(),
              "photos",
              index.toString(),
            ];
          })
        : null;
      const options = {
        ...rest,
        available,
        category,
        description,
        id: prodId,
        keys,
        limited,
        photos,
        quantity,
        type,
        uid,
        storeId,
      };
      await setDoc(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products", prodId],
        options
      );
      setTemp("products." + prodId, options);
    });
  },
  forms: {
    async upsertCollection(collection: SnapBuyCollection) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      const { id = crypto.randomUUID(), ...rest } = collection;
      const docs = await getDocs<SnapBuyCollection>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "props-collections"],
        {
          where: and(
            where("storeId", "==", rest.storeId),
            where("name", "==", rest.name)
          ),
          limit: 1,
        }
      );
      const collectionInfo = docs?.at(0);
      if (collectionInfo) {
        if (collectionInfo.id !== id) {
          throw "Collection with this name already exists";
        }
      }
      await setDoc(
        ["projects", import.meta.env.VITE_PROJECT_ID, "props-collections", id],
        {
          ...rest,
          id,
          uid,
        }
      );
    },
    async getCollections(type?: SnapBuyCollection["type"]) {
      const uid = getCurrentAuth();
      if (!uid) {
        throw "User not authenticated";
      }
      const result = await getDocs<SnapBuyCollection>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "props-collections"],
        {
          where: and(type && where("type", "==", type)),
        }
      );
      return result?.map(({ data }) => data) || [];
    },
    async getCollection(collectionId: string) {
      const result = await getDoc<SnapBuyCollection>([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "props-collections",
        collectionId,
      ]);
      return result;
    },
    async getCollectionPropertys(collectionId: string) {
      const result = await getDocs<SnapBuyProp>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "props"],
        {
          where: and(where("collectionId", "==", collectionId)),
        }
      );
      return result?.map(({ data }) => data) || [];
    },
    async deleteCollectionProperty(propId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await deleteDoc([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "props",
        propId,
      ]);
    },
    async deleteCollection(collectionId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await deleteDoc([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "props-collections",
        collectionId,
      ]);
      const props = await this.getCollectionPropertys(collectionId);
      await mapAsync(props, async (prop) => {
        this.deleteCollectionProperty(prop.id!);
      });
    },
    async createProperty(option: SnapBuyProp) {
      await createDoc(
        ["projects", import.meta.env.VITE_PROJECT_ID, "props", option.id],
        option
      );
    },
    async getProperty(id: string) {
      const property = getTempFromStore<SnapBuyProp>("props." + id);
      if (property) {
        return property;
      }
      const doc = await getDoc<SnapBuyProp>([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "props",
        id,
      ]);
      if (doc) {
        setTemp("props." + id, doc);
      }
      return doc;
    },
    async getAllPropertys(storeId: string) {
      const allData = await getDocs<SnapBuyProp>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "props"],
        {
          where: and(where("storeId", "==", storeId)),
        }
      );
      return allData?.map(({ data }) => data);
    },
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
    setTemp("products." + productId, null);
  },
  async createOrder(order: CreateOrderOptions) {
    const createOrder = await getFunction<{ id: string }, CreateOrderOptions>(
      "create-order"
    );
    return await createOrder?.(order);
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
  async saveProducts(storeId: string) {
    const fn = await getUserFunction<{ url: string; count: number }>(
      "save-products"
    );
    const uid = await getCurrentAuth();
    if (!uid) throw "USER NOT AUTHENTICATED";
    return await fn?.({
      storeId,
    });
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
  async getAccount(accountId: string) {
    const account = getTempFromStore<SnapBuy.Account>("accounts." + accountId);
    if (account) {
      return account;
    }
    const doc = await getDoc<SnapBuy.Account>([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "accounts",
      accountId,
    ]);
    if (doc) {
      setTemp("agents." + accountId, doc);
    }
    return doc;
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
  async getDeliveryOrders(options?: {
    status?: string;
    limit?: number;
    startAt?: number;
  }) {
    const uid = await getCurrentAuth();
    const { limit = 20, status, startAt } = options || {};
    const conditions = [where("deliveryId", "==", uid)];
    if (status && status !== "all") {
      conditions.push(where("status", "==", status));
    }
    const orders = await getDocs<SnapBuy.Order>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "orders"],
      {
        where: and(...conditions),
        orders: [orderBy("createdAt", "asc")],
        limit,
        startAt: startAt ? [startAt] : undefined,
      }
    );
    return orders?.map((order) => ({ ...order.data, id: order.id })) || [];
  },
  async setDeliveryToOrder(options: {
    orderId: string;
    delivery: string | null;
  }) {
    const { orderId, delivery } = options;
    const fn = await getUserFunction("set-delivery-to-order");
    await fn?.({
      orderId,
      delivery,
    });
  },
  async assignDeliveryAgent(orderId: string, agentId: string) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    // Get existing order data
    const existingOrder = await getDoc<SnapBuy.Order>([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "orders",
      orderId,
    ]);
    if (!existingOrder) throw "Order not found";
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "orders", orderId],
      {
        ...existingOrder,
        delivery: {
          uid,
          agentId,
        },
        assignedAt: Date.now(),
      }
    );
  },
  async getDeliveryAgents() {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const agents = await getDocs<SnapBuy.Account>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "accounts"],
      {
        where: and(
          where("uid", "==", uid),
          where("role", "==", "delivery_agent")
        ),
      }
    );
    return agents?.map((agent) => ({ ...agent.data, id: agent.id })) || [];
  },
  async getDeliveryStats(storeId: string) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const getDeliveryStats = await getUserFunction<{
      totalDeliveries: number;
      pendingDeliveries: number;
      completedDeliveries: number;
      deliveryRevenue: number;
    }>("get-delivery-stats");
    return await getDeliveryStats?.({ storeId });
  },
  async updateDeliveryPrice(storeId: string, deliveryPrice: number) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    // Get existing store data
    const existingStore = await getDoc<SnapBuy.Store>([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "stores",
      storeId,
    ]);
    if (!existingStore) throw "Store not found";
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "stores", storeId],
      { ...existingStore, deliveryPrice }
    );
  },
  async deletePack(packId: string) {
    const deletePack = await getUserFunction("delete-pack");
    await deletePack?.({ packId });
  },
};
function getFns<T>(fieldId: string) {
  const get = () => getTemp<T>(fieldId);
  const set = (value: T) => {
    setTemp(fieldId, value);
  };
  const use = () => {
    return useTemp<T>(fieldId);
  };
  return {
    get,
    use,
    set,
  };
}
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
export const {
  get: getFormPrices,
  use: useFormPrices,
  set: setFormPrices,
} = getFns<Required<SnapBuy.Product>["multiple"]["prices"] | undefined>(
  "product-prices"
);
export const {
  get: getFormQuantity,
  set: setFormQuantity,
  use: useFormQuantity,
} = getFns<number | undefined>("post-quantity");
export const getFormDescription = () => {
  return getFieldValue("product-form-description");
};
export const setFormDescription = (value: string) => {
  setFieldValue("product-form-description", value);
};
export const useFormDescription = () => {
  return useFieldValue("product-form-description");
};
export const getFormName = () => {
  return getFieldValue("product-form-name");
};
export const setFormName = (value: string) => {
  setFieldValue("product-form-name", value);
};
export const useFormName = () => {
  return useFieldValue("product-form-name");
};
export const {
  get: getFormKeys,
  set: setFormKeys,
  use: useFormKeys,
} = getFns<SettingValueType["array"]>("post-keys");
export const {
  get: getFormAvailable,
  set: setFormAvailable,
  use: useFormAvailable,
} = getFns<boolean>("product-form-available");
export const {
  get: getFormType,
  set: setFormType,
  use: useFormType,
} = getFns<"single" | "multiple">("post-type");
export const {
  get: getFormCollection,
  set: setFormCollection,
  use: useFormCollection,
} = getFns<string | Nothing>("product-form-collection");
export const {
  get: getFormPhotos,
  set: setFormPhotos,
  use: useFormPhotos,
} = getFns<SnapBuy.Product["photos"]>("product-images");
export const {
  get: getFormPrice,
  set: setFormPrice,
  use: useFormPrice,
} = getFns<number | undefined>("product-price");
export const {
  get: getFormCategory,
  set: setFormCategory,
  use: useFormCategory,
} = getFns<string | Nothing>("product-category");
export const {
  get: getFormLimited,
  use: useFormLimited,
  set: setFormLimited,
} = getFns<boolean>("product-limited");
export const useFormProduct = () => {
  const photos = getFormPhotos();
  const price = getFormPrice();
  const category = getFormCategory();
  const limited = getFormLimited();
  const prices = getFormPrices();
  const quantity = getFormQuantity();
  const description = getFormDescription();
  const name = getFormName();
  const keys = getFormKeys();
  const isAvailable = getFormAvailable();
  const type = getFormType();
  const formCollectionId = getFormCollection();
  const product = useMemo(() => {
    const result: Partial<SnapBuy.Product> = {
      photos: photos || [],
      type: type || "single",
      name: name || "",
      available: isAvailable || false,
      keys: keys || [],
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
    if (formCollectionId) {
      result.formCollectionId = formCollectionId;
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
    keys,
    isAvailable,
    type,
    formCollectionId,
  ]);
  return product;
};
