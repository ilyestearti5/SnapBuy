import { allIcons } from "@biqpod/app/ui/apis";
import {
  openMenu,
  showBottomSheet,
  showPopup,
  showToast,
} from "@biqpod/app/ui/hooks";
import { ChangeStatus } from "../ChangeStatus";
import { OrderView } from "../Clients/OrderView";
import { OrderInvoice } from "./OrderInvoice";
import { mergeArray } from "@biqpod/app/ui/utils";
import { ViewClient } from "./ViewClient";
interface OpenOrderMenuOptions {
  x: number;
  y: number;
  order: SnapBuy.Order;
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
        label: "Change Status",
        async click() {
          showPopup(<ChangeStatus order={order} />);
        },
        defaultIcon: allIcons.solid.faCheck,
      },
      order.key && {
        label: "Show Key",
        click() {
          showToast(`${order.key}`, "info", {
            time: 10,
          });
        },
        defaultIcon: allIcons.solid.faKey,
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
          await navigator.clipboard.writeText(order.id);
          showToast("Order ID Copied");
        },
        defaultIcon: allIcons.regular.faCopy,
      }
    ),
  });
};
