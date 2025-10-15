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
  CircleLoading,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { tw } from "@biqpod/app/ui/utils";
import { useStoreId } from "../../utils";
import { DataTypes, snapbuyApi } from "../../apis";
import { confirm, useAsyncMemo, useCopyState } from "@biqpod/app/ui/hooks";
import { Nothing, State } from "@biqpod/app/ui/types";
export const Plans = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(
    new Set()
  );
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
  const paymentHistory = useAsyncMemo(async () => {
    if (storeId) {
      return await snapbuyApi.usage.getPayments(storeId);
    }
    return null;
  }, [storeId]);
  const currentPayment = useAsyncMemo(async () => {
    if (storeId) {
      return await snapbuyApi.usage.getCurrentPayment(storeId);
    }
    return null;
  }, [storeId]);
  // Create copy states for each usage type with values from current payment
  const photosUsage = useCopyState<number | Nothing>(0);
  const orderUsage = useCopyState<number | Nothing>(0);
  const customersUsage = useCopyState<number | Nothing>(0);
  const productsUsage = useCopyState<number | Nothing>(0);
  const brandsUsage = useCopyState<number | Nothing>(0);
  const collectionsUsage = useCopyState<number | Nothing>(0);
  const packsUsage = useCopyState<number | Nothing>(0);
  const couponUsage = useCopyState<number | Nothing>(0);
  const variablesUsage = useCopyState<number | Nothing>(0);
  useEffect(() => {
    const meta = currentPayment?.meta || {};
    const get = (type: DataTypes) => {
      return meta[type] !== undefined
        ? Number(meta[type])
        : usageData?.[type] || 0;
    };
    photosUsage.set(get("photos"));
    orderUsage.set(get("orders"));
    customersUsage.set(get("customers"));
    productsUsage.set(get("products"));
    brandsUsage.set(get("brands"));
    collectionsUsage.set(get("collections"));
    packsUsage.set(get("packs"));
    couponUsage.set(get("coupons"));
    variablesUsage.set(get("vars"));
  }, [currentPayment, usageData]);
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
      return total + selectedValue * (price.extraPrice || 0);
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
      try {
        setIsPaymentLoading(true);
        await snapbuyApi.payUsages(storeId, usages);
      } catch (error) {
      } finally {
        setIsPaymentLoading(false);
      }
    }
  };
  const totalDetected = () => {
    var total = 0;
    for (const price of pricesData || []) {
      const current = usageData?.[price.type] || 0;
      total += current * price.extraPrice;
    }
    return total;
  };
  const togglePaymentExpansion = (paymentId: string) => {
    setExpandedPayments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };
  const ranges: Record<DataTypes, { min: number; max: number }> = {
    photos: { min: 0, max: 10000 },
    orders: { min: 0, max: 10000 },
    customers: { min: 0, max: 10000 },
    products: { min: 0, max: 5000 },
    brands: { min: 0, max: 500 },
    collections: { min: 0, max: 500 },
    packs: { min: 0, max: 1000 },
    coupons: { min: 0, max: 1000 },
    vars: { min: 0, max: 1000 },
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

          {/* Subscription End Date Progress */}
          {currentPayment?.meta?.endAt && (
            <>
              <Line />
              <div className="p-4">
                <div className="bg-[--biqpod-secondary-background] p-4 border border-[--biqpod-borders] border-solid rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={allIcons.solid.faCalendarAlt}
                        iconClassName="text-blue-500"
                      />
                      <span className="font-medium">
                        <Translate content="Subscription Status" />
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      <Translate content="Ends:" />{" "}
                      {new Date(Number(currentPayment.meta.endAt)).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Calculate subscription progress values */}
                  {(() => {
                    const now = Date.now();
                    const endTime = Number(currentPayment.meta.endAt);
                    const startTime = currentPayment.createdAt ? new Date(currentPayment.createdAt).getTime() : now;
                    const totalDuration = endTime - startTime;
                    const elapsed = now - startTime;
                    const remaining = Math.max(0, endTime - now);
                    const progressPercentage = totalDuration > 0 ? Math.min((elapsed / totalDuration) * 100, 100) : 0;
                    const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
                    const isExpired = now >= endTime;

                    // Determine colors based on status
                    const bgColor = isExpired ? 'bg-red-100' : progressPercentage >= 80 ? 'bg-orange-100' : 'bg-green-100';
                    const barColor = isExpired ? 'bg-red-500' : progressPercentage >= 80 ? 'bg-orange-500' : 'bg-green-500';
                    const textColor = isExpired ? 'text-red-600' : progressPercentage >= 80 ? 'text-orange-600' : 'text-green-600';

                    // Determine remaining time text
                    let remainingText = '';
                    if (isExpired) {
                      remainingText = 'Expired';
                    } else if (daysRemaining === 1) {
                      remainingText = '1 day remaining';
                    } else if (daysRemaining > 0) {
                      remainingText = `${daysRemaining} days remaining`;
                    } else {
                      remainingText = 'Less than 1 day remaining';
                    }

                    return (
                      <div>
                        <div className="w-full">
                          <div className={`w-full h-3 rounded-full ${bgColor}`}>
                            <div
                              className={`h-3 rounded-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-gray-500 text-xs">
                              {remainingText === 'Expired' || remainingText === '1 day remaining' || remainingText === 'Less than 1 day remaining' ? (
                                <Translate content={remainingText} />
                              ) : (
                                remainingText
                              )}
                            </span>
                            <span className={`text-xs font-medium ${textColor}`}>
                              {progressPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>
            </>
          )}

          <Line />
          <div className="p-4">
            <div className="space-y-4">
              {!pricesData ? (
                <div className="text-gray-500 text-center">
                  Loading prices data...
                </div>
              ) : !currentPayment ? (
                <div className="py-8 text-center">
                  <Icon
                    icon={allIcons.solid.faChartBar}
                    iconClassName="mx-auto mb-3 text-4xl text-gray-300"
                  />
                  <p className="text-gray-500">
                    <Translate content="No active payment plan found" />
                  </p>
                  <p className="mt-1 text-gray-400 text-sm">
                    <Translate content="Purchase a plan to see your usage statistics" />
                  </p>
                </div>
              ) : (
                pricesData.map((price, index) => {
                  const current = usageData?.[price.type] || 0;
                  const cost = current * (price.extraPrice || 0);
                  // Get usage limits from current payment meta data
                  const getUsageLimit = (type: string): number | null => {
                    if (currentPayment?.meta && currentPayment.meta[type]) {
                      return Number(currentPayment.meta[type]);
                    }
                    return null;
                  };
                  const limit = getUsageLimit(price.type);
                  const percentage = limit
                    ? Math.min((current / limit) * 100, 100)
                    : 0;
                  // Determine progress bar color based on usage percentage
                  const getProgressColor = (percent: number) => {
                    if (percent >= 80) return "bg-red-500"; // High usage - red
                    if (percent >= 50) return "bg-orange-500"; // Medium usage - orange
                    return "bg-blue-500"; // Low usage - blue
                  };
                  const getProgressBgColor = (percent: number) => {
                    if (percent >= 80) return "bg-red-100"; // High usage - light red bg
                    if (percent >= 50) return "bg-orange-100"; // Medium usage - light orange bg
                    return "bg-blue-100"; // Low usage - light blue bg
                  };
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
                      {/* Progress Bar */}
                      {usageData !== null && limit !== null && (
                        <div className="w-full">
                          <div
                            className={`w-full h-2 rounded-full ${getProgressBgColor(
                              percentage
                            )}`}
                          >
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                                percentage
                              )}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-gray-500 text-xs">
                              {current} / {limit}
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                percentage >= 80
                                  ? "text-red-600"
                                  : percentage >= 50
                                  ? "text-orange-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}
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
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-xl">
                      <Translate content="Payment Breakdown" />
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {!pricesData ? (
                      <div className="text-gray-500 text-center">
                        Loading prices data...
                      </div>
                    ) : (
                      pricesData.map((price) => {
                        const range = ranges[price.type];
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
                              <div className="space-y-3">
                                {/* Range Field */}
                                <div className="flex items-center space-x-4">
                                  <div className="flex-1">
                                    <RangeField
                                      state={state}
                                      id={`${price.type.replace(/\s+/g, "-")}`}
                                      config={range}
                                    />
                                  </div>
                                  <div className="w-20">
                                    <input
                                      type="number"
                                      min="0"
                                      max={10000000000}
                                      value={selectedValue || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "") {
                                          state.set(0);
                                        } else {
                                          const numValue = parseInt(value) || 0;
                                          state.set(numValue);
                                        }
                                      }}
                                      className="bg-[--biqpod-primary-background] px-2 py-1 border border-[--biqpod-borders] focus:border-transparent border-solid rounded focus:outline-none focus:ring-[--biqpod-primary] focus:ring-1 w-full text-[--biqpod-text-color] text-base text-center"
                                    />
                                  </div>
                                </div>

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
        {/* Payment History Section */}
        <Card className="mt-4 w-full">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">
                <Translate content="Payment History" />
              </h2>
              <CircleTip
                onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                icon={allIcons.solid.faHistory}
                iconClassName="text-gray-600"
              />
            </div>
          </div>
          <AnimatePresence>
            {showPaymentHistory && (
              <EmptyComponent>
                <Line />
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-4">
                    {!paymentHistory ? (
                      <div className="text-center">
                        <CircleLoading />
                        <p className="mt-2 text-gray-500 text-sm">
                          <Translate content="Loading payment history..." />
                        </p>
                      </div>
                    ) : paymentHistory.length === 0 ? (
                      <div className="py-8 text-center">
                        <Icon
                          icon={allIcons.solid.faReceipt}
                          iconClassName="mx-auto mb-3 text-4xl text-gray-300"
                        />
                        <p className="text-gray-500">
                          <Translate content="No payment history found" />
                        </p>
                        <p className="mt-1 text-gray-400 text-sm">
                          <Translate content="Your payment transactions will appear here" />
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paymentHistory.map((payment, index) => {
                          const paymentId =
                            payment.payoutId || `payment-${index}`;
                          const isExpanded = expandedPayments.has(paymentId);
                          return (
                            <div
                              key={paymentId}
                              className="bg-[--biqpod-secondary-background] p-3 border border-[--biqpod-borders] border-solid rounded-lg"
                            >
                              {/* Compact Payment Info */}
                              <div className="flex justify-between items-center">
                                <div className="flex flex-1 items-center gap-2">
                                  <Icon
                                    icon={
                                      payment.status?.includes("success") ||
                                      payment.status?.includes("paid") ||
                                      payment.status?.includes("complete")
                                        ? allIcons.solid.faCheckCircle
                                        : allIcons.solid.faClock
                                    }
                                    iconClassName={
                                      payment.status?.includes("success") ||
                                      payment.status?.includes("paid") ||
                                      payment.status?.includes("complete")
                                        ? "text-green-500 text-sm"
                                        : "text-yellow-500 text-sm"
                                    }
                                  />
                                  <div className="flex-1">
                                    <span className="font-medium text-sm">
                                      <Translate
                                        content={
                                          payment.status?.includes("success") ||
                                          payment.status?.includes("paid") ||
                                          payment.status?.includes("complete")
                                            ? "Payment Completed"
                                            : "Payment Processing"
                                        }
                                      />
                                    </span>
                                    {(payment.payedAt || payment.createdAt) && (
                                      <p className="mt-1 text-gray-500 text-xs">
                                        {new Date(
                                          payment.payedAt || payment.createdAt!
                                        ).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <span className="font-bold text-[--biqpod-primary]">
                                      {payment.amount?.toFixed(2)} DA
                                    </span>
                                    {payment.status && (
                                      <p
                                        className={`text-xs mt-1 capitalize ${
                                          payment.status.includes("success") ||
                                          payment.status.includes("paid") ||
                                          payment.status.includes("complete")
                                            ? "text-green-500"
                                            : payment.status.includes(
                                                "pending"
                                              ) ||
                                              payment.status.includes(
                                                "processing"
                                              )
                                            ? "text-yellow-500"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {payment.status}
                                      </p>
                                    )}
                                  </div>
                                  <CircleTip
                                    onClick={() =>
                                      togglePaymentExpansion(paymentId)
                                    }
                                    icon={allIcons.solid.faChevronDown}
                                    iconClassName={tw(
                                      "text-gray-400 text-sm transition-transform duration-200",
                                      isExpanded && "rotate-180"
                                    )}
                                  />
                                </div>
                              </div>
                              {/* Expanded Payment Details */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-3 pt-3 border-[--biqpod-borders] border-t">
                                      {/* Payment ID */}
                                      {payment.payoutId && (
                                        <p className="mb-2 text-gray-400 text-xs">
                                          <Translate content="Payment ID:" />{" "}
                                          {payment.payoutId}
                                        </p>
                                      )}
                                      {/* Full Date and Time */}
                                      {(payment.payedAt ||
                                        payment.createdAt) && (
                                        <p className="mb-2 text-gray-500 text-xs">
                                          <Translate content="Date:" />{" "}
                                          {new Date(
                                            payment.payedAt ||
                                              payment.createdAt!
                                          ).toLocaleDateString()}{" "}
                                          -{" "}
                                          {new Date(
                                            payment.payedAt ||
                                              payment.createdAt!
                                          ).toLocaleTimeString()}
                                        </p>
                                      )}
                                      {/* Payment Type */}
                                      {payment.type && (
                                        <div className="mb-2">
                                          <span className="bg-[--biqpod-primary-background] px-2 py-1 rounded text-xs">
                                            <Translate content="Type:" />{" "}
                                            {payment.type}
                                          </span>
                                        </div>
                                      )}
                                      {/* Transaction Note */}
                                      {payment.transaction?.note && (
                                        <p className="mb-2 text-gray-600 text-xs">
                                          <Translate content="Note:" />{" "}
                                          {payment.transaction.note}
                                        </p>
                                      )}
                                      {/* Subscription Info */}
                                      {payment.subscription && (
                                        <div className="mb-2">
                                          <p className="text-gray-600 text-xs">
                                            <Translate content="Subscription:" />{" "}
                                            {payment.subscription.label}
                                          </p>
                                          <p className="text-gray-500 text-xs">
                                            <Translate content="Duration:" />{" "}
                                            {payment.subscription.duration /
                                              60 /
                                              60 /
                                              24}{" "}
                                            days
                                          </p>
                                        </div>
                                      )}

                                      {/* Subscription End Date */}
                                      {payment.meta?.endAt && (
                                        <div className="mb-2">
                                          <p className="text-gray-600 text-xs">
                                            <Translate content="Subscription End Date:" />{" "}
                                            {new Date(Number(payment.meta.endAt)).toLocaleDateString()}{" "}
                                            {new Date(Number(payment.meta.endAt)).toLocaleTimeString()}
                                          </p>
                                          {(() => {
                                            const now = Date.now();
                                            const endTime = Number(payment.meta.endAt);
                                            const wasExpired = now >= endTime;
                                            
                                            return (
                                              <div className="mt-1">
                                                <span
                                                  className={`px-2 py-1 rounded text-xs ${
                                                    wasExpired
                                                      ? "bg-red-500/25 text-red-500"
                                                      : "bg-green-500/25 text-green-500"
                                                  }`}
                                                >
                                                  <Translate content={wasExpired ? "Expired" : "Active"} />
                                                </span>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                      {/* Product Info */}
                                      {payment.product && (
                                        <div className="mb-2">
                                          <p className="text-gray-600 text-xs">
                                            <Translate content="Product:" />{" "}
                                            {payment.product.name}
                                          </p>
                                        </div>
                                      )}
                                      {/* Usage Breakdown */}
                                      {payment.meta &&
                                        Object.keys(payment.meta).length >
                                          0 && (
                                          <div className="mb-2">
                                            <p className="mb-1 text-gray-600 text-xs">
                                              <Translate content="Usage breakdown:" />
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                              {Object.entries(payment.meta).map(
                                                ([type, value]) => {
                                                  if (
                                                    [
                                                      "storeId",
                                                      "endAt",
                                                    ].includes(type)
                                                  ) {
                                                    return null;
                                                  }
                                                  return (
                                                    <span
                                                      key={type}
                                                      className="bg-[--biqpod-primary-background] px-2 py-1 border border-[--biqpod-borders] border-solid rounded text-xs"
                                                    >
                                                      {type}:{" "}
                                                      {Array.isArray(value)
                                                        ? value.length
                                                        : String(value)}
                                                    </span>
                                                  );
                                                }
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      {/* Payment Mode */}
                                      {payment.mode && (
                                        <div>
                                          <span
                                            className={`px-2 py-1 rounded text-xs ${
                                              payment.mode === "live"
                                                ? "bg-green-500/25 text-green-500"
                                                : "bg-yellow-500/25 text-yellow-500"
                                            }`}
                                          >
                                            <Translate content="Mode:" />{" "}
                                            {payment.mode}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              </EmptyComponent>
            )}
          </AnimatePresence>
        </Card>
      </div>
      {/* Payment Loading Overlay */}
      <AnimatePresence>
        {isPaymentLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="z-50 fixed inset-0 flex flex-col justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm"
          >
            <CircleLoading />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-4 text-white text-center"
            >
              <div className="font-semibold text-lg">
                <Translate content="Processing Payment" />
              </div>
              <div className="opacity-80 mt-1 text-sm">
                <Translate content="Please wait while we process your payment..." />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Scroll>
  );
};
