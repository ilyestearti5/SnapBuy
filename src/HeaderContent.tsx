import { allIcons } from "@biqpod/app/ui/apis";
import { isDesktop } from "@biqpod/app/ui/app";
import {
  AsyncComponent,
  Button,
  Card,
  CardHeaderForPopup,
  CardWait,
  CircleTip,
  DarkLightIcon,
  EmptyComponent,
  Icon,
  Key,
  Line,
  Scroll,
  Translate,
  UserAvatar,
  WindowControls,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  openMenu,
  setSettingValue,
  setTemp,
  showPopup,
  showProfile,
  showSetting,
  showToast,
  useAction,
  useAsyncMemo,
  useCopyState,
  useDeviceResolution,
  useSettingValue,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { cloud } from "./server";
import { Route, Switch, useHistory, useLocation } from "react-router";
import { snapbuyApi } from "./apis";
import { useEffect, useMemo } from "react";
import { mapAsync, mergeArray, tw } from "@biqpod/app/ui/utils";
import { Biqpod, OpenMenuProps } from "@biqpod/app/ui/types";
import { useStoreId } from "./utils";
import { initStoreIdSave } from "./utils";
import { openNotificationSettings } from "./components/NotificationSettingsExamples";
import { HoverScale } from "./animations/components";
import { motion } from "framer-motion";
import { useUsedBy } from "./routes/Stores/Stores";
import { useEffectDelay } from "@biqpod/app/ui/shared";
const LIMIT = 20;
const Notifications = () => {
  const storeId = useStoreId();
  const hasMore = useTemp<boolean>("notifications-has-more");
  const lastNotification = useTemp<Biqpod.Snapbuy.Notification | null>(
    "last-notifications"
  );
  const user = useUser();
  const loading = useCopyState(false);
  const data = useCopyState<Biqpod.Snapbuy.Notification[]>([]);
  const fetchNotifications = async () => {
    if (loading.get) return;
    loading.set(true);
    const list = await snapbuyApi.notifications.list({
      storeId: storeId ?? undefined,
      startAt: lastNotification.get?.createdAt,
      limit: LIMIT,
    });
    const last = list?.at(-1) ?? null;
    lastNotification.set(last);
    hasMore.set(list?.length === LIMIT);
    loading.set(false);
    data.set((prev) => {
      return [...prev, ...(list || [])];
    });
  };
  useEffectDelay(
    async () => {
      await fetchNotifications();
    },
    [],
    2000
  );
  useEffect(() => {
    if (storeId && user) {
      return snapbuyApi.notifications.on(
        (notification) => {
          data.set((prev) => [notification, ...prev]);
        },
        {
          storeId,
        }
      );
    }
  }, [user]);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrolledToBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (scrolledToBottom && hasMore.get && !loading.get) {
      fetchNotifications();
    }
  };
  return (
    <Card className="max-h-[80vh]">
      <CardHeaderForPopup title="Notifications" />
      <Line />
      <div className="overflow-y-auto" onScroll={handleScroll}>
        {data.get.map((notification, index) => {
          const notifIcon =
            notification.type === "success"
              ? allIcons.solid.faCheckCircle
              : notification.type === "error"
              ? allIcons.solid.faExclamationCircle
              : notification.type === "warning"
              ? allIcons.solid.faExclamationTriangle
              : allIcons.solid.faInfoCircle;
          const notifColor =
            notification.type === "success"
              ? "text-green-500"
              : notification.type === "error"
              ? "text-red-500"
              : notification.type === "warning"
              ? "text-yellow-500"
              : "text-blue-500";
          return (
            <motion.div
              key={notification.id || index}
              className={tw(
                "p-4 hover:bg-[--biqpod-gray-opacity] cursor-pointer border-b border-[--biqpod-border] transition-colors",
                !notification.readed && "bg-[--biqpod-gray-opacity-half]"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => {
                if (notification.id && !notification.readed) {
                  snapbuyApi.notifications.markAsRead(notification.id);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className={tw("flex-shrink-0 mt-1", notifColor)}>
                  <Icon icon={notifIcon} className="text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm break-words">
                    {notification.message}
                  </p>
                  {notification.meta &&
                    Object.keys(notification.meta).length > 0 && (
                      <div className="space-y-1 opacity-70 mt-2 text-xs">
                        {Object.entries(notification.meta).map(
                          ([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-semibold capitalize">
                                {key}:
                              </span>
                              <span className="break-all">{String(value)}</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  {notification.createdAt && (
                    <p className="opacity-50 mt-2 text-xs">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {!notification.readed && (
                  <div className="flex-shrink-0">
                    <div className="bg-blue-500 rounded-full w-2 h-2" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {loading.get && (
          <div className="p-4 text-center">
            <Icon icon={allIcons.solid.faSpinner} className="animate-spin" />
          </div>
        )}
        {!hasMore.get && data.get.length > 0 && (
          <div className="opacity-60 p-4 text-sm text-center">
            <Translate content="No more notifications" />
          </div>
        )}
        {data.get.length === 0 && !loading.get && (
          <div className="opacity-60 p-4 text-sm text-center">
            <Translate content="No notifications" />
          </div>
        )}
      </div>
    </Card>
  );
};
const getId = () => {
  return location.pathname.split("/").at(-1);
};
export const HeaderContent = () => {
  initStoreIdSave();
  const user = useUser();
  const isDark = useSettingValue("window/dark.boolean");
  const loadingPercent = useTemp<number>("loading-percent");
  const loadingText = useTemp<string>("loading-text");
  const storeId = useStoreId();
  useAction(
    "upsert-pack",
    async (packInfo: Biqpod.Snapbuy.Pack) => {
      if (!user) {
        showToast("You must be logged in to add a pack");
        return;
      }
      if (!storeId) {
        showToast("Store not found");
        return;
      }
      if (!packInfo.name) {
        showToast("Pack name is required");
        return;
      }
      if (!packInfo.products || packInfo.products.length === 0) {
        showToast("Pack must have at least one product");
        return;
      }
      closePopup();
      loadingText.set("Adding Pack...");
      if (packInfo.id) {
        await snapbuyApi.packs.update(packInfo.id, {
          ...packInfo,
          storeId,
        });
      } else {
        await snapbuyApi.packs.add({
          ...packInfo,
          storeId,
        });
      }
      loadingText.set("");
      showToast("Pack saved successfully");
      execAction("fetch-packs");
    },
    [storeId, user]
  );
  useAction(
    "add-products",
    async ({ exists = [], news = [] }: AddProductActionProps) => {
      if (!storeId) {
        showToast("Store not found");
        return;
      }
      const newList = news || [];
      const existsList = exists || [];
      closePopup();
      try {
        loadingText.set("Adding News products...");
        loadingPercent.set(0);
        await snapbuyApi.product.upsert(storeId, newList, (product, index) => {
          loadingText.set(
            `Adding ${product.name?.slice(0, 10)} ${index + 1}/${
              newList.length
            } ...`
          );
          loadingPercent.set(Math.round(((index + 1) / newList.length) * 100));
        });
      } catch (e) {
        loadingPercent.set(0);
        loadingText.set("");
        showToast("Error adding new products");
        return;
      }
      try {
        loadingText.set("Adding Exists products...");
        loadingPercent.set(0);
        await snapbuyApi.product.upsert(
          storeId,
          existsList,
          (product, index) => {
            loadingText.set(
              `Updating ${product.name?.slice(0, 10)} ${index + 1}/${
                existsList.length
              } ...`
            );
            loadingPercent.set(
              Math.round(((index + 1) / existsList.length) * 100)
            );
          }
        );
        loadingText.set("");
        loadingPercent.set(0);
      } catch (e) {
        loadingPercent.set(0);
        loadingText.set("");
      }
      execAction("fetch-products");
    },
    [storeId]
  );
  const hist = useHistory();
  const subed = useAsyncMemo(() => {
    return snapbuyApi.isSubscribed();
  }, [user]);
  useEffect(() => {
    setTemp("subed", subed);
  }, [subed]);
  const { isMobile } = useDeviceResolution();
  useAction(
    "delete-products",
    async (prodsIds: string[]) => {
      if (!user) {
        return;
      }
      await mapAsync(prodsIds, async (prodId, index) => {
        loadingText.set(`Deleting product ${prodId}...`);
        loadingPercent.set(Math.round(((index + 1) / prodsIds.length) * 100));
        await snapbuyApi.product.delete(prodId);
      });
      loadingText.set("");
      loadingPercent.set(0);
    },
    [user]
  );
  const orders = useAsyncMemo(async () => {
    if (storeId) return snapbuyApi.ordersWillDeletingAfter7Day(storeId);
  }, [user?.uid, storeId]);
  const loc = useLocation();
  const id = useMemo(() => {
    return getId();
  }, [loc.pathname]);
  const usedBy = useUsedBy(user);
  return (
    <EmptyComponent>
      <motion.div
        className="flex justify-between items-center px-4 w-full"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center gap-x-1">
          <HoverScale scale={1.1}>
            <CircleTip
              icon={allIcons.solid.faChevronLeft}
              onClick={() => {
                hist.goBack();
              }}
            />
          </HoverScale>
          <Switch>
            <Route path="/pack/:packId">
              <AsyncComponent
                deps={[id]}
                render={async () => {
                  if (!id) return <EmptyComponent />;
                  const packInfo = await snapbuyApi.packs.get(id);
                  return (
                    <span className="max-md:text-xl md:text-2xl capitalize">
                      {packInfo?.name || "Pack"}
                    </span>
                  );
                }}
                loading={
                  <CardWait className="rounded-full w-[120px] h-[20px]" />
                }
              />
            </Route>
            <Route path="/product/:productId">
              <AsyncComponent
                deps={[id]}
                render={async () => {
                  if (!id) return <EmptyComponent />;
                  const productInfo = await snapbuyApi.product.get(id);
                  return (
                    <span className="max-md:text-xl md:text-2xl capitalize">
                      {productInfo?.name || "Product"}
                    </span>
                  );
                }}
                loading={
                  <CardWait className="rounded-full w-[120px] h-[20px]" />
                }
              />
            </Route>
            <Route path="/collection/:collectionId">
              <AsyncComponent
                render={async () => {
                  const collectionId = getId();
                  if (!collectionId) return <EmptyComponent />;
                  const storeInfo = await snapbuyApi.collections.get(
                    collectionId
                  );
                  return (
                    <span className="max-md:text-xl md:text-2xl capitalize">
                      {storeInfo?.name || "Untitled Collection"}
                    </span>
                  );
                }}
                loading={
                  <CardWait className="rounded-full w-[120px] h-[20px]" />
                }
              />
            </Route>
            <Route exact path="/client/stores/:storeId">
              <AsyncComponent
                render={async () => {
                  const storeId = getId();
                  if (!storeId) return <EmptyComponent />;
                  const storeInfo = await snapbuyApi.store.get(storeId);
                  return (
                    <span className="max-md:text-xl md:text-2xl capitalize">
                      {storeInfo?.name || "Store"}
                    </span>
                  );
                }}
              />
            </Route>
            <Route path="/client/stores/:storeId/products">
              <AsyncComponent
                render={async () => {
                  const storeId = location.pathname.split("/").at(-2);
                  if (!storeId) return <EmptyComponent />;
                  const storeInfo = await snapbuyApi.store.get(storeId);
                  return (
                    <span className="max-md:text-xl md:text-2xl capitalize">
                      {storeInfo?.name || "Store"}
                    </span>
                  );
                }}
              />
            </Route>
            <Route path="*">
              <span className="max-md:text-xl md:text-2xl capitalize">
                {id && <Translate content={id} />}
              </span>
            </Route>
          </Switch>
        </div>
        <div className="flex items-center">
          {loadingText.get && (
            <span className="max-md:hidden md:inline-flex items-center gap-2 bg-[--biqpod-primary] p-2 rounded-lg text-[--biqpod-primary-content] text-sm text-nowrap">
              <Icon icon={allIcons.solid.faBox} />
              <span>{loadingText.get}</span>
            </span>
          )}
          <div className="max-md:hidden flex items-center gap-x-4">
            <DarkLightIcon />
          </div>
          <div className="flex">
            <div className="relative">
              <CircleTip
                className={tw(orders?.length && "bg-[--biqpod-gray-opacity]")}
                onClick={({ clientX, clientY }) => {
                  openMenu({
                    x: clientX,
                    y: clientY,
                    menu: mergeArray<OpenMenuProps["menu"][number]>(
                      {
                        defaultIcon: allIcons.solid.faHome,
                        label: "Home",
                        click() {
                          hist.push("/home");
                        },
                      },
                      {
                        defaultIcon: allIcons.solid.faUser,
                        label: "Profile",
                        click() {
                          hist.push("/profile");
                        },
                      },
                      storeId &&
                        usedBy === "owned" && {
                          label: "Plans",
                          click() {
                            hist.push(
                              "/" + ["store", storeId, "plans"].join("/")
                            );
                          },
                          defaultIcon: allIcons.solid.faMoneyBill,
                        },
                      user &&
                        storeId &&
                        usedBy !== "read" &&
                        usedBy !== null && {
                          defaultIcon: allIcons.solid.faBell,
                          label: "Notification Settings",
                          click() {
                            openNotificationSettings();
                          },
                        },
                      user && {
                        defaultIcon: allIcons.solid.faSignOutAlt,
                        label: "Logout",
                        async click() {
                          const response = await confirm({
                            title: "Logout",
                            message: "Are you sure you want to logout?",
                            type: "warning",
                          });
                          response && cloud.app.auth.signOut();
                        },
                      },
                      {
                        label: "Send Feedback",
                        click() {
                          hist.push("/feedback");
                        },
                        defaultIcon: allIcons.solid.faComment,
                      },
                      isMobile && {
                        type: "separator",
                      },
                      isMobile && {
                        label: "Dark / Light",
                        checked: !!isDark,
                        click() {
                          setSettingValue("window/dark.boolean", !isDark);
                        },
                      },
                      {
                        label: "Choos Language",
                        click() {
                          showSetting("window/lang.enum");
                        },
                        defaultIcon: allIcons.solid.faEarth,
                      },
                      orders?.length && {
                        type: "separator",
                      },
                      orders?.length && {
                        label: "Will Deleted",
                        defaultIcon: allIcons.solid.faClock,
                        click() {
                          showPopup(
                            <Card className="max-h-[400px] overflow-hidden">
                              <CardHeaderForPopup title="will deleted" />
                              <Line />
                              <Scroll>
                                {orders.map((order) => {
                                  return (
                                    <div key={order.data.id} className="p-3">
                                      <span>
                                        {order.data.client?.firstname}{" "}
                                        {order.data.client?.lastname}
                                      </span>
                                      <Key>{order.resetDays}</Key>
                                    </div>
                                  );
                                })}
                              </Scroll>
                              <Line />
                              <div className="p-3">
                                <Button
                                  onClick={async ({ currentTarget }) => {
                                    const { x, y } =
                                      currentTarget.getBoundingClientRect();
                                    openMenu({
                                      x,
                                      y,
                                      menu: [
                                        {
                                          label: "Drive",
                                          defaultIcon:
                                            allIcons.brands.faGoogleDrive,
                                          click() {},
                                        },
                                        {
                                          label: "Microsoft Cloud",
                                          defaultIcon:
                                            allIcons.brands.faMicrosoft,
                                          click() {},
                                        },
                                        {
                                          label: "Localy",
                                          defaultIcon: allIcons.solid.faFile,
                                          click: async () => {},
                                        },
                                      ],
                                    });
                                  }}
                                >
                                  <Translate content="save" />
                                </Button>
                              </div>
                            </Card>
                          );
                        },
                      }
                    ),
                  });
                }}
                icon={allIcons.solid.faEllipsisV}
              />
            </div>
          </div>
          <CircleTip
            icon={allIcons.solid.faBell}
            onClick={() => {
              showPopup(<Notifications />);
            }}
          />
          {user?.uid && (
            <div className="relative">
              <UserAvatar
                user={user}
                subscribed={!loadingText.get && subed?.isSubscribed}
                className="relative cursor-pointer"
                onClick={() => {
                  showProfile();
                }}
              />
              {loadingText.get && (
                <div className="absolute inset-[-4px] border border-x-transparent border-y-[--biqpod-primary] border-solid rounded-full animate-spin pointer-events-none" />
              )}
            </div>
          )}
        </div>
      </motion.div>
      {isDesktop && <WindowControls />}
    </EmptyComponent>
  );
};
