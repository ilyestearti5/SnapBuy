/// <reference types="vite/client" />
declare interface Tab {
  name: string;
  link: string;
  icon: IconProps["icon"];
}
declare interface AddClientActionProps {
  exists?: import("@biqpod/app/ui/types").Biqpod.Snapbuy.Client[];
  news?: import("@biqpod/app/ui/types").Biqpod.Snapbuy.Client[];
}
declare interface AddProductActionProps {
  exists?: import("@biqpod/app/ui/types").Biqpod.Snapbuy.Product[] | null;
  news?: import("@biqpod/app/ui/types").Biqpod.Snapbuy.Product[] | null;
}
declare module "html2pdf.js" {
  // You can add more specific type definitions here as you explore the library's API.
  const html2pdf: any;
  export default html2pdf;
}
declare type keys =
  | keyof import("@biqpod/app/ui/types").Biqpod.Snapbuy.Product
  | "single.price"
  | "multiple.prices"
  | "multiple.counts";

declare interface All {
  name: string;
  file: import("@biqpod/app/ui/types").Biqpod.Snapbuy.Basic.File;
}

declare interface Plan {
  id: string;
  price: number;
  usage: Record<DataTypes, number>;
}

declare type DataTypes =
  | "products"
  | "customers"
  | "orders"
  | "packs"
  | "collections"
  | "brands"
  | "coupons"
  | "vars";
