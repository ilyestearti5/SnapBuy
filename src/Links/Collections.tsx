import {
  Button,
  Card,
  CardHeaderForPopup,
  CircleTip,
  EmptyComponent,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { useStoreId } from "../App";
import { snapbuyApi } from "../apis";
import {
  confirm,
  openMenu,
  showPopup,
  showToast,
  useAsyncMemo,
} from "@biqpod/app/ui/hooks";
import { UpsertCollection } from "./UpsertCollection";
import { allIcons } from "@biqpod/app/ui/apis";
export const Collections = () => {
  const storeId = useStoreId();
  const collections = useAsyncMemo(async () => {
    if (!storeId) return null;
    return snapbuyApi.getCollections(storeId);
  }, [storeId]);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <CardHeaderForPopup title={"Collections"} />
      <Line />
      <Scroll>
        {collections && (
          <EmptyComponent>
            {collections.map((collection) => {
              return (
                <div
                  key={collection.id}
                  className="flex items-center justify-between gap-2 hover:bg-[--biqpod-primary-background] p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <img
                        src={collection.photo}
                        className="border border-[--biqpod-borders] border-solid rounded-xl w-16 h-16 object-cover"
                      />
                      <span className="font-bold absolute top-0 right-0 bg-red-500 text-white w-[18px] pointer-events-none transform translate-x-1/2 z-[1000] -translate-y-1/2 h-[18px] inline-flex items-center justify-center rounded-full text-xs">
                        {collection.products?.length}
                      </span>
                    </div>
                    <span>{collection.name}</span>
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
                                  const collectionUrl = `${baseUrl}/collection/${collection.id}`;
                                  await navigator.clipboard.writeText(
                                    collectionUrl
                                  );
                                  showToast(
                                    "Collection URL copied to clipboard!"
                                  );
                                },
                              },
                              {
                                label: "Preview",
                                defaultIcon: allIcons.solid.faEye,
                                click: () => {
                                  const baseUrl = window.location.origin;
                                  const collectionUrl = `${baseUrl}/collection/${collection.id}`;
                                  const a = document.createElement("a");
                                  a.href = collectionUrl;
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
                                  const response = await confirm({
                                    title: "Delete Collection",
                                    message: `Are you sure you want to delete the collection "${collection.name}"? This action cannot be undone.`,
                                  });
                                  if (!response) return;
                                  await snapbuyApi.deleteCollection(
                                    collection.id
                                  );
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
                          showPopup(
                            <UpsertCollection back collection={collection} />
                          );
                        }}
                        icon={allIcons.solid.faChevronRight}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </EmptyComponent>
        )}
      </Scroll>
      <Line />
      <div className="p-2">
        <Button
          onClick={() => {
            showPopup(<UpsertCollection back />);
          }}
          className="rounded-full"
        >
          <Translate content="create" />
        </Button>
      </div>
    </Card>
  );
};
