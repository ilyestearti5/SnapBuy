import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CircleTip,
  Line,
  Scroll,
  Icon,
  Translate,
  CardWait,
  Image,
} from "@biqpod/app/ui/components";
import { useAsyncMemo, closePopup } from "@biqpod/app/ui/hooks";
import { tw, range } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { snapbuyApi } from "../../apis";
export interface OrderView {
  order: SnapBuy.Order;
}
export const OrderView = ({ order }: OrderView) => {
  const time = new Date(order.createdAt!);
  const productsLengths = Object.keys(order.products || {}).length;
  const list = useAsyncMemo(async () => {
    return snapbuyApi.getOrderProducts(order.id);
  }, []);
  const total = useMemo(() => {
    return list?.reduce((acc, current) => {
      return acc + (current.price || 0) * (current.count || 0);
    }, 0);
  }, [list]);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:h-[80vh]">
      <div className="flex justify-between items-center p-2">
        <h1 className="md:text-xl text-2xl">{time.toLocaleString()}</h1>
        <div>
          <CircleTip
            onClick={() => {
              closePopup();
            }}
            icon={allIcons.solid.faXmark}
          />
        </div>
      </div>
      <Line />
      <Scroll>
        {list?.map((product) => {
          const photos = product.photos || [];
          const photo = photos.at(0);
          const total = (product.price || 0) * (product.count || 0);
          return (
            <div
              key={product.id}
              className="odd:bg-[--biqpod-primary-background] mx-3 my-1 rounded-xl"
            >
              <div className="flex items-center gap-4 p-2 h-[120px]">
                <div>
                  <Image
                    src={photo}
                    className="bg-[--biqpod-gray-opacity] rounded-2xl w-[60px] h-[60px] cursor-pointer"
                    alt={<Icon icon={allIcons.solid.faImage} />}
                    onClick={() => {
                      // show image gareile
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <p>{product.name}</p>
                  <div
                    className={tw(
                      "flex justify-between items-center  bg-[--biqpod-gray-opacity] px-4 py-1 rounded-xl"
                    )}
                  >
                    <span className="font-bold text-[--biqpod-success] text-right">
                      {product.price}DA
                    </span>
                    <div className="bg-[--biqpod-secondary-background] px-2 rounded-md">
                      {product.count}
                    </div>
                    <span className="font-bold text-[--biqpod-success] text-right">
                      {total}DA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {list?.length === 0 && (
          <div className="flex flex-col justify-center items-center gap-3 p-5 h-full">
            <Icon iconClassName="text-8xl" icon={allIcons.solid.faStore} />
            <span>
              <Translate content="Empty Order !" />
            </span>
          </div>
        )}
        {!list &&
          range(productsLengths).map((index) => {
            return (
              <div
                className="odd:bg-[--biqpod-primary-background] mx-3 my-1 rounded-xl h-[120px]"
                key={index}
              >
                <CardWait className="rounded-2xl w-full" />
              </div>
            );
          })}
      </Scroll>
      <Line />
      <div className="flex justify-center items-center gap-1 p-4 text-xl">
        <span>Total :</span>
        {!!list && (
          <span className="font-bold text-[--biqpod-success]">
            {order.totalPrice || total}DA
          </span>
        )}
        {!list && (
          <CardWait className="inline-block rounded-full w-[100px] h-[20px]" />
        )}
      </div>
    </Card>
  );
};
