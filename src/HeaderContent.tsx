import { allIcons } from "@biqpod/app/ui/apis";
import { isDesktop } from "@biqpod/app/ui/app";
import {
  Anchor,
  AsyncComponent,
  CardWait,
  CircleTip,
  DarkLightIcon,
  EmptyComponent,
  Icon,
  Image,
  JoinComponentBy,
  Translate,
  WindowControls,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getTemp,
  openMenu,
  setSettingValue,
  setTemp,
  showProfile,
  useAction,
  useAsyncMemo,
  useCopyState,
  useSettingValue,
  useUser,
} from "@biqpod/app/ui/hooks";
import { cloud, getDoc } from "./server";
import { useHistory, useLocation } from "react-router";
import { api } from "./apis";
import { useEffect, useMemo } from "react";
import { delay, mergeArray, tw } from "@biqpod/app/ui/utils";
import { Biqpod, OpenMenuProps } from "@biqpod/app/ui/types";
import { Link } from "react-router-dom";
export const useIsSubed = () => {
  return getTemp<boolean>("is-subed");
};
export const HeaderContent = () => {
  const user = useUser();
  const isDark = useSettingValue("window/dark.boolean");
  const productAddText = useCopyState("");
  const loc = useLocation();
  useAction(
    "add-products",
    async ({ exists = [], news = [] }: AddProductActionProps) => {
      console.log({ exists, news });
      closePopup();
      productAddText.set("Adding News products...");
      await api.upsertProducts(news, (product, index) => {
        productAddText.set(
          `Adding ${product.name?.slice(0, 10)} ${index + 1}/${news.length} ...`
        );
      });
      productAddText.set("Adding Exists products...");
      await api.upsertProducts(exists, (product, index) => {
        productAddText.set(
          `Adding ${product.name?.slice(0, 10)} ${index + 1}/${
            exists.length
          } ...`
        );
      });
      productAddText.set("");
      execAction("fetch-products");
    },
    []
  );
  const hist = useHistory();
  const selectedTab = useMemo(() => {
    const pathname = loc.pathname.split("/").filter(Boolean);
    const pathName = pathname.at(-1);
    return pathName;
  }, [loc.pathname]);
  const isUser = useMemo(() => {
    const pathname = loc.pathname.split("/").filter(Boolean);
    const pathName = pathname.at(-2);
    if (pathName === "stores") {
      return true;
    }
    return false;
  }, [loc.pathname]);
  const isProduct = useMemo(() => {
    return loc.pathname.startsWith("/product");
  }, [loc.pathname]);

  const isSubed = useAsyncMemo(() => {
    return api.isSubscribed();
  }, [user]);

  useEffect(() => {
    setTemp("is-subed", isSubed);
  }, [isSubed]);

  return (
    <EmptyComponent>
      <div className="flex justify-between items-center px-4 w-full">
        <div className="flex items-center gap-x-1">
          <CircleTip
            icon={allIcons.solid.faChevronLeft}
            onClick={() => {
              hist.goBack();
            }}
          />
          {selectedTab && (
            <span className="max-md:text-xl md:text-2xl capitalize">
              {isUser && (
                <AsyncComponent
                  deps={[selectedTab]}
                  render={async () => {
                    await delay(1000);
                    var user = await getDoc<Biqpod.Account.User>([
                      "users",
                      selectedTab,
                    ]);
                    return (
                      <EmptyComponent>
                        <Translate content="store of" /> {user?.firstname}{" "}
                        {user?.lastname}
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
                    var user = await getDoc<SnapBuy.Product>([
                      "projects",
                      import.meta.env.VITE_PROJECT_ID,
                      "products",
                      selectedTab,
                    ]);
                    return <EmptyComponent>{user?.name}</EmptyComponent>;
                  }}
                  loading={
                    <CardWait className="rounded-lg w-[150px] h-[30px]" />
                  }
                />
              )}
              {!isProduct && !isUser && <Translate content={selectedTab} />}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="max-md:hidden flex items-center gap-x-4">
            <DarkLightIcon />
          </div>
          {productAddText.get && (
            <span className="inline-flex items-center gap-2 bg-[--biqpod-primary] p-2 rounded-lg text-[--biqpod-primary-content] text-sm text-nowrap">
              <Icon icon={allIcons.solid.faBox} />
              <span>{productAddText.get}</span>
            </span>
          )}
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
                    {
                      defaultIcon: allIcons.solid.faSignOutAlt,
                      label: "Logout",
                      click() {
                        cloud.app.auth.signOut();
                      },
                    },
                    {
                      type: "separator",
                    },
                    {
                      label: "Dark Mode",
                      checked: !!isDark,
                      click() {
                        setSettingValue("window/dark.boolean", !isDark);
                      },
                    }
                  ),
                });
              }}
              icon={allIcons.solid.faEllipsisV}
            />
          </div>
          {user?.uid && (
            <div
              onClick={() => {
                showProfile();
              }}
              className={tw(
                "relative rounded-full w-[35px] h-[35px] overflow-hidden cursor-pointer",
                isSubed && "outline-4 outline-offset-0 outline-red-500"
              )}
            >
              <Image
                src={user.photo || undefined}
                className="w-[35px] h-[35px]"
              />
            </div>
          )}
        </div>
      </div>
      {isDesktop && <WindowControls />}
      <Link to="/profile" id="home" />
      <Link to="/plans" id="plans" />
    </EmptyComponent>
  );
};
