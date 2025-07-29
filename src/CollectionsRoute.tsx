import {
  AsyncComponent,
  Button,
  CardWait,
  EmptyComponent,
  Line,
  PositionView,
  Translate,
} from "@biqpod/app/ui/components";
import { getPosition, showPopup, useAsyncMemo } from "@biqpod/app/ui/hooks";
import { useParams } from "react-router";
import { snapbuyApi } from "./apis";
import { ClientProductRender } from "./ClientProductRender";
import { useFullCart } from "./AddProductToCart";
import { tw } from "@biqpod/app/ui/utils";
import { allIcons } from "@biqpod/app/ui/apis";
import { CartPopup } from "./CartPopup";
import { ImageSlider } from "./Links/ImageSlider";

export const CollectionsRoute = () => {
  const collectionId = useParams<{ collectionId: string }>().collectionId;
  const collection = useAsyncMemo(async () => {
    if (!collectionId) return null;
    return await snapbuyApi.getCollection(collectionId);
  }, [collectionId]);

  const cart = useFullCart(collection?.storeId);

  const height = getPosition("click-see-cart")?.height || 0;

  return (
    <EmptyComponent>
      {!collection && <CardWait className="w-full h-full" />}
      {collection && (
        <EmptyComponent>
          {collection.photo && (
            <EmptyComponent>
              <div className="overflow-hidden h-[50vh] w-full">
                <ImageSlider photos={[collection.photo]} />
              </div>
              <Line />
            </EmptyComponent>
          )}
          <div className="sticky top-0 z-10 bg-[--biqpod-primary-background]">
            <h1 className="text-3xl p-3 text-center text-[--biqpod-primary] font-bold bg-[--biqpod-primary-background]">
              {collection.name}
            </h1>
            <Line />
          </div>
          <div className="flex flex-wrap gap-2 p-2">
            {collection.products?.map((prodId, index) => {
              return (
                <AsyncComponent
                  key={prodId}
                  deps={[prodId, index]}
                  render={async () => {
                    const product = await snapbuyApi.getProduct(prodId);
                    if (!product) return <EmptyComponent />;
                    return (
                      <ClientProductRender product={product} index={index} />
                    );
                  }}
                />
              );
            })}
          </div>
          <div style={{ height: `${height}px` }} />
          <PositionView
            positionId="click-see-cart"
            className={tw(
              "absolute bottom-0 inset-x-0 bg-[--biqpod-primary-background] transition-[bottom] duration-300",
              !cart.length && "bottom-[-200px]"
            )}
          >
            <Line />
            <div className="p-2">
              <Button
                className="rounded-full"
                icon={allIcons.solid.faShoppingCart}
                onClick={() => {
                  showPopup(<CartPopup storeId={collection.storeId!} />);
                }}
              >
                <Translate content="see cart" />
              </Button>
            </div>
          </PositionView>
        </EmptyComponent>
      )}
    </EmptyComponent>
  );
};
