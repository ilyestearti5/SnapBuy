import {
  AsyncComponent,
  Button,
  Card,
  CardHeaderForPopup,
  CardWait,
  EmptyComponent,
  Field,
  Icon,
  Image,
  ImageField,
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
  setFieldValue,
  setTab,
  showToast,
  useAction,
  useAsyncEffect,
  useAsyncMemo,
  useCopyState,
  useDefaultTab,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { delay, filterFuzzySearch, mapAsync, tw } from "@biqpod/app/ui/utils";
import { useEffect, useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import { getPrice } from "../utils";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { compressImage } from "../utils/utilities";
import { setTextSide } from "../hooks/usePayments";
interface ProductRenderProps {
  product: Biqpod.Snapbuy.Product;
  selectedProducts: Biqpod.Snapbuy.Product[];
  onChangeSelectedProducts?: (products: Biqpod.Snapbuy.Product[]) => void;
}
export const ProductRender = ({
  product,
  selectedProducts,
  onChangeSelectedProducts,
}: ProductRenderProps) => {
  const file = product.files?.at(0);
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
            type: "warning",
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
            className="text-green-500"
            icon={allIcons.solid.faCircleCheck}
          />
        )}
        <div>
          <div className="w-16 h-16">
            <Image
              src={file?.url}
              alt={product.name}
              className="bg-[--biqpod-gray-opacity] rounded-xl w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-bold">
            <span>{product.name}</span>
            <sub className="ml-2">
              <AsyncComponent
                render={async () => {
                  const brandId = product.brandId;
                  if (!brandId) {
                    return <EmptyComponent />;
                  }
                  const brand = await snapbuyApi.brands.get(brandId);
                  return <span>{brand?.name || ""}</span>;
                }}
              />
            </sub>
          </span>
          <span className="text-green-500">{price.total}DA</span>
        </div>
      </div>
    </div>
  );
};
interface UpsertCollectionProps {
  collection?: Biqpod.Snapbuy.Collection;
}
export const UpsertCollection = ({ collection }: UpsertCollectionProps) => {
  useEffect(() => {
    photoState.set(collection?.photo || "");
    setFieldValue("collection-name", collection?.name || "");
  }, []);
  const storeId = useStoreId();
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
        };
        reader.onerror = () => {
          showToast("Failed to upload image", "error");
        };
        reader.readAsDataURL(file);
      } catch (error) {
        showToast("Failed to process image", "error");
      }
    } else {
      showToast("Please select a valid image file", "error");
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
        try {
          const file = imageItem.getAsFile();
          if (file) {
            handleFileUpload(file);
          } else {
          }
        } catch (error) {
          showToast("Failed to paste image", "error");
        }
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
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
    return await snapbuyApi.product.getProductsOf(storeId);
  }, [storeId]);
  const selectedProducts = useCopyState<Biqpod.Snapbuy.Product[]>([]);
  const loadingProducts = useCopyState(false);
  useAsyncEffect(async () => {
    loadingProducts.set(true);
    await delay(500);
    const products = await mapAsync(
      collection?.products || [],
      async (prodId) => {
        const prod = await snapbuyApi.product.get(prodId);
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
        try {
          const file = imageItem.getAsFile();
          if (file) {
            handleFileUpload(file);
          } else {
          }
        } catch (error) {
          showToast("Failed to paste image", "error");
        }
      }
    };
    // Add event listeners
    document.addEventListener("paste", handlePaste);
    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);
  const name = getFieldValue("collection-name");
  useAction(
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
      closePopup();
      const id = collection?.id;
      const options: Biqpod.Snapbuy.Collection = {
        id,
        ...collection,
        name,
        storeId,
        products: selectedProducts.get?.map((p) => p.id!) || [],
      };
      if (photoState.get) {
        options.photo = photoState.get;
      }
      setTextSide("Uploading collection...");
      await snapbuyApi.collections.upsert(options);
      showToast(
        `Collection ${collection ? "updated" : "created"} successfully!`,
        "success"
      );
      setTextSide("Refreshing Collections...");
      await execAction("fetch-collections");
      setTextSide();
    },
    [collection, storeId, photoState.get, selectedProducts.get]
  );
  useDefaultTab("upsert-collection", "upsert-collection");
  return (
    <Card className="relative max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <CardHeaderForPopup
        title={collection ? "Update Collection" : "Create Collection"}
      />
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
                  type: "warning",
                });
                if (response) {
                  closePopup();
                  setTextSide("Deleting collection...");
                  await snapbuyApi.collections.delete(collection.id!);
                  showToast("Collection deleted successfully", "success");
                  setTextSide("Refreshing collections...");
                  await execAction("fetch-collections");
                  setTextSide();
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
              <Icon icon={allIcons.solid.faInfoCircle} className="text-xs" />
              <span>
                <span className="text-[--biqpod-gray-opacity-2]">
                  <Translate content="upload drag drop or paste image" />
                </span>
                <KeyPanding shortcut={["Ctrl+v"]} />
              </span>
            </div>
            <ImageField state={photoState} id="collection-photo-url" />
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
            icon={collection ? allIcons.solid.faPen : allIcons.solid.faPlus}
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
