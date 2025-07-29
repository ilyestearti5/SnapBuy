import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardHeaderForPopup,
  CardWait,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  openMenu,
  showPopup,
  confirm,
  showToast,
  useAction,
  useCopyState,
  execAction,
  useUser,
  isLoading,
  isSuccess,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../App";
import { UpsertPack } from "./UpsertPack";
import { useEffect } from "react";
import { range } from "@biqpod/app/ui/utils";
export const Packs = () => {
  const storeId = useStoreId();
  const packs = useCopyState<SnapBuy.Pack[]>([]);
  const fetchingAction = useAction(
    "fetch-packs",
    async () => {
      if (!storeId) return null;
      const list = await snapbuyApi.getPacks(storeId);
      packs.set(list);
    },
    [storeId]
  );
  const user = useUser();
  const fetchingActionSuccess = isSuccess(fetchingAction);
  const fetchingActionLoading = isLoading(fetchingAction);
  const deleteAction = useAction(
    "delete-pack",
    async ({ packId }: { packId: string }) => {
      const response = await confirm({
        title: "Delete Pack",
        message: "Are you sure you want to delete this pack?",
      });
      if (!response) return;
      await snapbuyApi.deletePack(packId);
      execAction("fetch-packs");
    },
    [storeId, user]
  );
  const loading = isLoading(deleteAction);
  useEffect(() => {
    execAction("fetch-packs");
  }, [storeId]);
  return (
    <Card className="relative max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <CardHeaderForPopup title={"Packs"} />
      <Line />
      <Scroll>
        {fetchingActionSuccess && (
          <EmptyComponent>
            {packs.get.map((pack) => {
              return (
                <div
                  key={pack.id}
                  className="flex items-center justify-between gap-2 hover:bg-[--biqpod-gray-opacity] odd:bg-[--biqpod-primary-background] p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="font-bold bg-red-500 text-white w-[18px] pointer-events-none h-[18px] inline-flex items-center justify-center rounded-full text-xs">
                        {pack.products?.length}
                      </span>
                      <span>{pack.name}</span>
                    </div>
                  </div>
                  <div className="flex">
                    <div>
                      <CircleTip
                        onClick={({ clientX, clientY }) => {
                          openMenu({
                            x: clientX,
                            y: clientY,
                            menu: [
                              {
                                label: "Copy",
                                defaultIcon: allIcons.regular.faCopy,
                                click: async () => {
                                  const baseUrl = window.location.origin;
                                  const packUrl = `${baseUrl}/pack/${pack.id}`;
                                  await navigator.clipboard.writeText(packUrl);
                                  showToast("Pack URL copied to clipboard");
                                },
                              },
                              {
                                label: "Preview",
                                defaultIcon: allIcons.solid.faEye,
                                click: () => {
                                  const baseUrl = window.location.origin;
                                  const packUrl = `${baseUrl}/pack/${pack.id}`;
                                  const a = document.createElement("a");
                                  a.href = packUrl;
                                  a.target = "_blank";
                                  a.click();
                                },
                              },
                              {
                                type: "separator",
                              },
                              {
                                label: "Delete",
                                click: async () => {
                                  execAction("delete-pack", {
                                    packId: pack.id,
                                  });
                                },
                                defaultIcon: allIcons.solid.faTrash,
                              },
                            ],
                          });
                        }}
                        icon={allIcons.solid.faEllipsisVertical}
                      />
                    </div>
                    <div>
                      <CircleTip
                        onClick={() => {
                          showPopup(<UpsertPack back pack={pack} />);
                        }}
                        icon={allIcons.solid.faChevronRight}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {packs.get.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <img
                  draggable={false}
                  src={
                    "https://cdn3d.iconscout.com/3d/premium/thumb/file-not-found-3d-icon-download-in-png-blend-fbx-gltf-formats--folder-no-results-document-data-empty-state-pack-miscellaneous-icons-5980396.png"
                  }
                />
              </div>
            )}
          </EmptyComponent>
        )}
        {fetchingActionLoading &&
          range(5).map((number) => {
            return (
              <div key={number} className="p-2">
                <CardWait className="w-full h-[50px] flex items-center justify-center rounded-2xl" />
              </div>
            );
          })}
      </Scroll>
      <Line />
      <div className="p-2">
        <Button
          onClick={() => {
            showPopup(<UpsertPack back />);
          }}
          className="rounded-full"
        >
          <Translate content="create" />
        </Button>
      </div>
      {loading && (
        <div className="absolute inset-0 bg-[--biqpod-gray-opacity-2] flex items-center justify-center">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
