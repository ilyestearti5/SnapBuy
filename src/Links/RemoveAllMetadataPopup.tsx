import { allIcons } from "@biqpod/app/ui/apis";
import { Card, Translate, CircleTip, Button } from "@biqpod/app/ui/components";
import {
  useAction,
  closePopup,
  showToast,
  execAction,
  confirm,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { Line } from "@biqpod/app/ui/components";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
export const RemoveAllMetadataPopup = ({
  selectedProducts,
  onSuccess,
}: {
  selectedProducts: string[];
  onSuccess: () => void;
}) => {
  const storeId = useStoreId();
  useAction(
    "remove-all-metadata",
    async () => {
      closePopup();
      // Update each selected product by removing all metadata
      const updatePromises = selectedProducts.map(async (productId) => {
        try {
          const product = await snapbuyApi.product.get(productId);
          if (product) {
            const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
              id: productId,
              metaData: {},
            };
            await snapbuyApi.product.upsert(storeId!, [updatedProduct]);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      });
      await Promise.all(updatePromises);
      showToast(
        `All metadata removed from ${selectedProducts.length} products successfully`,
        "success"
      );
      onSuccess();
      execAction("fetch-products");
    },
    [selectedProducts, storeId]
  );
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="remove all metadata from products" />
        </h1>
        <CircleTip
          icon={allIcons.solid.faXmark}
          onClick={() => {
            closePopup();
          }}
        />
      </div>
      <Line />
      <div className="flex flex-col justify-between gap-4 p-4 h-full">
        <div className="flex flex-col gap-2">
          <div className="bg-[--biqpod-gray-opacity] p-3 rounded-lg">
            <p className="text-sm">
              <strong>Selected Products:</strong> {selectedProducts.length}
            </p>
          </div>
        </div>
        <div className="bg-red-600/20 p-3 rounded-lg">
          <p className="text-red-600 text-sm">
            <strong>Warning:</strong> This will permanently remove ALL metadata
            fields from all selected products. This action cannot be undone.
          </p>
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
            const response = await confirm({
              title: "Remove All Metadata",
              message: `Are you sure you want to remove ALL metadata from ${selectedProducts.length} products?`,
              detail: "This action cannot be undone.",
              type: "warning",
            });
            if (response) {
              execAction("remove-all-metadata");
            }
          }}
          rightIcon={allIcons.solid.faTrashAlt}
          className="flex-1"
        >
          <Translate content="remove all metadata" />
        </Button>
      </div>
    </Card>
  );
};
