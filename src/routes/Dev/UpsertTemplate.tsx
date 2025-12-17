import { allIcons, getUserFunction } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardHeaderForPopup,
  CircleLoading,
  CircleTip,
  Field,
  ImageField,
  Line,
  Scroll,
  Translate,
  Icon,
  EmptyComponent,
  Input,
  Image,
  MarkDown,
  BooleanField,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  isLoading,
  setFieldValue,
  showToast,
  useAction,
  useAsyncMemo,
  useCopyState,
  useUser,
} from "@biqpod/app/ui/hooks";
import { setFocused, tw } from "@biqpod/app/ui/utils";
import { useEffect, useRef, useState, useMemo } from "react";
import { isAccountLinked, snapbuyApi } from "../../apis";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { isAndroidWeb } from "../../utils";
import { isIosWeb } from "@biqpod/app/ui/app";
const fuzzySearch = (
  query: string,
  target: string
): { matches: boolean; highlighted: (string | JSX.Element)[] } => {
  if (!query || !target) return { matches: false, highlighted: [target] };
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  // Find all positions where query characters match in order
  const matchPositions: number[] = [];
  let queryIdx = 0;
  for (let i = 0; i < target.length && queryIdx < query.length; i++) {
    if (targetLower[i] === queryLower[queryIdx]) {
      matchPositions.push(i);
      queryIdx++;
    }
  }
  if (matchPositions.length !== query.length) {
    // Fallback to substring search
    if (targetLower.includes(queryLower)) {
      const index = targetLower.indexOf(queryLower);
      return {
        matches: true,
        highlighted: [
          target.slice(0, index),
          <span
            key="highlight"
            className="bg-[--biqpod-primary] text-[--biqpod-primary-content]"
          >
            {target.slice(index, index + query.length)}
          </span>,
          target.slice(index + query.length),
        ],
      };
    }
    return { matches: false, highlighted: [target] };
  }
  // Group consecutive matches
  const highlighted: (string | JSX.Element)[] = [];
  let lastPos = -1;
  for (let i = 0; i < matchPositions.length; i++) {
    const pos = matchPositions[i];
    // If this is not consecutive with the previous match, start a new group
    if (i === 0 || pos !== matchPositions[i - 1] + 1) {
      // Add any unmatched characters before this group
      if (pos > lastPos + 1) {
        highlighted.push(target.slice(lastPos + 1, pos));
      }
      // Find the end of this consecutive group
      let groupEnd = i;
      while (
        groupEnd + 1 < matchPositions.length &&
        matchPositions[groupEnd + 1] === matchPositions[groupEnd] + 1
      ) {
        groupEnd++;
      }
      // Add the highlighted group
      const groupStart = pos;
      const groupLength = groupEnd - i + 1;
      highlighted.push(
        <span key={`highlight-${groupStart}`} className="bg-[--biqpod-primary]">
          {target.slice(groupStart, groupStart + groupLength)}
        </span>
      );
      lastPos = groupStart + groupLength - 1;
      i = groupEnd; // Skip to the end of this group
    }
  }
  // Add any remaining characters
  if (lastPos < target.length - 1) {
    highlighted.push(target.slice(lastPos + 1));
  }
  return { matches: true, highlighted };
};
export interface UpsertTemplateProps {
  template?: Biqpod.Snapbuy.Template;
}
interface GithubRepo {
  name?: string;
}
interface NpmPackage {
  name: string;
}
interface GitlabRepo {
  name?: string;
}
interface SelectedItem {
  provider: string;
  name: string;
}
export const UpsertTemplate = ({ template }: UpsertTemplateProps) => {
  const photoState = useCopyState<string | Nothing>(null);
  const searchQuery = useCopyState("");
  const user = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [npmPackages, setNpmPackages] = useState<NpmPackage[]>([]);
  const [gitlabRepos, setGitlabRepos] = useState<GitlabRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selected, setSelected] = useState<{
    repo: GithubRepo | null;
    pkg: NpmPackage | null;
    gitlab: GitlabRepo | null;
    type: string | null;
    item: SelectedItem | null;
  }>({
    repo: null,
    pkg: null,
    gitlab: null,
    type: null,
    item: null,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const useReadmeDescription = useCopyState<boolean | null | undefined>(false);
  const isGithubLinked = useAsyncMemo(async () => {
    return await isAccountLinked("github");
  }, [user]);
  const isNpmLinked = useAsyncMemo(async () => {
    return await isAccountLinked("npm");
  }, [user]);
  const isGitlabLinked = useAsyncMemo(async () => {
    return await isAccountLinked("gitlab");
  }, [user]);
  // Provider images configuration
  const providerConfig: Record<string, { image: string; label: string }> = {
    github: {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Github-desktop-logo-symbol.svg/2048px-Github-desktop-logo-symbol.svg.png",
      label: "link github",
    },
    npm: {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Npm-logo.svg/1200px-Npm-logo.svg.png",
      label: "link npm",
    },
    gitlab: {
      image:
        "https://about.gitlab.com/images/press/logo/png/gitlab-logo-500.png",
      label: "link gitlab",
    },
  };
  // Render link button for a provider
  const renderLinkButton = (provider: "github" | "npm" | "gitlab") => {
    const isLinking = linkingProvider === provider;
    return (
      <div
        key={provider}
        className={tw(
          "flex justify-center items-center bg-[--biqpod-primary-background] hover:bg-[--biqpod-gray-opacity] p-1 border border-[--biqpod-borders] border-solid rounded-2xl w-[120px] h-[120px] overflow-hidden cursor-pointer relative",
          isLinking && "opacity-50 pointer-events-none"
        )}
        onClick={async () => {
          setLinkingProvider(provider);
          try {
            var fn = await getUserFunction<{ url: string }>("link-account");
            var props = await fn?.({
              name: provider,
            });
            props?.url && location.replace(props.url);
          } finally {
            setLinkingProvider(null);
          }
        }}
      >
        {isLinking ? (
          <CircleLoading />
        ) : (
          <img
            src={providerConfig[provider].image}
            alt={provider}
            className="w-full object-cover"
          />
        )}
      </div>
    );
  };
  // Handle item selection from dropdown
  const handleItemSelection = (
    provider: "github" | "npm" | "gitlab",
    item: any
  ) => {
    if (provider === "github") {
      setSelected({
        repo: item.repo,
        pkg: null,
        gitlab: null,
        type: "github",
        item: { provider: "github", name: item.name },
      });
    } else if (provider === "npm") {
      setSelected({
        repo: null,
        pkg: item.pkg,
        gitlab: null,
        type: "npm",
        item: { provider: "npm", name: item.name },
      });
    } else if (provider === "gitlab") {
      setSelected({
        repo: null,
        pkg: null,
        gitlab: item.repo,
        type: "gitlab",
        item: { provider: "gitlab", name: item.name },
      });
    }
    setShowDropdown(false);
    searchQuery.set("");
  };
  // Helper function to render provider sections
  const renderProviderSection = (
    provider: "github" | "npm" | "gitlab",
    items: any[],
    filteredItems: any[],
    startIndex: number,
    isLinked: boolean
  ) => {
    if (!isLinked || !items.length) return null;
    return (
      <div>
        <div className="top-0 sticky bg-[--biqpod-secondary-background] font-semibold text-sm capitalize">
          <div className="flex items-center gap-2 hover:bg-[--biqpod-gray-opacity] mx-2 my-1 px-4 py-1 rounded-xl w-fit cursor-pointer">
            <Image
              src={providerConfig[provider].image}
              className="w-[30px] h-[30px]"
            />
            <span>
              <Translate content={provider} />
            </span>
            <Icon icon={allIcons.solid.faChevronRight} />
          </div>
          <Line />
        </div>
        {filteredItems.map((item: any, index: number) => {
          const itemIndex = startIndex + index;
          const isSelected = selectedIndex === itemIndex;
          return (
            <div
              key={`${provider}-${index}`}
              ref={(el) => (itemRefs.current[itemIndex] = el)}
              className={tw(
                "flex items-center p-2 cursor-pointer",
                !isSelected && "hover:bg-[--biqpod-gray-opacity]",
                isSelected &&
                  "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
              )}
              onClick={() => handleItemSelection(provider, item)}
            >
              <Icon
                icon={
                  provider === "npm"
                    ? allIcons.solid.faBox
                    : allIcons.solid.faCodeBranch
                }
                className="mr-2"
              />
              <span>{item.highlighted}</span>
            </div>
          );
        })}
      </div>
    );
  };
  // Clear selection
  const clearSelection = () => {
    setSelected({
      repo: null,
      pkg: null,
      gitlab: null,
      type: null,
      item: null,
    });
    searchQuery.set("");
  };
  // Fetch items from provider
  const fetchItems = async (provider: "github" | "npm" | "gitlab") => {
    setLoadingRepos(true);
    try {
      if (provider === "github") {
        const repos = await snapbuyApi.templates.getGithubRepository();
        setGithubRepos(repos || []);
      } else if (provider === "npm") {
        const packages = await snapbuyApi.templates.getNpmPackage();
        setNpmPackages(packages || []);
      } else if (provider === "gitlab") {
        const repos = await snapbuyApi.templates.getGitlabRepository();
        setGitlabRepos(repos || []);
      }
    } catch (error) {
      console.error(`Failed to fetch ${provider} items:`, error);
      if (provider === "github") {
        setGithubRepos([]);
      } else if (provider === "npm") {
        setNpmPackages([]);
      } else if (provider === "gitlab") {
        setGitlabRepos([]);
      }
    } finally {
      setLoadingRepos(false);
    }
  };
  // Helper function to generate template URL
  const generateTemplateUrl = (): string => {
    if (selected.type === "github" && selected.repo) {
      const repoName = selected.repo.name || "";
      return `https://github.com/${repoName}`;
    } else if (selected.type === "npm" && selected.pkg) {
      return `https://www.npmjs.com/package/${selected.pkg.name}`;
    } else if (selected.type === "gitlab" && selected.gitlab) {
      const repoName = selected.gitlab.name || "";
      return `https://gitlab.com/${repoName}`;
    }
    return "";
  };
  // Get filtered items with highlighting
  const filteredItems = useMemo(() => {
    const query = searchQuery.get;
    const filteredRepos = githubRepos
      .map((repo) => {
        const name = repo.name || "";
        const searchResult = fuzzySearch(query, name);
        return {
          repo,
          name,
          matches: searchResult.matches,
          highlighted: searchResult.highlighted,
        };
      })
      .filter((item) => !query || item.matches);
    const filteredPackages = npmPackages
      .map((pkg) => {
        const searchResult = fuzzySearch(query, pkg.name);
        return {
          pkg,
          name: pkg.name,
          matches: searchResult.matches,
          highlighted: searchResult.highlighted,
        };
      })
      .filter((item) => !query || item.matches);
    const filteredGitlab = gitlabRepos
      .map((repo) => {
        const name = repo.name || "";
        const searchResult = fuzzySearch(query, name);
        return {
          repo,
          name,
          matches: searchResult.matches,
          highlighted: searchResult.highlighted,
        };
      })
      .filter((item) => !query || item.matches);
    return { filteredRepos, filteredPackages, filteredGitlab };
  }, [searchQuery.get, githubRepos, npmPackages, gitlabRepos]);
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown) return;
      const totalItems =
        filteredItems.filteredRepos.length +
        filteredItems.filteredPackages.length +
        filteredItems.filteredGitlab.length;
      if (totalItems === 0) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < totalItems) {
            if (selectedIndex < filteredItems.filteredRepos.length) {
              const item = filteredItems.filteredRepos[selectedIndex];
              if (item) {
                handleItemSelection("github", item);
              }
            } else if (
              selectedIndex <
              filteredItems.filteredRepos.length +
                filteredItems.filteredPackages.length
            ) {
              const item =
                filteredItems.filteredPackages[
                  selectedIndex - filteredItems.filteredRepos.length
                ];
              if (item) {
                handleItemSelection("npm", item);
              }
            } else {
              const item =
                filteredItems.filteredGitlab[
                  selectedIndex -
                    filteredItems.filteredRepos.length -
                    filteredItems.filteredPackages.length
                ];
              if (item) {
                handleItemSelection("gitlab", item);
              }
            }
            setSelectedIndex(-1);
          }
          break;
        case "Escape":
          setShowDropdown(false);
          setSelectedIndex(-1);
          break;
      }
    };
    if (showDropdown) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDropdown, selectedIndex, filteredItems]);
  // Reset selected index when dropdown opens or search changes
  useEffect(() => {
    if (showDropdown) {
      setSelectedIndex(-1);
      itemRefs.current = [];
    }
  }, [showDropdown, searchQuery.get]);
  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [selectedIndex]);
  useEffect(() => {
    if (template) {
      setFieldValue("template-name", template.name || "");
      setFieldValue("template-description", template.description || "");
      setFieldValue(
        "template-single-price",
        (template.singlePrice || 0).toString()
      );
      setFieldValue(
        "template-multi-price",
        (template.multiPrice || 0).toString()
      );
      // Try to detect the source type from existing URL
      photoState.set(template.photo || null);
    } else {
      setFieldValue("template-name", "");
      setFieldValue("template-description", "");
      setFieldValue("template-single-price", "0");
      setFieldValue("template-multi-price", "0");
      photoState.set(null);
      clearSelection();
    }
  }, [template]);
  const templateName = getFieldValue("template-name");
  const templateDescription = getFieldValue("template-description");
  const templateSinglePrice = getFieldValue("template-single-price");
  const templateMultiPrice = getFieldValue("template-multi-price");
  // Generate the template URL based on current selection
  const templateUrl = generateTemplateUrl();
  const saveAction = useAction(
    "save-template",
    async () => {
      const focusInput = (fieldId: string | null = null) => {
        if (!isAndroidWeb && !isIosWeb) {
          setFocused(fieldId);
        }
      };
      if (!templateName?.trim()) {
        showToast("Please enter a template name", "error");
        focusInput("template-name");
        return;
      }
      // Validate prices
      const singlePriceValue = parseFloat(templateSinglePrice || "0");
      const multiPriceValue = parseFloat(templateMultiPrice || "0");
      if (isNaN(singlePriceValue) || singlePriceValue < 0) {
        showToast(
          "Please enter a valid single use price (0 or greater)",
          "error"
        );
        focusInput("template-single-price");
        return;
      }
      if (isNaN(multiPriceValue) || multiPriceValue < 0) {
        showToast(
          "Please enter a valid multiple use price (0 or greater)",
          "error"
        );
        focusInput("template-multi-price");
        return;
      }
      // Validate based on source type
      if (selected.type === "github" && !selected.repo) {
        showToast("Please select a GitHub repository", "error");
        return;
      } else if (selected.type === "npm" && !selected.pkg) {
        showToast("Please select an NPM package", "error");
        return;
      } else if (selected.type === "gitlab" && !selected.gitlab) {
        showToast("Please select a GitLab repository", "error");
        return;
      }
      if (!selected.type) {
        showToast("Please select a repository or package", "error");
        return;
      }
      console.log(selected);
      const repoId = selected.item?.name;
      if (!repoId) {
        throw "REPO NOT SELECTED";
      }
      const templateData: Biqpod.Snapbuy.Template = {
        id: template?.id,
        name: templateName.trim(),
        description: templateDescription?.trim() || "",
        photo: photoState.get?.toString(),
        singlePrice: singlePriceValue,
        multiPrice: multiPriceValue,
        status: "accepted",
        provider: selected.type,
        repoId,
      };
      await snapbuyApi.templates.create(templateData);
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
      templateSinglePrice,
      templateMultiPrice,
      selected,
      photoState.get,
      template,
      templateUrl,
    ]
  );
  const loading = isLoading(saveAction);
  return (
    <Card className="relative max-md:rounded-none max-md:w-full md:w-2/3 min-w-[400px] max-md:h-full md:max-h-[80vh] overflow-hidden">
      <CardHeaderForPopup
        title={template ? "Edit Template" : "Create Template"}
      />
      <Line />
      <Scroll>
        <div className="flex flex-col gap-2 p-3">
          <label className="font-semibold capitalize">
            <Translate content="photo" />
          </label>
          <ImageField
            id="template-photo"
            state={photoState}
            config={{
              alt: "image",
              filter: ["image/jpeg", "image/png", "image/webp"],
            }}
          />
        </div>
        <Line />
        <div className="flex flex-col gap-2 p-3">
          <label className="font-semibold capitalize">
            <Translate content="name" />*
          </label>
          <Field
            inputName="template-name"
            placeholder="Enter template name"
            maxLength={100}
          />
        </div>
        <div className="flex flex-col gap-2 p-3">
          <label className="flex items-center gap-2">
            <BooleanField
              state={useReadmeDescription}
              config={{
                style: "switch",
              }}
            />
            <span className="font-semibold capitalize">
              <Translate content="use readme.md as description" />
            </span>
          </label>
          {!useReadmeDescription.get && (
            <div className="bg-blue-500/20 p-3 border border-[--biqpod-primary] border-solid rounded-2xl text-sm">
              README.md file will come from the selected repo
            </div>
          )}
        </div>
        {useReadmeDescription.get && (
          <div className="flex flex-col gap-2 p-3">
            <label className="font-semibold capitalize">
              <Translate content="description" />
            </label>
            {templateDescription && (
              <div className="bg-[--biqpod-primary-background] shadow-lg mb-2 p-2 border border-[--biqpod-borders] border-solid rounded-lg">
                <MarkDown value={templateDescription} />
              </div>
            )}
            <Field
              inputName="template-description"
              placeholder="Enter template description"
              multiLines
              rows={3}
              maxRows={5}
              maxLength={500}
            />
          </div>
        )}
        <div className="flex flex-col gap-2 p-3">
          <label className="font-semibold capitalize">
            <Translate content="single use price" /> ($)
          </label>
          <Field
            inputName="template-single-price"
            placeholder="0.00"
            maxLength={10}
          />
        </div>
        <div className="flex flex-col gap-2 p-3">
          <label className="font-semibold capitalize">
            <Translate content="multiple use price" /> ($)
          </label>
          <Field
            inputName="template-multi-price"
            placeholder="0.00"
            maxLength={10}
          />
        </div>
        <Line />
        <div className="flex flex-col gap-2 p-3">
          <label className="font-semibold capitalize">
            <Translate content="search repositories or packages" />*
          </label>
          {/* Show link buttons if neither is linked */}
          {!isGithubLinked && !isNpmLinked && !isGitlabLinked ? (
            <div className="flex flex-col gap-3">
              <div className="text-[--biqpod-gray-opacity-2] text-sm">
                <Translate content="please link at least one account to continue" />
              </div>
              <div className="flex justify-evenly gap-2">
                {renderLinkButton("github")}
                {renderLinkButton("npm")}
                {renderLinkButton("gitlab")}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Show link buttons for unlinked accounts */}
              <div className="flex justify-evenly gap-2 p-2">
                {isGithubLinked === false && renderLinkButton("github")}
                {isNpmLinked === false && renderLinkButton("npm")}
                {isGitlabLinked === false && renderLinkButton("gitlab")}
              </div>
            </div>
          )}
        </div>
        <Line />
        <div className="relative p-2 w-full">
          {selected.item ? (
            <div className="flex items-center gap-2 bg-[--biqpod-secondary-background] p-2 border border-[--biqpod-borders] rounded-2xl">
              <img
                src={providerConfig[selected.item.provider].image}
                className="w-8 h-8 object-contain"
                alt={selected.item.provider}
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{selected.item.name}</div>
                <div className="text-[--biqpod-gray-opacity-2] text-xs capitalize">
                  {selected.item.provider}
                </div>
              </div>
              <CircleTip
                icon={allIcons.solid.faXmark}
                onClick={clearSelection}
                className="text-[--biqpod-gray-opacity-2] hover:text-[--biqpod-danger]"
              />
            </div>
          ) : (
            <EmptyComponent>
              <Input
                ref={inputRef}
                type="text"
                value={searchQuery.get}
                onChange={(e) => searchQuery.set(e.target.value)}
                onFocus={() => {
                  if (isGithubLinked && !githubRepos.length) {
                    fetchItems("github");
                  }
                  if (isNpmLinked && !npmPackages.length) {
                    fetchItems("npm");
                  }
                  if (isGitlabLinked && !gitlabRepos.length) {
                    fetchItems("gitlab");
                  }
                  setShowDropdown(true);
                  setSelectedIndex(-1);
                }}
                onBlur={() =>
                  setTimeout(() => {
                    setShowDropdown(false);
                    setSelectedIndex(-1);
                  }, 200)
                }
                placeholder={"Search repositories or packages..."}
              />
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="right-0 bottom-full left-0 z-10 absolute flex flex-col bg-[--biqpod-primary-background] shadow-lg border border-[--biqpod-borders] border-solid rounded-lg max-h-60 overflow-y-auto"
                >
                  {loadingRepos ? (
                    <div className="p-2 text-center">
                      <Translate content="loading" />
                      ...
                    </div>
                  ) : (
                    <EmptyComponent>
                      {/* GitHub Repos Section */}
                      {renderProviderSection(
                        "github",
                        githubRepos,
                        filteredItems.filteredRepos,
                        0,
                        !!isGithubLinked
                      )}
                      {/* NPM Packages Section */}
                      {renderProviderSection(
                        "npm",
                        npmPackages,
                        filteredItems.filteredPackages,
                        filteredItems.filteredRepos.length,
                        !!isNpmLinked
                      )}
                      {/* GitLab Repos Section */}
                      {renderProviderSection(
                        "gitlab",
                        gitlabRepos,
                        filteredItems.filteredGitlab,
                        filteredItems.filteredRepos.length +
                          filteredItems.filteredPackages.length,
                        !!isGitlabLinked
                      )}
                      {/* No results message */}
                      {!filteredItems.filteredRepos.length &&
                        !filteredItems.filteredPackages.length &&
                        !filteredItems.filteredGitlab.length &&
                        (isGithubLinked || isNpmLinked || isGitlabLinked) && (
                          <div className="text-[--biqpod-gray-opacity-2] p-2 text-center">
                            <Translate content="no results found" />
                          </div>
                        )}
                    </EmptyComponent>
                  )}
                </div>
              )}
            </EmptyComponent>
          )}
        </div>
      </Scroll>
      <Line />
      <div className="flex justify-end gap-2 p-4">
        {template?.id && (
          <Button
            icon={template ? allIcons.solid.faPen : allIcons.solid.faPlus}
            className={tw(
              "rounded-full bg-[--biqpod-error] text-[--biqpod-error-content]",
              loading && "pointer-events-none opacity-50"
            )}
            onClick={() => {
              execAction("delete-template", template.id);
            }}
          >
            <Translate content={"delete"} />
          </Button>
        )}
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
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
