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
import { snapbuyApi } from "../../apis";
import { tw } from "@biqpod/app/ui/utils";
import { useEffect, useRef } from "react";
import { Nothing } from "@biqpod/app/ui/types";
interface SetTemplateProps {
  store: SnapBuy.Store;
}
export const SetTemplate = ({ store }: SetTemplateProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const templates = useCopyState<SnapBuy.Template[]>([]);
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
        const newTemplates = await snapbuyApi.getAllTemplates(page, 20);
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
        await snapbuyApi.updateStore(store.id, {
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
        execAction("print-stores");
      } catch (error) {
        console.error("Error setting template:", error);
        showToast("Failed to set template", "error");
      }
    },
    [store]
  );
  const setTemplateActionLoading = isLoading(setTemplateAction);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 lg:w-1/2 max-md:h-full overflow-hidden">
      <CardHeaderForPopup title="Set Store Template" />
      <Line />
      <div className="relative h-full">
        <Scroll className="max-h-[60vh]" ref={scrollRef}>
          <div className="p-4">
            {/* Current template info */}
            {store.template && (
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
                        const template = await snapbuyApi.getTemplate(
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
            )}
            {/* No template option */}
            <div
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
                  detail: "This will reset the store to use the default theme.",
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
            </div>
            {/* Templates list */}
            {isLoadingMore.get && templates.get.length === 0 && (
              <div className="flex justify-center items-center py-8">
                <CircleLoading />
              </div>
            )}
            {!isLoadingMore.get && templates.get.length === 0 && (
              <div className="flex flex-col justify-center items-center py-8 text-center">
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
              </div>
            )}
            {templates.get.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">
                  <Translate content="available templates" />
                </h3>
                {templates.get.map((template: SnapBuy.Template) => (
                  <div
                    key={template.id}
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
                                <Icon icon={allIcons.solid.faFileCode} />
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
                  </div>
                ))}
                {/* Loading more indicator */}
                {isLoadingMore.get && (
                  <div className="flex justify-center items-center py-4">
                    <CircleLoading />
                  </div>
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
        <div
          className={tw(
            "z-10 absolute inset-0 flex pointer-events-none justify-center opacity-0 backdrop-blur-sm items-center bg-[--biqpod-gray-opacity]",
            setTemplateActionLoading && "opacity-100 pointer-events-auto"
          )}
        >
          <CircleLoading />
        </div>
      </div>
      <Line />
      <div className="flex justify-end gap-2 p-4">
        <Button
          className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
          onClick={() => {
            closePopup();
          }}
        >
          <Translate content="close" />
        </Button>
      </div>
    </Card>
  );
};
