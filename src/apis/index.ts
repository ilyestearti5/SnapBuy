import { getTempFromStore, setTemp } from "@biqpod/app/ui/hooks";
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
import {
  and,
  createDoc,
  or,
  orderBy,
  Path,
  updateFile,
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
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    var image: string | null = null;
    if (store.photo) {
      const [file] = await uploadFiles([store.photo], () => {
        return ["stores", storeId];
      });
      image = file;
    }
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "stores", storeId],
      {
        id: storeId,
        photo: image,
        ...store,
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
  async getTemplate(id: string) {
    const store = getTempFromStore<SnapBuy.Template>("templates." + id);
    if (store) {
      return store;
    }
    const doc = await getDoc<SnapBuy.Template>([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "templates",
      id,
    ]);
    if (doc) {
      setTemp("templates." + id, doc);
    }
    return doc;
  },
  async createTemplate(template: SnapBuy.Template) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const { id = crypto.randomUUID(), photo, ...rest } = template;
    var pht: string | Nothing;
    if (photo) {
      const blob = await fetch(photo).then((s) => s.blob());
      await updateFile(
        ["projects", import.meta.env.VITE_PROJECT_ID, "templates", id, "photo"],
        blob
      );
      pht = await getDownloadURL([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "templates",
        id,
        "photo",
      ]);
    }
    const options: SnapBuy.Template = {
      ...rest,
      id,
      creatorId: uid,
      createdAt: Date.now(),
    };
    if (pht) {
      options.photo = pht;
    }
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "templates", id],
      options
    );
  },
  async getMyTemplates() {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const templates = await getDocs<SnapBuy.Template>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "templates"],
      {
        where: and(where("creatorId", "==", uid)),
        orders: [orderBy("createdAt", "desc")],
      }
    );
    const allTemplates =
      templates?.map((template) => ({ ...template.data, id: template.id })) ||
      [];
    // Return only the slice for this page
    return allTemplates;
  },
  async getAllTemplates(startAt: string | null = null, limit: number = 10) {
    const templates = await getDocs<SnapBuy.Template>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "templates"],
      {
        where: and(where("status", "==", "accepted")),
        orders: [orderBy("createdAt", "desc")],
        limit,
        startAt: startAt ? [startAt] : undefined,
      }
    );
    return (
      templates?.map((template) => ({ ...template.data, id: template.id })) ||
      []
    );
  },
  async deleteTemplate(templateId: string) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    await deleteDoc([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "templates",
      templateId,
    ]);
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
  onMarketChange(uid: string) {
    if (!uid) {
      return () => {};
    }
    return onDocSnapshot<SnapBuyApi>(
      ["users", uid, "projects", import.meta.env.VITE_PROJECT_ID],
      (records) => {
        const markets = records?.markets;
        setTemp("markets", markets);
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
  // Brand Management Functions
  async createBrand(
    brand: Omit<SnapBuy.Brand, "id" | "createdAt" | "updatedAt">
  ) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";

    const id = crypto.randomUUID();
    const now = Date.now();

    let photo: string | null = null;
    if (brand.photo) {
      const [uploadedPhoto] = await uploadFiles([brand.photo], () => {
        return ["brands", id];
      });
      photo = uploadedPhoto;
    }

    const brandData: SnapBuy.Brand = {
      ...brand,
      id,
      photo: photo || undefined,
      uid,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "brands", id],
      brandData
    );

    setTemp("brands." + id, brandData);
    return brandData;
  },
  async getAllBrands(storeId?: string) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";

    const brands = await getDocs<SnapBuy.Brand>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "brands"],
      {
        where: storeId
          ? and(where("uid", "==", uid), where("storeId", "==", storeId))
          : and(where("uid", "==", uid)),
        orders: [orderBy("createdAt", "desc")],
      }
    );

    const result =
      brands?.map((brand) => ({ ...brand.data, id: brand.id })) || [];
    result.forEach((brand) => {
      setTemp("brands." + brand.id, brand);
    });

    return result;
  },
  async getBrand(brandId: string) {
    const brand = getTempFromStore<SnapBuy.Brand>("brands." + brandId);
    if (!brand) {
      const doc = await getDoc<SnapBuy.Brand>([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "brands",
        brandId,
      ]);
      if (doc) {
        setTemp("brands." + brandId, doc);
      }
      return doc;
    }
    return brand;
  },
  async updateBrand(
    brandId: string,
    brand: Partial<Omit<SnapBuy.Brand, "id" | "createdAt" | "uid">>
  ) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";

    const now = Date.now();

    // Get existing brand data
    const existingBrand = await getDoc<SnapBuy.Brand>([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "brands",
      brandId,
    ]);

    if (!existingBrand) throw "Brand not found";

    let photo: string | undefined = brand.photo;
    if (brand.photo && brand.photo.startsWith("data:")) {
      const [uploadedPhoto] = await uploadFiles([brand.photo], () => {
        return ["brands", brandId];
      });
      photo = uploadedPhoto;
    }

    const updatedBrandData: SnapBuy.Brand = {
      ...existingBrand,
      ...brand,
      photo: photo || existingBrand.photo,
      updatedAt: now,
    };

    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "brands", brandId],
      updatedBrandData
    );

    setTemp("brands." + brandId, updatedBrandData);
    return updatedBrandData;
  },
  async deleteBrand(brandId: string) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";

    await deleteDoc([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "brands",
      brandId,
    ]);

    setTemp("brands." + brandId, null);
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
