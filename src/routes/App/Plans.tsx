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
  Anchor,
} from "@biqpod/app/ui/components";
import { allIcons, getUserFunction } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { tw } from "@biqpod/app/ui/utils";
import { DAYS_LEFT, FORCE_PAY_SERVICE, useStoreId } from "../../utils";
import { allUsages, snapbuyApi } from "../../apis";
import {
  confirm,
  showToast,
  useAsyncMemo,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { Nothing, State } from "@biqpod/app/ui/types";
import { notificationSettingsData } from "../../components/NotificationSettings";
import { openNotificationSettings } from "../../components/NotificationSettingsExamples";
const EXTRA_INFO = ["storeId", "endAt", "notifay"];
export const Plans = () => {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(
    new Set()
  );
  const [tooltipVisible, setTooltipVisible] = useState<DataTypes | null>(null);
  const [expandedStates, setExpandedStates] = useState({
    payAsYouGo: false,
    paymentHistory: false,
    usage: false,
    plan: false,
  });
  const storeId = useStoreId();
  const storeInfo = useAsyncMemo(async () => {
    if (!storeId) return null;
    return await snapbuyApi.store.get(storeId);
  }, [storeId]);
  const pricesHelp = useAsyncMemo(() => {
    return snapbuyApi.getPromotionalPrices();
  }, []);
  const usedNotifications = useMemo(() => {
    return pricesHelp?.filter((p) => !!storeInfo?.notify?.[p.key]);
  }, [pricesHelp, storeInfo]);
  const usageData = useAsyncMemo(async () => {
    if (storeId) {
      return await snapbuyApi.usage.get(storeId);
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
  const currentPayments = useAsyncMemo(async () => {
    if (storeId) {
      return await snapbuyApi.usage.getCurrentPayments(storeId);
    }
    return null;
  }, [storeId]);
  // Create copy states for each usage type with values from current payment
  const orderUsage = useCopyState<number | Nothing>(0);
  const customersUsage = useCopyState<number | Nothing>(0);
  const productsUsage = useCopyState<number | Nothing>(0);
  const brandsUsage = useCopyState<number | Nothing>(0);
  const collectionsUsage = useCopyState<number | Nothing>(0);
  const packsUsage = useCopyState<number | Nothing>(0);
  const couponUsage = useCopyState<number | Nothing>(0);
  const variablesUsage = useCopyState<number | Nothing>(0);
  useEffect(() => {
    // Calculate combined meta values from all active payments
    const combinedMeta: Record<string, number> = {};
    if (Array.isArray(currentPayments)) {
      currentPayments.forEach((payment) => {
        if (payment.meta) {
          Object.entries(payment.meta).forEach(([key, value]) => {
            if (typeof value === "number") {
              combinedMeta[key] = (combinedMeta[key] || 0) + value;
            } else if (typeof value === "string" && !isNaN(Number(value))) {
              combinedMeta[key] = (combinedMeta[key] || 0) + Number(value);
            }
          });
        }
      });
    }
    const get = (type: DataTypes) => {
      return combinedMeta[type] !== undefined
        ? Number(combinedMeta[type])
        : usageData?.[type] || 0;
    };
    orderUsage.set(get("orders"));
    customersUsage.set(get("customers"));
    productsUsage.set(get("products"));
    brandsUsage.set(get("brands"));
    collectionsUsage.set(get("collections"));
    packsUsage.set(get("packs"));
    couponUsage.set(get("coupons"));
    variablesUsage.set(get("vars"));
  }, [currentPayments, usageData]);
  // Create a separate mapping object for state management using DataTypes
  const usageStates: Partial<Record<DataTypes, State<number | Nothing>>> = {
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
    const total = pricesData.reduce((total, price) => {
      const state = usageStates[price.type];
      const current = usageData?.[price.type] || 0;
      const selectedValue =
        state && typeof state.get === "number" ? state.get : current;
      return total + selectedValue * (price.extraPrice || 0);
    }, 0);
    const restPrices = usedNotifications?.reduce(
      (prev, curr) => prev + curr.price,
      0
    );
    return total + (restPrices || 0);
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
    const detail = `| Type | Quantity | Cost |\n|------|----------|------|\n${Object.entries(
      usages
    )
      .map(([type, value]) => {
        const price = pricesData?.find((p) => p.type === type);
        return `| ${type} | ${value} | ${(
          value * (price?.extraPrice || 0)
        ).toFixed(2)} DA |`;
      })
      .join("\n")}\n${
      usedNotifications
        ?.map(
          (notification) =>
            `| ${notification.key} | 1 | ${notification.price.toFixed(2)} DA |`
        )
        .join("\n") || ""
    }\n| Total | | ${calculateTotalCost().toFixed(2)} DA |`;
    const isYes = await confirm({
      message: "Are you sure you want to proceed with the payment?",
      title: "Confirm Payment",
      detail,
      type: "question",
    });
    if (isYes) {
      try {
        setIsPaymentLoading(true);
        await snapbuyApi.usage.pay(storeId, usages);
      } catch (error) {
      } finally {
        setIsPaymentLoading(false);
      }
    }
  };
  const planPayment = async (plan: string) => {
    setIsPaymentLoading(true);
    const fn = await getUserFunction<{
      url: string;
    }>("snapbuy-pay-plan");
    if (!fn) {
      throw "FUNCTION NOT FOUND";
    }
    const response = await fn({
      storeId,
      plan,
    });
    setIsPaymentLoading(false);
    const url =
      response.url + (FORCE_PAY_SERVICE ? `&force=${FORCE_PAY_SERVICE}` : "");
    import.meta.env.DEV && showToast(url, "info");
    window.open(url, "_blank");
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
    orders: { min: 0, max: 10000 },
    customers: { min: 0, max: 10000 },
    products: { min: 0, max: 5000 },
    brands: { min: 0, max: 500 },
    collections: { min: 0, max: 500 },
    packs: { min: 0, max: 1000 },
    coupons: { min: 0, max: 1000 },
    vars: { min: 0, max: 1000 },
  };
  const [free, setFree] = useState<
    | undefined
    | {
        count: number;
        type: DataTypes;
      }[]
  >(undefined);
  const plans = useCopyState<null | undefined | Plan[]>(null);
  useEffect(() => {
    snapbuyApi.getFree().then(setFree);
    snapbuyApi.getPlans().then(plans.set);
  }, []);
  return (
    <Scroll>
      <div className="flex flex-col gap-2 p-2">
        <Card className="w-full overflow-hidden">
          <div
            className="active:bg-[--biqpod-gray-opacity] p-4 cursor-pointer"
            onClick={() =>
              setExpandedStates((prev) => ({ ...prev, usage: !prev.usage }))
            }
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-bold text-xl capitalize">
                  <Translate content="usage" />
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span>{totalDetected().toFixed(2)}DA</span>
                <CircleTip
                  icon={allIcons.solid.faChevronDown}
                  className={tw(expandedStates.usage && "rotate-180")}
                />
              </div>
            </div>
          </div>
          <AnimatePresence>
            {expandedStates.usage && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {currentPayments &&
                  Array.isArray(currentPayments) &&
                  currentPayments.length > 0 && (
                    <EmptyComponent>
                      <Line />
                      <div className="p-4">
                        <div className="bg-[--biqpod-secondary-background] p-4 border border-[--biqpod-borders] border-solid rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Icon
                                icon={allIcons.solid.faCalendarAlt}
                                className="text-[--biqpod-primary]"
                              />
                              <span className="font-medium">
                                <Translate content="Active Subscriptions" />
                              </span>
                            </div>
                            <span className="opacity-70 text-[--biqpod-text-color] text-sm">
                              {currentPayments.length} active
                            </span>
                          </div>
                          {/* Show each subscription */}
                          <div className="space-y-3">
                            {currentPayments.map((payment, index) => {
                              if (!payment.meta?.endAt) return null;
                              const now = Date.now();
                              const endTime = Number(payment.meta.endAt);
                              const startTime = payment.createdAt
                                ? new Date(payment.createdAt).getTime()
                                : now;
                              const totalDuration = endTime - startTime;
                              const elapsed = now - startTime;
                              const remaining = Math.max(0, endTime - now);
                              const progressPercentage =
                                totalDuration > 0
                                  ? Math.min(
                                      (elapsed / totalDuration) * 100,
                                      100
                                    )
                                  : 0;
                              const daysRemaining = Math.ceil(
                                remaining / (1000 * 60 * 60 * 24)
                              );
                              const isExpired = now >= endTime;
                              // Determine colors based on status
                              const bgColor = isExpired
                                ? "bg-red-100"
                                : progressPercentage >= 80
                                ? "bg-[--biqpod-secondary-background]"
                                : "bg-green-100";
                              const barColor = isExpired
                                ? "bg-red-500"
                                : progressPercentage >= 80
                                ? "bg-[--biqpod-primary]"
                                : "bg-green-500";
                              const textColor = isExpired
                                ? "text-red-600"
                                : progressPercentage >= 80
                                ? "text-[--biqpod-primary]"
                                : "text-green-600";
                              // Determine remaining time text
                              let remainingText = "";
                              if (isExpired) {
                                remainingText = "Expired";
                              } else if (daysRemaining === 1) {
                                remainingText = "1 day remaining";
                              } else if (daysRemaining > 0) {
                                remainingText = `${daysRemaining} days remaining`;
                              } else {
                                remainingText = "Less than 1 day remaining";
                              }
                              return (
                                <div
                                  key={index}
                                  className="flex flex-col gap-2 p-3 border border-[--biqpod-borders] rounded"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm capitalize">
                                      <Translate content="subscription" /> #
                                      {index + 1}
                                    </span>
                                    <span className="opacity-70 text-[--biqpod-text-color] text-xs">
                                      <Translate content="Ends:" />{" "}
                                      {new Date(endTime).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div
                                    className={`w-full h-2 rounded-full ${bgColor}`}
                                  >
                                    <div
                                      className={`h-2 rounded-full duration-300 ${barColor}`}
                                      style={{
                                        width: `${Math.min(
                                          progressPercentage,
                                          100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="opacity-70 text-[--biqpod-text-color] text-xs">
                                      {remainingText === "Expired" ||
                                      remainingText === "1 day remaining" ||
                                      remainingText ===
                                        "Less than 1 day remaining" ? (
                                        <Translate content={remainingText} />
                                      ) : (
                                        remainingText
                                      )}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {daysRemaining <= DAYS_LEFT &&
                                        !isExpired && (
                                          <Button
                                            onClick={handlePayment}
                                            className="px-2 py-1"
                                            disabled={isPaymentLoading}
                                            icon={allIcons.solid.faRedo}
                                          >
                                            <Translate content="Renew" />
                                          </Button>
                                        )}
                                      <span
                                        className={`text-xs font-medium ${textColor}`}
                                      >
                                        {progressPercentage.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </EmptyComponent>
                  )}
                <Line />
                <div className="p-4">
                  {!pricesData ? (
                    <div className="opacity-70 text-[--biqpod-text-color] text-center">
                      Loading prices data...
                    </div>
                  ) : !currentPayments ||
                    !Array.isArray(currentPayments) ||
                    currentPayments.length === 0 ? (
                    <div className="py-8 text-center">
                      <Icon
                        icon={allIcons.solid.faChartBar}
                        className="opacity-40 mx-auto text-[--biqpod-text-color] text-4xl"
                      />
                      <p className="opacity-70 text-[--biqpod-text-color]">
                        <Translate content="No active payment plan found" />
                      </p>
                      <p className="opacity-60 text-[--biqpod-text-color] text-sm">
                        <Translate content="Purchase a plan to see your usage statistics" />
                      </p>
                    </div>
                  ) : (
                    <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {pricesData.map((price, index) => {
                        const current = usageData?.[price.type] || 0;
                        const cost = current * (price.extraPrice || 0);
                        // Get free limit for this type
                        const freeLimit =
                          free?.find((f) => f.type === price.type)?.count || 0;
                        // Get usage limits from all active payments meta data combined
                        const getUsageLimit = (type: string): number | null => {
                          let totalLimit = 0;
                          let hasAnyLimit = false;
                          if (Array.isArray(currentPayments)) {
                            currentPayments.forEach((payment) => {
                              if (payment?.meta && payment.meta[type]) {
                                totalLimit += Number(payment.meta[type]);
                                hasAnyLimit = true;
                              }
                            });
                          }
                          return hasAnyLimit ? totalLimit : null;
                        };
                        const paidLimit = getUsageLimit(price.type) || 0;
                        const totalLimit = freeLimit + paidLimit;
                        // Calculate percentages for the segmented progress bar
                        const freePercentage =
                          totalLimit > 0 ? (freeLimit / totalLimit) * 100 : 100;
                        const currentPercentage =
                          totalLimit > 0
                            ? Math.min((current / totalLimit) * 100, 100)
                            : 0;
                        const isInFreeZone = current <= freeLimit;
                        const isNearLimit = currentPercentage >= 80;
                        const isAtLimit = current >= totalLimit;
                        return (
                          <div
                            key={price.type}
                            className={tw(
                              "bg-[--biqpod-secondary-background] flex flex-col gap-2 p-4 border border-solid rounded-lg ",
                              isAtLimit
                                ? "border-red-500/50"
                                : isNearLimit
                                ? "border-orange-500/50"
                                : "border-[--biqpod-borders]"
                            )}
                          >
                            {usageData === null ? (
                              <CardWait
                                className={tw(
                                  "h-[120px] rounded-lg w-full",
                                  index % 2 === 0 ? "" : ""
                                )}
                              />
                            ) : (
                              <>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h3 className="font-medium text-base capitalize">
                                      <Translate content={`${price.type}`} />
                                    </h3>
                                    <div className="flex items-baseline gap-1">
                                      <span className="font-bold text-2xl">
                                        {current}
                                      </span>
                                      <span className="opacity-60 text-sm">
                                        /{" "}
                                        {totalLimit > 0
                                          ? totalLimit
                                          : freeLimit}
                                      </span>
                                    </div>
                                    {freeLimit > 0 && paidLimit > 0 && (
                                      <div className="flex items-center gap-1">
                                        <span className="inline-flex items-center gap-2 bg-green-500/20 px-2 py-0.5 rounded-full text-green-600 text-xs">
                                          <Icon icon={allIcons.solid.faGift} />
                                          {freeLimit}
                                        </span>
                                        <span className="opacity-60 text-xs">
                                          +
                                        </span>
                                        <span className="inline-flex items-center gap-2 bg-blue-500/20 px-2 py-0.5 rounded-full text-blue-600 text-xs">
                                          <Icon
                                            icon={allIcons.solid.faCreditCard}
                                          />
                                          {paidLimit}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    className={tw(
                                      "p-2 w-[30px] flex items-center justify-center h-[30px] rounded-full ",
                                      paidLimit === 0
                                        ? isAtLimit
                                          ? "bg-red-500/20"
                                          : isNearLimit
                                          ? "bg-orange-500/20"
                                          : "bg-green-500/20"
                                        : isAtLimit
                                        ? "bg-red-500/20"
                                        : isNearLimit
                                        ? "bg-orange-500/20"
                                        : "bg-blue-500/20"
                                    )}
                                  >
                                    <Icon
                                      icon={
                                        isAtLimit
                                          ? allIcons.solid.faExclamationTriangle
                                          : isNearLimit
                                          ? allIcons.solid.faExclamationCircle
                                          : paidLimit === 0
                                          ? allIcons.solid.faGift
                                          : allIcons.solid.faCheck
                                      }
                                      className={tw(
                                        "text-sm",
                                        paidLimit === 0
                                          ? isAtLimit
                                            ? "text-red-500"
                                            : isNearLimit
                                            ? "text-orange-500"
                                            : "text-green-500"
                                          : isAtLimit
                                          ? "text-red-500"
                                          : isNearLimit
                                          ? "text-orange-500"
                                          : "text-blue-500"
                                      )}
                                    />
                                  </div>
                                </div>
                                {/* Cost Info */}
                                {paidLimit > 0 && (
                                  <div className="bg-[--biqpod-primary-background] p-2 border border-[--biqpod-borders] border-solid rounded text-center">
                                    <span className="opacity-70 text-[--biqpod-text-color] text-xs">
                                      {current} × {price.extraPrice} DA
                                    </span>
                                    <div className="font-bold text-[--biqpod-primary] text-sm">
                                      {cost.toFixed(2)} DA
                                    </div>
                                  </div>
                                )}
                                {/* Segmented Progress Bar */}
                                <div className="flex flex-col gap-3 w-full">
                                  <div className="relative bg-[--biqpod-primary-background] rounded-full w-full h-3 overflow-hidden">
                                    {/* Free zone background */}
                                    {freeLimit > 0 && (
                                      <div
                                        className="top-0 left-0 absolute bg-green-500/20 h-full"
                                        style={{ width: `${freePercentage}%` }}
                                      />
                                    )}
                                    {/* Current usage bar */}
                                    <div
                                      className={tw(
                                        "relative h-full duration-300",
                                        isAtLimit
                                          ? "bg-red-500"
                                          : isNearLimit
                                          ? "bg-orange-500"
                                          : isInFreeZone && freeLimit > 0
                                          ? "bg-green-500"
                                          : "bg-blue-500"
                                      )}
                                      style={{ width: `${currentPercentage}%` }}
                                    />
                                    {/* Free limit marker */}
                                    {freeLimit > 0 &&
                                      totalLimit > freeLimit && (
                                        <div
                                          className="top-0 bottom-0 absolute bg-green-600 w-0.5"
                                          style={{ left: `${freePercentage}%` }}
                                        >
                                          <div className="-top-1 left-1/2 absolute bg-green-600 rounded-full w-2 h-2 -translate-x-1/2" />
                                          <div className="-bottom-1 left-1/2 absolute bg-green-600 rounded-full w-2 h-2 -translate-x-1/2" />
                                        </div>
                                      )}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="opacity-70 text-[--biqpod-text-color] text-xs">
                                      {totalLimit - current > 0 ? (
                                        <>
                                          {totalLimit - current}{" "}
                                          <Translate content="remaining" />
                                        </>
                                      ) : (
                                        <Translate content="Limit reached" />
                                      )}
                                    </span>
                                    <span
                                      className={tw(
                                        "text-xs font-medium",
                                        isAtLimit
                                          ? "text-red-500"
                                          : isNearLimit
                                          ? "text-orange-500"
                                          : isInFreeZone && freeLimit > 0
                                          ? "text-green-500"
                                          : "text-blue-500"
                                      )}
                                    >
                                      {currentPercentage.toFixed(0)}%
                                    </span>
                                  </div>
                                  {/* Legend */}
                                  {freeLimit > 0 && paidLimit > 0 && (
                                    <div className="flex gap-3 text-xs">
                                      <div className="flex items-center gap-1">
                                        <div className="bg-green-500 rounded-sm w-3 h-3" />
                                        <span className="opacity-70">
                                          <Translate content="Free" /> (0-
                                          {freeLimit})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className="bg-blue-500 rounded-sm w-3 h-3" />
                                        <span className="opacity-70">
                                          <Translate content="Paid" /> (
                                          {freeLimit + 1}-{totalLimit})
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        <Card className="w-full overflow-hidden">
          <div
            className="active:bg-[--biqpod-gray-opacity] p-4 cursor-pointer"
            onClick={() =>
              setExpandedStates((prev) => ({ ...prev, plan: !prev.plan }))
            }
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-bold text-xl capitalize">
                  <Translate content="subscription plan" />
                </h1>
              </div>
              <CircleTip
                icon={allIcons.solid.faChevronDown}
                className={tw(expandedStates.plan && "rotate-180")}
              />
            </div>
          </div>
          <AnimatePresence>
            {expandedStates.plan && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {plans.get && (
                  <EmptyComponent>
                    <Line />
                    <div className="gap-4 grid grid-cols-1 md:grid-cols-3 p-4">
                      {plans.get.map((plan, index) => {
                        const isPopular = index === 1; // Assuming middle plan is popular
                        return (
                          <Card
                            className={tw(
                              "relative text-center",
                              isPopular
                                ? "border-2 border-[--biqpod-primary] bg-gradient-to-br from-[--biqpod-primary]/5 to-[--biqpod-secondary-background] shadow-lg"
                                : "border border-[--biqpod-borders] bg-[--biqpod-secondary-background]"
                            )}
                          >
                            {isPopular && (
                              <div className="top-0 left-1/2 absolute bg-[--biqpod-primary] px-3 py-1 rounded-b-lg font-bold text-white text-xs -translate-x-1/2 transform">
                                <Translate content="Most Popular" />
                              </div>
                            )}
                            <div className="p-6">
                              <h4 className="font-bold text-2xl capitalize">
                                <Translate content={plan.id} />
                              </h4>
                            </div>
                            <Line />
                            <div className="p-2">
                              <span className="font-bold text-[--biqpod-primary] text-4xl">
                                {plan.price}
                              </span>
                              <span className="opacity-70 text-[--biqpod-text-color] text-lg">
                                {" "}
                                DA
                              </span>
                              <p className="opacity-60 text-sm">
                                <Translate content="per month" />
                              </p>
                            </div>
                            <Line />
                            {/* Usage Features */}
                            <div className="p-3 text-left">
                              <h5 className="font-semibold text-[--biqpod-text-color] text-sm uppercase tracking-wide">
                                <Translate content="What's Included" />
                              </h5>
                              <div className="space-y-2">
                                {Object.entries(plan.usage).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex justify-between items-center text-sm"
                                    >
                                      <span className="opacity-80 capitalize">
                                        <Translate content={key} />
                                      </span>
                                      <span className="font-medium text-[--biqpod-primary]">
                                        {value.toLocaleString()}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                            <Line />
                            <div className="flex flex-col gap-2 p-4">
                              <Button
                                onClick={() => planPayment(plan.id)}
                                className={tw(
                                  "w-full py-3 font-semibold transition-transform duration-200",
                                  !isPopular &&
                                    "bg-[--biqpod-primary-background] text-[--biqpod-text-color] border-solid border border-[--biqpod-borders]"
                                )}
                              >
                                <Translate content="subscribe" />
                              </Button>
                              <Anchor
                                onClick={(e) => {
                                  e.preventDefault();
                                  setExpandedStates({
                                    payAsYouGo: true,
                                    usage: false,
                                    paymentHistory: false,
                                    plan: false,
                                  });
                                  allUsages.forEach((usage) => {
                                    const setter = usageStates[usage]?.set;
                                    const value = plan.usage[usage];
                                    setter?.(value);
                                  });
                                }}
                              >
                                - <Translate content="use as pay" /> -
                              </Anchor>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </EmptyComponent>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        <Card className="w-full overflow-hidden">
          <div
            className="active:bg-[--biqpod-gray-opacity] p-4 cursor-pointer"
            onClick={() =>
              setExpandedStates((prev) => ({
                ...prev,
                payAsYouGo: !prev.payAsYouGo,
              }))
            }
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-bold text-xl capitalize">
                  <Translate content="pay as you go" />
                </h1>
              </div>
              <CircleTip
                icon={allIcons.solid.faChevronDown}
                className={tw(expandedStates.payAsYouGo && "rotate-180")}
              />
            </div>
          </div>
          {/* Subscription End Date Progress */}
          <AnimatePresence>
            {expandedStates.payAsYouGo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Line />
                <div className="flex justify-between items-center p-4">
                  <h2 className="font-bold text-xl">
                    <Translate content="Payment Breakdown" />
                  </h2>
                  <CircleTip
                    onClick={() => {
                      // Calculate combined meta values from all active payments
                      const combinedMeta: Record<string, number> = {};
                      if (Array.isArray(currentPayments)) {
                        currentPayments.forEach((payment) => {
                          if (payment.meta) {
                            Object.entries(payment.meta).forEach(
                              ([key, value]) => {
                                if (typeof value === "number") {
                                  combinedMeta[key] =
                                    (combinedMeta[key] || 0) + value;
                                } else if (
                                  typeof value === "string" &&
                                  !isNaN(Number(value))
                                ) {
                                  combinedMeta[key] =
                                    (combinedMeta[key] || 0) + Number(value);
                                }
                              }
                            );
                          }
                        });
                      }
                      // Set usage states to current usage minus what's already covered by active subscriptions
                      orderUsage.set(
                        Math.max(
                          0,
                          (usageData?.orders || 0) - (combinedMeta.orders || 0)
                        )
                      );
                      customersUsage.set(
                        Math.max(
                          0,
                          (usageData?.customers || 0) -
                            (combinedMeta.customers || 0)
                        )
                      );
                      productsUsage.set(
                        Math.max(
                          0,
                          (usageData?.products || 0) -
                            (combinedMeta.products || 0)
                        )
                      );
                      brandsUsage.set(
                        Math.max(
                          0,
                          (usageData?.brands || 0) - (combinedMeta.brands || 0)
                        )
                      );
                      collectionsUsage.set(
                        Math.max(
                          0,
                          (usageData?.collections || 0) -
                            (combinedMeta.collections || 0)
                        )
                      );
                      packsUsage.set(
                        Math.max(
                          0,
                          (usageData?.packs || 0) - (combinedMeta.packs || 0)
                        )
                      );
                      couponUsage.set(
                        Math.max(
                          0,
                          (usageData?.coupons || 0) -
                            (combinedMeta.coupons || 0)
                        )
                      );
                      variablesUsage.set(
                        Math.max(
                          0,
                          (usageData?.vars || 0) - (combinedMeta.vars || 0)
                        )
                      );
                    }}
                    icon={allIcons.solid.faSync}
                  />
                </div>
                <Line />
                <div className="space-y-4 p-4">
                  {!pricesData ? (
                    <div className="opacity-70 text-[--biqpod-text-color] text-center">
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
                                  className="opacity-60 hover:opacity-80 text-[--biqpod-text-color] text-sm"
                                />
                                {tooltipVisible === price.type && (
                                  <div className="top-1/2 left-full z-10 absolute bg-[--biqpod-gray-opacity] shadow-lg backdrop-blur-md px-3 py-2 rounded-lg text-sm whitespace-nowrap -translate-y-1/2 transform">
                                    <Translate content={unitInfo} />
                                    <div
                                      className="top-1/2 right-full absolute border-4 border-transparent -translate-y-1/2 transform"
                                      style={{
                                        borderRightColor:
                                          "var(--biqpod-gray-opacity)",
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="opacity-70 text-[--biqpod-text-color] text-sm">
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
                                    config={{
                                      ...range,
                                      marked: {
                                        [current]: `Marked`,
                                      },
                                    }}
                                  />
                                </div>
                                <div className="w-20">
                                  <input
                                    type="number"
                                    min="0"
                                    max={range.max}
                                    value={selectedValue || ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === "") {
                                        state.set(0);
                                      } else {
                                        const numValue = parseInt(value) || 0;
                                        if (numValue < range.min) {
                                          state.set(range.min);
                                        } else if (numValue > range.max) {
                                          state.set(range.max);
                                        } else {
                                          state.set(numValue);
                                        }
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
                {usedNotifications && usedNotifications.length > 0 && (
                  <EmptyComponent>
                    <Line />
                    <div className="flex justify-between items-center p-2">
                      <h3 className="font-bold text-lg capitalize">
                        <Translate content="Activated Notifications" />
                      </h3>
                      <div>
                        <CircleTip
                          icon={allIcons.solid.faGear}
                          onClick={() => {
                            openNotificationSettings();
                          }}
                        />
                      </div>
                    </div>
                    <Line />
                    <div className="p-2">
                      <Card className="bg-[--biqpod-primary-background] overflow-hidden">
                        {usedNotifications.map((notification) => {
                          const data = notificationSettingsData.find(
                            (s) => s.key === notification.key
                          );
                          return (
                            <div
                              key={notification.key}
                              className="flex justify-between items-center gap-2 p-2 border-[--biqpod-borders] border-b border-solid last:border-none"
                            >
                              <div className="flex items-center gap-2">
                                <Icon
                                  icon={allIcons.solid.faCheckCircle}
                                  className="text-[--biqpod-success]"
                                />
                                <span className="capitalize text-nowrap">
                                  <Translate content={data?.title || ""} />
                                </span>
                              </div>
                              <span className="font-bold text-[--biqpod-primary] text-nowrap">
                                {notification.price.toFixed(2)} DA
                              </span>
                            </div>
                          );
                        })}
                      </Card>
                    </div>
                  </EmptyComponent>
                )}
                <Line />
                {usageData !== null && (
                  <div className="p-4">
                    <div className="flex flex-col gap-2 bg-[--biqpod-primary-background] p-4 border border-[--biqpod-borders] border-solid rounded-lg">
                      <div className="flex justify-between items-center">
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
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
        <Card className="w-full overflow-hidden">
          <div
            className="active:bg-[--biqpod-gray-opacity] p-4 cursor-pointer"
            onClick={() =>
              setExpandedStates((prev) => ({
                ...prev,
                paymentHistory: !prev.paymentHistory,
              }))
            }
          >
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">
                <Translate content="Payment History" />
              </h2>
              <CircleTip
                icon={
                  expandedStates.paymentHistory
                    ? allIcons.solid.faChevronUp
                    : allIcons.solid.faChevronDown
                }
                className="opacity-70 text-[--biqpod-text-color]"
              />
            </div>
          </div>
          <AnimatePresence>
            {expandedStates.paymentHistory && (
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
                        <p className="opacity-70 text-[--biqpod-text-color] text-sm">
                          <Translate content="Loading payment history..." />
                        </p>
                      </div>
                    ) : paymentHistory.length === 0 ? (
                      <div className="py-8 text-center">
                        <Icon
                          icon={allIcons.solid.faReceipt}
                          className="opacity-40 mx-auto text-[--biqpod-text-color] text-4xl"
                        />
                        <p className="opacity-70 text-[--biqpod-text-color]">
                          <Translate content="No payment history found" />
                        </p>
                        <p className="opacity-60 text-[--biqpod-text-color] text-sm">
                          <Translate content="Your payment transactions will appear here" />
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paymentHistory.map((payment, index) => {
                          const paymentId =
                            payment.payoutId || `payment-${index}`;
                          const isExpanded = expandedPayments.has(paymentId);
                          const now = Date.now();
                          const endTime = Number(payment?.meta?.endAt);
                          const wasExpired = now >= endTime;
                          const notifayArray = payment?.meta?.notifay;
                          return (
                            <div
                              key={paymentId}
                              className="bg-[--biqpod-secondary-background] border border-[--biqpod-borders] border-solid rounded-lg overflow-hidden"
                            >
                              {/* Compact Payment Info */}
                              <div
                                onClick={() =>
                                  togglePaymentExpansion(paymentId)
                                }
                                className="flex justify-between items-center active:bg-[--biqpod-primary-background] p-3 cursor-pointer"
                              >
                                <div className="flex flex-1 items-center gap-2">
                                  <Icon
                                    icon={
                                      payment.status === "paid"
                                        ? allIcons.solid.faCheckCircle
                                        : allIcons.solid.faClock
                                    }
                                    className={
                                      payment.status === "paid"
                                        ? "text-green-500 text-sm"
                                        : "text-[--biqpod-primary] text-sm"
                                    }
                                  />
                                  <div className="flex-1">
                                    <span className="font-medium text-sm">
                                      <Translate
                                        content={
                                          payment.status === "paid"
                                            ? "Payment Completed"
                                            : "Payment Processing"
                                        }
                                      />
                                    </span>
                                    {(payment.paidAt || payment.createdAt) && (
                                      <p className="opacity-70 text-[--biqpod-text-color] text-xs">
                                        {new Date(
                                          payment.paidAt || payment.createdAt!
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
                                        className={`text-xs  capitalize ${
                                          payment.status === "paid"
                                            ? "text-green-500"
                                            : payment.status === "pending"
                                            ? "text-orange-400"
                                            : "text-[--biqpod-text-color] opacity-70"
                                        }`}
                                      >
                                        {payment.status}
                                      </p>
                                    )}
                                  </div>
                                  <CircleTip
                                    icon={allIcons.solid.faChevronDown}
                                    className={tw(
                                      "text-[--biqpod-text-color] text-sm opacity-60 transition-transform duration-200",
                                      isExpanded && "rotate-180"
                                    )}
                                  />
                                </div>
                              </div>
                              {/* Expanded Payment Details */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <EmptyComponent>
                                    <Line />
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-3">
                                        {/* Payment ID */}
                                        {payment.payoutId && (
                                          <p className="opacity-60 text-[--biqpod-text-color] text-xs">
                                            <Translate content="Payment ID:" />{" "}
                                            {payment.payoutId}
                                          </p>
                                        )}
                                        {/* Full Date and Time */}
                                        {(payment.paidAt ||
                                          payment.createdAt) && (
                                          <p className="opacity-70 text-[--biqpod-text-color] text-xs">
                                            <Translate content="Date:" />{" "}
                                            {new Date(
                                              payment.paidAt ||
                                                payment.createdAt!
                                            ).toLocaleDateString()}{" "}
                                            -{" "}
                                            {new Date(
                                              payment.paidAt ||
                                                payment.createdAt!
                                            ).toLocaleTimeString()}
                                          </p>
                                        )}
                                        {/* Transaction Note */}
                                        {payment.transaction?.note && (
                                          <p className="opacity-80 text-[--biqpod-text-color] text-xs">
                                            <Translate content="Note:" />{" "}
                                            {payment.transaction.note}
                                          </p>
                                        )}
                                        {/* Subscription Info */}
                                        {!!payment.subscription?.duration && (
                                          <div className="">
                                            <p className="opacity-70 text-[--biqpod-text-color] text-xs">
                                              <Translate content="Duration:" />{" "}
                                              {payment.subscription.duration /
                                                86400000}{" "}
                                              days
                                            </p>
                                          </div>
                                        )}
                                        {/* Subscription End Date */}
                                        {payment.meta?.endAt && (
                                          <div className="">
                                            <p className="opacity-80 text-[--biqpod-text-color] text-xs">
                                              <Translate content="Subscription End Date:" />{" "}
                                              {new Date(
                                                Number(payment.meta.endAt)
                                              ).toLocaleDateString()}{" "}
                                              {new Date(
                                                Number(payment.meta.endAt)
                                              ).toLocaleTimeString()}
                                            </p>
                                            <div className="">
                                              <span
                                                className={`px-2 py-1 rounded text-xs ${
                                                  wasExpired
                                                    ? "bg-red-500/25 text-red-500"
                                                    : "bg-green-500/25 text-green-500"
                                                }`}
                                              >
                                                <Translate
                                                  content={
                                                    wasExpired
                                                      ? "Expired"
                                                      : "Active"
                                                  }
                                                />
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                        {/* Product Info */}
                                        {/* Usage Breakdown */}
                                        {payment.meta &&
                                          Object.keys(payment.meta).length >
                                            0 && (
                                            <div className="flex flex-col gap-2">
                                              <p className="opacity-80 text-[--biqpod-text-color] text-xs">
                                                <Translate content="Usage breakdown:" />
                                              </p>
                                              <div className="flex flex-wrap gap-2">
                                                {Object.entries(
                                                  payment.meta
                                                ).map(([type, value]) => {
                                                  if (
                                                    EXTRA_INFO.includes(type)
                                                  ) {
                                                    return null;
                                                  }
                                                  return (
                                                    <span
                                                      key={type}
                                                      className="bg-[--biqpod-primary-background] px-2 py-1 border border-[--biqpod-borders] border-solid rounded text-xs"
                                                    >
                                                      {type}:{" "}
                                                      <span className="bg-[--biqpod-gray-opacit] px-2 py-1 rounded-2xl">
                                                        {Array.isArray(value)
                                                          ? value.length
                                                          : String(value)}
                                                      </span>
                                                    </span>
                                                  );
                                                })}
                                              </div>
                                              <p className="opacity-80 text-[--biqpod-text-color] text-xs">
                                                <Translate content="Activated notifications:" />
                                              </p>
                                              <div className="flex flex-wrap gap-2">
                                                {Array.isArray(notifayArray) &&
                                                  notifayArray.map((s) => {
                                                    const data =
                                                      notificationSettingsData.find(
                                                        (setting) =>
                                                          setting.key === s
                                                      );
                                                    if (typeof s !== "string")
                                                      return null;
                                                    if (!data) {
                                                      console.warn(
                                                        `Notification setting with key "${s}" not found`
                                                      );
                                                      return null;
                                                    }
                                                    return (
                                                      <span
                                                        key={s}
                                                        className="inline-flex items-center gap-2 bg-[--biqpod-primary-background] px-2 py-1 border border-[--biqpod-borders] border-solid rounded text-xs"
                                                      >
                                                        <Icon
                                                          icon={
                                                            allIcons.solid
                                                              .faCheckCircle
                                                          }
                                                          className="text-[--biqpod-success] text-xs"
                                                        />
                                                        <Translate
                                                          content={data.title}
                                                        />
                                                      </span>
                                                    );
                                                  })}
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                      <Line />
                                      <div className="flex justify-end p-1">
                                        <Button
                                          className="px-2 py-1 w-fit"
                                          onClick={async () => {
                                            const isOk = await confirm({
                                              title: "Use this subscription",
                                              message:
                                                "This will apply the subscription benefits to your current usage. Are you sure you want to proceed?",
                                            });
                                            if (!isOk) {
                                              return;
                                            }
                                            setExpandedStates({
                                              payAsYouGo: true,
                                              paymentHistory: false,
                                              plan: false,
                                              usage: false,
                                            });
                                            Object.entries(
                                              payment.meta || {}
                                            ).forEach(([key, value]) => {
                                              if (EXTRA_INFO.includes(key)) {
                                                return;
                                              }
                                              const keyType = key as DataTypes;
                                              usageStates[keyType]?.set(
                                                Number(value || 0)
                                              );
                                            });
                                          }}
                                        >
                                          <Translate content="use plansage" />
                                        </Button>
                                      </div>
                                    </motion.div>
                                  </EmptyComponent>
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
              className="text-white text-center"
            >
              <div className="font-semibold text-lg">
                <Translate content="Processing Payment" />
              </div>
              <div className="opacity-80 text-sm">
                <Translate content="Please wait while we process your payment..." />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Scroll>
  );
};
