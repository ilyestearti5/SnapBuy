import { TabsView } from "../../../components/TabsView";
import { Products } from "../../../Links/Products";
import { Brands } from "../../../Links/Brands";
import { Coupons } from "../../../Links/Coupons";
import { Collections } from "../../../Links/Collections";
import { Packs } from "../../../Links/Packs";
import { allIcons } from "@biqpod/app/ui/apis";

export const ProductsAndBrands = () => {
  const tabs = [
    {
      id: "products" as const,
      label: "Products",
      icon: allIcons.solid.faBox,
      content: <Products />,
    },
    {
      id: "brands" as const,
      label: "Brands",
      icon: allIcons.solid.faTags,
      content: <Brands />,
    },
    {
      id: "coupons" as const,
      label: "Coupons",
      icon: allIcons.solid.faTicket,
      content: <Coupons />,
    },
    {
      id: "collections" as const,
      label: "Collections",
      icon: allIcons.solid.faCodeFork,
      content: <Collections />,
    },
    {
      id: "packs" as const,
      label: "Packs",
      icon: allIcons.solid.faBoxesPacking,
      content: <Packs />,
    },
  ];

  return <TabsView tabs={tabs} defaultTab="products" position="bottom" />;
};
