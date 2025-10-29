import { TabsView } from "../../../components/TabsView";
import { Orders } from "../../../Links/Orders";
import { Customers } from "../Customers";
import { Invoices } from "../../../Links/Invoices";
import { Coupons } from "../../../Links/Coupons";
import { StoreDeliveryPricingList } from "../../../components";
import { allIcons } from "@biqpod/app/ui/apis";
import { useTemp } from "@biqpod/app/ui/hooks";
import { useMemo } from "react";
import { Biqpod } from "@biqpod/app/ui/types";

export const OrdersAndCustomers = () => {
  const orders = useTemp<Biqpod.Snapbuy.Order[]>("orders-list");

  // Count pending orders (pending and processing status)
  const pendingOrdersCount = useMemo(() => {
    if (!orders.get) return 0;
    return orders.get.filter(
      (order: Biqpod.Snapbuy.Order) =>
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
      id: "delivery-pricing" as const,
      label: "Delivery Pricing",
      icon: allIcons.solid.faTruck,
      content: <StoreDeliveryPricingList />,
    },
    {
      id: "coupons" as const,
      label: "Coupons",
      icon: allIcons.solid.faTicket,
      content: <Coupons />,
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
