import { allIcons, and, where } from "biqpod/ui/apis";
import {
  CardWait,
  CircleTip,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "biqpod/ui/components";
import {
  getFieldValue,
  openMenu,
  showPopup,
  useCopyState,
} from "biqpod/ui/hooks";
import { include, tw } from "biqpod/ui/utils";
import { useEffect, useMemo } from "react";
import { onCollectionSnapshot } from "../server";
import { useCurrentClient } from "../apis";
import { colors, icons } from "../Links/Orders";
import { OrderView } from "./OrderView";

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
  const currentClient = useCurrentClient();
  const quickLoading = useCopyState(false);
  useEffect(() => {
    if (import.meta.env.DEV) {
      quickLoading.set(false);
      orders.set([]);
      return onCollectionSnapshot<SnapBuy.Order>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "orders"],
        (snapshot) => {
          quickLoading.set(true);

          const ordersData = snapshot.map((doc) => ({
            ...doc.data,
            id: doc.id,
          }));
          orders.set(ordersData);
        }
      );
    }
    if (currentClient?.client.id) {
      quickLoading.set(false);
      orders.set([]);
      return onCollectionSnapshot<SnapBuy.Order>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "orders"],
        (snapshot) => {
          quickLoading.set(true);
          const ordersData = snapshot.map((doc) => ({
            ...doc.data,
            id: doc.id,
          }));
          orders.set(ordersData);
        },
        {
          where: and(where("clientId", "==", currentClient?.client.id)),
        }
      );
    }
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
      </div>
      <Line />
      <div className="flex justify-between items-center gap-2 p-2">
        <span className="inline-flex items-center gap-2 w-full capitalize">
          <Icon icon={allIcons.solid.faTag} />
          <Translate content="status" />
        </span>
        <span className="inline-flex items-center gap-2 w-full capitalize">
          <Icon icon={allIcons.solid.faCalendarAlt} />
          <Translate content="created at" />
        </span>
        <span className="inline-flex items-center gap-2 w-full capitalize">
          <Icon icon={allIcons.solid.faBox} />
          <Translate content="products" />
        </span>
        <div className="invisible">
          <CircleTip icon={allIcons.solid.faEllipsisV} />
        </div>
      </div>
      <Line />
      <Scroll>
        {!quickLoading.get && <CardWait className="h-[100vh]" />}
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
            const { products = {} } = order;
            const productCount = Object.keys(products).length;
            return (
              <div
                key={order.id}
                className="flex justify-between items-center gap-2 odd:bg-[--biqpod-primary-background] p-2 h-[50px]"
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
                <span className="w-full">
                  <span className="px-2 py-1 rounded-full font-bold bg-[--biqpod-text-color] text-[--biqpod-primary-background]">
                    {productCount}
                  </span>
                </span>
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
