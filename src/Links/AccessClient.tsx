import { and, where, allIcons } from "biqpod/ui/apis";
import {
  Card,
  Translate,
  CircleTip,
  Line,
  Scroll,
  CircleLoading,
  Button,
  Anchor,
  Icon,
} from "biqpod/ui/components";
import {
  useUser,
  useCopyState,
  closePopup,
  showPopup,
  showToast,
  openMenu,
  confirm,
  useColorMerge,
} from "biqpod/ui/hooks";
import { OpenMenuProps } from "biqpod/ui/types";
import { tw } from "biqpod/ui/utils";
import { useEffect } from "react";
import { onCollectionSnapshot, setDoc, deleteDoc } from "../server";
import { RenderQr } from "./Clients";
import { api } from "../apis";
export interface AccessClientProps {
  client: SnapBuy.Client;
}
export const AccessClient = ({ client }: AccessClientProps) => {
  const user = useUser();
  const accessTokenDoc = useCopyState<SnapBuy.AccessToken[] | null>(null);
  useEffect(() => {
    if (user?.uid && client.id)
      return onCollectionSnapshot<SnapBuy.AccessToken>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "client-access"],
        (doc) => {
          accessTokenDoc.set(doc.map(({ data, id }) => ({ ...data, id })));
        },
        {
          where: and(where("clientId", "==", client.id)),
        }
      );
  }, [user]);
  const addToken = async () => {
    if (!user?.uid) {
      return;
    }
    const value = crypto.randomUUID();
    const id = crypto.randomUUID();
    await setDoc(
      ["projects", import.meta.env.VITE_PROJECT_ID, "client-access", id],
      {
        usedBy: null,
        clientId: client.id,
        uid: user.uid,
        value,
        id,
      }
    );
  };
  const loading = useCopyState(false);
  const colorMerge = useColorMerge();
  return (
    <Card className="relative max-md:rounded-none max-md:w-full max-md:h-full overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-2">
        <h1 className="text-3xl capitalize">
          {client.name} <Translate content="tokens" />
        </h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      <Scroll>
        {!accessTokenDoc.get && (
          <div className="flex justify-center items-center p-5 h-full">
            <CircleLoading />
          </div>
        )}
        {accessTokenDoc.get &&
          accessTokenDoc.get.map(({ id, value, usedBy }, index) => {
            const tools: OpenMenuProps["menu"] = [
              {
                defaultIcon: allIcons.solid.faKey,
                label: "Generate URL",
                click: async () => {
                  loading.set(true);
                  const url = await api.generateClientAuth(id);
                  if (!url) {
                    showToast("NO URL GENERATED");
                    return;
                  }
                  closePopup();
                  showPopup(
                    <Card className="max-md:w-4/5 md:w-1/2">
                      <div className="flex justify-between items-center gap-2 p-3">
                        <div className="flex items-center gap-2">
                          <CircleTip
                            icon={allIcons.solid.faChevronLeft}
                            onClick={() => {
                              closePopup();
                              showPopup(<AccessClient client={client} />);
                            }}
                          />
                          <h1 className="text-3xl">
                            <Translate content="Scan It" />
                          </h1>
                        </div>
                        <CircleTip
                          icon={allIcons.solid.faXmark}
                          onClick={() => {
                            closePopup();
                          }}
                        />
                      </div>
                      <Line />
                      <div className="flex justify-center items-center p-3">
                        <RenderQr value={url} />
                      </div>
                      <Line />
                      <div className="flex gap-2 p-3">
                        <Button
                          style={{
                            ...colorMerge("gray.opacity", {
                              color: "text.color",
                            }),
                          }}
                          icon={allIcons.regular.faCopy}
                          onClick={() => {
                            navigator.clipboard.writeText(url);
                            showToast("Access Token copied to clipboard");
                          }}
                        >
                          <Translate content="copy" />
                        </Button>
                        <Button
                          icon={allIcons.solid.faShareNodes}
                          onClick={() => {
                            navigator.share({
                              title: "Client QR Code",
                              url,
                            });
                          }}
                        >
                          <Translate content="share" />
                        </Button>
                      </div>
                    </Card>
                  );
                  loading.set(false);
                },
              },
              {
                // restore access key
                defaultIcon: allIcons.solid.faRotate,
                label: "Restore Access Key",
                click: async () => {
                  const yeap = await confirm({
                    title: "Restore Access Token",
                    message: "are you sure want to restore token",
                    type: "warning",
                  });
                  if (!yeap) {
                    showToast("Ignore", "info");
                    return;
                  }
                  const newValue = crypto.randomUUID();
                  await setDoc(
                    [
                      "projects",
                      import.meta.env.VITE_PROJECT_ID,
                      "client-access",
                      id,
                    ],
                    {
                      usedBy: null,
                      value: newValue,
                      uid: user?.uid!,
                    }
                  );
                },
              },
              {
                type: "separator",
              },
              {
                defaultIcon: allIcons.regular.faCopy,
                label: "Copy",
                click: async () => {
                  await navigator.clipboard.writeText(value);
                  showToast("Access Token copied to clipboard");
                },
              },
              {
                defaultIcon: allIcons.solid.faXmark,
                label: "Delete",
                click: async () => {
                  if (user?.uid) {
                    await deleteDoc([
                      "projects",
                      import.meta.env.VITE_PROJECT_ID,
                      "client-access",
                      id,
                    ]);
                  }
                },
              },
            ];
            return (
              <div
                key={index}
                className="flex justify-between items-center gap-2 odd:bg-[--biqpod-primary-background]"
              >
                <div className="flex items-center gap-2 p-2">
                  <div>
                    <div
                      className={tw(
                        "bg-[--biqpod-gray-opacity] rounded-full w-[20px] h-[20px]",
                        usedBy && "bg-[--biqpod-success]"
                      )}
                    />
                  </div>
                  <div>
                    <span className="bg-[--biqpod-gray-opacity] ml-2 px-2 border border-[--biqpod-borders] border-solid rounded-full">
                      <Anchor
                        onClick={async () => {
                          // copy
                          await navigator.clipboard.writeText(value);
                          showToast("Access Token copied to clipboard");
                        }}
                      >
                        {value}
                      </Anchor>
                    </span>
                  </div>
                </div>
                <div className="max-md:hidden flex p-2">
                  {tools
                    .filter(({ type }) => type !== "separator")
                    .map(({ defaultIcon, click }, index) => {
                      return (
                        <CircleTip
                          key={index}
                          icon={defaultIcon}
                          onClick={async () => {
                            await click?.();
                          }}
                        />
                      );
                    })}
                </div>
                <div className="hidden max-md:flex p-2">
                  <CircleTip
                    icon={allIcons.solid.faEllipsisV}
                    onClick={({ clientX, clientY }) => {
                      openMenu({
                        x: clientX,
                        y: clientY,
                        menu: tools,
                      });
                    }}
                  />
                </div>
              </div>
            );
          })}
        {accessTokenDoc.get && accessTokenDoc.get.length === 0 && (
          <div className="flex flex-col justify-center items-center gap-5 p-5 h-full capitalize">
            <Icon iconClassName="text-8xl" icon={allIcons.solid.faKey} />
            <Translate content="no access tokens!" />
          </div>
        )}
      </Scroll>
      <Line />
      <div className="p-2">
        <Button
          onClick={async () => {
            const response = await confirm({
              title: "Add Access Token",
              message: "Are you sure want to add access token?",
              type: "warning",
            });
            response && addToken();
          }}
          icon={allIcons.solid.faPlus}
        >
          <Translate content={"add access token"} />
        </Button>
      </div>
      {loading.get && (
        <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
