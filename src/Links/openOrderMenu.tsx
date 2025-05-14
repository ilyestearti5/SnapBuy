import { allIcons } from "@biqpod/app/ui/apis";
import {
  EmptyComponent,
  Translate,
  Line,
  JoinComponentBy,
  Icon,
  Button,
} from "@biqpod/app/ui/components";
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
          var address = order.client?.place.address
            .split(",")
            .map((item) => item.trim())
            .reverse();
          showBottomSheet(
            <EmptyComponent>
              <div className="p-4">
                <h1 className="text-2xl">
                  {order.client?.firstname} {order.client?.lastname}
                </h1>
                <div className="flex flex-col gap-2">
                  <span>
                    <Translate content="phone" />: {order.client?.phone}
                  </span>
                </div>
              </div>
              <Line />
              <div className="flex flex-wrap items-center gap-2 p-4">
                <JoinComponentBy
                  list={address.map((add) => {
                    return (
                      <span className="bg-[--biqpod-gray-opacity] px-4 py-1 rounded-full">
                        {add}
                      </span>
                    );
                  })}
                  joinComponent={<Icon icon={allIcons.solid.faEllipsisH} />}
                />
              </div>
              <Line />
              <div className="p-4">
                <Button
                  onClick={async () => {
                    var a = document.createElement("a");
                    var address = order.client?.place.address;
                    // open google map for specific address
                    a.href = `https://www.google.com/maps/search/?api=1&query=${address}`;
                    a.target = "_blank";
                    a.click();
                  }}
                  icon={allIcons.solid.faMapLocationDot}
                >
                  <Translate content="open in maps" />
                </Button>
              </div>
            </EmptyComponent>
          );
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
        label: "print",
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
