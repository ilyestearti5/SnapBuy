import {
  Button,
  CircleTip,
  EmptyComponent,
  Field,
  Line,
  PositionView,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { useStoreId } from "../utils";
import { snapbuyApi } from "../apis";
import { useUsedBy } from "../routes/Stores/Stores";
import {
  confirm,
  getFieldValue,
  openMenu,
  showPopup,
  showToast,
  useAsyncMemo,
  useMemoDelay,
} from "@biqpod/app/ui/hooks";
import { UpsertCollection } from "./UpsertCollection";
import { allIcons } from "@biqpod/app/ui/apis";
import { motion, AnimatePresence } from "framer-motion";
import { filterFuzzySearch } from "@biqpod/app/ui/utils";

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
export const Collections = () => {
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const collections = useAsyncMemo(async () => {
    if (!storeId) return null;
    return snapbuyApi.getCollections(storeId);
  }, [storeId]);

  // Search functionality with fuzzy search
  const search = getFieldValue("collection-search");
  const [_, filteredCollections] = useMemoDelay(
    () => {
      if (!search) return collections;
      return filterFuzzySearch(collections || [], search, "name");
    },
    [search, collections],
    300
  );

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <PositionView positionId="collection-searching">
        <div className="flex justify-between items-center gap-2 p-2">
          <div className="relative flex justify-center w-full">
            <Field
              inputName="collection-search"
              placeholder="Search collections by name"
              className="rounded-xl"
            />
            <span className="top-1/2 right-2 absolute font-bold text-[--biqpod-primary] -translate-y-1/2">
              / {filteredCollections?.length || 0}
            </span>
          </div>
        </div>
        <Line />
      </PositionView>
      <Scroll>
        {filteredCollections && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyComponent>
              <AnimatePresence>
                {filteredCollections.map((collection, index) => {
                  return (
                    <motion.div
                      key={collection.id}
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
                      className="flex justify-between items-center gap-2 hover:bg-[--biqpod-primary-background] p-2 rounded-lg cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <img
                            src={collection.photo}
                            className="border border-[--biqpod-borders] border-solid rounded-xl w-16 h-16 object-cover"
                          />
                          <span className="inline-flex top-0 right-0 z-[1000] absolute justify-center items-center bg-red-500 rounded-full w-[18px] h-[18px] font-bold text-white text-xs -translate-y-1/2 translate-x-1/2 pointer-events-none transform">
                            {collection.products?.length}
                          </span>
                        </div>
                        <span>
                          {highlightMatch(collection.name || "", search)}
                        </span>
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
                                          const collectionUrl = `${baseUrl}/collection/${collection.id}`;
                                          await navigator.clipboard.writeText(
                                            collectionUrl
                                          );
                                          showToast(
                                            "Collection URL copied to clipboard!"
                                          );
                                        },
                                      },
                                      {
                                        label: "Preview",
                                        defaultIcon: allIcons.solid.faEye,
                                        click: () => {
                                          const baseUrl =
                                            window.location.origin;
                                          const collectionUrl = `${baseUrl}/collection/${collection.id}`;
                                          const a = document.createElement("a");
                                          a.href = collectionUrl;
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
                                          const response = await confirm({
                                            title: "Delete Collection",
                                            message: `Are you sure you want to delete the collection "${collection.name}"? This action cannot be undone.`,
                                          });
                                          if (!response) return;
                                          await snapbuyApi.deleteCollection(
                                            collection.id
                                          );
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
                                  showPopup(
                                    <UpsertCollection
                                      back
                                      collection={collection}
                                    />
                                  );
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
              {filteredCollections &&
                filteredCollections.length === 0 &&
                collections &&
                collections.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center items-center h-full"
                  >
                    <div className="flex flex-col items-center gap-4 p-8">
                      <motion.img
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 0.5 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        draggable={false}
                        src="https://cdn3d.iconscout.com/3d/premium/thumb/search-not-found-3d-icon-download-in-png-blend-fbx-gltf-formats--no-results-empty-state-pack-miscellaneous-icons-5980397.png"
                        className="w-32 h-32"
                      />
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-center"
                      >
                        <h3 className="font-semibold text-[--biqpod-text] text-lg">
                          <Translate content="no collections found" />
                        </h3>
                        <p className="text-[--biqpod-text-secondary] text-sm">
                          <Translate content="try adjusting your search terms" />
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
            </EmptyComponent>
          </motion.div>
        )}
      </Scroll>
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
                showPopup(<UpsertCollection back />);
              }}
              className="rounded-full"
            >
              <Translate content="create" />
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </motion.div>
  );
};
