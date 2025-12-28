import { allIcons } from "@biqpod/app/ui/apis";
import { Card, Translate, CircleTip, Button } from "@biqpod/app/ui/components";
import {
  useCopyState,
  useAction,
  showToast,
  closePopup,
  execAction,
  isLoading,
  confirm,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { useMemo, useEffect } from "react";
import { Line } from "@biqpod/app/ui/components";
import { snapbuyApi } from "../apis";
import MetadataFieldComponent from "../components/MetadataField";
import { useStoreId } from "../utils";

export const AddMetadataPopup = ({
  selectedProducts,
  onSuccess,
}: {
  selectedProducts: string[];
  onSuccess: () => void;
}) => {
  const storeId = useStoreId();
  const tempMetadata = useCopyState<
    Record<string, Biqpod.Snapbuy.MetadataField | undefined>
  >({});
  const metadataFields = useMemo(() => {
    return Object.values(tempMetadata.get || {})
      .map((field) => field!)
      .filter(Boolean);
  }, [tempMetadata.get]);
  // Convert array-based approach to object-based for MetadataFieldComponent
  const action = useAction(
    "add-metadata",
    async () => {
      if (metadataFields.length === 0) {
        showToast("Please add a metadata field first", "error");
        return;
      }
      // Update each selected product with all metadata fields
      const updatePromises = selectedProducts.map(async (productId) => {
        try {
          const product = await snapbuyApi.product.get(productId);
          if (product) {
            let updatedMetaData = { ...product.metaData, ...tempMetadata.get };
            // Add or update each metadata field
            const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
              id: productId,
              metaData: updatedMetaData,
            };
            await snapbuyApi.product.upsert(storeId!, [updatedProduct]);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      });
      await Promise.all(updatePromises);
      const fieldNames = metadataFields.map((f) => f.key).join(", ");
      showToast(
        `Metadata fields "${fieldNames}" added to ${selectedProducts.length} products successfully`,
        "success"
      );
      onSuccess();
      closePopup();
      execAction("fetch-products");
      // Clear temp data
      tempMetadata.set({});
    },
    [selectedProducts, storeId, tempMetadata.get]
  );
  const loading = isLoading(action);
  useEffect(() => {
    return () => {
      tempMetadata.set({});
    };
  }, []);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="add metadata to products" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="flex flex-col gap-4 h-full overflow-hidden">
        <div className="bg-[--biqpod-gray-opacity] mx-2 mt-2 p-3 rounded-lg">
          <p className="text-sm">
            <strong>Selected Products:</strong> {selectedProducts.length}
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <MetadataFieldComponent
            metadata={tempMetadata.get || undefined}
            onChangeMetadata={(metadata) => {
              tempMetadata.set(metadata);
              console.log(metadata);
            }}
            showAddSection={true}
            showFieldActions={true}
          />
        </div>
        <div className="bg-yellow-600/20 mx-2 p-3 rounded-lg">
          <p className="text-yellow-600 text-sm">
            <strong>Note:</strong> This will add the selected metadata fields to
            all selected products. If a product already has any of these
            metadata keys, they will be overwritten.
          </p>
        </div>
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        <Button
          onClick={() => {
            closePopup();
            tempMetadata.set({});
          }}
          className="flex-1 bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={async () => {
            if (metadataFields.length === 0) {
              showToast("Please add a metadata field first", "error");
              return;
            }
            const fieldNames = metadataFields.map((f) => f!.key).join(", ");
            const response = await confirm({
              title: "Add Metadata",
              message: `Are you sure you want to add metadata fields "${fieldNames}" to ${selectedProducts.length} products?`,
            });
            if (response) {
              execAction("add-metadata");
            }
          }}
          disabled={loading || metadataFields.length === 0}
          rightIcon={
            loading ? allIcons.solid.faCircleNotch : allIcons.solid.faCheck
          }
          className="flex-1"
          iconClassName={tw(loading && "animate-spin")}
        >
          <Translate content="add metadata" />
        </Button>
      </div>
    </Card>
  );
};
