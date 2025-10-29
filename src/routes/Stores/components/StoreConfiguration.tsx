import { TabsView } from "../../../components/TabsView";
import { Stores } from "../Stores";
import { NotificationSettings } from "../../../components/NotificationSettings";
import { Vars } from "../../../components";
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
