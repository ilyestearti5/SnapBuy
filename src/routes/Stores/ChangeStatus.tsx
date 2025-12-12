import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  confirm,
  getTemp,
  setTemp,
  showToast,
} from "@biqpod/app/ui/hooks";
import { colors, orderStatusIcons } from "../../utils";
import { tw } from "@biqpod/app/ui/utils";
import { Biqpod } from "@biqpod/app/ui/types";
import { snapbuyApi } from "../../apis";
export interface ChangeStatusProps {
  orders: Biqpod.Snapbuy.Order[];
}
export const allStatus: Biqpod.Snapbuy.OrderStatus[] = [
  "pending",
  "cancelled",
  "processing",
  "completed",
  "delivery",
  "done",
];
export const ChangeStatus = ({ orders }: ChangeStatusProps) => {
  const selectOne = getTemp<Biqpod.Snapbuy.OrderStatus>("selected-status");
  return (
    <Card className="max-md:w-11/12 md:w-2/3">
      <div className="flex justify-between items-center p-2">
        <h1 className="font-bold text-3xl capitalize">
          <Translate content="change status" />
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
      <Scroll>
        {allStatus.map((singleStatus) => {
          const isSelected = singleStatus === selectOne;
          return (
            <div
              onClick={() => {
                setTemp("selected-status", singleStatus);
              }}
              style={{
                color: colors[singleStatus],
                backgroundColor: `${colors[singleStatus]}${
                  isSelected ? 80 : 20
                }`,
              }}
              key={singleStatus}
              className={tw(
                "px-3 py-2 capitalize transition-[padding] duration-300 cursor-pointer",
                isSelected && "px-8 "
              )}
            >
              <span className="inline-flex items-center gap-2 p-2 rounded-2xl">
                <Icon icon={orderStatusIcons[singleStatus]} />
                <span>{singleStatus}</span>
              </span>
            </div>
          );
        })}
      </Scroll>
      <Line />
      <div className="p-2">
        <Button
          className="rounded-full"
          onClick={async () => {
            if (!selectOne) {
              return;
            }

            const result = await confirm({
              title: "confirm status change",
              message: `are you sure you want to change the status of ${orders.length} order(s) to "${selectOne}"?`,
              type: "warning",
            });

            if (!result) {
              return;
            }
            closePopup();
            const allPromiseds = orders.map(async (order) => {
              return snapbuyApi.order.updateStatus(order.id, selectOne!);
            });
            await Promise.all(allPromiseds);
            showToast("status updated successfully", "success");
          }}
        >
          <Translate content={`change to ${selectOne}`} />
        </Button>
      </div>
    </Card>
  );
};
