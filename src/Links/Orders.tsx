import {
  allIcons,
  and,
  CloudSelection,
  orderBy,
  where,
} from "@biqpod/app/ui/apis";
import {
  Anchor,
  Button,
  Card,
  CardWait,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  confirm,
  execAction,
  getFieldValue,
  showPopup,
  showToast,
  useAction,
  useAsyncEffect,
  useCopyState,
  useDeviceResolution,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { include, mergeArray, range, tw } from "@biqpod/app/ui/utils";
import { useEffect, useMemo } from "react";
import { cloud, onCollectionSnapshot } from "../server";
import { OrderView } from "../Clients/OrderView";
import { useActionStatus } from "../CartPopup";
import { useLocation } from "react-router-dom";
import { snapbuyApi } from "../apis";
import {
  FilterOrders,
  FilterOrdersProps,
  setFilterState,
  useFilterState,
} from "./FilterOrders";
import { openOrderMenu } from "./openOrderMenu";
import { useStoreId } from "../App";
import { colors, getImageByPlatform, icons } from "../utils";
const PAGE_SIZE = 40;
interface StatusUiProps {
  status: SnapBuy.OrderStatus;
}
export const StatusUi = ({ status }: StatusUiProps) => {
  return (
    <span
      className="inline-flex items-center gap-2 p-2 rounded-2xl"
      style={{
        color: colors[status],
        backgroundColor: `${colors[status]}20`,
      }}
    >
      <Icon icon={icons[status]} />
      <span>
        <Translate content={status} />
      </span>
    </span>
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
  const orders = useTemp<SnapBuy.Order[]>("orders-list"); // Replace with your actual orders data
  const user = useUser();
  const lastDoc = useCopyState<SnapBuy.Order | null>(null);
  const hasMore = useCopyState(true);
  const loc = useLocation();
  useAsyncEffect(async () => {
    const searcher = new URLSearchParams(loc.search);
    const orderId = searcher.get("order");
    if (orderId) {
      const order = await snapbuyApi.getOrder(orderId);
      if (order) {
        showPopup(<OrderView order={order} />);
      } else {
        showToast("Order not found", "error");
      }
      return;
    }
    const status = searcher.get("status");
    const clientPhone = searcher.get("phone");
    const time = searcher.get("time");
    var options: FilterOrdersProps = {};
    if (status) {
      if (status === "all") {
        options.status = undefined;
      } else {
        options.status = status;
      }
    }
    if (time) {
      if (time === "all") {
        options.time = undefined;
      } else {
        options.time = time;
      }
    }
    if (clientPhone) {
      if (clientPhone === "none") {
        options.phone = undefined;
      } else {
        options.phone = clientPhone;
      }
    }
    setFilterState(options);
    execAction("fetch-orders", {});
  }, [loc.search]);
  const filterState = useFilterState();
  const selectedStoreId = useStoreId();
  const action = useAction(
    "fetch-orders",
    async ({ next = false }) => {
      if (!selectedStoreId) {
        return;
      }
      if (!user?.uid) {
        return;
      }
      const currentTime = new Date();
      currentTime.setHours(23, 59, 59, 999);
      var subTime: Date | null = null;
      switch (filterState?.time) {
        case "today":
          subTime = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "this week":
          subTime = new Date(currentTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "this month":
          subTime = new Date(currentTime.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "this year":
          subTime = new Date(currentTime.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case "last week":
          subTime = new Date(currentTime.getTime() - 14 * 24 * 60 * 60 * 1000);
          break;
        case "last month":
          subTime = new Date(currentTime.getTime() - 60 * 24 * 60 * 1000);
          break;
        case "last year":
          subTime = new Date(currentTime.getTime() - 730 * 24 * 60 * 60 * 1000);
          break;
      }
      const selection: CloudSelection<SnapBuy.Order> = {
        where: and(
          where("uid", "==", user?.uid),
          filterState?.phone && where("client.phone", "==", filterState.phone),
          subTime && where("createdAt", ">=", subTime.getTime()),
          filterState?.status && where("status", "==", filterState.status),
          where("storeId", "==", selectedStoreId)
        ),
        orders: mergeArray(
          orderBy("createdAt", filterState?.orderBy === "desc" ? "desc" : "asc")
        ),
        limit: PAGE_SIZE,
        startAt:
          next && lastDoc.get?.createdAt ? [lastDoc.get?.createdAt] : undefined,
      };
      const newOrders = await cloud.app.nosql.getDocs<SnapBuy.Order>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "orders"],
        selection
      );
      if (!newOrders) {
        return;
      }
      const list = newOrders.map((order) => ({ ...order.data, id: order.id }));
      orders.set((prev) => (next && prev ? [...prev, ...list] : list));
      const lastDocRef = newOrders.at(-1)?.data;
      lastDoc.set(lastDocRef || null);
      hasMore.set(newOrders.length === PAGE_SIZE);
    },
    [user?.uid, lastDoc.get, filterState, selectedStoreId]
  );
  useEffect(() => {
    if (user) {
      execAction("fetch-orders", {});
    }
  }, [user]);
  const { isLoading } = useActionStatus(action);
  const { isMobile, isTablet } = useDeviceResolution();
  const isSmallView = isMobile || isTablet;
  const ordersState = useMemo(() => {
    const currentTime = new Date();
    return (
      orders.get &&
      orders.get
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
          return {
            order,
            timeAgo,
            productCount,
          };
        })
    );
  }, [searchOrder, orders.get]);
  const hasNews = useCopyState<SnapBuy.Order[]>([]);
  useEffect(() => {
    if (user?.uid) {
      return onCollectionSnapshot<SnapBuy.Order>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "orders"],
        (news) => {
          hasNews.set(news.map((order) => ({ ...order.data, id: order.id })));
        },
        {
          limit: 5,
          where: and(
            where("uid", "==", user.uid),
            where("createdAt", ">=", Date.now())
          ),
        }
      );
    }
  }, [user?.uid]);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-2">
        <div className="relative w-full">
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
          {ordersState && (
            <span className="top-1/2 right-3 absolute text-[--biqpod-primary] -translate-y-1/2 transform">
              / {ordersState?.length || "NO Orders"}
            </span>
          )}
        </div>
        <div>
          <CircleTip
            icon={allIcons.solid.faFilter}
            onClick={() => {
              showPopup(<FilterOrders />);
            }}
          />
        </div>
      </div>
      <Line />
      {!isSmallView && (
        <EmptyComponent>
          <div className="flex justify-between items-center gap-2 p-2">
            <span className="inline-flex items-center gap-2 w-full capitalize">
              <Icon icon={allIcons.solid.faUser} />
              <Translate content="client" />
            </span>
            <span className="inline-flex items-center gap-2 w-full capitalize">
              <Icon icon={allIcons.solid.faCalendarAlt} />
              <Translate content="created at" />
            </span>
            <span className="inline-flex items-center gap-2 w-full capitalize">
              <Icon icon={allIcons.solid.faBox} />
              <Translate content="products" />
            </span>
            <span className="inline-flex items-center gap-2 w-full capitalize">
              <Icon icon={allIcons.solid.faTag} />
              <Translate content="status" />
            </span>
            <span className="inline-flex items-center gap-2 w-full capitalize">
              <Icon icon={allIcons.solid.faDashboard} />
              <Translate content="ads" />
            </span>
            <span className="inline-flex items-center gap-2 w-full capitalize">
              <Icon icon={allIcons.solid.faEllipsisV} />
              <Translate content="key" />
            </span>
            <div className="invisible">
              <CircleTip icon={allIcons.solid.faEllipsisV} />
            </div>
          </div>
          <Line />
          <Scroll className="relative">
            {hasNews.get.length > 0 && (
              <div className="top-0 z-[10] absolute inset-x-0 flex justify-center items-center gap-2 p-3">
                <Button
                  icon={allIcons.solid.faArrowUp}
                  className="rounded-full w-fit"
                  onClick={() => {
                    orders.set((prev) =>
                      prev ? [...hasNews.get, ...prev] : hasNews.get
                    );
                    hasNews.set([]);
                  }}
                >
                  {hasNews.get.length} <Translate content="news" />
                </Button>
              </div>
            )}
            {ordersState?.map(({ order, timeAgo, productCount }) => {
              return (
                <div
                  key={order.id}
                  className="flex justify-between items-center gap-2 odd:bg-[--biqpod-secondary-background] p-2"
                >
                  <div className="w-full">
                    {order.client?.firstname} {order.client?.lastname} (
                    <Anchor href={order.client?.phone}>
                      {order.client?.phone}
                    </Anchor>
                    )
                  </div>
                  <span className="w-full">{timeAgo}</span>
                  <span className="w-full">
                    <span className="px-2 py-1 rounded-full font-bold bg-[--biqpod-text-color] text-[--biqpod-primary-background]">
                      {productCount}
                    </span>
                  </span>
                  <div className="w-full">
                    <StatusUi status={order.status} />
                  </div>
                  <span className="flex items-center gap-1 py-2 w-full overflow-hidden">
                    <span className="inline-block w-[35px] h-[35px]">
                      <img
                        className="w-full h-full object-cover"
                        src={getImageByPlatform(order.platform)}
                      />
                    </span>
                    <span className="capitalize">{order.platform}</span>
                  </span>
                  <span className="py-2 w-full overflow-hidden">
                    {order.key && (
                      <span className="bg-[--biqpod-gray-opacity] border-[--biqpod-gray-opacity-2] px-2 py-1 border border-solid rounded-full truncate">
                        <Anchor>{order.key}</Anchor>
                      </span>
                    )}
                  </span>
                  <div>
                    <CircleTip
                      icon={allIcons.solid.faEllipsisV}
                      onClick={({ clientY, clientX }) => {
                        openOrderMenu({ x: clientX, y: clientY, order });
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {hasMore.get && (
              <div className="flex justify-center items-center gap-2 p-2">
                <span>
                  <Button
                    onClick={() => {
                      execAction("fetch-orders", {
                        next: true,
                      });
                    }}
                    icon={
                      isLoading
                        ? allIcons.solid.faCircleNotch
                        : allIcons.solid.faPaperPlane
                    }
                    className="rounded-full"
                    iconClassName={tw(isLoading && "animate-spin")}
                  >
                    <span
                      className={tw("transition-[font-family] duration-200")}
                      style={{
                        font: isLoading ? "0px" : "8px",
                      }}
                    >
                      <Translate content="fetch more" />
                    </span>
                  </Button>
                </span>
              </div>
            )}
          </Scroll>
        </EmptyComponent>
      )}
      {isSmallView && (
        <Scroll className="relative">
          {hasNews.get.length > 0 && (
            <div className="top-0 z-[10] absolute inset-x-0 flex justify-center items-center gap-2 p-3">
              <Button
                icon={allIcons.solid.faArrowUp}
                className="rounded-full w-fit"
                onClick={() => {
                  orders.set((prev) =>
                    prev ? [...hasNews.get, ...prev] : hasNews.get
                  );
                  hasNews.set([]);
                }}
              >
                {hasNews.get.length} <Translate content="news" />
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-2 p-2">
            {ordersState?.map(({ order, timeAgo, productCount }, index) => {
              const fullName = `${order.client?.firstname || ""} ${
                order.client?.lastname || ""
              }`;
              const googleMap = `https://www.google.com/maps/search/?api=1&query=${order.client?.place.address}`;
              return (
                <Card
                  key={index}
                  className="bg-gradient-to-r to-[--biqpod-primary-background] backdrop-blur-sm from-[--biqpod-borders] w-full overflow-hidden"
                >
                  <div className="flex items-center gap-2 p-2">
                    <span className="inline-block w-[40px] h-[40px]">
                      <img
                        className="w-full h-full object-cover"
                        src={getImageByPlatform(order.platform)}
                      />
                    </span>
                    <span className="text-xl">{fullName}</span>
                  </div>
                  <Line />
                  <div className="flex justify-between items-center p-2 overflow-hidden">
                    <div />
                    <span className="bg-[--biqpod-gray-opacity] border-[--biqpod-gray-opacity-2] px-2 py-1 border border-solid rounded-full text-xs truncate">
                      <Anchor
                        onClick={async () => {
                          const response = await confirm({
                            message: "Filter All Orders By This Key",
                            title: "Filter By Keys",
                          });
                          if (response) {
                          }
                        }}
                      >
                        {order.key || <Translate content="No Key Ther Is" />}
                      </Anchor>
                    </span>
                  </div>
                  <Line />
                  <div className="flex justify-between items-center p-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full font-bold bg-[--biqpod-text-color] text-[--biqpod-primary-background]">
                        {productCount}
                      </span>
                      <StatusUi status={order.status} />
                    </div>
                    <span className="text-sm">{timeAgo}</span>
                  </div>
                  <Line />
                  <div className="flex justify-between items-center p-2">
                    <span className="italic">{order.client.place.wilaya}</span>
                    <div className="flex items-center">
                      <CircleTip
                        icon={allIcons.solid.faPhone}
                        onClick={() => {
                          var a = document.createElement("a");
                          a.href = `tel:${order.client?.phone}`;
                          a.click();
                        }}
                      />
                      <CircleTip
                        icon={allIcons.solid.faLocationDot}
                        onClick={() => {
                          var a = document.createElement("a");
                          a.href = googleMap;
                          a.target = "_blank";
                          a.click();
                        }}
                      />
                      <CircleTip
                        icon={allIcons.solid.faEllipsisV}
                        onClick={async ({ clientX, clientY }) => {
                          openOrderMenu({ x: clientX, y: clientY, order });
                        }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
            {isLoading &&
              range(PAGE_SIZE).map((index) => {
                return (
                  <CardWait
                    key={index}
                    className="rounded-2xl w-full h-[180px]"
                  />
                );
              })}
            {hasMore.get && (
              <Card className="justify-center items-center w-full h-[180px]">
                <CircleTip
                  icon={
                    isLoading
                      ? allIcons.solid.faCircleNotch
                      : allIcons.solid.faChevronRight
                  }
                  iconClassName={tw(isLoading && "animate-spin")}
                  onClick={() => {
                    execAction("fetch-orders", { next: true });
                  }}
                />
              </Card>
            )}
          </div>
        </Scroll>
      )}
    </div>
  );
};
