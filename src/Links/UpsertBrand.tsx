import {
  Button,
  Card,
  CircleTip,
  Field,
  Line,
  Translate,
  Icon,
  KeyPanding,
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
import { Nothing } from "@biqpod/app/ui/types";
import { useEffect, useState } from "react";
export interface UpsertBrandProps {
  brand?: SnapBuy.Brand;
  back?: boolean;
}
export const UpsertBrand = ({ brand, back }: UpsertBrandProps) => {
  const storeId = useStoreId();
  const photo = useCopyState<string | Nothing>(brand?.photo || null);
  const [isPasting, setIsPasting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Set field values when editing a brand
  useEffect(() => {
    if (brand) {
      setFieldValue("brand-name", brand.name || "");
      setFieldValue("brand-description", brand.description || "");
    }
  }, [brand]);
  // Handle file upload (paste, drag & drop, or file input)
  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        photo.set(result);
        showToast("Image uploaded successfully!", "success");
        setIsPasting(false);
        setIsDragging(false);
      };
      reader.onerror = () => {
        showToast("Failed to upload image", "error");
        setIsPasting(false);
        setIsDragging(false);
      };
      reader.readAsDataURL(file);
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
      const brandData: Omit<SnapBuy.Brand, "id" | "createdAt" | "updatedAt"> = {
        name: name.trim(),
        description: description?.trim(),
        photo: photo.get || undefined,
        storeId,
      };
      if (brand?.id) {
        // Update existing brand
        await snapbuyApi.updateBrand(brand.id, brandData);
        showToast("Brand updated successfully", "success");
      } else {
        // Create new brand
        await snapbuyApi.createBrand(brandData);
        showToast("Brand created successfully", "success");
      }
      execAction("fetch-brands");
      closePopup();
    },
    [storeId, brand, photo.get, name, description]
  );
  const loading = isLoading(createBrandAction);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <h1 className="text-2xl capitalize">
          {brand ? (
            <Translate content="edit brand" />
          ) : (
            <Translate content="create brand" />
          )}
        </h1>
        <div className="flex">
          {back && (
            <CircleTip
              icon={allIcons.solid.faArrowLeft}
              onClick={() => {
                closePopup();
              }}
            />
          )}
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
            <Icon icon={allIcons.solid.faInfoCircle} iconClassName="text-xs" />
            <span>
              <span className="text-[--biqpod-gray-opacity-2]">
                <Translate content="upload drag drop or paste image" />
              </span>
              <KeyPanding shortcut={["Ctrl+v"]} />
            </span>
          </div>
          <div className="flex max-md:flex-col justify-between items-center gap-4">
            {photo.get ? (
              <div className="relative">
                <img
                  src={photo.get}
                  className="border border-[--biqpod-borders] border-solid rounded-xl w-20 h-20 object-cover"
                  alt="Brand"
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
              id="brand-photo-upload"
            />
            <div className="flex items-center gap-2">
              {photo.get && (
                <Button
                  onClick={() => {
                    photo.set(null);
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
                  document.getElementById("brand-photo-upload")?.click();
                }}
              >
                <Translate content="upload" />
              </Button>
            </div>
          </div>
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
                await snapbuyApi.deleteBrand(brand.id!);
                showToast("Brand deleted successfully", "success");
                closePopup();
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
