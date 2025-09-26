import {
  Scroll,
  Card,
  Translate,
  Line,
  Button,
  RangeField,
  Icon,
  CircleTip,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { tw } from "@biqpod/app/ui/utils";
import { useStoreId } from "../../utils";
import { snapbuyApi } from "../../apis";
import { useAsyncMemo, useCopyState } from "@biqpod/app/ui/hooks";
export const Plans = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const storeId = useStoreId();
  const storeInfo = useAsyncMemo(async () => {
    if (!storeId) return null;
    return await snapbuyApi.getStore(storeId);
  }, [storeId]);

  // Create copy states for each usage type
  const photosUsage = useCopyState<number | false | "" | null | undefined>(75);
  const orderUsage = useCopyState<number | false | "" | null | undefined>(50);
  const customersUsage = useCopyState<number | false | "" | null | undefined>(
    20
  );
  const productsUsage = useCopyState<number | false | "" | null | undefined>(
    85
  );
  const storesUsage = useCopyState<number | false | "" | null | undefined>(10);
  const brandsUsage = useCopyState<number | false | "" | null | undefined>(30);
  const collectionsUsage = useCopyState<number | false | "" | null | undefined>(
    60
  );
  const packsUsage = useCopyState<number | false | "" | null | undefined>(15);
  const deliveryUsage = useCopyState<number | false | "" | null | undefined>(
    40
  );
  const couponUsage = useCopyState<number | false | "" | null | undefined>(25);
  const variablesUsage = useCopyState<number | false | "" | null | undefined>(
    5
  );
  const usageItems = [
    {
      name: "photos usage",
      current: 75,
      unitSize: 100,
      price: 0.5 * 250,
      unitInfo: "100 photos per unit (images, banners, product photos)",
      state: photosUsage,
    },
    {
      name: "order usage",
      current: 50,
      unitSize: 50,
      price: 1 * 250,
      unitInfo: "50 orders per unit (customer purchases, transactions)",
      state: orderUsage,
    },
    {
      name: "customers usage",
      current: 20,
      unitSize: 25,
      price: 2 * 250,
      unitInfo: "25 customers per unit (registered users, accounts)",
      state: customersUsage,
    },
    {
      name: "products usage",
      current: 85,
      unitSize: 200,
      price: 1.5 * 250,
      unitInfo: "200 products per unit (items, inventory, catalog)",
      state: productsUsage,
    },
    {
      name: "stores usage",
      current: 10,
      unitSize: 2,
      price: 5 * 250,
      unitInfo: "2 stores per unit (shop locations, branches)",
      state: storesUsage,
    },
    {
      name: "brands usage",
      current: 30,
      unitSize: 10,
      price: 3 * 250,
      unitInfo: "10 brands per unit (product lines, manufacturers)",
      state: brandsUsage,
    },
    {
      name: "collections usage",
      current: 60,
      unitSize: 50,
      price: 2.5 * 250,
      unitInfo: "50 collections per unit (product categories, groups)",
      state: collectionsUsage,
    },
    {
      name: "packs usage",
      current: 15,
      unitSize: 20,
      price: 4 * 250,
      unitInfo: "20 packs per unit (product bundles, packages)",
      state: packsUsage,
    },
    {
      name: "delivery prices/options usage",
      current: 40,
      unitSize: 30,
      price: 1.8 * 250,
      unitInfo: "30 delivery options per unit (shipping methods, zones)",
      state: deliveryUsage,
    },
    {
      name: "coupon usage",
      current: 25,
      unitSize: 100,
      price: 0.8 * 250,
      unitInfo: "100 coupons per unit (discount codes, promotions)",
      state: couponUsage,
    },
    {
      name: "variables usage",
      current: 5,
      unitSize: 500,
      price: 0.3 * 250,
      unitInfo: "500 variables per unit (custom fields, settings)",
      state: variablesUsage,
    },
  ];
  const calculateTotalCost = () => {
    return usageItems.reduce((total, item) => {
      const selectedValue =
        typeof item.state.get === "number" ? item.state.get : item.current;
      const unitsUsed = selectedValue / item.unitSize;
      return total + unitsUsed * item.price;
    }, 0);
  };
  const handlePayment = () => {
    // Handle payment logic here
  };
  return (
    <Scroll>
      <div className="p-2">
        <Card className="w-full">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-bold text-2xl capitalize">
                  <Translate content="payment plan" />
                </h1>
                {storeInfo && (
                  <p className="mt-1 text-gray-600 text-sm">
                    <Translate content="for store" />: {storeInfo.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Line />
          <div className="p-4">
            <div className="space-y-4">
              {usageItems.map((item) => {
                const cost = (item.current / item.unitSize) * item.price;
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg capitalize">
                        <Translate content={item.name} />
                      </span>
                      <div className="text-right">
                        <span className="text-gray-500 text-sm">
                          {item.current} used
                        </span>
                        <div className="font-medium text-sm">
                          {cost.toFixed(2)} DA
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Line />
          <div className="flex justify-center items-center p-3">
            <CircleTip
              onClick={() => setIsExpanded(!isExpanded)}
              icon={allIcons.solid.faChevronDown}
              iconClassName={tw(isExpanded && "rotate-180")}
            />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Line />
                <div className="p-4">
                  <h2 className="mb-4 font-bold text-xl">
                    <Translate content="Payment Breakdown" />
                  </h2>
                  <div className="space-y-4">
                    {usageItems.map((item) => {
                      const selectedValue =
                        typeof item.state.get === "number"
                          ? item.state.get
                          : item.current;
                      const cost = (selectedValue / item.unitSize) * item.price;
                      return (
                        <div key={item.name} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-lg capitalize">
                                <Translate content={item.name} />
                              </span>
                              <div
                                className="relative cursor-help"
                                onMouseEnter={() =>
                                  setTooltipVisible(item.name)
                                }
                                onMouseLeave={() => setTooltipVisible(null)}
                              >
                                <Icon
                                  icon={allIcons.solid.faCircleInfo}
                                  iconClassName="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                                />
                                {tooltipVisible === item.name && (
                                  <div
                                    className="top-1/2 left-full z-10 absolute shadow-lg ml-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap -translate-y-1/2 transform"
                                    style={{
                                      backgroundColor:
                                        "var(--biqpod-gray-opacity)",
                                      backdropFilter: "blur(8px)",
                                      color: "var(--biqpod-text-color)",
                                    }}
                                  >
                                    <Translate content={item.unitInfo} />
                                    <div
                                      className="top-1/2 right-full absolute border-4 border-transparent -translate-y-1/2 transform"
                                      style={{
                                        borderRightColor:
                                          "var(--biqpod-gray-opacity)",
                                      }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-gray-500 text-sm">
                              {cost.toFixed(2)} DA
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <RangeField
                                state={item.state}
                                id={`${item.name.replace(/\s+/g, "-")}`}
                                config={{ min: 0, max: 200 }}
                              />
                            </div>
                            <span className="w-16 text-sm text-center">
                              {selectedValue}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-[--biqpod-primary-background] mt-6 p-4 border border-[--biqpod-borders] border-solid rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-lg">
                        <Translate content="Total Cost:" />
                      </span>
                      <span className="font-bold text-[--biqpod-primary] text-xl">
                        {calculateTotalCost().toFixed(2)} DA
                      </span>
                    </div>
                    <Button
                      onClick={handlePayment}
                      className="bg-[--biqpod-success] hover:bg-green-600 w-full text-white"
                    >
                      <Translate content="Pay Now" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </Scroll>
  );
};
