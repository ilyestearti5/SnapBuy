import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CircleTip,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  showToast,
  useCopyState,
  useMemoDelay,
} from "@biqpod/app/ui/hooks";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { snapbuyApi } from "../../apis";
import { platformsInfo, getPlatformInfo } from "../../utils/platforms";
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
interface SetStorePlatformsProps {
  store: SnapBuy.Store;
}
export const SetStorePlatforms = ({ store }: SetStorePlatformsProps) => {
  const platforms = useCopyState<SnapBuy.Store["platforms"]>(
    store.platforms || {}
  );
  const isEditing = useCopyState<string | null>(null);
  const isLoading = useCopyState<boolean>(false);
  const justAdded = useCopyState<string | null>(null);
  // Search functionality
  const search = getFieldValue("platform-search");
  const activePlatforms = useMemo(() => {
    return Object.entries(platforms.get || {}).filter(([_, value]) => value);
  }, [platforms.get]);
  const availablePlatforms = useMemo(() => {
    return platformsInfo
      .filter((platform) => !platforms.get?.[platform.id])
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [platforms.get]);
  // Filter platforms based on search
  const [_, filteredActivePlatforms] = useMemoDelay(
    () => {
      if (!search) return activePlatforms;
      return activePlatforms.filter(([platformId]) => {
        const platformInfo = getPlatformInfo(platformId as any);
        if (!platformInfo) return false;
        return platformInfo.name.toLowerCase().includes(search.toLowerCase());
      });
    },
    [search, activePlatforms],
    300
  );
  const [__, filteredAvailablePlatforms] = useMemoDelay(
    () => {
      if (!search) return availablePlatforms;
      return availablePlatforms.filter((platform) =>
        platform.name.toLowerCase().includes(search.toLowerCase())
      );
    },
    [search, availablePlatforms],
    300
  );
  const handleSavePlatform = async (platformId: string, url: string) => {
    if (!url.trim()) {
      showToast("Platform URL is required", "error");
      return;
    }
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      showToast("Please enter a valid URL", "error");
      return;
    }
    isLoading.set(true);
    const updatedPlatforms = {
      ...platforms.get,
      [platformId]: url.trim(),
    };
    platforms.set(updatedPlatforms);
    isEditing.set(null);
    try {
      await snapbuyApi.updateStore(store.id, { platforms: updatedPlatforms });
      justAdded.set(platformId);
      setTimeout(() => justAdded.set(null), 1000); // Clear success state after 1 second
      showToast("Platform updated successfully", "success");
      execAction("print-stores");
    } catch (error) {
      showToast("Failed to update platform", "error");
      console.error(error);
    } finally {
      isLoading.set(false);
    }
  };
  const handleRemovePlatform = async (platformId: string) => {
    isLoading.set(true);
    const updatedPlatforms = { ...platforms.get };
    delete (updatedPlatforms as any)[platformId];
    platforms.set(updatedPlatforms);
    try {
      await snapbuyApi.updateStore(store.id, { platforms: updatedPlatforms });
      showToast("Platform removed successfully", "success");
      execAction("print-stores");
    } catch (error) {
      showToast("Failed to remove platform", "error");
      console.error(error);
    } finally {
      isLoading.set(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-[90vw] max-w-[600px] max-h-[80vh] overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex justify-between items-center p-3"
        >
          <h1 className="font-bold text-2xl capitalize">
            <Translate content="store platforms" />
          </h1>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <CircleTip
              icon={allIcons.solid.faXmark}
              onClick={() => closePopup()}
            />
          </motion.div>
        </motion.div>
        <Line />
        {/* Search Field */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-3 border-[--biqpod-borders] border-b"
        >
          <div className="relative">
            <Field
              inputName="platform-search"
              placeholder="Search platforms..."
              className="rounded-xl w-full"
            />
            <motion.div
              className="top-1/2 right-3 absolute -translate-y-1/2 transform"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Icon
                icon={allIcons.solid.faSearch}
                iconClassName="text-[--biqpod-text-secondary] text-sm"
              />
            </motion.div>
            {search && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="top-1/2 right-10 absolute font-bold text-[--biqpod-primary] text-xs -translate-y-1/2 transform"
              >
                {(filteredActivePlatforms?.length || 0) +
                  (filteredAvailablePlatforms?.length || 0)}{" "}
                results
              </motion.div>
            )}
          </div>
        </motion.div>
        <Line />
        <Scroll>
          <div className="p-3">
            {/* Active Platforms */}
            <AnimatePresence>
              {filteredActivePlatforms &&
                filteredActivePlatforms.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                  >
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className="mb-3 font-semibold text-lg"
                    >
                      <Translate content="active platforms" />
                      {search && (
                        <span className="ml-2 font-normal text-[--biqpod-text-secondary] text-sm">
                          ({filteredActivePlatforms.length})
                        </span>
                      )}
                    </motion.h3>
                    <div className="flex flex-col gap-2">
                      {filteredActivePlatforms.map(([platformId, url]) => {
                        const platformInfo = getPlatformInfo(platformId as any);
                        if (!platformInfo) return null;
                        const isCurrentlyEditing = isEditing.get === platformId;
                        return (
                          <motion.div
                            key={platformId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card className="p-3">
                              <div className="flex items-center gap-3">
                                <motion.img
                                  src={platformInfo.icon}
                                  alt={platformInfo.name}
                                  className="rounded w-8 h-8"
                                  whileHover={{ scale: 1.1 }}
                                  animate={
                                    justAdded.get === platformId
                                      ? {
                                          scale: [1, 1.3, 1],
                                          rotate: [0, 10, -10, 0],
                                        }
                                      : {}
                                  }
                                  transition={{ duration: 0.2 }}
                                />
                                <div className="flex-1 overflow-x-hidden">
                                  <div className="font-medium truncate">
                                    {highlightMatch(platformInfo.name, search)}
                                  </div>
                                  <AnimatePresence mode="wait">
                                    {isCurrentlyEditing ? (
                                      <motion.div
                                        key="editing"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col items-center gap-2 mt-2"
                                      >
                                        <Field
                                          defaultValue={url}
                                          placeholder={platformInfo.placeholder}
                                          inputName={`platform-${platformId}`}
                                        />
                                        <motion.div
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{
                                            delay: 0.1,
                                            duration: 0.2,
                                          }}
                                          className="flex gap-2 w-full"
                                        >
                                          <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <CircleTip
                                              onClick={() => {
                                                const input =
                                                  document.querySelector<HTMLInputElement>(
                                                    `#platform-${platformId}`
                                                  );
                                                handleSavePlatform(
                                                  platformId,
                                                  input?.value || ""
                                                );
                                              }}
                                              icon={
                                                isLoading.get
                                                  ? allIcons.solid.faSpinner
                                                  : allIcons.solid.faCheck
                                              }
                                              iconClassName={
                                                isLoading.get
                                                  ? "animate-spin"
                                                  : ""
                                              }
                                            />
                                          </motion.div>
                                          <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <CircleTip
                                              onClick={() =>
                                                isEditing.set(null)
                                              }
                                              icon={allIcons.solid.faXmark}
                                            />
                                          </motion.div>
                                        </motion.div>
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="display"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-1 text-sm truncate"
                                      >
                                        {url}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                                <AnimatePresence>
                                  {!isCurrentlyEditing && (
                                    <motion.div
                                      initial={{ opacity: 0, x: 10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: 10 }}
                                      transition={{ duration: 0.2 }}
                                      className="flex gap-1"
                                    >
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <CircleTip
                                          icon={allIcons.solid.faPen}
                                          onClick={() =>
                                            isEditing.set(platformId)
                                          }
                                        />
                                      </motion.div>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <CircleTip
                                          icon={allIcons.solid.faTrash}
                                          onClick={async () => {
                                            const isResponse = await confirm({
                                              title: "Delete Platform",
                                              message: `Are you sure you want to delete the platform \`${platformInfo.name}\`?`,
                                              detail:
                                                "This action cannot be undone.",
                                            });
                                            if (isResponse) {
                                              handleRemovePlatform(platformId);
                                            }
                                          }}
                                        />
                                      </motion.div>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                      >
                                        <CircleTip
                                          icon={allIcons.solid.faExternalLink}
                                          onClick={() =>
                                            window.open(url, "_blank")
                                          }
                                        />
                                      </motion.div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
            {/* Available Platforms */}
            <AnimatePresence>
              {filteredAvailablePlatforms &&
                filteredAvailablePlatforms.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <div className="gap-2 grid grid-cols-1 sm:grid-cols-2">
                      {filteredAvailablePlatforms.map((platformInfo, index) => {
                        const isCurrentlyEditing =
                          isEditing.get === platformInfo.id;
                        return (
                          <motion.div
                            key={platformInfo.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <Card className="hover:shadow-md p-3 transition-shadow duration-200">
                              <div className="flex items-center gap-3">
                                <motion.img
                                  src={platformInfo.icon}
                                  alt={platformInfo.name}
                                  className="rounded w-8 h-8"
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  transition={{ duration: 0.2 }}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {highlightMatch(platformInfo.name, search)}
                                  </div>
                                  <AnimatePresence>
                                    {isCurrentlyEditing && (
                                      <motion.div
                                        initial={{
                                          opacity: 0,
                                          height: 0,
                                          y: -10,
                                        }}
                                        animate={{
                                          opacity: 1,
                                          height: "auto",
                                          y: 0,
                                        }}
                                        exit={{ opacity: 0, height: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex flex-col items-center gap-2 mt-2"
                                      >
                                        <motion.div
                                          initial={{ scale: 0.95 }}
                                          animate={{ scale: 1 }}
                                          transition={{ duration: 0.2 }}
                                          className="flex-1"
                                        >
                                          <Field
                                            placeholder={
                                              platformInfo.placeholder
                                            }
                                            inputName={`new-platform-${platformInfo.id}`}
                                            className="flex-1"
                                          />
                                        </motion.div>
                                        <motion.div
                                          initial={{ opacity: 0, x: 10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay: 0.1,
                                            duration: 0.2,
                                          }}
                                          className="flex justify-evenly gap-1 w-full"
                                        >
                                          <motion.div
                                            whileHover={{
                                              scale: 1.05,
                                              opacity: 1,
                                            }}
                                            whileTap={{
                                              scale: 0.95,
                                              opacity: 0,
                                            }}
                                          >
                                            <CircleTip
                                              onClick={() => {
                                                const input =
                                                  document.querySelector<HTMLInputElement>(
                                                    `#new-platform-${platformInfo.id}`
                                                  );
                                                handleSavePlatform(
                                                  platformInfo.id,
                                                  input?.value || ""
                                                );
                                              }}
                                              icon={
                                                isLoading.get
                                                  ? allIcons.solid.faSpinner
                                                  : allIcons.solid.faCheck
                                              }
                                              iconClassName={
                                                isLoading.get
                                                  ? "animate-spin"
                                                  : ""
                                              }
                                            />
                                          </motion.div>
                                          <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <CircleTip
                                              onClick={() =>
                                                isEditing.set(null)
                                              }
                                              icon={allIcons.solid.faXmark}
                                            />
                                          </motion.div>
                                        </motion.div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                                <AnimatePresence>
                                  {!isCurrentlyEditing && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ duration: 0.2 }}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <CircleTip
                                        icon={allIcons.solid.faPlus}
                                        onClick={() =>
                                          isEditing.set(platformInfo.id)
                                        }
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
              {filteredActivePlatforms?.length === 0 &&
                filteredAvailablePlatforms?.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="py-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      <Icon
                        icon={
                          search
                            ? allIcons.solid.faSearch
                            : allIcons.solid.faGlobe
                        }
                        iconClassName="text-4xl mb-2"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      {search ? (
                        <div>
                          <div className="mb-1 font-semibold text-lg">
                            <Translate content="no platforms found" />
                          </div>
                          <div className="text-[--biqpod-text-secondary] text-sm">
                            Try searching with different keywords
                          </div>
                        </div>
                      ) : (
                        "All platforms configured"
                      )}
                    </motion.div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </Scroll>
      </Card>
    </motion.div>
  );
};
