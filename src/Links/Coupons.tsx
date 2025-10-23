import { allIcons, and, orderBy, where } from "@biqpod/app/ui/apis";
import { mergeArray, range, tw } from "@biqpod/app/ui/utils";
import {
  Button,
  Card,
  CardWait,
  CircleTip,
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
  isIdle,
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
import { motion } from "framer-motion";
import { useUsedBy } from "../routes/Stores/Stores";
import { useStoreId } from "../utils";
import { UpsertCoupon } from "./UpsertCoupon";
import { SlidingFilter, FilterOption } from "../components/SlidingFilter";
const PAGE_SIZE = 20;

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
    coupon: Snapbuy.Coupon;
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
                  showPopup(<UpsertCoupon back coupon={coupon} />);
                }
              : undefined
          }
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
                <Icon icon={getTypeIcon()} iconClassName="text-xl" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-[--biqpod-text] text-lg">
                  {highlightMatch(coupon.name || "", searchTerm)}
                </h3>
                <p className="font-mono text-[--biqpod-text-secondary] text-sm">
                  <Translate content="code" />:{" "}
                  <Key>{highlightMatch(coupon.code || "", searchTerm)}</Key>
                </p>
                {coupon.description && (
                  <p className="mt-1 text-[--biqpod-text-secondary] text-xs">
                    {coupon.description}
                  </p>
                )}
                {coupon.applicableProducts &&
                  coupon.applicableProducts.length > 0 && (
                    <p className="mt-1 text-[--biqpod-primary] text-xs">
                      <Icon icon={allIcons.solid.faBox} iconClassName="mr-1" />
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
                <Icon
                  icon={allIcons.solid.faCopy}
                  iconClassName="text-xs mr-1"
                />
                <Translate content="copy" />
              </Button>
            </div>
          </div>
          {/* Decorative corner ribbon for active coupons */}
          {isActive && (
            <div className="top-0 right-0 absolute border-t-[50px] border-t-green-500 border-l-[50px] border-l-transparent w-0 h-0">
              <Icon
                icon={allIcons.solid.faCheck}
                iconClassName="absolute top-[-45px] right-[-15px] text-white text-xs"
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
  const coupons = useTemp<Snapbuy.Coupon[]>("fetched-coupons");
  const lastDoc = useCopyState<Snapbuy.Coupon | null>(null);
  const hasMore = useCopyState(true);
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const showFilter = useCopyState(false); // Add filter state
  const action = useAction(
    "fetch-coupons",
    async (next = false) => {
      if (!storeId) return;
      const newCoupons = await getDocs<Snapbuy.Coupon>(
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
  const idle = isIdle(action);
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
  const position = getPosition("coupon-searching");
  const { height } = useResolution();
  const listHeight = useMemo(() => {
    const posHeight = position?.height || 0;
    const posTop = position?.top || 0;
    return height - posHeight - posTop - 200;
  }, [position, height]);
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
        <motion.div
          className="flex flex-col gap-2 p-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {range(5).map((_, index) => {
            return (
              <motion.div
                key={index}
                className="p-2 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <CardWait className="rounded-2xl h-[60px]" />
              </motion.div>
            );
          })}
        </motion.div>
      ) : success && filterCoupons?.length ? (
        <div className="flex flex-col h-full">
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
              itemSize={200}
              width="100%"
            >
              {RenderItem}
            </List>
          </motion.div>
          <Line />
          {usedBy === "owned" || usedBy === "read/edit" ? (
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
          ) : null}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col h-full"
        >
          <motion.div
            className="flex justify-center items-center p-8 h-full"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Icon
                icon={allIcons.solid.faTicket}
                iconClassName="text-9xl text-[--biqpod-primary]"
              />
            </motion.div>
          </motion.div>
          <Line />
          <motion.div
            className="flex flex-col justify-center items-center gap-4 p-6 h-full"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="font-semibold text-2xl text-center">
              <Translate content="no coupons found" />
            </div>
            <div className="text-[--biqpod-text-secondary] text-sm text-center">
              <Translate content="create your first coupon to get started" />
            </div>
          </motion.div>
          <Line />
          {usedBy === "owned" || usedBy === "read/edit" ? (
            <motion.div
              className="p-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={() => {
                    showPopup(<UpsertCoupon />);
                  }}
                  icon={allIcons.solid.faPlus}
                  className="rounded-full"
                >
                  <Translate content="create coupon" />
                </Button>
              </motion.div>
            </motion.div>
          ) : null}
        </motion.div>
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
