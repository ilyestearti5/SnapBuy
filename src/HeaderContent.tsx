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
  addNotification,
  closePopup,
  confirm,
  execAction,
  openMenu,
  openNotificationsView,
  setSettingValue,
  setTemp,
  showPopup,
  showProfile,
  showSetting,
  showToast,
  useAction,
  useAsyncMemo,
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
import { OpenMenuProps } from "@biqpod/app/ui/types";
import { Link } from "react-router-dom";
import { useStoreId } from "./utils";
import { initStoreIdSave } from "./utils";
import { AiAssistance } from "./AiAssistance";
import { openNotificationSettings } from "./components/NotificationSettingsExamples";
import { HoverScale } from "./animations/components";
import { motion } from "framer-motion";
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
    async (packInfo: SnapBuy.Pack) => {
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
        await snapbuyApi.updatePack(packInfo.id, {
          ...packInfo,
          storeId,
        });
      } else {
        await snapbuyApi.addPack({
          ...packInfo,
          storeId,
        });
      }
      loadingText.set("");
      addNotification({
        title: "Pack Added",
        desc: `Pack ${packInfo.name} has been added successfully.`,
        type: "info",
      });
      openNotificationsView();
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
      loadingText.set("Adding News products...");
      loadingPercent.set(0);
      await snapbuyApi.upsertProducts(storeId, newList, (product, index) => {
        loadingText.set(
          `Adding ${product.name?.slice(0, 10)} ${index + 1}/${
            newList.length
          } ...`
        );
        loadingPercent.set(Math.round(((index + 1) / newList.length) * 100));
      });
      loadingText.set("Adding Exists products...");
      loadingPercent.set(0);
      await snapbuyApi.upsertProducts(storeId, existsList, (product, index) => {
        loadingText.set(
          `Updating ${product.name?.slice(0, 10)} ${index + 1}/${
            existsList.length
          } ...`
        );
        loadingPercent.set(Math.round(((index + 1) / existsList.length) * 100));
      });
      loadingText.set("");
      loadingPercent.set(0);
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
        await snapbuyApi.deleteProduct(prodId);
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
                  const packInfo = await snapbuyApi.getPack(id);
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
                  const productInfo = await snapbuyApi.getProduct(id);
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
                  const storeInfo = await snapbuyApi.getCollection(
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
                  const storeInfo = await snapbuyApi.getStore(storeId);
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
                  const storeInfo = await snapbuyApi.getStore(storeId);
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
                {id}
              </span>
            </Route>
          </Switch>
        </div>
        <div className="flex items-center gap-2">
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
                          document.getElementById("home")?.click();
                        },
                      },
                      {
                        label: "Plans",
                        click() {
                          document.getElementById("plans")?.click();
                        },
                        defaultIcon: allIcons.solid.faMoneyBill,
                      },
                      user &&
                        storeId && {
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
                          document.getElementById("feedback")?.click();
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
              {!!orders?.length && (
                <span className="inline-block top-[0] right-[0] absolute bg-[--biqpod-primary] rounded-full w-[12px] h-[12px] pointer-events-none" />
              )}
            </div>
            {user && (
              <div>
                <CircleTip
                  icon={allIcons.solid.faClover}
                  onClick={() => {
                    showPopup(<AiAssistance />);
                    // ai assitance
                  }}
                  iconClassName="text-violet-500"
                />
              </div>
            )}
          </div>
          {user?.uid && (
            <div className="relative rounded-full">
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
      <Link to="/profile" id="home" />
      <Link to="/plans" id="plans" />
      <Link to="/feedbacks" id="feedback" />
    </EmptyComponent>
  );
};
