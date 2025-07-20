import { Line, Translate } from "@biqpod/app/ui/components";
import { UpsertDeliverySettings } from ".";
export const DeliveriesSettings = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3">
        <h1 className="font-bold text-2xl capitalize">
          <Translate content="deliveries settings" />
        </h1>
      </div>
      <Line />
      <UpsertDeliverySettings />
      {/* Add your settings form or components here */}
    </div>
  );
};
