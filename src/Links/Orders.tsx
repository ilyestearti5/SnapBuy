import {
  allIcons,
  and,
  CloudSelection,
  getDoc,
  orderBy,
  where,
} from "@biqpod/app/ui/apis";
import {
  Anchor,
  AsyncComponent,
  Button,
  Card,
  CardHeaderForPopup,
  CardWait,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
  UserAvatar,
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
import { useLocation } from "react-router-dom";
import { snapbuyApi } from "../apis";
import {
  FilterOrders,
  FilterOrdersProps,
  setFilterState,
  useFilterState,
} from "./FilterOrders";
import { openOrderMenu } from "./openOrderMenu";
import { useStoreId } from "../utils";
import { colors, getImageByPlatform, icons } from "../utils";
import { motion } from "framer-motion";
import { Biqpod } from "@biqpod/app/ui/types";
import { UpsertDelivery } from "./UpsertDelivery";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { OrderView } from "../routes/Clients/OrderView";
import { useActionStatus } from "../routes/Clients/CartPopup";

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
      var subTime: Date | null = null;
      switch (filterState?.time) {
        case "today":
          currentTime.setHours(0, 0, 0, 0);
          subTime = new Date(currentTime.getTime());
          break;
        case "this week": {
          const dayOfWeek = currentTime.getDay();
          const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday
          currentTime.setDate(currentTime.getDate() - daysToSubtract);
          currentTime.setHours(0, 0, 0, 0);
          subTime = new Date(currentTime.getTime());
          break;
        }
        case "this month":
          currentTime.setDate(1);
          currentTime.setHours(0, 0, 0, 0);
          subTime = new Date(currentTime.getTime());
          break;
        case "this year":
          currentTime.setMonth(0, 1);
          currentTime.setHours(0, 0, 0, 0);
          subTime = new Date(currentTime.getTime());
          break;
        case "last week": {
          // Go to start of this week, then subtract 7 days
          const dayOfWeek = currentTime.getDay();
          const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const startOfThisWeek = new Date(currentTime.getTime());
          startOfThisWeek.setDate(currentTime.getDate() - daysToSubtract);
          startOfThisWeek.setHours(0, 0, 0, 0);
          const startOfLastWeek = new Date(startOfThisWeek.getTime());
          startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
          subTime = startOfLastWeek;
          break;
        }
        case "last month": {
          // Go to start of this month, then subtract 1 month
          const startOfThisMonth = new Date(
            currentTime.getFullYear(),
            currentTime.getMonth(),
            1,
            0,
            0,
            0,
            0
          );
          const startOfLastMonth = new Date(startOfThisMonth);
          startOfLastMonth.setMonth(startOfThisMonth.getMonth() - 1);
          subTime = startOfLastMonth;
          break;
        }
        case "last year": {
          // Go to start of this year, then subtract 1 year
          const startOfThisYear = new Date(
            currentTime.getFullYear(),
            0,
            1,
            0,
            0,
            0,
            0
          );
          const startOfLastYear = new Date(startOfThisYear);
          startOfLastYear.setFullYear(startOfThisYear.getFullYear() - 1);
          subTime = startOfLastYear;
          break;
        }
      }
      const selection: CloudSelection<SnapBuy.Order> = {
        where: and(
          where("uid", "==", user?.uid),
          filterState?.phone && where("client.phone", "==", filterState.phone),
          subTime && where("createdAt", ">=", subTime.getTime()),
          filterState?.status && where("status", "==", filterState.status),
          filterState?.delivery &&
            filterState.delivery !== "all" &&
            where("delivery", "==", filterState.delivery == "delivere"),
          where("storeId", "==", selectedStoreId)
        ),
        orders: mergeArray(
          orderBy("createdAt", filterState?.orderBy == "asc" ? "asc" : "desc")
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
            <span className="inline-flex items-center gap-2 w-full capitalize">
              <Icon icon={allIcons.solid.faTruck} />
              <Translate content="delivery / by" />
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
                  <span className="flex items-center gap-2 py-2 w-full">
                    <Icon
                      iconClassName={tw(
                        order.isDelivery
                          ? "text-[--biqpod-success]"
                          : "text-[--biqpod-error]"
                      )}
                      icon={
                        order.isDelivery
                          ? allIcons.solid.faCheckCircle
                          : allIcons.solid.faTimesCircle
                      }
                    />
                    <Translate content={order.isDelivery ? "yes" : "no"} />
                    {order.delivery?.uid && (
                      <AsyncComponent
                        deps={[order.delivery.uid]}
                        render={async () => {
                          const user = await getDoc<Biqpod.Account.User>([
                            "users",
                            order.delivery?.uid!,
                          ]);
                          return (
                            <EmptyComponent>
                              {" "}
                              /{" "}
                              <span className="group relative">
                                {user?.email}
                                <Card className="top-[calc(100%+5px)] right-0 absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                  <div className="flex items-center gap-2 p-2">
                                    <UserAvatar user={user} />
                                    <span>{user?.email}</span>
                                    <div className="flex">
                                      <CircleTip
                                        onClick={() => {
                                          var a = document.createElement("a");
                                          a.href = `tel:${user?.phone}`;
                                          a.click();
                                        }}
                                        icon={allIcons.solid.faPhone}
                                      />
                                      <CircleTip
                                        onClick={async () => {
                                          const response = await confirm({
                                            message: "Remove Delivery",
                                            title: "Remove Delivery",
                                          });
                                          if (response) {
                                            snapbuyApi
                                              .setDeliveryToOrder({
                                                orderId: order.id,
                                                delivery: null,
                                              })
                                              .then(() => {
                                                showToast(
                                                  "Delivery removed successfully",
                                                  "success"
                                                );
                                                execAction("fetch-orders", {});
                                              });
                                          }
                                        }}
                                        icon={allIcons.solid.faXmark}
                                      />
                                    </div>
                                  </div>
                                </Card>
                              </span>
                            </EmptyComponent>
                          );
                        }}
                      />
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
                  <motion.button
                    onClick={() => {
                      execAction("fetch-orders", {
                        next: true,
                      });
                    }}
                    className={tw(
                      "rounded-full flex items-center justify-center overflow-hidden",
                      isLoading && "animate-spin"
                    )}
                    style={{
                      background: "var(--biqpod-primary)",
                      color: "var(--biqpod-primary-content)",
                      border: "none",
                      outline: "none",
                      cursor: "pointer",
                      padding: "8px 0px",
                      minHeight: "40px",
                      minWidth: "40px",
                    }}
                    animate={{
                      width: isLoading ? 40 : 120,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      },
                    }}
                  >
                    <Icon
                      icon={
                        isLoading
                          ? allIcons.solid.faCircleNotch
                          : allIcons.solid.faPaperPlane
                      }
                      iconClassName={tw(isLoading && "animate-spin")}
                    />
                    <motion.span
                      className={tw(
                        "transition-[font-family] duration-200 ml-2 whitespace-nowrap"
                      )}
                      style={{ font: isLoading ? "0px" : "8px" }}
                      animate={{
                        opacity: isLoading ? 0 : 1,
                        width: isLoading ? 0 : "auto",
                        marginLeft: isLoading ? 0 : 8,
                        transition: { duration: 0.3 },
                      }}
                    >
                      <Translate content="fetch more" />
                    </motion.span>
                  </motion.button>
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
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <div className="flex justify-between items-center gap-2 p-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-[40px] h-[40px]">
                          <img
                            className="w-full h-full object-cover"
                            src={getImageByPlatform(order.platform)}
                          />
                        </span>
                        <span className="text-xl">{fullName}</span>
                      </div>
                      {!!order.totalPrice && (
                        <span className="font-bold text-green-600 max-md:text-base md:text-xl">
                          {order.totalPrice}DA
                        </span>
                      )}
                    </div>
                    <Line />
                    <div className="flex justify-between items-center p-2 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <Icon
                          iconClassName={tw(
                            order.isDelivery
                              ? "text-[--biqpod-success]"
                              : "text-[--biqpod-error]"
                          )}
                          icon={
                            order.isDelivery
                              ? allIcons.solid.faCheckCircle
                              : allIcons.solid.faTimesCircle
                          }
                        />
                        <span className="capitalize">
                          <Translate content="delivery" />
                        </span>
                      </div>
                    </div>
                    {order.delivery?.uid && (
                      <AsyncComponent
                        deps={[order.delivery.uid]}
                        render={async () => {
                          const user = await getDoc<Biqpod.Account.User>([
                            "users",
                            order.delivery?.uid!,
                          ]);
                          return (
                            <EmptyComponent>
                              <Line />
                              <div className="flex justify-between items-center gap-2 p-2 w-full">
                                <div className="flex items-center gap-2">
                                  <UserAvatar user={user} />
                                  <span>{user?.email}</span>
                                </div>
                                <div className="flex">
                                  <CircleTip
                                    onClick={() => {
                                      showPopup(
                                        <UpsertDelivery order={order} />
                                      );
                                    }}
                                    icon={allIcons.solid.faPen}
                                  />
                                  <CircleTip
                                    onClick={() => {
                                      var a = document.createElement("a");
                                      a.href = `tel:${user?.phone}`;
                                      a.click();
                                    }}
                                    icon={allIcons.solid.faPhone}
                                  />
                                  <CircleTip
                                    onClick={async () => {
                                      const response = await confirm({
                                        message: "Remove Delivery",
                                        title: "Remove Delivery",
                                      });
                                      if (response) {
                                        snapbuyApi
                                          .setDeliveryToOrder({
                                            orderId: order.id,
                                            delivery: null,
                                          })
                                          .then(() => {
                                            showToast(
                                              "Delivery removed successfully",
                                              "success"
                                            );
                                            execAction("fetch-orders", {});
                                          });
                                      }
                                    }}
                                    icon={allIcons.solid.faXmark}
                                  />
                                </div>
                              </div>
                            </EmptyComponent>
                          );
                        }}
                        loading={
                          <EmptyComponent>
                            <Line />
                            <CardWait className="w-full h-[50px]" />
                          </EmptyComponent>
                        }
                      />
                    )}
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
                      <span className="italic">
                        {order.client.place.wilaya}
                      </span>
                      <div className="flex items-center">
                        <CircleTip
                          icon={allIcons.solid.faPhone}
                          onClick={() => {
                            var a = document.createElement("a");
                            a.href = `tel:${order.client?.phone}`;
                            a.click();
                          }}
                        />
                        {!!(
                          order.client.place.latitude &&
                          order.client.place.longitude
                        ) && (
                          <CircleTip
                            icon={allIcons.solid.faLocationDot}
                            onClick={() => {
                              showPopup(
                                <Card className="w-2/3 overflow-hidden">
                                  <CardHeaderForPopup title="Client Location" />
                                  <Line />
                                  <div className="relative w-full h-[400px]">
                                    <MapContainer
                                      center={[
                                        order.client.place.latitude!,
                                        order.client.place.longitude!,
                                      ]}
                                      zoom={13}
                                      style={{ height: "100%", width: "100%" }}
                                    >
                                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                      <Marker
                                        position={[
                                          order.client.place.latitude!,
                                          order.client.place.longitude!,
                                        ]}
                                      >
                                        <Popup>
                                          {order.client?.firstname}{" "}
                                          {order.client?.lastname}
                                          <br />
                                          {order.client.place.wilaya}
                                        </Popup>
                                      </Marker>
                                    </MapContainer>
                                  </div>
                                </Card>
                              );
                            }}
                          />
                        )}
                        <CircleTip
                          icon={allIcons.solid.faEllipsisV}
                          onClick={async ({ clientX, clientY }) => {
                            openOrderMenu({ x: clientX, y: clientY, order });
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
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
