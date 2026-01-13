import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardHeaderForPopup,
  CircleTip,
  EmptyComponent,
  Icon,
  Input,
  Line,
  Scroll,
  Tip,
  TitleView,
  Translate,
} from "@biqpod/app/ui/components";
import {
  openMenu,
  showPopup,
  showToast,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { useFormFiles } from "../../../apis/getFns";
import { useEffect, useState, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  compressImage,
  cleanupMediaFile,
  SnapbuyBasicFile,
} from "../../../utils/utilities";
import { snapbuyApi } from "../../../apis/index";
import { fuzzySearch, mapAsync, tw } from "@biqpod/app/ui/utils";
import { useStoreId } from "../../../utils";
import { MediaPreview } from "./MediaPreview";
import { MediaShowContentPreview } from "./MediaShowContentPreview";
import JSZip from "jszip";
const unsecuredFilesTypes = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-msinstaller",
  "application/x-executable",
  "application/x-sh",
  "application/x-csh",
  "application/x-bat",
  "application/x-dosexec",
  "application/x-mach-binary",
  "application/x-elf",
  "application/x-object",
  "application/x-dosexec",
  "application/x-java-archive",
  "application/java-archive",
  "application/x-msdownload",
  "application/x-shockwave-flash",
];
async function zipFiles(texture: File[], obj: File) {
  const zip = new JSZip();
  zip.file("model", obj);
  // folder for textures
  const texturesFolder = zip.folder("textures");
  if (texturesFolder) {
    for (const tex of texture) {
      texturesFolder.file(tex.name, tex);
    }
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return blob;
}
interface Popup3dModelProps {
  addMediaFile: (type: string, file: File) => Promise<void>;
}
export const Popup3dModel = ({ addMediaFile }: Popup3dModelProps) => {
  const textureUrl = useCopyState<File[] | null>(null);
  const objUrl = useCopyState<File | null>(null);
  return (
    <Card className="min-w-[400px] overflow-hidden">
      <CardHeaderForPopup title="load object" popupId="set-3d-object-popup" />
      <Line />
      {[
        {
          name: "Texture (.jpg, .png)",
          accept: ".jpg, .jpeg, .png",
          icon: allIcons.solid.faImage,
          onFile: textureUrl.set,
          iconColor: "text-yellow-500",
          file: textureUrl.get,
          multiple: true,
        },
        {
          name: "OBJ (.obj)",
          accept: ".obj",
          icon: allIcons.solid.faCube,
          onFile: (files: File[]) => objUrl.set(files.at(0) || null),
          iconColor: "text-blue-500",
          file: objUrl.get,
        },
      ].map((props) => {
        return (
          <div
            className="flex justify-between items-center gap-3 hover:bg-[--biqpod-gray-opacity] active:bg-[--biqpod-gray-opacity-2] p-3 text-xl capitalize cursor-pointer"
            onClick={async () => {
              await openFiles(props.accept, props.multiple).then((files) => {
                props.onFile(files);
              });
            }}
          >
            <div className="flex items-center">
              <Icon icon={props.icon} className={props.iconColor} />
              <span>{props.name}</span>
            </div>
            {props.file && (
              <Icon
                icon={allIcons.solid.faCheckCircle}
                className="text-green-600"
              />
            )}
          </div>
        );
      })}
      {textureUrl.get && objUrl.get && (
        <EmptyComponent>
          <Line />
          <div className="p-2">
            <Button
              onClick={async () => {
                showToast("Starting to load 3D model...", "info");
                const zip = await zipFiles(textureUrl.get!, objUrl.get!);
                showToast("3D model loaded successfully!", "success");
                await addMediaFile(
                  "model",
                  new File([zip], "3dmodel.zip", { type: "application/zip" })
                );
              }}
            >
              <Translate content="load 3d model" />
            </Button>
          </div>
        </EmptyComponent>
      )}
    </Card>
  );
};
const openFiles = (accept: string, multiple = true) => {
  return new Promise<File[]>((resolve) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = multiple; // Allow multiple file selection
    fileInput.style.display = "none";
    fileInput.accept = accept;
    // Handle file selection
    fileInput.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files) {
        resolve(Array.from(files));
      }
      // Clean up the input element
      document.body.removeChild(fileInput);
    };
    // Add to DOM and trigger click
    document.body.appendChild(fileInput);
    fileInput.click();
  });
};
export const ProductFiles = () => {
  const files = useFormFiles();
  const url = useCopyState("");
  const mediaFiles = useMemo<SnapbuyBasicFile[]>(() => {
    return files.get || [];
  }, [files.get]);
  const storeId = useStoreId();
  const [selectedMedia, setSelectedMedia] = useState<SnapbuyBasicFile | null>(
    null
  );
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [modalScale, setModalScale] = useState<number>(1);
  const [driveFiles, setDriveFiles] = useState<All[]>([]);
  const [productFiles, setProductFiles] = useState<All[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      mediaFiles.forEach(cleanupMediaFile);
    };
  }, []);
  // Keep modalIndex in sync with selectedMedia
  useEffect(() => {
    if (!selectedMedia) {
      setModalIndex(null);
      setModalScale(1);
      return;
    }
    const idx = mediaFiles.findIndex((f) => f.url === selectedMedia.url);
    setModalIndex(idx >= 0 ? idx : null);
    setModalScale(1);
  }, [selectedMedia, mediaFiles]);
  // Modal keyboard navigation and shortcuts
  useEffect(() => {
    if (modalIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedMedia(null);
        setModalIndex(null);
        setModalScale(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const next = (modalIndex - 1 + mediaFiles.length) % mediaFiles.length;
        setModalIndex(next);
        setSelectedMedia(mediaFiles[next]);
        setModalScale(1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = (modalIndex + 1) % mediaFiles.length;
        setModalIndex(next);
        setSelectedMedia(mediaFiles[next]);
        setModalScale(1);
      }
      if (e.key === "+" || e.key === "=") {
        setModalScale((s) => Math.min(3, +(s + 0.25).toFixed(2)));
      }
      if (e.key === "-" || e.key === "_") {
        setModalScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)));
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalIndex, mediaFiles]);
  // Sync mediaFiles with files state for backward compatibility
  const addMediaFile = async (type: string, file: File) => {
    const unsecured = unsecuredFilesTypes.includes(file.type);
    if (unsecured) {
      showToast(
        `The file "${file.name}" was not added due to security reasons.`,
        "error",
        {
          id: `unsecured-file-warning-${file.name}`,
        }
      );
      return;
    }
    // For files, compress and create object URL
    const objectURL = URL.createObjectURL(file);
    files.set((prev) => {
      var full = [
        ...(prev || []),
        {
          url: objectURL,
          type: type,
          size: file.size,
        },
      ];
      if (full.length > 5) {
        showToast("You can only add up to 5 files.", "error", {
          id: "max-files-error",
        });
        full = full.slice(0, 5);
      }
      return full;
    });
  };
  const addUrlMedia = async (urlString: string) => {
    var mainUrl: string;
    try {
      // For URLs, we still use the original approach
      const compressedSrc = await compressImage(urlString, 0.3);
      mainUrl = compressedSrc;
    } catch (error) {
      console.error("Failed to add URL media:", error);
      // Fallback to original URL
      mainUrl = url.get;
    }
    files.set([...(files.get || []), { url: mainUrl, type: "image" }]);
  };
  const removeMediaFile = (indexToRemove: number) => {
    const fileToRemove = mediaFiles[indexToRemove];
    cleanupMediaFile(fileToRemove);
    files.set(files.get?.filter((_, idx) => idx !== indexToRemove) || []);
  };
  const fetchdriveFiles = async () => {
    setLoadingFiles(true);
    try {
      const photos = await snapbuyApi.getDriveFiles();
      setDriveFiles(photos || []);
    } catch (error) {
      console.error("Failed to fetch drive photos:", error);
      setDriveFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };
  const fetchProductsPhotos = async () => {
    setLoadingFiles(true);
    try {
      if (storeId) {
        const products = await snapbuyApi.product.getProductsOf(storeId);
        const allProductFiles = products
          ?.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
          .map((product) => {
            return (product.files || []).map((file) => ({
              name: product.name || "unknown",
              file,
            }));
          })
          .flat();
        setProductFiles(allProductFiles || []);
      }
    } catch (error) {
      console.error("Failed to fetch products photos:", error);
      setProductFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const file = item.getAsFile();
        if (file) {
          await addMediaFile("extra", file);
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);
  // Get filtered photos for keyboard navigation
  const getFilteredPhotos = () => {
    const filteredProducts = productFiles.filter(({ name }) => {
      if (!url.get) return true;
      return fuzzySearch(name, url.get);
    });
    const filteredDrive = driveFiles.filter(({ name }) => {
      if (!url.get) return true;
      return fuzzySearch(name, url.get);
    });
    return { filteredProducts, filteredDrive };
  };
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown) return;
      const { filteredProducts, filteredDrive } = getFilteredPhotos();
      const totalItems = filteredProducts.length + filteredDrive.length;
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
            let photo: All;
            if (selectedIndex < filteredProducts.length) {
              photo = filteredProducts[selectedIndex];
            } else {
              photo = filteredDrive[selectedIndex - filteredProducts.length];
            }
            if (
              photo.file.url &&
              !mediaFiles.some((file) => file.url === photo.file.url)
            ) {
              addUrlMedia(photo.file.url);
            }
            setShowDropdown(false);
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
  }, [
    showDropdown,
    selectedIndex,
    productFiles,
    driveFiles,
    url.get,
    mediaFiles,
  ]);
  // Reset selected index when dropdown opens or search changes
  useEffect(() => {
    if (showDropdown) {
      setSelectedIndex(-1);
      itemRefs.current = [];
    }
  }, [showDropdown, url.get]);
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
  // Update itemRefs array size when filtered photos change
  useEffect(() => {
    const { filteredProducts, filteredDrive } = getFilteredPhotos();
    const totalItems = filteredProducts.length + filteredDrive.length;
    itemRefs.current = itemRefs.current.slice(0, totalItems);
  }, [productFiles, driveFiles, url.get]);
  return (
    <div className="flex flex-col h-full">
      <AnimatePresence>
        {url.get.match(/^https?:\/\//) && (
          <EmptyComponent>
            <div className="p-2">
              <motion.div
                initial={{ opacity: 0, width: 0, height: 0 }}
                animate={{ opacity: 1, width: 150, height: 150 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl overflow-hidden"
              >
                <img src={url.get} className="w-full h-full object-cover" />
              </motion.div>
            </div>
            <Line />
          </EmptyComponent>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-1 p-1">
        <div className="relative w-full">
          <Input
            ref={inputRef}
            value={url.get}
            onChange={(e) => url.set(e.target.value)}
            onFocus={() => {
              if (!driveFiles.length) {
                fetchdriveFiles();
              }
              if (!productFiles.length) {
                fetchProductsPhotos();
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
            placeholder="Search Drive-Products / Enter image url"
            className="flex-1 rounded-2xl scale-0"
          />
          <Tip
            className="top-1/2 right-2 absolute -translate-y-1/2"
            icon={allIcons.regular.faPaste}
            onClick={async () => {
              const uri = await navigator.clipboard.readText();
              url.set(uri);
            }}
          />
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="top-full right-0 left-0 z-10 absolute bg-[--biqpod-primary-background] shadow-lg border border-[--biqpod-borders] border-solid rounded-lg max-h-60 overflow-y-auto"
            >
              {loadingFiles ? (
                <div className="p-2 text-center">
                  <Translate content="loading" />
                  ...
                </div>
              ) : (
                <EmptyComponent>
                  {/* My Products Section */}
                  {productFiles.length > 0 && (
                    <div>
                      <div className="top-0 sticky bg-[--biqpod-secondary-background] font-semibold text-sm capitalize">
                        <div className="hover:bg-[--biqpod-gray-opacity] mx-2 my-1 px-4 py-2 rounded-2xl w-fit cursor-pointer">
                          <Translate content="my products" />{" "}
                          <Icon icon={allIcons.solid.faChevronRight} />
                        </div>
                        <Line />
                      </div>
                      {productFiles
                        .filter(({ name }) => {
                          if (!url.get) return true;
                          return fuzzySearch(name, url.get);
                        })
                        .map((productFile, index) => {
                          const isSelected = selectedIndex === index;
                          return (
                            <div
                              key={`product-${index}`}
                              ref={(el) => (itemRefs.current[index] = el)}
                              className={`flex items-center p-2 cursor-pointer ${
                                isSelected
                                  ? "bg-[--biqpod-accent] text-white"
                                  : "hover:bg-[--biqpod-secondary-background]"
                              }`}
                              onClick={async () => {
                                setShowDropdown(false);
                                if (
                                  !mediaFiles.some(
                                    (file) => file.url === productFile.file.url
                                  )
                                ) {
                                  await addUrlMedia(productFile.file.url || "");
                                }
                              }}
                            >
                              <img
                                src={productFile.file.url}
                                alt={productFile.name}
                                className="mr-2 rounded w-10 h-10 object-cover"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {productFile.name}
                                </span>
                                <span
                                  className={`text-xs ${
                                    isSelected
                                      ? "text-white opacity-80"
                                      : "text-[--biqpod-gray-opacity-2]"
                                  }`}
                                >
                                  {productFile.name}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  {/* Drive Section */}
                  {driveFiles.length > 0 && (
                    <div>
                      <div className="top-0 sticky bg-[--biqpod-secondary-background] px-3 py-2 font-semibold text-sm">
                        <Translate content="drive" /> &gt;
                      </div>
                      {driveFiles
                        .filter(({ name }) => {
                          if (!url.get) return true;
                          return fuzzySearch(name, url.get);
                        })
                        .map((photo, index) => {
                          const filteredProducts = productFiles.filter(
                            ({ name }) => {
                              if (!url.get) return true;
                              return fuzzySearch(url.get, name);
                            }
                          );
                          const itemIndex = filteredProducts.length + index;
                          const isSelected = selectedIndex === itemIndex;
                          return (
                            <div
                              key={`drive-${index}`}
                              ref={(el) => (itemRefs.current[itemIndex] = el)}
                              className={tw(
                                `flex items-center p-2 cursor-pointer`,
                                isSelected &&
                                  "bg-[--biqpod-primary] text-[--biqpod-primary-content]"
                              )}
                              onClick={async () => {
                                setShowDropdown(false);
                                if (
                                  photo.file.url &&
                                  !mediaFiles.some(
                                    (file) => file.url === photo.file.url
                                  )
                                ) {
                                  await addUrlMedia(photo.file.url);
                                }
                              }}
                            >
                              <img
                                src={photo.file.url}
                                alt={photo.name}
                                className="mr-2 rounded w-10 h-10 object-cover"
                              />
                              <span className="text-sm">{photo.name}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  {/* No results message */}
                  {driveFiles.length === 0 && productFiles.length === 0 && (
                    <div className="text-[--biqpod-gray-opacity-2] p-2 text-center">
                      <Translate content="no photos found" />
                    </div>
                  )}
                </EmptyComponent>
              )}
            </div>
          )}
        </div>
        <Button
          className="px-4 py-1 rounded-full w-fit"
          onClick={async () => {
            if (url.get && !mediaFiles.some((file) => file.url === url.get)) {
              await addUrlMedia(url.get);
            }
            url.set("");
          }}
        >
          <Translate content="add" />
        </Button>
      </div>
      <Line />
      <Scroll
        className={tw(
          `p-1`,
          isDragOver &&
            "bg-[--biqpod-gray-opacity] bg-opacity-20 border-2 border-dashed border-[--biqpod-accent]"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragOver(false);
          const files = Array.from(e.dataTransfer.files);
          for (const file of files) {
            await addMediaFile("extra", file);
          }
        }}
      >
        <div className="flex flex-wrap gap-2">
          {mediaFiles.length <= 5 && (
            <CircleTip
              className="flex justify-center items-center p-2 rounded-3xl w-[100px] h-[100px]"
              onClick={({ clientX, clientY }) => {
                openMenu({
                  x: clientX,
                  y: clientY,
                  menu: [
                    {
                      label: "Image",
                      defaultIcon: allIcons.solid.faImage,
                      async click() {
                        const files = await openFiles("image/*");
                        await mapAsync(files, (file) =>
                          addMediaFile("image", file)
                        );
                      },
                    },
                    {
                      label: "Video",
                      defaultIcon: allIcons.solid.faVideo,
                      async click() {
                        const files = await openFiles("video/*");
                        await mapAsync(files, (file) =>
                          addMediaFile("video", file)
                        );
                      },
                    },
                    {
                      label: "Audio",
                      defaultIcon: allIcons.solid.faMusic,
                      async click() {
                        const files = await openFiles("audio/*");
                        await mapAsync(files, (file) =>
                          addMediaFile("audio", file)
                        );
                      },
                    },
                    {
                      type: "separator",
                    },
                    {
                      label: "Extra",
                      defaultIcon: allIcons.solid.faFile,
                      async click() {
                        const files = await openFiles("*/*");
                        await mapAsync(
                          files,
                          async (file) => await addMediaFile("extra", file)
                        );
                      },
                    },
                  ],
                });
              }}
              icon={allIcons.solid.faAdd}
            />
          )}
          {mediaFiles.map((mediaFile, index) => {
            return (
              <div
                key={index}
                className={`relative border border-solid border-[--biqpod-borders] rounded-3xl w-[100px] h-[100px] overflow-hidden cursor-pointer`}
                onClick={() => {
                  setSelectedMedia(mediaFile);
                  setModalIndex(index);
                }}
              >
                <MediaPreview mediaFile={mediaFile} />
                <div className="bottom-1 absolute inset-x-1 flex justify-end items-center gap-[1pxx] pointer-events-none">
                  <TitleView title="info" className="pointer-events-auto">
                    <Tip
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the image click
                        const preview = new URL(
                          "/preview",
                          window.location.origin
                        );
                        preview.searchParams.set("url", mediaFile.url || "");
                        preview.searchParams.set("type", mediaFile.type || "");
                        showPopup(
                          <Card className="w-2/3">
                            <CardHeaderForPopup
                              popupId="file-information-popup"
                              title="File Information"
                            />
                            <Line />
                            <div className="flex flex-col gap-2max-w-sm">
                              <div className="flex justify-between items-center p-4 border-[--biqpod-borders] border-b border-solid">
                                <span className="inline-block w-full font-semibold">
                                  URL:{" "}
                                </span>
                                <span className="inline-flex gap-2 w-full capitalize">
                                  <a
                                    className="text-[--biqpod-primary] hover:underline"
                                    href={preview.toString()}
                                    target="_blank"
                                  >
                                    <Translate content="view" />
                                  </a>
                                  -
                                  <a
                                    className="text-[--biqpod-primary] hover:underline"
                                    download
                                    href={mediaFile.url}
                                    target="_blank"
                                  >
                                    <Translate content="download" />
                                  </a>
                                </span>
                              </div>
                              <div className="flex justify-between items-center p-4 border-[--biqpod-borders] border-b border-solid">
                                <span className="inline-block w-full font-semibold">
                                  Type:{" "}
                                </span>
                                <span className="inline-block w-full">
                                  {mediaFile.type || "Unknown"}
                                </span>
                              </div>
                              {/* <div className="flex justify-between items-center p-4">
                                <span className="inline-block w-full font-semibold">
                                  Size:{" "}
                                </span>
                                <span className="inline-block w-full">
                                  {mediaFile.size
                                    ? `${(mediaFile.size / 1024).toFixed(2)} KB`
                                    : "Unknown"}
                                </span>
                              </div> */}
                            </div>
                          </Card>,
                          {
                            id: "file-information-popup",
                          }
                        );
                      }}
                      className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-secondary-background] rounded-full"
                      icon={allIcons.solid.faInfoCircle}
                    />
                  </TitleView>
                  <TitleView title="remove" className="pointer-events-auto">
                    <Tip
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the image click
                        removeMediaFile(index);
                      }}
                      className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-secondary-background] rounded-full"
                      icon={allIcons.regular.faXmarkCircle}
                    />
                  </TitleView>
                </div>
              </div>
            );
          })}
        </div>
      </Scroll>
      {/* Media Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-75"
            onClick={() => {
              setSelectedMedia(null);
              setModalIndex(null);
              setModalScale(1);
            }}
          >
            <Card
              className="w-2/3 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <div className="flex justify-between items-center p-2 w-full overflow-hidden">
                <div className="font-semibold text-3xl truncate">
                  {selectedMedia.type || "file"}
                </div>
                <CircleTip
                  icon={allIcons.solid.faXmark}
                  onClick={() => {
                    setSelectedMedia(null);
                    setModalIndex(null);
                    setModalScale(1);
                  }}
                />
              </div>
              <Line />
              {/* Left / Right Navigation */}
              {mediaFiles.length > 1 && (
                <EmptyComponent>
                  <div className="top-1/2 left-3 absolute p-2 rounded-full -translate-y-1/2">
                    <CircleTip
                      className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (modalIndex === null) return;
                        const next =
                          (modalIndex - 1 + mediaFiles.length) %
                          mediaFiles.length;
                        setModalIndex(next);
                        setSelectedMedia(mediaFiles[next]);
                        setModalScale(1);
                      }}
                      aria-label="Previous"
                      icon={allIcons.solid.faChevronLeft}
                    />
                  </div>
                  <div className="top-1/2 right-3 absolute p-2 rounded-full -translate-y-1/2">
                    <CircleTip
                      className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (modalIndex === null) return;
                        const next = (modalIndex + 1) % mediaFiles.length;
                        setModalIndex(next);
                        setSelectedMedia(mediaFiles[next]);
                        setModalScale(1);
                      }}
                      aria-label="Next"
                      icon={allIcons.solid.faChevronRight}
                    />
                  </div>
                </EmptyComponent>
              )}
              {/* Media Container with zoom support */}
              <div className="flex justify-center items-center max-w-full max-h-[75vh] overflow-hidden">
                <div
                  style={{
                    transform: `scale(${modalScale})`,
                    transition: "transform 0.2s ease",
                  }}
                  className="rounded-lg w-full max-h-full"
                >
                  <MediaShowContentPreview mediaFile={selectedMedia} />
                </div>
              </div>
              <Line />
              {/* Controls: filename, index, download, zoom */}
              <div className="flex justify-between items-center gap-2 bg-[--biqpod-secondary-background] p-2 rounded-md">
                <div className="text-[--biqpod-gray-opacity-2] text-xs">
                  {modalIndex !== null ? modalIndex + 1 : 1}/{mediaFiles.length}
                </div>
                <div className="flex items-center gap-2">
                  <Tip
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalScale((s) =>
                        Math.max(0.5, +(s - 0.25).toFixed(2))
                      );
                    }}
                    title="Zoom out"
                    icon={allIcons.solid.faMagnifyingGlassMinus}
                  />
                  <Tip
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalScale((s) => Math.min(3, +(s + 0.25).toFixed(2)));
                    }}
                    title="Zoom in"
                    icon={allIcons.solid.faMagnifyingGlassPlus}
                  />
                  <Tip
                    onClick={(e) => {
                      e.stopPropagation();
                      const a = document.createElement("a");
                      a.href = selectedMedia.url;
                      a.download = "";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    title="Download"
                  >
                    <Icon icon={allIcons.solid.faDownload} />
                  </Tip>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
