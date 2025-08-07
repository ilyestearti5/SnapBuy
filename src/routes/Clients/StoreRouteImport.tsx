import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { useParams } from "react-router-dom";
import { snapbuyApi } from "../../apis";
import { EmptyComponent } from "@biqpod/app/ui/components";
const {
  addPack,
  addStore,
  addZone,
  assignDeliveryAgent,
  deleteCollection,
  deleteLinkZone,
  deleteAccount,
  deleteZone,
  deletePack,
  deleteProduct,
  deleteStore,
  upsertAccount,
  upsertCollection,
  updateStore,
  upsertProducts,
  updateDeliveryPrice,
  updatePack,
  getExploreStores,
  isSubscribed,
  linkZone,
  saveProducts,
  setDeliveryToOrder,
  setPixelId,
  setStorePixels,
  ...api
} = snapbuyApi;
export { api };
export const StoreRouteImport = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const currentStore = useAsyncMemo(async () => {
    return snapbuyApi.getStore(storeId);
  }, [storeId]);
  const template = useAsyncMemo(async () => {
    if (!currentStore?.template) return null;
    return snapbuyApi.getTemplate(currentStore?.template);
  }, [currentStore]);
  const StoreRoute = useAsyncMemo(async () => {
    if (template?.url) {
      console.log("Loading template from:", template.url);
      try {
        const module = await import(template.url);
        return module.StoreRoute || module.default;
      } catch (error) {
        console.error("Failed to load template:", error);
        // If import fails due to module resolution, try with a different approach
        if (
          error instanceof TypeError &&
          error.message.includes("module specifier")
        ) {
          console.warn(
            "Module resolution failed, template may have dependency issues"
          );
        }
        return null;
      }
    }
    return null;
  }, [template]);
  return (
    <EmptyComponent>
      {StoreRoute ? <StoreRoute storeId={storeId} api={api} /> : null}
    </EmptyComponent>
  );
};
