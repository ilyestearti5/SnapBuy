import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  CircleTip,
  Field,
  Line,
  PositionView,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  openMenu,
  showPopup,
  confirm,
  showToast,
  useAction,
  useCopyState,
  execAction,
  useUser,
  isLoading,
  isSuccess,
  getFieldValue,
  getPosition,
  useMemoDelay,
  useResolution,
  useEffectDelay,
  closePopup,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { useUsedBy } from "../routes/Stores/Stores";
import { UpsertPack } from "./UpsertPack";
import { useMemo } from "react";
import { filterFuzzySearch } from "@biqpod/app/ui/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Biqpod } from "@biqpod/app/ui/types";
import { CreateFirstUI } from "../components/CreateFirstUI";
import { LoadingData } from "./LoadingData";
import { setTextSide } from "../hooks/usePayments";
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
export const Packs = () => {
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const packs = useCopyState<Biqpod.Snapbuy.Pack[]>([]);
  const fetchingAction = useAction(
    "fetch-packs",
    async () => {
      if (!storeId) return null;
      const list = await snapbuyApi.packs.getAll(storeId);
      packs.set(list);
    },
    [storeId]
  );
  const user = useUser();
  const fetchingActionSuccess = isSuccess(fetchingAction);
  const fetchingActionLoading = isLoading(fetchingAction);
  useAction(
    "delete-pack",
    async ({ packId }: { packId: string }) => {
      const response = await confirm({
        title: "Delete Pack",
        message: "Are you sure you want to delete this pack?",
      });
      if (!response) return;
      setTextSide("Deleting pack...");
      await snapbuyApi.packs.delete(packId);
      setTextSide("Refetching Packs...");
      await execAction("fetch-packs");
      setTextSide();
    },
    [storeId, user]
  );
  useEffectDelay(
    () => {
      execAction("fetch-packs");
    },
    [storeId],
    300
  );
  // Search functionality with fuzzy search
  const search = getFieldValue("pack-search");
  const [_, filteredPacks] = useMemoDelay(
    () => {
      if (!search) return packs.get;
      return filterFuzzySearch(packs.get || [], search, "name");
    },
    [search, packs.get],
    300
  );
  // Position and height calculation for proper layout
  const position = getPosition("pack-searching");
  const { height } = useResolution();
  const scrollHeight = useMemo(() => {
    const posHeight = position?.height || 0;
    const posTop = position?.top || 0;
    return height - posHeight - posTop; // Account for header and footer
  }, [position, height]);
  useAction(
    "upsert-pack",
    async (packInfo: Biqpod.Snapbuy.Pack) => {
      if (!user) {
        showToast("You must be logged in to add a pack");
        return;
      }
      if (!storeId) {
        showToast("Store not found");
        return;
      }
      if (!packInfo.name) {
        showToast("Pack name is required");
        return;
      }
      if (!packInfo.products || packInfo.products.length === 0) {
        showToast("Pack must have at least one product");
        return;
      }
      closePopup();
      setTextSide("Adding Pack...");
      if (packInfo.id) {
        await snapbuyApi.packs.update(packInfo.id, {
          ...packInfo,
          storeId,
        });
      } else {
        await snapbuyApi.packs.add({
          ...packInfo,
          storeId,
        });
      }
      showToast("Pack saved successfully");
      setTextSide("Refreshing Packs...");
      await execAction("fetch-packs");
      setTextSide();
    },
    [storeId, user]
  );
  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <PositionView positionId="pack-searching">
        <div className="flex justify-between items-center gap-2 p-2">
          <div className="relative flex justify-center w-full">
            <Field
              inputName="pack-search"
              placeholder="Search packs by name"
              className="rounded-xl"
            />
            <span className="top-1/2 right-2 absolute font-bold text-[--biqpod-primary] -translate-y-1/2">
              / {filteredPacks?.length || 0}
            </span>
          </div>
        </div>
        <Line />
      </PositionView>
      <div style={{ height: scrollHeight }} className="overflow-hidden">
        {fetchingActionSuccess && (
          <Scroll>
            {!!filteredPacks?.length && (
              <AnimatePresence>
                {filteredPacks?.map((pack, index) => {
                  return (
                    <motion.div
                      key={pack.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.1,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.98 }}
                      className="flex justify-between items-center gap-2 hover:bg-[--biqpod-gray-opacity] odd:bg-[--biqpod-primary-background] p-2 rounded-lg cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="inline-flex justify-center items-center bg-red-500 rounded-full w-[18px] h-[18px] font-bold text-white text-xs pointer-events-none">
                            {pack.products?.length}
                          </span>
                          <span>{highlightMatch(pack.name || "", search)}</span>
                        </div>
                      </div>
                      <div className="flex">
                        {usedBy === "owned" || usedBy === "read/edit" ? (
                          <>
                            <div>
                              <CircleTip
                                onClick={({ clientX, clientY }) => {
                                  openMenu({
                                    x: clientX,
                                    y: clientY,
                                    menu: [
                                      {
                                        label: "Copy",
                                        defaultIcon: allIcons.regular.faCopy,
                                        click: async () => {
                                          const baseUrl =
                                            window.location.origin;
                                          const packUrl = `${baseUrl}/pack/${pack.id}`;
                                          await navigator.clipboard.writeText(
                                            packUrl
                                          );
                                          showToast(
                                            "Pack URL copied to clipboard"
                                          );
                                        },
                                      },
                                      {
                                        label: "Preview",
                                        defaultIcon: allIcons.solid.faEye,
                                        click: () => {
                                          const baseUrl =
                                            window.location.origin;
                                          const packUrl = `${baseUrl}/pack/${pack.id}`;
                                          const a = document.createElement("a");
                                          a.href = packUrl;
                                          a.target = "_blank";
                                          a.click();
                                        },
                                      },
                                      {
                                        type: "separator",
                                      },
                                      {
                                        label: "Delete",
                                        click: async () => {
                                          execAction("delete-pack", {
                                            packId: pack.id,
                                          });
                                        },
                                        defaultIcon: allIcons.solid.faTrash,
                                      },
                                    ],
                                  });
                                }}
                                icon={allIcons.solid.faEllipsisVertical}
                              />
                            </div>
                            <div>
                              <CircleTip
                                onClick={() => {
                                  showPopup(<UpsertPack pack={pack} />);
                                }}
                                icon={allIcons.solid.faChevronRight}
                              />
                            </div>
                          </>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
            {filteredPacks?.length === 0 && packs.get?.length > 0 && (
              <CreateFirstUI
                photo="https://cdn3d.iconscout.com/3d/premium/thumb/package-box-3d-icon-png-download-3286981.png"
                title="no packs found"
                description="try adjusting your search or filter to find what you're looking for."
              />
            )}
            {packs.get?.length === 0 && (
              <CreateFirstUI
                photo="https://cdn3d.iconscout.com/3d/premium/thumb/package-box-3d-icon-png-download-3286981.png"
                title="no packs yet"
                description="packs help bundle your products for easy management. Create your first pack to get started!"
              />
            )}
          </Scroll>
        )}
        {fetchingActionLoading && <LoadingData />}
      </div>
      <Line />
      {usedBy === "owned" || usedBy === "read/edit" ? (
        <motion.div
          className="p-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() => {
                showPopup(<UpsertPack />);
              }}
              className="rounded-full"
            >
              <Translate content="create pack" />
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </motion.div>
  );
};
