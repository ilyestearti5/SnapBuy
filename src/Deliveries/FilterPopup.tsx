import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  Translate,
  CircleTip,
  Line,
  EnumField,
  Button,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  useAction,
  setTemp,
  closePopup,
  execAction,
  useAsyncMemo,
  getTemp,
  isLoading,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { snapbuyApi } from "../apis";
import { tw } from "@biqpod/app/ui/utils";
export const FilterPopup = () => {
  const filterStatus = getTemp<string>("filter-delivery-management-status");
  const filterDelivery = getTemp<string>("filter-delivery-management-delivery");
  const localFilterStatus = useCopyState<string | Nothing>("all");
  const localFilterDelivery = useCopyState<string | Nothing>("all");
  useAction(
    "apply-filters",
    async () => {
      setTemp("filter-delivery-management-status", localFilterStatus.get);
      setTemp("filter-delivery-management-delivery", localFilterDelivery.get);
      closePopup();
      execAction("fetch-delivery-orders");
    },
    [localFilterDelivery.get, localFilterStatus.get]
  );
  const accounts = useAsyncMemo(async () => {
    return await snapbuyApi.getDeliveryAgents();
  }, []);

  useAction(
    "reset-delivery-filters",
    async () => {
      setTemp("filter-delivery-management-status", null);
      setTemp("filter-delivery-management-delivery", null);
      await execAction("fetch-delivery-orders");
    },
    []
  );

  const loading = isLoading("reset-delivery-filters");

  return (
    <Card className="max-md:w-11/12 md:w-96 overflow-hidden">
      <div className="flex justify-between items-center p-4">
        <h1 className="font-bold text-2xl capitalize">
          <Translate content="filter orders" />
        </h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faTimes}
            onClick={() => closePopup()}
          />
        </div>
      </div>
      <Line />
      <div className="space-y-4 p-4">
        <div>
          <label className="block mb-2 font-medium capitalize">
            <Translate content="filter by status" />:
          </label>
          <EnumField
            id="popup-filter-status"
            state={localFilterStatus}
            config={{
              list: [
                { value: "all", content: "all status" },
                { value: "pending", content: "pending" },
                { value: "processing", content: "processing" },
                { value: "delivery", content: "out for delivery" },
                { value: "completed", content: "completed" },
              ],
            }}
          />
        </div>
        <div>
          <label className="block mb-2 font-medium capitalize">
            <Translate content="filter by delivery" />:
          </label>
          <EnumField
            id="popup-filter-status"
            state={localFilterDelivery}
            config={{
              list: accounts?.map((agent) => {
                return {
                  value: agent.id!,
                  content: `${agent.firstname} ${agent.lastname} - ${agent.phone}`,
                  desc: `${agent.firstname} ${agent.lastname} - ${agent.phone}`,
                };
              }),
              search: true,
              placeholder: "Search Delivery Agent",
            }}
          />
        </div>
      </div>
      <Line />
      <div className="flex gap-2 p-2">
        {filterDelivery && filterStatus && (
          <Button
            icon={allIcons.solid.faRotate}
            onClick={async () => {
              await execAction("reset-delivery-filters");
              closePopup();
            }}
            iconClassName={tw(loading && "animate-spin")}
            className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
          >
            <Translate content="reset" />
          </Button>
        )}
        <Button
          onClick={() => execAction("apply-filters", {})}
          className="rounded-full"
          icon={allIcons.solid.faCheck}
        >
          <Translate content="apply filters" />
        </Button>
      </div>
    </Card>
  );
};
