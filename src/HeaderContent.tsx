import { allIcons } from "biqpod/ui/apis";
import { isDesktop } from "biqpod/ui/app";
import {
  Button,
  CircleTip,
  DarkLightIcon,
  EmptyComponent,
  Icon,
  Image,
  Translate,
  WindowControls,
} from "biqpod/ui/components";
import {
  execAction,
  getTemp,
  openMenu,
  setSettingValue,
  showProfile,
  useAction,
  useCopyState,
  useDeviceResolution,
  useSettingValue,
  useUser,
} from "biqpod/ui/hooks";
import { auth, cloud } from "./server";
import { useHistory, useLocation } from "react-router";
import { api, useCurrentClient } from "./apis";
import { useMemo } from "react";
import { mergeArray } from "biqpod/ui/utils";
import { OpenMenuProps } from "biqpod/ui/types";
import { Link } from "react-router-dom";
export const HeaderContent = () => {
  const selectedTab = getTemp<Tab>("selectedTab");
  const user = useUser();
  const isDark = useSettingValue("window/dark.boolean");
  const clientAddText = useCopyState("");
  useAction(
    "add-clients",
    async ({ exists = [], news = [] }: AddClientActionProps) => {
      clientAddText.set("Adding News clients...");
      await api.upsertClients(news, (client, index) => {
        clientAddText.set(
          `Adding ${client.name?.slice(0, 10)} ${index + 1}/${news.length} ...`
        );
      });
      clientAddText.set("Adding Exists clients...");
      await api.upsertClients(exists, async (client, index) => {
        clientAddText.set(
          `Adding ${client.name?.slice(0, 10)} ${index + 1}/${
            exists.length
          } ...`
        );
      });
      clientAddText.set("");
      execAction("get-clients");
    },
    []
  );
  const productAddText = useCopyState("");
  const loc = useLocation();
  const isClientTab = useMemo(() => {
    return loc?.pathname?.startsWith("/client");
  }, [loc]);
  useAction(
    "add-products",
    async ({ exists = [], news = [] }: AddProductActionProps) => {
      productAddText.set("Adding News products...");
      await api.upsertProducts(news, (product, index) => {
        productAddText.set(
          `Adding ${product.name?.slice(0, 10)} ${index + 1}/${news.length} ...`
        );
      });
      productAddText.set("Adding Exists products...");
      await api.upsertProducts(exists, (product, index) => {
        productAddText.set(
          `Adding ${product.name?.slice(0, 10)} ${index + 1}/${news.length} ...`
        );
      });
      productAddText.set("");
      execAction("get-products");
    },
    []
  );
  const hist = useHistory();
  const currentClient = useCurrentClient();
  return (
    <EmptyComponent>
      <div className="flex justify-between items-center px-4 w-full">
        <div className="flex items-center gap-x-1">
          {!!hist.length && (
            <CircleTip
              icon={allIcons.solid.faChevronLeft}
              onClick={() => {
                hist.goBack();
              }}
            />
          )}
          {isClientTab && (
            <EmptyComponent>
              <h1 className="max-md:text-xl text-3xl capitalize">
                Hi, {currentClient?.client?.name}
              </h1>
            </EmptyComponent>
          )}
          {selectedTab && (
            <EmptyComponent>
              <Icon iconClassName="text-2xl" icon={selectedTab?.icon} />
              <h1 className="max-md:text-xl text-3xl capitalize">
                {selectedTab?.name}
              </h1>
            </EmptyComponent>
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
          {clientAddText.get && (
            <span className="inline-flex items-center gap-2 bg-[--biqpod-primary] p-2 rounded-lg text-[--biqpod-primary-content] text-sm text-nowrap">
              <Icon icon={allIcons.solid.faUser} />
              <span>{clientAddText.get}</span>
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
            <Image
              src={user.photo || undefined}
              className="w-[35px] h-[35px] cursor-pointer"
              onClick={() => {
                showProfile();
              }}
            />
          )}
        </div>
      </div>
      {isDesktop && <WindowControls />}
      <Link to="/profile" id="home" />
    </EmptyComponent>
  );
};
