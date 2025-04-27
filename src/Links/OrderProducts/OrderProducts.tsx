import { allIcons } from "biqpod/ui/apis";
import { Card, CircleTip, Line } from "biqpod/ui/components";
import { useAsyncMemo } from "biqpod/ui/hooks";
import { api } from "../../apis";
interface OrderProductsProps {
  order: SnapBuy.Order;
}
export const OrderProducts = ({ order }: OrderProductsProps) => {
  const client = useAsyncMemo(async () => {
    return await api.getClient(order.clientId);
  }, []);
  return (
    <Card className="max-md:rounded-none max-md:w-full max-md:h-full">
      <div className="p-2">
        <div>
          <span className="text-2xl">{client?.name}</span>
        </div>
        <div>
          <CircleTip icon={allIcons.solid.faClose} />
        </div>
      </div>
      <Line />
    </Card>
  );
};
