import { allIcons, and, orderBy, where } from "@biqpod/app/ui/apis";
import { mergeArray, range, tw } from "@biqpod/app/ui/utils";
import {
  Button,
  Card,
  CardWait,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Key,
  Line,
  PositionView,
  Translate,
} from "@biqpod/app/ui/components";
import {
  execAction,
  getFieldValue,
  getPosition,
  isLoading,
  isSuccess,
  showPopup,
  showToast,
  useAction,
  useCopyState,
  useMemoDelay,
  useResolution,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { useMemo, useRef, useCallback, memo, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import { getDocs } from "../server";
import { motion, AnimatePresence } from "framer-motion";
import { useStoreId } from "../utils";
import { UpsertCoupon } from "./UpsertCoupon";
import { Biqpod } from "@biqpod/app/ui/types";
const PAGE_SIZE = 20;
interface FilterOptionsForCoupon {
  isActive?: string | null;
  type?: string | null;
  expired?: string | null;
}
const SlidingCouponFilter = ({
  isOpen,
  onClose,
  value,
  onChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  value?: FilterOptionsForCoupon;
  onChange: (value: FilterOptionsForCoupon) => void;
}) => {
  const activeFilter = useCopyState<string | null>(value?.isActive || null);
  const typeFilter = useCopyState<string | null>(value?.type || null);
  const expiredFilter = useCopyState<string | null>(value?.expired || null);
  return (
    <EmptyComponent>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-[1000] absolute inset-0 bg-black/20"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      {/* Sliding Filter Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="top-0 right-0 z-[1001] absolute flex flex-col shadow-2xl backdrop-blur-md border-[--biqpod-borders] border-l border-solid w-96 max-w-[90vw] h-full overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="font-semibold text-xl capitalize">
            <Translate content="filter coupons" />
          </h1>
          <CircleTip icon={allIcons.solid.faXmark} onClick={onClose} />
        </div>
        <Line />
        <div className="flex flex-col flex-1 gap-6 p-6 h-full overflow-y-auto">
          {/* Active Status Filter */}
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-sm capitalize">
              <Translate content="status" />
            </label>
            <div className="flex gap-2">
              {[
                { value: null, label: "all" },
                { value: "true", label: "active" },
                { value: "false", label: "inactive" },
              ].map((option) => (
                <Button
                  key={option.value || "all"}
                  onClick={() => activeFilter.set(option.value)}
                  className={tw(
                    "px-4 py-2 rounded-full text-sm transition-all",
                    activeFilter.get === option.value
                      ? "bg-[--biqpod-primary] text-[--biqpod-primary-content] shadow-md"
                      : "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color] hover:bg-[--biqpod-gray-opacity-2]"
                  )}
                >
                  <Translate content={option.label} />
                </Button>
              ))}
            </div>
          </div>
          {/* Type Filter */}
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-sm capitalize">
              <Translate content="type" />
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: null, label: "all types" },
                { value: "percentage", label: "percentage" },
                { value: "fixed", label: "fixed amount" },
                { value: "freeShipping", label: "free shipping" },
              ].map((option) => (
                <Button
                  key={option.value || "all"}
                  onClick={() => typeFilter.set(option.value)}
                  className={tw(
                    "px-4 py-2 rounded-full text-sm transition-all",
                    typeFilter.get === option.value
                      ? "bg-[--biqpod-primary] text-[--biqpod-primary-content] shadow-md"
                      : "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color] hover:bg-[--biqpod-gray-opacity-2]"
                  )}
                >
                  <Translate content={option.label} />
                </Button>
              ))}
            </div>
          </div>
          {/* Expired Filter */}
          <div className="flex flex-col gap-3">
            <label className="font-semibold text-sm capitalize">
              <Translate content="expiry status" />
            </label>
            <div className="flex gap-2">
              {[
                { value: null, label: "all" },
                { value: "false", label: "valid" },
                { value: "true", label: "expired" },
              ].map((option) => (
                <Button
                  key={option.value || "all"}
                  onClick={() => expiredFilter.set(option.value)}
                  className={tw(
                    "px-4 py-2 rounded-full text-sm transition-all",
                    expiredFilter.get === option.value
                      ? "bg-[--biqpod-primary] text-[--biqpod-primary-content] shadow-md"
                      : "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color] hover:bg-[--biqpod-gray-opacity-2]"
                  )}
                >
                  <Translate content={option.label} />
                </Button>
              ))}
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-3 bg-[--biqpod-background] p-6 border-t">
          <Button
            onClick={() => {
              activeFilter.set(null);
              typeFilter.set(null);
              expiredFilter.set(null);
              onChange({});
              onClose();
            }}
            className="flex-1 bg-[--biqpod-gray-opacity] hover:bg-[--biqpod-gray-opacity-2] rounded-xl text-[--biqpod-text-color]"
          >
            <Translate content="clear filters" />
          </Button>
          <Button
            onClick={() => {
              onChange({
                isActive: activeFilter.get,
                type: typeFilter.get,
                expired: expiredFilter.get,
              });
              onClose();
            }}
            className="flex-1 rounded-xl"
          >
            <Translate content="apply filters" />
          </Button>
        </div>
      </motion.div>
    </EmptyComponent>
  );
};
const CouponRender = memo(({ coupon }: { coupon: Biqpod.Snapbuy.Coupon }) => {
  const isExpired = new Date(coupon.endDate) < new Date();
  const isActive = coupon.isActive && !isExpired;
  const getTypeIcon = () => {
    switch (coupon.type) {
      case "percentage":
        return allIcons.solid.faPercent;
      case "fixed":
        return allIcons.solid.faDollarSign;
      case "freeShipping":
        return allIcons.solid.faTruck;
      default:
        return allIcons.solid.faTicket;
    }
  };
  const getDiscountComponent = () => {
    switch (coupon.type) {
      case "percentage":
        return `${coupon.value}% OFF`;
      case "fixed":
        return `$${coupon.value} OFF`;
      case "freeShipping":
        return (
          <span style={{ textTransform: "uppercase" }}>
            <Translate content="free shipping" />
          </span>
        );
      default:
        return "";
    }
  };
  return (
    <motion.div className="w-full">
      <Card
        className={tw(
          "relative overflow-hidden border-l-4 transition-all cursor-pointer",
          isActive ? "border-l-green-500" : "border-l-red-500 opacity-70"
        )}
        onClick={() => {
          showPopup(<UpsertCoupon coupon={coupon} />);
        }}
      >
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-3">
            <div
              className={tw(
                "flex items-center justify-center w-12 h-12 rounded-full",
                isActive
                  ? "bg-green-600/10 text-green-600"
                  : "bg-red-600/10 text-red-600"
              )}
            >
              <Icon icon={getTypeIcon()} className="text-xl" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-semibold text-[--biqpod-text] text-lg">
                {coupon.name}
              </h3>
              <p className="font-mono text-[--biqpod-text-secondary] text-sm">
                <Translate content="code" />: <Key>{coupon.code}</Key>
              </p>
              {coupon.description && (
                <p className="mt-1 text-[--biqpod-text-secondary] text-xs">
                  {coupon.description}
                </p>
              )}
              {coupon.applicableProducts &&
                coupon.applicableProducts.length > 0 && (
                  <p className="mt-1 text-[--biqpod-primary] text-xs">
                    <Icon icon={allIcons.solid.faBox} className="mr-1" />
                    <Translate content="applicable to" />{" "}
                    {coupon.applicableProducts.length}{" "}
                    <Translate
                      content={
                        coupon.applicableProducts.length === 1
                          ? "product"
                          : "products"
                      }
                    />
                  </p>
                )}
            </div>
          </div>
          <div className="text-right">
            <div
              className={tw(
                "text-2xl font-bold",
                isActive ? "text-green-600" : "text-red-600"
              )}
            >
              {getDiscountComponent()}
            </div>
            <div className="text-[--biqpod-text-secondary] text-xs">
              <Translate content="used" />: {coupon.usedCount}
              {coupon.usageLimit && ` / ${coupon.usageLimit}`}
            </div>
          </div>
        </div>
        <Line />
        <div className="flex justify-between items-center p-3 text-sm">
          <div className="flex items-center gap-4">
            <span
              className={tw(
                "px-2 py-1 rounded-full text-xs",
                isActive
                  ? "text-green-600 bg-green-600/10"
                  : isExpired
                  ? "text-red-600 bg-red-600/10"
                  : "text-gray-600 bg-gray-600/10"
              )}
            >
              {isActive ? (
                <Translate content="active" />
              ) : isExpired ? (
                <Translate content="expired" />
              ) : (
                <Translate content="inactive" />
              )}
            </span>
            <span className="text-[--biqpod-text-secondary]">
              <Translate content="expires" />:{" "}
              {new Date(coupon.endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(coupon.code);
                showToast("coupon code copied", "success");
              }}
              className="bg-[--biqpod-gray-opacity] hover:bg-[--biqpod-gray-opacity-2] px-2 py-1 text-[--biqpod-text-color] text-xs"
            >
              <Icon icon={allIcons.solid.faCopy} className="mr-1 text-xs" />
              <Translate content="copy" />
            </Button>
          </div>
        </div>
        {/* Decorative corner ribbon for active coupons */}
        {isActive && (
          <div className="top-0 right-0 absolute border-t-[50px] border-t-green-500 border-l-[50px] border-l-transparent w-0 h-0">
            <Icon
              icon={allIcons.solid.faCheck}
              className="top-[-45px] right-[-15px] absolute text-white text-xs"
            />
          </div>
        )}
      </Card>
    </motion.div>
  );
});
export const Coupons = () => {
  const user = useUser();
  const coupons = useTemp<Biqpod.Snapbuy.Coupon[]>("fetched-coupons");
  const lastDoc = useCopyState<Biqpod.Snapbuy.Coupon | null>(null);
  const hasMore = useCopyState(true);
  const storeId = useStoreId();
  const showFilter = useCopyState(false); // Add filter state
  const action = useAction(
    "fetch-coupons",
    async (next = false) => {
      if (!storeId) return;
      const newCoupons = await getDocs<Biqpod.Snapbuy.Coupon>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "coupons"],
        {
          where: and(where("storeId", "==", storeId)),
          orders: mergeArray(orderBy("createdAt", "desc")),
          limit: PAGE_SIZE,
          startAt: next && lastDoc.get?.id && mergeArray(lastDoc.get?.id),
        }
      );
      if (!newCoupons) return;
      const list = newCoupons.map((coupon) => ({
        ...coupon.data,
        id: coupon.id,
      }));
      coupons.set((prev) => (next ? [...(prev || []), ...list] : list));
      const lastDocRef = newCoupons.at(-1)?.data;
      lastDoc.set(lastDocRef ? lastDocRef : null);
      hasMore.set(newCoupons.length === PAGE_SIZE);
    },
    [storeId]
  );
  const success = isSuccess(action);
  const loading = isLoading(action);
  useEffect(() => {
    execAction("fetch-coupons");
  }, [user]);
  const options = useTemp<FilterOptionsForCoupon>("filter-coupons-options");
  const search = getFieldValue("coupon-search");
  const [_, filterCoupons] = useMemoDelay(
    () => {
      let filteredCoupons = coupons.get?.filter((coupon) => {
        if (options.get) {
          // Filter by active status
          if (
            options.get.isActive !== null &&
            options.get.isActive !== undefined
          ) {
            if (coupon.isActive !== (options.get.isActive === "true")) {
              return false;
            }
          }
          // Filter by type
          if (options.get.type && coupon.type !== options.get.type) {
            return false;
          }
          // Filter by expiry status
          if (
            options.get.expired !== null &&
            options.get.expired !== undefined
          ) {
            const isExpired = new Date(coupon.endDate) < new Date();
            if (isExpired !== (options.get.expired === "true")) {
              return false;
            }
          }
        }
        return true;
      });
      if (!search) return filteredCoupons;
      // Search in both name and code
      return filteredCoupons?.filter(
        (coupon) =>
          coupon.name?.toLowerCase().includes(search.toLowerCase()) ||
          coupon.code?.toLowerCase().includes(search.toLowerCase())
      );
    },
    [search, coupons.get, options.get],
    500
  );
  const listRef = useRef<any>(null);
  const position = getPosition("coupon-searching");
  const { height } = useResolution();
  const listHeight = useMemo(() => {
    const posHeight = position?.height || 0;
    const posTop = position?.top || 0;
    return height - posHeight - posTop;
  }, [position, height]);
  const RenderItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const coupon = filterCoupons?.at(index);
      if (!coupon) return <div style={style} />;
      return (
        <div style={style} className="p-2">
          <CouponRender coupon={coupon} />
        </div>
      );
    },
    [filterCoupons]
  );
  return (
    <div className="relative flex flex-col h-full">
      <PositionView positionId="coupon-searching">
        <div className="flex justify-between items-center gap-2 p-2">
          <div className="relative flex justify-center w-full">
            <Field
              inputName="coupon-search"
              placeholder="search coupons by name or code"
              className="rounded-xl"
            />
            <span className="top-1/2 right-2 absolute font-bold text-[--biqpod-primary] -translate-y-1/2">
              / {filterCoupons?.length || 0}
            </span>
          </div>
          <CircleTip
            icon={allIcons.solid.faFilter}
            onClick={() => {
              showFilter.set(true);
            }}
          />
        </div>
        <Line />
      </PositionView>
      {loading ? (
        <div className="flex flex-col gap-2 p-2">
          {range(5).map((_, index) => {
            return (
              <div key={index} className="p-2 w-full">
                <CardWait className="rounded-2xl h-[60px]" />
              </div>
            );
          })}
        </div>
      ) : success && filterCoupons?.length ? (
        <List
          ref={listRef}
          height={listHeight}
          itemCount={filterCoupons.length}
          itemSize={200}
          width="100%"
        >
          {RenderItem}
        </List>
      ) : (
        <EmptyComponent>
          <div className="flex justify-center items-center p-8 h-full">
            <Icon
              icon={allIcons.solid.faTicket}
              className="text-[--biqpod-primary] text-9xl"
            />
          </div>
          <Line />
          <div className="flex flex-col justify-center items-center gap-4 p-6 h-full">
            <div className="font-semibold text-2xl text-center">
              <Translate content="no coupons found" />
            </div>
            <div className="text-[--biqpod-text-secondary] text-sm text-center">
              <Translate content="create your first coupon to get started" />
            </div>
          </div>
          <Line />
          <div className="p-2">
            <Button
              onClick={() => {
                showPopup(<UpsertCoupon />);
              }}
              icon={allIcons.solid.faPlus}
              className="rounded-full"
            >
              <Translate content="create coupon" />
            </Button>
          </div>
        </EmptyComponent>
      )}
      {/* Sliding Filter */}
      <SlidingCouponFilter
        isOpen={showFilter.get}
        onClose={() => showFilter.set(false)}
        value={options.get || undefined}
        onChange={options.set}
      />
    </div>
  );
};
