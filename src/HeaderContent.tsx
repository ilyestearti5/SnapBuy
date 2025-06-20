import { allIcons } from "@biqpod/app/ui/apis";
import { isDesktop } from "@biqpod/app/ui/app";
import {
  AsyncComponent,
  CardWait,
  CircleTip,
  DarkLightIcon,
  EmptyComponent,
  Icon,
  Image,
  Translate,
  UserAvatar,
  WindowControls,
} from "@biqpod/app/ui/components";
import {
  addNotification,
  closePopup,
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
import { cloud, getDoc } from "./server";
import { useHistory, useLocation } from "react-router";
import { snapbuyApi } from "./apis";
import { useEffect, useMemo } from "react";
import { delay, mapAsync, mergeArray } from "@biqpod/app/ui/utils";
import { OpenMenuProps } from "@biqpod/app/ui/types";
import { Link } from "react-router-dom";
import { useStoreId } from "./App";
import { initStoreIdSave } from "./utils";
import { AiAssistance } from "./AiAssistance";
export const HeaderContent = () => {
  initStoreIdSave();
  const user = useUser();
  const isDark = useSettingValue("window/dark.boolean");
  const loadingPercent = useTemp<number>("loading-percent");
  const loadingText = useTemp<string>("loading-text");
  const loc = useLocation();
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
  const { selectedTab, isUser, isPack, isProduct } = useMemo(() => {
    const pathname = loc.pathname.split("/").filter(Boolean);
    return {
      selectedTab: pathname.at(-1),
      isUser: pathname.at(-2) === "stores",
      isProduct: pathname.at(-2) === "product",
      isPack: pathname.at(-2) === "packs",
    };
  }, [loc.pathname]);
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
  return (
    <EmptyComponent>
      <div className="flex justify-between items-center px-4 w-full">
        <div className="flex items-center gap-x-1">
          <div>
            <CircleTip
              icon={allIcons.solid.faChevronLeft}
              onClick={() => {
                hist.goBack();
              }}
            />
          </div>
          {selectedTab && (
            <span className="max-md:text-xl md:text-2xl capitalize">
              {isUser && (
                <AsyncComponent
                  deps={[selectedTab]}
                  render={async () => {
                    await delay(1000);
                    const store = await getDoc<SnapBuy.Store>([
                      "projects",
                      import.meta.env.VITE_PROJECT_ID,
                      "stores",
                      selectedTab,
                    ]);
                    return (
                      <EmptyComponent>
                        {store?.name} <Translate content="store" />
                      </EmptyComponent>
                    );
                  }}
                  loading={
                    <CardWait className="rounded-lg w-[150px] h-[30px]" />
                  }
                />
              )}
              {isProduct && (
                <AsyncComponent
                  deps={[selectedTab]}
                  render={async () => {
                    await delay(1000);
                    const product = await getDoc<SnapBuy.Product>([
                      "projects",
                      import.meta.env.VITE_PROJECT_ID,
                      "products",
                      selectedTab,
                    ]);
                    const store =
                      product?.storeId &&
                      (await getDoc<SnapBuy.Store>([
                        "projects",
                        import.meta.env.VITE_PROJECT_ID,
                        "stores",
                        product?.storeId,
                      ]));
                    return (
                      <span className="flex items-center gap-2">
                        {store && store.photo && (
                          <div>
                            <Image
                              className="w-[40px] h-[40px]"
                              src={store.photo}
                            />
                          </div>
                        )}
                        <span className="max-md:text-sm">{product?.name}</span>
                      </span>
                    );
                  }}
                  loading={
                    <div className="flex items-center gap-2">
                      <CardWait className="flex-shrink-0 rounded-full w-[40px] h-[40px]" />
                      <CardWait className="rounded-lg w-[150px] h-[30px]" />
                    </div>
                  }
                />
              )}
              {isPack && (
                <AsyncComponent
                  deps={[selectedTab]}
                  render={async () => {
                    await delay(1000);
                    var pack = await getDoc<SnapBuy.Pack>([
                      "projects",
                      import.meta.env.VITE_PROJECT_ID,
                      "packs",
                      selectedTab,
                    ]);
                    const store =
                      pack?.storeId &&
                      (await getDoc<SnapBuy.Store>([
                        "projects",
                        import.meta.env.VITE_PROJECT_ID,
                        "stores",
                        pack?.storeId,
                      ]));
                    return (
                      <span className="flex items-center gap-2">
                        {store && store.photo && (
                          <div>
                            <Image
                              className="w-[40px] h-[40px]"
                              src={store.photo}
                            />
                          </div>
                        )}
                        <span className="max-md:text-sm">
                          {store && store.name && `${store.name} / `}{" "}
                          {pack?.name}
                        </span>
                      </span>
                    );
                  }}
                  loading={
                    <div className="flex items-center gap-2">
                      <CardWait className="flex-shrink-0 rounded-full w-[40px] h-[40px]" />
                      <CardWait className="rounded-lg w-[150px] h-[30px]" />
                    </div>
                  }
                />
              )}
              {!isProduct && !isPack && !isUser && (
                <Translate content={selectedTab} />
              )}
            </span>
          )}
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
            <div>
              <CircleTip
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
                      user && {
                        defaultIcon: allIcons.solid.faSignOutAlt,
                        label: "Logout",
                        click() {
                          cloud.app.auth.signOut();
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
                      }
                    ),
                  });
                }}
                icon={allIcons.solid.faEllipsisV}
              />
            </div>
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
                <div className="absolute inset-[-4px] border-[--biqpod-primary] border-x border-y-0 border-solid rounded-full animate-spin pointer-events-none" />
              )}
            </div>
          )}
        </div>
      </div>
      {isDesktop && <WindowControls />}
      <Link to="/profile" id="home" />
      <Link to="/plans" id="plans" />
      <Link to="/feedbacks" id="feedback" />
    </EmptyComponent>
  );
};
