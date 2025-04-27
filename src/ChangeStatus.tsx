import { allIcons } from "biqpod/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  EmptyComponent,
  Icon,
  Line,
  Scroll,
  Translate,
} from "biqpod/ui/components";
import { closePopup, getTemp, setTemp } from "biqpod/ui/hooks";
import { colors, icons } from "./Links/Orders";
import { setDoc } from "./server";
import { tw } from "biqpod/ui/utils";

interface ChangeStatusProps {
  order: SnapBuy.Order;
}

const status: SnapBuy.OrderStatus[] = [
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
        {status.map((singleStatus) => {
          const isSelected = singleStatus === selectOne;
          return (
            <div
              onClick={() => {
                setTemp("selected-status", singleStatus);
              }}
              style={{
                color: colors[singleStatus],
                backgroundColor: `${colors[singleStatus]}${
                  isSelected ? 50 : 20
                }`,
              }}
              key={singleStatus}
              className={tw("px-3 py-2 cursor-pointer", isSelected && "px-8")}
            >
              <span className="inline-flex items-center gap-2 p-2 rounded-2xl">
                <Icon icon={icons[singleStatus]} />
                <span>{singleStatus}</span>
              </span>
            </div>
          );
        })}
      </Scroll>
      {order.status !== selectOne && (
        <EmptyComponent>
          <Line />
          <div className="p-2">
            <Button
              className="rounded-full"
              onClick={async () => {
                await setDoc(
                  [
                    "projects",
                    import.meta.env.VITE_PROJECT_ID,
                    "orders",
                    order.id,
                  ],
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
        </EmptyComponent>
      )}
    </Card>
  );
};
