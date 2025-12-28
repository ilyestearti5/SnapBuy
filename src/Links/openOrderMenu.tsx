import { allIcons } from "@biqpod/app/ui/apis";
import {
  openMenu,
  showBottomSheet,
  showPopup,
  showToast,
  confirm,
  execAction,
} from "@biqpod/app/ui/hooks";
import { ChangeStatus } from "../routes/Stores/ChangeStatus";
import { OrderInvoice } from "./OrderInvoice";
import { mergeArray } from "@biqpod/app/ui/utils";
import { ViewClient } from "./ViewClient";
import { UpsertDelivery } from "./UpsertDelivery";
import { OrderView } from "../routes/Clients/OrderView";
import { snapbuyApi } from "../apis";
import { OrderEditPopup } from "../components/OrderEditPopup";
import { Biqpod } from "@biqpod/app/ui/types";
import { setTextSide } from "../hooks/usePayments";
export interface OpenOrderMenuOptions {
  x: number;
  y: number;
  order: Biqpod.Snapbuy.Order;
}
export const openOrderMenu = ({ order, x, y }: OpenOrderMenuOptions) => {
  openMenu({
    x,
    y,
    menu: mergeArray(
      {
        label: "View Client",
        defaultIcon: allIcons.solid.faUser,
        click() {
          showBottomSheet(<ViewClient order={order} />);
        },
      },
      {
        label: "View Order",
        defaultIcon: allIcons.solid.faFileInvoice,
        click: () => {
          showPopup(<OrderView order={order} />);
        },
      },
      {
        label: "Edit Order",
        defaultIcon: allIcons.solid.faEdit,
        click: () => {
          showPopup(
            <OrderEditPopup
              order={order}
              onSave={() => execAction("fetch-orders", {})}
            />
          );
        },
      },
      {
        label: "Change Status",
        async click() {
          showPopup(<ChangeStatus orders={[order]} />);
        },
        defaultIcon: allIcons.solid.faCheck,
      },
      {
        label: "Set Delivery",
        defaultIcon: allIcons.solid.faTruck,
        click: () => {
          showPopup(<UpsertDelivery order={order} />);
        },
      },
      {
        type: "separator",
      },
      {
        defaultIcon: allIcons.solid.faPrint,
        label: "Print",
        click: () => {
          showPopup(<OrderInvoice order={order} />);
        },
      },
      {
        label: "Copy ID",
        async click() {
          await navigator.clipboard.writeText(order.id!);
          showToast("Order ID Copied");
        },
        defaultIcon: allIcons.regular.faCopy,
      },
      {
        type: "separator",
      },
      {
        label: "Delete Order",
        async click() {
          const response = await confirm({
            title: "Delete Order",
            message:
              "Are you sure you want to delete this order? This action cannot be undone.",
            type: "warning",
          });
          if (response) {
            try {
              setTextSide("Deleting order...");
              await snapbuyApi.order.delete(order.id!);
              showToast("Order deleted successfully", "success");
              setTextSide("Refreshing orders...");
              // Refresh the orders list
              await execAction("fetch-orders", {});
              setTextSide();
            } catch (error) {
              showToast("Failed to delete order", "error");
            }
          }
        },
        defaultIcon: allIcons.solid.faTrash,
      }
    ),
  });
};
