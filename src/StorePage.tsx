import { useParams } from "react-router";
import { useAsyncMemo, useDeviceResolution } from "@biqpod/app/ui/hooks";
import { snapbuyApi } from "./apis";
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
import { mapAsync, randomizeArray, range, tw } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { ClientProductRender } from "./ClientProductRender";
import { getPrice } from "./utils";
interface Category {
  id: string;
  name: string;
  photo?: string;
}
export const StorePage = () => {
  const storeId = useParams<{ storeId: string }>().storeId;
  const store = useAsyncMemo(async () => {
    if (!storeId) return null;
    return await snapbuyApi.getStore(storeId);
  }, [storeId]);
  const categorys: Category[] = [
    {
      photo:
        "https://n.nordstrommedia.com/it/66228ab0-91cb-4e71-9d0c-0231ecb76153.jpeg?h=368&w=240&dpr=2",
      id: "boy",
      name: "Boy",
    },
    {
      photo:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNWF2MLIH7_v7xLU1M2jD_G2i0BVL8TP7spA&s",
      id: "women",
      name: "Women",
    },
    {
      photo:
        "https://jozanekcz.s33.cdn-upgates.com/_cache/9/1/91437bbeb31ba40e1990fb7d8a3b9c71-divci-tricko-dlouhy-rukav-cervene.jpg",
      id: "girl",
      name: "Girl",
    },
    {
      photo:
        "https://hips.hearstapps.com/hmg-prod/images/mhl-tshirts-bugatchi-293-lead-669e776a9eee7.jpg?crop=0.561xw:0.871xh;0.216xw,0.0498xh&resize=1120:*",
      id: "man",
      name: "Man",
    },
    {
      photo:
        "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
      id: "nike",
      name: "Nike",
    },
  ];
  const products = useAsyncMemo(async () => {
    return await snapbuyApi.getProductsOf(storeId);
  }, [storeId]);
  const photos = useAsyncMemo(async () => {
    if (!products) return undefined;
    const list = randomizeArray(
      products
        ?.filter((prod) => prod.available)
        .map((product) =>
          product.photos?.map((photo) => ({ ...product, photo }))
        )
        .flat()
    );
    return list;
  }, [storeId, products]);
  const { isMobile, isDesktop, isTablet } = useDeviceResolution();
  const filterdPhotos = useMemo(() => {
    if (!photos) return undefined;
    var length = isTablet ? 11 : isMobile ? 5 : 14;
    return {
      photos: photos.slice(0, length),
      length: photos.slice(length + 1),
    };
  }, [photos, isMobile, isTablet, isDesktop]);
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
        return snapbuyApi.getProduct(prodId);
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
      <Line />
      <div>
        <div
          className={tw(
            "gap-4 relative grid p-4 rounded-xl",
            isDesktop && "grid-cols-5",
            isTablet && "grid-cols-4",
            isMobile && "grid-cols-2"
          )}
        >
          {filterdPhotos?.photos.map((product, index) => (
            <Link
              key={index}
              className="flex justify-center items-center bg-[--biqpod-gray-opacity] hover:shadow-md p-2 border rounded-lg transition"
              to={`/product/${product?.id}`}
            >
              <img
                draggable={false}
                src={product?.photo}
                alt={`logo-${index}`}
                className="rounded-md max-h-16 object-contain"
              />
            </Link>
          ))}
          {!!filterdPhotos?.length.length && (
            <Link
              to={`/client/stores/${storeId}/products`}
              className="flex justify-center items-center bg-[--biqpod-gray-opacity] bg-[--biqpod-primary] hover:shadow-md p-4 border rounded-lg text-[--biqpod-primary-content] capitalize transition"
            >
              <Translate content="view all products" /> (
              {filterdPhotos.length.length}+)
            </Link>
          )}
          {!photos &&
            range(isTablet ? 11 : isMobile ? 5 : 14).map((index) => {
              return (
                <CardWait
                  key={index}
                  className="flex justify-center items-center bg-[--biqpod-gray-opacity] hover:shadow-md p-4 border rounded-lg h-20 transition"
                />
              );
            })}
        </div>
      </div>
      <Line />
      <div className="flex flex-col justify-center items-center gap-3 p-4">
        <div className="border border-[--biqpod-borders] border-solid rounded-full w-[100px] h-[100px] overflow-hidden">
          <img
            src={
              store?.photo ||
              "https://cdn3d.iconscout.com/3d/premium/thumb/company-building-3d-icon-download-in-png-blend-fbx-gltf-file-formats--construction-apartment-pack-buildings-icons-6324777.png"
            }
            className="w-full h-full object-cover"
          />
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
          <span className="text-[--biqpod-gray-opacity-2]">4K+</span>
        </span>
      </div>
      <Line />
      {/* <div className="p-2">
            <Button></Button>
          </div> */}
      <div className="bg-[--biqpod-primary-background] p-4 font-bold text-[--biqpod-primary] text-4xl text-center capitalize">
        <Translate content="explore categories" />
      </div>
      <Line />
      <div className="flex flex-wrap items-center gap-2 p-2 overflow-x-auto">
        {categorys.map((category) => {
          return (
            <Card
              key={category.id}
              className="max-md:w-[calc(100%/3-8px)] md:w-[calc(100%/4-8px)] lg:w-[calc(100%/5-8px)] overflow-hidden"
            >
              <div className="p-2">
                <img
                  src={category.photo}
                  className="border border-[--biqpod-borders] border-solid rounded-xl"
                  draggable={false}
                />
              </div>
              <Line />
              <div className="flex justify-between items-center gap-1 p-2">
                <p className="text-xl">{category.name}</p>
                <div>
                  <CircleTip icon={allIcons.solid.faChevronRight} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Line />
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
