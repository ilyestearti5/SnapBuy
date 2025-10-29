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
  showToast,
  execAction,
  closePopup,
} from "@biqpod/app/ui/hooks";
import { useEffect } from "react";
import { snapbuyApi } from "../apis";
import { Biqpod } from "@biqpod/app/ui/types";

export const AssignDeliveryAgent = ({
  order,
}: {
  order: Biqpod.Snapbuy.Order;
}) => {
  const agents = useCopyState<Biqpod.Snapbuy.Account[] | null>(null);
  const selectedAgent = useCopyState<string | null>(null);
  useEffect(() => {
    snapbuyApi.getDeliveryAgents().then(agents.set);
  }, []);
  useAction(
    "assign-agent",
    async () => {
      if (!selectedAgent.get) {
        showToast("Please select an agent", "error");
        return;
      }
      await snapbuyApi.assignDeliveryAgent(order.id, selectedAgent.get);
      showToast("Agent assigned successfully", "success");
      execAction("fetch-delivery-orders", {});
    },
    [selectedAgent.get]
  );
  return (
    <Card className="max-md:w-11/12 md:w-1/2 overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <h1 className="font-bold text-xl">
          <Translate content="assign delivery agent" />
        </h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faTimes}
            onClick={() => closePopup()}
          />
        </div>
      </div>
      <Line />
      <div className="p-4">
        <div className="mb-4">
          <p>
            <strong>
              <Translate content="order id" />:
            </strong>{" "}
            {order.id}
          </p>
          <p>
            <strong>
              <Translate content="client" />:
            </strong>{" "}
            {order.client?.firstname} {order.client?.lastname}
          </p>
          <p>
            <strong>
              <Translate content="phone" />:
            </strong>{" "}
            {order.client?.phone}
          </p>
        </div>
        <div className="mb-4">
          <label className="block mb-2">
            <Translate content="select delivery agent" />:
          </label>
          <EnumField
            id="agent-selector"
            state={selectedAgent as any}
            config={{
              list:
                agents.get?.map((agent) => ({
                  value: agent.id!,
                  content: `${agent.firstname} ${agent.lastname} - ${agent.phone}`,
                })) || [],
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => execAction("assign-agent", {})}
            className="bg-[--biqpod-success] text-white"
            icon={allIcons.solid.faCheck}
          >
            <Translate content="assign" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
