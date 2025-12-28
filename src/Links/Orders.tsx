import { allIcons, and, getDoc, where } from "@biqpod/app/ui/apis";
import {
  AsyncComponent,
  BooleanField,
  Button,
  Card,
  CardHeaderForPopup,
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
  openMenu,
  showPopup,
  showToast,
  useAction,
  useAsyncEffect,
  useCopyState,
  useDeviceResolution,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { fuzzySearch, tw } from "@biqpod/app/ui/utils";
import { useEffect, useMemo } from "react";
import { onCollectionSnapshot } from "../server";
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
import { colors, getImageByPlatform, orderStatusIcons } from "../utils";
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
  HoverScale,
  useInViewAnimation,
  springTransition,
} from "../animations";
import { AnimatedMarkdownRenderer } from "../components/AnimatedMarkdownRenderer";
import { useUsedBy } from "../routes/Stores/Stores";
import { ChangeStatus } from "../routes/Stores/ChangeStatus";
import { CreateFirstUI } from "../components/CreateFirstUI";
import { LoadingData } from "./LoadingData";
import { setTextSide } from "../hooks/usePayments";
const NoOrdersFound = () => {
  return (
    <CreateFirstUI
      photo="https://cdn3d.iconscout.com/3d/premium/thumb/order-3d-icon-png-download-9984720.png"
      title="No Orders Found"
      description="You have no orders yet. Create your first order to get started."
    />
  );
};
const PAGE_SIZE = 40;
interface StatusUiProps {
  status: Biqpod.Snapbuy.Basic.OrderStatus;
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
        <Icon icon={orderStatusIcons[status]} />
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
  const noteHover = useCopyState<
    Record<string, { top: number; left: number } | null>
  >({});
  const expandedNotes = useCopyState<Record<string, boolean>>({});
  const isSelectionMode = useCopyState(false);
  const selectedOrders = useCopyState<Biqpod.Snapbuy.Order[]>([]);
  const setNoteHover = (
    orderId: string,
    position: { top: number; left: number } | null
  ) => {
    noteHover.set((prev) => ({ ...prev, [orderId]: position }));
  };
  useEffect(() => {
    return () => {
      isFocused.set(false);
    };
  }, []);
  const orders = useTemp<Biqpod.Snapbuy.Order[]>("orders-list"); // Replace with your actual orders data
  const user = useUser();
  const lastDoc = useCopyState<Biqpod.Snapbuy.Order | null>(null);
  const hasMore = useCopyState(true);
  const loc = useLocation();
  const selectedStoreId = useStoreId();
  useAsyncEffect(async () => {
    if (selectedStoreId && user) {
      const searcher = new URLSearchParams(loc.search);
      const orderId = searcher.get("id");
      if (orderId) {
        const order = await snapbuyApi.order.get(orderId);
        console.log(order);
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
    }
  }, [loc.search, selectedStoreId, user]);
  const filterState = useFilterState();
  const action = useAction(
    "fetch-orders",
    async ({ next = false }) => {
      if (!selectedStoreId) {
        return;
      }
      if (!user?.uid) {
        return;
      }
      const newOrders = await snapbuyApi.order.getList(
        selectedStoreId,
        filterState,
        PAGE_SIZE,
        next && lastDoc.get?.createdAt
      );
      if (!newOrders) {
        return;
      }
      orders.set((prev) => {
        const result = next && prev ? [...prev, ...newOrders] : newOrders;
        return result;
      });
      const lastDocRef = newOrders.at(-1);
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
    var result = orders.get
      ?.filter((order) => {
        return fuzzySearch(
          `${order.id} @status ${order.status}`,
          searchOrder || ""
        );
      })
      .map((order) => {
        const time = new Date(order.createdAt!);
        const timeDifference = Math.floor(
          (currentTime.getTime() - time.getTime()) / 1000
        );
        let timeAgo = "";
        if (timeDifference < 60) {
          timeAgo = `${timeDifference} sec${timeDifference > 1 ? "s" : ""} ago`;
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
      });
    return result;
  }, [searchOrder, orders.get]);
  const hasNews = useCopyState<Biqpod.Snapbuy.Order[]>([]);
  useEffect(() => {
    if (user?.uid) {
      return onCollectionSnapshot<Biqpod.Snapbuy.Order>(
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
  const toggleSelectionMode = () => {
    isSelectionMode.set(!isSelectionMode.get);
    selectedOrders.set([]);
  };
  const bulkDeleteOrders = async () => {
    if (selectedOrders.get.length === 0 || !selectedStoreId) return;
    const response = await confirm({
      title: "Delete Selected Orders",
      message: `Are you sure you want to delete ${selectedOrders.get.length} order(s)? This action cannot be undone.`,
      type: "warning",
    });
    if (!response) return;
    try {
      setTextSide("Deleting orders...");
      await Promise.all(
        selectedOrders.get.map((order) => snapbuyApi.order.delete(order.id!))
      );
      setTextSide();
      showToast(
        `${selectedOrders.get.length} order(s) deleted successfully`,
        "success"
      );
      orders.set((allOrders) =>
        allOrders
          ? allOrders.filter(
              (o) => !selectedOrders.get.map((s) => s.id).includes(o.id)
            )
          : []
      );
      selectedOrders.set([]);
      isSelectionMode.set(false);
    } catch (err) {
      console.error("Failed to delete orders:", err);
      showToast("Failed to delete some orders. Please try again.", "error");
    }
  };
  return (
    <motion.div
      ref={containerRef}
      animate={containerControls}
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="flex justify-between items-center gap-2 p-2">
        <motion.div
          className="relative flex justify-center w-full"
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
            <span className="top-1/2 right-2 absolute font-bold text-[--biqpod-primary] -translate-y-1/2 transform">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                / {ordersState?.length || 0}
              </motion.span>
            </span>
          )}
        </motion.div>
        <div>
          <HoverScale>
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
      {!!orders.get?.length && (
        <EmptyComponent>
          <Line />
          <motion.div
            className="flex justify-end gap-2 p-2 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {isSelectionMode.get && selectedOrders.get.length > 0 && (
              <Button
                onClick={({ clientX, clientY }) => {
                  openMenu({
                    x: clientX,
                    y: clientY,
                    menu: [
                      {
                        label: "Delete Selected",
                        defaultIcon: allIcons.solid.faTrash,
                        click: () => {
                          bulkDeleteOrders();
                        },
                      },
                      {
                        label: "Change Status",
                        defaultIcon: allIcons.solid.faTag,
                        click() {
                          showPopup(
                            <ChangeStatus orders={selectedOrders.get} />
                          );
                        },
                      },
                    ],
                  });
                }}
                className="px-3 py-1 w-fit text-sm"
              >
                Execute ({selectedOrders.get.length})
              </Button>
            )}
            {isSelectionMode.get &&
              !!selectedOrders.get.length &&
              selectedOrders.get.length === ordersState?.length && (
                <Button
                  onClick={() => {
                    selectedOrders.set([]);
                  }}
                  className="px-3 py-1 w-fit text-sm"
                >
                  Deselect ({selectedOrders.get.length})
                </Button>
              )}
            {isSelectionMode.get &&
              selectedOrders.get.length !== ordersState?.length && (
                <Button
                  onClick={() => {
                    selectedOrders.set(
                      ordersState?.map(({ order }) => order) || []
                    );
                  }}
                  className="px-3 py-1 w-fit text-sm"
                >
                  Select ({selectedOrders.get.length})
                </Button>
              )}
            {ordersState && ordersState.length > 0 && (
              <Button
                onClick={toggleSelectionMode}
                className="bg-[--biqpod-gray-opacity] px-3 py-1 w-fit text-[--biqpod-text-color]"
              >
                <Icon
                  icon={
                    isSelectionMode.get
                      ? allIcons.solid.faTimes
                      : allIcons.solid.faCheck
                  }
                />
                <Translate
                  content={
                    isSelectionMode.get ? "cancel selection" : "select orders"
                  }
                />
              </Button>
            )}
          </motion.div>
        </EmptyComponent>
      )}
      <Line />
      {!isSmallView && (
        <EmptyComponent>
          <Line />
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
                <HoverScale>
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
                const isSelected = selectedOrders.get
                  .map((s) => s.id)
                  .includes(order.id);
                return (
                  <AnimatedListItem key={order.id} index={index}>
                    <HoverScale>
                      <motion.div
                        className={tw(
                          "flex justify-between items-center gap-2 odd:bg-[--biqpod-secondary-background] p-2"
                        )}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-1 w-full">
                          {isSelectionMode.get && (
                            <motion.div
                              className="flex justify-center items-center w-10"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 40 }}
                              exit={{ opacity: 0, width: 0 }}
                            >
                              <BooleanField
                                config={{
                                  style: "checkbox",
                                }}
                                state={{
                                  get: isSelected,
                                  set: (value) => {
                                    const val =
                                      typeof value === "function"
                                        ? value(isSelected)
                                        : value;
                                    if (val) {
                                      selectedOrders.set((prev) => [
                                        ...prev,
                                        order,
                                      ]);
                                    } else {
                                      selectedOrders.set((prev) =>
                                        prev.filter((o) => o.id !== order.id)
                                      );
                                    }
                                  },
                                }}
                              />
                            </motion.div>
                          )}
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
                        <div
                          onClick={() => {
                            showPopup(
                              <Card className="max-md:rounded-none max-md:w-full max-md:h-full">
                                <CardHeaderForPopup title="Note" />
                                <Line />
                                <Scroll className="p-2">
                                  <AnimatedMarkdownRenderer
                                    content={order.note || ""}
                                  />
                                </Scroll>
                              </Card>
                            );
                          }}
                          onMouseLeave={() => setNoteHover(order.id!, null)}
                          className="w-full overflow-hidden"
                        >
                          <span className="text-[--biqpod-gray-opacity] text-sm truncate">
                            {order.note || "-"}
                          </span>
                        </div>
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
                                    <span className="relative">
                                      {user?.email}
                                      <Card className="top-[calc(100%+5px)] right-0 absolute opacity-0 hover:opacity-100 transition-opacity pointer-events-none hover:pointer-events-auto">
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
                                                            orderId: order.id!,
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
                      </motion.div>
                    </HoverScale>
                  </AnimatedListItem>
                );
              })}
            </AnimatedList>
            {isLoading && <LoadingData />}
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
              const isSelected = selectedOrders.get
                .map((s) => s.id)
                .includes(order.id);
              return (
                <AnimatedListItem className="p-2" key={order.id} index={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="flex justify-between items-center gap-2 p-2">
                        <div className="flex items-center gap-1">
                          {isSelectionMode.get && (
                            <BooleanField
                              config={{
                                style: "checkbox",
                              }}
                              state={{
                                get: isSelected,
                                set: (value) => {
                                  const val =
                                    typeof value === "function"
                                      ? value(isSelected)
                                      : isSelected;
                                  selectedOrders.set((prev) => {
                                    if (val) {
                                      return [...prev, order];
                                    } else {
                                      return prev.filter(
                                        (o) => o.id !== order.id
                                      );
                                    }
                                  });
                                },
                              }}
                            />
                          )}
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
                              className="flex-shrink-0 mt-1 text-[--biqpod-primary]"
                            />
                            <div className="flex-1">
                              <span className="font-medium text-[--biqpod-text-color] text-sm capitalize">
                                <Translate content="note" />:
                              </span>
                              <motion.div
                                className="relative mt-1 overflow-hidden"
                                initial={{
                                  maxHeight: expandedNotes.get[order.id!]
                                    ? 1000
                                    : 48,
                                }}
                                animate={{
                                  maxHeight: expandedNotes.get[order.id!]
                                    ? 1000
                                    : 48,
                                }}
                                transition={{
                                  duration: 0.3,
                                  ease: "easeInOut",
                                }}
                              >
                                <AnimatedMarkdownRenderer
                                  content={order.note}
                                  className="text-sm break-words"
                                />
                                {order.note.length > 50 && (
                                  <motion.div
                                    className="right-0 bottom-0 left-0 absolute bg-gradient-to-t from-[--biqpod-secondary-background] to-transparent h-4"
                                    initial={{
                                      opacity: expandedNotes.get[order.id!]
                                        ? 0
                                        : 1,
                                    }}
                                    animate={{
                                      opacity: expandedNotes.get[order.id!]
                                        ? 0
                                        : 1,
                                    }}
                                    transition={{ duration: 0.3 }}
                                  />
                                )}
                              </motion.div>
                              {order.note.length > 50 && (
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="flex justify-center items-center mt-1"
                                >
                                  <CircleTip
                                    icon={
                                      expandedNotes.get[order.id!]
                                        ? allIcons.solid.faChevronUp
                                        : allIcons.solid.faChevronDown
                                    }
                                    onClick={() => {
                                      expandedNotes.set((prev) => ({
                                        ...prev,
                                        [order.id!]: !prev[order.id!],
                                      }));
                                    }}
                                  />
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </EmptyComponent>
                      )}
                    </Card>
                  </motion.div>
                  {/* </HoverScale> */}
                </AnimatedListItem>
              );
            })}
          </AnimatedList>
          {isLoading && <LoadingData />}
          {hasMore.get && !isLoading && (
            <HoverScale className="p-2">
              <Card className="justify-center items-center w-full h-[180px]">
                <motion.div transition={{ duration: 0.5 }}>
                  <CircleTip
                    icon={
                      isLoading
                        ? allIcons.solid.faCircleNotch
                        : allIcons.solid.faChevronRight
                    }
                    className={tw(isLoading && "animate-spin")}
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
