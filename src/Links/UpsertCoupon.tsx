import {
  Button,
  Card,
  CircleTip,
  Field,
  Line,
  Translate,
  BooleanField,
  DateField,
  EnumField,
  Icon,
  Image,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  isLoading,
  showToast,
  useAction,
  setFieldValue,
  useCopyState,
  useTemp,
  useEffectDelay,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { allIcons } from "@biqpod/app/ui/apis";
import { useEffect, useMemo } from "react";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { filterFuzzySearch } from "@biqpod/app/ui/utils";
import { motion } from "framer-motion";
export interface UpsertCouponProps {
  coupon?: Biqpod.Snapbuy.Coupon;
}
export const UpsertCoupon = ({ coupon }: UpsertCouponProps) => {
  const storeId = useStoreId();
  const isActiveState = useCopyState<Biqpod.System.Setting.Value["boolean"]>(
    coupon?.isActive ?? true
  );
  const startAt = useTemp<string | undefined>("coupon-start-date");
  const endAt = useTemp<string | undefined>("coupon-end-date");
  const couponType = useTemp<string | Nothing>("coupon-type");
  const applicableProducts = useCopyState<string[]>(
    coupon?.applicableProducts || []
  );
  const products = useTemp<Biqpod.Snapbuy.Product[]>("fetched-products");
  const productSearch = getFieldValue("coupon-product-search");
  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!productSearch || !products?.get) return [];
    return filterFuzzySearch(products.get, productSearch.trim(), "name");
  }, [products?.get, productSearch]);

  // Fetch products when component mounts
  useEffectDelay(() => {
    if (storeId && !products?.get?.length) {
      execAction("fetch-products");
    }
  }, [storeId]);

  // Set field values when editing a coupon
  useEffect(() => {
    if (coupon) {
      setFieldValue("coupon-code", coupon.code || "");
      setFieldValue("coupon-name", coupon.name || "");
      setFieldValue("coupon-description", coupon.description || "");
      couponType.set(coupon.type || "percentage");
      setFieldValue("coupon-value", coupon.value?.toString() || "");
      setFieldValue(
        "coupon-min-amount",
        coupon.minOrderAmount?.toString() || ""
      );
      setFieldValue(
        "coupon-max-discount",
        coupon.maxDiscountAmount?.toString() || ""
      );
      setFieldValue("coupon-usage-limit", coupon.usageLimit?.toString() || "");
      setFieldValue(
        "coupon-user-limit",
        coupon.userUsageLimit?.toString() || ""
      );
      startAt.set(
        coupon.startDate
          ? new Date(coupon.startDate).toISOString().split("T")[0]
          : ""
      );
      endAt.set(
        coupon.endDate
          ? new Date(coupon.endDate).toISOString().split("T")[0]
          : ""
      );
      isActiveState.set(coupon.isActive);
      applicableProducts.set(coupon.applicableProducts || []);
    } else {
      // Set default values for new coupon
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      startAt.set(today.toISOString().split("T")[0]);
      endAt.set(nextMonth.toISOString().split("T")[0]);
      couponType.set("percentage");
      isActiveState.set(true);
      applicableProducts.set([]);
      setFieldValue("coupon-code", "");
      setFieldValue("coupon-name", "");
      setFieldValue("coupon-description", "");
      setFieldValue("coupon-value", "");
      setFieldValue("coupon-min-amount", "");
      setFieldValue("coupon-max-discount", "");
      setFieldValue("coupon-usage-limit", "");
      setFieldValue("coupon-user-limit", "");
      setFieldValue("coupon-product-search", "");
    }
  }, []);
  const code = getFieldValue("coupon-code");
  const name = getFieldValue("coupon-name");
  const description = getFieldValue("coupon-description");
  const type = couponType.get as
    | "percentage"
    | "fixed"
    | "freeShipping"
    | Nothing;
  const value = getFieldValue("coupon-value");
  const minAmount = getFieldValue("coupon-min-amount");
  const maxDiscount = getFieldValue("coupon-max-discount");
  const usageLimit = getFieldValue("coupon-usage-limit");
  const userLimit = getFieldValue("coupon-user-limit");
  const startDate = startAt.get;
  const endDate = endAt.get;
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFieldValue("coupon-code", result);
  };
  const upsertCouponAction = useAction(
    "upsert-coupon",
    async () => {
      if (!type) {
        showToast("Please select a coupon type", "error");
        return;
      }
      if (!code?.trim()) {
        showToast("Please enter a coupon code", "error");
        return;
      }
      if (!name?.trim()) {
        showToast("Please enter a coupon name", "error");
        return;
      }
      if (!value || parseFloat(value) <= 0) {
        showToast("Please enter a valid discount value", "error");
        return;
      }
      if (!startDate || !endDate) {
        showToast("Please select start and end dates", "error");
        return;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        showToast("End date must be after start date", "error");
        return;
      }
      if (!storeId) {
        showToast("Store ID not found", "error");
        return;
      }
      const infinity = 1e10;
      const couponData: Biqpod.Snapbuy.Coupon = {
        id: coupon?.id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim(),
        type,
        value: parseFloat(value),
        minOrderAmount: minAmount ? parseFloat(minAmount) : 0,
        maxDiscountAmount: maxDiscount ? parseFloat(maxDiscount) : infinity,
        usageLimit: usageLimit ? parseInt(usageLimit) : 0,
        usedCount: coupon?.usedCount || 1,
        userUsageLimit: userLimit ? parseInt(userLimit) : infinity,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isActive: Boolean(isActiveState.get),
        storeId,
        applicableProducts:
          applicableProducts.get.length > 0 ? applicableProducts.get : null,
      };
      await snapbuyApi.coupon.upsert(couponData);
      showToast(
        coupon ? "Coupon updated successfully" : "Coupon created successfully",
        "success"
      );
      execAction("fetch-coupons");
      closePopup();
    },
    [
      storeId,
      coupon,
      code,
      name,
      description,
      type,
      value,
      minAmount,
      maxDiscount,
      usageLimit,
      userLimit,
      startDate,
      endDate,
      isActiveState.get,
      applicableProducts.get,
    ]
  );
  const loading = isLoading(upsertCouponAction);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl capitalize">
            {coupon ? (
              <Translate content="edit coupon" />
            ) : (
              <Translate content="create coupon" />
            )}
          </h1>
        </div>
        <div className="flex">
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
        {/* Basic Information */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
          {/* Coupon Code */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold capitalize" htmlFor="coupon-code">
              <Translate content="coupon code" />
            </label>
            <div className="relative flex gap-2">
              <Field
                inputName="coupon-code"
                placeholder="Enter coupon code"
                className="flex-1"
                required
              />
              <div className="top-1/2 right-2 absolute -translate-y-1/2 transform">
                <Button
                  onClick={generateCode}
                  className="px-2 py-1 rounded-lg w-fit -translate-y-1/2"
                  icon={allIcons.solid.faRotate}
                >
                  <Translate content="generate" />
                </Button>
              </div>
            </div>
          </div>
          {/* Coupon Name */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold capitalize" htmlFor="coupon-name">
              <Translate content="coupon name" />
            </label>
            <Field
              inputName="coupon-name"
              placeholder="Enter coupon name"
              required
            />
          </div>
        </div>
        {/* Description */}
        <div className="flex flex-col gap-2">
          <label
            className="font-semibold capitalize"
            htmlFor="coupon-description"
          >
            <Translate content="description" />{" "}
            <span className="text-[--biqpod-gray-opacity]">
              (<Translate content="optional" />)
            </span>
          </label>
          <Field
            inputName="coupon-description"
            placeholder="Enter coupon description"
            rows={3}
          />
        </div>
        {/* Discount Settings */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
          {/* Coupon Type */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold capitalize">
              <Translate content="discount type" />
            </label>
            <EnumField
              id="coupon-type"
              state={couponType}
              config={{
                expandIcon: true,
                list: [
                  { value: "percentage", content: "Percentage (%)" },
                  { value: "fixed", content: "Fixed Amount ($)" },
                  { value: "freeShipping", content: "Free Shipping" },
                ],
              }}
            />
          </div>
          {/* Discount Value */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold capitalize" htmlFor="coupon-value">
              {type === "percentage" && "Percentage (%)"}
              {type === "fixed" && "Amount ($)"}
              {type === "freeShipping" && "Free Shipping (set to 1)"}
            </label>
            <Field
              inputName="coupon-value"
              placeholder={type === "percentage" ? "10" : "50"}
              required
            />
          </div>
        </div>
        {/* Order Restrictions */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
          {/* Minimum Order Amount */}
          <div className="flex flex-col gap-2">
            <label
              className="font-semibold capitalize"
              htmlFor="coupon-min-amount"
            >
              <Translate content="minimum order amount" />{" "}
              <span className="text-[--biqpod-gray-opacity]">
                (<Translate content="optional" />)
              </span>
            </label>
            <Field inputName="coupon-min-amount" placeholder="0.00" />
          </div>
          {/* Maximum Discount Amount (for percentage) */}
          {type === "percentage" && (
            <div className="flex flex-col gap-2">
              <label
                className="font-semibold capitalize"
                htmlFor="coupon-max-discount"
              >
                <Translate content="maximum discount amount" />{" "}
                <span className="text-[--biqpod-gray-opacity]">
                  (<Translate content="optional" />)
                </span>
              </label>
              <Field inputName="coupon-max-discount" placeholder="100.00" />
            </div>
          )}
        </div>
        {/* Usage Limits */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
          {/* Total Usage Limit */}
          <div className="flex flex-col gap-2">
            <label
              className="font-semibold capitalize"
              htmlFor="coupon-usage-limit"
            >
              <Translate content="total usage limit" />{" "}
              <span className="text-[--biqpod-gray-opacity]">
                (<Translate content="optional" />)
              </span>
            </label>
            <Field inputName="coupon-usage-limit" placeholder="100" />
          </div>
          {/* Per-User Usage Limit */}
          <div className="flex flex-col gap-2">
            <label
              className="font-semibold capitalize"
              htmlFor="coupon-user-limit"
            >
              <Translate content="per user limit" />{" "}
              <span className="text-[--biqpod-gray-opacity]">
                (<Translate content="optional" />)
              </span>
            </label>
            <Field inputName="coupon-user-limit" placeholder="1" />
          </div>
        </div>
        {/* Date Range */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label
              className="font-semibold capitalize"
              htmlFor="coupon-start-date"
            >
              <Translate content="start date" />
            </label>
            <DateField
              id="coupon-start-date"
              state={startAt}
              config={{
                format: "date",
                goToCurrent: true,
              }}
            />
          </div>
          {/* End Date */}
          <div className="flex flex-col gap-2">
            <label
              className="font-semibold capitalize"
              htmlFor="coupon-end-date"
            >
              <Translate content="end date" />
            </label>
            <DateField
              id="coupon-end-date"
              state={endAt}
              config={{
                format: "date",
                goToCurrent: true,
              }}
            />
          </div>
        </div>
        {/* Status */}
        <div className="flex items-center gap-2">
          <BooleanField state={isActiveState} id="coupon-is-active" />
          <label className="font-semibold capitalize">
            <Translate content="active" />
          </label>
        </div>

        {/* Applicable Products */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold capitalize">
            <Translate content="applicable products" />{" "}
            <span className="text-[--biqpod-gray-opacity]">
              (<Translate content="optional - leave empty for all products" />)
            </span>
          </label>

          {/* Selected Products Display */}
          {applicableProducts.get.length > 0 && (
            <div className="bg-[--biqpod-primary-background] p-3 border border-[--biqpod-borders] border-solid rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">
                  <Translate content="selected products" /> (
                  {applicableProducts.get.length})
                </span>
                <Button
                  onClick={() => applicableProducts.set([])}
                  className="bg-red-500 px-2 py-1 rounded w-fit text-white text-xs"
                >
                  <Translate content="clear all" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {applicableProducts.get.map((productId) => {
                  const product = products?.get?.find(
                    (p) => p.id === productId
                  );
                  return (
                    <motion.div
                      key={productId}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-2 bg-white p-2 border border-[--biqpod-borders] border-solid rounded-2xl"
                    >
                      <Image
                        src={product?.photos?.[0]}
                        alt={<Icon icon={allIcons.solid.faBox} />}
                        className="bg-[--biqpod-gray-opacity] rounded w-8 h-8"
                      />
                      <span className="text-sm">
                        {product?.name || "Unknown Product"}
                      </span>
                      <div>
                        <CircleTip
                          icon={allIcons.solid.faTimes}
                          onClick={() => {
                            applicableProducts.set((prev) =>
                              prev.filter((id) => id !== productId)
                            );
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Search with Dropdown */}
          <div className="relative">
            {/* Product Search Results - Above the search field */}
            {productSearch && (
              <div className="right-0 bottom-full left-0 z-50 absolute mb-1">
                {filteredProducts.length > 0 ? (
                  <div className="bg-[--biqpod-primary-background] shadow-lg border border-[--biqpod-borders] border-solid rounded-lg max-h-60 overflow-y-auto">
                    {filteredProducts
                      .filter(
                        (product) =>
                          !applicableProducts.get.includes(product.id!)
                      )
                      .map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 hover:bg-[--biqpod-gray-opacity] p-3 border-b last:border-b-0 cursor-pointer"
                          onClick={() => {
                            if (
                              product.id &&
                              !applicableProducts.get.includes(product.id)
                            ) {
                              applicableProducts.set((prev) => [
                                ...prev,
                                product.id!,
                              ]);
                              setFieldValue("coupon-product-search", "");
                            }
                          }}
                        >
                          <Image
                            src={product.photos?.[0]}
                            alt={<Icon icon={allIcons.solid.faBox} />}
                            className="bg-[--biqpod-gray-opacity] rounded w-12 h-12"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-[--biqpod-text-secondary] text-sm">
                              {product.type === "single"
                                ? `${product.single?.client || 0} DA`
                                : `From ${Math.min(
                                    ...(product.multiple?.prices?.map(
                                      (p) => p.price
                                    ) || [0])
                                  )} DA`}
                            </div>
                          </div>
                          <Icon
                            icon={allIcons.solid.faPlus}
                            iconClassName="text-[--biqpod-primary]"
                          />
                        </motion.div>
                      ))}
                    {filteredProducts.length > 0 &&
                      filteredProducts.every((product) =>
                        applicableProducts.get.includes(product.id!)
                      ) && (
                        <div className="p-3 text-[--biqpod-text-secondary] text-center">
                          <Translate content="All matching products are already selected" />
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="bg-white shadow-lg p-3 border rounded-lg text-[--biqpod-text-secondary] text-center">
                    <Translate content="No products found matching your search" />
                  </div>
                )}
              </div>
            )}

            {/* Product Search Field */}
            <Field
              inputName="coupon-product-search"
              placeholder="Search products to apply coupon to..."
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Usage Stats (for existing coupon) */}
        {coupon && (
          <div className="bg-[--biqpod-gray-opacity] p-4 rounded-lg">
            <h3 className="mb-2 font-semibold">
              <Translate content="usage statistics" />
            </h3>
            <div className="gap-4 grid grid-cols-2 text-sm">
              <div>
                <span className="text-[--biqpod-gray-opacity-2]">Used: </span>
                <span className="font-semibold">{coupon.usedCount}</span>
                {coupon.usageLimit && ` / ${coupon.usageLimit}`}
              </div>
              <div>
                <span className="text-[--biqpod-gray-opacity-2]">
                  Created:{" "}
                </span>
                <span>
                  {coupon.createdAt
                    ? new Date(coupon.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        {coupon?.id && (
          <Button
            onClick={async () => {
              const response = await confirm({
                title: "Delete Coupon",
                message: `Are you sure you want to delete "${coupon.name}"?`,
                detail: "This action cannot be undone.",
              });
              if (response) {
                await snapbuyApi.coupon.delete(coupon.id!);
                showToast("Coupon deleted successfully", "success");
                execAction("fetch-coupons");
                closePopup();
              }
            }}
            className="bg-[--biqpod-error] rounded-full"
          >
            <Translate content="delete coupon" />
          </Button>
        )}
        <Button
          className="rounded-full"
          onClick={() => {
            execAction("upsert-coupon");
          }}
          icon={loading ? allIcons.solid.faCircleNotch : allIcons.solid.faCheck}
          iconClassName={loading ? "animate-spin" : ""}
          disabled={loading}
        >
          <Translate content={coupon ? "update" : "create"} />
        </Button>
      </div>
    </Card>
  );
};
