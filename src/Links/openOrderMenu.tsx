import { allIcons } from "@biqpod/app/ui/apis";
import {
  closeBottomSheet,
  openMenu,
  showBottomSheet,
  showPopup,
  showToast,
} from "@biqpod/app/ui/hooks";
import { ChangeStatus } from "../ChangeStatus";
import { OrderView } from "../Clients/OrderView";
import { OrderInvoice } from "./OrderInvoice";
import { delay, mergeArray } from "@biqpod/app/ui/utils";
import { ViewClient } from "./ViewClient";
import { UpsertDelivery } from "./UpsertDelivery";
import {
  AsyncComponent,
  Button,
  CardWait,
  EmptyComponent,
  JoinComponentBy,
  Key,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import { snapbuyApi } from "../apis";
export interface OpenOrderMenuOptions {
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
        label: "View Form",
        defaultIcon: allIcons.solid.faFile,
        click() {
          const infos = Object.entries(order.metaData || {});
          showBottomSheet(
            <EmptyComponent>
              <div className="px-3 py-2 font-bold text-lg">
                <Translate content="Order Form Details" />
              </div>
              <Line />
              <div>
                {infos.map(([key, value]) => {
                  return (
                    <AsyncComponent
                      key={key}
                      deps={[key, value]}
                      render={async () => {
                        await delay(1000);
                        const form = await snapbuyApi.forms.getProperty(key);
                        return (
                          <div className="flex items-center odd:bg-[--biqpod-primary-background] px-3 border-[--biqpod-borders] border-b border-solid h-[50px]">
                            <div className="px-3 w-full">{form?.name}</div>
                            <div className="h-full">
                              <div className="bg-[--biqpod-borders] w-[1px] h-full"></div>
                            </div>
                            <div className="px-3 w-full font-bold">
                              {typeof value === "boolean" ? (
                                value ? (
                                  "✅ Yes"
                                ) : (
                                  "🚫 No"
                                )
                              ) : typeof value === "number" ? (
                                <Key>{value}</Key>
                              ) : Array.isArray(value) ? (
                                <JoinComponentBy
                                  joinComponent={
                                    <EmptyComponent>, </EmptyComponent>
                                  }
                                  list={value.map((content, index) => (
                                    <Key key={index}>{content}</Key>
                                  ))}
                                />
                              ) : (
                                value
                              )}
                            </div>
                          </div>
                        );
                      }}
                      loading={
                        <div className="flex items-center px-3 w-full h-[50px]">
                          <CardWait className="rounded-xl w-full h-2/3" />
                        </div>
                      }
                    />
                  );
                })}
              </div>
              <Line />
              <div className="p-2">
                <Button
                  onClick={() => {
                    closeBottomSheet();
                  }}
                >
                  <Translate content="close" />
                </Button>
              </div>
            </EmptyComponent>
          );
        },
      },
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
          await navigator.clipboard.writeText(order.id);
          showToast("Order ID Copied");
        },
        defaultIcon: allIcons.regular.faCopy,
      }
    ),
  });
};
