import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  Translate,
  CircleTip,
  Line,
  Input,
  Tip,
  EmptyComponent,
  Icon,
  Button,
  Scroll,
  TitleView,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  useAction,
  showToast,
  closePopup,
  execAction,
  isLoading,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { fuzzySearch, tw } from "@biqpod/app/ui/utils";
import { useState, useRef, useEffect } from "react";
import { snapbuyApi } from "../apis";
import {
  useStoreId,
  MediaFile,
  cleanupMediaFile,
  compressImage,
} from "../utils";

export const MergePhotosPopup = ({
  selectedProducts,
  onSuccess,
}: {
  selectedProducts: string[];
  onSuccess: () => void;
}) => {
  const storeId = useStoreId();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const url = useCopyState("");
  const [drivePhotos, setDrivePhotos] = useState<
    { name: string; link: string }[]
  >([]);
  const [productPhotos, setProductPhotos] = useState<
    { name: string; link: string; productName: string }[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const action = useAction(
    "merge-photos",
    async () => {
      if (!storeId || mediaFiles.length === 0) return;
      // Collect all photo URLs to add
      const photoUrls = mediaFiles.map((file) => file.url);
      // Update each selected product by adding the photos
      const updatePromises = selectedProducts.map(async (productId) => {
        const product = await snapbuyApi.product.get(productId);
        if (product) {
          const existingPhotos = product.photos || [];
          const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
            id: productId,
            photos: [...existingPhotos, ...photoUrls],
          };
          await snapbuyApi.product.upsert(storeId, [updatedProduct]);
        }
      });
      await Promise.all(updatePromises);
      showToast(
        `Photos merged successfully to ${selectedProducts.length} product${
          selectedProducts.length > 1 ? "s" : ""
        }`,
        "success"
      );
      onSuccess();
      closePopup();
      execAction("fetch-products");
    },
    [selectedProducts, mediaFiles, storeId]
  );
  const loading = isLoading(action);
  useEffect(() => {
    return () => {
      mediaFiles.forEach(cleanupMediaFile);
    };
  }, [mediaFiles]);
  const addMediaFile = async (file: File) => {
    try {
      const objectURL = URL.createObjectURL(file);
      const compressedDataURL = await compressImage(objectURL, 0.3);
      URL.revokeObjectURL(objectURL);
      const mediaFile: MediaFile = {
        url: compressedDataURL,
        type: "image",
        name: file.name,
        size: file.size,
        isObjectURL: false,
      };
      setMediaFiles((prev) => [...prev, mediaFile]);
    } catch (error) {
      console.error("Failed to add media file:", error);
    }
  };
  const addUrlMedia = async (urlString: string) => {
    try {
      // For URLs, we still use the original approach
      const compressedSrc = await compressImage(urlString, 0.3);
      const mediaFile: MediaFile = {
        url: compressedSrc,
        type: "image",
        name: urlString.split("/").pop() || "unknown",
        size: 0,
        isObjectURL: false,
      };
      setMediaFiles((prev) => [...prev, mediaFile]);
    } catch (error) {
      console.error("Failed to add URL media:", error);
      // Fallback to original URL
      const mediaFile: MediaFile = {
        url: urlString,
        type: "image",
        name: urlString.split("/").pop() || "unknown",
        size: 0,
        isObjectURL: false,
      };
      setMediaFiles((prev) => [...prev, mediaFile]);
    }
  };
  const removeMediaFile = (indexToRemove: number) => {
    setMediaFiles((prev) => {
      const fileToRemove = prev[indexToRemove];
      if (fileToRemove) {
        cleanupMediaFile(fileToRemove);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
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
        if (item.type.startsWith("image/")) {
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
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="merge photos to products" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="flex flex-col gap-4 p-4 h-full overflow-hidden">
        <div className="flex flex-col gap-2">
          <label className="font-semibold">
            <Translate content="select photos to merge" />
          </label>
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
                className="flex-1 rounded-2xl"
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
                                    fuzzySearch(name, url.get) ||
                                    fuzzySearch(link, url.get) ||
                                    fuzzySearch(productName, url.get)
                                  );
                                }
                              );
                              const itemIndex = filteredProducts.length + index;
                              const isSelected = selectedIndex === itemIndex;
                              return (
                                <div
                                  key={`drive-${index}`}
                                  ref={(el) =>
                                    (itemRefs.current[itemIndex] = el)
                                  }
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
                      {drivePhotos.length === 0 &&
                        productPhotos.length === 0 && (
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
                if (
                  url.get &&
                  !mediaFiles.some((file) => file.url === url.get)
                ) {
                  await addUrlMedia(url.get);
                }
                url.set("");
              }}
            >
              <Translate content="add" />
            </Button>
          </div>
          <Scroll className="p-1">
            <div className="flex flex-wrap">
              {mediaFiles.length <= 5 && (
                <CircleTip
                  className="flex justify-center items-center p-2 rounded-3xl w-[100px] h-[100px]"
                  onClick={async () => {
                    // Create a hidden file input element
                    const fileInput = document.createElement("input");
                    fileInput.type = "file";
                    fileInput.accept = "image/*";
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
                return (
                  <div
                    key={index}
                    className="relative border border-[--biqpod-borders] border-solid rounded-3xl w-[100px] h-[100px] overflow-hidden cursor-pointer"
                  >
                    <img
                      className="w-full h-full object-cover"
                      src={mediaFile.url}
                    />
                    <TitleView
                      title="remove"
                      className="right-1 bottom-1 absolute"
                    >
                      <Tip
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          removeMediaFile(index);
                        }}
                        className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-secondary-background] rounded-full"
                        icon={allIcons.regular.faXmarkCircle}
                      />
                    </TitleView>
                  </div>
                );
              })}
            </div>
          </Scroll>
        </div>
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        <Button
          onClick={() => {
            closePopup();
          }}
          className="flex-1 bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={async () => {
            execAction("merge-photos");
          }}
          disabled={loading || mediaFiles.length === 0}
          rightIcon={
            loading ? allIcons.solid.faCircleNotch : allIcons.solid.faImages
          }
          className="flex-1"
          iconClassName={tw(loading && "animate-spin")}
        >
          <Translate content="merge photos" />
        </Button>
      </div>
    </Card>
  );
};
