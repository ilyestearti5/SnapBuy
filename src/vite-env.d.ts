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
    uid?: string;
    phone: string;
    address?: {
      latitude: number;
      longitude: number;
    };
  }
  type Platform =
    | "facebook"
    | "messenger"
    | "instagram"
    | "tiktok"
    | "snapchat"
    | "twitter"
    | "reddit"
    | "discord"
    | "telegram"
    | "linkedin"
    | "pinterest"
    | "youtube"
    | "wechat"
    | "edge"
    | "opera"
    | "chrome"
    | "safari"
    | "firefox"
    | "unknown";
  interface Order {
    status: OrderStatus;
    id: string;
    createdAt?: number;
    updatedAt?: number;
    products?: Partial<Record<string, { count?: number; price?: number }>>;
    client: Client;
    key?: string;
    // needed
    storeId?: string;
    uid?: string;
    platform?: Platform;
  }

  export type DeliveryCompanyRole =
    | "merchant"
    | "customer"
    | "admin"
    | "support"
    | "warehouse_operator"
    | "delivery_agent"
    | "finance"
    | "franchise_partner";

  interface Account {
    id?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
    };
    role?: DeliveryCompanyRole;
    createdAt?: number;
  }
  interface Follow {
    follow: boolean;
    updatedAt: number;
    followed: string;
    follower: string;
  }
  interface Client {
    id: string;
    firstname?: string;
    lastname?: string;
    phone: string;
    place: {
      address: string;
      wilaya: string;
    };
    // needed
    storeId?: string;
    uid?: string;
  }
  interface Product {
    storeId: string;
    id: string;
    name: string;
    description: string;
    photos: string[];
    uid?: string;
    createdAt?: number;
    quantity: number;
    sizes?: string[];
    colors?: string[];
    keys?: string[];
    available?: boolean;
    category?: string | Nothing;
    theme?: Partial<Record<import("@biqpod/app/ui/hooks").ColorIds, string>>;
    type?: "single" | "multiple";
    limited?: boolean;
    single?: {
      price?: number;
    };
    multiple?: {
      prices?: {
        quantity: number;
        price: number;
      }[];
    };
  }
}
declare interface SnapBuyApi {
  markets: string[];
  categorys: string[];
}
declare interface AddClientActionProps {
  exists?: SnapBuy.Client[];
  news?: SnapBuy.Client[];
}
declare interface AddProductActionProps {
  exists?: SnapBuy.Product[];
  news?: SnapBuy.Product[];
}
declare module "html2pdf.js" {
  // You can add more specific type definitions here as you explore the library's API.
  const html2pdf: any;
  export default html2pdf;
}
