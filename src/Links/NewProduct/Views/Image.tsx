import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
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
import { useCopyState } from "@biqpod/app/ui/hooks";
import {
  getFormPhotos,
  useFormPhotos,
  useHiddenPhotos,
} from "../../../apis/getFns";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  compressImage,
  cleanupMediaFile,
  MediaFile,
  createMediaFileFromURL,
} from "../../../utils/utilities";
import { snapbuyApi } from "../../../apis/index";
import { fuzzySearch, tw } from "@biqpod/app/ui/utils";
import { useStoreId } from "../../../utils";
import { Biqpod } from "@biqpod/app/ui/types";
export const ProductImages = () => {
  const images = useFormPhotos();
  const url = useCopyState("");
  const photos = getFormPhotos();
  useEffect(() => {
    console.log(photos);
  }, [photos]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const storeId = useStoreId();
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const hiddenPhotos = useHiddenPhotos() || [];
  useEffect(() => {
    setMediaFiles(photos?.map((url) => createMediaFileFromURL(url)) || []);
  }, [photos]);
  const [drivePhotos, setDrivePhotos] = useState<
    { name: string; link: string }[]
  >([]);
  const [productPhotos, setProductPhotos] = useState<
    { name: string; link: string; productName: string }[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
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
  // Sync mediaFiles with images state for backward compatibility
  useEffect(() => {
    const urlList = mediaFiles.map((file) => file.url);
    images.set(urlList.length > 0 ? urlList : null);
  }, [mediaFiles]);
  const addMediaFile = async (file: File) => {
    try {
      let mediaFile: MediaFile;
      // For images, compress and create object URL
      const objectURL = URL.createObjectURL(file);
      const compressedDataURL = await compressImage(objectURL, 0.3);
      // Clean up the temporary object URL
      URL.revokeObjectURL(objectURL);
      // Create MediaFile with compressed data URL (for now, could be optimized further)
      mediaFile = {
        url: compressedDataURL,
        name: file.name,
        size: file.size,
      };
      setMediaFiles((prev) => [...prev, mediaFile]);
    } catch (error) {
      console.error("Failed to add media file:", error);
    }
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
    const mediaFile: MediaFile = {
      name: urlString.split("/").pop() || "unknown",
      size: 0,
      url: mainUrl,
    };
    setMediaFiles((prev) => [...prev, mediaFile]);
  };
  const removeMediaFile = (indexToRemove: number) => {
    setMediaFiles((prev) => {
      const fileToRemove = prev[indexToRemove];
      if (fileToRemove) {
        cleanupMediaFile(fileToRemove);
        // Remove from hidden photos if it was hidden
        hiddenPhotos.set((hidden) =>
          hidden?.filter((url) => url !== fileToRemove.url)
        );
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };
  const togglePhotoHidden = (mediaFileUrl: string) => {
    hiddenPhotos.set((prev) => {
      if (prev?.includes(mediaFileUrl)) {
        // Unhide the photo
        return prev.filter((url) => url !== mediaFileUrl);
      } else {
        // Hide the photo
        return [...(prev || []), mediaFileUrl];
      }
    });
    // Update stored hidden photos
    const newHidden = hiddenPhotos.get?.includes(mediaFileUrl)
      ? hiddenPhotos.get?.filter((url) => url !== mediaFileUrl)
      : [...(hiddenPhotos.get || []), mediaFileUrl];
    hiddenPhotos.set(newHidden);
  };
  const fetchDrivePhotos = async () => {
    setLoadingPhotos(true);
    try {
      const photos = await snapbuyApi.getDrivePhotos();
      setDrivePhotos(photos || []);
    } catch (error) {
      console.error("Failed to fetch drive photos:", error);
      setDrivePhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };
  const fetchProductsPhotos = async () => {
    setLoadingPhotos(true);
    try {
      if (storeId) {
        const products = await snapbuyApi.product.getProductsOf(storeId);
        const allProductPhotos: {
          name: string;
          link: string;
          productName: string;
        }[] = [];
        products
          ?.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
          .forEach((product: Biqpod.Snapbuy.Product) => {
            product.photos?.forEach((photoUrl: string, index: number) => {
              allProductPhotos.push({
                name: `${product.name} - Photo ${index + 1}`,
                link: photoUrl,
                productName: product.name || "Unknown Product",
              });
            });
          });
        setProductPhotos(allProductPhotos);
      }
    } catch (error) {
      console.error("Failed to fetch products photos:", error);
      setProductPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/") || item.type.includes("gltf")) {
          const file = item.getAsFile();
          if (file) {
            addMediaFile(file);
          }
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
    const filteredProducts = productPhotos.filter(
      ({ name, link, productName }) => {
        if (!url.get) return true;
        return (
          fuzzySearch(name, url.get) ||
          fuzzySearch(link, url.get) ||
          fuzzySearch(productName, url.get)
        );
      }
    );
    const filteredDrive = drivePhotos.filter(({ name, link }) => {
      if (!url.get) return true;
      return fuzzySearch(name, url.get) || fuzzySearch(link, url.get);
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
            let photo;
            if (selectedIndex < filteredProducts.length) {
              photo = filteredProducts[selectedIndex];
            } else {
              photo = filteredDrive[selectedIndex - filteredProducts.length];
            }
            if (photo && !mediaFiles.some((file) => file.url === photo.link)) {
              addUrlMedia(photo.link);
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
    productPhotos,
    drivePhotos,
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
  }, [productPhotos, drivePhotos, url.get]);
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
              if (!drivePhotos.length) {
                fetchDrivePhotos();
              }
              if (!productPhotos.length) {
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
              {loadingPhotos ? (
                <div className="p-2 text-center">
                  <Translate content="loading" />
                  ...
                </div>
              ) : (
                <EmptyComponent>
                  {/* My Products Section */}
                  {productPhotos.length > 0 && (
                    <div>
                      <div className="top-0 sticky bg-[--biqpod-secondary-background] font-semibold text-sm capitalize">
                        <div className="hover:bg-[--biqpod-gray-opacity] mx-2 my-1 px-4 py-2 rounded-2xl w-fit cursor-pointer">
                          <Translate content="my products" />{" "}
                          <Icon icon={allIcons.solid.faChevronRight} />
                        </div>
                        <Line />
                      </div>
                      {productPhotos
                        .filter(({ name, link, productName }) => {
                          if (!url.get) return true;
                          return (
                            fuzzySearch(name, url.get) ||
                            fuzzySearch(link, url.get) ||
                            fuzzySearch(productName, url.get)
                          );
                        })
                        .map((photo, index) => {
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
                                    (file) => file.url === photo.link
                                  )
                                ) {
                                  await addUrlMedia(photo.link);
                                }
                              }}
                            >
                              <img
                                src={photo.link}
                                alt={photo.name}
                                className="mr-2 rounded w-10 h-10 object-cover"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {photo.productName}
                                </span>
                                <span
                                  className={`text-xs ${
                                    isSelected
                                      ? "text-white opacity-80"
                                      : "text-[--biqpod-gray-opacity-2]"
                                  }`}
                                >
                                  {photo.name}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  {/* Drive Section */}
                  {drivePhotos.length > 0 && (
                    <div>
                      <div className="top-0 sticky bg-[--biqpod-secondary-background] px-3 py-2 font-semibold text-sm">
                        <Translate content="drive" /> &gt;
                      </div>
                      {drivePhotos
                        .filter(({ name, link }) => {
                          if (!url.get) return true;
                          return (
                            fuzzySearch(name, url.get) ||
                            fuzzySearch(link, url.get)
                          );
                        })
                        .map((photo, index) => {
                          const filteredProducts = productPhotos.filter(
                            ({ name, link, productName }) => {
                              if (!url.get) return true;
                              return (
                                fuzzySearch(url.get, name) ||
                                fuzzySearch(url.get, link) ||
                                fuzzySearch(url.get, productName)
                              );
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
                                  !mediaFiles.some(
                                    (file) => file.url === photo.link
                                  )
                                ) {
                                  await addUrlMedia(photo.link);
                                }
                              }}
                            >
                              <img
                                src={photo.link}
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
                  {drivePhotos.length === 0 && productPhotos.length === 0 && (
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
        className={`p-1 ${
          isDragOver
            ? "bg-[--biqpod-gray-opacity] bg-opacity-20 border-2 border-dashed border-[--biqpod-accent]"
            : ""
        }`}
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
            await addMediaFile(file);
          }
        }}
      >
        <div className="flex flex-wrap">
          {mediaFiles.length <= 5 && (
            <CircleTip
              className="flex justify-center items-center p-2 rounded-3xl w-[100px] h-[100px]"
              onClick={async () => {
                // Create a hidden file input element
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = "image/*,.gltf,.glb";
                fileInput.multiple = true; // Allow multiple file selection
                fileInput.style.display = "none";
                // Handle file selection
                fileInput.onchange = (event) => {
                  const files = (event.target as HTMLInputElement).files;
                  if (files) {
                    Array.from(files).forEach(async (file) => {
                      await addMediaFile(file);
                    });
                  }
                  // Clean up the input element
                  document.body.removeChild(fileInput);
                };
                // Add to DOM and trigger click
                document.body.appendChild(fileInput);
                fileInput.click();
              }}
              icon={allIcons.solid.faAdd}
            />
          )}
          {mediaFiles.map((mediaFile, index) => {
            const isHidden = hiddenPhotos.get?.includes(mediaFile.url);
            return (
              <div
                key={index}
                className={`relative border border-solid rounded-3xl w-[100px] h-[100px] overflow-hidden cursor-pointer ${
                  isHidden
                    ? "border-[--biqpod-gray-opacity] opacity-50"
                    : "border-[--biqpod-borders]"
                }`}
                onClick={() => setSelectedMedia(mediaFile)}
              >
                <img
                  className="w-full h-full object-cover"
                  src={mediaFile.url}
                />
                {isHidden && (
                  <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-30">
                    <Icon
                      icon={allIcons.solid.faEyeSlash}
                      className="text-white text-lg"
                    />
                  </div>
                )}
                <div className="right-1 bottom-1 absolute flex gap-1">
                  <TitleView title={isHidden ? "unhide" : "hide"} className="">
                    <Tip
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePhotoHidden(mediaFile.url);
                      }}
                      className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-secondary-background] rounded-full"
                      icon={
                        isHidden
                          ? allIcons.regular.faEyeSlash
                          : allIcons.regular.faEye
                      }
                    />
                  </TitleView>
                  <TitleView title="remove" className="">
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
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative flex flex-col gap-2 max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end w-full">
                <CircleTip
                  icon={allIcons.solid.faXmark}
                  onClick={() => setSelectedMedia(null)}
                />
              </div>
              <img
                src={selectedMedia.url}
                className="rounded-lg max-w-full max-h-full object-contain"
                alt="Product media"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
