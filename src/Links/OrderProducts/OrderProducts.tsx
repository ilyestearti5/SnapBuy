import { allIcons } from "@biqpod/app/ui/apis";
import { Card, CircleTip, Line } from "@biqpod/app/ui/components";
import { Biqpod } from "@biqpod/app/ui/types";
interface OrderProductsProps {
  order: Biqpod.Snapbuy.Order;
}
export const OrderProducts = ({ order }: OrderProductsProps) => {
  return (
    <Card className="max-md:rounded-none max-md:w-full max-md:h-full">
      <div className="p-2">
        <div>
          <span className="text-2xl">{order?.client?.firstname}</span>
        </div>
        <div>
          <CircleTip icon={allIcons.solid.faClose} />
        </div>
      </div>
      <Line />
    </Card>
  );
};
