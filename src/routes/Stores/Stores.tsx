import { allIcons } from "@biqpod/app/ui/apis";
import {
  Anchor,
  Button,
  Card,
  CardHeaderForPopup,
  CardWait,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Image,
  Key,
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
  useAsyncMemo,
  useCopyState,
  useUser,
} from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { snapbuyApi } from "../../apis";
import { delay, range } from "@biqpod/app/ui/utils";
import notFoundPhoto from "../../assets/nothing.png";
import { Link } from "react-router-dom";
import { UpsertStore } from "./EditStoreBottomSheet";
import { useStoreId } from "../../utils";
import { motion } from "framer-motion";
import { CopyStoreLinkBottomSheet } from "./CopyStoreLinkBottomSheet";
import { pixelsPhoto, SetPixels } from "./SetPixels";
import { SetTemplate } from "./SetTemplate";
import { platformsPhoto } from "../../utils/platforms";
import { SetStorePlatforms } from "./SetStorePlatforms";
import { Biqpod } from "@biqpod/app/ui/types";
// Enhanced Animation variants
const containerVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};
const storeCardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9,
    rotateX: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
      duration: 0.8,
    },
  },
  hover: {
    scale: 1.03,
    y: -5,
    rotateX: 2,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
  },
};
const addButtonVariants = {
  hidden: {
    opacity: 0,
    scale: 0.7,
    rotate: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
      delay: 0.3,
    },
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    backgroundColor: "var(--biqpod-primary-rgb)",
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
    },
  },
  tap: {
    scale: 0.9,
    rotate: -2,
  },
};
const loadingSkeletonVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9,
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.1,
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  }),
  pulse: {
    scale: [1, 1.02, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};
const emptyStateVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    rotateX: 15,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring" as const,
      stiffness: 150,
      damping: 20,
      delay: 0.5,
      duration: 1,
    },
  },
  float: {
    y: [-2, 2, -2],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};
const chooseIndicatorVariants = {
  hidden: {
    scaleY: 0,
    opacity: 0,
    scaleX: 0,
  },
  visible: {
    scaleY: 1,
    opacity: 1,
    scaleX: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
      delay: 0.2,
    },
  },
  pulse: {
    scaleX: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};
const pixelItemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.6,
    rotate: -15,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 350,
      damping: 20,
    },
  },
  hover: {
    scale: 1.15,
    rotate: 10,
    zIndex: 10,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 15,
    },
  },
  tap: {
    scale: 0.9,
    rotate: -5,
  },
};
// Store content section animations
const storeContentVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
      delay: 0.1,
    },
  },
};
const storeImageVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    rotate: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
  hover: {
    scale: 0.95,
    rotate: 2,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
    },
  },
};

export function useUsedBy(
  user?: Biqpod.Account.User | null
): "owned" | "random" | "read/edit" | "read" | null {
  const storeId = useStoreId();
  const currentUser = user === undefined ? useUser() : user;
  const usedBy = useAsyncMemo(async () => {
    if (!storeId || !currentUser) return null;
    const store = await snapbuyApi.store.get(storeId);
    if (!store) return null;
    if (store.uid === currentUser.uid) return "owned";
    const accesses = await snapbuyApi.hasAccessToStore(storeId);
    if (accesses) {
      return accesses === "read" ? "read" : "read/edit";
    }
    return "random";
  }, [currentUser, storeId]);
  return usedBy;
}

export const Stores = () => {
  const storeId = useStoreId();
  const storesState = useCopyState<Biqpod.Snapbuy.Store[]>([]);
  const invitedStoresState = useCopyState<Biqpod.Snapbuy.Store[]>([]);
  // Helper function to show delivery prices view
  const action = useAction(
    "fetch-my-stores",
    async () => {
      const stores = await snapbuyApi.store.getAll();
      storesState.set(stores);
    },
    []
  );
  const storeName = getFieldValue("store-name");
  const storePhone = getFieldValue("store-phone");
  const storePhoto = getTemp<string>("store-photo");
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
      const store: Biqpod.Snapbuy.Store = {
        name: storeName,
        phone: storePhone,
        id: id || Date.now().toString(),
        photo: storePhoto || undefined,
      };
      if (storePhoto) {
        store.photo = storePhoto;
      }
      await delay(1000);
      if (id) {
        await snapbuyApi.store.update(id, store);
        showToast("Store updated successfully", "success");
      } else {
        await snapbuyApi.store.add(store);
        showToast("Store added successfully", "success");
      }
      closePopup();
      setFieldValue("store-name", "");
      setFieldValue("store-phone", "");
      setTemp("store-photo", null);
      execAction("fetch-my-stores");
    },
    [storeName, storePhone, storePhoto]
  );
  const actionLoading = isLoading(action);
  const user = useUser();
  useAction(
    "load-invited-stores",
    async () => {
      if (!user) return;
      const invitedStores = await snapbuyApi.access.getInvitedStores();
      invitedStoresState.set(invitedStores);
    },
    [user]
  );
  useEffect(() => {
    if (user) {
      execAction("fetch-my-stores");
      execAction("load-invited-stores");
    }
  }, [user]);
  useAction(
    "delete-store",
    async (storeId: string) => {
      setTemp("deletion-store", storeId);
      await snapbuyApi.store.delete(storeId);
      showToast("Store deleted successfully", "success");
      setTemp("deletion-store", null);
      execAction("fetch-my-stores");
    },
    []
  );
  const deletionStore = getTemp<string>("deletion-store");
  const exportingStore = getTemp<string>("exporting-store");
  return (
    <Scroll>
      <motion.div
        className="flex flex-wrap items-center gap-2 p-2 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {!actionLoading && (
          <div className="w-full">
            {/* My Stores Section */}
            {storesState.get.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-4 font-bold text-[--biqpod-primary] text-xl">
                  <Translate content="my stores" />
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <EmptyComponent>
                    {storesState.get.map((store) => {
                      const linkId = `store-${store.id}`;
                      const choosed = storeId === store.id;
                      const pixels = Object.entries(store.pixels || {}).filter(
                        ([_, value]) => value
                      );
                      const platforms = Object.entries(
                        store.platforms || {}
                      ).filter(([_, value]) => value);
                      return (
                        <motion.div
                          key={store.id}
                          variants={storeCardVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className="max-md:w-full md:min-w-[400px]"
                        >
                          <Card className="relative w-full overflow-hidden">
                            <div className="flex justify-between items-center gap-4 p-4">
                              <motion.div
                                className="flex items-center gap-2"
                                variants={storeContentVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <motion.div
                                  variants={storeImageVariants}
                                  whileHover="hover"
                                >
                                  <Image
                                    onClick={() => {
                                      showPopup(<UpsertStore store={store} />, {
                                        type: "blur",
                                      });
                                    }}
                                    className="bg-[--biqpod-gray-opacity] rounded-xl w-[60px] h-[60px] hover:scale-95 transition-transform cursor-pointer"
                                    src={store.photo}
                                    alt={
                                      <div className="flex justify-center items-center font-bold">
                                        <i className="rotate-12">Snapbuy</i>
                                      </div>
                                    }
                                  />
                                </motion.div>
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
                              </motion.div>
                              <motion.div
                                className="flex justify-center items-center"
                                variants={storeContentVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.2 }}
                              >
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
                                        {
                                          label: "Set Template",
                                          click() {
                                            showPopup(
                                              <SetTemplate store={store} />
                                            );
                                          },
                                          defaultIcon: allIcons.solid.faPalette,
                                        },
                                        {
                                          label: "Set Pixels",
                                          click: async () => {
                                            showPopup(
                                              <SetPixels store={store} />
                                            );
                                          },
                                          defaultIcon: allIcons.solid.faCode,
                                        },
                                        {
                                          label: "Set Platforms",
                                          click: async () => {
                                            showPopup(
                                              <SetStorePlatforms
                                                store={store}
                                              />
                                            );
                                          },
                                          defaultIcon: allIcons.solid.faGlobe,
                                        },
                                        {
                                          label: "Export JSON",
                                          defaultIcon:
                                            allIcons.solid.faDownload,
                                          click: async () => {
                                            setTemp(
                                              "exporting-store",
                                              store.id
                                            );
                                            try {
                                              const products =
                                                await snapbuyApi.product.getProductsOf(
                                                  store.id
                                                );
                                              if (
                                                !products ||
                                                products.length === 0
                                              ) {
                                                showToast(
                                                  "No products found to export",
                                                  "info"
                                                );
                                                setTemp(
                                                  "exporting-store",
                                                  null
                                                );
                                                return;
                                              }
                                              const productsWithBase64 =
                                                await Promise.all(
                                                  products.map(
                                                    async (
                                                      product: Biqpod.Snapbuy.Product
                                                    ) => {
                                                      const updatedProduct = {
                                                        ...product,
                                                      };
                                                      if (
                                                        product.photos &&
                                                        product.photos.length >
                                                          0
                                                      ) {
                                                        updatedProduct.photos =
                                                          await Promise.all(
                                                            product.photos.map(
                                                              async (
                                                                photoUrl
                                                              ) => {
                                                                try {
                                                                  const response =
                                                                    await fetch(
                                                                      photoUrl
                                                                    );
                                                                  const blob =
                                                                    await response.blob();
                                                                  const base64 =
                                                                    await new Promise<string>(
                                                                      (
                                                                        resolve
                                                                      ) => {
                                                                        const reader =
                                                                          new FileReader();
                                                                        reader.onload =
                                                                          () =>
                                                                            resolve(
                                                                              reader.result as string
                                                                            );
                                                                        reader.readAsDataURL(
                                                                          blob
                                                                        );
                                                                      }
                                                                    );
                                                                  return base64;
                                                                } catch (e) {
                                                                  console.error(
                                                                    "Failed to convert photo to base64:",
                                                                    e
                                                                  );
                                                                  return photoUrl; // fallback to original URL
                                                                }
                                                              }
                                                            )
                                                          );
                                                      }
                                                      return updatedProduct;
                                                    }
                                                  )
                                                );
                                              const json = JSON.stringify(
                                                productsWithBase64,
                                                null,
                                                2
                                              );
                                              const blob = new Blob([json], {
                                                type: "application/json",
                                              });
                                              const url =
                                                URL.createObjectURL(blob);
                                              const a =
                                                document.createElement("a");
                                              a.href = url;
                                              a.download = `${store.name}-products.json`;
                                              a.click();
                                              URL.revokeObjectURL(url);
                                              showToast(
                                                "Products exported successfully",
                                                "success"
                                              );
                                              setTemp("exporting-store", null);
                                            } catch (error) {
                                              console.error(
                                                "Export failed:",
                                                error
                                              );
                                              showToast(
                                                "Failed to export products",
                                                "error"
                                              );
                                              setTemp("exporting-store", null);
                                            }
                                          },
                                        },
                                        {
                                          label: "Edit",
                                          defaultIcon: allIcons.solid.faPen,
                                          click: () => {
                                            showPopup(
                                              <UpsertStore store={store} />,
                                              {
                                                type: "blur",
                                              }
                                            );
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
                                              execAction(
                                                "delete-store",
                                                store.id
                                              );
                                            }
                                          },
                                        },
                                      ],
                                    });
                                  }}
                                />
                              </motion.div>
                            </div>
                            {choosed && (
                              <motion.span
                                className="left-1 absolute inset-y-2 bg-[--biqpod-primary] rounded-full w-[8px]"
                                variants={chooseIndicatorVariants}
                                initial="hidden"
                                animate={["visible", "pulse"]}
                              />
                            )}
                            {!!pixels.length && (
                              <EmptyComponent>
                                <Line />
                                <div className="flex justify-between items-center">
                                  <div className="px-4">
                                    <span className="capitalize">
                                      <Translate content="pixels" />
                                    </span>
                                  </div>
                                  <div className="flex justify-center">
                                    {pixels.map(([pixel, value]) => {
                                      const pixelId =
                                        pixel as Biqpod.Snapbuy.PixelId;
                                      const photo = pixelsPhoto[pixel];
                                      return (
                                        <motion.div
                                          key={pixel}
                                          variants={pixelItemVariants}
                                          whileHover="hover"
                                          whileTap="tap"
                                          className="hover:bg-[--biqpod-gray-opacity-2] p-1 w-[30px] h-[30px] object-cover cursor-pointer"
                                          onClick={() => {
                                            showPopup(
                                              <Card>
                                                <CardHeaderForPopup
                                                  title={`${pixel} Pixel`}
                                                />
                                                <Line />
                                                <div className="flex items-center gap-2 p-4">
                                                  <Key className="w-full">
                                                    {value}
                                                  </Key>
                                                  <div className="flex justify-center items-center">
                                                    <CircleTip
                                                      icon={
                                                        allIcons.regular.faCopy
                                                      }
                                                      onClick={() => {
                                                        navigator.clipboard.writeText(
                                                          value
                                                        );
                                                        showToast(
                                                          "Pixel copied to clipboard",
                                                          "success"
                                                        );
                                                      }}
                                                    />
                                                    <CircleTip
                                                      icon={
                                                        allIcons.solid.faTrash
                                                      }
                                                      onClick={async () => {
                                                        const response =
                                                          await confirm({
                                                            title:
                                                              "Delete Pixel",
                                                            message: `Are you sure you want to delete the ${pixel} pixel?`,
                                                          });
                                                        if (response) {
                                                          closePopup();
                                                          const copy = {
                                                            ...store,
                                                          };
                                                          const {
                                                            [pixelId]: _,
                                                            ...rest
                                                          } = copy.pixels || {};
                                                          copy.pixels = rest;
                                                          await snapbuyApi.store.setPixelId(
                                                            copy.id,
                                                            pixelId,
                                                            null
                                                          );
                                                          execAction(
                                                            "fetch-my-stores"
                                                          );
                                                        }
                                                      }}
                                                    />
                                                  </div>
                                                </div>
                                              </Card>
                                            );
                                          }}
                                        >
                                          <img
                                            src={photo}
                                            className="w-full h-full object-cover"
                                          />
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </EmptyComponent>
                            )}
                            {!!platforms.length && (
                              <EmptyComponent>
                                <Line />
                                <div className="flex justify-between items-center">
                                  <div className="px-4">
                                    <span className="capitalize">
                                      <Translate content="platforms" />
                                    </span>
                                  </div>
                                  <div className="flex justify-center">
                                    {platforms.map(([platform, _]) => {
                                      const photo =
                                        platformsPhoto[
                                          platform as keyof typeof platformsPhoto
                                        ];
                                      return (
                                        <motion.div
                                          key={platform}
                                          variants={pixelItemVariants}
                                          whileHover="hover"
                                          whileTap="tap"
                                          className="hover:bg-[--biqpod-gray-opacity-2] p-1 w-[30px] h-[30px] object-cover cursor-pointer"
                                          onClick={() => {
                                            showPopup(
                                              <SetStorePlatforms
                                                store={store}
                                              />
                                            );
                                          }}
                                        >
                                          <img
                                            src={photo}
                                            className="w-full h-full object-cover"
                                          />
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </EmptyComponent>
                            )}
                            <Link
                              to={`/store/${store.id}/dashboard`}
                              id={linkId}
                            />
                            {deletionStore === store.id && (
                              <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity] backdrop-blur-md">
                                <CircleLoading />
                              </div>
                            )}
                            {exportingStore === store.id && (
                              <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity] backdrop-blur-md">
                                <CircleLoading />
                              </div>
                            )}
                          </Card>
                        </motion.div>
                      );
                    })}
                    {!!storesState.get.length && storesState.get.length < 5 && (
                      <motion.div
                        variants={addButtonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        className="max-md:w-full md:w-[150px]"
                      >
                        <Card
                          className="flex justify-center items-center active:bg-[--biqpod-gray-opacity] rounded-2xl w-full h-[80px] cursor-pointer"
                          onClick={() => {
                            showPopup(<UpsertStore />, {
                              type: "blur",
                            });
                          }}
                        >
                          <CircleTip icon={allIcons.solid.faPlus} />
                        </Card>
                      </motion.div>
                    )}
                  </EmptyComponent>
                </div>
              </div>
            )}
            {/* Invited Stores Section */}
            {invitedStoresState.get.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-4 font-bold text-[--biqpod-secondary] text-xl">
                  <Translate content="invited stores" />
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <EmptyComponent>
                    {invitedStoresState.get.map((store) => {
                      const linkId = `invited-store-${store.id}`;
                      const choosed = storeId === store.id;
                      const pixels = Object.entries(store.pixels || {}).filter(
                        ([_, value]) => value
                      );
                      const platforms = Object.entries(
                        store.platforms || {}
                      ).filter(([_, value]) => value);
                      return (
                        <motion.div
                          key={store.id}
                          variants={storeCardVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className="max-md:w-full md:min-w-[400px]"
                        >
                          <Card className="relative w-full overflow-hidden">
                            <div className="flex justify-between items-center gap-4 p-4">
                              <motion.div
                                className="flex items-center gap-2"
                                variants={storeContentVariants}
                                initial="hidden"
                                animate="visible"
                              >
                                <motion.div
                                  variants={storeImageVariants}
                                  whileHover="hover"
                                >
                                  <Image
                                    className="bg-[--biqpod-gray-opacity] opacity-75 rounded-xl w-[60px] h-[60px] cursor-pointer"
                                    src={store.photo}
                                    alt={
                                      <div className="flex justify-center items-center font-bold">
                                        <i className="rotate-12">
                                          Biqpod.Snapbuy
                                        </i>
                                      </div>
                                    }
                                  />
                                </motion.div>
                                <div>
                                  <p className="font-bold max-md:text-base md:text-lg text-wrap">
                                    {store.name}
                                  </p>
                                  <p className="max-md:text-xs">
                                    <Anchor href={`tel:${store.phone}`}>
                                      {store.phone}
                                    </Anchor>
                                  </p>
                                  <p className="mt-1 text-[--biqpod-gray] text-xs">
                                    <Translate content="invited" />
                                  </p>
                                </div>
                              </motion.div>
                              <motion.div
                                className="flex justify-center items-center"
                                variants={storeContentVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.2 }}
                              >
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
                                        {
                                          label: "Leave Store",
                                          defaultIcon: allIcons.solid.faSignOut,
                                          click: async () => {
                                            const response = await confirm({
                                              title: "Leave Store",
                                              message:
                                                "Are you sure you want to leave this store?",
                                              detail:
                                                "You will lose access to this store and all its data.",
                                            });
                                            if (response) {
                                              // Find and remove the access record
                                              await snapbuyApi.access.leave(
                                                store.id
                                              );
                                              execAction("load-invited-stores");
                                            }
                                          },
                                        },
                                      ],
                                    });
                                  }}
                                />
                              </motion.div>
                            </div>
                            {choosed && (
                              <motion.span
                                className="left-1 absolute inset-y-2 bg-[--biqpod-primary] rounded-full w-[8px]"
                                variants={chooseIndicatorVariants}
                                initial="hidden"
                                animate={["visible", "pulse"]}
                              />
                            )}
                            {!!pixels.length && (
                              <EmptyComponent>
                                <Line />
                                <div className="flex justify-between items-center">
                                  <div className="px-4">
                                    <span className="capitalize">
                                      <Translate content="pixels" />
                                    </span>
                                  </div>
                                  <div className="flex justify-center">
                                    {pixels.map(([pixel, value]) => {
                                      const photo = pixelsPhoto[pixel];
                                      return (
                                        <motion.div
                                          key={pixel}
                                          variants={pixelItemVariants}
                                          whileHover="hover"
                                          whileTap="tap"
                                          className="hover:bg-[--biqpod-gray-opacity-2] p-1 w-[30px] h-[30px] object-cover cursor-pointer"
                                          onClick={() => {
                                            showPopup(
                                              <Card>
                                                <CardHeaderForPopup
                                                  title={`${pixel} Pixel`}
                                                />
                                                <Line />
                                                <div className="flex items-center gap-2 p-4">
                                                  <Key className="w-full">
                                                    {value}
                                                  </Key>
                                                  <div className="flex justify-center items-center">
                                                    <CircleTip
                                                      icon={
                                                        allIcons.regular.faCopy
                                                      }
                                                      onClick={() => {
                                                        navigator.clipboard.writeText(
                                                          value
                                                        );
                                                        showToast(
                                                          "Pixel copied to clipboard",
                                                          "success"
                                                        );
                                                      }}
                                                    />
                                                  </div>
                                                </div>
                                              </Card>
                                            );
                                          }}
                                        >
                                          <img
                                            src={photo}
                                            className="w-full h-full object-cover"
                                          />
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </EmptyComponent>
                            )}
                            {!!platforms.length && (
                              <EmptyComponent>
                                <Line />
                                <div className="flex justify-between items-center">
                                  <div className="px-4">
                                    <span className="capitalize">
                                      <Translate content="platforms" />
                                    </span>
                                  </div>
                                  <div className="flex justify-center">
                                    {platforms.map(([platform, _]) => {
                                      const photo =
                                        platformsPhoto[
                                          platform as keyof typeof platformsPhoto
                                        ];
                                      return (
                                        <motion.div
                                          key={platform}
                                          variants={pixelItemVariants}
                                          whileHover="hover"
                                          whileTap="tap"
                                          className="hover:bg-[--biqpod-gray-opacity-2] p-1 w-[30px] h-[30px] object-cover cursor-pointer"
                                          onClick={() => {
                                            showPopup(
                                              <SetStorePlatforms
                                                store={store}
                                              />
                                            );
                                          }}
                                        >
                                          <img
                                            src={photo}
                                            className="w-full h-full object-cover"
                                          />
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </EmptyComponent>
                            )}
                            <Link
                              to={`/store/${store.id}/dashboard`}
                              id={linkId}
                            />
                          </Card>
                        </motion.div>
                      );
                    })}
                  </EmptyComponent>
                </div>
              </div>
            )}
            {/* Add Store Button when no owned stores but invited stores exist */}
            {invitedStoresState.get.length > 0 &&
              storesState.get.length === 0 && (
                <motion.div
                  variants={addButtonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="max-md:w-full md:w-[150px]"
                >
                  <Card
                    className="flex justify-center items-center active:bg-[--biqpod-gray-opacity] rounded-2xl w-full h-[80px] cursor-pointer"
                    onClick={() => {
                      showPopup(<UpsertStore />, {
                        type: "blur",
                      });
                    }}
                  >
                    <CircleTip icon={allIcons.solid.faPlus} />
                  </Card>
                </motion.div>
              )}
          </div>
        )}
        {actionLoading &&
          range(5).map((index) => {
            return (
              <motion.div
                key={index}
                variants={loadingSkeletonVariants}
                initial="hidden"
                animate={["visible", "pulse"]}
                custom={index}
              >
                <CardWait className="rounded-2xl max-md:w-full md:w-[200px] h-[150px]" />
              </motion.div>
            );
          })}
      </motion.div>
      {!actionLoading &&
        storesState.get.length === 0 &&
        invitedStoresState.get.length === 0 && (
          <motion.div
            className="flex justify-center items-center w-full h-full"
            variants={emptyStateVariants}
            initial="hidden"
            animate={["visible", "float"]}
          >
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
          </motion.div>
        )}
    </Scroll>
  );
};
