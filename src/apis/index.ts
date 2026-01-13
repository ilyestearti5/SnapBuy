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
  CloudSelection,
  onCollectionSnapshot,
} from "@biqpod/app/ui/apis";
import { delay, mapAsync, mergeArray } from "@biqpod/app/ui/utils";
import { cloud, functions } from "../server";
import { FilterOrdersProps } from "../Links/FilterOrders";
import { getStoreId } from "../utils";
export const appProjectId: string = import.meta.env.VITE_PROJECT_ID!;
const mainRef = ["projects", appProjectId];
export interface OverviewProps {
  orders: number;
  customers: number;
  totalSales: number;
}
interface ProductsResult extends Biqpod.Snapbuy.Product {
  price: number;
  count: number;
}
interface PackResult extends Biqpod.Snapbuy.Pack {
  price: number;
  count: number;
}
export interface CreateOrderOptions {
  storeId?: string;
  products: Biqpod.Snapbuy.Order["products"];
  client: Biqpod.Snapbuy.Client;
  metaData?: Record<string, SettingValueType>;
  place: Biqpod.Snapbuy.Order["place"];
  note?: string;
  deliveryPriceId?: string;
}
export interface Action {
  name: string;
  params: string[];
  description: string;
}
export interface GetExploreStoresOptions {
  limit?: number;
  startAt?: string;
  orderBy?: keyof Biqpod.Snapbuy.Store;
  orderDir?: "asc" | "desc";
  useRecommendations?: boolean;
}
export interface ActionInterpret {
  action: string;
  params?: Record<string, string | number | undefined>;
}
export const isAccountLinked = async (name: string) => {
  const isAccountLinkedCallback = await cloud.app.functions.getUserFunction<{
    linked: boolean;
  }>("is-account-linked");
  const result = await isAccountLinkedCallback?.({ name });
  return result?.linked || false;
};
export const isAccountLinkedWithDrive = async () => {
  const isAccountLinkedCallback = await cloud.app.functions.getUserFunction<{
    linked: boolean;
  }>("is-account-linked");
  const result = await isAccountLinkedCallback?.({ name: "google-drive" });
  return result?.linked || false;
};
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
export const allUsages: DataTypes[] = [
  "brands",
  "collections",
  "coupons",
  "customers",
  "orders",
  "packs",
  "products",
  "vars",
];
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
  interface News {
    id: string;
    title: string;
    photo: string;
    description: string;
    createdAt: number;
  }
  const snapbuyApi = {
    async getNews() {
      const saved = getTempFromStore<News[]>("news-data");
      if (saved) {
        return saved;
      }
      const news = await getDocs<News>([mainRef, "news"], {
        orders: [orderBy("createdAt", "desc")],
      });
      const newsData = news?.map((n) => n.data) || [];
      if (newsData.length > 0) {
        setTemp("news-data", newsData);
      }
      return newsData;
    },
    async getNew(newId: string) {
      const savedList = getTempFromStore<News[]>("news-data");
      const saved = savedList?.find((d) => d.id === newId);
      if (saved) {
        return saved;
      }
      const newData = await getDoc<News>([mainRef, "news", newId]);
      if (newData) {
        const list = savedList
          ? [...savedList, newData].sort((a, b) => {
              // sort by created at Desc
              return b.createdAt - a.createdAt;
            })
          : [newData];
        setTemp("news-data", list);
      }
      return newData;
    },
    async getFree() {
      interface FreeData {
        count: number;
        type: DataTypes;
      }
      const savedData = getTempFromStore<FreeData[]>("free-data");
      if (savedData) {
        return savedData;
      }
      const fn = await getFunction<FreeData[]>("get-free-data");
      const result = await fn?.({});
      if (result) {
        setTemp("free-data", result);
      }
      return result;
    },
    async getPlans() {
      const savedData = getTempFromStore<Plan[]>("plan-data");
      if (savedData) {
        return savedData;
      }
      const fn = await getFunction<Plan[]>("get-plans");
      const result = await fn?.({});
      if (result) {
        setTemp("plan-data", result);
      }
      return result;
    },
    async getPromotionalPrices() {
      interface Pricing {
        key: keyof Biqpod.Snapbuy.Store["notify"];
        price: number;
      }
      const pricing = getTempFromStore<Pricing[]>("promotional-pricing");
      if (pricing) {
        return pricing;
      }
      const fn = await getFunction<Pricing[]>("get-promotional-pricing");
      const result = await fn?.({});
      if (result) {
        setTemp("promotional-pricing", result);
      }
      return result;
    },
    async deleteToken(storeId: string, token: string) {
      const fn = await getUserFunction("delete-store-api-token");
      await fn?.({ storeId, token });
    },
    async generateStoreApiToken(
      storeId: string,
      role: "sdk" | "client" = "client"
    ) {
      const fn = await getUserFunction<{
        token: string;
        role: "sdk" | "client";
      }>("generate-store-api-token");
      const result = await fn?.({ storeId, role });
      return result;
    },
    async hasAccessToStore(storeId: string) {
      const uid = await getCurrentAuth();
      if (!uid) throw "User not authenticated";
      const fn = await getUserFunction<Biqpod.Snapbuy.Access>(
        "has-access-to-store"
      );
      const result = await fn?.({ storeId, uid });
      return result?.permissions;
    },
    async getAllTokens(storeId: string) {
      const fn = await getUserFunction<{
        tokens: { role: "sdk" | "client"; token: string }[];
      }>("get-store-api-tokens");
      const result = await fn?.({ storeId });
      return result?.tokens;
    },
    async getZone(zoneId: string) {
      return getDoc<Biqpod.Snapbuy.Zone>([mainRef, "zones", zoneId]);
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
        const collection = await this.get(collectionId);
        const storeId = collection?.storeId;
        if (storeId) setTemp(`updating-hapen-${storeId}.collections`, true);
        const deleteCollection = await getUserFunction("delete-collection");
        await deleteCollection?.({
          id: collectionId,
        });
      },
      async upsert(collection: Biqpod.Snapbuy.Collection) {
        const storeId = collection.storeId;
        setTemp(`updating-hapen-${storeId}.collections`, true);
        const createCollection =
          await getUserFunction<Biqpod.Snapbuy.Collection>("create-collection");
        var files: File[] | undefined = undefined;
        if (collection.photo?.includes("data:")) {
          const response = await fetch(collection.photo).then((s) => s.blob());
          files = [
            new File([response], "photo.png", {
              type: response.type,
            }),
          ];
        }
        await createCollection?.(collection, files);
      },
      async getProducts(collection: string | Biqpod.Snapbuy.Collection) {
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
        const doc = await getDoc<Biqpod.Snapbuy.Collection>([
          "projects",
          appProjectId,
          "collections",
          collectionId,
        ]);
        return doc;
      },
      async getAll(storeId: string) {
        const isUpdatingHapens = getTempFromStore<boolean>(
          `updating-hapen-${storeId}.collections`
        );
        if (!isUpdatingHapens) {
          const collections = getTempFromStore<Biqpod.Snapbuy.Collection[]>(
            `store-data-${storeId}-collections`
          );
          if (collections) {
            return collections;
          }
        }
        const collections = await getDocs<Biqpod.Snapbuy.Collection>(
          [mainRef, "collections"],
          {
            where: and(where("storeId", "==", storeId)),
          }
        );
        const result =
          collections?.map((collection) => ({
            ...collection.data,
            id: collection.id,
          })) || [];
        setTemp(`store-data-${storeId}-collections`, result);
        return result;
      },
    },
    async getSinglePack(storeId: string) {
      const packs = await getDocs<Biqpod.Snapbuy.Pack>([mainRef, "packs"], {
        where: and(where("storeId", "==", storeId)),
        limit: 1,
      });
      return packs?.at(0);
    },
    async ordersWillDeletingAfter7Day(storeId: string) {
      const time = new Date();
      time.setMonth(time.getMonth() - 3);
      time.setDate(time.getDate() + 7);
      const orders = await getDocs<Biqpod.Snapbuy.Order>([mainRef, "orders"], {
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
      const fn = await getUserFunction<Biqpod.Snapbuy.Order[]>(
        "today-deliverys"
      );
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
    async addZone(zone: Biqpod.Snapbuy.Zone) {
      const uid = await getCurrentAuth();
      const zoneId = crypto.randomUUID();
      await createDoc([mainRef, "zones", zoneId], {
        id: zoneId,
        ...zone,
        uid,
      });
    },
    async getZonesLinkTo(zoneId: string) {
      const docs = await getDocs<Biqpod.Snapbuy.LinkZone>(
        [mainRef, "zone-links"],
        {
          where: or(
            where("first", "==", zoneId),
            where("second", "==", zoneId)
          ),
        }
      );
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
      async generateDescription(product: Partial<Biqpod.Snapbuy.Product>) {
        const generateDescription = await getFunction<
          string,
          Partial<Biqpod.Snapbuy.Product>
        >("generate-product-description");
        return await generateDescription?.(product);
      },
      async get(productId: string) {
        const product = getTempFromStore<Biqpod.Snapbuy.Product>(
          "products." + productId
        );
        if (!product) {
          const doc = await getDoc<Biqpod.Snapbuy.Product>([
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
        const products = await getDocs<Biqpod.Snapbuy.Product>(
          [mainRef, "products"],
          {
            where: and(where("uid", "==", uid)),
          }
        );
        return (
          products?.map((product) => ({ ...product.data, id: product.id })) ||
          []
        );
      },
      async getProductsOf(storeId: string) {
        var isUpdatingHapens = getTempFromStore<boolean>(
          `updating-hapen-${storeId}.products`
        );
        if (!isUpdatingHapens) {
          let products = getTempFromStore<Biqpod.Snapbuy.Product[]>(
            `store-data-${storeId}-products`
          );
          if (products) {
            return Array.from(products);
          }
        }
        let products = await getDocs<Biqpod.Snapbuy.Product>(
          [mainRef, "products"],
          {
            where: and(where("storeId", "==", storeId)),
          }
        );
        var result = products?.map(({ data }) => data);
        result?.forEach((prod) => {
          setTemp(`products.` + prod.id, prod);
        });
        setTemp(`store-data-${storeId}-products`, result);
        await uploadFile(
          ["projects", appProjectId, "stored-products", storeId],
          new Blob([JSON.stringify(result || [])], {
            type: "application/json",
          })
        );
        return Array.from(result || []);
      },
      async upsert(
        storeId: string,
        products: Partial<Biqpod.Snapbuy.Product>[],
        onBeforeStart?: (
          product: Partial<Biqpod.Snapbuy.Product>,
          index: number
        ) => void | Promise<void>
      ) {
        setTemp(`updating-hapen-${storeId}.products`, true);
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const createProduct = await getUserFunction<Biqpod.Snapbuy.Product>(
          "create-product"
        );
        await mapAsync(products, async (product, index) => {
          onBeforeStart?.(product, index);
          var files: File[] | undefined;
          const filtedFiles = product.files?.filter((p) =>
            p.url.startsWith("blob:")
          );
          if (filtedFiles?.length) {
            files = await mapAsync(filtedFiles || [], async (p) => {
              const response = await fetch(p.url).then((s) => s.blob());
              URL.revokeObjectURL(p.url);
              return new File([response], p.type, {
                type: response.type,
              });
            });
          }
          const prod = {
            ...product,
            storeId,
          };
          if (product.files) {
            prod.files = product.files.filter(
              (p) => !p.url?.startsWith("blob:")
            );
          }
          const result = await createProduct?.(prod, files);
          if (result) {
            setTemp("products." + result.id, result);
          }
        });
      },
      async delete(productId: string) {
        const product = await this.get(productId);
        const storeId = product?.storeId;
        if (storeId) setTemp(`updating-hapen-${storeId}.products`, true);
        const deleteProduct = await getUserFunction("delete-product");
        await deleteProduct?.({
          id: productId,
        });
        setTemp("products." + productId, null);
      },
    },
    store: {
      async upsert(store: Partial<Biqpod.Snapbuy.Store>) {
        const storeId = store.id || crypto.randomUUID();
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        if (store.photo) {
          const [file] = await uploadFiles([store.photo], () => {
            return ["stores", storeId];
          });
          store.photo = file;
        }
        await setDoc([mainRef, "stores", storeId], {
          ...store,
          id: storeId,
          photo: store.photo || null,
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
        const stores = await getDocs<Biqpod.Snapbuy.Store>(
          [mainRef, "stores"],
          {
            where: and(where("uid", "==", uid)),
          }
        );
        return stores?.map((store) => ({ ...store.data })) || [];
      },
      async get(storeId: string) {
        const store = getTempFromStore<Biqpod.Snapbuy.Store>(
          "stores." + storeId
        );
        if (store) {
          return store;
        }
        const doc = await getDoc<Biqpod.Snapbuy.Store>([
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
      async getStoresOf(uid: string) {
        const stores = await getDocs<Biqpod.Snapbuy.Store>(
          [mainRef, "stores"],
          {
            where: and(where("uid", "==", uid)),
          }
        );
        return stores?.map((store) => ({ ...store.data, id: store.id })) || [];
      },
      async setPixelId(
        storeId: string,
        id: Biqpod.Snapbuy.Basic.PixelId,
        value: string | null
      ) {
        await setDoc([mainRef, "stores", storeId], {
          pixels: {
            [id]: value,
          },
        });
      },
      async setPixels(storeId: string, pixels: Biqpod.Snapbuy.Store["pixels"]) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        await setDoc([mainRef, "stores", storeId], {
          pixels,
        });
      },
    },
    templates: {
      async get(id: string) {
        const store = getTempFromStore<Biqpod.Snapbuy.Template>(
          "templates." + id
        );
        if (store) {
          return store;
        }
        const doc = await getDoc<Biqpod.Snapbuy.Template>([
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
      async create(template: Biqpod.Snapbuy.Template) {
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
        const options: Biqpod.Snapbuy.Template = {
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
        const templates = await getDocs<Biqpod.Snapbuy.Template>(
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
        const templates = await getDocs<Biqpod.Snapbuy.Template>(
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
      async pay(templateId: string, type: string) {
        const fn = await getUserFunction<{ url: string }>(
          "pay-invoice-template"
        );
        const response = await fn?.({ templateId, type });
        const anchor = document.createElement("a");
        anchor.href = response?.url || "#";
        anchor.click();
      },
      async getPayed() {
        const fn = await getUserFunction<Biqpod.Account.Payout[]>(
          "purchased-templates"
        );
        return fn?.({});
      },
      async getGithubRepository() {
        var getRepos = await getUserFunction<
          {
            name: string;
            fullName: string;
            private: boolean;
            url: string;
            description: string | null;
          }[]
        >("get-private-github-repos");
        const repos = await getRepos?.({});
        return repos;
      },
      async getNpmPackage() {
        var getPackages = await getUserFunction<
          {
            name: string;
            fullName: string;
            private: boolean;
            url: string;
            description: string | null;
          }[]
        >("get-private-npm-packages");
        const packages = await getPackages?.({});
        return packages;
      },
      async getGitlabRepository() {
        var getRepos = await getUserFunction<
          {
            name: string;
            fullName: string;
            private: boolean;
            url: string;
            description: string | null;
          }[]
        >("get-private-gitlab-repos");
        const repos = await getRepos?.({});
        return repos;
      },
    },
    account: {
      async delete(accountId: string) {
        await deleteDoc([mainRef, "accounts", accountId]);
      },
      async upsert(account: Biqpod.Snapbuy.Account) {
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
    brands: {
      async upsert(brand: Biqpod.Snapbuy.Brand) {
        const storeId = brand.storeId;
        setTemp(`updating-hapen-${storeId}.brands`, true);
        const createBrand = await getUserFunction<Biqpod.Snapbuy.Brand>(
          "create-brand"
        );
        var files: File[] | undefined = undefined;
        if (brand.photo?.includes("data:")) {
          const response = await fetch(brand.photo).then((s) => s.blob());
          files = [
            new File([response], "photo.png", {
              type: response.type,
            }),
          ];
        }
        return await createBrand?.(brand, files);
      },
      async getAll(storeId: string) {
        const isUpdatingHapens = getTempFromStore<boolean>(
          `updating-hapen-${storeId}.brands`
        );
        if (!isUpdatingHapens) {
          const brands = getTempFromStore<Biqpod.Snapbuy.Brand[]>(
            `store-data-${storeId}-brands`
          );
          if (brands) {
            return Array.from(brands);
          }
        }
        const brands = await getDocs<Biqpod.Snapbuy.Brand>(
          [mainRef, "brands"],
          {
            where: and(where("storeId", "==", storeId)),
          }
        );
        var result = Array.from(
          brands?.map((brand) => ({ ...brand.data, id: brand.id })) || []
        );
        result.forEach((brand) => {
          setTemp("brands." + brand.id, brand);
        });
        setTemp(`store-data-${storeId}-brands`, result);
        return result;
      },
      async get(brandId: string) {
        const brand = getTempFromStore<Biqpod.Snapbuy.Brand>(
          "brands." + brandId
        );
        if (!brand) {
          const doc = await getDoc<Biqpod.Snapbuy.Brand>([
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
      async delete(brandId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const brand = await this.get(brandId);
        const storeId = brand?.storeId;
        if (storeId) setTemp(`updating-hapen-${storeId}.brands`, true);
        const deleteBrand = await getUserFunction("delete-brand");
        await deleteBrand?.({
          id: brandId,
        });
        setTemp("brands." + brandId, null);
      },
    },
    async getDriveFiles() {
      const fn = await functions.getUserFunction<All[]>(
        "get-files-from-google-drive"
      );
      const files = await fn?.({});
      return files;
    },
    // Brand Management Functions
    async getOrderPacks(orderId: string) {
      const order = getTempFromStore<PackResult[]>("order-packs." + orderId);
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
      const account = getTempFromStore<Biqpod.Snapbuy.Account>(
        "accounts." + accountId
      );
      if (account) {
        return account;
      }
      const doc = await getDoc<Biqpod.Snapbuy.Account>([
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
    client: {},
    async getExploreStores(options: GetExploreStoresOptions) {
      const action = await getUserFunction<
        Biqpod.Snapbuy.Store[],
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
      const orders = await getDocs<Biqpod.Snapbuy.Order>([mainRef, "orders"], {
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
      const existingOrder = await getDoc<Biqpod.Snapbuy.Order>([
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
      const agents = await getDocs<Biqpod.Snapbuy.Account>(
        [mainRef, "accounts"],
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
    // Legacy delivery pricing functions (deprecated - use new delivery options/prices functions)
    deliveryPrice: {
      async add(storeId: string, deliveryPrice: Biqpod.Snapbuy.DeliveryPrice) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        setTemp(`updating-hapen-${storeId}.deliveryPrices`, true);
        const deliveryPriceData: Biqpod.Snapbuy.DeliveryPrice = {
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
      async update(
        storeId: string,
        deliveryPrice: Biqpod.Snapbuy.DeliveryPrice
      ) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        setTemp(`updating-hapen-${storeId}.deliveryPrices`, true);
        const deliveryPriceData: Biqpod.Snapbuy.DeliveryPrice = {
          ...deliveryPrice,
          storeId,
          uid,
        };
        await setDoc(
          [mainRef, "deliveryPrices", deliveryPrice.id!],
          deliveryPriceData
        );
      },
      async delete(deliveryPriceId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const deliveryPrice = await getDoc<Biqpod.Snapbuy.DeliveryPrice>([
          mainRef,
          "deliveryPrices",
          deliveryPriceId,
        ]);
        const storeId = deliveryPrice?.storeId;
        if (storeId) setTemp(`updating-hapen-${storeId}.deliveryPrices`, true);
        await deleteDoc([
          "projects",
          appProjectId,
          "deliveryPrices",
          deliveryPriceId,
        ]);
      },
      async getAll(storeId: string) {
        const isUpdatingHapens = getTempFromStore<boolean>(
          `updating-hapen-${storeId}.deliveryPrices`
        );
        if (!isUpdatingHapens) {
          const deliveryPrices = getTempFromStore<
            Biqpod.Snapbuy.DeliveryPrice[]
          >(`store-data-${storeId}-deliveryPrices`);
          if (deliveryPrices) {
            return deliveryPrices;
          }
        }
        const deliveryPrices = await getDocs<Biqpod.Snapbuy.DeliveryPrice>(
          [mainRef, "deliveryPrices"],
          {
            where: and(where("storeId", "==", storeId)),
            orders: [orderBy("createdAt", "desc")],
          }
        );
        const result =
          deliveryPrices?.map((price) => ({ ...price.data, id: price.id })) ||
          [];
        setTemp(`store-data-${storeId}-deliveryPrices`, result);
        return result;
      },
      options: {
        async add(
          storeId: string,
          deliveryOption: Omit<
            Biqpod.Snapbuy.DeliveryOptions,
            "id" | "uid" | "storeId"
          >
        ) {
          const uid = await getCurrentAuth();
          if (!uid) throw "User not authenticated";
          setTemp(`updating-hapen-${storeId}.deliveryOptions`, true);
          const id = crypto.randomUUID();
          await setDoc([mainRef, "deliveryOptions", id], {
            ...deliveryOption,
            id,
            uid,
            storeId,
          });
          return id;
        },
        async update(
          deliveryOptionId: string,
          deliveryOption: Partial<Biqpod.Snapbuy.DeliveryOptions>
        ) {
          const uid = await getCurrentAuth();
          if (!uid) throw "User not authenticated";
          const existing = await getDoc<Biqpod.Snapbuy.DeliveryOptions>([
            mainRef,
            "deliveryOptions",
            deliveryOptionId,
          ]);
          const storeId = existing?.storeId;
          if (storeId)
            setTemp(`updating-hapen-${storeId}.deliveryOptions`, true);
          await setDoc([mainRef, "deliveryOptions", deliveryOptionId], {
            ...deliveryOption,
            uid,
          });
        },
        async delete(deliveryOptionId: string) {
          const uid = await getCurrentAuth();
          if (!uid) throw "User not authenticated";
          const existing = await getDoc<Biqpod.Snapbuy.DeliveryOptions>([
            mainRef,
            "deliveryOptions",
            deliveryOptionId,
          ]);
          const storeId = existing?.storeId;
          if (storeId)
            setTemp(`updating-hapen-${storeId}.deliveryOptions`, true);
          // Also delete all associated delivery prices
          await deleteDoc([
            "projects",
            appProjectId,
            "deliveryOptions",
            deliveryOptionId,
          ]);
        },
        async getAll(storeId: string) {
          const isUpdatingHapens = getTempFromStore<boolean>(
            `updating-hapen-${storeId}.deliveryOptions`
          );
          if (!isUpdatingHapens) {
            const deliveryOptions = getTempFromStore<
              Biqpod.Snapbuy.DeliveryOptions[]
            >(`store-data-${storeId}-deliveryOptions`);
            if (deliveryOptions) {
              return deliveryOptions;
            }
          }
          const deliveryOptions = await getDocs<Biqpod.Snapbuy.DeliveryOptions>(
            [mainRef, "deliveryOptions"],
            {
              where: and(where("storeId", "==", storeId)),
              orders: [orderBy("createdAt", "desc")],
            }
          );
          const result =
            deliveryOptions?.map((deliveryOption) => ({
              ...deliveryOption.data,
              id: deliveryOption.id,
            })) || [];
          setTemp(`store-data-${storeId}-deliveryOptions`, result);
          return result;
        },
      },
    },
    async addDeliveryPrice(
      deliveryPrice: Omit<Biqpod.Snapbuy.DeliveryPrice, "id" | "uid">
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
      deliveryPrice: Partial<Biqpod.Snapbuy.DeliveryPrice>
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
      const deliveryPrices = await getDocs<Biqpod.Snapbuy.DeliveryPrice>(
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
      const deliveryPrices = await getDocs<Biqpod.Snapbuy.DeliveryPrice>(
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
      async add(pack: Biqpod.Snapbuy.Pack) {
        const storeId = pack.storeId;
        setTemp(`updating-hapen-${storeId}.packs`, true);
        const createPack = await getUserFunction<Biqpod.Snapbuy.Pack>(
          "create-pack"
        );
        return await createPack?.(pack);
      },
      async update(packId: string, pack: Biqpod.Snapbuy.Pack) {
        const storeId = pack.storeId;
        setTemp(`updating-hapen-${storeId}.packs`, true);
        const createPack = await getUserFunction<Biqpod.Snapbuy.Pack>(
          "create-pack"
        );
        return await createPack?.({
          ...pack,
          id: packId,
        });
      },
      async getAll(storeId: string) {
        const isUpdatingHapens = getTempFromStore<boolean>(
          `updating-hapen-${storeId}.packs`
        );
        if (!isUpdatingHapens) {
          const packs = getTempFromStore<Biqpod.Snapbuy.Pack[]>(
            `store-data-${storeId}-packs`
          );
          if (packs) {
            return packs;
          }
        }
        const packs = await getDocs<Biqpod.Snapbuy.Pack>([mainRef, "packs"], {
          where: and(where("storeId", "==", storeId)),
        });
        const result =
          packs?.map((pack) => ({ ...pack.data, id: pack.id })) || [];
        setTemp(`store-data-${storeId}-packs`, result);
        return result;
      },
      async get(packId: string) {
        const pack = getTempFromStore<Biqpod.Snapbuy.Pack>("packs." + packId);
        if (pack) {
          return pack;
        }
        const doc = await getDoc<Biqpod.Snapbuy.Pack>([
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
        const pack = await this.get(packId);
        const storeId = pack?.storeId;
        if (storeId) setTemp(`updating-hapen-${storeId}.packs`, true);
        const deletePack = await getUserFunction("delete-pack");
        await deletePack?.({ packId });
      },
    },
    async getNotificationSettings(storeId: string) {
      const store = await getDoc<Required<Biqpod.Snapbuy.Store>>([
        "projects",
        appProjectId,
        "stores",
        storeId,
      ]);
      return store?.notify;
    },
    // Customer Management Functions
    customer: {
      async create(customer: Omit<Biqpod.Snapbuy.Customer, "createdAt">) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const storeId = customer.storeId;
        setTemp(`updating-hapen-${storeId}.customers`, true);
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
        const customer = await getDoc<Biqpod.Snapbuy.Customer>([
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
        const isUpdatingHapens = getTempFromStore<boolean>(
          `updating-hapen-${storeId}.customers`
        );
        if (!isUpdatingHapens) {
          const customers = getTempFromStore<Biqpod.Snapbuy.Customer[]>(
            `store-data-${storeId}-customers`
          );
          if (customers) {
            return customers;
          }
        }
        const customers = await getDocs<Biqpod.Snapbuy.Customer>(
          [mainRef, "customers"],
          {
            where: and(where("storeId", "==", storeId)),
            orders: [orderBy("createdAt", "desc")],
          }
        );
        const result =
          customers?.map((customer) => ({
            ...customer.data,
            id: customer.id,
          })) || [];
        setTemp(`store-data-${storeId}-customers`, result);
        return result;
      },
      async updateStatus(
        customerId: string,
        status: "pending" | "rejected" | "accepted"
      ) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const customer = await this.get(customerId);
        const storeId = customer?.storeId;
        if (storeId) setTemp(`updating-hapen-${storeId}.customers`, true);
        await updateDoc([mainRef, "customers", customerId], {
          status,
        });
      },
      async delete(customerId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const customer = await this.get(customerId);
        const storeId = customer?.storeId;
        if (storeId) setTemp(`updating-hapen-${storeId}.customers`, true);
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
      async getOrders(
        couponId: string,
        startAtCreatedAt?: number,
        limit: number = 20
      ) {
        const orders = await getDocs<Biqpod.Snapbuy.Order>(
          [mainRef, "orders"],
          {
            where: and(where("couponId", "==", couponId)),
            orders: [orderBy("createdAt", "desc")],
            limit,
            startAt: startAtCreatedAt ? [startAtCreatedAt] : undefined,
          }
        );
        return orders?.map((order) => order.data);
      },
      async upsert(coupon: Biqpod.Snapbuy.Coupon) {
        const storeId = coupon.storeId;
        setTemp(`updating-hapen-${storeId}.coupons`, true);
        const upsertCoupon = await getUserFunction<string>("create-coupon");
        const couponId = await upsertCoupon?.(coupon);
        return couponId;
      },
      async getAll(storeId: string) {
        const isUpdatingHapens = getTempFromStore<boolean>(
          `updating-hapen-${storeId}.coupons`
        );
        if (!isUpdatingHapens) {
          const coupons = getTempFromStore<Biqpod.Snapbuy.Coupon[]>(
            `store-data-${storeId}-coupons`
          );
          if (coupons) {
            return coupons;
          }
        }
        const coupons = await getDocs<Biqpod.Snapbuy.Coupon>(
          [mainRef, "coupons"],
          {
            where: and(where("storeId", "==", storeId)),
            orders: [orderBy("createdAt", "desc")],
          }
        );
        const result =
          coupons?.map((coupon) => ({ ...coupon.data, id: coupon.id })) || [];
        setTemp(`store-data-${storeId}-coupons`, result);
        return result;
      },
      async get(couponId: string) {
        const coupon = getTempFromStore<Biqpod.Snapbuy.Coupon>(
          "coupons." + couponId
        );
        if (coupon) {
          return coupon;
        }
        const doc = await getDoc<Biqpod.Snapbuy.Coupon>([
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
        const coupon = await this.get(couponId);
        const storeId = coupon?.storeId;
        if (storeId) setTemp(`updating-hapen-${storeId}.coupons`, true);
        const deleteCoupon = await getUserFunction("delete-coupon");
        await deleteCoupon?.({ id: couponId });
        setTemp("coupons." + couponId, null);
      },
      async validate(code: string, storeId: string, orderAmount: number) {
        const coupons = await getDocs<Biqpod.Snapbuy.Coupon>(
          [mainRef, "coupons"],
          {
            where: and(
              where("code", "==", code),
              where("storeId", "==", storeId),
              where("isActive", "==", true)
            ),
          }
        );
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
      async upsert(variable: Biqpod.Snapbuy.Var) {
        const storeId = variable.storeId;
        setTemp(`updating-hapen-${storeId}.vars`, true);
        const createVar = await getUserFunction<string>("create-var");
        const varId = await createVar?.(variable);
        return varId;
      },
      async getAll(storeId: string) {
        const isUpdatingHapens = getTempFromStore<boolean>(
          `updating-hapen-${storeId}.vars`
        );
        if (!isUpdatingHapens) {
          const vars = getTempFromStore<Biqpod.Snapbuy.Var[]>(
            `store-data-${storeId}-vars`
          );
          if (vars) {
            return vars;
          }
        }
        const vars = await getDocs<Biqpod.Snapbuy.Var>([mainRef, "vars"], {
          where: and(where("storeId", "==", storeId)),
          orders: [orderBy("createdAt", "desc")],
        });
        const result =
          vars?.map((variable) => ({ ...variable.data, id: variable.id })) ||
          [];
        setTemp(`store-data-${storeId}-vars`, result);
        return result;
      },
      async get(varId: string) {
        const variable = getTempFromStore<Biqpod.Snapbuy.Var>("vars." + varId);
        if (variable) {
          return variable;
        }
        const doc = await getDoc<Biqpod.Snapbuy.Var>([
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
        const variable = await this.get(varId);
        const storeId = variable?.storeId;
        if (storeId) setTemp(`updating-hapen-${storeId}.vars`, true);
        const deleteVar = await getUserFunction("delete-var");
        await deleteVar?.({ id: varId });
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
        const accessData: Biqpod.Snapbuy.Access = {
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
        const existingAccess = await getDoc<Biqpod.Snapbuy.Access>([
          "projects",
          appProjectId,
          "store-access",
          accessId,
        ]);
        if (!existingAccess) throw "Access record not found";
        const updatedAccess: Biqpod.Snapbuy.Access = {
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
        const accessRecords = await getDocs<Biqpod.Snapbuy.Access>(
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
        const accessRecords = await getDocs<Biqpod.Snapbuy.Access>(
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
            const store = await snapbuyApi.store.get(access.storeId!);
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
        const docs = await getDocs<Biqpod.Snapbuy.Access>(
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
        const docs = await getDocs<Biqpod.Snapbuy.Access>(
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
        const accessRecords = await getDocs<Biqpod.Snapbuy.Access>(
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
    friends: {
      async getList(limit: number = 50) {
        const users = await getDocs<Biqpod.Account.User>(["users"], {
          limit,
        });
        return users?.map((user) => ({ ...user.data, id: user.id })) || [];
      },
      async get(userId: string) {
        const user = getTempFromStore<Biqpod.Account.User>("users." + userId);
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
    },
    // Invoice Management Functions
    invoice: {
      async create(invoice: Partial<Biqpod.Snapbuy.Invoice>) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const currentStore = getStoreId();
        if (!currentStore) {
          throw "NO STORE SELECTED";
        }
        setTemp("updating-hapen.invoices", true);
        const id = invoice.id || crypto.randomUUID();
        const now = Date.now();
        // Calculate total from products
        const subtotal = Object.values(invoice.products || {}).reduce(
          (sum, product) => sum + (product?.count || 0) * (product?.price || 0),
          0
        );
        const tax = invoice.tax || 0;
        const discount = invoice.discount || 0;
        const total = subtotal + tax - discount;
        const invoiceData: Biqpod.Snapbuy.Invoice = {
          ...invoice,
          storeId: currentStore,
          id,
          uid,
          total,
          createdAt: now,
          updatedAt: now,
          products: invoice.products || {},
          status: invoice.status || "draft",
        };
        await setDoc([mainRef, "invoices", id], invoiceData);
        setTemp("invoices." + id, invoiceData);
        return invoiceData;
      },
      async getAll(storeId: string) {
        const isUpdatingHapens = getTempFromStore<boolean>(
          "updating-hapen.invoices"
        );
        if (!isUpdatingHapens) {
          const invoices = getTempFromStore<Biqpod.Snapbuy.Invoice[]>(
            "invoices." + storeId
          );
          if (invoices) {
            return invoices;
          }
        }
        const invoices = await getDocs<Biqpod.Snapbuy.Invoice>(
          [mainRef, "invoices"],
          {
            where: and(where("storeId", "==", storeId)),
            orders: [orderBy("createdAt", "desc")],
          }
        );
        const result =
          invoices?.map((invoice) => ({ ...invoice.data, id: invoice.id })) ||
          [];
        result.forEach((invoice) => {
          setTemp("invoices." + invoice.id, invoice);
        });
        setTemp("invoices." + storeId, result);
        return result;
      },
      async get(invoiceId: string) {
        const invoice = getTempFromStore<Biqpod.Snapbuy.Invoice>(
          "invoices." + invoiceId
        );
        if (invoice) {
          return invoice;
        }
        const doc = await getDoc<Biqpod.Snapbuy.Invoice>([
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
      async delete(invoiceId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        setTemp("updating-hapen.invoices", true);
        await deleteDoc([mainRef, "invoices", invoiceId]);
        setTemp("invoices." + invoiceId, null);
      },
    },
    order: {
      async get(orderId: string) {
        const ref = "orders." + orderId;
        const saved = getTempFromStore<Biqpod.Snapbuy.Order>(ref);
        if (saved) {
          return saved;
        }
        const fn = await getUserFunction<Biqpod.Snapbuy.Order>("get-order");
        const order = await fn?.({
          id: orderId,
        });
        if (order) {
          setTemp(ref, order);
        }
        return order;
      },
      async getList(
        storeId: string,
        filterOptions?: FilterOrdersProps | null,
        limit?: number,
        startAt?: number
      ) {
        const uid = await getCurrentAuth();
        const currentTime = new Date();
        var subTime: Date | null = null;
        switch (filterOptions?.time) {
          case "today":
            currentTime.setHours(0, 0, 0, 0);
            subTime = new Date(currentTime.getTime());
            break;
          case "this week": {
            const dayOfWeek = currentTime.getDay();
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday
            currentTime.setDate(currentTime.getDate() - daysToSubtract);
            currentTime.setHours(0, 0, 0, 0);
            subTime = new Date(currentTime.getTime());
            break;
          }
          case "this month":
            currentTime.setDate(1);
            currentTime.setHours(0, 0, 0, 0);
            subTime = new Date(currentTime.getTime());
            break;
          case "this year":
            currentTime.setMonth(0, 1);
            currentTime.setHours(0, 0, 0, 0);
            subTime = new Date(currentTime.getTime());
            break;
          case "last week": {
            // Go to start of this week, then subtract 7 days
            const dayOfWeek = currentTime.getDay();
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const startOfThisWeek = new Date(currentTime.getTime());
            startOfThisWeek.setDate(currentTime.getDate() - daysToSubtract);
            startOfThisWeek.setHours(0, 0, 0, 0);
            const startOfLastWeek = new Date(startOfThisWeek.getTime());
            startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
            subTime = startOfLastWeek;
            break;
          }
          case "last month": {
            // Go to start of this month, then subtract 1 month
            const startOfThisMonth = new Date(
              currentTime.getFullYear(),
              currentTime.getMonth(),
              1,
              0,
              0,
              0,
              0
            );
            const startOfLastMonth = new Date(startOfThisMonth);
            startOfLastMonth.setMonth(startOfThisMonth.getMonth() - 1);
            subTime = startOfLastMonth;
            break;
          }
          case "last year": {
            // Go to start of this year, then subtract 1 year
            const startOfThisYear = new Date(
              currentTime.getFullYear(),
              0,
              1,
              0,
              0,
              0,
              0
            );
            const startOfLastYear = new Date(startOfThisYear);
            startOfLastYear.setFullYear(startOfThisYear.getFullYear() - 1);
            subTime = startOfLastYear;
            break;
          }
        }
        const selection: CloudSelection<Biqpod.Snapbuy.Order> = {
          where: and(
            where("uid", "==", uid),
            filterOptions?.phone &&
              where("client.phone", "==", filterOptions.phone),
            subTime && where("createdAt", ">=", subTime.getTime()),
            filterOptions?.status &&
              where("status", "==", filterOptions.status),
            filterOptions?.delivery &&
              filterOptions.delivery !== "all" &&
              where("delivery", "==", filterOptions.delivery == "delivere"),
            where("storeId", "==", storeId)
          ),
          orders: mergeArray(
            orderBy(
              "createdAt",
              filterOptions?.orderBy == "asc" ? "asc" : "desc"
            )
          ),
          limit,
          startAt: startAt ? [startAt] : undefined,
        };
        const newOrders = await cloud.app.nosql.getDocs<Biqpod.Snapbuy.Order>(
          ["projects", import.meta.env.VITE_PROJECT_ID, "orders"],
          selection
        );
        if (!newOrders) {
          return;
        }
        const list = newOrders.map((order) => ({
          ...order.data,
          id: order.id,
        }));
        list.map((data) => {
          setTemp("orders." + data.id, data);
        });
        return list;
      },
      async create(order: CreateOrderOptions) {
        const createOrder = await getUserFunction<
          { message: string; order: Biqpod.Snapbuy.Order },
          CreateOrderOptions
        >("create-order");
        return await createOrder?.(order);
      },
      async getProducts(orderId: string) {
        const savedProducts = getTempFromStore<ProductsResult[]>(
          "order-products." + orderId
        );
        if (savedProducts) {
          return savedProducts;
        }
        const fn = await getUserFunction<ProductsResult[]>(
          "get-order-products"
        );
        const products = await fn?.({
          orderId,
        });
        setTemp("order-products." + orderId, products || []);
        return products;
      },
      async delete(orderId: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        await deleteDoc([mainRef, "orders", orderId]);
        setTemp("order-products." + orderId, null);
      },
      async edit(orderId: string, edit: Biqpod.Snapbuy.Order["edit"]) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const existingOrder = await getDoc<Biqpod.Snapbuy.Order>([
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
      async updateStatus(
        orderId: string,
        status: Biqpod.Snapbuy.Order["status"]
      ) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const fn = await getUserFunction("update-order-status");
        await fn?.({
          id: orderId,
          status,
        });
      },
    },
    usage: {
      async get(storeId: string) {
        const fn = await getUserFunction<Partial<Record<DataTypes, number>>>(
          "usage"
        );
        const response = await fn?.({ storeId });
        return response;
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
        interface PriceResult {
          type: DataTypes;
          extraPrice: number;
          unit: string;
        }
        const ref = "get-usages-pricing";
        const prices = getTempFromStore<PriceResult[]>(ref);
        if (prices) {
          return prices;
        }
        const fn = await getFunction<PriceResult[]>("get-usages-pricing");
        const response = await fn?.({});
        if (response) {
          setTemp(ref, response);
        }
        return response;
      },
      async getPayments(storeId: string) {
        const ref = "payments." + storeId;
        const list = getTempFromStore<Biqpod.Account.Payout[]>(ref);
        if (list) {
          return list;
        }
        const fn = await getUserFunction<Biqpod.Account.Payout[]>(
          "get-payments"
        );
        const result = await fn?.({ storeId });
        setTemp(ref, result);
        return result;
      },
      async getCurrentPayments(storeId: string) {
        const ref = "current-payments." + storeId;
        const savedPays = getTempFromStore<Biqpod.Account.Payout[]>(ref);
        if (savedPays) {
          return savedPays;
        }
        const fn = await getUserFunction<Biqpod.Account.Payout[]>(
          "current-payments"
        );
        const response = await fn?.({ storeId });
        if (response) {
          setTemp(ref, response);
        }
        return response;
      },
    },
    notifications: {
      async list(options: {
        storeId?: string;
        limit?: number;
        startAt?: number;
        type?: Biqpod.Snapbuy.Notification["type"];
      }) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const selection: CloudSelection<Biqpod.Snapbuy.Notification> = {
          where: and(
            where("uid", "==", uid),
            options.storeId && where("meta.storeId", "==", options.storeId)
          ),
          orders: [orderBy("createdAt", "desc")],
          limit: options.limit,
          startAt: options.startAt ? [options.startAt] : undefined,
        };
        const notifications = await cloud.app.nosql.getDocs(
          [mainRef, "notifications"],
          selection
        );
        return notifications?.map((notif) => notif.data);
      },
      markAsRead(notificationId: string) {
        return cloud.app.nosql.updateDoc(
          [mainRef, "notifications", notificationId],
          {
            readed: true,
          }
        );
      },
      on(
        callback?: (notification: Biqpod.Snapbuy.Notification) => void,
        options?: {
          storeId?: string;
          type?: Biqpod.Snapbuy.Notification["type"];
        }
      ) {
        var unOnCollections: (() => void)[] = [];
        const rucc = (startAt?: number) => {
          const unner = onCollectionSnapshot<Biqpod.Snapbuy.Notification>(
            [mainRef, "notifications"],
            (changes) => {
              const not = changes.at(0)?.data;
              if (not) {
                callback?.(not);
                unner?.();
                if (not.createdAt) {
                  rucc(not.createdAt);
                }
              }
            },
            {
              orders: [orderBy("createdAt", "desc")],
              startAt: startAt ? [startAt] : undefined,
              where: and(
                options?.storeId &&
                  where("meta.storeId", "==", options.storeId),
                options?.type && where("type", "==", options.type)
              ),
              limit: 1,
            }
          );
          if (unner) {
            unOnCollections.push(unner);
          }
          return unner;
        };
        this.first(options?.storeId).then((notif) => {
          rucc(notif?.createdAt);
        });
        return () => {
          unOnCollections.forEach((un) => un());
        };
      },
      async first(storeId?: string) {
        const uid = await getCurrentAuth();
        if (!uid) throw "User not authenticated";
        const notifications =
          await cloud.app.nosql.getDocs<Biqpod.Snapbuy.Notification>(
            [mainRef, "notifications"],
            {
              where: and(
                where("uid", "==", uid),
                storeId && where("meta.storeId", "==", storeId)
              ),
              orders: [orderBy("createdAt", "desc")],
              limit: 1,
            }
          );
        return notifications?.[0]?.data || null;
      },
    },
  };
  return snapbuyApi;
};
export const snapbuyApi = createApi(cloud);
