import { allIcons, and, where } from "biqpod/ui/apis";
import {
  Card,
  CardWait,
  CircleTip,
  ExcelPopup,
  Field,
  Line,
  Scroll,
} from "biqpod/ui/components";
import {
  execAction,
  getFieldValue,
  getTemp,
  isLoading,
  isSuccess,
  openMenu,
  openPath,
  setTemp,
  showPopup,
  showToast,
  useAction,
  useCopyState,
  useSettingValue,
  useUser,
} from "biqpod/ui/hooks";
import { include, mapAsync, tw } from "biqpod/ui/utils";
import { QRCodeSVG } from "qrcode.react";
import { useEffect } from "react";
import { deleteDoc, getDocs } from "../server";
import { AddClient } from "./AddClient";
import { PopupClient } from "./PopupClient";
import { AccessClient } from "./AccessClient";
export interface RenderQr {
  value: string;
}
export const RenderQr = ({ value }: RenderQr) => {
  const isDark = useSettingValue("window/dark.boolean");
  return (
    <QRCodeSVG
      size={200}
      bgColor="transparent"
      fgColor={isDark ? "#fff" : "#000"}
      value={value}
    />
  );
};
export const Clients = () => {
  const showTools = useCopyState(false);
  const searchClient = getFieldValue("search-client");
  const isFocused = useCopyState(false);
  useEffect(() => {
    return () => {
      isFocused.set(false);
    };
  }, []);
  const user = useUser();
  const clients = useCopyState<SnapBuy.Client[]>([]); // Replace with your actual clients data
  const clientsRecived = getTemp<boolean>("clientsRecived");
  const clientsList = getTemp<SnapBuy.Client[]>("clientsList");
  const action = useAction(
    "get-clients",
    async () => {
      if (!user?.uid) return;
      if (!clientsRecived && clientsList) {
        clients.set(clientsList);
        return;
      }
      const snapshot = await getDocs<SnapBuy.Client>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "clients"],
        {
          where: and(where("uid", "==", user.uid)),
        }
      );
      const clientsData = snapshot?.map((doc) => ({
        ...doc.data,
        id: doc.id,
      }));
      setTemp("clientsList", clientsData);
      setTemp("clientsRecived", true);
      clientsData && clients.set(clientsData);
    },
    [user, clientsRecived]
  );
  const loading = isLoading(action);
  const success = isSuccess(action);
  useEffect(() => {
    execAction("get-clients");
  }, [user]);
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <div
          className={tw(
            "min-w-[30%] transition-[min-width]",
            isFocused.get && "max-md:min-w-[60%]"
          )}
        >
          <Field
            onFocus={() => {
              isFocused.set(true);
            }}
            onBlur={() => {
              isFocused.set(false);
            }}
            inputName="search-client"
            placeholder="Search Client"
            className="rounded-xl"
          />
        </div>
      </div>
      <Line />
      <Scroll>
        {success && (
          <div className="flex flex-wrap gap-2 p-2">
            {clients.get
              .filter((client) => {
                return include(
                  `@name ${client.name} @phone ${client.phone}`,
                  searchClient
                );
              })
              .map((client) => {
                return (
                  <Card
                    key={client.id}
                    className="w-[calc(50%-4px)] max-md:w-full"
                  >
                    <div className="p-2">
                      <span className="text-2xl">{client.name}</span>
                    </div>
                    <Line />
                    <div className="flex justify-between items-center gap-2 p-2">
                      <span>{client.phone}</span>
                      <div className="flex">
                        <CircleTip
                          icon={allIcons.solid.faEllipsisV}
                          onClick={({ clientX, clientY }) => {
                            openMenu({
                              x: clientX,
                              y: clientY,
                              menu: [
                                {
                                  label: "Access Tokens",
                                  defaultIcon: allIcons.solid.faKey,
                                  click() {
                                    showPopup(<AccessClient client={client} />);
                                  },
                                },
                                {
                                  label: "Copy",
                                  defaultIcon: allIcons.regular.faCopy,
                                  async click() {
                                    await navigator.clipboard.writeText(
                                      client.name
                                    );
                                    showToast("Name copied to clipboard");
                                  },
                                },
                                {
                                  type: "separator",
                                },
                                {
                                  label: "Delete",
                                  defaultIcon: allIcons.solid.faTrashCan,
                                  click: async () => {
                                    const mainRef = [
                                      "projects",
                                      import.meta.env.VITE_PROJECT_ID,
                                    ];
                                    await deleteDoc([
                                      mainRef,
                                      "clients",
                                      client.id,
                                    ]);
                                    execAction("get-clients");
                                    const docs =
                                      await getDocs<SnapBuy.AccessToken>(
                                        [mainRef, "client-access"],
                                        {
                                          where: and(
                                            where("clientId", "==", client.id)
                                          ),
                                        }
                                      );
                                    await mapAsync(
                                      docs || [],
                                      async ({ id }) => {
                                        await deleteDoc([
                                          mainRef,
                                          "client-access",
                                          id,
                                        ]);
                                      }
                                    );
                                  },
                                },
                              ],
                            });
                          }}
                        />
                        <CircleTip
                          icon={allIcons.solid.faPhone}
                          iconClassName="text-[--biqpod-primary]"
                          onClick={() => {
                            const anchor = document.createElement("a");
                            anchor.href = `tel:${client.phone}`;
                            anchor.click();
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            <div>
              <div className="h-[80px]" />
            </div>
          </div>
        )}
        {loading && <CardWait className="h-full" />}
      </Scroll>
      <Card
        onClick={() => {
          showTools.set(!showTools.get);
        }}
        className="right-4 bottom-4 absolute flex flex-col items-center p-3 rounded-3xl"
      >
        <CircleTip
          icon={allIcons.regular.faFileExcel}
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            const files = await openPath({
              filters: [
                {
                  name: "*",
                  extensions: ["xlsx", "xls"],
                },
              ],
            });
            const file = files.at(0);
            if (!file) {
              showToast("Please select a file");
              return;
            }
            showPopup(
              <ExcelPopup
                uri={file}
                options={["name", "phone", "id"]}
                onChange={(json) => {
                  showPopup(<PopupClient file={file} clients={json} />);
                }}
                title="Excel File"
              />
            );
          }}
        />
        <CircleTip
          icon={allIcons.solid.faPlus}
          className={tw(
            "transition-[width,height]",
            !showTools.get && "w-[0px] h-[0px]"
          )}
          onClick={async () => {
            showPopup(<AddClient />);
          }}
        />
        <CircleTip
          icon={allIcons.solid.faPlus}
          iconClassName={tw(
            "transition-transform",
            showTools.get ? "rotate-45" : "rotate-0"
          )}
        />
      </Card>
    </div>
  );
};
