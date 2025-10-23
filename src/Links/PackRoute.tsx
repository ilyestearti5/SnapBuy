import {
  AsyncComponent,
  Button,
  Card,
  CardWait,
  CircleTip,
  EmptyComponent,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { showToast, useAsyncMemo } from "@biqpod/app/ui/hooks";
import { useParams } from "react-router";
import { snapbuyApi } from "../apis";
import { ImageSlider } from "./ImageSlider";
import { allIcons } from "@biqpod/app/ui/apis";
import { mapAsync } from "@biqpod/app/ui/utils";
import { getPrice } from "../utils";
import { useMemo } from "react";

export const PackRoute = () => {
  const packId = useParams<{ packId: string }>().packId;
  const pack = useAsyncMemo(async () => {
    return await snapbuyApi.packs.get(packId);
  }, [packId]);

  const totalPrice = useAsyncMemo(async () => {
    const prods = await mapAsync(pack?.products || [], ({ prodId }) => {
      return snapbuyApi.product.get(prodId);
    });
    return prods.reduce((acc, prod) => acc + (getPrice(prod).total || 0), 0);
  }, [pack?.products]);

  const offerPercent = useMemo(() => {
    const price = pack?.price || 0;
    const totalPriceCopy = totalPrice || 0;
    return totalPriceCopy > 0
      ? Math.round(((totalPriceCopy - price) / totalPriceCopy) * 100)
      : 0;
  }, [pack?.price, totalPrice]);

  return (
    <EmptyComponent>
      {pack && (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
          <Scroll>
            <div className="top-0 z-10 sticky bg-[--biqpod-primary-background]">
              <div className="flex justify-center p-4 rounded-ee-3xl rounded-es-3xl">
                <h1 className="inline-flex items-center gap-1 font-bold max-md:text-2xl md:text-3xl">
                  <span className="text-green-600">{pack.price}DA </span>{" "}
                  <sub className="text-[--biqpod-gray-opacity-2] line-through">
                    {totalPrice}DA
                  </sub>
                </h1>
                <div className="right-1 bottom-1 absolute flex items-center gap-1 bg-red-600 px-2 py-1 rounded-full text-white">
                  <span>- {offerPercent}%</span>
                  <Icon icon={allIcons.solid.faTag} />
                </div>
              </div>
              <Line />
            </div>
            <div className="flex flex-wrap gap-2 p-2 w-full">
              {pack.products?.map((prod) => {
                return (
                  <AsyncComponent
                    key={prod.prodId}
                    deps={[prod]}
                    render={async () => {
                      const product = await snapbuyApi.product.get(prod.prodId);
                      const photos = product?.photos || [];
                      const price = getPrice(product);
                      return (
                        <Card className="max-md:w-full md:w-[calc(50%-4px)] overflow-hidden">
                          <div className="flex justify-between items-center p-2">
                            <h1 className="text-xl">{product?.name}</h1>
                          </div>
                          <Line />
                          <div className="h-[200px]">
                            <ImageSlider photos={photos} />
                          </div>
                          <Line />
                          <div className="flex justify-between items-center p-2">
                            <span>{price.total}DA</span>
                            <CircleTip className="bg-[--biqpod-gray-opacity] font-bold text-xl">
                              {prod.count}
                            </CircleTip>
                          </div>
                        </Card>
                      );
                    }}
                    loading={<CardWait className="w-full h-[400px]" />}
                  />
                );
              })}
            </div>
          </Scroll>
          <Line />
          <div className="p-2">
            <Button
              onClick={() => {
                showToast("This feature is not implemented yet", "warning", {
                  id: "not-implemented",
                });
              }}
              className="rounded-full"
              rightIcon={allIcons.solid.faArrowRight}
            >
              <Translate content="order now" />
            </Button>
          </div>
        </div>
      )}
      {!pack && <CardWait className="w-full h-full" />}
    </EmptyComponent>
  );
};
