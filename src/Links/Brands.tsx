import * as React from "react";
import {
  Button,
  Card,
  CardWait,
  CircleTip,
  Field,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { useStoreId } from "../utils";
import { snapbuyApi } from "../apis";
import { useUsedBy } from "../routes/Stores/Stores";
import {
  confirm,
  execAction,
  getFieldValue,
  openMenu,
  showPopup,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { UpsertBrand } from "./UpsertBrand";
import { allIcons } from "@biqpod/app/ui/apis";
import notFounPhoto from "../assets/page-not-found.png";
import { useActionStatus } from "../routes/Clients/CartPopup";
import { delay, range, tw } from "@biqpod/app/ui/utils";
import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
export const Brands = () => {
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const brands = useCopyState<SnapBuy.Brand[]>([]);
  const searchQuery = getFieldValue("search-brand");
  const action = useAction(
    "fetch-brands",
    async () => {
      if (!storeId) return null;
      await delay(1000);
      const result = await snapbuyApi.getAllBrands(storeId);
      brands.set(result);
    },
    [storeId]
  );
  const { isLoading, isSuccess } = useActionStatus(action);
  useEffect(() => {
    execAction("fetch-brands");
  }, []);
  const filteredBrands = useMemo(() => {
    return filterFuzzySearch(brands.get, searchQuery || "", [
      "name",
      "description",
    ]);
  }, [brands.get, searchQuery]);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-2"
      >
        <Field
          inputName="search-brand"
          placeholder="Search for a brand..."
          className="rounded-2xl"
        />
      </motion.div>
      <Line />
      {isSuccess && !!filteredBrands.length && (
        <Scroll>
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
                    <div className="flex flex-col">
                      <span className="font-medium text-base">
                        {highlightMatch(brand.name || "", searchQuery)}
                      </span>
                      {brand.description && (
                        <span className="max-w-[250px] text-[--biqpod-gray-opacity] text-sm truncate">
                          {highlightMatch(brand.description, searchQuery)}
                        </span>
                      )}
                    </div>
                    {usedBy === "owned" || usedBy === "read/edit" ? (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CircleTip
                          onClick={(e) => {
                            e.stopPropagation();
                            openMenu({
                              x: e.clientX,
                              y: e.clientY,
                              menu: [
                                ...(usedBy === "owned" || usedBy === "read/edit"
                                  ? [
                                      {
                                        label: "Edit",
                                        click: () => {
                                          showPopup(
                                            <UpsertBrand brand={brand} />
                                          );
                                        },
                                        defaultIcon: allIcons.solid.faPen,
                                      },
                                      {
                                        type: "separator" as const,
                                      },
                                      {
                                        label: "Delete",
                                        click: async () => {
                                          const response = await confirm({
                                            title: "Delete Brand",
                                            message: `Are you sure you want to delete the brand \"${brand.name}\"? This action cannot be undone.`,
                                          });
                                          if (!response) return;
                                          await snapbuyApi.deleteBrand(
                                            brand.id!
                                          );
                                          showToast(
                                            "Brand deleted successfully",
                                            "success"
                                          );
                                          execAction("fetch-brands");
                                        },
                                        defaultIcon: allIcons.solid.faTrash,
                                      },
                                    ]
                                  : []),
                              ],
                            });
                          }}
                          icon={allIcons.solid.faEllipsisVertical}
                        />
                      </motion.div>
                    ) : null}
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
        </Scroll>
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
            {range(20).map((index) => {
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
      {usedBy === "owned" || usedBy === "read/edit" ? (
        <>
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
        </>
      ) : null}
    </div>
  );
};
