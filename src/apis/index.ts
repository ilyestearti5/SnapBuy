import { getTempFromStore, setTemp } from "@biqpod/app/ui/hooks";
import { Biqpod, Nothing, SettingValueType } from "@biqpod/app/ui/types";
import {
  and,
  createDoc,
  or,
  orderBy,
  Path,
  updateFile,
  where,
  deleteDoc,
  getDoc,
  getDocs,
  getDownloadURL,
  setDoc,
  ClientCloud,
  updateDoc,
} from "@biqpod/app/ui/apis";
import { delay, mapAsync, mergeArray } from "@biqpod/app/ui/utils";
import { cloud, functions } from "../server";
export const appProjectId: string = import.meta.env.VITE_PROJECT_ID!;
const mainRef = ["projects", appProjectId];
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
  products: Snapbuy.Order["products"];
  client: Snapbuy.Client;
  delivery: boolean;
  metaData?: Record<string, SettingValueType>;
  place: Snapbuy.Order["place"];
  note?: string;
}
export interface Action {
  name: string;
  params: string[];
  description: string;
}
export interface GetExploreStoresOptions {
  limit?: number;
  startAt?: string;
  orderBy?: keyof Snapbuy.Store;
  orderDir?: "asc" | "desc";
  useRecommendations?: boolean;
}
export type Duration = keyof PlanRecord["duration"];
export interface ActionInterpret {
  action: string;
  params?: Record<string, string | number | undefined>;
}
export interface Invoice {
  id: string;
  storeId: string;
  orderId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  products: Record<string, { count: number; price: number }>;
  tax?: number;
  discount?: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  uid: string;
}
export const isAccountLinkedWithDrive = async () => {
  const isAccountLinkedCallback = await cloud.app.functions.getUserFunction<{
    linked: boolean;
  }>("is-account-linked");
  const result = await isAccountLinkedCallback?.({ name: "google-drive" });
  return result?.linked || false;
};
export type DataTypes =
  | "products"
  | "customers"
  | "orders"
  | "packs"
  | "collections"
  | "brands"
  | "photos"
  | "coupons"
  | "vars";
const buildFunction = (name: string) => {
  return {
    getUserFunction: async <T, R = any>(fnId: string) => {
      return await cloud.app.functions.getUserFunction<T, R>(
        [name, fnId].join("-")
      );
    },
    getFunction: async <T, R = any>(fnId: string) => {
      return await cloud.app.functions.getFunction<T, R>(
        [name, fnId].join("-")
      );
    },
  };
};
const { getUserFunction, getFunction } = buildFunction("snapbuy");
export const createApi = (cloud: ClientCloud) => {
  const getCurrentAuth = () => {
    return cloud.app.auth.getCurrentAuth();
  };
  const uploadFile = (path: Biqpod.Cloud.Path, content: Blob | string) => {
    return cloud.app.storage.updateFile(path, content);
  };
  const uploadFiles = async (
    images: string[],
    collection: (index: number) => Path
  ) => {
    const photos = await mapAsync(images, async (photo, index) => {
      if (photo.startsWith("data:")) {
        const blob = await fetch(photo).then((s) => s.blob());
        const ref = [mainRef, collection(index)];
        await uploadFile(ref, blob);
        const result = await getDownloadURL(ref);
        return result!;
      } else {
        return photo;
      }
    });
    return photos;
  };
  const snapbuyApi = {
    async generateStoreApiToken(storeId: string) {
      const fn = await getUserFunction<{ token: string }>(
        "generate-store-api-token"
      );
      const result = await fn?.({ storeId });
      return result?.token;
    },
    async hasAccessToStore(storeId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      const fn = await getUserFunction<Snapbuy.StoreUserAccess>(
        "has-access-to-store"
      );
      const result = await fn?.({ storeId, uid });
      return result?.permissions;
    },
    async getPartOfToken(storeId: string) {
      const fn = await getUserFunction<{ token: string }>(
        "get-part-store-api-token"
      );
      const result = await fn?.({ storeId });
      return result?.token;
    },
    async getZone(zoneId: string) {
      return getDoc<Snapbuy.Zone>([mainRef, "zones", zoneId]);
    },
    async setPixelId(
      storeId: string,
      id: Snapbuy.PixelId,
      value: string | null
    ) {
      await setDoc([mainRef, "stores", storeId], {
        pixels: {
          [id]: value,
        },
      });
    },
    async submitStore(storeId: string, stars: number) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await setDoc([mainRef, "stores", storeId, "stars", uid], {
        value: stars,
      });
    },
    async getStoresStars(storeId: string, stars: number) {
      const result = await getDocs([mainRef, "stores", storeId], {
        where: and(where("stars", "==", stars)),
      });
      return result?.length;
    },
    collections: {
      async delete(collectionId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        await deleteDoc([mainRef, "collections", collectionId]);
      },
      async upsert(props: Snapbuy.Collection) {
        const createCollection = await getUserFunction<Snapbuy.Collection>(
          "create-collection"
        );
        createCollection?.(props);
      },
      async getProducts(collection: string | Snapbuy.Collection) {
        const collectionDoc =
          typeof collection === "string"
            ? await this.get(collection)
            : collection;
        const products = await mapAsync(
          collectionDoc?.products || [],
          async (prodId) => {
            const product = await snapbuyApi.product.get(prodId);
            return product!;
          }
        );
        return products;
      },
      async get(collectionId: string) {
        const doc = await getDoc<Snapbuy.Collection>([
          "projects",
          appProjectId,
          "collections",
          collectionId,
        ]);
        return doc;
      },
      async getAll(storeId: string) {
        const collections = await getDocs<Snapbuy.Collection>(
          [mainRef, "collections"],
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
    },
    async getSinglePack(storeId: string) {
      const packs = await getDocs<Snapbuy.Pack>([mainRef, "packs"], {
        where: and(where("storeId", "==", storeId)),
        limit: 1,
      });
      return packs?.at(0);
    },
    async setStorePixels(storeId: string, pixels: Snapbuy.Store["pixels"]) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await setDoc([mainRef, "stores", storeId], {
        pixels,
      });
    },
    async ordersWillDeletingAfter7Day(storeId: string) {
      const time = new Date();
      time.setMonth(time.getMonth() - 3);
      time.setDate(time.getDate() + 7);
      const orders = await getDocs<Snapbuy.Order>([mainRef, "orders"], {
        where: and(
          where("storeId", "==", storeId),
          where("createdAt", "<=", time.getTime())
        ),
      });
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
      const fn = await getUserFunction<Snapbuy.Order[]>("today-deliverys");
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
    async addZone(zone: Snapbuy.Zone) {
      const uid = await getCurrentAuth();
      const zoneId = crypto.randomUUID();
      await createDoc([mainRef, "zones", zoneId], {
        id: zoneId,
        ...zone,
        uid,
      });
    },
    async getZonesLinkTo(zoneId: string) {
      const docs = await getDocs<Snapbuy.LinkZone>([mainRef, "zone-links"], {
        where: or(where("first", "==", zoneId), where("second", "==", zoneId)),
      });
      return docs?.map((doc) => doc.data) || [];
    },
    async linkZone(firstZone: string, secondZone: string, price: number) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      const zoneId = `${firstZone}+${secondZone}`;
      await setDoc([mainRef, "zone-links", zoneId], {
        id: zoneId,
        first: firstZone,
        second: secondZone,
        price,
        uid,
      });
    },
    async deleteLinkZone(linkId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await deleteDoc([mainRef, "zone-links", linkId]);
    },
    async deleteZone(zoneId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await deleteDoc([mainRef, "zones", zoneId]);
      const zones = await this.getZonesLinkTo(zoneId);
      await mapAsync(zones, async (zone) => {
        await this.deleteLinkZone(zone.id!);
      });
    },
    product: {
      async get(productId: string) {
        const product = getTempFromStore<Snapbuy.Product>(
          "products." + productId
        );
        if (!product) {
          const doc = await getDoc<Snapbuy.Product>([
            "projects",
            appProjectId,
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
      async getAll() {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const products = await getDocs<Snapbuy.Product>([mainRef, "products"], {
          where: and(where("uid", "==", uid)),
        });
        return (
          products?.map((product) => ({ ...product.data, id: product.id })) ||
          []
        );
      },
      async getProductsOf(storeId: string) {
        const products = await getDocs<Snapbuy.Product>([mainRef, "products"], {
          where: and(where("storeId", "==", storeId)),
        });
        const result = products?.map(({ data }) => data);
        result?.forEach((prod) => {
          setTemp("products." + prod.id, prod);
        });
        return result;
      },
      async upsert(
        storeId: string,
        products: Partial<Snapbuy.Product>[],
        onBeforeStart?: (
          product: Partial<Snapbuy.Product>,
          index: number
        ) => void | Promise<void>
      ) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const createProduct = await getUserFunction<Snapbuy.Product>(
          "create-product"
        );
        await mapAsync(products, async (product, index) => {
          onBeforeStart?.(product, index);
          var files: File[] | undefined;
          const filtedPhotos = product.photos?.filter((p) =>
            p.startsWith("data:")
          );
          if (filtedPhotos?.length) {
            files = await mapAsync(filtedPhotos || [], async (p) => {
              const response = await fetch(p).then((s) => s.blob());
              return new File([response], "photo.png", { type: response.type });
            });
          }
          const prod = {
            ...product,
            photos: product.photos?.filter((p) => !p.startsWith("data:")),
            storeId,
          };
          const result = await createProduct?.(prod, files);
          if (result) {
            setTemp("products." + result.id, result);
          }
        });
      },
      async delete(productId: string) {
        const deleteProduct = await getUserFunction("delete-product");
        await deleteProduct?.({
          id: productId,
        });
        setTemp("products." + productId, null);
      },
    },
    store: {
      async add(store: Snapbuy.Store) {
        const {
          address = null,
          name = null,
          phone = null,
          photo = null,
        } = store;
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        var image: string | null = null;
        const ref = [mainRef, "stores", store.id];
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
      delete: async (id: string) => {
        const fn = await getUserFunction("delete-store");
        await fn?.({
          id,
        });
      },
      async getAll() {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const stores = await getDocs<Snapbuy.Store>([mainRef, "stores"], {
          where: and(where("uid", "==", uid)),
        });
        return stores?.map((store) => ({ ...store.data })) || [];
      },
      async get(storeId: string) {
        const store = getTempFromStore<Snapbuy.Store>("stores." + storeId);
        if (store) {
          return store;
        }
        const doc = await getDoc<Snapbuy.Store>([
          "projects",
          appProjectId,
          "stores",
          storeId,
        ]);
        if (doc) {
          setTemp("stores." + storeId, doc);
        }
        return doc;
      },
      async update(storeId: string, store: Partial<Snapbuy.Store>) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        if (store.photo) {
          const [file] = await uploadFiles([store.photo], () => {
            return ["stores", storeId];
          });
          store.photo = file;
        } else {
        }
        await setDoc([mainRef, "stores", storeId], {
          id: storeId,
          ...store,
          photo: store.photo || null,
        });
      },
      async getStoresOf(uid: string) {
        const stores = await getDocs<Snapbuy.Store>([mainRef, "stores"], {
          where: and(where("uid", "==", uid)),
        });
        return stores?.map((store) => ({ ...store.data, id: store.id })) || [];
      },
    },
    templates: {
      async get(id: string) {
        const store = getTempFromStore<Snapbuy.Template>("templates." + id);
        if (store) {
          return store;
        }
        const doc = await getDoc<Snapbuy.Template>([
          "projects",
          appProjectId,
          "templates",
          id,
        ]);
        if (doc) {
          setTemp("templates." + id, doc);
        }
        return doc;
      },
      async create(template: Snapbuy.Template) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const { id = crypto.randomUUID(), photo, ...rest } = template;
        var pht: string | Nothing;
        if (photo) {
          const blob = await fetch(photo).then((s) => s.blob());
          await updateFile([mainRef, "templates", id, "photo"], blob);
          pht = await getDownloadURL([
            "projects",
            appProjectId,
            "templates",
            id,
            "photo",
          ]);
        }
        const options: Snapbuy.Template = {
          ...rest,
          id,
          creatorId: uid,
          createdAt: Date.now(),
        };
        if (pht) {
          options.photo = pht;
        }
        await setDoc([mainRef, "templates", id], options);
      },
      async getMyList() {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const templates = await getDocs<Snapbuy.Template>(
          [mainRef, "templates"],
          {
            where: and(where("creatorId", "==", uid)),
            orders: [orderBy("createdAt", "desc")],
          }
        );
        const allTemplates =
          templates?.map((template) => ({
            ...template.data,
            id: template.id,
          })) || [];
        // Return only the slice for this page
        return allTemplates;
      },
      async getAll(startAt: string | null = null, limit: number = 10) {
        const templates = await getDocs<Snapbuy.Template>(
          [mainRef, "templates"],
          {
            // where: and(where("status", "==", "accepted")),
            orders: [orderBy("createdAt", "desc")],
            limit,
            startAt: startAt ? [startAt] : undefined,
          }
        );
        return (
          templates?.map((template) => ({
            ...template.data,
            id: template.id,
          })) || []
        );
      },
      async delete(templateId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        await deleteDoc([mainRef, "templates", templateId]);
      },
      async pay(templateId: string) {
        const fn = await getUserFunction<
          { url: string },
          { templateId: string }
        >("pay-invoice-template");
        const response = await fn?.({ templateId });
        const anchor = document.createElement("a");
        anchor.href = response?.url || "#";
        anchor.click();
      },
      async getPayed() {
        const fn = await getUserFunction<string[]>("purchased-templates");
        return fn?.({});
      },
    },
    account: {
      async delete(accountId: string) {
        await deleteDoc([mainRef, "accounts", accountId]);
      },
      async upsert(account: Snapbuy.Account) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const { id = crypto.randomUUID(), ...rest } = account;
        await setDoc([mainRef, "accounts", id], {
          ...rest,
          id,
          uid,
        });
      },
    },
    following: {
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
      async get(limit?: number, from?: Snapbuy.Follow | null) {
        var uid = await getCurrentAuth();
        if (!uid) {
          throw "User not authenticated";
        }
        const follows = await getDocs<Snapbuy.Follow>([mainRef, "follows"], {
          where: and(where("follower", "==", uid), where("follow", "==", true)),
          limit,
          startAt: from?.followed && mergeArray(from?.followed),
          orders: [orderBy("followed", "desc")],
        });
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
    },
    async getOrder(orderId: string) {
      const fn = await getUserFunction<Snapbuy.Order>("get-order");
      const order = await fn?.({
        orderId,
      });
      return order;
    },
    async syncProductsData() {
      const syncProductsData = await getUserFunction("sync-data-products");
      await syncProductsData?.({});
    },
    async syncBrandsData() {
      const syncBrandsData = await getUserFunction("sync-data-brands");
      await syncBrandsData?.({});
    },
    async syncCollectionsData() {
      const syncCollectionsData = await getUserFunction(
        "sync-data-collections"
      );
      await syncCollectionsData?.({});
    },
    async syncStoresData() {
      const syncStoresData = await getUserFunction("sync-data-stores");
      await syncStoresData?.({});
    },
    async getDrivePhotos() {
      const fn = await functions.getUserFunction<
        {
          name: string;
          link: string;
        }[]
      >("get-photos-from-google-drive");
      const photos = await fn?.({});
      return photos;
    },
    // Brand Management Functions
    async createBrand(
      brand: Omit<Snapbuy.Brand, "id" | "createdAt" | "updatedAt">
    ) {
      const createBrand = await getUserFunction<Snapbuy.Brand>("create-brand");
      return await createBrand?.(brand);
    },
    async getAllBrands(storeId: string) {
      const brands = await getDocs<Snapbuy.Brand>([mainRef, "brands"], {
        where: and(where("storeId", "==", storeId)),
      });
      const result =
        brands?.map((brand) => ({ ...brand.data, id: brand.id })) || [];
      result.forEach((brand) => {
        setTemp("brands." + brand.id, brand);
      });
      return result;
    },
    async getBrand(brandId: string) {
      const brand = getTempFromStore<Snapbuy.Brand>("brands." + brandId);
      if (!brand) {
        const doc = await getDoc<Snapbuy.Brand>([
          "projects",
          appProjectId,
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
      brand: Partial<Omit<Snapbuy.Brand, "id" | "createdAt" | "uid">>
    ) {
      const createBrand = await getUserFunction<Snapbuy.Brand>("create-brand");
      return await createBrand?.({
        id: brandId,
        ...brand,
      });
    },
    async deleteBrand(brandId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await deleteDoc([mainRef, "brands", brandId]);
      setTemp("brands." + brandId, null);
    },
    async createOrder(order: CreateOrderOptions) {
      const createOrder = await getFunction<{ id: string }, CreateOrderOptions>(
        "create-order"
      );
      return await createOrder?.(order);
    },
    async getOrderProducts(orderId: string) {
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
    async getOrderPacks(orderId: string) {
      const order = getTempFromStore<ProductsResult[]>(
        "order-packs." + orderId
      );
      if (order) {
        return order;
      }
      const fn = await getUserFunction<PackResult[]>("get-order-packs");
      const packs = await fn?.({
        orderId,
      });
      setTemp("order-packs." + orderId, packs || []);
      return packs;
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
      const snapbuySub = await cloud.app.functions.getUserFunction<{
        isSubscribed: boolean;
        label?: string;
        duration?: number;
      }>("check-user-subscribed");
      const result = await snapbuySub?.({
        projectId: appProjectId,
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
      const account = getTempFromStore<Snapbuy.Account>(
        "accounts." + accountId
      );
      if (account) {
        return account;
      }
      const doc = await getDoc<Snapbuy.Account>([
        "projects",
        appProjectId,
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
        Snapbuy.Store[],
        GetExploreStoresOptions
      >("get-explore-stores");
      const result = await action?.(options);
      return result || [];
    },
    async interpretCommand(command: string) {
      const interpret = await getFunction<ActionInterpret, { command: string }>(
        "interpret-command"
      );
      return await interpret?.({
        command,
      });
    },
    async generateProductDescription(product: Partial<Snapbuy.Product>) {
      const generateDescription = await getFunction<
        string,
        Partial<Snapbuy.Product>
      >("generate-product-description");
      return await generateDescription?.(product);
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
      const orders = await getDocs<Snapbuy.Order>([mainRef, "orders"], {
        where: and(...conditions),
        orders: [orderBy("createdAt", "asc")],
        limit,
        startAt: startAt ? [startAt] : undefined,
      });
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
      const existingOrder = await getDoc<Snapbuy.Order>([
        "projects",
        appProjectId,
        "orders",
        orderId,
      ]);
      if (!existingOrder) throw "Order not found";
      await setDoc([mainRef, "orders", orderId], {
        ...existingOrder,
        delivery: {
          uid,
          agentId,
        },
        assignedAt: Date.now(),
      });
    },
    async getDeliveryAgents() {
      const uid = getCurrentAuth();
      if (!uid) throw "User not authenticated";
      const agents = await getDocs<Snapbuy.Account>([mainRef, "accounts"], {
        where: and(
          where("uid", "==", uid),
          where("role", "==", "delivery_agent")
        ),
      });
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
    // Legacy delivery pricing functions (deprecated - use new delivery options/prices functions)
    async addStoreDeliveryPrice(
      storeId: string,
      deliveryPrice: Snapbuy.DeliveryPrice
    ) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      const deliveryPriceData: Snapbuy.DeliveryPrice = {
        ...deliveryPrice,
        id: deliveryPrice.id || crypto.randomUUID(),
        storeId,
        uid,
      };
      await setDoc(
        [mainRef, "deliveryPrices", deliveryPriceData.id!],
        deliveryPriceData
      );
    },
    async updateStoreDeliveryPrice(
      storeId: string,
      deliveryPrice: Snapbuy.DeliveryPrice
    ) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      const deliveryPriceData: Snapbuy.DeliveryPrice = {
        ...deliveryPrice,
        storeId,
        uid,
      };
      await setDoc(
        [mainRef, "deliveryPrices", deliveryPrice.id!],
        deliveryPriceData
      );
    },
    async deleteStoreDeliveryPrice(_storeId: string, deliveryPriceId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await deleteDoc([
        "projects",
        appProjectId,
        "deliveryPrices",
        deliveryPriceId,
      ]);
    },
    async getStoreDeliveryPrices(storeId: string) {
      const deliveryPrices = await getDocs<Snapbuy.DeliveryOptions>(
        [mainRef, "deliveryPrices"],
        {
          where: and(where("storeId", "==", storeId)),
          orders: [orderBy("createdAt", "desc")],
        }
      );
      return (
        deliveryPrices?.map((price) => ({ ...price.data, id: price.id })) || []
      );
    },
    // New API functions for delivery options (without price)
    async addStoreDeliveryOption(
      storeId: string,
      deliveryOption: Omit<Snapbuy.DeliveryOptions, "id" | "uid" | "storeId">
    ) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      const id = crypto.randomUUID();
      await setDoc([mainRef, "deliveryOptions", id], {
        ...deliveryOption,
        id,
        uid,
        storeId,
      });
      return id;
    },
    async updateStoreDeliveryOption(
      deliveryOptionId: string,
      deliveryOption: Partial<Snapbuy.DeliveryOptions>
    ) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await setDoc([mainRef, "deliveryOptions", deliveryOptionId], {
        ...deliveryOption,
        uid,
      });
    },
    async deleteStoreDeliveryOption(deliveryOptionId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      // Also delete all associated delivery prices
      const prices = await this.getDeliveryPricesForOption(deliveryOptionId);
      for (const price of prices) {
        if (price.id) {
          await deleteDoc([
            "projects",
            appProjectId,
            "deliveryPrices",
            price.id,
          ]);
        }
      }
      await deleteDoc([
        "projects",
        appProjectId,
        "deliveryOptions",
        deliveryOptionId,
      ]);
    },
    async getStoreDeliveryOptions(storeId: string) {
      const deliveryOptions = await getDocs<Snapbuy.DeliveryOptions>(
        [mainRef, "deliveryOptions"],
        {
          where: and(where("storeId", "==", storeId)),
          orders: [orderBy("createdAt", "desc")],
        }
      );
      return (
        deliveryOptions?.map((deliveryOption) => ({
          ...deliveryOption.data,
          id: deliveryOption.id,
        })) || []
      );
    },
    // New API functions for delivery prices
    async addDeliveryPrice(
      deliveryPrice: Omit<Snapbuy.DeliveryPrice, "id" | "uid">
    ) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      const id = crypto.randomUUID();
      await setDoc([mainRef, "deliveryPrices", id], {
        ...deliveryPrice,
        id,
        uid,
      });
      return id;
    },
    async updateDeliveryPrice(
      deliveryPriceId: string,
      deliveryPrice: Partial<Snapbuy.DeliveryPrice>
    ) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await setDoc([mainRef, "deliveryPrices", deliveryPriceId], {
        ...deliveryPrice,
        uid,
      });
    },
    async deleteDeliveryPrice(deliveryPriceId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await deleteDoc([
        "projects",
        appProjectId,
        "deliveryPrices",
        deliveryPriceId,
      ]);
    },
    async getDeliveryPricesForOption(deliveryOptionId: string) {
      const deliveryPrices = await getDocs<Snapbuy.DeliveryPrice>(
        [mainRef, "deliveryPrices"],
        {
          where: and(where("deliveryOptionId", "==", deliveryOptionId)),
          orders: [orderBy("createdAt", "desc")],
        }
      );
      return (
        deliveryPrices?.map((deliveryPrice) => ({
          ...deliveryPrice.data,
          id: deliveryPrice.id,
        })) || []
      );
    },
    async getAllDeliveryPricesForStore(storeId: string) {
      const deliveryPrices = await getDocs<Snapbuy.DeliveryPrice>(
        [mainRef, "deliveryPrices"],
        {
          where: and(where("storeId", "==", storeId)),
          orders: [orderBy("createdAt", "desc")],
        }
      );
      return (
        deliveryPrices?.map((deliveryPrice) => ({
          ...deliveryPrice.data,
          id: deliveryPrice.id,
        })) || []
      );
    },
    packs: {
      async add(pack: Snapbuy.Pack) {
        const createPack = await getUserFunction<Snapbuy.Pack>("create-pack");
        return await createPack?.(pack);
      },
      async update(packId: string, pack: Snapbuy.Pack) {
        const createPack = await getUserFunction<Snapbuy.Pack>("create-pack");
        return await createPack?.({
          ...pack,
          id: packId,
        });
      },
      async getAll(storeId: string) {
        const packs = await getDocs<Snapbuy.Pack>([mainRef, "packs"], {
          where: and(where("storeId", "==", storeId)),
        });
        return packs?.map((pack) => ({ ...pack.data, id: pack.id })) || [];
      },
      async get(packId: string) {
        const pack = getTempFromStore<Snapbuy.Pack>("packs." + packId);
        if (pack) {
          return pack;
        }
        const doc = await getDoc<Snapbuy.Pack>([
          "projects",
          appProjectId,
          "packs",
          packId,
        ]);
        if (doc) {
          setTemp("packs." + packId, doc);
        }
        return doc;
      },
      async delete(packId: string) {
        const deletePack = await getUserFunction("delete-pack");
        await deletePack?.({ packId });
      },
    },
    async deleteOrder(orderId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      await deleteDoc([mainRef, "orders", orderId]);
      setTemp("order-products." + orderId, null);
    },
    async editOrder(orderId: string, edit: Snapbuy.Order["edit"]) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      const existingOrder = await getDoc<Snapbuy.Order>([
        "projects",
        appProjectId,
        "orders",
        orderId,
      ]);
      if (!existingOrder) throw "Order not found";
      await setDoc([mainRef, "orders", orderId], {
        ...existingOrder,
        edit,
      });
    },
    async getNotificationSettings(storeId: string) {
      const store = await getDoc<Required<Snapbuy.Store>>([
        "projects",
        appProjectId,
        "stores",
        storeId,
      ]);
      return store?.notify;
    },
    // Customer Management Functions
    customer: {
      async create(customer: Omit<Snapbuy.Customer, "createdAt">) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const customerId = crypto.randomUUID();
        await createDoc([mainRef, "customers", customerId], {
          ...customer,
          id: customerId,
          createdAt: Date.now(),
        });
        return customerId;
      },
      async get(customerId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const customer = await getDoc<Snapbuy.Customer>([
          "projects",
          appProjectId,
          "customers",
          customerId,
        ]);
        return customer ? { ...customer, id: customerId } : null;
      },
      async getAll(storeId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const customers = await getDocs<Snapbuy.Customer>(
          [mainRef, "customers"],
          {
            where: and(where("storeId", "==", storeId)),
            orders: [orderBy("createdAt", "desc")],
          }
        );
        return (
          customers?.map((customer) => ({
            ...customer.data,
            id: customer.id,
          })) || []
        );
      },
      async updateStatus(
        customerId: string,
        status: "pending" | "rejected" | "accepted"
      ) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        await updateDoc([mainRef, "customers", customerId], {
          status,
        });
      },
      async delete(customerId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        await deleteDoc([mainRef, "customers", customerId]);
      },
    },
    // Coupon Management Functions
    async syncPhotosInDocument(
      type: "product" | "brand" | "collection" | "store",
      id: string,
      documentId: string
    ) {
      const syncPhotos = await getUserFunction("sync-photos-in-document");
      await syncPhotos?.({
        type,
        id,
        documentId,
      });
    },
    coupon: {
      async upsert(coupon: Snapbuy.Coupon) {
        const upsertCoupon = await getUserFunction<string>("create-coupon");
        const couponId = await upsertCoupon?.(coupon);
        return couponId;
      },
      async getAll(storeId: string) {
        const coupons = await getDocs<Snapbuy.Coupon>([mainRef, "coupons"], {
          where: and(where("storeId", "==", storeId)),
          orders: [orderBy("createdAt", "desc")],
        });
        return (
          coupons?.map((coupon) => ({ ...coupon.data, id: coupon.id })) || []
        );
      },
      async get(couponId: string) {
        const coupon = getTempFromStore<Snapbuy.Coupon>("coupons." + couponId);
        if (coupon) {
          return coupon;
        }
        const doc = await getDoc<Snapbuy.Coupon>([
          "projects",
          appProjectId,
          "coupons",
          couponId,
        ]);
        if (doc) {
          setTemp("coupons." + couponId, doc);
        }
        return doc;
      },
      async delete(couponId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        await deleteDoc([mainRef, "coupons", couponId]);
        setTemp("coupons." + couponId, null);
      },
      async validate(code: string, storeId: string, orderAmount: number) {
        const coupons = await getDocs<Snapbuy.Coupon>([mainRef, "coupons"], {
          where: and(
            where("code", "==", code),
            where("storeId", "==", storeId),
            where("isActive", "==", true)
          ),
        });
        const coupon = coupons?.at(0)?.data;
        if (!coupon) return { valid: false, error: "Coupon not found" };
        const now = new Date();
        const startDate = new Date(coupon.startDate);
        const endDate = new Date(coupon.endDate);
        if (now < startDate)
          return { valid: false, error: "Coupon not yet active" };
        if (now > endDate) return { valid: false, error: "Coupon expired" };
        if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
          return {
            valid: false,
            error: `Minimum order amount is $${coupon.minOrderAmount}`,
          };
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          return { valid: false, error: "Coupon usage limit reached" };
        }
        return { valid: true, coupon };
      },
    },
    // Vars Management Functions
    var: {
      async upsert(variable: Snapbuy.Var) {
        const createVar = await getUserFunction<string>("create-var");
        const varId = await createVar?.(variable);
        return varId;
      },
      async getAll(storeId: string) {
        const vars = await getDocs<Snapbuy.Var>([mainRef, "vars"], {
          where: and(where("storeId", "==", storeId)),
          orders: [orderBy("createdAt", "desc")],
        });
        return (
          vars?.map((variable) => ({ ...variable.data, id: variable.id })) || []
        );
      },
      async get(varId: string) {
        const variable = getTempFromStore<Snapbuy.Var>("vars." + varId);
        if (variable) {
          return variable;
        }
        const doc = await getDoc<Snapbuy.Var>([
          "projects",
          appProjectId,
          "vars",
          varId,
        ]);
        if (doc) {
          setTemp("vars." + varId, doc);
        }
        return doc;
      },
      async delete(varId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        await deleteDoc([mainRef, "vars", varId]);
        setTemp("vars." + varId, null);
      },
    },
    // Store User Access Management Functions
    access: {
      async addUser(
        storeId: string,
        userAccess: {
          email?: string;
          username?: string;
          permissions: "read" | "edit";
          userId?: string;
        }
      ) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const accessId = crypto.randomUUID();
        const now = Date.now();
        const accessData: Snapbuy.StoreUserAccess = {
          id: accessId,
          storeId,
          uid: uid,
          relatedUid: userAccess.userId || null,
          permissions: userAccess.permissions,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        };
        await setDoc([mainRef, "store-access", accessId], accessData);
        setTemp("store-access." + accessId, accessData);
        return accessData;
      },
      async updateUser(
        accessId: string,
        updates: {
          permissions?: "read" | "edit";
          status?: "pending" | "accepted" | "rejected";
        }
      ) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const existingAccess = await getDoc<Snapbuy.StoreUserAccess>([
          "projects",
          appProjectId,
          "store-access",
          accessId,
        ]);
        if (!existingAccess) throw "Access record not found";
        const updatedAccess: Snapbuy.StoreUserAccess = {
          ...existingAccess,
          ...updates,
          updatedAt: Date.now(),
        };
        await setDoc([mainRef, "store-access", accessId], updatedAccess);
        setTemp("store-access." + accessId, updatedAccess);
        return updatedAccess;
      },
      async getUsersAccess(storeId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const accessRecords = await getDocs<Snapbuy.StoreUserAccess>(
          [mainRef, "store-access"],
          {
            where: and(
              where("storeId", "==", storeId),
              where("uid", "==", uid)
            ),
            orders: [orderBy("createdAt", "desc")],
          }
        );
        const result =
          accessRecords?.map((record) => ({
            ...record.data,
            id: record.id,
          })) || [];
        result.forEach((access) => {
          setTemp("store-access." + access.id, access);
        });
        return result;
      },
      async getInvitedStores() {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const accessRecords = await getDocs<Snapbuy.StoreUserAccess>(
          [mainRef, "store-access"],
          {
            where: and(where("relatedUid", "==", uid)),
            orders: [orderBy("createdAt", "desc")],
          }
        );
        const result =
          accessRecords?.map((record) => ({
            ...record.data,
            id: record.id,
          })) || [];
        // Get the stores for these accesses
        const stores = await Promise.all(
          result.map(async (access) => {
            const store = await snapbuyApi.store.get(access.storeId);
            return store!;
          })
        );
        return stores.filter(Boolean);
      },
      async remove(appStoreId: string, relatedUid: string) {
        const uid = await getCurrentAuth();
        if (!uid) {
          throw "User not authenticated";
        }
        const docs = await getDocs<Snapbuy.StoreUserAccess>(
          [mainRef, "store-access"],
          {
            where: and(
              where("relatedUid", "==", relatedUid),
              where("storeId", "==", appStoreId)
            ),
            limit: 1,
          }
        );
        const doc = docs?.at(0);
        if (!doc) {
          throw "No access record found";
        }
        await deleteDoc([mainRef, "store-access", doc?.id!]);
        setTemp("store-access." + doc?.id, null);
      },
      async leave(storeId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const docs = await getDocs<Snapbuy.StoreUserAccess>(
          [mainRef, "store-access"],
          {
            where: and(
              where("relatedUid", "==", uid),
              where("storeId", "==", storeId)
            ),
            limit: 1,
          }
        );
        const doc = docs?.at(0);
        if (!doc) throw "No access record found";
        await deleteDoc([mainRef, "store-access", doc.id]);
        setTemp("store-access." + doc.id, null);
      },
      async getUserAccess(
        storeId: string,
        identifier: string,
        type: "email" | "username" = "email"
      ) {
        const field = type === "email" ? "userEmail" : "username";
        const accessRecords = await getDocs<Snapbuy.StoreUserAccess>(
          [mainRef, "store-access"],
          {
            where: and(
              where("storeId", "==", storeId),
              where(field, "==", identifier),
              where("status", "==", "accepted")
            ),
            limit: 1,
          }
        );
        return accessRecords?.[0]?.data || null;
      },
    },
    async getUsers(limit: number = 50) {
      const users = await getDocs<Biqpod.Account.User>(["users"], {
        limit,
      });
      return users?.map((user) => ({ ...user.data, id: user.id })) || [];
    },
    async getUser(userId: string) {
      const user = getTempFromStore<Biqpod.Account.User & { id: string }>(
        "users." + userId
      );
      if (user) {
        return user;
      }
      const doc = await getDoc<Biqpod.Account.User>(["users", userId]);
      const userWithId = doc ? { ...doc, id: userId } : null;
      if (userWithId) {
        setTemp("users." + userId, userWithId);
      }
      return userWithId;
    },
    // Invoice Management Functions
    invoice: {
      async create(
        invoice: Pick<
          Snapbuy.Invoice,
          | "storeId"
          | "orderId"
          | "customerId"
          | "customerName"
          | "customerEmail"
          | "products"
          | "tax"
          | "discount"
          | "status"
          | "dueDate"
          | "notes"
        >
      ) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const id = crypto.randomUUID();
        const now = Date.now();
        // Calculate total from products
        const subtotal = Object.values(invoice.products).reduce(
          (sum: number, product: { count: number; price: number }) =>
            sum + product.count * product.price,
          0
        );
        const tax = invoice.tax || 0;
        const discount = invoice.discount || 0;
        const total = subtotal + tax - discount;
        const invoiceData: Snapbuy.Invoice = {
          ...invoice,
          id,
          uid,
          total,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc([mainRef, "invoices", id], invoiceData);
        setTemp("invoices." + id, invoiceData);
        return invoiceData;
      },
      async getAll(storeId: string) {
        const invoices = await getDocs<Snapbuy.Invoice>([mainRef, "invoices"], {
          where: and(where("storeId", "==", storeId)),
          orders: [orderBy("createdAt", "desc")],
        });
        const result =
          invoices?.map((invoice) => ({ ...invoice.data, id: invoice.id })) ||
          [];
        result.forEach((invoice) => {
          setTemp("invoices." + invoice.id, invoice);
        });
        return result;
      },
      async get(invoiceId: string) {
        const invoice = getTempFromStore<Snapbuy.Invoice>(
          "invoices." + invoiceId
        );
        if (invoice) {
          return invoice;
        }
        const doc = await getDoc<Snapbuy.Invoice>([
          "projects",
          appProjectId,
          "invoices",
          invoiceId,
        ]);
        if (doc) {
          setTemp("invoices." + invoiceId, doc);
        }
        return doc;
      },
      async update(
        invoiceId: string,
        invoice: Partial<Omit<Snapbuy.Invoice, "id" | "createdAt" | "uid">>
      ) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const now = Date.now();
        const existingInvoice = await getDoc<Snapbuy.Invoice>([
          "projects",
          appProjectId,
          "invoices",
          invoiceId,
        ]);
        if (!existingInvoice) throw "Invoice not found";
        const updatedInvoice: Snapbuy.Invoice = {
          ...existingInvoice,
          ...invoice,
          updatedAt: now,
        };
        await setDoc([mainRef, "invoices", invoiceId], updatedInvoice);
        setTemp("invoices." + invoiceId, updatedInvoice);
        return updatedInvoice;
      },
      async delete(invoiceId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        await deleteDoc([mainRef, "invoices", invoiceId]);
        setTemp("invoices." + invoiceId, null);
      },
    },
    async hasExtraLinks(callback?: (text: string) => void) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      callback?.("checking products");
      const products = await getDocs<Snapbuy.Product>([mainRef, "products"], {
        where: and(where("uid", "==", uid)),
      });
      const firestoreLink = "firebasestorage.googleapis.com";
      const findedProduct = products?.find((p) =>
        p.data.photos?.some((photo) => photo.includes(firestoreLink))
      );
      if (findedProduct) {
        return findedProduct.data;
      }
      callback?.("checking collections");
      const collections = await getDocs<Snapbuy.Collection>(
        [mainRef, "collections"],
        {
          where: and(where("uid", "==", uid)),
        }
      );
      const findedCollection = collections?.find((c) =>
        c.data.photo?.includes(firestoreLink)
      );
      if (findedCollection) {
        return findedCollection.data;
      }
      callback?.("checking brands");
      const brands = await getDocs<Snapbuy.Brand>([mainRef, "brands"], {
        where: and(where("uid", "==", uid)),
      });
      const findedBrands = brands?.find((b) =>
        b.data.photo?.includes(firestoreLink)
      );
      if (findedBrands) {
        return findedBrands.data;
      }
      callback?.("checking stores");
      const stores = await getDocs<Snapbuy.Store>([mainRef, "stores"], {
        where: and(where("uid", "==", uid)),
      });
      const findedStore = stores?.find((s) =>
        s.data.photo?.includes(firestoreLink)
      );
      if (findedStore) {
        return findedStore.data;
      }
      return false;
    },
    usage: {
      async get(props: { storeId: string }) {
        const fn = await getUserFunction<Partial<Record<DataTypes, number>>>(
          "usage"
        );
        return fn?.({ storeId: props.storeId });
      },
      async pay(storeId: string, usages: Partial<Record<DataTypes, number>>) {
        const fn = await getUserFunction<{ url: string }>("pay-usages");
        const data = await fn?.({
          storeId,
          usages,
        });
        if (data?.url) {
          const a = document.createElement("a");
          a.href = data.url;
          a.click();
        }
      },
      async getPrices() {
        const fn = await getFunction<
          {
            type: DataTypes;
            extraPrice: number;
            unit: string;
          }[]
        >("get-usages-pricing");
        return fn?.({});
      },
      async getPayments(storeId: string) {
        const fn = await getUserFunction<Biqpod.Account.Payout[]>(
          "get-payments"
        );
        const result = await fn?.({ storeId });
        return result;
      },
      async getCurrentPayment(storeId: string) {
        const fn = await getUserFunction<Biqpod.Account.Payout[]>(
          "current-payment"
        );
        return fn?.({ storeId });
      },
    },
  };
  return snapbuyApi;
};
export const snapbuyApi = createApi(cloud);
