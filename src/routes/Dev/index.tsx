import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardWait,
  CircleTip,
  Icon,
  Image,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  confirm,
  execAction,
  isLoading,
  showPopup,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { delay, tw } from "@biqpod/app/ui/utils";
import { snapbuyApi } from "../../apis";
import { UpsertTemplate } from "./UpsertTemplate";
import { useEffect } from "react";
export const DeveloperRoute = () => {
  const deleteAction = useAction(
    "delete-template",
    async (templateId: string) => {
      await snapbuyApi.deleteTemplate(templateId);
      showToast("Template deleted successfully", "success");
      execAction("refresh-templates");
    },
    []
  );
  const templates = useCopyState<SnapBuy.Template[]>([]);
  const refreshAction = useAction(
    "refresh-templates",
    async () => {
      await delay(100); // Small delay to allow for state updates
      const result = await snapbuyApi.getMyTemplates();
      templates.set(result);
    },
    []
  );
  useEffect(() => {
    execAction("refresh-templates");
  }, []);
  const loading = isLoading(deleteAction) || isLoading(refreshAction);
  return (
    <Scroll>
      <div className="flex flex-col gap-2 p-2">
        <Card className="overflow-hidden">
          <div className="flex justify-between items-center p-4">
            <div>
              <h1 className="font-bold text-2xl capitalize">
                <Translate content="developer templates" />
              </h1>
              <p className="text-[--biqpod-gray-opacity-2]">
                <Translate content="manage your custom templates" />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <CircleTip
                  icon={allIcons.solid.faRefresh}
                  onClick={() => {
                    execAction("refresh-templates");
                  }}
                  className={tw(loading && "animate-spin")}
                />
              </div>
              <Button
                icon={allIcons.solid.faPlus}
                onClick={() => {
                  showPopup(<UpsertTemplate />);
                }}
                className="rounded-full"
              >
                <Translate content="create template" />
              </Button>
            </div>
          </div>
        </Card>
        {loading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <CardWait key={index} className="rounded-xl w-full h-[120px]" />
            ))}
          </div>
        )}
        {!loading && templates && templates.get.length === 0 && (
          <Card className="flex flex-col justify-center items-center gap-4 p-8">
            <Icon
              icon={allIcons.solid.faCode}
              iconClassName="text-5xl text-[--biqpod-gray-opacity-2]"
            />
            <div className="text-center">
              <h2 className="text-[--biqpod-gray-opacity-2] font-bold text-xl">
                <Translate content="no templates found" />
              </h2>
              <p className="text-[--biqpod-gray-opacity-2]">
                <Translate content="create your first template to get started" />
              </p>
            </div>
            <Button
              icon={allIcons.solid.faPlus}
              onClick={() => {
                showPopup(<UpsertTemplate />);
              }}
              className="rounded-full"
            >
              <Translate content="create template" />
            </Button>
          </Card>
        )}
        {!loading && templates && templates.get.length > 0 && (
          <div className="flex flex-col gap-2">
            {templates.get.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <div className="flex justify-between items-start p-4">
                  {template.photo && (
                    <div className="flex-shrink-0 mr-4">
                      <Image
                        src={template.photo}
                        alt={template.name || "Template"}
                        className="rounded-lg w-[120px] h-[80px] object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg capitalize">
                        {template.name || "Untitled Template"}
                      </h3>
                      {template.status === "accepted" && (
                        <Icon
                          icon={allIcons.solid.faCheckCircle}
                          iconClassName="text-[--biqpod-success] text-sm"
                        />
                      )}
                      {!template.status && (
                        <Icon
                          icon={allIcons.solid.faClock}
                          iconClassName="text-[--biqpod-warning] text-sm"
                        />
                      )}
                    </div>
                    <p className="text-[--biqpod-gray-opacity-2] mb-2">
                      {template.description || "No description provided"}
                    </p>
                    {template.url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Icon icon={allIcons.solid.faLink} />
                        <a
                          href={template.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[--biqpod-primary] hover:underline truncate"
                        >
                          {template.url}
                        </a>
                      </div>
                    )}
                    {template.createdAt && (
                      <p className="text-[--biqpod-gray-opacity-2] mt-2 text-xs">
                        <Translate content="created" />:{" "}
                        {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Line />
                <div className="flex justify-evenly items-center gap-2 p-2">
                  <Button
                    icon={allIcons.solid.faPen}
                    onClick={() => {
                      showPopup(<UpsertTemplate template={template} />);
                    }}
                    className="bg-[--biqpod-primary] px-3 py-2 rounded-full w-fit text-white"
                  >
                    <Translate content="edit" />
                  </Button>
                  <Button
                    icon={allIcons.solid.faTrash}
                    onClick={async () => {
                      const response = await confirm({
                        title: "Delete Template",
                        message: `Are you sure you want to delete "${
                          template.name || "this template"
                        }"?`,
                      });
                      if (response) {
                        execAction("delete-template", template.id!);
                      }
                    }}
                    className="bg-[--biqpod-danger] px-3 py-2 rounded-full w-fit text-white"
                  >
                    <Translate content="delete" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Scroll>
  );
};
