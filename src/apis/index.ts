import {
  getTemp,
  getTempFromStore,
  setTemp,
  useAsyncMemo,
  useTemp,
  useUser,
} from "biqpod/ui/hooks";
import {
  deleteDoc,
  getCurrentAuth,
  getDoc,
  getDocs,
  onCollectionSnapshot,
  onDocSnapshot,
  setDoc,
} from "../server";
import { Biqpod } from "biqpod/ui/types";
import { and, getUserFunction, where } from "biqpod/ui/apis";
import { mapAsync, unpackPromise } from "biqpod/ui/utils";
import { useEffect } from "react";
export const api = {
  async getProduct(productId: string) {
    const uid = await getCurrentAuth();
    if (!uid) {
      return null;
    }
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
    const markets = projectInfo?.markets || [];
    const categorys = projectInfo?.categorys || [];
    await mapAsync(products, async (product, index) => {
      await unpackPromise(() => {
        return onBeforeStart?.(product, index);
      });
      const prodId = product.id;
      if (!product.market) throw "Market is required";
      if (!product.category) throw "Category is required";
      const market = product.market;
      const category = product.category;
      !markets.includes(market) && markets.push(market);
      !categorys.includes(category) && categorys.push(market);
      await setDoc(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products", prodId],
        {
          ...product,
          id: prodId,
          uid,
        }
      );
    });
    await setDoc(["users", uid, "projects", import.meta.env.VITE_PROJECT_ID], {
      categorys,
      markets,
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
  async getAllClients() {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const clients = await getDocs<SnapBuy.Client>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "clients"],
      {
        where: and(where("uid", "==", uid)),
      }
    );
    var object: Record<string, SnapBuy.Client> = {};
    clients?.forEach(({ id, data }) => {
      object[id] = data;
    });
    setTemp("clients", object);
    return clients?.map((client) => client.data) || [];
  },
  async getClient(clientId: string) {
    const user = getTempFromStore<Biqpod.Account.User>("user-info");
    if (!user?.uid) {
      return null;
    }
    const client = getTempFromStore<SnapBuy.Client>("clients." + clientId);
    if (!client) {
      const doc = await getDoc<SnapBuy.Client>([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "clients",
        clientId,
      ]);
      if (doc) {
        setTemp("clients." + clientId, doc);
      }
      return doc;
    }
    return client;
  },
  async upsertClients(
    clients: Partial<SnapBuy.Client>[],
    onBeforeStart?: (
      client: Partial<SnapBuy.Client>,
      index: number
    ) => void | Promise<void>
  ) {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    await mapAsync(clients, async (client, index) => {
      await unpackPromise(() => {
        return onBeforeStart?.(client, index);
      });
      const prodId = client.id;
      await setDoc(
        ["projects", import.meta.env.VITE_PROJECT_ID, "clients", prodId],
        {
          ...client,
          id: prodId,
          uid,
        }
      );
    });
  },
  async deleteProduct(productId: string) {
    await deleteDoc([
      "projects",
      import.meta.env.VITE_PROJECT_ID,
      "products",
      productId,
    ]);
  },
  // accounts
  async getAccounts() {
    const uid = await getCurrentAuth();
    if (!uid) throw "User not authenticated";
    const accounts = await getDocs<SnapBuy.Account>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "accounts"],
      {
        where: and(where("uid", "==", uid)),
      }
    );
    var object: Record<string, SnapBuy.Account> = {};
    accounts?.forEach(({ id, data }) => {
      object[id] = data;
    });
    setTemp("accounts", object);
    return accounts?.map((account) => account.data) || [];
  },
  async getAccount(accountId: string) {
    const user = getTempFromStore<Biqpod.Account.User>("user-info");
    if (!user?.uid) {
      return null;
    }
    const account = getTempFromStore<SnapBuy.Account>("accounts." + accountId);
    if (!account) {
      const doc = await getDoc<SnapBuy.Account>([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "accounts",
        accountId,
      ]);
      if (doc) {
        setTemp("accounts." + accountId, doc);
      }
      return doc;
    }
    return account;
  },
  onAccountsChange(
    uid: string,
    callback?: (accounts: SnapBuy.Account[]) => void
  ) {
    if (!uid) {
      return () => {};
    }
    return onCollectionSnapshot<SnapBuy.Account>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "accounts"],
      (records) => {
        callback?.(records.map((r) => ({ ...r.data, id: r.id })));
      },
      {
        where: and(where("uid", "==", uid)),
      }
    );
  },
  // client config auth
  async siginClient(code: string) {
    const siginClient = await getUserFunction<{ token: string }>(
      "snapbuy-signin-client"
    );
    const result = await siginClient?.({ code });
    if (result?.token) {
      await setClientAuthToken(result.token);
    }
  },
  async siginClientByAccessId(accessId: string) {
    const siginClient = await getUserFunction<{ token: string }>(
      "snapbuy-signin-client-by-accessId"
    );
    const result = await siginClient?.({ accessId });
    if (result?.token) {
      await setClientAuthToken(result.token);
    }
  },
  async getCurrentClient() {
    const token = await getClientAuthToken();
    const getClient = await getUserFunction<ClientResult>("snapbuy-get-client");
    const client = await getClient?.({ token });
    return client;
  },
  async getAccess(accessId: string) {
    const getUser = await getUserFunction<SnapBuy.AccessToken>(
      "snapbuy-get-access"
    );
    const user = getUser?.({ accessId });
    return user;
  },
  async generateClientAuth(acccessId: string) {
    const getAuth = await getUserFunction<{ url: string }>(
      "snapbuy-generate-client-auth"
    );
    const response = await getAuth?.({ acccessId });
    return response?.url;
  },
  onClientAccessChange(callback: (client: ClientResult | null) => void) {
    var token: string | null = null;
    const timer = setInterval(async () => {
      const currentToken = await getClientAuthToken();
      if (currentToken != token) {
        token = currentToken;
        const client = await api.getCurrentClient();
        callback(client || null);
      }
    }, 200);
    return () => clearInterval(timer);
  },
  async createOrder(order: Omit<SnapBuy.Order, "clientId">) {
    const uid = await getCurrentAuth();
    const client = await this.getCurrentClient();
    if (!uid) throw "User not authenticated";
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "orders", order.id],
      {
        ...order,
        clientId: client?.client.id,
        uid: client?.access.uid,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      }
    );
  },
  async getOrderProducts(order: string | SnapBuy.Order) {
    const result =
      typeof order === "string"
        ? await getDoc<SnapBuy.Order>([
            "projects",
            import.meta.env.VITE_PROJECT_ID,
            "orders",
            order,
          ])
        : order;
    const products = result?.products || {};
    const r = await mapAsync(Object.entries(products), async (args) => {
      const [prodId, r] = args;
      const { count = 0, price = 0 } = r || {};
      const product = await getDoc<SnapBuy.Product>([
        "projects",
        import.meta.env.VITE_PROJECT_ID,
        "products",
        prodId,
      ]);
      return {
        ...product,
        id: prodId,
        count,
        price,
      };
    });
    return r.sort((a, b) => {
      if (!a.name) return 1;
      if (!b.name) return -1;
      return a.name.localeCompare(b.name);
    });
  },
  // account config auth
  async siginAccount(code: string) {
    const siginAccount = await getUserFunction<{ token: string }>(
      "snapbuy-signin-account"
    );
    const result = await siginAccount?.({ code });
    if (result?.token) {
      await setAccountAuthToken(result.token);
    }
  },
  async getCurrentAccount() {
    const token = await getAccountAuthToken();
    const getAccount = await getUserFunction<SnapBuy.Account>(
      "snapbuy-get-account"
    );
    const account = getAccount?.({ token });
    return account;
  },
  async generateAccountAuth(clientId: string) {
    const getAuth = await getUserFunction<{ url: string }>(
      "snapbuy-get-account"
    );
    const url = await getAuth?.({ clientId });
    return url;
  },
};
export const getClientAuthToken = async () => {
  return localStorage.getItem("client-auth");
};
export const setClientAuthToken = async (token: string | null) => {
  return token
    ? localStorage.setItem("client-auth", token)
    : localStorage.removeItem("client-auth");
};
export const getAccountAuthToken = async () => {
  return localStorage.getItem("account-auth");
};
export const setAccountAuthToken = async (token: string | null) => {
  return token
    ? localStorage.setItem("account-auth", token)
    : localStorage.removeItem("account-auth");
};
export const useCategorys = () => {
  return getTemp<string[]>("categorys");
};
export const useMarkets = () => {
  return getTemp<string[]>("markets");
};
export const useFocused = () => {
  return getTemp<string>("input.focused");
};
export const listenClient = () => {
  useEffect(() => {
    return api.onClientAccessChange((client) => {
      setTemp("current-client", client);
    });
  }, []);
};
export const useCurrentClient = () => {
  const client = getTemp<ClientResult | null>("current-client");
  return client;
};
