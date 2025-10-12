import {
  Scroll,
  Card,
  Translate,
  Line,
  Button,
  RangeField,
  Icon,
  CircleTip,
  CardWait,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { tw } from "@biqpod/app/ui/utils";
import { useStoreId } from "../../utils";
import { DataTypes, snapbuyApi } from "../../apis";
import { confirm, useAsyncMemo, useCopyState } from "@biqpod/app/ui/hooks";
import { Nothing, State } from "@biqpod/app/ui/types";
export const Plans = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const storeId = useStoreId();
  const storeInfo = useAsyncMemo(async () => {
    if (!storeId) return null;
    return await snapbuyApi.getStore(storeId);
  }, [storeId]);

  const usageData = useAsyncMemo(async () => {
    if (storeId) {
      return await snapbuyApi.usage.get({ storeId });
    } else {
      return null;
    }
  }, [storeId]);

  const pricesData = useAsyncMemo(async () => {
    return await snapbuyApi.usage.getPrices();
  }, []);

  // Create copy states for each usage type
  const photosUsage = useCopyState<number | Nothing>(75);
  const orderUsage = useCopyState<number | Nothing>(50);
  const customersUsage = useCopyState<number | Nothing>(20);
  const productsUsage = useCopyState<number | Nothing>(85);
  const brandsUsage = useCopyState<number | Nothing>(30);
  const collectionsUsage = useCopyState<number | Nothing>(60);
  const packsUsage = useCopyState<number | Nothing>(15);
  const couponUsage = useCopyState<number | Nothing>(25);
  const variablesUsage = useCopyState<number | Nothing>(5);

  // Create a separate mapping object for state management using DataTypes
  const usageStates: Partial<Record<DataTypes, State<number | Nothing>>> = {
    photos: photosUsage,
    orders: orderUsage,
    customers: customersUsage,
    products: productsUsage,
    brands: brandsUsage,
    collections: collectionsUsage,
    packs: packsUsage,
    coupons: couponUsage,
    vars: variablesUsage,
  };
  const calculateTotalCost = () => {
    if (!pricesData) return 0;
    return pricesData.reduce((total, price) => {
      const state = usageStates[price.type];
      const current = usageData?.[price.type] || 0;
      const selectedValue =
        state && typeof state.get === "number" ? state.get : current;
      const unitSize = 100; // Default unit size
      const unitsUsed = selectedValue / unitSize;
      return total + unitsUsed * (price.extraPrice || 0) * 250;
    }, 0);
  };
  const handlePayment = async () => {
    if (!storeId) {
      return;
    }
    const usages: Partial<Record<DataTypes, number>> = {};
    for (const price of pricesData || []) {
      const state = usageStates[price.type];
      const current = usageData?.[price.type] || 0;
      if (state && typeof state.get === "number") {
        usages[price.type] = state.get;
      } else {
        usages[price.type] = current;
      }
    }
    const isYes = await confirm({
      message: "Are you sure you want to proceed with the payment?",
      title: "Confirm Payment",
      detail: `${Object.entries(usages)
        .map(([type, value]) => {
          const price = pricesData?.find((p) => p.type === type);
          return `* ${type}: ${value} / **(${
            value * (price?.extraPrice || 0)
          })** DA`;
        })
        .join("\n")}\n* **Total Cost**: ${calculateTotalCost().toFixed(2)} DA`,
      type: "question",
    });
    if (isYes) {
      await snapbuyApi.payUsages(storeId, usages);
    }
  };

  const totalDetected = () => {
    var total = 0;
    console.log("---------------------------");
    for (const price of pricesData || []) {
      const current = usageData?.[price.type] || 0;
      total += current * price.extraPrice;
    }
    return total;
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
              <span>{totalDetected().toFixed(2)}DA</span>
            </div>
          </div>
          <Line />
          <div className="p-4">
            <div className="space-y-4">
              {!pricesData ? (
                <div className="text-gray-500 text-center">
                  Loading prices data...
                </div>
              ) : (
                pricesData.map((price, index) => {
                  const current = usageData?.[price.type] || 0;
                  const cost = current * (price.extraPrice || 0);
                  return (
                    <div key={price.type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg capitalize">
                          <Translate content={`${price.type} usage`} />
                        </span>
                        {usageData === null && (
                          <CardWait
                            className={tw(
                              "h-[30px] rounded-2xl",
                              index % 2 === 0 ? "w-[60px]" : "w-[120px]"
                            )}
                          />
                        )}
                        {usageData !== null && (
                          <div className="text-right">
                            <span className="text-gray-500 text-sm">
                              {current} used x {price.extraPrice} DA
                            </span>
                            <div className="font-medium text-sm">
                              {cost.toFixed(2)} DA
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
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
                    {!pricesData ? (
                      <div className="text-gray-500 text-center">
                        Loading prices data...
                      </div>
                    ) : (
                      pricesData.map((price) => {
                        const state = usageStates[price.type];
                        const current = usageData?.[price.type] || 0;
                        const selectedValue =
                          typeof state?.get === "number" ? state.get : current;
                        const cost = selectedValue * (price.extraPrice || 0);
                        const unitInfo = `1 ${price.type} per unit`;

                        return (
                          <div key={price.type} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-lg capitalize">
                                  <Translate content={`${price.type} usage`} />
                                </span>
                                <div
                                  className="relative cursor-help"
                                  onMouseEnter={() =>
                                    setTooltipVisible(price.type)
                                  }
                                  onMouseLeave={() => setTooltipVisible(null)}
                                >
                                  <Icon
                                    icon={allIcons.solid.faCircleInfo}
                                    iconClassName="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                                  />
                                  {tooltipVisible === price.type && (
                                    <div
                                      className="top-1/2 left-full z-10 absolute shadow-lg ml-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap -translate-y-1/2 transform"
                                      style={{
                                        backgroundColor:
                                          "var(--biqpod-gray-opacity)",
                                        backdropFilter: "blur(8px)",
                                        color: "var(--biqpod-text-color)",
                                      }}
                                    >
                                      <Translate content={unitInfo} />
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
                            {state && (
                              <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                  <RangeField
                                    state={state}
                                    id={`${price.type.replace(/\s+/g, "-")}`}
                                    config={{ min: 0, max: 200 }}
                                  />
                                </div>
                                <span className="w-16 text-sm text-center">
                                  {selectedValue}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {usageData !== null && (
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
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </Scroll>
  );
};
