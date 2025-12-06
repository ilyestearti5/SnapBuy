import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleLoading,
  Field,
  Icon,
  Image,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  confirm,
  execAction,
  getFieldValue,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { snapbuyApi } from "../../apis";
import { useStoreId } from "../../utils";
import { Biqpod } from "@biqpod/app/ui/types";
// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};
const templateCardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
  },
};
export const Templates = () => {
  const storeId = useStoreId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const templates = useCopyState<Biqpod.Snapbuy.Template[]>([]);
  const searchQuery = getFieldValue("template-search");
  const hasMore = useCopyState(true);
  const isLoadingMore = useCopyState(false);
  const paymentLoading = useCopyState<string | null>(null);
  const lastDocId = useCopyState<string | null>(null);
  const isInitialLoad = useCopyState(true);
  const paidTemplates = useCopyState<string[]>([]);
  // Action to load templates from API
  useAction(
    "load-templates",
    async (loadMore = false) => {
      try {
        isLoadingMore.set(true);
        const limit = 10; // Load 10 templates at a time
        const startAtDoc = loadMore ? lastDocId.get : null;
        // If it's a new search, reset everything
        if (!loadMore) {
          templates.set([]);
          lastDocId.set(null);
          hasMore.set(true);
          isInitialLoad.set(true);
        }
        // Get templates from API
        const newTemplates = await snapbuyApi.templates.getAll(
          startAtDoc,
          limit
        );
        if (newTemplates && newTemplates.length > 0) {
          // Filter for accepted templates
          const acceptedTemplates = newTemplates.filter(
            (template) => template.status === "accepted"
          );
          // Filter templates based on search query if there's one
          const query = searchQuery?.toLowerCase();
          const filteredTemplates = query
            ? acceptedTemplates.filter(
                (template) =>
                  template.name?.toLowerCase().includes(query) ||
                  template.description?.toLowerCase().includes(query)
              )
            : acceptedTemplates;
          if (loadMore) {
            // Append to existing templates
            templates.set([...templates.get, ...filteredTemplates]);
          } else {
            // Replace templates for new search/initial load
            templates.set(filteredTemplates);
          }
          // Update pagination state
          const lastTemplate =
            acceptedTemplates.length > 0
              ? acceptedTemplates[acceptedTemplates.length - 1]
              : newTemplates[newTemplates.length - 1];
          lastDocId.set(lastTemplate?.id || null);
          // Check if we have more templates to load
          hasMore.set(newTemplates.length === limit);
        } else {
          // No more templates available
          hasMore.set(false);
          if (!loadMore) {
            templates.set([]);
          }
        }
        isInitialLoad.set(false);
      } catch (error) {
        console.error("Error fetching templates:", error);
        showToast("Failed to load templates", "error");
        hasMore.set(false);
        isInitialLoad.set(false);
      } finally {
        isLoadingMore.set(false);
      }
    },
    [searchQuery, lastDocId.get, templates.get]
  );
  // Action to load paid templates
  useAction(
    "load-paid-templates",
    async () => {
      try {
        const paidTemplateIds = await snapbuyApi.templates.getPayed();
        paidTemplates.set(paidTemplateIds || []);
      } catch (error) {
        console.error("Error loading paid templates:", error);
        paidTemplates.set([]);
      }
    },
    []
  );
  // Load initial templates and paid templates
  useEffect(() => {
    execAction("load-templates", false);
    execAction("load-paid-templates");
  }, []);
  // Infinite scroll effect
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      // Load more when user scrolls to 80% of the content
      if (
        scrollPercentage > 0.8 &&
        hasMore.get &&
        !isLoadingMore.get &&
        !isInitialLoad.get
      ) {
        execAction("load-templates", true);
      }
    };
    scrollElement.addEventListener("scroll", handleScroll);
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, [hasMore.get, isLoadingMore.get, isInitialLoad.get]);
  // Action to purchase template
  useAction(
    "purchase-template",
    async (templateId: string) => {
      try {
        if (!storeId) {
          showToast("Store ID is required", "error");
          return;
        }
        paymentLoading.set(templateId);
        // Get template details for confirmation
        const template = await snapbuyApi.templates.get(templateId);
        if (!template) {
          showToast("Template not found", "error");
          return;
        }
        // Confirm purchase with user
        const price = template.multiPrice || template.singlePrice || 0;
        const priceText = price > 0 ? ` for $${price.toFixed(2)}` : "";
        const response = await confirm({
          title: "Purchase Template",
          message: `Do you want to purchase "${template.name}" template${priceText}?`,
          detail:
            "This will apply the template to your store and charge your account.",
          type: "question",
        });
        if (!response) return;
        await snapbuyApi.templates.pay(templateId);
        showToast("Template purchased and applied successfully!", "success");
        // Add the template to paid templates list
        paidTemplates.set([...paidTemplates.get, templateId]);
        // Refresh the store data
        execAction("fetch-my-stores");
      } catch (error) {
        console.error("Error purchasing template:", error);
        showToast("Failed to purchase template", "error");
      } finally {
        paymentLoading.set(null);
      }
    },
    [storeId]
  );
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <div className="h-full overflow-hidden">
        <Scroll className="h-full" ref={scrollRef}>
          <div className="p-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="mb-2 font-bold text-2xl">
                <Translate content="Store Templates" />
              </h1>
              <p className="text-[--biqpod-gray-opacity-2]">
                <Translate content="Choose from professionally designed templates to customize your store appearance" />
              </p>
            </div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="top-1/2 right-3 absolute -translate-y-1/2 pointer-events-none">
                  <Icon
                    icon={allIcons.solid.faSearch}
                    className="text-[--biqpod-gray-opacity-2]"
                  />
                </div>
                <Field
                  inputName="template-search"
                  placeholder="Search templates..."
                  className="pl-10 rounded-2xl"
                />
              </div>
            </div>
            {/* Results count */}
            {!isLoadingMore.get && templates.get.length > 0 && (
              <div className="text-[--biqpod-gray-opacity-2] mb-4 text-sm">
                {searchQuery ? (
                  <Translate
                    content={`Found ${templates.get.length} template${
                      templates.get.length === 1 ? "" : "s"
                    } matching "${searchQuery}"`}
                  />
                ) : (
                  <Translate
                    content={`Showing ${templates.get.length} template${
                      templates.get.length === 1 ? "" : "s"
                    }`}
                  />
                )}
              </div>
            )}
            {/* Loading state for initial load */}
            {isLoadingMore.get && templates.get.length === 0 && (
              <div className="flex justify-center items-center py-12">
                <CircleLoading />
              </div>
            )}
            {/* Empty state */}
            {!isLoadingMore.get && templates.get.length === 0 && (
              <div className="flex flex-col justify-center items-center py-12 text-center">
                <Icon
                  icon={allIcons.solid.faFileCode}
                  className="text-[--biqpod-gray-opacity-2] mb-4 text-6xl"
                />
                <h3 className="mb-2 font-semibold text-xl">
                  <Translate content="No templates available" />
                </h3>
                <p className="text-[--biqpod-gray-opacity-2] max-w-md">
                  <Translate content="There are currently no templates available. Check back later or contact support for custom template options." />
                </p>
              </div>
            )}
            {/* Templates grid */}
            {templates.get.length > 0 && (
              <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {templates.get.map((template, index) => (
                    <motion.div
                      key={template.id}
                      variants={templateCardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      whileHover="hover"
                      whileTap="tap"
                      custom={index}
                    >
                      <Card
                        className={`h-full overflow-hidden ${
                          paidTemplates.get.includes(template.id!)
                            ? "ring-2 ring-[--biqpod-success] ring-opacity-50 bg-gradient-to-br from-green-50 to-transparent"
                            : ""
                        }`}
                      >
                        {/* Template preview image */}
                        <div className="relative bg-[--biqpod-gray-opacity] h-48">
                          {template.photo ? (
                            <Image
                              src={template.photo}
                              className="rounded-none w-full h-full object-cover"
                              alt={
                                <div className="flex justify-center items-center w-full h-full">
                                  <Icon
                                    icon={allIcons.solid.faFileCode}
                                    className="text-[--biqpod-gray-opacity-2] text-4xl"
                                  />
                                </div>
                              }
                            />
                          ) : (
                            <div className="flex justify-center items-center w-full h-full">
                              <Icon
                                icon={allIcons.solid.faFileCode}
                                className="text-[--biqpod-gray-opacity-2] text-4xl"
                              />
                            </div>
                          )}
                          {/* Paid template indicator */}
                          {paidTemplates.get.includes(template.id!) && (
                            <motion.div
                              className="top-2 left-2 absolute flex items-center gap-1 bg-[--biqpod-success] shadow-lg px-2 py-1 rounded-full font-medium text-white text-xs"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2, duration: 0.3 }}
                            >
                              <Icon
                                icon={allIcons.solid.faCheck}
                                className="text-xs"
                              />
                              <Translate content="Purchased" />
                            </motion.div>
                          )}
                          {/* Preview button overlay */}
                          {template.url && (
                            <div className="top-2 right-2 absolute">
                              <a
                                href={template.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex justify-center items-center bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full w-8 h-8 text-white transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Icon
                                  icon={allIcons.solid.faExternalLinkAlt}
                                  className="text-sm"
                                />
                              </a>
                            </div>
                          )}
                        </div>
                        {/* Template info */}
                        <div className="flex flex-col gap-1 p-2">
                          <div className="flex justify-between items-start">
                            <h3 className="flex-1 font-semibold text-lg line-clamp-1">
                              {template.name || "Untitled Template"}
                            </h3>
                            <div className="ml-2 font-bold text-[--biqpod-primary] text-lg">
                              {(() => {
                                const price =
                                  template.multiPrice ||
                                  template.singlePrice ||
                                  0;
                                return price > 0
                                  ? price.toFixed(2).concat("$")
                                  : "Free";
                              })()}
                            </div>
                          </div>
                          {template.description && (
                            <p className="text-[--biqpod-gray-opacity-2] mb-2 text-sm line-clamp-2">
                              {template.description}
                            </p>
                          )}
                          {/* Usage type indicator */}
                          <div className="flex items-center gap-1">
                            <Icon
                              icon={
                                !!template.multiPrice
                                  ? allIcons.solid.faUsers
                                  : allIcons.solid.faUser
                              }
                              className="text-[--biqpod-gray-opacity-2] text-xs"
                            />
                            <span className="text-[--biqpod-gray-opacity-2] font-medium text-xs">
                              {!!template.multiPrice
                                ? "Multiple Use"
                                : "Single Use"}
                            </span>
                          </div>
                        </div>
                        <Line />
                        {/* Action buttons */}
                        <div className="flex gap-2 p-3">
                          {template.url && (
                            <Button
                              className="flex-1 bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(template.url!, "_blank");
                              }}
                              icon={allIcons.solid.faEye}
                            >
                              <Translate content="Preview" />
                            </Button>
                          )}
                          <Button
                            className={`flex-1 ${
                              paidTemplates.get.includes(template.id!)
                                ? "bg-[--biqpod-success] text-white"
                                : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                template.id &&
                                !paidTemplates.get.includes(template.id)
                              ) {
                                execAction("purchase-template", template.id);
                              }
                            }}
                            disabled={
                              paymentLoading.get === template.id ||
                              paidTemplates.get.includes(template.id!)
                            }
                            icon={
                              paidTemplates.get.includes(template.id!)
                                ? allIcons.solid.faCheck
                                : paymentLoading.get === template.id
                                ? allIcons.solid.faSpinner
                                : allIcons.solid.faShoppingCart
                            }
                            iconClassName={
                              paymentLoading.get === template.id
                                ? "animate-spin"
                                : ""
                            }
                          >
                            {paidTemplates.get.includes(template.id!) ? (
                              <Translate content="Purchased" />
                            ) : paymentLoading.get === template.id ? (
                              <Translate content="Processing..." />
                            ) : (
                              <span>
                                <Translate content="Purchase" />
                                <span>
                                  {" "}
                                  - $
                                  {(() => {
                                    const price =
                                      template.multiPrice ||
                                      template.singlePrice ||
                                      0;
                                    return price > 0
                                      ? price.toFixed(2)
                                      : "0.00";
                                  })()}
                                </span>
                              </span>
                            )}
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {/* Loading more indicator */}
            {isLoadingMore.get && templates.get.length > 0 && (
              <div className="flex justify-center items-center py-8">
                <CircleLoading />
                <span className="text-[--biqpod-gray-opacity-2] ml-2">
                  <Translate content="Loading more templates..." />
                </span>
              </div>
            )}
            {/* End of results indicator */}
            {!hasMore.get && templates.get.length > 0 && (
              <div className="text-[--biqpod-gray-opacity-2] py-8 text-center">
                <Translate content="No more templates available" />
              </div>
            )}
          </div>
        </Scroll>
        {/* Global payment loading overlay */}
        <AnimatePresence>
          {paymentLoading.get && (
            <motion.div
              className="z-50 fixed inset-0 flex flex-col justify-center items-center bg-black bg-opacity-50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CircleLoading />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mt-4 text-white text-center"
              >
                <div className="font-semibold text-lg">
                  <Translate content="Processing Payment" />
                </div>
                <div className="opacity-80 mt-1 text-sm">
                  <Translate content="Please wait while we process your template purchase..." />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
