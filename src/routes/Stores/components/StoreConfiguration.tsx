import { TabsView } from "../../../components/TabsView";
import { Stores } from "../Stores";
import { Forms } from "../../../Forms/Forms";
import { NotificationSettings } from "../../../components/NotificationSettings";
import { StoreDeliveryPricingList, Vars } from "../../../components";
import { allIcons } from "@biqpod/app/ui/apis";

export const StoreConfiguration = () => {
  const tabs = [
    {
      id: "stores" as const,
      label: "Store Settings",
      icon: allIcons.solid.faStore,
      content: <Stores />,
    },
    {
      id: "delivery-pricing" as const,
      label: "Delivery Pricing",
      icon: allIcons.solid.faTruck,
      content: <StoreDeliveryPricingList />,
    },
    {
      id: "forms" as const,
      label: "Forms",
      icon: allIcons.solid.faClipboard,
      content: <Forms />,
    },
    {
      id: "vars" as const,
      label: "Variables",
      icon: allIcons.solid.faCodeBranch,
      content: <Vars />,
    },
    {
      id: "settings" as const,
      label: "Notifications",
      icon: allIcons.solid.faBell,
      content: <NotificationSettings />,
    },
  ];

  return (
    <TabsView
      positionId="store-configuration"
      tabs={tabs}
      defaultTab="stores"
      position="bottom"
    />
  );
};
