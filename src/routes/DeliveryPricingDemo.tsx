import { Card, Line, Translate, Button } from "@biqpod/app/ui/components";
import { StoreDeliveryPricingList } from "../components";
import { useStoreId } from "../utils";

/**
 * Demo page showing how to use the delivery pricing components
 * This is for demonstration purposes and can be removed
 */
export const DeliveryPricingDemo = () => {
  const storeId = useStoreId();

  const showAddForm = () => {
    if (!storeId) {
      alert("No store selected");
      return;
    }
    // showPopup(<UpsertDeliveryPrice storeId={storeId} />);
  };

  return (
    <div className="space-y-6 p-4">
      <Card className="p-6">
        <h1 className="mb-4 font-bold text-2xl">
          <Translate content="delivery prices" /> - Demo
        </h1>
        <p className="mb-4 text-gray-600">
          This page demonstrates the two new delivery pricing components:
        </p>
        <ul className="space-y-2 text-gray-700 list-disc list-inside">
          <li>
            <strong>StoreDeliveryPricingList</strong> - Shows all delivery
            prices for a store
          </li>
          <li>
            <strong>UpsertStoreDeliveryPrice</strong> - Form to add/edit
            delivery prices
          </li>
        </ul>

        <Line />

        <div className="flex gap-4">
          <Button
            onClick={showAddForm}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Test Add Form
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="mb-4 font-semibold text-xl">
          <Translate content="delivery prices" /> List
        </h2>
        <StoreDeliveryPricingList />
      </div>
    </div>
  );
};
