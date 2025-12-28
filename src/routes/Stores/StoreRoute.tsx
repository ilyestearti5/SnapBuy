import { useParams } from "react-router";
import { useAsyncMemo, useDeviceResolution } from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "../../apis";
import {
  Card,
  CardWait,
  CircleTip,
  EmptyComponent,
  Line,
  Starts,
  Translate,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { Link } from "react-router-dom";
import { mapAsync, randomizeArray, tw } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { ClientProductRender } from "../Clients/ClientProductRender";
import { getPrice } from "../../utils";
export const StoreRoute = () => {
  const storeId = useParams<{ storeId: string }>().storeId;
  const store = useAsyncMemo(async () => {
    if (!storeId) return null;
    return await snapbuyApi.store.get(storeId);
  }, [storeId]);
  const collections = useAsyncMemo(async () => {
    return snapbuyApi.collections.getAll(storeId);
  }, [storeId]);
  const products = useAsyncMemo(async () => {
    return await snapbuyApi.product.getProductsOf(storeId);
  }, [storeId]);
  const files = useAsyncMemo(async () => {
    if (!products) return undefined;
    const list = randomizeArray(
      products
        ?.filter((prod) => prod.available)
        .map((product) => product.files?.map((file) => ({ ...product, file })))
        .flat()
    );
    return list;
  }, [storeId, products]);
  const { isMobile, isDesktop, isTablet } = useDeviceResolution();
  const length = useMemo(() => {
    return isTablet ? 30 : isMobile ? 20 : 40;
  }, [isMobile, isTablet, isDesktop]);
  const filterdFiles = useMemo(() => {
    if (!files) return undefined;
    var length = isTablet ? 30 : isMobile ? 20 : 40;
    return {
      files: files.slice(0, length),
      length: files.slice(length + 1),
    };
  }, [files, length]);
  const promotedProducts = useMemo(() => {
    return products?.filter((prod) => prod.type === "multiple");
  }, [products]);
  const packOffer = useAsyncMemo(async () => {
    return snapbuyApi.getSinglePack(storeId);
  }, [storeId]);
  const totalPrice = useAsyncMemo(async () => {
    const prods = await mapAsync(
      packOffer?.data?.products || [],
      ({ prodId }) => {
        return snapbuyApi.product.get(prodId);
      }
    );
    return prods.reduce((acc, prod) => acc + (getPrice(prod).total || 0), 0);
  }, [packOffer?.data?.products]);
  const percentage = useMemo(() => {
    const price = packOffer?.data?.price || 0;
    const totalPriceCopy = totalPrice || 0;
    return totalPriceCopy > 0
      ? Math.round(((totalPriceCopy - price) / totalPriceCopy) * 100)
      : 0;
  }, [packOffer?.data?.price, totalPrice]);
  return (
    <EmptyComponent>
      {packOffer && (
        <Link
          to={`/pack/${packOffer.data.id}`}
          className="block bg-red-600 p-3 w-full font-bold text-white text-center underline uppercase"
        >
          <Translate content="offer" /> {percentage}%
        </Link>
      )}
      <div className="flex flex-col justify-center items-center gap-3 p-4">
        <div className="border border-[--biqpod-borders] border-solid rounded-full w-[100px] h-[100px] overflow-hidden">
          {store && (
            <EmptyComponent>
              {store.photo && (
                <img
                  src={store?.photo}
                  className="w-full h-full object-cover"
                />
              )}
              {!store.photo && (
                <div className="flex justify-center items-center w-full h-full">
                  <span className="font-extrabold text-5xl uppercase">
                    {store?.name?.charAt(0) || "S"}
                  </span>
                </div>
              )}
            </EmptyComponent>
          )}
          {!store && <CardWait className="w-full h-full" />}
        </div>
        <span className="text-3xl">{store?.name}</span>
        <span className="flex items-center gap-3">
          <Starts
            onSubmit={(value) => {
              snapbuyApi.submitStore(storeId, value);
            }}
            length={5}
            starts={2}
          />
          {/* <span className="text-[--biqpod-gray-opacity-2]">4K+</span> */}
        </span>
      </div>
      <Line />
      <div className="bg-[--biqpod-primary-background] p-4 font-bold text-[--biqpod-primary] text-4xl text-center capitalize">
        <Translate content="explore products" />
      </div>
      <Line />
      {filterdFiles && (
        <div
          className={tw(
            "relative grid object-cover items-center bg-[--biqpod-primary-background]",
            isDesktop && "grid-cols-8",
            isTablet && "grid-cols-6",
            isMobile && "grid-cols-4"
          )}
        >
          {filterdFiles?.files.map((product, index) => (
            <Link
              key={index}
              className="group relative hover:bg-[--biqpod-secondary-background] transition-colors duration-300"
              to={`/product/${product?.id}`}
            >
              <img
                draggable={false}
                src={product?.file.url}
                alt={`logo-${index}`}
              />
              <div className="bottom-0 absolute inset-x-0 opacity-0 group-hover:opacity-100 backdrop-blur-sm p-2 bg-[--biqpod-text-color] text-[--biqpod-primary-background] text-xs text-center transition-opacity pointer-events-none">
                {product?.name}
              </div>
            </Link>
          ))}
        </div>
      )}
      {!filterdFiles && (
        <div className="flex justify-center items-center p-4">
          <CardWait className="w-full h-[200px]" />
        </div>
      )}
      {!!filterdFiles?.length.length && (
        <Link
          to={`/client/stores/${storeId}/products`}
          className="flex justify-center items-center bg-[--biqpod-primary] p-3 font-bold text-[--biqpod-primary-content] text-2xl capitalize"
        >
          <Translate content="view all products" /> (
          {filterdFiles?.length.length}+)
        </Link>
      )}
      <Line />
      {!!collections?.length && (
        <EmptyComponent>
          <div className="bg-[--biqpod-primary-background] p-4 font-bold text-[--biqpod-primary] text-4xl text-center capitalize">
            <Translate content="explore collections" />
          </div>
          <Line />
          <div className="flex flex-wrap items-center gap-2 p-2 overflow-x-auto">
            {collections?.map((collection) => {
              return (
                <Card
                  key={collection.id}
                  className="max-md:max-w-[calc(100%/3-8px)] md:max-w-[calc(100%/4-8px)] lg:max-w-[calc(100%/5-8px)] overflow-hidden"
                >
                  <Link to={`/collection/${collection.id}`}>
                    <div className="p-2">
                      <img
                        src={collection.photo}
                        className="border border-[--biqpod-borders] border-solid rounded-xl"
                        draggable={false}
                      />
                    </div>
                    <Line />
                    <div className="flex justify-between items-center gap-1 p-2">
                      <p className="text-xl">{collection.name}</p>
                      <div>
                        <CircleTip icon={allIcons.solid.faChevronRight} />
                      </div>
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
          <Line />
        </EmptyComponent>
      )}
      {!!promotedProducts?.length && (
        <EmptyComponent>
          <div className="bg-[--biqpod-primary-background] p-4 font-bold text-[--biqpod-primary] text-4xl text-center capitalize">
            <Translate content="explore products" />
          </div>
          <Line />
          <div className="flex flex-wrap gap-2 p-2">
            {promotedProducts?.map((product, index) => {
              return (
                <ClientProductRender
                  product={product}
                  key={product.id}
                  index={index}
                />
              );
            })}
          </div>
          <Line />
        </EmptyComponent>
      )}
    </EmptyComponent>
  );
};
