import {
  Button,
  Card,
  CardHeaderForPopup,
  CardWait,
  CircleTip,
  EmptyComponent,
  Field,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { useStoreId } from "../utils";
import { snapbuyApi } from "../apis";
import { useUsedBy } from "../routes/Stores/Stores";
import {
  execAction,
  getFieldValue,
  showPopup,
  useAction,
  useCopyState,
  useEffectDelay,
} from "@biqpod/app/ui/hooks";
import { UpsertBrand } from "./UpsertBrand";
import { allIcons } from "@biqpod/app/ui/apis";
import notFounPhoto from "../assets/page-not-found.png";
import { useActionStatus } from "../routes/Clients/CartPopup";
import { delay, range, tw } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Biqpod } from "@biqpod/app/ui/types";
// Fuzzy search function
function filterFuzzySearch<T>(
  list: T[],
  search: string,
  keys: (keyof T)[]
): T[] {
  if (!search) return list;
  const normSearch = search.trim().toLowerCase();
  // Score function: higher is better
  function score(str: string): number {
    str = str.toLowerCase();
    if (str === normSearch) return 1000; // exact match
    if (str.startsWith(normSearch)) return 900; // prefix match
    const idx = str.indexOf(normSearch);
    if (idx !== -1) return 800 - idx; // substring match, earlier is better
    // Fuzzy: count matching chars in order
    let sIdx = 0,
      match = 0;
    for (let c of str) {
      if (c === normSearch[sIdx]) {
        match++;
        sIdx++;
        if (sIdx === normSearch.length) break;
      }
    }
    return match === normSearch.length ? 700 - str.length : 0;
  }
  return list
    .map((item) => {
      let maxScore = 0;
      // Check all specified keys and take the highest score
      for (const key of keys) {
        const value = String(item[key] ?? "");
        const keyScore = score(value);
        if (keyScore > maxScore) {
          maxScore = keyScore;
        }
      }
      return { item, score: maxScore };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
// Highlight component for search terms
const FilterBrandsPopup = ({
  onApply,
}: {
  onApply: (filters: any) => void;
}) => {
  const tempFilters = useCopyState({
    noPhoto: false,
    startAt: null as string | null,
    endAt: null as string | null,
  });
  return (
    <Card>
      <CardHeaderForPopup title="Filter Brands" />
      <Line />
      <div className="space-y-3 p-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={tempFilters.get.noPhoto}
            onChange={(e) =>
              tempFilters.set({ ...tempFilters.get, noPhoto: e.target.checked })
            }
            className="w-4 h-4"
          />
          <span>Show only brands without photo</span>
        </label>
        {/* Time range filters - TODO: Add when brand properties are available */}
        <div className="space-y-2">
          <label className="block font-medium text-sm">Time Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={tempFilters.get.startAt || ""}
              onChange={(e) =>
                tempFilters.set({
                  ...tempFilters.get,
                  startAt: e.target.value || null,
                })
              }
              className="flex-1 p-2 border rounded"
              placeholder="Start date"
            />
            <span className="self-center">to</span>
            <input
              type="date"
              value={tempFilters.get.endAt || ""}
              onChange={(e) =>
                tempFilters.set({
                  ...tempFilters.get,
                  endAt: e.target.value || null,
                })
              }
              className="flex-1 p-2 border rounded"
              placeholder="End date"
            />
          </div>
        </div>
      </div>
      <Line />
      <div className="flex justify-end gap-2 p-3">
        <Button
          onClick={() => {
            onApply(tempFilters.get);
            // Popup will close automatically or user can close it
          }}
          className="rounded-full"
        >
          Apply
        </Button>
      </div>
    </Card>
  );
};
export const Brands = () => {
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const brands = useCopyState<Biqpod.Snapbuy.Brand[]>([]);
  const searchQuery = getFieldValue("search-brand");
  const filters = useCopyState({
    noPhoto: false,
    startAt: null as string | null,
    endAt: null as string | null,
  });
  const action = useAction(
    "fetch-brands",
    async () => {
      if (!storeId) return null;
      await delay(1000);
      const result = await snapbuyApi.brands.getAll(storeId);
      brands.set(result);
    },
    [storeId]
  );
  const { isLoading, isSuccess } = useActionStatus(action);
  useEffectDelay(
    () => {
      execAction("fetch-brands");
    },
    [],
    300
  );
  const filteredBrands = useMemo(() => {
    let filtered = filterFuzzySearch(brands.get, searchQuery || "", [
      "name",
      "description",
    ]);
    if (filters.get.noPhoto) {
      filtered = filtered.filter((brand) => !brand.photo);
    }
    // TODO: Add time range filtering when brand properties are available
    return filtered;
  }, [brands.get, searchQuery, filters.get]);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 p-2"
      >
        <Field
          inputName="search-brand"
          placeholder="Search for a brand..."
          className="flex-1 rounded-2xl"
        />
        <CircleTip
          onClick={(e) => {
            e.stopPropagation();
            showPopup(<FilterBrandsPopup onApply={(f) => filters.set(f)} />);
          }}
          icon={allIcons.solid.faFilter}
        />
      </motion.div>
      <Line />
      <Scroll>
        {isSuccess && !!filteredBrands.length && (
          <AnimatePresence>
            {filteredBrands.map((brand, index) => {
              return (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  className="flex justify-between items-center gap-2 hover:bg-[--biqpod-gray-opacity] odd:bg-[--biqpod-secondary-background] p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {brand.photo ? (
                        <img
                          src={brand.photo}
                          className="h-[50px]"
                          alt={brand.name}
                        />
                      ) : (
                        <div className="flex justify-center items-center bg-[--biqpod-gray-opacity] shadow-md border border-[--biqpod-borders] border-solid rounded-xl w-16 h-16">
                          <span className="font-bold text-[--biqpod-text-color] text-xs">
                            {brand.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {usedBy === "owned" || usedBy === "read/edit" ? (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CircleTip
                          onClick={() => {
                            showPopup(<UpsertBrand brand={brand} />);
                          }}
                          icon={allIcons.solid.faChevronRight}
                        />
                      </motion.div>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        {isSuccess && !filteredBrands.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center items-center h-full"
          >
            <Card>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center items-center"
              >
                <img src={notFounPhoto} alt="" />
              </motion.div>
              <Line />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="p-2"
              >
                <Translate
                  content={
                    searchQuery
                      ? "No brands found matching your search. Try a different search term."
                      : "No brands found. You can create a new brand by clicking the button below."
                  }
                />
              </motion.div>
            </Card>
          </motion.div>
        )}
        {isLoading && (
          <Scroll>
            <div className="flex flex-col gap-2 p-1">
              {range(10).map((index) => {
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                  >
                    <CardWait className="flex items-center gap-2 p-2 rounded-2xl h-[80px]">
                      <CardWait className="rounded-full w-[60px] h-[60px]" />
                      <CardWait
                        className={tw(
                          "h-[20px] rounded-full",
                          index % 2 === 0 ? "w-[200px]" : "w-[150px]"
                        )}
                      />
                    </CardWait>
                  </motion.div>
                );
              })}
            </div>
          </Scroll>
        )}
      </Scroll>
      {usedBy === "owned" || usedBy === "read/edit" ? (
        <EmptyComponent>
          <Line />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="p-2"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                icon={allIcons.solid.faPlus}
                onClick={() => {
                  showPopup(<UpsertBrand />);
                }}
                className="rounded-full w-full"
              >
                <Translate content="create brand" />
              </Button>
            </motion.div>
          </motion.div>
        </EmptyComponent>
      ) : null}
    </div>
  );
};
