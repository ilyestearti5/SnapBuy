import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardHeaderForPopup,
  CircleLoading,
  Field,
  ImageField,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  isLoading,
  setFieldValue,
  showToast,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { useEffect } from "react";
import { snapbuyApi } from "../../apis";
import { Nothing } from "@biqpod/app/ui/types";
export interface UpsertTemplateProps {
  template?: SnapBuy.Template;
}
export const UpsertTemplate = ({ template }: UpsertTemplateProps) => {
  const photoState = useCopyState<string | Nothing>(null);
  const sourceTypeState = useCopyState<string>("github");
  // Helper function to generate template URL
  const generateTemplateUrl = (
    sourceType: string,
    username?: string,
    repoName?: string,
    packageName?: string,
    customUrl?: string,
    version?: string
  ): string => {
    switch (sourceType) {
      case "github":
        if (username?.trim() && repoName?.trim()) {
          return `https://${username.trim()}.github.io/${repoName.trim()}/dist/index.js`;
        }
        return "";
      case "npm":
        if (packageName?.trim()) {
          const npmVersion = version?.trim() || "1.0.0";
          return `https://cdn.jsdelivr.net/npm/${packageName.trim()}@${npmVersion}/dist/index.js`;
        }
        return "";
      case "full-url":
        return customUrl?.trim() || "";
      default:
        return "";
    }
  };
  useEffect(() => {
    if (template) {
      setFieldValue("template-name", template.name || "");
      setFieldValue("template-description", template.description || "");
      // Try to detect the source type from existing URL
      const url = template.url || "";
      if (url.includes("github.com")) {
        sourceTypeState.set("github");
        const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (githubMatch) {
          setFieldValue("github-username", githubMatch[1]);
          setFieldValue("github-repo", githubMatch[2]);
        }
      } else if (url.includes("npmjs.com")) {
        sourceTypeState.set("npm");
        const npmMatch = url.match(/npmjs\.com\/package\/([^\/]+)/);
        if (npmMatch) {
          setFieldValue("npm-package", npmMatch[1]);
        }
        // Try to extract version from jsdelivr URL
        const versionMatch = url.match(/@([^\/]+)\/dist/);
        if (versionMatch) {
          setFieldValue("npm-version", versionMatch[1]);
        } else {
          setFieldValue("npm-version", "1.0.0");
        }
      } else {
        sourceTypeState.set("full-url");
        setFieldValue("custom-url", url);
      }
      photoState.set(template.photo || null);
    } else {
      setFieldValue("template-name", "");
      setFieldValue("template-description", "");
      setFieldValue("github-username", "");
      setFieldValue("github-repo", "");
      setFieldValue("npm-package", "");
      setFieldValue("npm-version", "1.0.0");
      setFieldValue("custom-url", "");
      photoState.set(null);
      sourceTypeState.set("github");
    }
  }, [template]);
  const templateName = getFieldValue("template-name");
  const templateDescription = getFieldValue("template-description");
  const githubUsername = getFieldValue("github-username");
  const githubRepo = getFieldValue("github-repo");
  const npmPackage = getFieldValue("npm-package");
  const npmVersion = getFieldValue("npm-version");
  const customUrl = getFieldValue("custom-url");
  // Generate the template URL based on current inputs
  const templateUrl = generateTemplateUrl(
    sourceTypeState.get,
    githubUsername,
    githubRepo,
    npmPackage,
    customUrl,
    npmVersion
  );
  const saveAction = useAction(
    "save-template",
    async () => {
      if (!templateName?.trim()) {
        showToast("Please enter a template name", "error");
        return;
      }
      // Validate based on source type
      if (sourceTypeState.get === "github") {
        if (!githubUsername?.trim() || !githubRepo?.trim()) {
          showToast(
            "Please enter both GitHub username and repository name",
            "error"
          );
          return;
        }
      } else if (sourceTypeState.get === "npm") {
        if (!npmPackage?.trim()) {
          showToast("Please enter NPM package name", "error");
          return;
        }
      } else if (sourceTypeState.get === "full-url") {
        if (!customUrl?.trim()) {
          showToast("Please enter template URL", "error");
          return;
        }
      }

      const templateData: SnapBuy.Template = {
        id: template?.id,
        name: templateName.trim(),
        description: templateDescription?.trim() || "",
        url: templateUrl,
        photo: photoState.get?.toString(),
      };
      await snapbuyApi.createTemplate(templateData);
      showToast(
        template
          ? "Template updated successfully"
          : "Template created successfully",
        "success"
      );
      closePopup();
      execAction("refresh-templates");
    },
    [
      templateName,
      templateDescription,
      githubUsername,
      githubRepo,
      npmPackage,
      npmVersion,
      customUrl,
      sourceTypeState.get,
      photoState.get,
      template,
      templateUrl,
    ]
  );
  const loading = isLoading(saveAction);
  if (loading) {
    return (
      <Card className="flex justify-center items-center min-w-[400px] min-h-[300px]">
        <CircleLoading className="flex justify-center items-center" />
      </Card>
    );
  }
  return (
    <Card className="max-md:rounded-none max-md:w-full min-w-[400px] max-md:h-full">
      <CardHeaderForPopup
        title={template ? "Edit Template" : "Create Template"}
      />
      <Line />
      <div className="flex flex-col gap-4 p-4 h-full">
        <div className="flex flex-col gap-2">
          <label className="font-semibold">
            <Translate content="template photo" />
          </label>
          <ImageField
            id="template-photo"
            state={photoState}
            config={{
              alt: "Template image",
              filter: ["image/jpeg", "image/png", "image/webp"],
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold">
            <Translate content="template name" />*
          </label>
          <Field
            inputName="template-name"
            placeholder="Enter template name"
            maxLength={100}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold">
            <Translate content="description" />
          </label>
          <Field
            inputName="template-description"
            placeholder="Enter template description"
            multiLines
            rows={3}
            maxRows={5}
            maxLength={500}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold">
            <Translate content="template source" />*
          </label>
          <div className="flex gap-2">
            {[
              {
                photo:
                  "https://cdn3d.iconscout.com/3d/free/thumb/free-github-2950150-2447911.png",
                label: "GitHub",
                value: "github",
              },
              {
                label: "NPM",
                value: "npm",
                photo:
                  "https://cdn3d.iconscout.com/3d/free/thumb/free-npm-3d-icon-download-in-png-blend-fbx-gltf-file-formats--node-package-manager-javascript-coding-lang-pack-logos-icons-7578025.png?f=webp",
              },
              {
                label: "Full URL",
                value: "full-url",
                photo:
                  "https://cdn3d.iconscout.com/3d/premium/thumb/website-6031843-4991252.png",
              },
            ].map(({ label, photo, value }, index) => {
              return (
                <button
                  key={index}
                  type="button"
                  className={tw(
                    "flex-1 flex-col p-2 rounded-lg border border-solid font-medium transition-colors flex items-center justify-center gap-2",
                    sourceTypeState.get === value
                      ? "border-[--biqpod-primary] bg-[--biqpod-primary] text-[--biqpod-primary-content]"
                      : "border-[--biqpod-gray-opacity] bg-transparent text-[--biqpod-text-color] hover:bg-[--biqpod-gray-opacity]"
                  )}
                  onClick={() => sourceTypeState.set(value)}
                >
                  <img src={photo} className="h-12 object-contain" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {sourceTypeState.get === "github" && (
          <div className="flex gap-2">
            <div className="flex flex-col flex-1 gap-2">
              <label className="font-semibold">
                <Translate content="github username" />*
              </label>
              <Field
                inputName="github-username"
                placeholder="e.g., facebook"
                maxLength={100}
              />
            </div>
            <div className="flex flex-col flex-1 gap-2">
              <label className="font-semibold">
                <Translate content="repository name" />*
              </label>
              <Field
                inputName="github-repo"
                placeholder="e.g., react"
                maxLength={100}
              />
            </div>
          </div>
        )}
        {sourceTypeState.get === "npm" && (
          <div className="flex gap-2">
            <div className="flex flex-col flex-1 gap-2">
              <label className="font-semibold">
                <Translate content="npm package name" />*
              </label>
              <Field
                inputName="npm-package"
                placeholder="e.g., react, @types/node"
                maxLength={200}
              />
            </div>
            <div className="flex flex-col flex-1 gap-2">
              <label className="font-semibold">
                <Translate content="version" />
              </label>
              <Field
                inputName="npm-version"
                placeholder="e.g., 1.0.0, latest"
                maxLength={50}
              />
            </div>
          </div>
        )}
        {sourceTypeState.get === "full-url" && (
          <div className="flex flex-col gap-2">
            <label className="font-semibold">
              <Translate content="template url" />*
            </label>
            <Field
              inputName="custom-url"
              placeholder="https://example.com/template"
              maxLength={500}
            />
          </div>
        )}
        {templateUrl && (
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[--biqpod-success]">
              <Translate content="generated url" />
            </label>
            <div className="bg-[--biqpod-gray-opacity-0.5] p-3 border border-[--biqpod-success] rounded-lg text-sm">
              <a
                href={templateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--biqpod-primary] hover:underline break-all"
              >
                {templateUrl}
              </a>
            </div>
          </div>
        )}
      </div>
      <Line />
      <div className="flex justify-end gap-2 p-4">
        <Button
          className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
          onClick={() => {
            closePopup();
          }}
        >
          <Translate content="cancel" />
        </Button>
        <Button
          icon={template ? allIcons.solid.faPen : allIcons.solid.faPlus}
          className={tw(
            "rounded-full",
            loading && "pointer-events-none opacity-50"
          )}
          onClick={() => {
            execAction("save-template");
          }}
        >
          <Translate content={template ? "update" : "create"} />
        </Button>
      </div>
    </Card>
  );
};
