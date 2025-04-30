/// <reference types="vite/client" />
declare interface Tab {
  name: string;
  link: string;
  icon: IconProps["icon"];
}
declare namespace SnapBuy {
  type OrderStatus =
    | "pending"
    | "completed"
    | "cancelled"
    | "done"
    | "processing"
    | "delivery";
  interface Store {
    id: string;
    name: string;
    photo?: string;
    uid: string;
  }
  interface Order {
    status: OrderStatus;
    uid: string;
    id: string;
    createdAt?: number;
    updatedAt?: number;
    products?: Partial<Record<string, { count?: number; price?: number }>>;
    clientId: string;
    // needed
    storeId?: string;
    uid?: string;
  }
  interface AccessToken {
    id: string;
    clientId: string;
    value: string;
    usedBy?: string;
    // needed
    storeId?: string;
    uid?: string;
  }
  interface Client {
    id: string;
    name: string;
    phone: string;
    // needed
    storeId?: string;
    uid?: string;
  }
  interface Product {
    id: string;
    name: string;
    price: number;
    photos?: string[];
    description?: string;
    category?: string;
    available?: boolean;
    market?: string;
    metadata?: {
      [key: string]: string;
    };
    // needed
    storeId?: string;
    uid?: string;
  }
  interface Account {
    name: string;
    email: string;
    phone: string;
    id: string;
    // needed
    storeId?: string;
    uid?: string;
  }
}
declare interface SnapBuyApi {
  markets: string[];
  categorys: string[];
}
declare interface ClientResult {
  client: SnapBuy.Client;
  access: SnapBuy.AccessToken;
}
declare interface AddClientActionProps {
  exists?: SnapBuy.Client[];
  news?: SnapBuy.Client[];
}
declare interface AddProductActionProps {
  exists?: SnapBuy.Product[];
  news?: SnapBuy.Product[];
}
