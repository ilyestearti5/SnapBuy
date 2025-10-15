import { TabsView } from "../../../components/TabsView";
import { Orders } from "../../../Links/Orders";
import { Customers } from "../Customers";
import { Invoices } from "../../../Links/Invoices";
import { allIcons } from "@biqpod/app/ui/apis";
import { useTemp } from "@biqpod/app/ui/hooks";
import { useMemo } from "react";

export const OrdersAndCustomers = () => {
  const orders = useTemp<Souqify.Order[]>("orders-list");

  // Count pending orders (pending and processing status)
  const pendingOrdersCount = useMemo(() => {
    if (!orders.get) return 0;
    return orders.get.filter(
      (order: Souqify.Order) =>
        order.status === "pending" || order.status === "processing"
    ).length;
  }, [orders.get]);

  const tabs = [
    {
      id: "orders" as const,
      label: "Orders",
      icon: allIcons.solid.faShoppingCart,
      content: <Orders />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    {
      id: "customers" as const,
      label: "Customers",
      icon: allIcons.solid.faUsers,
      content: <Customers />,
    },
    {
      id: "invoices" as const,
      label: "Invoices",
      icon: allIcons.solid.faFileInvoice,
      content: <Invoices />,
    },
  ];

  return (
    <TabsView
      positionId="orders-and-customer"
      position="bottom"
      tabs={tabs}
      defaultTab="orders"
    />
  );
};
