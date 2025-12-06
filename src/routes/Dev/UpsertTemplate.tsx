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
import { tw } from "@biqpod/app/ui/utils";
import { useEffect, useRef, useState } from "react";
import { isAccountLinked, snapbuyApi } from "../../apis";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
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
          <span key="highlight" className="bg-[--biqpod-primary]">
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
interface SelectedItem {
  provider: "github" | "npm";
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
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<NpmPackage | null>(
    null
  );
  const [selectedType, setSelectedType] = useState<"github" | "npm" | null>(
    null
  );
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [linkingProvider, setLinkingProvider] = useState<
    "github" | "npm" | null
  >(null);

  const isGithubLinked = useAsyncMemo(async () => {
    return await isAccountLinked("github");
  }, [user]);

  const isNpmLinked = useAsyncMemo(async () => {
    return await isAccountLinked("npm");
  }, [user]);

  // Provider images configuration
  const providerConfig = {
    github: {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Github-desktop-logo-symbol.svg/2048px-Github-desktop-logo-symbol.svg.png",
      label: "link github",
      placeholder: "Search GitHub repositories...",
    },
    npm: {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Npm-logo.svg/1200px-Npm-logo.svg.png",
      label: "link npm",
      placeholder: "Search NPM packages...",
    },
  };

  // Render link button for a provider
  const renderLinkButton = (provider: "github" | "npm") => {
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

  // Get dynamic placeholder text
  const getPlaceholder = () => {
    if (isGithubLinked && isNpmLinked) {
      return "Search GitHub repositories or NPM packages...";
    }
    return isGithubLinked
      ? providerConfig.github.placeholder
      : providerConfig.npm.placeholder;
  };

  // Handle item selection
  const handleItemSelection = (
    provider: "github" | "npm",
    item: { repo: GithubRepo; name: string } | { pkg: NpmPackage; name: string }
  ) => {
    if (provider === "github" && "repo" in item) {
      setSelectedRepo(item.repo);
      setSelectedPackage(null);
    } else if (provider === "npm" && "pkg" in item) {
      setSelectedPackage(item.pkg);
      setSelectedRepo(null);
    }
    setSelectedType(provider);
    searchQuery.set(item.name);
    setSelectedItem({ provider, name: item.name });
    setShowDropdown(false);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItem(null);
    setSelectedRepo(null);
    setSelectedPackage(null);
    setSelectedType(null);
    searchQuery.set("");
  };

  // Fetch GitHub repositories
  const fetchGithubRepos = async () => {
    setLoadingRepos(true);
    try {
      const repos = await snapbuyApi.templates.getGithubRepository();
      setGithubRepos(repos || []);
    } catch (error) {
      console.error("Failed to fetch GitHub repositories:", error);
      setGithubRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };
  // Fetch NPM packages
  const fetchNpmPackages = async () => {
    setLoadingRepos(true);
    try {
      const packages = await snapbuyApi.templates.getNpmPackage();
      setNpmPackages(packages || []);
    } catch (error) {
      console.error("Failed to fetch NPM packages:", error);
      setNpmPackages([]);
    } finally {
      setLoadingRepos(false);
    }
  };
  // Helper function to generate template URL
  const generateTemplateUrl = (): string => {
    if (selectedType === "github" && selectedRepo) {
      const repoName = selectedRepo.name || "";
      return `https://github.com/${repoName}`;
    } else if (selectedType === "npm" && selectedPackage) {
      return `https://www.npmjs.com/package/${selectedPackage.name}`;
    }
    return "";
  };
  // Get filtered items with highlighting
  const getFilteredItems = () => {
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
    return { filteredRepos, filteredPackages };
  };
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown) return;
      const { filteredRepos, filteredPackages } = getFilteredItems();
      const totalItems = filteredRepos.length + filteredPackages.length;
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
            if (selectedIndex < filteredRepos.length) {
              const item = filteredRepos[selectedIndex];
              if (item) {
                handleItemSelection("github", item);
              }
            } else {
              const item =
                filteredPackages[selectedIndex - filteredRepos.length];
              if (item) {
                handleItemSelection("npm", item);
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
  }, [showDropdown, selectedIndex, githubRepos, npmPackages, searchQuery.get]);
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
      const url = template.url || "";
      if (url.includes("github.com")) {
        setSelectedType("github");
        const repoName = url.split("/").pop() || "";
        searchQuery.set(repoName);
        setSelectedItem({ provider: "github", name: repoName });
      } else if (url.includes("npmjs.com")) {
        setSelectedType("npm");
        const npmMatch = url.match(/npmjs\.com\/package\/([^\/]+)/);
        if (npmMatch) {
          const pkgName = npmMatch[1];
          searchQuery.set(pkgName);
          setSelectedItem({ provider: "npm", name: pkgName });
        }
      }
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
      if (!templateName?.trim()) {
        showToast("Please enter a template name", "error");
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
        return;
      }
      if (isNaN(multiPriceValue) || multiPriceValue < 0) {
        showToast(
          "Please enter a valid multiple use price (0 or greater)",
          "error"
        );
        return;
      }
      // Validate based on source type
      if (selectedType === "github" && !selectedRepo) {
        showToast("Please select a GitHub repository", "error");
        return;
      } else if (selectedType === "npm" && !selectedPackage) {
        showToast("Please select an NPM package", "error");
        return;
      }
      if (!selectedType) {
        showToast("Please select a repository or package", "error");
        return;
      }
      const templateData: Biqpod.Snapbuy.Template = {
        id: template?.id,
        name: templateName.trim(),
        description: templateDescription?.trim() || "",
        url: templateUrl,
        photo: photoState.get?.toString(),
        singlePrice: singlePriceValue,
        multiPrice: multiPriceValue,
        status: "accepted",
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
      selectedType,
      selectedRepo,
      selectedPackage,
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
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 min-w-[400px] max-md:h-full md:max-h-[80vh]">
      <style>
        {`
          .dropdown-highlight {
            background-color: var(--biqpod-primary);
            color: var(--biqpod-primary-content);
            padding: 0 2px;
            border-radius: 2px;
          }
        `}
      </style>
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
          <label className="font-semibold capitalize">
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
          {!isGithubLinked && !isNpmLinked ? (
            <div className="flex flex-col gap-3">
              <div className="text-[--biqpod-gray-opacity-2] text-sm">
                <Translate content="please link at least one account to continue" />
              </div>
              <div className="flex justify-evenly gap-2">
                {renderLinkButton("github")}
                {renderLinkButton("npm")}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Show link buttons for unlinked accounts */}
              <div className="flex justify-evenly gap-2">
                {!isGithubLinked && renderLinkButton("github")}
                {!isNpmLinked && renderLinkButton("npm")}
              </div>
              {/* Show search field */}
              <div className="relative w-full">
                {selectedItem ? (
                  <div className="flex items-center gap-2 bg-[--biqpod-secondary-background] p-2 border border-[--biqpod-borders] rounded-2xl">
                    <img
                      src={
                        selectedItem.provider === "github"
                          ? "https://cdn3d.iconscout.com/3d/free/thumb/free-github-2950150-2447911.png"
                          : "https://cdn3d.iconscout.com/3d/free/thumb/free-npm-3d-icon-download-in-png-blend-fbx-gltf-file-formats--node-package-manager-javascript-coding-lang-pack-logos-icons-7578025.png?f=webp"
                      }
                      className="w-8 h-8 object-contain"
                      alt={selectedItem.provider}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {selectedItem.name}
                      </div>
                      <div className="text-[--biqpod-gray-opacity-2] text-xs capitalize">
                        {selectedItem.provider}
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
                          fetchGithubRepos();
                        }
                        if (isNpmLinked && !npmPackages.length) {
                          fetchNpmPackages();
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
                      placeholder={getPlaceholder()}
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
                            {/* GitHub Repos Section - Only show if GitHub is linked */}
                            {isGithubLinked && !!githubRepos.length && (
                              <div>
                                <div className="top-0 sticky bg-[--biqpod-secondary-background] font-semibold text-sm capitalize">
                                  <div className="hover:bg-[--biqpod-gray-opacity] mx-2 my-1 px-4 py-2 rounded-2xl w-fit cursor-pointer">
                                    <Translate content="github" />{" "}
                                    <Icon
                                      icon={allIcons.solid.faChevronRight}
                                    />
                                  </div>
                                  <Line />
                                </div>
                                {getFilteredItems().filteredRepos.map(
                                  (item, index) => {
                                    const isSelected = selectedIndex === index;
                                    return (
                                      <div
                                        key={`github-${index}`}
                                        ref={(el) =>
                                          (itemRefs.current[index] = el)
                                        }
                                        className={tw(
                                          "flex items-center p-2 cursor-pointer",
                                          isSelected &&
                                            "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
                                        )}
                                        onClick={() =>
                                          handleItemSelection("github", item)
                                        }
                                      >
                                        <Icon
                                          icon={allIcons.solid.faCodeBranch}
                                          className="mr-2"
                                        />
                                        <span>{item.highlighted}</span>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                            {/* NPM Packages Section - Only show if NPM is linked */}
                            {isNpmLinked && !!npmPackages.length && (
                              <div>
                                <div className="top-0 sticky bg-[--biqpod-secondary-background] font-semibold text-sm capitalize">
                                  <div className="hover:bg-[--biqpod-gray-opacity] mx-2 my-1 px-4 py-2 rounded-2xl w-fit cursor-pointer">
                                    <Translate content="npm" />{" "}
                                    <Icon
                                      icon={allIcons.solid.faChevronRight}
                                    />
                                  </div>
                                  <Line />
                                </div>
                                {getFilteredItems().filteredPackages.map(
                                  (item, index) => {
                                    const filteredRepos =
                                      getFilteredItems().filteredRepos;
                                    const itemIndex = isGithubLinked
                                      ? filteredRepos.length + index
                                      : index;
                                    const isSelected =
                                      selectedIndex === itemIndex;
                                    return (
                                      <div
                                        key={`npm-${index}`}
                                        ref={(el) =>
                                          (itemRefs.current[itemIndex] = el)
                                        }
                                        className={tw(
                                          "flex items-center p-2 cursor-pointer",
                                          isSelected &&
                                            "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
                                        )}
                                        onClick={() =>
                                          handleItemSelection("npm", item)
                                        }
                                      >
                                        <Icon
                                          icon={allIcons.solid.faBox}
                                          className="mr-2"
                                        />
                                        <span>{item.highlighted}</span>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                            {/* No results message */}
                            {((isGithubLinked && githubRepos.length === 0) ||
                              (isNpmLinked && npmPackages.length === 0)) &&
                              !(isGithubLinked && githubRepos.length > 0) &&
                              !(isNpmLinked && npmPackages.length > 0) && (
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
            </div>
          )}
        </div>
      </Scroll>
      <Line />
      <div className="flex justify-end gap-2 p-4">
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
