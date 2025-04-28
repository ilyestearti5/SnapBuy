import { allIcons, and, where } from "biqpod/ui/apis";
import {
  Anchor,
  Card,
  CardWait,
  CircleTip,
  ExcelPopup,
  Field,
  Icon,
  IconProps,
  Line,
  Scroll,
  Translate,
} from "biqpod/ui/components";
import {
  closePopup,
  getFieldValue,
  openMenu,
  openPath,
  showPopup,
  showToast,
  useAsyncMemo,
  useCopyState,
  useUser,
} from "biqpod/ui/hooks";
import { include, range, tw } from "biqpod/ui/utils";
import { useEffect, useMemo } from "react";
import { onCollectionSnapshot } from "../server";
import { api, useCurrentClient } from "../apis";
import { colors, icons } from "../Links/Orders";

export interface OrderView {
  order: SnapBuy.Order;
}
export const OrderView = ({ order }: OrderView) => {
  const time = new Date(order.createdAt!);
  const productsLengths = Object.keys(order.products || {}).length;

  const currentClient = useCurrentClient();

  const list = useAsyncMemo(async () => {
    return api.getOrderProducts(order.id);
  }, [currentClient]);

  return (
    <Card className="max-md:rounded-none max-md:w-full max-md:h-full">
      <div className="flex justify-between items-center p-2">
        <h1 className="md:text-xl text-2xl">{time.toLocaleString()}</h1>
        <div>
          <CircleTip
            onClick={() => {
              closePopup();
            }}
            icon={allIcons.solid.faXmark}
          />
        </div>
      </div>
      <Line />
      <Scroll>
        {list?.map((product) => {
          return (
            <div
              key={product.id}
              className="flex justify-between items-center gap-2 odd:bg-[--biqpod-primary-background] p-2"
            >
              <div className="w-full">
                <span className="inline-flex items-center gap-2 p-2 rounded-2xl">
                  <span>{product.name}</span>
                </span>
              </div>
              <span className="w-full">{product.price}</span>
              <div>
                <CircleTip
                  icon={allIcons.solid.faEllipsisV}
                  onClick={({ clientX, clientY }) => {
                    openMenu({
                      x: clientX,
                      y: clientY,
                      menu: [
                        {
                          label: "View Order",
                          defaultIcon: allIcons.solid.faEye,
                          click: () => {
                            showPopup(<OrderView order={order} />);
                          },
                        },
                      ],
                    });
                  }}
                />
              </div>
            </div>
          );
        })}
        {!list &&
          range(productsLengths).map((index) => {
            return (
              <div className="mt-2 px-2" key={index}>
                <CardWait className="rounded-2xl w-full h-[50px]" />
              </div>
            );
          })}
      </Scroll>
    </Card>
  );
};

export const Orders = () => {
  const searchOrder = getFieldValue("search-order");
  const isFocused = useCopyState(false);
  useEffect(() => {
    return () => {
      isFocused.set(false);
    };
  }, []);
  const currentTime = useMemo(() => {
    return new Date();
  }, []);
  const orders = useCopyState<SnapBuy.Order[]>([]); // Replace with your actual orders data
  const user = useUser();

  const currentClient = useCurrentClient();
  useEffect(() => {
    // if (currentClient?.client.id) {
    return onCollectionSnapshot<SnapBuy.Order>(
      ["projects", import.meta.env.VITE_PROJECT_ID, "orders"],
      (snapshot) => {
        const ordersData = snapshot.map((doc) => ({
          ...doc.data,
          id: doc.id,
        }));
        orders.set(ordersData);
      },
      {
        // where: and(where("clientId", "==", currentClient?.client.id)),
      }
    );
    // }
  }, [currentClient]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <div
          className={tw(
            "min-w-[30%] transition-[min-width]",
            isFocused.get && "max-md:min-w-[60%]"
          )}
        >
          <Field
            propositions={["@status"]}
            onFocus={() => {
              isFocused.set(true);
            }}
            onBlur={() => {
              isFocused.set(false);
            }}
            inputName="search-order"
            placeholder="Search Order"
            className="rounded-xl"
          />
        </div>
        <div>
          <CircleTip icon={allIcons.solid.faFilter} />
        </div>
      </div>
      <Line />
      <div className="flex justify-between items-center gap-2 p-2">
        <div className="w-full">
          <span className="inline-flex items-center gap-2 p-2 rounded-2xl">
            <Icon icon={allIcons.solid.faTag} />
            <span>Status</span>
          </span>
        </div>
        <span className="w-full">Created At</span>
        <div className="invisible">
          <CircleTip icon={allIcons.solid.faEllipsisV} />
        </div>
      </div>
      <Line />
      <Scroll>
        {orders.get
          .filter((order) => {
            return include(`${order.id} @status ${order.status}`, searchOrder);
          })
          .map((order) => {
            const time = new Date(order.createdAt!);
            const timeDifference = Math.floor(
              (currentTime.getTime() - time.getTime()) / 1000
            );
            let timeAgo = "";
            if (timeDifference < 60) {
              timeAgo = `${timeDifference} sec${
                timeDifference > 1 ? "s" : ""
              } ago`;
            } else if (timeDifference < 3600) {
              const minutes = Math.floor(timeDifference / 60);
              timeAgo = `${minutes} min${minutes > 1 ? "s" : ""} ago`;
            } else if (timeDifference < 86400) {
              const hours = Math.floor(timeDifference / 3600);
              timeAgo = `${hours} hour${hours > 1 ? "s" : ""} ago`;
            } else if (timeDifference < 604800) {
              const days = Math.floor(timeDifference / 86400);
              timeAgo = `${days} day${days > 1 ? "s" : ""} ago`;
            } else if (timeDifference < 2419200) {
              const weeks = Math.floor(timeDifference / 604800);
              timeAgo = `${weeks} week${weeks > 1 ? "s" : ""} ago`;
            } else if (timeDifference < 29030400) {
              const months = Math.floor(timeDifference / 2419200);
              timeAgo = `${months} month${months > 1 ? "s" : ""} ago`;
            } else {
              const years = Math.floor(timeDifference / 29030400);
              timeAgo = `${years} year${years > 1 ? "s" : ""} ago`;
            }
            return (
              <div
                key={order.id}
                className="flex justify-between items-center gap-2 odd:bg-[--biqpod-primary-background] p-2"
              >
                <div className="w-full">
                  <span
                    className="inline-flex items-center gap-2 p-2 rounded-2xl"
                    style={{
                      color: colors[order.status],
                      backgroundColor: `${colors[order.status]}20`,
                    }}
                  >
                    <Icon icon={icons[order.status]} />
                    <span>{order.status}</span>
                  </span>
                </div>
                <span className="w-full">{timeAgo}</span>
                <div>
                  <CircleTip
                    icon={allIcons.solid.faEllipsisV}
                    onClick={({ clientX, clientY }) => {
                      openMenu({
                        x: clientX,
                        y: clientY,
                        menu: [
                          {
                            label: "View Order",
                            defaultIcon: allIcons.solid.faEye,
                            click: () => {
                              showPopup(<OrderView order={order} />);
                            },
                          },
                        ],
                      });
                    }}
                  />
                </div>
              </div>
            );
          })}
      </Scroll>
    </div>
  );
};
