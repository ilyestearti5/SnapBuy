import { allIcons } from "@biqpod/app/ui/apis";
import {
  ArrayField,
  Button,
  Card,
  CircleTip,
  EmptyComponent,
  EnumField,
  Field,
  Icon,
  Line,
  NumberField,
  Scroll,
  TabContent,
  Tip,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  getFieldValue,
  getTab,
  setTab,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
const filterFields = [
  {
    label: "Available",
    value: "available",
    icon: allIcons.solid.faCheck,
    description: "Is For Getting The Available Product",
  },
  {
    label: "Brand",
    value: "brand",
    icon: allIcons.solid.faBuilding,
    description: "Filter Products By Brand",
  },
  {
    label: "Promoted",
    value: "promoted",
    icon: allIcons.solid.faTag,
    description: "Is For Getting The Promoted Product",
  },
  {
    label: "Price Range",
    value: "price-range",
    icon: allIcons.solid.faMoneyBill1Wave,
    description: "Is For Getting Product With Specific Price Range",
  },
  {
    label: "Brands",
    value: "brands",
    icon: allIcons.solid.faBuilding,
  },
  {
    label: "Keys",
    value: "keys",
    icon: allIcons.solid.faKey,
    description: "Filter Products By Keys",
  },
  {
    label: "Product Type",
    value: "product-type",
    icon: allIcons.solid.faBox,
    description: "Filter By Product Type (Single/Multiple)",
  },
  {
    label: "Metadata",
    value: "metadata",
    icon: allIcons.solid.faTag,
    description: "Filter By Metadata Key",
  },
];
export interface FilterOptionsForProduct {
  available: string | null;
  brand?: string | null;
  promoted?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  brands?: string[] | null;
  keys?: string[] | null;
  productType?: string | null;
  metadataKey?: string | null;
  metadataValue?: string | null;
}
interface PopupFilterProps {
  onChange?: (props: FilterOptionsForProduct | null) => void;
  value: FilterOptionsForProduct | null;
}
export const PopupFilter = ({ onChange, value }: PopupFilterProps) => {
  const storeId = useStoreId();
  const isAvailable = useCopyState<string | Nothing>(false);
  const brand = useCopyState<string | Nothing>("");
  const promoted = useCopyState<string | Nothing>("");
  const minPriceState = useCopyState<number | null | undefined>(0);
  const maxPriceState = useCopyState<number | null | undefined>(0);
  const brandsState = useCopyState<string[]>([]);
  const keysState = useCopyState<string[] | Nothing>([]);
  const productTypeState = useCopyState<string | Nothing>("");
  const metadataKeyState = useCopyState<string>("");
  const metadataValueState = useCopyState<string>("");
  const [brands, setBrands] = useState<Souqify.Brand[]>([]);
  const brandSearchValue = getFieldValue("brand-search");
  const fuzzySearch = (text: string, search: string): boolean => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const textLower = text.toLowerCase();
    let searchIndex = 0;
    for (
      let i = 0;
      i < textLower.length && searchIndex < searchLower.length;
      i++
    ) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++;
      }
    }
    return searchIndex === searchLower.length;
  };
  useEffect(() => {
    const fetchBrands = async () => {
      if (!storeId) return;
      try {
        const fetchedBrands = await snapbuyApi.getAllBrands(storeId);
        setBrands(fetchedBrands || []);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      }
    };
    fetchBrands();
  }, [storeId]);
  useEffect(() => {
    if (value) {
      isAvailable.set(value.available);
      brand.set(value.brand || "");
      promoted.set(value.promoted || "");
      minPriceState.set(value.minPrice || 0);
      maxPriceState.set(value.maxPrice || 0);
      brandsState.set(value.brands || []);
      keysState.set(value.keys || []);
      productTypeState.set(value.productType || "");
      metadataKeyState.set(value.metadataKey || "");
      metadataValueState.set(value.metadataValue || "");
    }
  }, []);
  const tab = getTab("filter-view-products");
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {tab && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <CircleTip
                  icon={allIcons.solid.faChevronLeft}
                  onClick={() => {
                    setTab("filter-view-products", null);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.h1
            className="font-bold text-2xl"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Translate content="Filter Products" />
          </motion.h1>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.3,
            type: "spring",
            stiffness: 300,
          }}
        >
          <CircleTip
            onClick={() => {
              closePopup();
            }}
            icon={allIcons.solid.faXmark}
          />
        </motion.div>
      </div>
      <Line />
      <div className="relative flex flex-col h-full">
        <Scroll>
          <div className="flex flex-col gap-2 p-2">
            {filterFields.map((field, index) => (
              <motion.div
                key={field.value}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{
                  delay: 0.4 + index * 0.1,
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                }}
              >
                <Card
                  className="active:bg-[--biqpod-gray-opacity] hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={() => {
                    setTab("filter-view-products", field.value);
                  }}
                >
                  <motion.div
                    className="flex justify-between items-center gap-x-3 p-3 text-xl"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-x-2 text-xl">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon icon={field.icon} />
                      </motion.div>
                      <h1>{field.label}</h1>
                    </div>
                    <motion.div
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CircleTip icon={allIcons.solid.faChevronRight} />
                    </motion.div>
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </div>
        </Scroll>
        {tab && (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab || "main"}
              className={tw(
                "absolute inset-y-0 bg-[--biqpod-primary-background] border-y-[--biqpod-borders] border-l-transparent border-r-[--biqpod-borders] border-l border-solid w-full",
                tab && "translate-x-[0%]"
              )}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <TabContent
                identifier="filter-view-products"
                value="available"
                className="flex flex-col justify-center items-center gap-2 h-full"
              >
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl capitalize">
                    <Translate content="available" />
                  </h1>
                </div>
                <Line />
                <div className="p-2 w-full">
                  <EnumField
                    state={isAvailable}
                    config={{
                      list: [
                        { value: "available", content: "Available" },
                        { value: "unavailable", content: "Not Available" },
                        { value: "alll", content: "All Products" },
                      ],
                      search: true,
                    }}
                    id="available"
                  />
                </div>
                <Line />
                <div className="p-2 capitalize">
                  <Translate content="is for getting the available product" />
                </div>
              </TabContent>
              <TabContent
                identifier="filter-view-products"
                value="brand"
                className="flex flex-col justify-center items-center gap-2 h-full"
              >
                <div className="p-2 text-center">
                  <div className="p-2 text-center">
                    <h1 className="font-bold text-2xl capitalize">
                      <Translate content="brand" />
                    </h1>
                  </div>
                  <Line />
                  <div className="p-2 w-full">
                    <EnumField
                      state={brand}
                      config={{
                        list: [
                          { value: "", content: "All Brands 🏷️" },
                          ...brands
                            .filter((b) => b.id && b.name)
                            .map((b) => ({
                              value: b.id!,
                              content: `${b.name} 🏢`,
                            })),
                        ],
                        search: true,
                      }}
                      id="brand"
                    />
                  </div>
                  <Line />
                  <div className="p-2 capitalize">
                    <Translate content="filter products by brand" />
                  </div>
                </div>
              </TabContent>
              <TabContent
                identifier="filter-view-products"
                value="promoted"
                className="flex flex-col justify-center items-center gap-2 h-full"
              >
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl capitalize">
                    <Translate content="promoted" />
                  </h1>
                </div>
                <Line />
                <div className="p-2 w-full">
                  <EnumField
                    state={promoted}
                    config={{
                      list: ["promoted", "no promoted", "all"].map((status) => {
                        return {
                          value: status,
                          content: status,
                        };
                      }),
                    }}
                    id="promoted"
                  />
                </div>
                <Line />
                <div className="p-2 capitalize">
                  <Translate content="is for getting the promoted product" />
                </div>
              </TabContent>
              <TabContent
                identifier="filter-view-products"
                value="price-range"
                className="flex flex-col justify-center items-center gap-2 h-full"
              >
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl capitalize">
                    <Translate content="price range" />
                  </h1>
                </div>
                <Line />
                <div className="p-2">
                  <Translate content="is for getting product with specific price range" />
                </div>
                <Line />
                <div className="flex flex-col gap-2 p-2">
                  <div className="flex max-md:flex-col items-center gap-2">
                    <label
                      htmlFor="min-price"
                      className="block w-full md:text-right"
                    >
                      <Translate content="min price" />
                    </label>
                    <div className="w-full">
                      <NumberField
                        id="min-price"
                        state={minPriceState}
                        config={{
                          min: 0,
                          max: 1000000,
                          autoChange: true,
                          placeholder: "Enter Min Price",
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex max-md:flex-col items-center gap-2">
                    <label
                      htmlFor="max-price"
                      className="block w-full md:text-right"
                    >
                      <Translate content="max price" />
                    </label>
                    <div className="w-full">
                      <NumberField
                        id="max-price"
                        state={maxPriceState}
                        config={{
                          min: 0,
                          max: 1000000,
                          autoChange: true,
                          placeholder: "Enter Max Price",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </TabContent>
              <TabContent
                identifier="filter-view-products"
                value="brands"
                className="flex flex-col justify-center items-center h-full overflow-hidden"
              >
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl capitalize">
                    <Translate content="brands" />
                  </h1>
                </div>
                <Line />
                <div className="p-2 w-full">
                  <Field
                    inputName="brand-search"
                    placeholder="Search brands..."
                    id="brand-search"
                  />
                </div>
                <Line />
                <Scroll className="flex-1">
                  <div className="gap-2 grid grid-cols-2 md:grid-cols-3">
                    {brands
                      .filter(
                        (b) =>
                          b.name &&
                          fuzzySearch(b.name, brandSearchValue || "") &&
                          !brandsState.get.includes(b.id!)
                      )
                      .map((b) => (
                        <motion.div
                          key={b.id}
                          className="flex flex-col items-center gap-2 hover:bg-[var(--biqpod-gray-opacity)] hover:shadow-md p-2 border rounded transition-all duration-200 cursor-pointer"
                          onClick={() => {
                            brandsState.set([...brandsState.get, b.id!]);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="flex justify-center items-center h-12 overflow-hidden">
                            {b.photo ? (
                              <img
                                src={b.photo}
                                alt={b.name}
                                className="rounded max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <div className="flex justify-center items-center bg-[var(--biqpod-gray-opacity-2)] border rounded w-16 h-12">
                                <Icon icon={allIcons.solid.faBuilding} />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-sm text-center">
                            {b.name}
                          </span>
                        </motion.div>
                      ))}
                  </div>
                </Scroll>
                {brandsState.get.length > 0 && (
                  <EmptyComponent>
                    <Line />
                    <div className="p-2 font-semibold text-sm">
                      <Translate content="Selected Brands:" />
                    </div>
                    <Line />
                    <div className="flex flex-wrap gap-1 p-2">
                      {brandsState.get.map((brandId) => {
                        const brandObj = brands.find((b) => b.id === brandId);
                        return (
                          <motion.div
                            key={brandId}
                            className="flex items-center gap-2 bg-[--biqpod-primary-background] px-3 py-1 border border-[--biqpod-borders] border-solid rounded"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <span>{brandObj?.name || brandId}</span>
                            <Tip
                              icon={allIcons.solid.faXmark}
                              onClick={() => {
                                brandsState.set(
                                  brandsState.get.filter((id) => id !== brandId)
                                );
                              }}
                              className="cursor-pointer"
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </EmptyComponent>
                )}
              </TabContent>
              <TabContent
                identifier="filter-view-products"
                value="keys"
                className="flex flex-col justify-center items-center gap-2 h-full"
              >
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl capitalize">
                    <Translate content="keys" />
                  </h1>
                </div>
                <Line />
                <div className="flex justify-center items-center p-2">
                  <ArrayField state={keysState} id="product-keys" />
                </div>
                <Line />
              </TabContent>
              <TabContent
                identifier="filter-view-products"
                value="product-type"
                className="flex flex-col gap-2 h-full"
              >
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl capitalize">
                    <Translate content="product type" />
                  </h1>
                </div>
                <Line />
                <div className="p-2 w-full">
                  <EnumField
                    state={productTypeState}
                    config={{
                      list: [
                        { value: "", content: "All Types" },
                        { value: "single", content: "Single Product" },
                        { value: "multiple", content: "Multiple Products" },
                      ],
                      search: true,
                    }}
                    id="product-type"
                  />
                </div>
                <Line />
                <div className="p-2 capitalize">
                  <Translate content="filter by product type (single/multiple)" />
                </div>
              </TabContent>
              <TabContent
                identifier="filter-view-products"
                value="metadata"
                className="flex flex-col gap-2 h-full"
              >
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl capitalize">
                    <Translate content="metadata" />
                  </h1>
                </div>
                <Line />
                <div className="flex flex-col gap-2 p-2">
                  <div className="flex max-md:flex-col items-center gap-2 w-full">
                    <label
                      htmlFor="metadata-key"
                      className="block w-full md:text-right"
                    >
                      <Translate content="metadata key" />
                    </label>
                    <div className="w-full">
                      <Field
                        inputName="metadata-key"
                        value={metadataKeyState.get}
                        onChange={(e) => metadataKeyState.set(e.target.value)}
                        placeholder="Enter metadata key"
                        id="metadata-key"
                      />
                    </div>
                  </div>
                  <div className="flex max-md:flex-col items-center gap-2">
                    <label
                      htmlFor="metadata-value"
                      className="block w-full md:text-right"
                    >
                      <Translate content="metadata value" />
                    </label>
                    <div className="w-full">
                      <Field
                        inputName="metadata-value"
                        value={metadataValueState.get}
                        onChange={(e) => metadataValueState.set(e.target.value)}
                        placeholder="Enter metadata value"
                        id="metadata-value"
                      />
                    </div>
                  </div>
                </div>
              </TabContent>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <Line />
      <div className="flex justify-between items-center gap-2 p-2">
        {value && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.5,
              duration: 0.3,
              type: "spring",
            }}
            className="w-full"
          >
            <Button
              onClick={() => {
                onChange?.(null);
                setTab("filter-view-products", null);
                closePopup();
              }}
              className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
            >
              <Translate content="reset" />
            </Button>
          </motion.div>
        )}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.6,
            duration: 0.3,
            type: "spring",
          }}
          className="w-full"
        >
          <Button
            onClick={() => {
              onChange?.({
                available: isAvailable.get || null,
                brand: brand.get || null,
                promoted: promoted.get || null,
                minPrice: minPriceState.get || null,
                maxPrice: maxPriceState.get || null,
                brands: brandsState.get || null,
                keys: keysState.get || null,
                productType: productTypeState.get || null,
                metadataKey: metadataKeyState.get || null,
                metadataValue: metadataValueState.get || null,
              });
              isAvailable.set(false);
              brand.set("");
              promoted.set("");
              minPriceState.set(0);
              maxPriceState.set(0);
              brandsState.set([]);
              keysState.set([]);
              productTypeState.set("");
              metadataKeyState.set("");
              metadataValueState.set("");
              setTab("filter-view-products", null);
              closePopup();
            }}
            icon={allIcons.solid.faArrowRightLong}
          >
            <Translate content="apply" />
          </Button>
        </motion.div>
      </div>
    </Card>
  );
};
