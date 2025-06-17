import { allIcons, and, orderBy, where } from "@biqpod/app/ui/apis";
import { filterFuzzySearch, mergeArray, range, tw } from "@biqpod/app/ui/utils";
import {
  Button,
  Card,
  CardWait,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  PositionView,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  execAction,
  getFieldValue,
  getPosition,
  isLoading,
  isSuccess,
  setTemp,
  showPopup,
  useAction,
  useCopyState,
  useMemoDelay,
  useResolution,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo } from "react";
import { getDocs } from "./server";
import { useFullCart, useSearchParams } from "./AddProductToCart";
import { CartPopup } from "./CartPopup";
import { ClientProductRender } from "./ClientProductRender";
import { useParams } from "react-router";
import { FixedSizeList as List } from "react-window";
import React from "react";
const PAGE_SIZE = 400;
export const ClientProducts = () => {
  const storeId = useParams<{ uid: string }>().uid;
  const products = useCopyState<SnapBuy.Product[]>([]); // Replace with your actual product data
  const lastDoc = useCopyState<SnapBuy.Product | null>(null);
  const hasMore = useCopyState(false);
  const action = useAction(
    "fetch-store-products",
    async (next = false) => {
      if (!storeId) {
        return;
      }
      const newProducts = await getDocs<SnapBuy.Product>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products"],
        {
          where: and(
            where("available", "==", true),
            where("storeId", "==", storeId)
          ),
          orders: mergeArray(orderBy("name", "asc")),
          limit: PAGE_SIZE,
          startAt: lastDoc.get?.name && mergeArray(lastDoc.get?.name),
        }
      );
      if (!newProducts) {
        return;
      }
      var list = newProducts.map((order) => ({ ...order.data, id: order.id }));
      products.set((prev) => (next ? [...prev, ...list] : list));
      const lastDocRef = newProducts.at(-1)?.data;
      lastDoc.set(lastDocRef ? lastDocRef : null);
      hasMore.set(newProducts.length === PAGE_SIZE);
    },
    [storeId, lastDoc.get]
  );
  const success = isSuccess(action);
  useEffect(() => {
    if (storeId) {
      execAction("fetch-store-products");
    }
  }, [storeId]);
  const search = getFieldValue("search-prod");
  const [_, filterProducts] = useMemoDelay(
    () => {
      if (!search) {
        return products.get;
      }
      return filterFuzzySearch(products.get, search, "name");
    },
    [products.get, search],
    200
  );
  const cart = useFullCart(storeId);
  const loading = isLoading(action);
  useEffect(() => {
    setTemp("client-store-id", storeId);
  }, [storeId]);
  // useEffect(() => {
  //   if (user?.uid && storeUser?.uid) {
  //     snapbuyApi.isFollowing(storeUser.uid).then((isYes) => {
  //       if (!isYes) {
  //         showPopup(
  //           <Card
  //             style={{
  //               ...colorMerge({
  //                 boxShadow: handelShadowColor([
  //                   {
  //                     colorId: "shadow.color",
  //                     x: 0,
  //                     y: 0,
  //                     blur: 30,
  //                     size: 10,
  //                   },
  //                 ]),
  //               }),
  //             }}
  //             className="w-1/2 min-w-[200px] max-w-[300px]"
  //           >
  //             <div className="flex justify-between items-center p-2">
  //               <span className="font-bold text-2xl capitalize">
  //                 <Translate content="follow" />
  //               </span>
  //               <div>
  //                 <CircleTip
  //                   icon={allIcons.solid.faXmark}
  //                   onClick={() => {
  //                     closePopup();
  //                   }}
  //                 />
  //               </div>
  //             </div>
  //             <Line />
  //             <div className="flex flex-col justify-center items-center gap-2 p-2">
  //               <Image
  //                 className="w-[100px] h-[100px]"
  //                 src={storeUser.photo ?? undefined}
  //                 alt={<Icon icon={allIcons.solid.faUser} />}
  //               />
  //               <span>
  //                 {storeUser.firstname} {storeUser.lastname}
  //               </span>
  //             </div>
  //             <Line />
  //             <div className="p-2">
  //               <Button
  //                 className="rounded-full"
  //                 onClick={async () => {
  //                   closePopup();
  //                   await snapbuyApi.follow(storeUser?.uid!);
  //                 }}
  //               >
  //                 <Translate content="follow" />
  //               </Button>
  //             </div>
  //           </Card>,
  //           {
  //             type: "blur",
  //           }
  //         );
  //       }
  //     });
  //   }
  // }, [user?.uid, storeUser]);
  const position = getPosition("searching");
  const { height } = useResolution();
  const listHeight = useMemo(() => {
    const posHeight = position?.height || 0;
    const posTop = position?.top || 0;
    return height - posHeight - posTop;
  }, [position, height]);
  const { showPhoto } = useSearchParams();
  const listProds = useMemo(() => {
    const list: (SnapBuy.Product | number)[] = filterProducts
      ? [...filterProducts, ...range(PAGE_SIZE)]
      : range(PAGE_SIZE);
    return list;
  }, [filterProducts]);
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <PositionView positionId="searching">
        <div className="flex justify-between items-center gap-2 p-2">
          <div className="flex justify-center w-full">
            <Field
              className="rounded-2xl"
              placeholder="Search Product"
              inputName="search-prod"
            />
          </div>
        </div>
        <Line />
      </PositionView>
      <Scroll>
        {!!filterProducts?.length && (
          <List
            height={listHeight}
            itemCount={Math.ceil((listProds?.length || 0) / 2)}
            itemSize={showPhoto ? 320 : 180}
            width={"100%"}
            itemData={listProds}
            onItemsRendered={({ visibleStopIndex }) => {
              // If the user scrolls near the end, load more products
              if (
                hasMore.get &&
                !loading &&
                visibleStopIndex >=
                  Math.ceil((filterProducts?.length || 0) / 2) - 2
              ) {
                execAction("fetch-store-products", true);
              }
            }}
          >
            {({
              index,
              style,
              data,
            }: {
              index: number;
              style: React.CSSProperties;
              data: (SnapBuy.Product | number)[];
            }) => {
              const first = data?.at(index * 2);
              const second = data?.at(index * 2 + 1);
              return (
                <div style={style} className="flex items-center gap-2 p-2">
                  {typeof first == "object" && (
                    <ClientProductRender
                      index={index * 2}
                      product={first}
                      key={first.id}
                    />
                  )}
                  {typeof second == "object" && (
                    <ClientProductRender
                      index={index * 2 + 1}
                      product={second}
                      key={second.id}
                    />
                  )}
                  {typeof first == "number" && (
                    <CardWait className="rounded-xl w-[calc(50%-4px)] h-[150px]" />
                  )}
                  {typeof second == "number" && (
                    <CardWait className="rounded-xl w-[calc(50%-4px)] h-[150px]" />
                  )}
                </div>
              );
            }}
          </List>
        )}
        {hasMore.get && (
          <EmptyComponent>
            <Card className="justify-center items-center w-[calc(50%-4px)] h-[180px]">
              <CircleTip
                iconClassName={tw(loading && "animate-spin")}
                icon={
                  loading
                    ? allIcons.solid.faCircleNotch
                    : allIcons.solid.faChevronRight
                }
                onClick={() => {
                  execAction("fetch-store-products", true);
                }}
              />
            </Card>
          </EmptyComponent>
        )}
        <div className="h-[200px]" />
        {success && filterProducts?.length === 0 && (
          <div className="flex justify-center items-center w-full h-full">
            <Card>
              <div className="flex justify-center items-center p-2 h-full">
                <Icon
                  icon={allIcons.solid.faBoxOpen}
                  iconClassName="text-9xl text-[--biqpod-primary]"
                />
              </div>
              <Line />
              <div className="flex justify-center items-center p-4 h-full text-2xl capitalize">
                <Translate content="no products found" />
              </div>
            </Card>
          </div>
        )}
      </Scroll>
      {!!cart.length && (
        <EmptyComponent>
          <Line />
          <div className="p-2">
            <Button
              className="rounded-full"
              icon={allIcons.solid.faShoppingCart}
              onClick={() => {
                showPopup(<CartPopup storeId={storeId} />);
              }}
            >
              <Translate content="see cart" />
            </Button>
          </div>
        </EmptyComponent>
      )}
    </div>
  );
};
