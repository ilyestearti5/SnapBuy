/// <reference types="vite/client" />
declare interface Tab {
  name: string;
  link: string;
  icon: IconProps["icon"];
}
declare interface AddClientActionProps {
  exists?: Biqpod.Snapbuy.Client[];
  news?: Biqpod.Snapbuy.Client[];
}
declare interface AddProductActionProps {
  exists?: Biqpod.Snapbuy.Product[] | null;
  news?: Biqpod.Snapbuy.Product[] | null;
}
declare module "html2pdf.js" {
  // You can add more specific type definitions here as you explore the library's API.
  const html2pdf: any;
  export default html2pdf;
}
declare type keys =
  | keyof Biqpod.Snapbuy.Product
  | "single.price"
  | "multiple.prices"
  | "multiple.counts";
