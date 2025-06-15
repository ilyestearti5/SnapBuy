import { allIcons } from "@biqpod/app/ui/apis";
import {
  Anchor,
  Button,
  Card,
  CardWait,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Icon,
  Image,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  getTemp,
  isLoading,
  openMenu,
  setFieldValue,
  setTemp,
  showBottomSheet,
  showPopup,
  showToast,
  useAction,
  useCopyState,
  useUser,
} from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { snapbuyApi } from "./apis";
import { delay, range } from "@biqpod/app/ui/utils";
import notFoundPhoto from "./assets/nothing.png";
import { Link } from "react-router-dom";
import { UpsertStore } from "./EditStoreBottomSheet";
import { useStoreId } from "./App";
import { isMobile } from "@biqpod/app/ui/app";
import { motion } from "framer-motion";
import { CopyStoreLinkBottomSheet } from "./CopyStoreLinkBottomSheet";
export const Stores = () => {
  const storeId = useStoreId();
  const storesState = useCopyState<SnapBuy.Store[]>([]);
  const action = useAction(
    "print-stores",
    async () => {
      const stores = await snapbuyApi.getStores();
      storesState.set(stores);
    },
    []
  );
  const storeName = getFieldValue("store-name");
  const storePhone = getFieldValue("store-phone");
  const storePhoto = getTemp<string>("store-photo");
  const deliveryPrice = getTemp<number | null | undefined>(
    "store-delivery-price"
  );
  useAction(
    "upsert-store",
    async (id?: string) => {
      if (!storeName) {
        showToast("Please enter store name", "error");
        return;
      }
      if (!storePhone) {
        showToast("Please enter store phone", "error");
        return;
      }
      const store: SnapBuy.Store = {
        name: storeName,
        phone: storePhone,
        id: id || Date.now().toString(),
        photo: storePhoto || undefined,
        deliveryPrice: deliveryPrice || undefined,
      };
      if (storePhoto) {
        store.photo = storePhoto;
      }
      if (typeof deliveryPrice == "number") {
        store.deliveryPrice = deliveryPrice;
      }
      await delay(1000);
      if (id) {
        await snapbuyApi.updateStore(id, store);
        showToast("Store updated successfully", "success");
      } else {
        await snapbuyApi.addStore(store);
        showToast("Store added successfully", "success");
      }
      closePopup();
      setFieldValue("store-name", "");
      setFieldValue("store-phone", "");
      setTemp("store-photo", null);
      setTemp("store-delivery-price", null);
      execAction("print-stores");
    },
    [storeName, storePhone, storePhoto, deliveryPrice]
  );
  const actionLoading = isLoading(action);
  const user = useUser();
  useEffect(() => {
    if (user) {
      execAction("print-stores");
    }
  }, [user]);
  useAction(
    "delete-store",
    async (storeId: string) => {
      setTemp("deletion-store", storeId);
      await snapbuyApi.deleteStore(storeId);
      showToast("Store deleted successfully", "success");
      setTemp("deletion-store", null);
      execAction("print-stores");
    },
    []
  );
  const deletionStore = getTemp<string>("deletion-store");
  return (
    <Scroll>
      <div className="flex flex-wrap items-center gap-2 p-2">
        {!actionLoading && (
          <EmptyComponent>
            {storesState.get.map((store, idx) => {
              const linkId = `store-${store.id}`;
              const choosed = storeId === store.id;
              return (
                <motion.div
                  key={store.id}
                  initial={
                    isMobile
                      ? { opacity: 0, y: 40 }
                      : { opacity: 0, scale: 0.95 }
                  }
                  animate={
                    isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1 }
                  }
                  transition={{
                    duration: 0.3,
                    delay: idx * 0.05,
                  }}
                  className="max-md:w-full md:min-w-[400px]"
                >
                  <Card className="relative w-full overflow-hidden">
                    <div className="flex justify-between items-center gap-4 p-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <Image
                            className="bg-[--biqpod-gray-opacity] rounded-xl w-[60px] h-[60px]"
                            src={store.photo}
                            alt={
                              <div className="flex justify-center items-center">
                                <Icon
                                  icon={allIcons.solid.faStore}
                                  iconClassName="text-2xl"
                                />
                              </div>
                            }
                          />
                        </div>
                        <div>
                          <p className="font-bold max-md:text-base md:text-lg text-wrap">
                            {store.name}
                          </p>
                          <p className="max-md:text-xs">
                            <Anchor href={`tel:${store.phone}`}>
                              {store.phone}
                            </Anchor>
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-center items-center">
                        <CircleTip
                          icon={allIcons.solid.faChevronRight}
                          onClick={async () => {
                            if (choosed) {
                              showToast(
                                "You are already in this store",
                                "info",
                                {
                                  id: "already-in-store",
                                }
                              );
                              return;
                            }
                            if (storeId) {
                              const response = await confirm({
                                message:
                                  "Are you sure you want to switch store?",
                                title: "Switch Store",
                              });
                              if (!response) return;
                            }
                            document.getElementById(linkId)?.click();
                          }}
                          className="text-2xl"
                          iconClassName="text-2xl"
                        />
                        <CircleTip
                          icon={allIcons.solid.faEllipsisVertical}
                          onClick={({ clientX, clientY }) => {
                            openMenu({
                              x: clientX,
                              y: clientY,
                              menu: [
                                {
                                  label: "Copy Link",
                                  defaultIcon: allIcons.solid.faLink,
                                  click: async () => {
                                    showBottomSheet(
                                      <CopyStoreLinkBottomSheet
                                        storeId={store.id}
                                      />
                                    );
                                  },
                                },
                                // {
                                //   label: "Invite",
                                //   defaultIcon: allIcons.solid.faShare,
                                //   async click() {
                                //     showPopup(
                                //       <Card>
                                //         <div className="flex justify-between items-center gap-2 p-3">
                                //           <h1 className="font-bold text-3xl">
                                //     rounded-full        <Translate content="invite to store" />
                                //           </h1>
                                //           <CircleTip
                                //             icon={allIcons.solid.faXmark}
                                //             onClick={() => {
                                //               closePopup();
                                //             }}
                                //           />
                                //         </div>
                                //       </Card>
                                //     );
                                //   },
                                // },
                                {
                                  label: "Edit",
                                  defaultIcon: allIcons.solid.faPen,
                                  click: () => {
                                    showPopup(<UpsertStore store={store} />, {
                                      type: "blur",
                                    });
                                  },
                                },
                                {
                                  label: "Delete",
                                  defaultIcon: allIcons.solid.faTrash,
                                  click: async () => {
                                    const response = await confirm({
                                      title: "Delete Store",
                                      message:
                                        "Are you sure you want to delete this store?",
                                      detail:
                                        "All data related to this store will be removed (Products / Orders).",
                                    });
                                    if (response) {
                                      execAction("delete-store", store.id);
                                    }
                                  },
                                },
                              ],
                            });
                          }}
                        />
                      </div>
                    </div>
                    {choosed && (
                      <span className="left-1 absolute inset-y-2 bg-[--biqpod-primary] rounded-full w-[8px]"></span>
                    )}
                    <Link to={`/store/${store.id}/overview`} id={linkId} />
                    {deletionStore === store.id && (
                      <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity] backdrop-blur-md">
                        <CircleLoading />
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
            {!!storesState.get.length && storesState.get.length < 5 && (
              <Card
                className="flex justify-center items-center rounded-2xl max-md:w-full min-w-[200px] h-[80px]"
                onClick={() => {
                  showPopup(<UpsertStore />, {
                    type: "blur",
                  });
                }}
              >
                <CircleTip icon={allIcons.solid.faPlus} />
              </Card>
            )}
          </EmptyComponent>
        )}
        {actionLoading &&
          range(5).map((index) => {
            return (
              <CardWait
                key={index}
                className="rounded-2xl w-[200px] max-md:w-full h-[150px]"
              />
            );
          })}
      </div>
      {!actionLoading && storesState.get.length === 0 && (
        <div className="flex justify-center items-center w-full h-full">
          <Card className="w-1/2 max-w-[300px] overflow-hidden">
            <img draggable="false" src={notFoundPhoto} />
            <Line />
            <div className="p-4 text-3xl text-center uppercase">
              <Translate content="no stores found" />
            </div>
            <Line />
            <div className="p-4">
              <Button
                className="p-3 rounded-full w-full"
                onClick={() => {
                  showPopup(<UpsertStore />, {
                    type: "blur",
                  });
                }}
              >
                <Translate content="add store" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Scroll>
  );
};
