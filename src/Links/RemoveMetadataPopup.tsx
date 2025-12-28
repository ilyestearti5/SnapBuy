import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  Translate,
  CircleTip,
  ArrayField,
  Button,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  useAction,
  showToast,
  closePopup,
  execAction,
  isLoading,
  confirm,
} from "@biqpod/app/ui/hooks";
import { Nothing, Biqpod } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { Line } from "@biqpod/app/ui/components";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";

export const RemoveMetadataPopup = ({
  selectedProducts,
  onSuccess,
}: {
  selectedProducts: string[];
  onSuccess: () => void;
}) => {
  const storeId = useStoreId();
  const metadataKeys = useCopyState<string[] | Nothing>([]);
  const action = useAction(
    "remove-metadata",
    async () => {
      const metadataKeysList = metadataKeys.get || [];
      if (metadataKeysList.length === 0) {
        showToast("Please enter metadata keys to remove", "error");
        return;
      }
      // Update each selected product by removing the specified metadata fields
      const updatePromises = selectedProducts.map(async (productId) => {
        try {
          const product = await snapbuyApi.product.get(productId);
          if (product && product.metaData) {
            var meta = { ...product.metaData };
            metadataKeysList.forEach((key) => {
              const { [key]: _, ...rest } = meta;
              meta = rest;
            });
            const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
              id: productId,
              metaData: meta,
            };
            await snapbuyApi.product.upsert(storeId!, [updatedProduct]);
          }
        } catch (error) {
          console.error(`Failed to update product ${productId}:`, error);
        }
      });
      await Promise.all(updatePromises);
      const keysString = metadataKeysList.join(", ");
      showToast(
        `Metadata fields "${keysString}" removed from ${selectedProducts.length} products successfully`,
        "success"
      );
      onSuccess();
      closePopup();
      execAction("fetch-products");
      // Clear the field
      metadataKeys.set([]);
    },
    [selectedProducts, storeId, metadataKeys.get]
  );
  const loading = isLoading(action);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="text-2xl uppercase">
          <Translate content="remove metadata from products" />
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
          <Card>
            <h3 className="p-2 font-semibold text-lg capitalize">
              <Translate content="metadata keys to remove" />
            </h3>
            <Line />
            <div className="flex flex-col gap-2 p-2">
              <ArrayField id="metadata-keys" state={metadataKeys} />
            </div>
          </Card>
        </div>
        <div className="bg-red-600/20 p-3 rounded-lg">
          <p className="text-red-600 text-sm">
            <strong>Warning:</strong> This will permanently remove the specified
            metadata fields from all selected products. This action cannot be
            undone.
          </p>
        </div>
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        <Button
          onClick={() => {
            closePopup();
            metadataKeys.set([]);
          }}
          className="flex-1 bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={async () => {
            const metadataKeysList = metadataKeys.get || [];
            if (metadataKeysList.length === 0) {
              showToast("Please enter metadata keys to remove", "error");
              return;
            }
            const keysString = metadataKeysList.join(", ");
            const response = await confirm({
              title: "Remove Metadata",
              message: `Are you sure you want to remove metadata fields "${keysString}" from ${selectedProducts.length} products?`,
              detail: "This action cannot be undone.",
              type: "warning",
            });
            if (response) {
              execAction("remove-metadata");
            }
          }}
          disabled={loading || (metadataKeys.get || []).length === 0}
          rightIcon={
            loading ? allIcons.solid.faCircleNotch : allIcons.solid.faTrash
          }
          className="flex-1"
          iconClassName={tw(loading && "animate-spin")}
        >
          <Translate content="remove metadata" />
        </Button>
      </div>
    </Card>
  );
};
