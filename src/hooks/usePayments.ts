import { getTemp, setTemp, useAsyncMemo, useUser } from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
export const useCurrentPayments = () => {
  const storeId = useStoreId();
  const user = useUser();
  return useAsyncMemo(async () => {
    if (!user?.uid) {
      return null;
    }
    if (storeId) {
      const payments = await snapbuyApi.usage.getCurrentPayments(storeId);
      return payments;
    }
    return [];
  }, [storeId, user]);
};
export const useFullUsageCalculation = () => {
  const storeId = useStoreId();
  const user = useUser();
  const usageData = useAsyncMemo(async () => {
    if (storeId && user?.uid) {
      return await snapbuyApi.usage.get(storeId);
    } else {
      return {};
    }
  }, [storeId, user]);
  const currentPayments = useCurrentPayments();
  const fullUsageCalculation = useAsyncMemo(async () => {
    if (!usageData || !currentPayments) return null;
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
    // Combine with actual usage data
    const fullUsage = {
      orders:
        combinedMeta.orders !== undefined
          ? Number(combinedMeta.orders)
          : usageData.orders || 0,
      customers:
        combinedMeta.customers !== undefined
          ? Number(combinedMeta.customers)
          : usageData.customers || 0,
      products:
        combinedMeta.products !== undefined
          ? Number(combinedMeta.products)
          : usageData.products || 0,
      brands:
        combinedMeta.brands !== undefined
          ? Number(combinedMeta.brands)
          : usageData.brands || 0,
      collections:
        combinedMeta.collections !== undefined
          ? Number(combinedMeta.collections)
          : usageData.collections || 0,
      packs:
        combinedMeta.packs !== undefined
          ? Number(combinedMeta.packs)
          : usageData.packs || 0,
      coupons:
        combinedMeta.coupons !== undefined
          ? Number(combinedMeta.coupons)
          : usageData.coupons || 0,
      vars:
        combinedMeta.vars !== undefined
          ? Number(combinedMeta.vars)
          : usageData.vars || 0,
    };
    return fullUsage;
  }, [usageData, currentPayments]);
  return fullUsageCalculation;
};

export const setTextSide = (text: string | null = null) => {
  setTemp("textSide", text);
};

export const getTextSide = () => {
  return getTemp<string>("textSide");
};
