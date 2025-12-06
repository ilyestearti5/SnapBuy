import {
  Card,
  CardHeaderForPopup,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { Biqpod } from "@biqpod/app/ui/types";
import { snapbuyApi } from "../apis";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { allIcons } from "@biqpod/app/ui/apis";

interface OrdersOfCouponProps {
  coupon: Biqpod.Snapbuy.Coupon;
}
export const OrdersOfCoupon = ({ coupon }: OrdersOfCouponProps) => {
  const orders = useAsyncMemo(async () => {
    if (!coupon.id) return [];
    return snapbuyApi.coupon.getOrders(coupon.id);
  }, [coupon.id]);
  return (
    <Card>
      <CardHeaderForPopup title="Orders of Coupon" />
      <Line />
      <div className="p-2">
        <Field
          inputName="search-order-in-coupon"
          placeholder="Search For Order"
          className="rounded-xl"
        />
      </div>
      <Line />
      <Scroll>
        {!orders?.length && (
          <div>
            <div className="flex justify-center items-center p-5 text-6xl">
              <Icon
                icon={allIcons.solid.faCircleXmark}
                className="text-[--biqpod-gray-opacity-2]"
              />
            </div>
            <Line />
            <div className="p-2">
              <p className="text-[--biqpod-gray-opacity-2] text-center">
                <Translate content="No orders found for this coupon." />
              </p>
            </div>
          </div>
        )}
        {orders?.map((order) => {
          return (
            <div
              className="odd:bg-[--biqpod-primary-background] p-2"
              key={order.id}
            >
              {order.id}
            </div>
          );
        })}
      </Scroll>
    </Card>
  );
};
