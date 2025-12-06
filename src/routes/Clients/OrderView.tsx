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
import { Biqpod } from "@biqpod/app/ui/types";
export interface OrderView {
  order: Biqpod.Snapbuy.Order;
}
export const OrderView = ({ order }: OrderView) => {
  const time = new Date(order.createdAt!);
  const productsLengths = Object.keys(order.products || {}).length;
  const packsLengths = Object.keys(order.packs || {}).length;
  const productsList = useAsyncMemo(async () => {
    return snapbuyApi.order.getProducts(order.id);
  }, []);
  const packsList = useAsyncMemo(async () => {
    return snapbuyApi.getOrderPacks(order.id);
  }, []);
  const total = useMemo(() => {
    const productsTotal =
      productsList?.reduce((acc, current) => {
        return acc + (current.price || 0) * (current.count || 0);
      }, 0) || 0;
    const packsTotal =
      packsList?.reduce((acc, current) => {
        return acc + (current.price || 0) * (current.count || 0);
      }, 0) || 0;
    return productsTotal + packsTotal;
  }, [productsList, packsList]);
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
        {/* Products Section */}
        {productsList && productsList.length > 0 && (
          <div className="px-3 py-2">
            <h3 className="mb-2 font-bold text-lg">
              <Translate content="Products" />
            </h3>
          </div>
        )}
        {productsList?.map((product) => {
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
        {/* Packs Section */}
        {packsList && packsList.length > 0 && (
          <div className="px-3 py-2">
            <h3 className="mb-2 font-bold text-lg">
              <Translate content="Packs" />
            </h3>
          </div>
        )}
        {packsList?.map((pack) => {
          const total = (pack.price || 0) * (pack.count || 0);
          return (
            <div
              key={pack.id}
              className="odd:bg-[--biqpod-primary-background] mx-3 my-1 rounded-xl"
            >
              <div className="flex items-center gap-4 p-2 h-[120px]">
                <div>
                  <div className="flex justify-center items-center bg-[--biqpod-gray-opacity] rounded-2xl w-[60px] h-[60px]">
                    <Icon
                      icon={allIcons.solid.faBoxOpen}
                      className="text-2xl"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <p>{pack.name}</p>
                  <div
                    className={tw(
                      "flex justify-between items-center  bg-[--biqpod-gray-opacity] px-4 py-1 rounded-xl"
                    )}
                  >
                    <span className="font-bold text-[--biqpod-success] text-right">
                      {pack.price}DA
                    </span>
                    <div className="bg-[--biqpod-secondary-background] px-2 rounded-md">
                      {pack.count}
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
        {productsList?.length === 0 && packsList?.length === 0 && (
          <div className="flex flex-col justify-center items-center gap-3 p-5 h-full">
            <Icon className="text-8xl" icon={allIcons.solid.faStore} />
            <span>
              <Translate content="Empty Order !" />
            </span>
          </div>
        )}
        {!productsList &&
          !packsList &&
          range(productsLengths + packsLengths).map((index) => {
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
        {productsList !== undefined && packsList !== undefined && (
          <span className="font-bold text-[--biqpod-success]">
            {order.totalPrice || total}DA
          </span>
        )}
        {(productsList === undefined || packsList === undefined) && (
          <CardWait className="inline-block rounded-full w-[100px] h-[20px]" />
        )}
      </div>
    </Card>
  );
};
