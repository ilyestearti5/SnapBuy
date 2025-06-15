import {
  AsyncComponent,
  Button,
  Card,
  CardWait,
  CircleTip,
  EmptyComponent,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { showToast, useAsyncMemo } from "@biqpod/app/ui/hooks";
import { useParams } from "react-router";
import { snapbuyApi } from "../apis";
import { ImageSlider } from "./ImageSlider";
import { allIcons } from "@biqpod/app/ui/apis";

export const PackRoute = () => {
  const packId = useParams<{ packId: string }>().packId;
  const pack = useAsyncMemo(async () => {
    return await snapbuyApi.getPack(packId);
  }, [packId]);

  const store = useAsyncMemo(async () => {
    if (pack?.storeId) {
      return await snapbuyApi.getStore(pack.storeId);
    }
    return null;
  }, [pack?.storeId]);

  return (
    <EmptyComponent>
      {pack && (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
          <div className="flex justify-center bg-[--biqpod-primary-background] p-4">
            <h1 className="inline-flex items-center gap-1 font-bold text-[--biqpod-success] max-md:text-2xl md:text-3xl">
              <span>{pack.price}DA </span>
              {store ? (
                <span>
                  <span className="text-[--biqpod-text-color]">
                    +{" "}
                    <span className="italic">
                      ({store?.deliveryPrice || 0}DA)
                    </span>
                  </span>
                  <sub className="text-[--biqpod-gray-opacity-2] ml-1 font-light text-lg">
                    <Translate content="delivery fee" />
                  </sub>
                </span>
              ) : (
                <CardWait className="inline-block rounded-2xl w-[100px] h-[40px]" />
              )}
              {/* offer icon */}
            </h1>
          </div>
          <Line />
          <Scroll>
            <div className="flex flex-wrap gap-2 p-2 w-full">
              {pack.products?.map((prod) => {
                return (
                  <AsyncComponent
                    key={prod.prodId}
                    render={async () => {
                      const product = await snapbuyApi.getProduct(prod.prodId);
                      const photos = product?.photos || [];
                      return (
                        <Card className="max-md:w-full overflow-hidden">
                          <div className="flex justify-between items-center p-2">
                            <h1 className="text-xl">{product?.name}</h1>
                          </div>
                          <Line />
                          <div className="h-[200px]">
                            <ImageSlider photos={photos} />
                          </div>
                          <Line />
                          <div className="flex justify-center items-center p-2">
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
