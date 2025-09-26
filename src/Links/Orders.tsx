import {
  allIcons,
  and,
  CloudSelection,
  getDoc,
  orderBy,
  where,
} from "@biqpod/app/ui/apis";
import {
  AsyncComponent,
  Button,
  Card,
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
import { OrderView } from "../routes/Clients/OrderView";
import { useActionStatus } from "../routes/Clients/CartPopup";
import {
  OrderClientDisplay,
  OrderClientLocation,
  OrderClientActions,
} from "../components/OrderClientDisplay";
import {
  AnimatedList,
  AnimatedListItem,
  ScaleIn,
  HoverScale,
  useInViewAnimation,
  springTransition,
} from "../animations";
import { AnimatedMarkdownRenderer } from "../components/AnimatedMarkdownRenderer";
import { useUsedBy } from "../routes/Stores/Stores";
const NoOrdersFound = () => {
  return (
    <motion.div className="flex justify-center items-center h-full min-h-[400px]">
      <ScaleIn delay={0.2}>
        <Card className="relative mx-auto max-w-md overflow-hidden text-center">
          {/* Animated background pattern */}
          <motion.div
            className="absolute inset-0 opacity-5"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div className="bg-gradient-to-br from-[--biqpod-primary] to-[--biqpod-secondary] w-full h-full" />
          </motion.div>
          <div className="z-10 relative">
            <motion.div
              className="p-5"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon
                  icon={allIcons.solid.faShoppingCart}
                  iconClassName="text-8xl text-[--biqpod-gray-opacity]"
                />
              </motion.div>
              {/* Floating particles animation */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-[--biqpod-primary] opacity-30 rounded-full w-2 h-2"
                  style={{
                    left: `${20 + i * 10}%`,
                    top: `${30 + (i % 2) * 20}%`,
                  }}
                  animate={{
                    y: [-10, 10, -10],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                />
              ))}
            </motion.div>
            <Line />
            <motion.div
              className="flex flex-col gap-2 p-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.h3
                className="font-semibold text-[--biqpod-text-color] text-xl uppercase"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  background:
                    "linear-gradient(90deg, var(--biqpod-text-color), var(--biqpod-primary), var(--biqpod-text-color))",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                <Translate content="no orders found" />
              </motion.h3>
              <motion.p
                className="text-[--biqpod-gray-opacity-2]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Translate content="there are no orders matching your criteria" />
              </motion.p>
            </motion.div>
            <Line />
            <motion.div
              className="p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <HoverScale scale={1.05}>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Button
                    icon={allIcons.solid.faRefresh}
                    onClick={() => execAction("fetch-orders", {})}
                    className="relative mx-auto rounded-full overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="z-10 relative">
                      <Translate content="refresh" />
                    </span>
                  </Button>
                </motion.div>
              </HoverScale>
            </motion.div>
          </div>
        </Card>
      </ScaleIn>
    </motion.div>
  );
};
const PAGE_SIZE = 40;
// Custom shimmer loading component
const OrderLoadingSkeleton = ({ index }: { index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative bg-[--biqpod-secondary-background] rounded-2xl h-[180px] overflow-hidden"
    >
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[--biqpod-primary] to-transparent opacity-20"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
          delay: index * 0.1,
        }}
      />
      {/* Content skeleton */}
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="bg-[--biqpod-border] rounded-lg w-10 h-10 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="bg-[--biqpod-border] rounded w-3/4 h-4 animate-pulse" />
            <div className="bg-[--biqpod-border] rounded w-1/2 h-3 animate-pulse" />
          </div>
        </div>
        <div className="bg-[--biqpod-border] h-px" />
        <div className="space-y-2">
          <div className="bg-[--biqpod-border] rounded w-full h-3 animate-pulse" />
          <div className="bg-[--biqpod-border] rounded w-5/6 h-3 animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <div className="bg-[--biqpod-border] rounded-full w-8 h-6 animate-pulse" />
            <div className="bg-[--biqpod-border] rounded-full w-16 h-6 animate-pulse" />
          </div>
          <div className="bg-[--biqpod-border] rounded w-12 h-4 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
};
// Desktop loading skeleton
const DesktopOrderLoadingSkeleton = ({ index }: { index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="relative flex justify-between items-center gap-2 odd:bg-[--biqpod-secondary-background] p-2 rounded-lg overflow-hidden"
    >
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[--biqpod-primary] to-transparent opacity-10"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "linear",
          delay: index * 0.05,
        }}
      />
      {/* Content skeleton */}
      <div className="flex items-center gap-2 w-full">
        <div className="bg-[--biqpod-border] rounded-full w-8 h-8 animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="bg-[--biqpod-border] rounded w-2/3 h-3 animate-pulse" />
          <div className="bg-[--biqpod-border] rounded w-1/2 h-2 animate-pulse" />
        </div>
      </div>
      <div className="bg-[--biqpod-border] rounded w-full h-3 animate-pulse" />
      <div className="flex justify-center w-full">
        <div className="bg-[--biqpod-border] rounded-full w-6 h-6 animate-pulse" />
      </div>
      <div className="bg-[--biqpod-border] rounded-full w-full h-6 animate-pulse" />
      <div className="flex items-center gap-2 w-full">
        <div className="bg-[--biqpod-border] rounded w-8 h-8 animate-pulse" />
        <div className="bg-[--biqpod-border] rounded w-16 h-3 animate-pulse" />
      </div>
      <div className="flex items-center gap-2 w-full">
        <div className="bg-[--biqpod-border] rounded-full w-4 h-4 animate-pulse" />
        <div className="bg-[--biqpod-border] rounded w-8 h-3 animate-pulse" />
      </div>
      <div className="bg-[--biqpod-border] rounded-full w-6 h-6 animate-pulse" />
    </motion.div>
  );
};
interface StatusUiProps {
  status: SnapBuy.OrderStatus;
}
export const StatusUi = ({ status }: StatusUiProps) => {
  return (
    <motion.span
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="inline-flex relative items-center gap-2 p-2 rounded-2xl overflow-hidden cursor-pointer"
      style={{
        color: colors[status],
        backgroundColor: `${colors[status]}20`,
      }}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
        className="z-10 relative"
      >
        <Icon icon={icons[status]} />
      </motion.div>
      <span className="z-10 relative">
        <Translate content={status} />
      </span>
    </motion.span>
  );
};
export const Orders = () => {
  const searchOrder = getFieldValue("search-order");
  const isFocused = useCopyState(false);
  const { ref: containerRef, controls: containerControls } = useInViewAnimation(
    0.1,
    false
  );
  const usedBy = useUsedBy();
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
          const { products = {}, packs = {} } = order;
          const productCount =
            Object.keys(products).length + Object.keys(packs).length;
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
    <motion.div
      ref={containerRef}
      animate={containerControls}
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="flex justify-between items-center gap-2 p-2">
        <motion.div
          className="relative w-full"
          animate={isFocused.get ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
          {ordersState && (
            <motion.span
              className="top-1/2 right-3 absolute text-[--biqpod-primary] -translate-y-1/2 transform"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              / {ordersState?.length || "NO Orders"}
            </motion.span>
          )}
        </motion.div>
        <div>
          <HoverScale scale={1.1}>
            <motion.div
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <CircleTip
                icon={allIcons.solid.faFilter}
                onClick={() => {
                  showPopup(<FilterOrders />);
                }}
              />
            </motion.div>
          </HoverScale>
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
              <Translate content="items" />
            </span>
            <span className="inline-flex items-center gap-2 w-full capitalize">
              <Icon icon={allIcons.solid.faTag} />
              <Translate content="status" />
            </span>
            <span className="inline-flex items-center gap-2 w-full capitalize">
              <Icon icon={allIcons.solid.faNoteSticky} />
              <Translate content="note" />
            </span>
            <span className="inline-flex items-center gap-2 w-full capitalize">
              <Icon icon={allIcons.solid.faDashboard} />
              <Translate content="ads" />
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
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springTransition}
                className="top-0 z-[10] absolute inset-x-0 flex justify-center items-center gap-2 p-3"
              >
                <HoverScale scale={1.05}>
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
                </HoverScale>
              </motion.div>
            )}
            {ordersState && ordersState.length === 0 && !isLoading && (
              <NoOrdersFound />
            )}
            <AnimatedList staggerDelay={0.05}>
              {ordersState?.map(({ order, timeAgo, productCount }, index) => {
                return (
                  <AnimatedListItem key={order.id} index={index}>
                    <HoverScale scale={1.01}>
                      <div className="flex justify-between items-center gap-2 odd:bg-[--biqpod-secondary-background] p-2 rounded-lg transition-colors duration-200">
                        <div className="w-full">
                          <OrderClientDisplay
                            order={order}
                            showPhone={true}
                            showCustomerBadge={true}
                          />
                        </div>
                        <span className="w-full">{timeAgo}</span>
                        <span className="w-full">
                          <motion.span
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-2 py-1 rounded-full font-bold bg-[--biqpod-text-color] text-[--biqpod-primary-background] transition-transform"
                          >
                            {productCount}
                          </motion.span>
                        </span>
                        <div className="w-full">
                          <StatusUi status={order.status} />
                        </div>
                        <span className="w-full text-[--biqpod-gray-opacity] text-sm truncate">
                          {order.note || "-"}
                        </span>
                        <span className="flex items-center gap-1 py-2 w-full overflow-hidden">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="inline-block w-[35px] h-[35px]"
                          >
                            <img
                              className="rounded-lg w-full h-full object-cover"
                              src={getImageByPlatform(order.platform)}
                            />
                          </motion.span>
                          <span className="capitalize">{order.platform}</span>
                        </span>
                        <span className="flex items-center gap-2 py-2 w-full">
                          <div className="flex items-center gap-2 text-[--biqpod-primary]">
                            <span className="font-semibold">
                              {order.deliveryPrice
                                ? order.deliveryPrice.toString().concat("DA")
                                : "Free"}
                            </span>
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
                                    {" "}
                                    /{" "}
                                    <span className="group relative">
                                      {user?.email}
                                      <Card className="top-[calc(100%+5px)] right-0 absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                        <div className="flex items-center gap-2 p-2">
                                          <UserAvatar user={user} />
                                          <span>{user?.email}</span>
                                          <div className="flex">
                                            {(usedBy === "owned" ||
                                              usedBy === "read/edit") && (
                                              <>
                                                <motion.div
                                                  whileHover={{ scale: 1.2 }}
                                                  whileTap={{ scale: 0.9 }}
                                                >
                                                  <CircleTip
                                                    onClick={() => {
                                                      var a =
                                                        document.createElement(
                                                          "a"
                                                        );
                                                      a.href = `tel:${user?.phone}`;
                                                      a.click();
                                                    }}
                                                    icon={
                                                      allIcons.solid.faPhone
                                                    }
                                                  />
                                                </motion.div>
                                                <motion.div
                                                  whileHover={{ scale: 1.2 }}
                                                  whileTap={{ scale: 0.9 }}
                                                >
                                                  <CircleTip
                                                    onClick={async () => {
                                                      const response =
                                                        await confirm({
                                                          message:
                                                            "Remove Delivery",
                                                          title:
                                                            "Remove Delivery",
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
                                                            execAction(
                                                              "fetch-orders",
                                                              {}
                                                            );
                                                          });
                                                      }
                                                    }}
                                                    icon={
                                                      allIcons.solid.faXmark
                                                    }
                                                  />
                                                </motion.div>
                                              </>
                                            )}
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
                          {(usedBy === "owned" || usedBy === "read/edit") && (
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <CircleTip
                                icon={allIcons.solid.faEllipsisV}
                                onClick={({ clientY, clientX }) => {
                                  openOrderMenu({
                                    x: clientX,
                                    y: clientY,
                                    order,
                                  });
                                }}
                              />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </HoverScale>
                  </AnimatedListItem>
                );
              })}
            </AnimatedList>
            {isLoading && (
              <AnimatedList staggerDelay={0.03}>
                {range(PAGE_SIZE).map((index) => (
                  <AnimatedListItem
                    key={`desktop-loading-${index}`}
                    index={index}
                  >
                    <DesktopOrderLoadingSkeleton index={index} />
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            )}
            {hasMore.get && !isLoading && (
              <div className="flex justify-center items-center gap-2 p-2">
                <span>
                  <motion.button
                    onClick={() => {
                      execAction("fetch-orders", {
                        next: true,
                      });
                    }}
                    className={tw(
                      "rounded-full flex items-center justify-center overflow-hidden relative"
                    )}
                    style={{
                      background: "var(--biqpod-primary)",
                      color: "var(--biqpod-primary-content)",
                      border: "none",
                      outline: "none",
                      cursor: "pointer",
                      padding: "8px 16px",
                      minHeight: "40px",
                      minWidth: "40px",
                    }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      width: isLoading ? 40 : 140,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      },
                    }}
                  >
                    {/* Shimmer effect on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    <motion.div
                      animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                      transition={
                        isLoading
                          ? { duration: 1, repeat: Infinity, ease: "linear" }
                          : {}
                      }
                    >
                      <Icon
                        icon={
                          isLoading
                            ? allIcons.solid.faCircleNotch
                            : allIcons.solid.faPaperPlane
                        }
                      />
                    </motion.div>
                    <motion.span
                      className="z-10 relative ml-2 whitespace-nowrap"
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
          {ordersState && ordersState.length === 0 && !isLoading && (
            <NoOrdersFound />
          )}
          <AnimatedList className="flex flex-col gap-4 p-2" staggerDelay={0.05}>
            {ordersState?.map(({ order, timeAgo, productCount }, index) => {
              return (
                <AnimatedListItem key={order.id} index={index}>
                  <HoverScale scale={1.01}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden">
                        <div className="flex justify-between items-center gap-2 p-2">
                          <div className="flex items-center gap-2">
                            <motion.span
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="inline-block w-[40px] h-[40px]"
                            >
                              <img
                                className="rounded-lg w-full h-full object-cover"
                                src={getImageByPlatform(order.platform)}
                              />
                            </motion.span>
                            <OrderClientDisplay
                              order={order}
                              className="text-xl"
                              showCustomerBadge={true}
                            />
                          </div>
                          {!!order.totalPrice && (
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className="font-bold text-green-600 max-md:text-base md:text-xl"
                            >
                              {order.totalPrice}DA
                            </motion.span>
                          )}
                        </div>
                        <Line />
                        <div className="flex justify-end items-center p-2">
                          <div className="flex items-center gap-2 text-[--biqpod-primary]">
                            <span className="font-semibold">
                              {order.deliveryPrice
                                ? order.deliveryPrice.toString().concat("DA")
                                : "Free"}
                            </span>
                            <Icon icon={allIcons.solid.faTruck} />
                          </div>
                        </div>
                        <Line />
                        <div className="flex justify-between items-center p-2">
                          <div className="flex items-center gap-2">
                            <motion.span
                              whileHover={{ scale: 1.1, rotate: 10 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-2 py-1 rounded-full font-bold bg-[--biqpod-text-color] text-[--biqpod-primary-background]"
                            >
                              {productCount}
                            </motion.span>
                            <StatusUi status={order.status} />
                          </div>
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className="text-sm"
                          >
                            {timeAgo}
                          </motion.span>
                        </div>
                        <Line />
                        <div className="flex justify-between items-center p-2">
                          <OrderClientLocation order={order} />
                          <div className="flex items-center">
                            {(usedBy === "owned" || usedBy === "read/edit") && (
                              <OrderClientActions order={order} />
                            )}
                            {(usedBy === "owned" || usedBy === "read/edit") && (
                              <motion.div
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <CircleTip
                                  icon={allIcons.solid.faEllipsisV}
                                  onClick={async ({ clientX, clientY }) => {
                                    openOrderMenu({
                                      x: clientX,
                                      y: clientY,
                                      order,
                                    });
                                  }}
                                />
                              </motion.div>
                            )}
                          </div>
                        </div>
                        {order.note && (
                          <EmptyComponent>
                            <Line />
                            <div className="flex items-start gap-2 p-2">
                              <Icon
                                icon={allIcons.solid.faNoteSticky}
                                iconClassName="text-[--biqpod-primary] mt-1 flex-shrink-0"
                              />
                              <div className="flex-1">
                                <span className="font-medium text-[--biqpod-text-color] text-sm capitalize">
                                  <Translate content="note" />:
                                </span>
                                <AnimatedMarkdownRenderer
                                  content={order.note}
                                  className="mt-1 text-[--biqpod-gray-opacity] text-sm break-words"
                                />
                              </div>
                            </div>
                          </EmptyComponent>
                        )}
                      </Card>
                    </motion.div>
                  </HoverScale>
                </AnimatedListItem>
              );
            })}
          </AnimatedList>
          {isLoading && (
            <AnimatedList staggerDelay={0.05}>
              {range(PAGE_SIZE).map((index) => (
                <AnimatedListItem key={`mobile-loading-${index}`} index={index}>
                  <OrderLoadingSkeleton index={index} />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
          {hasMore.get && !isLoading && (
            <HoverScale scale={1.05}>
              <Card className="justify-center items-center w-full h-[180px]">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
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
                </motion.div>
              </Card>
            </HoverScale>
          )}
        </Scroll>
      )}
    </motion.div>
  );
};
