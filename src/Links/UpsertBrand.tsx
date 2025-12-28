import {
  Button,
  Card,
  CircleTip,
  Field,
  Line,
  Translate,
  Icon,
  KeyPanding,
  ImageField,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  execAction,
  getFieldValue,
  isLoading,
  showToast,
  useAction,
  useCopyState,
  setFieldValue,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { allIcons } from "@biqpod/app/ui/apis";
import { Biqpod, Nothing } from "@biqpod/app/ui/types";
import { useEffect } from "react";
import { compressImage } from "../utils/utilities";
import { setTextSide } from "../hooks/usePayments";
export interface UpsertBrandProps {
  brand?: Biqpod.Snapbuy.Brand;
}
export const UpsertBrand = ({ brand }: UpsertBrandProps) => {
  const storeId = useStoreId();
  const photo = useCopyState<string | Nothing>(brand?.photo || null);
  // Set field values when editing a brand
  useEffect(() => {
    setFieldValue("brand-name", brand?.name || "");
    setFieldValue("brand-description", brand?.description || "");
  }, [brand]);
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
            photo.set(compressedImage);
            showToast("Image uploaded and compressed successfully!", "success");
          } catch (compressError) {
            console.error("Image compression failed:", compressError);
            // Fallback to original image if compression fails
            photo.set(result);
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
  }, [photo]);
  const name = getFieldValue("brand-name");
  const description = getFieldValue("brand-description");
  const createBrandAction = useAction(
    "create-brand",
    async () => {
      if (!name?.trim()) {
        showToast("Please enter a brand name", "error");
        return;
      }
      if (!storeId) {
        showToast("Store ID not found", "error");
        return;
      }
      closePopup();
      const brandData: Omit<
        Biqpod.Snapbuy.Brand,
        "id" | "createdAt" | "updatedAt"
      > = {
        name: name.trim(),
        description: description?.trim(),
        photo: photo.get || undefined,
        storeId,
      };
      setTextSide(
        brand?.id ? "Start Updating Brand..." : "Start Creating Brand..."
      );
      await snapbuyApi.brands.upsert({
        id: brand?.id,
        ...brandData,
      });
      showToast(
        brand?.id ? "Brand updated successfully" : "Brand created successfully"
      );
      setTextSide("Refreshing Brands...");
      execAction("fetch-brands");
      setTextSide();
    },
    [storeId, brand, photo.get, name, description]
  );
  const loading = isLoading(createBrandAction);
  return (
    <Card className="relative max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <h1 className="text-2xl capitalize">
          <Translate content={brand ? "edit brand" : "create brand"} />
        </h1>
        <div className="flex">
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      <div className="flex flex-col gap-4 p-4 h-full">
        {/* Brand Photo */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold capitalize">
            <Translate content="brand photo" />
          </label>
          <div className="flex items-center gap-2 mb-2 text-sm">
            <Icon icon={allIcons.solid.faInfoCircle} className="text-xs" />
            <span>
              <span className="text-[--biqpod-gray-opacity-2]">
                <Translate content="upload drag drop paste image or use url" />
              </span>
              <KeyPanding shortcut={["Ctrl+v"]} />
            </span>
          </div>
          {/* Mode Selection */}
          <ImageField state={photo} id="brand-photo-url" />
        </div>
        {/* Brand Name */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold capitalize" htmlFor="brand-name">
            <Translate content="brand name" />
          </label>
          <Field
            inputName="brand-name"
            placeholder="Enter brand name"
            required
            className="rounded-xl"
          />
        </div>
        {/* Brand Description */}
        <div className="flex flex-col gap-2">
          <label
            className="font-semibold capitalize"
            htmlFor="brand-description"
          >
            <Translate content="description" />{" "}
            <span className="text-[--biqpod-gray-opacity]">
              (<Translate content="optional" />)
            </span>
          </label>
          <Field
            className="rounded-xl"
            inputName="brand-description"
            placeholder="Enter brand description"
            rows={3}
          />
        </div>
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        {brand?.id && (
          <Button
            onClick={async () => {
              const response = await confirm({
                title: "Delete Brand",
                message: `Are you sure you want to delete "${brand.name}"?`,
                detail: "This action cannot be undone.",
              });
              if (response) {
                closePopup();
                setTextSide("Start Deleting Brand...");
                await snapbuyApi.brands.delete(brand.id!);
                showToast("Brand deleted successfully", "success");
                setTextSide("Refreshing Brands...");
                await execAction("fetch-brands");
                setTextSide();
              }
            }}
            className="bg-[--biqpod-error] rounded-full"
          >
            <Translate content="delete brand" />
          </Button>
        )}
        <Button
          className="rounded-full"
          onClick={() => {
            execAction("create-brand");
          }}
          icon={loading ? allIcons.solid.faCircleNotch : allIcons.solid.faCheck}
          iconClassName={loading ? "animate-spin" : ""}
          disabled={loading}
        >
          <Translate content={brand ? "update" : "create"} />
        </Button>
      </div>
    </Card>
  );
};
