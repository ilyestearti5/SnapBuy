import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  CircleLoading,
  EmptyComponent,
  Image,
  Line,
  Scroll,
  Translate,
  Icon,
  Button,
  AsyncComponent,
  CardWait,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  isLoading,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { snapbuyApi } from "../../apis";
import { tw } from "@biqpod/app/ui/utils";
import { useEffect, useRef } from "react";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";

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

const cardVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 30,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  },
};

const headerVariants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

const currentTemplateVariants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
    },
  },
};

const noTemplateVariants = {
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
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

const templateItemVariants = {
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

const loadingVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
};

const emptyStateVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 30,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 150,
      damping: 20,
      delay: 0.3,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
    },
  },
  tap: {
    scale: 0.95,
  },
};

const overlayVariants = {
  hidden: {
    opacity: 0,
    backdropFilter: "blur(0px)",
  },
  visible: {
    opacity: 1,
    backdropFilter: "blur(4px)",
    transition: {
      duration: 0.3,
    },
  },
};

interface SetTemplateProps {
  store: Biqpod.Snapbuy.Store;
}
export const SetTemplate = ({ store }: SetTemplateProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const templates = useCopyState<Biqpod.Snapbuy.Template[]>([]);
  const currentPage = useCopyState<string | Nothing>(null);
  const hasMore = useCopyState(true);
  const isLoadingMore = useCopyState(false);
  // Action to load templates with pagination
  useAction(
    "load-templates",
    async (loadOptions?: { page?: string; reset?: boolean }) => {
      try {
        const page = loadOptions?.page;
        const reset = loadOptions?.reset ?? false;
        if (!page && !reset) {
          templates.set([]);
          currentPage.set(null);
          hasMore.set(true);
        }
        isLoadingMore.set(true);
        // Fetch templates with pagination (20 per page)
        const newTemplates = await snapbuyApi.templates.getAll(page, 20);
        if (reset || !page) {
          templates.set(newTemplates);
        } else {
          templates.set([...templates.get, ...newTemplates]);
        }
        // Check if there are more templates to load
        hasMore.set(newTemplates.length === 20);
        currentPage.set(page);
      } catch (error) {
        console.error("Error fetching templates:", error);
        showToast("Failed to load templates", "error");
        hasMore.set(false);
      } finally {
        isLoadingMore.set(false);
      }
    },
    []
  );
  // Load initial templates
  useEffect(() => {
    execAction("load-templates", { page: 0, reset: true });
  }, []);
  // Infinite scroll handler
  const handleScroll = () => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || isLoadingMore.get || !hasMore.get) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const threshold = 100; // Load more when 100px from bottom
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      const lastPage = templates.get.at(-1)?.createdAt;
      execAction("load-templates", { page: lastPage, reset: false });
    }
  };
  // Attach scroll listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, []);
  // Action to set template for store
  const setTemplateAction = useAction(
    "set-store-template",
    async (templateId: string | null) => {
      try {
        // Update store with new template
        await snapbuyApi.store.update(store.id, {
          template: templateId || null,
        });
        showToast(
          templateId
            ? "Template set successfully"
            : "Template removed successfully",
          "success"
        );
        closePopup();
        // Refresh stores list
        execAction("fetch-my-stores");
      } catch (error) {
        console.error("Error setting template:", error);
        showToast("Failed to set template", "error");
      }
    },
    [store]
  );
  const setTemplateActionLoading = isLoading(setTemplateAction);
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={cardVariants}>
        <Card className="max-md:rounded-none max-md:w-full md:w-2/3 lg:w-1/2 max-md:h-full overflow-hidden">
          <motion.div variants={headerVariants}>
            <CardHeaderForPopup title="Set Store Template" />
          </motion.div>
          <Line />
          <div className="relative h-full">
            <Scroll className="max-h-[60vh]" ref={scrollRef}>
              <div className="p-4">
                {/* Current template info */}
                {store.template && (
                  <motion.div
                    variants={currentTemplateVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <EmptyComponent>
                      <div className="bg-[--biqpod-gray-opacity] mb-4 p-3 rounded-lg">
                        <h3 className="mb-2 font-semibold">
                          <Translate content="current template" />
                        </h3>
                        <div className="flex items-center gap-2">
                          <Icon
                            icon={allIcons.solid.faCheck}
                            iconClassName="text-green-500"
                          />
                          <AsyncComponent
                            render={async () => {
                              const template = await snapbuyApi.templates.get(
                                store.template!
                              );
                              return <span>{template?.name}</span>;
                            }}
                            loading={
                              <CardWait className="rounded-full w-[320px] h-[40px]" />
                            }
                          />
                        </div>
                      </div>
                    </EmptyComponent>
                  </motion.div>
                )}
                {/* No template option */}
                <motion.div
                  variants={noTemplateVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className={tw(
                    "mb-4 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    !store.template
                      ? "border-[--biqpod-primary] bg-[--biqpod-primary]/10"
                      : "border-[--biqpod-borders] hover:border-[--biqpod-primary]/50"
                  )}
                  onClick={async () => {
                    if (!store.template) return;
                    const response = await confirm({
                      title: "Remove Template",
                      message:
                        "Are you sure you want to remove the current template?",
                      detail:
                        "This will reset the store to use the default theme.",
                    });
                    if (response) {
                      execAction("set-store-template", null);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex justify-center items-center bg-[--biqpod-gray-opacity] rounded-full w-12 h-12">
                      <Icon icon={allIcons.solid.faXmark} />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        <Translate content="no template" />
                      </h3>
                      <p className="text-[--biqpod-gray-opacity-2] text-sm">
                        <Translate content="use default store theme" />
                      </p>
                    </div>
                    {!store.template && (
                      <div className="ml-auto">
                        <Icon
                          icon={allIcons.solid.faCheck}
                          iconClassName="text-green-500"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
                {/* Templates list */}
                {isLoadingMore.get && templates.get.length === 0 && (
                  <motion.div
                    className="flex justify-center items-center py-8"
                    variants={loadingVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <CircleLoading />
                  </motion.div>
                )}
                {!isLoadingMore.get && templates.get.length === 0 && (
                  <motion.div
                    className="flex flex-col justify-center items-center py-8 text-center"
                    variants={emptyStateVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Icon
                      icon={allIcons.solid.faFileCode}
                      iconClassName="text-4xl text-[--biqpod-gray-opacity-2] mb-4"
                    />
                    <h3 className="mb-2 font-semibold text-lg">
                      <Translate content="no templates found" />
                    </h3>
                    <p className="text-[--biqpod-gray-opacity-2]">
                      <Translate content="create templates in the developer section" />
                    </p>
                  </motion.div>
                )}
                {templates.get.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">
                      <Translate content="available templates" />
                    </h3>
                    <AnimatePresence>
                      {templates.get.map(
                        (template: Biqpod.Snapbuy.Template, index) => (
                          <motion.div
                            key={template.id}
                            variants={templateItemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            whileHover="hover"
                            whileTap="tap"
                            custom={index}
                            className={tw(
                              "p-4 border rounded-lg cursor-pointer transition-colors",
                              store.template === template.id
                                ? "border-[--biqpod-primary] bg-[--biqpod-primary]/10"
                                : "border-[--biqpod-borders] hover:border-[--biqpod-primary]/50"
                            )}
                            onClick={async () => {
                              if (store.template === template.id) return;
                              const response = await confirm({
                                title: "Set Template",
                                message: `Are you sure you want to set "${template.name}" as the store template?`,
                                detail:
                                  "This will change how your store appears to customers.",
                              });
                              if (response) {
                                execAction("set-store-template", template.id);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {template.photo ? (
                                  <Image
                                    src={template.photo}
                                    className="rounded-lg w-16 h-16 object-cover"
                                    alt={
                                      <div className="flex justify-center items-center bg-[--biqpod-gray-opacity] rounded-lg w-16 h-16">
                                        <Icon
                                          icon={allIcons.solid.faFileCode}
                                        />
                                      </div>
                                    }
                                  />
                                ) : (
                                  <div className="flex justify-center items-center bg-[--biqpod-gray-opacity] rounded-lg w-16 h-16">
                                    <Icon icon={allIcons.solid.faFileCode} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">
                                  {template.name || "Untitled Template"}
                                </h4>
                                {template.description && (
                                  <p className="text-[--biqpod-gray-opacity-2] mt-1 text-sm line-clamp-2">
                                    {template.description}
                                  </p>
                                )}
                                {template.url && (
                                  <a
                                    href={template.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block mt-1 text-[--biqpod-primary] text-xs hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View Template →
                                  </a>
                                )}
                              </div>
                              {store.template === template.id && (
                                <div className="flex-shrink-0">
                                  <Icon
                                    icon={allIcons.solid.faCheck}
                                    iconClassName="text-green-500"
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>
                    {/* Loading more indicator */}
                    {isLoadingMore.get && (
                      <motion.div
                        className="flex justify-center items-center py-4"
                        variants={loadingVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <CircleLoading />
                      </motion.div>
                    )}
                    {/* End of results indicator */}
                    {!hasMore.get && templates.get.length > 0 && (
                      <div className="text-[--biqpod-gray-opacity-2] py-4 text-center">
                        <Translate content="no more templates" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Scroll>
            {/* Loading overlay */}
            <AnimatePresence>
              {setTemplateActionLoading && (
                <motion.div
                  className="z-10 absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity] backdrop-blur-sm pointer-events-auto"
                  variants={overlayVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <CircleLoading />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Line />
          <motion.div
            className="flex justify-end gap-2 p-4"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div whileHover="hover" whileTap="tap">
              <Button
                className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
                onClick={() => {
                  closePopup();
                }}
              >
                <Translate content="close" />
              </Button>
            </motion.div>
          </motion.div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
