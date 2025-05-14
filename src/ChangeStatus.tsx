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
  openDialog,
  setTemp,
} from "@biqpod/app/ui/hooks";
import { colors, icons } from "./Links/Orders";
import { deleteDoc, setDoc } from "./server";
import { tw } from "@biqpod/app/ui/utils";
export interface ChangeStatusProps {
  order: SnapBuy.Order;
}
export const allStatus: SnapBuy.OrderStatus[] = [
  "pending",
  "cancelled",
  "processing",
  "completed",
  "delivery",
  "done",
];
export const ChangeStatus = ({ order }: ChangeStatusProps) => {
  const selectOne = getTemp<SnapBuy.OrderStatus>("selected-status");
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
                "px-3 py-2 transition-[padding] duration-300 cursor-pointer",
                isSelected && "px-8 capitalize"
              )}
            >
              <span className="inline-flex items-center gap-2 p-2 rounded-2xl">
                <Icon icon={icons[singleStatus]} />
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
            if (selectOne === "done") {
              const response = await confirm({
                title: "Are you sure?",
                message: "This will delete the order",
                type: "warning",
              });
              if (response) {
                await deleteDoc([
                  "projects",
                  import.meta.env.VITE_PROJECT_ID,
                  "orders",
                  order.id,
                ]);
              }
              return;
            }
            await setDoc(
              ["projects", import.meta.env.VITE_PROJECT_ID, "orders", order.id],
              {
                status: selectOne,
              }
            );
            closePopup();
          }}
        >
          <Translate content={`change to ${selectOne}`} />
        </Button>
      </div>
    </Card>
  );
};
