/// <reference types="vite/client" />
declare interface Tab {
  name: string;
  link: string;
  icon: IconProps["icon"];
}
type SettingType = import("@biqpod/app/ui/types").SettingValueType;
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
  interface DeliveryPricing {
    id?: string;
    description: string;
    price: number;
    name: string;
    createdAt: number;
  }
  interface DeliveryOptions {
    id?: string;
    storeId: string;
    description: string;
    name: string;
    type: "store" | "domicile" | "office";
    createdAt: number;
    uid?: string;
  }
  interface DeliveryPrice {
    id?: string;
    name: string;
    price: number;
    deliveryOptionId: string;
    storeId: string;
    uid?: string;
    createdAt: number;
  }
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
      mail?: string;
    };
    template?: string | null;
    notify?: {
      newOrder?: boolean;
      orderStatusChanged?: boolean;
      orderCompleted?: boolean;
      orderCancelled?: boolean;
      orderProcessing?: boolean;
      orderDelivery?: boolean;
      lowStock?: boolean;
      newProduct?: boolean;
      newClient?: boolean;
      accountAutoAccept?: boolean;
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
    | "unknown"
    | "agent";
  interface Order {
    status: OrderStatus;
    id: string;
    createdAt?: number;
    updatedAt?: number;
    products?: Partial<Record<string, { count?: number; price?: number }>>;
    packs?: Partial<Record<string, { count?: number; price?: number }>>;
    client?: Client;
    customer?: string;
    // needed
    storeId?: string;
    uid?: string;
    platform?: Platform;
    totalPrice?: number;
    deliveryPrice?: number;
    delivery?: {
      uid: string;
      assignedAt: number;
      agentId?: string;
    };
    metaData?: Record<string, SettingValueType>;
    place?: {
      address: string;
      wilaya: string;
      latitude?: number;
      longitude?: number;
    };
    couponId?: string;
    discountAmount?: number;
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
  interface Customer {
    username: string;
    createdAt: number;
    status: "pending" | "rejected" | "accepted";
    firstname: string;
    lastname: string;
    phone: string;
    email: string;
    storeId?: string;
    uid?: string;
    metaData?: Record<string, any>;
  }
  interface Client {
    id: string;
    firstname?: string;
    lastname?: string;
    phone: string;

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
  interface MetadataField {
    key: string;
    type: "number" | "string" | "boolean" | "array" | "colors";
    value: number | string | boolean | string[];
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
      client?: number;
      customer?: number;
    };
    metaData?: MetadataField[];
    multiple?: {
      prices?: {
        quantity: number;
        price: number;
      }[];
    };
    brandId?: string;
  }
  interface Coupon {
    id?: string;
    code: string;
    name: string;
    description?: string;
    type: "percentage" | "fixed" | "freeShipping";
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usedCount: number;
    userUsageLimit?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    storeId?: string;
    applicableProducts?: string[] | null;
    applicableCategories?: string[];
    createdAt?: number;
    updatedAt?: number;
    createdBy?: string;
    uid?: string;
  }
  interface Var {
    id: string;
    name: string;
    value: string;
    createdAt: number;
    storeId?: string;
    uid?: string;
  }

  interface StoreUserAccess {
    id: string;
    storeId: string;
    ownerUserId: string;
    userEmail?: string;
    username?: string;
    userId?: string | null;
    permissions: "read" | "edit";
    status: "pending" | "accepted" | "rejected";
    createdAt: number;
    updatedAt: number;
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

declare interface ProductsResult extends SnapBuy.Product {
  price: number;
  count: number;
}

declare interface PackResult extends SnapBuy.Pack {
  price: number;
  count: number;
}
