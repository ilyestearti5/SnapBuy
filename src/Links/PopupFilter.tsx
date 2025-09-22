import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  EnumField,
  Icon,
  Line,
  NumberField,
  Scroll,
  TabContent,
  Translate,
} from "@biqpod/app/ui/components";
import { closePopup, getTab, setTab, useCopyState } from "@biqpod/app/ui/hooks";
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
];
export interface FilterOptionsForProduct {
  available: string | null;
  brand?: string | null;
  promoted?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
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
  const [brands, setBrands] = useState<SnapBuy.Brand[]>([]);

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
    }
  }, []);
  const tab = getTab("filter-products");
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
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
                      setTab("filter-products", null);
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
            <motion.div
              className="flex flex-col gap-2 p-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
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
                      setTab("filter-products", field.value);
                    }}
                  >
                    <motion.div
                      className="flex justify-between items-center gap-x-2 p-2 text-xl"
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
            </motion.div>
          </Scroll>
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
                identifier="filter-products"
                value="available"
                className="flex flex-col justify-center items-center gap-2 h-full"
              >
                <Card>
                  <div className="p-2 text-center">
                    <h1 className="font-bold text-2xl capitalize">
                      <Translate content="available" />
                    </h1>
                  </div>
                  <Line />
                  <div className="flex justify-center items-center p-2">
                    <EnumField
                      state={isAvailable}
                      config={{
                        list: [
                          { value: "available", content: "Available ✅" },
                          { value: "unavailable", content: "Not Available ❌" },
                          { value: "alll", content: "All Products 📋" },
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
                </Card>
              </TabContent>
              <TabContent
                identifier="filter-products"
                value="brand"
                className="flex flex-col justify-center items-center gap-2 h-full"
              >
                <Card>
                  <div className="p-2 text-center">
                    <h1 className="font-bold text-2xl capitalize">
                      <Translate content="brand" />
                    </h1>
                  </div>
                  <Line />
                  <div className="flex justify-center items-center p-2">
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
                </Card>
              </TabContent>
              <TabContent
                identifier="filter-products"
                value="promoted"
                className="flex flex-col justify-center items-center gap-2 h-full"
              >
                <Card>
                  <div className="p-2 text-center">
                    <h1 className="font-bold text-2xl capitalize">
                      <Translate content="promoted" />
                    </h1>
                  </div>
                  <Line />
                  <div className="p-2">
                    <EnumField
                      state={promoted}
                      config={{
                        list: ["promoted", "no promoted", "all"].map(
                          (status) => {
                            const emojie =
                              status === "promoted"
                                ? "📢"
                                : status === "no promoted"
                                ? "🚫"
                                : "📋";
                            return {
                              value: status,
                              content: status.toUpperCase() + " " + emojie,
                            };
                          }
                        ),
                      }}
                      id="promoted"
                    />
                  </div>
                  <Line />
                  <div className="p-2 capitalize">
                    <Translate content="is for getting the promoted product" />
                  </div>
                </Card>
              </TabContent>
              <TabContent
                identifier="filter-products"
                value="price-range"
                className="flex flex-col justify-center items-center gap-2 h-full"
              >
                <Card>
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
                </Card>
              </TabContent>
            </motion.div>
          </AnimatePresence>
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
                stiffness: 300,
              }}
            >
              <Button
                onClick={() => {
                  onChange?.(null);
                  setTab("filter-products", null);
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
              stiffness: 300,
            }}
          >
            <Button
              onClick={() => {
                onChange?.({
                  available: isAvailable.get || null,
                  brand: brand.get || null,
                  promoted: promoted.get || null,
                  minPrice: minPriceState.get || null,
                  maxPrice: maxPriceState.get || null,
                });
                isAvailable.set(false);
                brand.set("");
                promoted.set("");
                minPriceState.set(0);
                maxPriceState.set(0);
                setTab("filter-products", null);
                closePopup();
              }}
              icon={allIcons.solid.faArrowRightLong}
            >
              <Translate content="apply" />
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};
