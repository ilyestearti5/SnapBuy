import {
  Button,
  Card,
  CardWait,
  CircleTip,
  Field,
  Icon,
  KeyPanding,
  Line,
  Scroll,
  TabContent,
  Translate,
} from "@biqpod/app/ui/components";
import { useStoreId } from "../utils";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  isLoading,
  setFieldValue,
  setTab,
  showPopup,
  showToast,
  useAction,
  useAsyncEffect,
  useAsyncMemo,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { delay, filterFuzzySearch, mapAsync, tw } from "@biqpod/app/ui/utils";
import { useEffect, useMemo, useState } from "react";
import { allIcons, getDownloadURL, updateFile } from "@biqpod/app/ui/apis";
import { getPrice } from "../utils";
import { Nothing } from "@biqpod/app/ui/types";
import { Collections } from "./Collections";
import { compressImage } from "../utils/utilities";
interface ProductRenderProps {
  product: SnapBuy.Product;
  selectedProducts: SnapBuy.Product[];
  onChangeSelectedProducts?: (products: SnapBuy.Product[]) => void;
}
export const ProductRender = ({
  product,
  selectedProducts,
  onChangeSelectedProducts,
}: ProductRenderProps) => {
  const photo = product.photos?.at(0);
  const isSelected = selectedProducts?.includes(product);
  const price = getPrice(product);
  return (
    <div
      className={tw(
        "w-[calc(50%)] flex items-center px-4 justify-between py-2 cursor-pointer",
        "hover:bg-[--biqpod-gray-opacity]"
      )}
      key={product.id}
      onClick={async () => {
        if (isSelected) {
          const response = await confirm({
            title: "Remove Product",
            message: `Are you sure you want to remove ${product.name} from the collection?`,
            detail: "This action cannot be undone.",
          });
          if (!response) return;
          onChangeSelectedProducts?.(
            selectedProducts.filter((p) => p.id !== product.id)
          );
        } else {
          onChangeSelectedProducts?.([...selectedProducts, product]);
        }
      }}
    >
      <div className="flex items-center gap-2">
        {isSelected && (
          <Icon
            iconClassName="text-green-500"
            icon={allIcons.solid.faCircleCheck}
          />
        )}
        <div>
          <div className="w-16 h-16">
            <img
              src={photo}
              alt={product.name}
              className="rounded-full w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-bold">{product.name}</span>
          <span className="text-green-500">{price.total}DA</span>
        </div>
      </div>
    </div>
  );
};
interface UpsertCollectionProps {
  collection?: SnapBuy.Collection;
  back?: boolean;
}
export const UpsertCollection = ({
  collection,
  back,
}: UpsertCollectionProps) => {
  useEffect(() => {
    photoState.set(collection?.photo || "");
    setFieldValue("collection-name", collection?.name || "");
  }, []);
  const storeId = useStoreId();
  const [isPasting, setIsPasting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file upload (paste, drag & drop, or file input)
  const handleFileUpload = async (file: File) => {
    if (file && file.type.startsWith("image/")) {
      try {
        // First read the file as data URL
        const reader = new FileReader();
        reader.onload = async (event) => {
          const result = event.target?.result as string;
          try {
            // Compress the image before setting it
            const compressedImage = await compressImage(result, 0.8, 800, 800);
            photoState.set(compressedImage);
            showToast("Image uploaded and compressed successfully!", "success");
          } catch (compressError) {
            console.error("Image compression failed:", compressError);
            // Fallback to original image if compression fails
            photoState.set(result);
            showToast(
              "Image uploaded successfully (compression failed)!",
              "success"
            );
          }
          setIsPasting(false);
          setIsDragging(false);
        };
        reader.onerror = () => {
          showToast("Failed to upload image", "error");
          setIsPasting(false);
          setIsDragging(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        showToast("Failed to process image", "error");
        setIsPasting(false);
        setIsDragging(false);
      }
    } else {
      showToast("Please select a valid image file", "error");
      setIsPasting(false);
      setIsDragging(false);
    }
  };

  // Handle paste events for image upload
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      // Check if there's an image in the clipboard
      const imageItem = Array.from(items).find(
        (item) => item.type.indexOf("image") !== -1
      );
      if (imageItem) {
        e.preventDefault();
        setIsPasting(true);
        try {
          const file = imageItem.getAsFile();
          if (file) {
            handleFileUpload(file);
          } else {
            setIsPasting(false);
          }
        } catch (error) {
          showToast("Failed to paste image", "error");
          setIsPasting(false);
        }
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    };
    // Add event listeners
    document.addEventListener("paste", handlePaste);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);
    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);
  const products = useAsyncMemo(async () => {
    if (!storeId) return [];
    return await snapbuyApi.getProductsOf(storeId);
  }, [storeId]);
  const selectedProducts = useCopyState<SnapBuy.Product[]>([]);
  const loadingProducts = useCopyState(false);
  useAsyncEffect(async () => {
    loadingProducts.set(true);
    await delay(500);
    const products = await mapAsync(
      collection?.products || [],
      async (prodId) => {
        const prod = await snapbuyApi.getProduct(prodId);
        return prod!;
      }
    );
    loadingProducts.set(false);
    selectedProducts.set(products);
  }, []);
  const unSelectedProducts = useMemo(() => {
    return products?.filter(
      (product) => !selectedProducts.get.some((p) => p.id === product.id)
    );
  }, [products, selectedProducts.get]);
  const value = getFieldValue("search-products-for-collection");
  const filterdProducts = useMemo(() => {
    const filterdList = filterFuzzySearch(
      unSelectedProducts || [],
      value || "",
      "name"
    );
    return [
      ...selectedProducts.get.sort((prod1, prod2) => {
        if (prod1.name && prod2.name) {
          return prod1.name.localeCompare(prod2.name);
        }
        return 0;
      }),
      ...filterdList,
    ];
  }, [selectedProducts.get, unSelectedProducts, value]);
  useEffect(() => {
    setTab("upsert-collection", "upsert-collection");
  }, []);
  const photoState = useCopyState<string | Nothing>(collection?.photo);

  // Handle paste events for image upload
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      // Check if there's an image in the clipboard
      const imageItem = Array.from(items).find(
        (item) => item.type.indexOf("image") !== -1
      );
      if (imageItem) {
        e.preventDefault();
        setIsPasting(true);
        try {
          const file = imageItem.getAsFile();
          if (file) {
            handleFileUpload(file);
          } else {
            setIsPasting(false);
          }
        } catch (error) {
          showToast("Failed to paste image", "error");
          setIsPasting(false);
        }
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    };
    // Add event listeners
    document.addEventListener("paste", handlePaste);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);
    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);
  const name = getFieldValue("collection-name");
  const upsertCollection = useAction(
    "upsert-collection",
    async () => {
      if (!storeId) {
        showToast("Store ID is required");
        throw new Error("Store ID is required");
      }
      if (!name) {
        showToast("Collection name is required");
        throw new Error("Collection name is required");
      }
      const id = collection?.id || crypto.randomUUID();
      var photo: string | null = null;
      if (photoState.get) {
        const blob = await fetch(photoState.get).then((r) => r.blob());
        const ref = [
          "projects",
          import.meta.env.VITE_PROJECT_ID,
          "stores",
          storeId,
          "collections",
          id,
        ];
        await updateFile(ref, blob);
        photo = await getDownloadURL(ref);
      }
      const options: SnapBuy.Collection = {
        id,
        ...collection,
        name,
        storeId,
        products: selectedProducts.get?.map((p) => p.id!) || [],
      };
      if (photo) {
        options.photo = photo;
      }
      await snapbuyApi.upsertCollection(options);
    },
    [collection, photoState.get, selectedProducts.get]
  );
  const loading = isLoading(upsertCollection);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-4">
        <div className="flex items-center gap-2">
          {back && (
            <div>
              <CircleTip
                onClick={() => {
                  closePopup();
                  showPopup(<Collections />);
                }}
                icon={allIcons.solid.faChevronLeft}
              />
            </div>
          )}
          <h1 className="text-2xl">
            <Translate
              content={collection ? "Update Collection" : "Create Collection"}
            />
          </h1>
        </div>
        <div>
          <CircleTip
            onClick={() => {
              closePopup();
            }}
            icon={allIcons.solid.faXmark}
          />
        </div>
      </div>
      <Line />
      <TabContent
        identifier="upsert-collection"
        className="flex flex-col h-full overflow-hidden"
        value="upsert-collection"
      >
        <div className="p-2">
          <Field
            className="rounded-xl"
            inputName="search-products-for-collection"
            placeholder="Search Products For Collection"
          />
        </div>
        <Line />
        <Scroll>
          {!loadingProducts.get && (
            <div className="flex flex-wrap items-center">
              {filterdProducts.map((product) => {
                return (
                  <ProductRender
                    key={product.id}
                    product={product}
                    selectedProducts={selectedProducts.get}
                    onChangeSelectedProducts={(products) => {
                      selectedProducts.set(products);
                    }}
                  />
                );
              })}
            </div>
          )}
          {loadingProducts.get && <CardWait className="w-full h-full" />}
        </Scroll>
        <Line />
        <div className="flex gap-2 p-2">
          {collection?.id && (
            <Button
              onClick={async () => {
                const response = await confirm({
                  title: "Delete Collection",
                  message: `Are you sure you want to delete \`${collection.name}\`?`,
                  detail: "This action cannot be undone.",
                });
                if (response) {
                  snapbuyApi.deleteCollection(collection.id!);
                }
              }}
              className="bg-[--biqpod-error] rounded-full"
            >
              <Translate content="delete collection" />
            </Button>
          )}
          <Button
            className="rounded-full"
            rightIcon={allIcons.solid.faChevronRight}
            onClick={() => {
              setTab("upsert-collection", "upsert-collection-next");
            }}
          >
            <Translate content={"next"} />
          </Button>
        </div>
      </TabContent>
      <TabContent
        identifier="upsert-collection"
        className="flex flex-col h-full overflow-hidden"
        value="upsert-collection-next"
      >
        <div className="p-2">
          {/* Collection Photo */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold capitalize">
              <Translate content="collection photo" />
            </label>
            <div className="flex items-center gap-2 mb-2 text-sm">
              <Icon
                icon={allIcons.solid.faInfoCircle}
                iconClassName="text-xs"
              />
              <span>
                <span className="text-[--biqpod-gray-opacity-2]">
                  <Translate content="upload drag drop or paste image" />
                </span>
                <KeyPanding shortcut={["Ctrl+v"]} />
              </span>
            </div>
            <div className="flex max-md:flex-col justify-between items-center gap-4">
              {photoState.get ? (
                <div className="relative">
                  <img
                    src={photoState.get}
                    className="border border-[--biqpod-borders] border-solid rounded-xl w-20 h-20 object-cover"
                    alt="Collection"
                  />
                </div>
              ) : (
                <div
                  className={`flex justify-center items-center bg-[--biqpod-gray-opacity] border border-[--biqpod-borders] border-dashed rounded-xl w-20 h-20 transition-all duration-200 ${
                    isPasting || isDragging
                      ? "border-[--biqpod-primary] bg-[--biqpod-primary-background] scale-105"
                      : ""
                  }`}
                >
                  {isPasting ? (
                    <Icon
                      icon={allIcons.solid.faSpinner}
                      iconClassName="text-2xl animate-spin text-[--biqpod-primary]"
                    />
                  ) : isDragging ? (
                    <Icon
                      icon={allIcons.solid.faCloudArrowUp}
                      iconClassName="text-2xl text-[--biqpod-primary]"
                    />
                  ) : (
                    <Icon
                      icon={allIcons.solid.faImage}
                      iconClassName="text-2xl"
                    />
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                style={{ display: "none" }}
                id="collection-photo-upload"
              />
              <div className="flex items-center gap-2">
                {photoState.get && (
                  <Button
                    onClick={() => {
                      photoState.set(null);
                    }}
                    icon={allIcons.solid.faXmark}
                    className="bg-[--biqpod-error] px-3 py-1 w-fit text-[--biqpod-primary-content]"
                  >
                    <Translate content="remove" />
                  </Button>
                )}
                <Button
                  icon={allIcons.solid.faUpload}
                  className="px-3 py-1 w-fit"
                  onClick={() => {
                    document.getElementById("collection-photo-upload")?.click();
                  }}
                >
                  <Translate content="upload" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Line />
        <div className="p-2">
          <Field
            inputName="collection-name"
            placeholder="Collection Name"
            defaultValue={collection?.name}
            className="rounded-xl"
          />
        </div>
        <Line />
        <Scroll>
          <div className="flex flex-wrap">
            {selectedProducts.get.map((prod) => {
              return (
                <ProductRender
                  product={prod}
                  selectedProducts={selectedProducts.get}
                  onChangeSelectedProducts={(products) => {
                    selectedProducts.set(products);
                  }}
                  key={prod.id}
                />
              );
            })}
          </div>
        </Scroll>
        <Line />
        <div className="flex gap-2 p-2">
          <Button
            className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
            onClick={() => {
              setTab("upsert-collection", "upsert-collection");
            }}
            icon={allIcons.solid.faChevronLeft}
          >
            <Translate content={"back"} />
          </Button>
          <Button
            className="rounded-full"
            iconClassName={tw(loading && "animate-spin")}
            icon={
              loading
                ? allIcons.solid.faSpinner
                : collection
                ? allIcons.solid.faPen
                : allIcons.solid.faPlus
            }
            onClick={() => {
              execAction("upsert-collection");
            }}
          >
            <Translate content={"create"} />
          </Button>
        </div>
      </TabContent>
    </Card>
  );
};
