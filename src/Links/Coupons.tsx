import { allIcons, and, where } from "@biqpod/app/ui/apis";
import { mergeArray, tw } from "@biqpod/app/ui/utils";
import {
  Button,
  Card,
  CircleTip,
  Field,
  Icon,
  Key,
  Line,
  PositionView,
  Translate,
} from "@biqpod/app/ui/components";
import {
  confirm,
  execAction,
  getFieldValue,
  getPosition,
  isIdle,
  isLoading,
  isSuccess,
  openMenu,
  showPopup,
  showToast,
  useAction,
  useCopyState,
  useEffectDelay,
  useMemoDelay,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { useMemo, useRef, useCallback, memo } from "react";
import { FixedSizeList as List } from "react-window";
import { getDocs } from "../server";
import { motion } from "framer-motion";
import { useUsedBy } from "../routes/Stores/Stores";
import { useStoreId } from "../utils";
import { UpsertCoupon } from "./UpsertCoupon";
import { SlidingFilter, FilterOption } from "../components/SlidingFilter";
import { Biqpod } from "@biqpod/app/ui/types";
import { snapbuyApi } from "../apis";
import { OrdersOfCoupon } from "./OrdersOfCoupon";
import { CreateFirstUI } from "../components/CreateFirstUI";
import { LoadingData } from "./LoadingData";
import { setTextSide } from "../hooks/usePayments";
const PAGE_SIZE = 100;
// Highlight component for search terms
function highlightMatch(
  text: string,
  search: string | undefined
): React.ReactNode {
  if (!search || search.trim() === "") return text;
  const searchLower = search.toLowerCase().trim();
  const textLower = text.toLowerCase();
  // Find all matches for highlighting
  const matches: { start: number; end: number }[] = [];
  // Exact substring matches
  let index = textLower.indexOf(searchLower);
  while (index !== -1) {
    matches.push({ start: index, end: index + searchLower.length });
    index = textLower.indexOf(searchLower, index + 1);
  }
  // If no exact matches, try fuzzy matching
  if (matches.length === 0) {
    let searchIdx = 0;
    for (let i = 0; i < text.length && searchIdx < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIdx]) {
        matches.push({ start: i, end: i + 1 });
        searchIdx++;
      }
    }
  }
  if (matches.length === 0) return text;
  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);
  // Merge overlapping matches
  const mergedMatches: { start: number; end: number }[] = [];
  for (const match of matches) {
    if (mergedMatches.length === 0) {
      mergedMatches.push(match);
    } else {
      const last = mergedMatches[mergedMatches.length - 1];
      if (match.start <= last.end) {
        last.end = Math.max(last.end, match.end);
      } else {
        mergedMatches.push(match);
      }
    }
  }
  // Build the highlighted text
  const result: React.ReactNode[] = [];
  let lastEnd = 0;
  mergedMatches.forEach((match, index) => {
    // Add text before the match
    if (match.start > lastEnd) {
      result.push(text.substring(lastEnd, match.start));
    }
    // Add highlighted match
    result.push(
      <span key={index} className="font-bold text-[--biqpod-primary] underline">
        {text.substring(match.start, match.end)}
      </span>
    );
    lastEnd = match.end;
  });
  // Add remaining text
  if (lastEnd < text.length) {
    result.push(text.substring(lastEnd));
  }
  return result;
}
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
  const filterOptions: FilterOption[] = [
    {
      key: "isActive",
      label: "status",
      component: (
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
      ),
    },
    {
      key: "type",
      label: "type",
      component: (
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
      ),
    },
    {
      key: "expired",
      label: "expiry status",
      component: (
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
      ),
    },
  ];
  return (
    <SlidingFilter
      isOpen={isOpen}
      onClose={onClose}
      title="filter coupons"
      value={value}
      onChange={onChange}
      options={filterOptions}
    />
  );
};
const CouponRender = memo(
  ({
    coupon,
    searchTerm,
    usedBy,
  }: {
    coupon: Biqpod.Snapbuy.Coupon;
    searchTerm?: string;
    usedBy: string | null;
  }) => {
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
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          className={tw(
            "relative overflow-hidden border-l-4 transition-all",
            isActive ? "border-l-green-500" : "border-l-red-500 opacity-70",
            usedBy === "owned" || usedBy === "read/edit" ? "cursor-pointer" : ""
          )}
          onClick={
            usedBy === "owned" || usedBy === "read/edit"
              ? () => {
                  showPopup(<UpsertCoupon coupon={coupon} />);
                }
              : undefined
          }
        >
          <div className="flex justify-between items-center p-2">
            <div className="flex items-center gap-3">
              <div
                className={tw(
                  "flex items-center justify-center w-12 h-12 rounded-full",
                  isActive
                    ? "bg-green-600/10 text-green-600"
                    : "bg-red-600/10 text-red-600"
                )}
              >
                <Icon icon={getTypeIcon()} className="md:text-xl" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-[--biqpod-text] md:text-lg">
                  {highlightMatch(coupon.name || "", searchTerm)}
                </h3>
                <p className="font-mono text-[--biqpod-text-secondary]">
                  <Translate content="code" />:{" "}
                  <Key className="max-md:p-1">
                    {highlightMatch(coupon.code || "", searchTerm)}
                  </Key>
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
                  "md:text-2xl font-bold",
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
          <div className="flex justify-between items-center p-2 text-sm">
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
            <div className="flex items-center gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(coupon.code);
                  showToast("coupon code copied", "success");
                }}
                className="bg-[--biqpod-gray-opacity] hover:bg-[--biqpod-gray-opacity-2] rounded-full text-[--biqpod-text-color] text-xs"
                icon={allIcons.regular.faCopy}
              >
                <span className="max-md:hidden">
                  <Translate content="copy" />
                </span>
              </Button>
              {usedBy === "owned" || usedBy === "read/edit" ? (
                <div>
                  <CircleTip
                    onClick={(e) => {
                      e.stopPropagation();
                      openMenu({
                        x: e.clientX,
                        y: e.clientY,
                        menu: [
                          {
                            label: "View Orders",
                            click() {
                              showPopup(<OrdersOfCoupon coupon={coupon} />);
                            },
                            defaultIcon: allIcons.solid.faShoppingCart,
                          },
                          {
                            type: "separator",
                          },
                          {
                            click() {
                              execAction("update-coupon", {
                                id: coupon.id,
                                isActive: !coupon.isActive,
                              });
                            },
                            label: coupon.isActive ? "desactive" : "active",
                            defaultIcon: allIcons.solid.faPowerOff,
                          },
                          {
                            label: "edit",
                            click() {
                              showPopup(<UpsertCoupon coupon={coupon} />);
                            },
                            defaultIcon: allIcons.solid.faEdit,
                          },
                          {
                            label: "delete",
                            async click() {
                              const response = await confirm({
                                title: "Delete Coupon",
                                message: `are you sure you want to delete the coupon "${coupon.name}"? this action cannot be undone.`,
                                detail: "all associated data will be lost",
                                type: "warning",
                              });
                              if (coupon.id && response) {
                                setTextSide("Deleting coupon...");
                                await snapbuyApi.coupon.delete(coupon.id);
                                setTextSide("Refreshing coupons...");
                                showToast(
                                  "Coupon deleted successfully",
                                  "success"
                                );
                                await execAction("fetch-coupons");
                                setTextSide();
                              }
                            },
                            defaultIcon: allIcons.solid.faTrash,
                          },
                        ],
                      });
                    }}
                    icon={allIcons.solid.faEllipsisH}
                  />
                </div>
              ) : null}
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
  }
);
export const Coupons = () => {
  const user = useUser();
  const coupons = useTemp<Biqpod.Snapbuy.Coupon[]>("fetched-coupons");
  const lastDoc = useCopyState<Biqpod.Snapbuy.Coupon | null>(null);
  const hasMore = useCopyState(true);
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const showFilter = useCopyState(false); // Add filter state
  const action = useAction(
    "fetch-coupons",
    async (next = false) => {
      if (!storeId) return;
      const newCoupons = await getDocs<Biqpod.Snapbuy.Coupon>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "coupons"],
        {
          where: and(where("storeId", "==", storeId)),
          // orders: mergeArray(orderBy("createdAt", "desc")),
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
  useAction(
    "update-coupon",
    async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await snapbuyApi.coupon.upsert({ isActive, id, storeId } as any);
      execAction("fetch-coupons");
    },
    [storeId]
  );
  const success = isSuccess(action);
  const loading = isLoading(action);
  const idle = isIdle(action);
  useEffectDelay(
    () => {
      if (storeId && user) execAction("fetch-coupons");
    },
    [user, storeId],
    200
  );
  const options = useTemp<FilterOptionsForCoupon>("filter-coupons-options");
  const search = getFieldValue("coupon-search");
  const [_, filterCoupons] = useMemoDelay(
    () => {
      const filteredCoupons = coupons.get?.filter((coupon) => {
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
      // Custom fuzzy search for multiple fields
      const searchTerm = search.trim().toLowerCase();
      return filteredCoupons
        ?.filter((coupon) => {
          const nameScore = coupon.name
            ? getSearchScore(coupon.name, searchTerm)
            : 0;
          const codeScore = coupon.code
            ? getSearchScore(coupon.code, searchTerm)
            : 0;
          return nameScore > 0 || codeScore > 0;
        })
        .sort((a, b) => {
          const aScore = Math.max(
            a.name ? getSearchScore(a.name, searchTerm) : 0,
            a.code ? getSearchScore(a.code, searchTerm) : 0
          );
          const bScore = Math.max(
            b.name ? getSearchScore(b.name, searchTerm) : 0,
            b.code ? getSearchScore(b.code, searchTerm) : 0
          );
          return bScore - aScore;
        });
    },
    [search, coupons.get, options.get],
    500
  );
  // Helper function for search scoring
  function getSearchScore(text: string, search: string): number {
    if (!search) return 1000;
    const textLower = text.toLowerCase();
    const searchLower = search.toLowerCase();
    if (textLower === searchLower) return 1000; // exact match
    if (textLower.startsWith(searchLower)) return 900; // prefix match
    const idx = textLower.indexOf(searchLower);
    if (idx !== -1) return 800 - idx; // substring match, earlier is better
    // Fuzzy: count matching chars in order
    let sIdx = 0,
      match = 0;
    for (let c of textLower) {
      if (c === searchLower[sIdx]) {
        match++;
        sIdx++;
        if (sIdx === searchLower.length) break;
      }
    }
    return match === searchLower.length ? 700 - textLower.length : 0;
  }
  const listRef = useRef<any>(null);
  const position = getPosition("coupon-list");
  const listHeight = useMemo(() => {
    const posHeight = position?.height || 0;
    return posHeight;
  }, [position?.height]);
  const RenderItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const coupon = filterCoupons?.at(index);
      if (!coupon) return <div style={style} />;
      return (
        <div style={style} className="p-2">
          <CouponRender coupon={coupon} searchTerm={search} usedBy={usedBy} />
        </div>
      );
    },
    [filterCoupons, search, usedBy]
  );
  return (
    <motion.div
      className="relative flex flex-col h-full overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
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
      {idle || loading ? (
        <LoadingData />
      ) : (
        success && (
          <PositionView
            positionId="coupon-list"
            className="flex flex-col h-full overflow-hidden"
          >
            {!!filterCoupons?.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="h-full"
              >
                <List
                  ref={listRef}
                  height={listHeight}
                  itemCount={filterCoupons.length}
                  itemSize={180}
                  width="100%"
                >
                  {RenderItem}
                </List>
              </motion.div>
            )}
            {!filterCoupons?.length && (
              <CreateFirstUI
                photo="https://cdn3d.iconscout.com/3d/premium/thumb/coupon-3d-icon-png-download-5523041.png"
                title="No Coupons Found"
                description="Create your first coupon to get started"
              />
            )}
            <Line />
            {(usedBy === "owned" || usedBy === "read/edit") && (
              <div className="p-2">
                <Button
                  onClick={() => {
                    showPopup(<UpsertCoupon />);
                  }}
                  className="rounded-full"
                  icon={allIcons.solid.faPlus}
                >
                  <Translate content="create" />
                </Button>
              </div>
            )}
          </PositionView>
        )
      )}
      {/* Sliding Filter */}
      <SlidingCouponFilter
        isOpen={showFilter.get}
        onClose={() => showFilter.set(false)}
        value={options.get || undefined}
        onChange={options.set}
      />
    </motion.div>
  );
};
