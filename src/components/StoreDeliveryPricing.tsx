import React, { useEffect, useMemo } from "react";
import {
  BooleanField,
  Button,
  Card,
  CardHeaderForPopup,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  EnumField,
  Field,
  Icon,
  Image,
  Key,
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
  isLoading,
  openMenu,
  setFieldValue,
  showPopup,
  showToast,
  useAction,
  useAsyncMemo,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";
import { DeliveryCompany, snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { delay, tw, fuzzySearch } from "@biqpod/app/ui/utils";
import dz from "../../public/places/dz.json";
import ma from "../../public/places/ma.json";
import tn from "../../public/places/tn.json";
import ly from "../../public/places/ly.json";
import fr from "../../public/places/fr.json";
import de from "../../public/places/de.json";
import us from "../../public/places/us.json";
import es from "../../public/places/es.json";
import it from "../../public/places/it.json";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { CreateFirstUI } from "./CreateFirstUI";
// Custom Checkbox Component
interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}
const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  title,
  className = "",
}) => {
  return (
    <div className="inline-block">
      <motion.button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={tw(
          `relative flex cursor-pointer hover:border-[--biqpod-primary] items-center justify-center w-5 h-5 rounded border-2 transition-all bg-[--biqpod-primary-background] border-solid border-[--biqpod-borders]`,
          checked && "bg-[--biqpod-primary] border-[--biqpod-primary]",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        title={title}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        whileHover={!disabled ? { scale: 1.05 } : {}}
      >
        {checked && (
          <div>
            <Icon
              icon={allIcons.solid.faCheck}
              className="text-[--biqpod-primary-content] text-sm"
            />
          </div>
        )}
      </motion.button>
    </div>
  );
};
// Highlight matching text component
interface HighlightTextProps {
  text: string;
  query?: string;
}
const HighlightText: React.FC<HighlightTextProps> = ({ text, query }) => {
  if (!query) return <EmptyComponent>{text}</EmptyComponent>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;
  // Find all query characters in order (fuzzy matching)
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      if (lastIndex < i) {
        parts.push({ text: text.substring(lastIndex, i), highlight: false });
      }
      parts.push({ text: text[i], highlight: true });
      lastIndex = i + 1;
      queryIndex++;
    }
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex), highlight: false });
  }
  return (
    <EmptyComponent>
      {parts.map((part, idx) =>
        part.highlight ? (
          <span key={idx} className="text-[--biqpod-primary] underline">
            {part.text}
          </span>
        ) : (
          <span key={idx}>{part.text}</span>
        )
      )}
    </EmptyComponent>
  );
};
const ImportDeliveryPricesDirect = () => {
  const selectedCountrie = useCopyState<string | Nothing>(null);
  const countries = useAsyncMemo(() => {
    return snapbuyApi.getCountries();
  }, []);
  const selected = useAsyncMemo(async () => {
    return selectedCountrie.get
      ? snapbuyApi.getCountrieDeliveryCompanys(selectedCountrie.get)
      : undefined;
  }, [selectedCountrie.get]);
  const searchPlace = getFieldValue("import-search-place");
  const filteredPlaces = useMemo(() => {
    return Object.entries(countries || [])?.filter(([key]) =>
      fuzzySearch(key, searchPlace || "")
    );
  }, [searchPlace, countries]);
  const searchCompany = getFieldValue("import-search-company");
  const filteredCompanies = useMemo(() => {
    return selected?.filter((p) => fuzzySearch(p.name, searchCompany || ""));
  }, [searchCompany, selected]);
  const selectedCompany = useCopyState<Nothing | DeliveryCompany>(null);
  const selectStoreLocation = useCopyState<string | null>(null);
  return (
    <Card className="top-10 absolute w-2/3 max-h-[90vh] overflow-hidden">
      <CardHeaderForPopup title="Import Delivery Prices" />
      <Line />
      <div className="p-2">
        <Field
          className="rounded-xl"
          inputName={
            selectStoreLocation.get
              ? "import-search-store-location"
              : selected
              ? "import-search-company"
              : "import-search-place"
          }
          placeholder={
            selected ? "Search delivery companies..." : "Search places..."
          }
        />
      </div>
      <Line />
      {!selected && (
        <Scroll>
          {filteredPlaces.map(([placeCode, { name, photo }]) => {
            return (
              <div
                className="flex items-center gap-3 hover:bg-[--biqpod-gray-opacity] odd:bg-[--biqpod-primary-background] active:bg-[--biqpod-gray-opacity-2] p-3 capitalize cursor-pointer"
                onClick={() => {
                  selectedCountrie.set(placeCode);
                }}
              >
                <Image src={photo} className="w-10 h-10" />
                <span>
                  <span>{name}</span>
                  <sub>
                    <Key className="px-1 py-2">{placeCode}</Key>
                  </sub>
                </span>
              </div>
            );
          })}
          {!filteredPlaces.length && (
            <div className="text-[--biqpod-gray-opacity-2] py-4 text-sm text-center capitalize">
              <Translate content="no places found" />
            </div>
          )}
        </Scroll>
      )}
      {!selectedCompany.get && selected && (
        <Scroll>
          {filteredCompanies?.map((s, index) => {
            return (
              <div
                className="flex items-center gap-2 hover:bg-[--biqpod-gray-opacity] odd:bg-[--biqpod-primary-background] active:bg-[--biqpod-gray-opacity-2] p-2 cursor-pointer"
                key={index}
                onClick={async () => {
                  selectedCompany.set(s);
                }}
              >
                <div>
                  <Image
                    src={s.photo}
                    alt={s.name}
                    className="bg-[--biqpod-gray-opacity] rounded-md w-10 h-10"
                  />
                </div>
                <span>
                  <span>{s.name}</span>
                  {s.description && (
                    <p className="text-[--biqpod-gray-opacity-2]">
                      {s.description}
                    </p>
                  )}
                </span>
              </div>
            );
          })}
          {!filteredCompanies?.length && (
            <div className="text-[--biqpod-gray-opacity-2] py-4 text-sm text-center capitalize">
              <Translate content="no delivery companies found" />
            </div>
          )}
        </Scroll>
      )}
      {selectedCompany.get && <Scroll></Scroll>}
      <Line />
      {selected && (
        <div className="flex items-center gap-2 p-2">
          <Button
            icon={allIcons.solid.faChevronLeft}
            className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
            onClick={() => {
              selectedCountrie.set(null);
            }}
          >
            <Translate content="back" />
          </Button>
        </div>
      )}
    </Card>
  );
};
const places: Record<string, { name: string }[]> = {
  dz,
  ma,
  tn,
  ly,
  fr,
  de,
  us,
  es,
  it,
};
const placeOptions = [
  { value: "dz", content: `*(${dz.length})* Algeria` },
  { value: "ma", content: `*(${ma.length})* Morocco` },
  { value: "tn", content: `*(${tn.length})* Tunisia` },
  { value: "ly", content: `*(${ly.length})* Libya` },
  { value: "fr", content: `*(${fr.length})* France` },
  { value: "de", content: `*(${de.length})* Germany` },
  { value: "us", content: `*(${us.length})* USA` },
  { value: "es", content: `*(${es.length})* Spain` },
  { value: "it", content: `*(${it.length})* Italy` },
];
interface DeliveryOptionWithPrices extends Biqpod.Snapbuy.DeliveryOptions {
  prices: Biqpod.Snapbuy.DeliveryPrice[];
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
  const expandedOptions = useCopyState<Set<string>>(new Set());
  const priceSearch = getFieldValue("delivery-price-search");
  // Filter prices based on fuzzy search
  const getFilteredPrices = (prices: Biqpod.Snapbuy.DeliveryPrice[]) => {
    if (!priceSearch) return prices;
    return prices.filter(
      (price) =>
        fuzzySearch(price.name, priceSearch) ||
        fuzzySearch(price.price.toString(), priceSearch)
    );
  };
  useAction(
    "fetch-delivery-options",
    async () => {
      if (!storeId) {
        deliveryOptions.set([]);
        return;
      }
      try {
        const options = await snapbuyApi.deliveryPrice.options.getAll(storeId);
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
        await snapbuyApi.deliveryPrice.options.delete(deliveryOptionId);
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
  const action = useAction(
    "create-delivery-prices",
    async (args: { deliveryOptionId: string; selectedPlace: string }) => {
      const { deliveryOptionId, selectedPlace } = args;
      if (!storeId) return;
      try {
        const placeData = places[selectedPlace];
        // Create delivery prices for each division
        const promises = [];
        for (const division of placeData) {
          promises.push(
            snapbuyApi.addDeliveryPrice({
              name: division.name,
              price: 0,
              deliveryOptionId,
              storeId,
              createdAt: Date.now(),
            })
          );
        }
        await Promise.all(promises);
        const placeName =
          placeOptions.find((p) => p.value === selectedPlace)?.content ||
          selectedPlace;
        showToast(
          `Successfully added ${promises.length} delivery prices from ${placeName} places`,
          "success"
        );
        execAction("fetch-delivery-options");
      } catch (error) {
        console.error("Failed to create delivery prices:", error);
        showToast(
          "Failed to create delivery prices from selected places",
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
  const loading = isLoading(action);
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
  const toggleSelectAllPrices = (
    optionPrices: Biqpod.Snapbuy.DeliveryPrice[]
  ) => {
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
  const toggleOptionExpanded = (optionId: string) => {
    const current = expandedOptions.get;
    const newSet = new Set(current);
    if (newSet.has(optionId)) {
      newSet.delete(optionId);
    } else {
      newSet.add(optionId);
    }
    expandedOptions.set(newSet);
  };
  const handleAddDeliveryOption = () => {
    if (!storeId) return;
    showPopup(<UpsertStoreDeliveryOption storeId={storeId} />);
  };
  const handleEditDeliveryOption = (
    deliveryOption: Biqpod.Snapbuy.DeliveryOptions
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
  const handleEditDeliveryPrice = (
    deliveryPrice: Biqpod.Snapbuy.DeliveryPrice
  ) => {
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
    showPopup(
      <SelectPlaceForDelivery
        deliveryOptionId={deliveryOptionId}
        loading={loading}
      />
    );
  };
  if (!storeId) {
    return (
      <Card className="p-4 text-center">
        <p className="text-[--biqpod-gray-opacity-2]">
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
        <CreateFirstUI
          title="no delivery options set"
          description="create delivery options and manage their pricing"
          photo="https://cdn3d.iconscout.com/3d/premium/thumb/package-delivery-tracking-3d-icon-png-download-4204239.png"
        />
      ) : (
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
                        <h3 className="font-semibold text-lg">{option.name}</h3>
                        <span className="bg-blue-500/15 px-2 py-1 rounded-full font-medium text-blue-500 text-xs capitalize">
                          {option.type === "store"
                            ? "Store Pickup"
                            : option.type === "domicile"
                            ? "Home Delivery"
                            : "Office Delivery"}
                        </span>
                      </div>
                      {option.description && (
                        <p className="text-[--biqpod-gray-opacity-2] mt-1 text-sm">
                          {option.description}
                        </p>
                      )}
                      <span className="text-[--biqpod-gray-opacity-2] text-xs capitalize">
                        <Translate content="created at" />:{" "}
                        {new Date(option.createdAt!).toLocaleDateString()}
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
                                label: "Edit delivery option",
                                defaultIcon: allIcons.solid.faEdit,
                                click: () => handleEditDeliveryOption(option),
                              },
                              {
                                label: "Delete delivery option",
                                defaultIcon: allIcons.solid.faTrash,
                                click: () =>
                                  execAction(
                                    "delete-delivery-option",
                                    option.id!
                                  ),
                              },
                              {
                                label: option.enabled ? "Disable" : "Enable",
                                defaultIcon: option.enabled
                                  ? allIcons.solid.faToggleOn
                                  : allIcons.solid.faToggleOff,
                                click: async () => {
                                  await snapbuyApi.deliveryPrice.options.update(
                                    option.id!,
                                    {
                                      enabled: !option.enabled,
                                    }
                                  );
                                  execAction("fetch-delivery-options");
                                },
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
                    <div className="flex flex-1 items-center gap-3">
                      <CircleTip
                        onClick={() => toggleOptionExpanded(option.id!)}
                        title={
                          expandedOptions.get.has(option.id!)
                            ? "Collapse"
                            : "Expand"
                        }
                      >
                        <Icon
                          icon={allIcons.solid.faChevronDown}
                          className={`transition-transform duration-200 ${
                            expandedOptions.get.has(option.id!)
                              ? "rotate-0"
                              : "-rotate-90"
                          }`}
                        />
                      </CircleTip>
                      <h4 className="text-[--biqpod-gray-opacity-2] font-medium text-sm capitalize">
                        <Translate content="delivery prices" /> (
                        {option.prices.length})
                      </h4>
                      {option.prices.length > 0 && (
                        <div className="flex items-center gap-2">
                          <CustomCheckbox
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
                          <span className="text-[--biqpod-gray-opacity-2] text-xs">
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
                              icon={
                                isDeletingBulk.get
                                  ? allIcons.solid.faRotate
                                  : allIcons.solid.faTrashCan
                              }
                              iconClassName={tw(
                                isDeletingBulk.get && "animate-spin"
                              )}
                              disabled={isDeletingBulk.get}
                              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 px-2 py-1 rounded text-white text-xs disabled:cursor-not-allowed"
                            >
                              {isDeletingBulk.get ? (
                                <EmptyComponent>
                                  <Translate content="deleting" />
                                  ...
                                </EmptyComponent>
                              ) : (
                                <EmptyComponent>
                                  <Translate content="delete" /> (
                                  {selectedPrices.get.size})
                                </EmptyComponent>
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
                        className="text-[--biqpod-primary]"
                      />
                      <Button
                        onClick={() => handleAddDeliveryPrice(option.id!)}
                        className="px-3 rounded-full w-fit text-xs"
                        icon={allIcons.solid.faPlus}
                      >
                        <Translate content="add price" />
                      </Button>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {expandedOptions.get.has(option.id!) && (
                      <EmptyComponent>
                        <Line />
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 p-3">
                            {/* Search Field */}
                            <div className="mb-3">
                              <Field
                                inputName="delivery-price-search"
                                placeholder="Search delivery price by name or price..."
                                className="rounded-lg"
                              />
                            </div>
                            {/* Prices List */}
                            {option.prices.length === 0 ? (
                              <div className="text-[--biqpod-gray-opacity-2] py-4 text-sm text-center">
                                <Translate content="no prices added yet" />
                              </div>
                            ) : getFilteredPrices(option.prices).length ===
                              0 ? (
                              <div className="text-[--biqpod-gray-opacity-2] py-4 text-sm text-center">
                                <Translate content="no prices found" />
                              </div>
                            ) : (
                              <div className="gap-2 grid">
                                {getFilteredPrices(option.prices).map(
                                  (price) => (
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
                                        <CustomCheckbox
                                          disabled={isDeletingBulk.get}
                                          checked={selectedPrices.get.has(
                                            price.id!
                                          )}
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
                                            <HighlightText
                                              text={price.name}
                                              query={priceSearch}
                                            />
                                          </span>
                                          <span className="bg-green-500/15 ml-3 px-2 py-1 rounded-full font-medium text-green-500 text-sm">
                                            <HighlightText
                                              text={`${price.price} DA`}
                                              query={priceSearch}
                                            />
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
                                                  defaultIcon:
                                                    allIcons.solid.faEdit,
                                                  click: () =>
                                                    handleEditDeliveryPrice(
                                                      price
                                                    ),
                                                },
                                                {
                                                  id: "delete",
                                                  label: "Delete price",
                                                  defaultIcon:
                                                    allIcons.solid.faTrash,
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
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </EmptyComponent>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Scroll>
      )}
      <Line />
      <div className="flex items-center gap-2 p-2">
        <Button
          onClick={() => {
            showPopup(<ImportDeliveryPricesDirect />);
          }}
          className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
        >
          <Translate content="import" />
        </Button>
        <Button onClick={handleAddDeliveryOption} className="rounded-full">
          <Translate content="add" />
        </Button>
      </div>
    </div>
  );
};
interface UpsertStoreDeliveryOptionProps {
  storeId: string;
  deliveryOption?: Biqpod.Snapbuy.DeliveryOptions;
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
  const enabled = useCopyState<null | undefined | boolean>(false);
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
          await snapbuyApi.deliveryPrice.options.update(deliveryOption.id!, {
            name: name || "",
            description: description || "",
            type: validType,
            enabled: enabled.get || false,
          });
          showToast("Delivery option updated successfully", "success");
        } else {
          await snapbuyApi.deliveryPrice.options.add(storeId, {
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
    [formData, storeId, isEdit, deliveryOption, enabled.get]
  );
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-[500px] max-md:h-full md:max-h-[90vh] overflow-hidden">
      <CardHeaderForPopup
        title={isEdit ? "Edit Delivery Option" : "Add Delivery Option"}
      />
      <Line />
      <div className="space-y-4 p-4 h-full">
        <div>
          <label className="block mb-2 font-medium capitalize">
            <Translate content="name" />
          </label>
          <Field
            inputName="delivery-option-name"
            placeholder="e.g., Standard Delivery, Express Delivery"
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium capitalize">
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
        <div className="flex justify-between items-center gap-2 p-2">
          <label htmlFor="enable-delivery-option" className="w-full text-right">
            <Translate content="enable" /> :
          </label>
          <div className="w-full">
            <BooleanField
              id="enable-delivery-option"
              state={enabled}
              config={{
                style: "checkbox",
              }}
            />
          </div>
        </div>
      </div>
      <Line />
      <div className="flex gap-3 p-4">
        <Button
          onClick={() => {
            closePopup();
          }}
          className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          disabled={isLoading.get}
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={() => execAction("upsert-delivery-option")}
          iconClassName={tw(isLoading.get && "animate-spin")}
          icon={
            isLoading.get
              ? allIcons.solid.faRotate
              : isEdit
              ? allIcons.solid.faEdit
              : allIcons.solid.faPlus
          }
          disabled={isLoading.get}
        >
          <Translate
            content={isLoading.get ? "saving" : isEdit ? "edit" : "add"}
          />
        </Button>
      </div>
    </Card>
  );
};
interface SelectPlaceForDeliveryProps {
  deliveryOptionId: string;
  loading: boolean;
}
export const SelectPlaceForDelivery: React.FC<SelectPlaceForDeliveryProps> = ({
  deliveryOptionId,
  loading,
}) => {
  const selectedPlace = useCopyState<string | false | 0 | null | undefined>(
    "dz"
  );
  const handleAdd = () => {
    if (typeof selectedPlace.get !== "string") {
      showToast("Please select a place", "error");
      return;
    }
    execAction("create-delivery-prices", {
      deliveryOptionId,
      selectedPlace: selectedPlace.get,
    });
    closePopup();
  };
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-[400px] max-md:h-full md:max-h-[90vh] overflow-hidden">
      <CardHeaderForPopup title="Select Place" />
      <Line />
      <div className="space-y-4 p-4 h-full">
        <div>
          <label className="block mb-2 font-medium capitalize">
            <Translate content="choos a country" />:
          </label>
          <EnumField
            state={selectedPlace}
            id="select-place-popup"
            config={{
              list: placeOptions,
              search: true,
            }}
          />
        </div>
        <div className="text-[--biqpod-gray-opacity-2] text-sm">
          <Translate content="This will create delivery prices for all administrative divisions of the selected country with price 0. You can edit the prices later." />
        </div>
      </div>
      <Line />
      <div className="flex gap-3 p-4">
        <Button
          onClick={() => {
            closePopup();
          }}
          className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          disabled={loading}
        >
          <Translate content="cancel" />
        </Button>
        <Button onClick={handleAdd} disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-2">
              <CircleLoading />
              <span>Adding...</span>
            </div>
          ) : (
            <Translate content="add" />
          )}
        </Button>
      </div>
    </Card>
  );
};
interface UpsertDeliveryPriceProps {
  storeId: string;
  deliveryOptionId: string;
  deliveryPrice?: Biqpod.Snapbuy.DeliveryPrice;
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
          <label className="block mb-2 font-medium capitalize">
            <Translate content="name" />
          </label>
          <Field
            inputName="delivery-price-name"
            placeholder="e.g., Within city, Outside city, Express"
            className="p-1"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium capitalize">
            <Translate content="price da" />
          </label>
          <NumberField
            config={{
              placeholder: "Enter Price",
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
          onClick={() => {
            closePopup();
          }}
          className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          disabled={isLoading.get}
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={() => execAction("upsert-delivery-price")}
          disabled={isLoading.get}
          iconClassName={tw(isLoading.get && "animate-spin")}
          icon={
            isLoading.get
              ? allIcons.solid.faRotate
              : isEdit
              ? allIcons.solid.faEdit
              : allIcons.solid.faPlus
          }
        >
          <Translate
            content={isLoading.get ? "saving" : isEdit ? "update" : "add"}
          />
        </Button>
      </div>
    </Card>
  );
};
