import React, { useEffect, useMemo } from "react";
import {
  Button,
  Card,
  CardHeaderForPopup,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  EnumField,
  Field,
  Icon,
  Line,
  NumberField,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  openMenu,
  setFieldValue,
  showPopup,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { delay } from "@biqpod/app/ui/utils";
import places from "../../public/places.json";
interface DeliveryOptionWithPrices extends SnapBuy.DeliveryOptions {
  prices: SnapBuy.DeliveryPrice[];
}
interface StoreDeliveryPricingListProps {
  storeId?: string;
}
export const StoreDeliveryPricingList: React.FC<
  StoreDeliveryPricingListProps
> = ({ storeId: propStoreId }) => {
  const defaultStoreId = useStoreId();
  const storeId = propStoreId || defaultStoreId;
  const deliveryOptions = useCopyState<DeliveryOptionWithPrices[] | null>(null);
  const selectedPrices = useCopyState<Set<string>>(new Set());
  const isDeletingBulk = useCopyState(false);
  useAction(
    "fetch-delivery-options",
    async () => {
      if (!storeId) {
        deliveryOptions.set([]);
        return;
      }
      try {
        const options = await snapbuyApi.getStoreDeliveryOptions(storeId);
        const optionsWithPrices = await Promise.all(
          options.map(async (option) => {
            const prices = await snapbuyApi.getDeliveryPricesForOption(
              option.id!
            );
            return {
              ...option,
              prices,
            };
          })
        );
        deliveryOptions.set(optionsWithPrices);
      } catch (error) {
        console.error("Failed to fetch delivery options:", error);
        deliveryOptions.set([]);
      }
    },
    [storeId]
  );
  useEffect(() => {
    execAction("fetch-delivery-options");
  }, [storeId]);
  useAction(
    "delete-delivery-option",
    async (deliveryOptionId: string) => {
      if (!storeId) return;
      const confirmed = await confirm({
        title: "Delete Delivery Option",
        message:
          "Are you sure you want to delete this delivery option and all its prices? This action cannot be undone.",
        type: "warning",
      });
      if (confirmed) {
        await snapbuyApi.deleteStoreDeliveryOption(deliveryOptionId);
        showToast("Delivery option deleted successfully", "success");
        execAction("fetch-delivery-options");
      }
    },
    [storeId]
  );
  useAction(
    "delete-delivery-price",
    async (deliveryPriceId: string) => {
      const confirmed = await confirm({
        title: "Delete Delivery Price",
        message:
          "Are you sure you want to delete this delivery price? This action cannot be undone.",
        type: "warning",
      });
      if (confirmed) {
        await snapbuyApi.deleteDeliveryPrice(deliveryPriceId);
        showToast("Delivery price deleted successfully", "success");
        execAction("fetch-delivery-options");
      }
    },
    []
  );
  useAction(
    "create-delivery-prices",
    async (deliveryOptionId: string) => {
      if (!storeId) return;
      try {
        // Create delivery prices for each wilaya
        const promises = [];
        for (const wilaya of places) {
          promises.push(
            snapbuyApi.addDeliveryPrice({
              name: wilaya.name,
              price: 0,
              deliveryOptionId,
              storeId,
              createdAt: Date.now(),
            })
          );
        }
        await Promise.all(promises);
        showToast(
          `Successfully added ${promises.length} delivery prices from Navex places`,
          "success"
        );
        execAction("fetch-delivery-options");
      } catch (error) {
        console.error("Failed to create navex delivery prices:", error);
        showToast(
          "Failed to create delivery prices from Navex places",
          "error"
        );
      }
    },
    [storeId]
  );
  useAction(
    "bulk-delete-delivery-prices",
    async (priceIds: string[]) => {
      if (priceIds.length === 0) return;
      const confirmed = await confirm({
        title: "Delete Selected Prices",
        message: `Are you sure you want to delete ${priceIds.length} selected delivery price(s)? This action cannot be undone.`,
        type: "warning",
      });
      if (confirmed) {
        isDeletingBulk.set(true);
        try {
          await Promise.all(
            priceIds.map((id) => snapbuyApi.deleteDeliveryPrice(id))
          );
          showToast(
            `Successfully deleted ${priceIds.length} delivery price(s)`,
            "success"
          );
          selectedPrices.set(new Set());
          execAction("fetch-delivery-options");
        } catch (error) {
          console.error("Failed to delete delivery prices:", error);
          showToast("Failed to delete some delivery prices", "error");
        } finally {
          isDeletingBulk.set(false);
        }
      }
    },
    []
  );
  const togglePriceSelection = (priceId: string) => {
    const current = selectedPrices.get;
    const newSet = new Set(current);
    if (newSet.has(priceId)) {
      newSet.delete(priceId);
    } else {
      newSet.add(priceId);
    }
    selectedPrices.set(newSet);
  };
  const toggleSelectAllPrices = (optionPrices: SnapBuy.DeliveryPrice[]) => {
    const current = selectedPrices.get;
    const optionPriceIds = optionPrices.map((p) => p.id!);
    const allSelected = optionPriceIds.every((id) => current.has(id));
    const newSet = new Set(current);
    if (allSelected) {
      // Deselect all prices from this option
      optionPriceIds.forEach((id) => newSet.delete(id));
    } else {
      // Select all prices from this option
      optionPriceIds.forEach((id) => newSet.add(id));
    }
    selectedPrices.set(newSet);
  };
  const handleAddDeliveryOption = () => {
    if (!storeId) return;
    showPopup(<UpsertStoreDeliveryOption storeId={storeId} />);
  };
  const handleEditDeliveryOption = (
    deliveryOption: SnapBuy.DeliveryOptions
  ) => {
    if (!storeId) return;
    showPopup(
      <UpsertStoreDeliveryOption
        storeId={storeId}
        deliveryOption={deliveryOption}
      />
    );
  };
  const handleAddDeliveryPrice = (deliveryOptionId: string) => {
    if (!storeId) return;
    showPopup(
      <UpsertDeliveryPrice
        storeId={storeId}
        deliveryOptionId={deliveryOptionId}
      />
    );
  };
  const handleEditDeliveryPrice = (deliveryPrice: SnapBuy.DeliveryPrice) => {
    if (!storeId) return;
    showPopup(
      <UpsertDeliveryPrice
        storeId={storeId}
        deliveryOptionId={deliveryPrice.deliveryOptionId}
        deliveryPrice={deliveryPrice}
      />
    );
  };
  const handleAddNavexPlaces = async (deliveryOptionId: string) => {
    if (!storeId) return;
    const confirmed = await confirm({
      title: "Add Places",
      message:
        "This will create delivery prices for all Algerian wilayas and offices with price 0. You can edit the prices later. Continue?",
      type: "info",
    });
    if (confirmed) {
      execAction("create-delivery-prices", deliveryOptionId);
    }
  };
  if (!storeId) {
    return (
      <Card className="p-4 text-center">
        <p className="text-gray-500">
          <Translate content="no store selected" />
        </p>
      </Card>
    );
  }
  return (
    <div className="flex flex-col h-full">
      {!deliveryOptions.get ? (
        <div className="flex justify-center items-center p-8 h-full">
          <CircleLoading />
        </div>
      ) : deliveryOptions.get.length === 0 ? (
        <EmptyComponent>
          <div className="flex flex-col justify-center items-center gap-4 p-8 h-full text-center">
            <Card className="flex flex-col justify-center items-center gap-4 p-8 text-center">
              <Icon iconClassName="text-8xl" icon={allIcons.solid.faTruck} />
              <div>
                <p className="font-medium text-gray-600">
                  <Translate content="no delivery options set" />
                </p>
                <p className="text-gray-500 text-sm">
                  <Translate content="create delivery options and manage their pricing" />
                </p>
              </div>
              <Button
                onClick={handleAddDeliveryOption}
                className="rounded-full w-fit"
              >
                <Translate content="add first delivery option" />
              </Button>
            </Card>
          </div>
        </EmptyComponent>
      ) : (
        <EmptyComponent>
          <Scroll>
            <div className="flex flex-col gap-3 p-3">
              <AnimatePresence>
                {deliveryOptions.get?.map((option, index) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[--biqpod-secondary-background] border border-[--biqpod-borders] border-solid rounded-lg overflow-hidden"
                  >
                    {/* Delivery Option Header */}
                    <div className="flex justify-between items-start bg-[--biqpod-primary-background] p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">
                            {option.name}
                          </h3>
                          <span className="bg-blue-500/15 px-2 py-1 rounded-full font-medium text-blue-500 text-xs capitalize">
                            {option.type === "store"
                              ? "Store Pickup"
                              : option.type === "domicile"
                              ? "Home Delivery"
                              : "Office Delivery"}
                          </span>
                        </div>
                        {option.description && (
                          <p className="mt-1 text-gray-600 text-sm">
                            {option.description}
                          </p>
                        )}
                        <span className="text-gray-500 text-xs capitalize">
                          <Translate content="created at" />:{" "}
                          {new Date(option.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <CircleTip
                          onClick={({ clientX, clientY }) => {
                            openMenu({
                              x: clientX,
                              y: clientY,
                              menu: [
                                {
                                  id: "edit",
                                  label: "Edit delivery option",
                                  defaultIcon: allIcons.solid.faEdit,
                                  click: () => handleEditDeliveryOption(option),
                                },
                                {
                                  id: "delete",
                                  label: "Delete delivery option",
                                  defaultIcon: allIcons.solid.faTrash,
                                  click: () =>
                                    execAction(
                                      "delete-delivery-option",
                                      option.id!
                                    ),
                                },
                              ],
                            });
                          }}
                          icon={allIcons.solid.faEllipsisV}
                          title="More options"
                        />
                      </div>
                    </div>
                    <Line />
                    {/* Delivery Prices */}
                    <div className="flex justify-between items-center p-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-700 text-sm">
                          <Translate content="delivery prices" /> (
                          {option.prices.length})
                        </h4>
                        {option.prices.length > 0 && (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                              disabled={isDeletingBulk.get}
                              checked={
                                option.prices.length > 0 &&
                                option.prices.every((p) =>
                                  selectedPrices.get.has(p.id!)
                                )
                              }
                              onChange={() =>
                                toggleSelectAllPrices(option.prices)
                              }
                              title={
                                isDeletingBulk.get
                                  ? "Bulk delete in progress..."
                                  : option.prices.every((p) =>
                                      selectedPrices.get.has(p.id!)
                                    )
                                  ? "Deselect all"
                                  : "Select all"
                              }
                            />
                            <span className="text-gray-500 text-xs">
                              {selectedPrices.get.size > 0 &&
                                `${selectedPrices.get.size} selected`}
                            </span>
                            {selectedPrices.get.size > 0 && (
                              <Button
                                onClick={() =>
                                  execAction(
                                    "bulk-delete-delivery-prices",
                                    Array.from(selectedPrices.get)
                                  )
                                }
                                disabled={isDeletingBulk.get}
                                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 px-2 py-1 rounded text-white text-xs disabled:cursor-not-allowed"
                              >
                                {isDeletingBulk.get ? (
                                  <div className="flex items-center gap-1">
                                    <CircleLoading />
                                    <span>Deleting...</span>
                                  </div>
                                ) : (
                                  <>
                                    <Icon
                                      icon={allIcons.solid.faTrash}
                                      iconClassName="mr-1 text-xs"
                                    />
                                    Delete ({selectedPrices.get.size})
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <CircleTip
                          onClick={() => handleAddNavexPlaces(option.id!)}
                          icon={allIcons.solid.faMapMarkerAlt}
                          className="text-blue-500 hover:text-blue-600"
                        />
                        <Button
                          onClick={() => handleAddDeliveryPrice(option.id!)}
                          className="px-3 rounded-full w-fit text-xs"
                        >
                          <Icon
                            icon={allIcons.solid.faPlus}
                            iconClassName="mr-1 text-xs"
                          />
                          <Translate content="add price" />
                        </Button>
                      </div>
                    </div>
                    <Line />
                    <div className="p-3">
                      {option.prices.length === 0 ? (
                        <div className="py-4 text-gray-500 text-sm text-center">
                          <Translate content="no prices added yet" />
                        </div>
                      ) : (
                        <div className="gap-2 grid">
                          {option.prices.map((price) => (
                            <motion.div
                              key={price.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex justify-between items-center bg-[--biqpod-primary-background] p-3 border border-[--biqpod-borders] rounded-lg transition-opacity duration-200 ${
                                isDeletingBulk.get &&
                                selectedPrices.get.has(price.id!)
                                  ? "opacity-50 pointer-events-none"
                                  : ""
                              }`}
                            >
                              <div className="flex flex-1 items-center gap-3">
                                <input
                                  type="checkbox"
                                  className="disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                  disabled={isDeletingBulk.get}
                                  checked={selectedPrices.get.has(price.id!)}
                                  onChange={() =>
                                    togglePriceSelection(price.id!)
                                  }
                                  title={
                                    isDeletingBulk.get
                                      ? "Bulk delete in progress..."
                                      : "Toggle selection"
                                  }
                                />
                                <div className="flex-1">
                                  <span className="font-medium">
                                    {price.name}
                                  </span>
                                  <span className="bg-green-500/15 ml-3 px-2 py-1 rounded-full font-medium text-green-500 text-sm">
                                    {price.price} DA
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <CircleTip
                                  onClick={({ clientX, clientY }) => {
                                    openMenu({
                                      x: clientX,
                                      y: clientY,
                                      menu: [
                                        {
                                          id: "edit",
                                          label: "Edit price",
                                          defaultIcon: allIcons.solid.faEdit,
                                          click: () =>
                                            handleEditDeliveryPrice(price),
                                        },
                                        {
                                          id: "delete",
                                          label: "Delete price",
                                          defaultIcon: allIcons.solid.faTrash,
                                          click: () =>
                                            execAction(
                                              "delete-delivery-price",
                                              price.id!
                                            ),
                                        },
                                      ],
                                    });
                                  }}
                                  icon={allIcons.solid.faEllipsisV}
                                  title="More options"
                                />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Scroll>
          <Line />
          <div className="p-2">
            <Button onClick={handleAddDeliveryOption} className="rounded-full">
              <Translate content="add delivery option" />
            </Button>
          </div>
        </EmptyComponent>
      )}
    </div>
  );
};
interface UpsertStoreDeliveryOptionProps {
  storeId: string;
  deliveryOption?: SnapBuy.DeliveryOptions;
}
export const UpsertStoreDeliveryOption: React.FC<
  UpsertStoreDeliveryOptionProps
> = ({ storeId, deliveryOption }) => {
  const name = getFieldValue("delivery-option-name");
  const description = getFieldValue("delivery-option-description");
  const deliveryType = useCopyState<string | false | 0 | null | undefined>(
    deliveryOption?.type || "store"
  );
  const isEdit = !!deliveryOption;
  const isLoading = useCopyState(false);

  const deliveryTypeOptions = [
    { value: "store", content: "Store Pickup" },
    { value: "domicile", content: "Home Delivery" },
    { value: "office", content: "Office Delivery" },
  ];

  const formData = useMemo(() => {
    return {
      name,
      description,
      type: deliveryType.get,
    };
  }, [name, description, deliveryType.get]);
  useEffect(() => {
    setFieldValue("delivery-option-name", deliveryOption?.name || "");
    setFieldValue(
      "delivery-option-description",
      deliveryOption?.description || ""
    );
    deliveryType.set(deliveryOption?.type || "store");
  }, [deliveryOption]);
  useAction(
    "upsert-delivery-option",
    async () => {
      const { name, description, type } = formData;
      if (!name?.trim()) {
        showToast("Please enter a name", "error");
        return;
      }

      // Validate and ensure type is one of the allowed values
      const validType =
        type === "store" || type === "domicile" || type === "office"
          ? type
          : "store";

      isLoading.set(true);
      try {
        if (isEdit) {
          await snapbuyApi.updateStoreDeliveryOption(deliveryOption.id!, {
            name: name || "",
            description: description || "",
            type: validType,
          });
          showToast("Delivery option updated successfully", "success");
        } else {
          await snapbuyApi.addStoreDeliveryOption(storeId, {
            name: name || "",
            description: description || "",
            type: validType,
            createdAt: Date.now(),
          });
          showToast("Delivery option added successfully", "success");
        }
        execAction("fetch-delivery-options");
        closePopup();
      } catch (error) {
        showToast("Failed to save delivery option", "error");
        console.error(error);
      } finally {
        isLoading.set(false);
      }
    },
    [formData, storeId, isEdit, deliveryOption]
  );
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-[500px] max-md:h-full md:max-h-[90vh] overflow-hidden">
      <CardHeaderForPopup
        title={isEdit ? "Edit Delivery Option" : "Add Delivery Option"}
      />
      <Line />
      <div className="space-y-4 p-4 h-full">
        <div>
          <label className="block mb-2 font-medium">
            <Translate content="name" />
          </label>
          <Field
            inputName="delivery-option-name"
            placeholder="e.g., Standard Delivery, Express Delivery"
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">
            <Translate content="delivery type" />
          </label>
          <EnumField
            state={deliveryType}
            id="delivery-option-type"
            config={{
              list: deliveryTypeOptions,
            }}
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">
            <Translate content="description" />
          </label>
          <Field
            inputName="delivery-option-description"
            placeholder="Optional: Describe this delivery option..."
            rows={3}
            className="rounded-xl"
          />
        </div>
      </div>
      <Line />
      <div className="flex gap-3 p-4">
        <Button
          onClick={closePopup}
          className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          disabled={isLoading.get}
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={() => execAction("upsert-delivery-option")}
          disabled={isLoading.get}
        >
          {isLoading.get ? (
            <div className="flex items-center gap-2">
              <CircleLoading />
              <Translate content="saving" />
            </div>
          ) : (
            <Translate content={isEdit ? "update" : "add"} />
          )}
        </Button>
      </div>
    </Card>
  );
};
interface UpsertDeliveryPriceProps {
  storeId: string;
  deliveryOptionId: string;
  deliveryPrice?: SnapBuy.DeliveryPrice;
}
export const UpsertDeliveryPrice: React.FC<UpsertDeliveryPriceProps> = ({
  storeId,
  deliveryOptionId,
  deliveryPrice,
}) => {
  const name = getFieldValue("delivery-price-name");
  const isEdit = !!deliveryPrice;
  const price = useCopyState<null | undefined | number>(null);
  const isLoading = useCopyState(false);
  const formData = useMemo(() => {
    return {
      name,
      price: price.get,
    };
  }, [name, price.get]);
  useEffect(() => {
    setFieldValue("delivery-price-name", deliveryPrice?.name || "");
    delay(1000).then(() => {
      price.set(deliveryPrice?.price || null);
    });
  }, [deliveryPrice]);
  useAction(
    "upsert-delivery-price",
    async () => {
      const { name, price } = formData;
      if (!name?.trim()) {
        showToast("Please enter a name", "error");
        return;
      }
      if (typeof price !== "number") {
        showToast("Please enter a valid price", "error");
        return;
      }
      if (price < 0) {
        showToast("Price Must Be Greater Than 0", "error");
        return;
      }
      isLoading.set(true);
      try {
        if (isEdit) {
          await snapbuyApi.updateDeliveryPrice(deliveryPrice.id!, {
            name: name || "",
            price,
          });
          showToast("Delivery price updated successfully", "success");
        } else {
          await snapbuyApi.addDeliveryPrice({
            name: name || "",
            price,
            deliveryOptionId,
            storeId,
            createdAt: Date.now(),
          });
          showToast("Delivery price added successfully", "success");
        }
        execAction("fetch-delivery-options");
        closePopup();
      } catch (error) {
        showToast("Failed to save delivery price", "error");
        console.error(error);
      } finally {
        isLoading.set(false);
      }
    },
    [formData, storeId, deliveryOptionId, isEdit, deliveryPrice]
  );
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-[500px] max-md:h-full md:max-h-[90vh] overflow-hidden">
      <CardHeaderForPopup
        title={isEdit ? "Edit Delivery Price" : "Add Delivery Price"}
      />
      <Line />
      <div className="space-y-4 p-4 h-full">
        <div>
          <label className="block mb-2 font-medium">
            <Translate content="name" />
          </label>
          <Field
            inputName="delivery-price-name"
            placeholder="e.g., Within city, Outside city, Express"
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">
            <Translate content="price da" />
          </label>
          <NumberField
            config={{
              placeholder: "0",
              autoChange: true,
            }}
            id="price-delivery"
            state={price}
          />
        </div>
      </div>
      <Line />
      <div className="flex gap-3 p-4">
        <Button
          onClick={closePopup}
          className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          disabled={isLoading.get}
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={() => execAction("upsert-delivery-price")}
          disabled={isLoading.get}
        >
          {isLoading.get ? (
            <div className="flex items-center gap-2">
              <CircleLoading />
              <Translate content="saving" />
            </div>
          ) : (
            <Translate content={isEdit ? "update" : "add"} />
          )}
        </Button>
      </div>
    </Card>
  );
};
