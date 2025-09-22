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
import { useCopyState } from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
export const Plans = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  // Create copy states for each usage type
  const photosUsage = useCopyState<number | false | "" | null | undefined>(0);
  const orderUsage = useCopyState<number | false | "" | null | undefined>(0);
  const customersUsage = useCopyState<number | false | "" | null | undefined>(
    0
  );
  const productsUsage = useCopyState<number | false | "" | null | undefined>(0);
  const storesUsage = useCopyState<number | false | "" | null | undefined>(0);
  const brandsUsage = useCopyState<number | false | "" | null | undefined>(0);
  const collectionsUsage = useCopyState<number | false | "" | null | undefined>(
    0
  );
  const packsUsage = useCopyState<number | false | "" | null | undefined>(0);
  const deliveryUsage = useCopyState<number | false | "" | null | undefined>(0);
  const couponUsage = useCopyState<number | false | "" | null | undefined>(0);
  const variablesUsage = useCopyState<number | false | "" | null | undefined>(
    0
  );
  const usageItems = [
    {
      name: "photos usage",
      current: 75,
      limit: 100,
      state: photosUsage,
      price: 0.5 * 250,
      unitInfo: "100 photos per unit (images, banners, product photos)",
    },
    {
      name: "order usage",
      current: 50,
      limit: 100,
      state: orderUsage,
      price: 1 * 250,
      unitInfo: "50 orders per unit (customer purchases, transactions)",
    },
    {
      name: "customers usage",
      current: 20,
      limit: 100,
      state: customersUsage,
      price: 2 * 250,
      unitInfo: "25 customers per unit (registered users, accounts)",
    },
    {
      name: "products usage",
      current: 85,
      limit: 100,
      state: productsUsage,
      price: 1.5 * 250,
      unitInfo: "200 products per unit (items, inventory, catalog)",
    },
    {
      name: "stores usage",
      current: 10,
      limit: 100,
      state: storesUsage,
      price: 5 * 250,
      unitInfo: "2 stores per unit (shop locations, branches)",
    },
    {
      name: "brands usage",
      current: 30,
      limit: 100,
      state: brandsUsage,
      price: 3 * 250,
      unitInfo: "10 brands per unit (product lines, manufacturers)",
    },
    {
      name: "collections usage",
      current: 60,
      limit: 100,
      state: collectionsUsage,
      price: 2.5 * 250,
      unitInfo: "50 collections per unit (product categories, groups)",
    },
    {
      name: "packs usage",
      current: 15,
      limit: 100,
      state: packsUsage,
      price: 4 * 250,
      unitInfo: "20 packs per unit (product bundles, packages)",
    },
    {
      name: "delivery prices/options usage",
      current: 40,
      limit: 100,
      state: deliveryUsage,
      price: 1.8 * 250,
      unitInfo: "30 delivery options per unit (shipping methods, zones)",
    },
    {
      name: "coupon usage",
      current: 25,
      limit: 100,
      state: couponUsage,
      price: 0.8 * 250,
      unitInfo: "100 coupons per unit (discount codes, promotions)",
    },
    {
      name: "variables usage",
      current: 5,
      limit: 100,
      state: variablesUsage,
      price: 0.3 * 250,
      unitInfo: "500 variables per unit (custom fields, settings)",
    },
  ];
  const calculateTotalCost = () => {
    return usageItems.reduce((total, item) => {
      const value = typeof item.state.get === "number" ? item.state.get : 0;
      return total + value * item.price;
    }, 0);
  };
  const handlePurchase = () => {
    // Handle purchase logic here
    const purchases = usageItems.reduce((acc, item) => {
      const value = typeof item.state.get === "number" ? item.state.get : 0;
      if (value > 0) {
        acc[item.name] = value;
      }
      return acc;
    }, {} as Record<string, number>);
    console.log("Purchasing:", purchases);
    alert(`Total cost: ${calculateTotalCost().toFixed(2)} DA`);
  };
  return (
    <Scroll>
      <div className="p-2">
        <Card className="w-full">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <h1 className="font-bold text-2xl capitalize">
                <Translate content="usage statistics" />
              </h1>
            </div>
          </div>
          <Line />
          <div className="p-4">
            <div className="space-y-4">
              {usageItems.map((item, index) => {
                const percentage = (item.current / item.limit) * 100;
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg capitalize">
                        <Translate content={item.name} />
                      </span>
                      <span className="text-gray-500 text-sm">
                        {item.current} / {item.limit}
                      </span>
                    </div>
                    <div className="relative bg-gray-200 rounded-full h-[3px] overflow-hidden">
                      <motion.div
                        className="top-0 left-0 absolute bg-[--biqpod-primary] rounded-full h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
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
                    <Translate content="Purchase Additional Usage" />
                  </h2>
                  <div className="space-y-4">
                    {usageItems.map((item) => {
                      const currentPurchase =
                        typeof item.state.get === "number" ? item.state.get : 0;
                      const totalCost = currentPurchase * item.price;
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
                              {item.price} <Translate content="DA per unit" />
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <RangeField
                                state={item.state}
                                id={`${item.name.replace(/\s+/g, "-")}`}
                                config={{ min: 0, max: 100 }}
                              />
                            </div>
                            <span className="w-16 text-sm text-center">
                              {currentPurchase}
                            </span>
                            <span className="w-20 text-gray-500 text-sm text-right">
                              {totalCost.toFixed(2)} DA
                            </span>
                          </div>
                          <div className="text-gray-400 text-xs">
                            {currentPurchase > 0 &&
                              `${currentPurchase} units = ${totalCost.toFixed(
                                2
                              )} DA`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {calculateTotalCost() > 0 && (
                    <div className="bg-gray-50 mt-6 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-lg">
                          <Translate content="Total Cost:" />
                        </span>
                        <span className="font-bold text-[--biqpod-primary] text-xl">
                          {calculateTotalCost().toFixed(2)} DA
                        </span>
                      </div>
                      <Button
                        onClick={handlePurchase}
                        className="bg-[--biqpod-success] hover:bg-green-600 w-full text-white"
                      >
                        <Translate content="Purchase Now" />
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
