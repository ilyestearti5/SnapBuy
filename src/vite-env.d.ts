/// <reference types="vite/client" />
declare interface Tab {
  name: string;
  link: string;
  icon: IconProps["icon"];
}
declare namespace SnapBuy {
  interface Collection {
    id?: string;
    name: string;
    uid?: string;
    createdAt?: number;
    storeId?: string;
    products?: string[];
    photo?: string;
  }
  type OrderStatus =
    | "pending"
    | "completed"
    | "cancelled"
    | "done"
    | "processing"
    | "delivery";
  type PixelId = "facebook" | "instagram" | "tiktok" | "snapchat";
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
    createdAt?: number;
    accessLink?: string;
    pixels?: {
      facebook?: string;
      instagram?: string;
      tiktok?: string;
      snapchat?: string;
    };
    platforms?: {
      facebook?: string;
      snapchat?: string;
      tiktok?: string;
      instagram?: string;
      youtube?: string;
      telegram?: string;
      discord?: string;
      reddit?: string;
      linkedin?: string;
      pinterest?: string;
      x?: string;
      chrome?: string;
      edge?: string;
      safari?: string;
    };
    template?: string | null;
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
    // needed
    storeId?: string;
    uid?: string;
    platform?: Platform;
    totalPrice?: number;
    isDelivery?: boolean;
    delivery?: {
      uid: string;
      assignedAt: number;
      agentId?: string;
    };
    metaData?: Record<string, SettingValueType>;
  }
  export type Zone = Partial<{
    id: string;
    centerX: number;
    centerY: number;
    radius: number;
    uid: string;
    name: string;
  }>;
  export type LinkZone = Partial<{
    id: string;
    first: string;
    second: string;
    price: number;
    uid: string;
  }>;
  export type DeliveryCompanyRole =
    | "merchant"
    | "customer"
    | "admin"
    | "support"
    | "warehouse_operator"
    | "delivery_agent"
    | "finance"
    | "franchise_partner";
  export interface Account {
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
  interface Pack {
    id?: string;
    storeId?: string;
    name?: string;
    uid?: string;
    price?: number;
    products?: { prodId: string; count: number }[];
  }
  interface Client {
    id: string;
    firstname?: string;
    lastname?: string;
    phone: string;
    place: {
      address: string;
      wilaya: string;
      latitude?: number;
      longitude?: number;
    };
    // needed
    storeId?: string;
    uid?: string;
  }
  interface Template {
    id?: string;
    creatorId?: string;
    name?: string;
    description?: string;
    url?: string;
    photo?: string;
    status?: "rejected" | "accepted";
    createdAt?: number;
  }
  interface Brand {
    id?: string;
    name?: string;
    description?: string;
    photo?: string;
    uid?: string;
    storeId?: string;
    createdAt?: number;
    updatedAt?: number;
  }
  interface Product {
    storeId?: string;
    id?: string;
    name?: string;
    description?: string;
    photos?: string[];
    uid?: string;
    createdAt?: number;
    quantity?: number;
    keys?: string[];
    available?: boolean;
    type?: "single" | "multiple";
    limited?: boolean;
    single?: {
      price?: number;
    };
    metaData?: Partial<
      Record<
        string,
        import("@biqpod/app/ui/types").SettingValueType[keyof import("@biqpod/app/ui/types").SettingValueType]
      >
    >;
    multiple?: {
      prices?: {
        quantity: number;
        price: number;
      }[];
    };
    formCollectionId?: string;
    brandId?: string;
  }
}
declare interface SnapBuyApi {
  markets: string[];
}
declare interface AddClientActionProps {
  exists?: SnapBuy.Client[];
  news?: SnapBuy.Client[];
}
declare interface AddProductActionProps {
  exists?: SnapBuy.Product[] | null;
  news?: SnapBuy.Product[] | null;
}
declare module "html2pdf.js" {
  // You can add more specific type definitions here as you explore the library's API.
  const html2pdf: any;
  export default html2pdf;
}

declare type keys =
  | keyof SnapBuy.Product
  | "single.price"
  | "multiple.prices"
  | "multiple.counts";
