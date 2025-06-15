import { allIcons, and, orderBy, where } from "@biqpod/app/ui/apis";
import { filterFuzzySearch, mergeArray, tw } from "@biqpod/app/ui/utils";
import {
  Button,
  Card,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  execAction,
  getFieldValue,
  isLoading,
  isSuccess,
  setTemp,
  showPopup,
  useAction,
  useCopyState,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo } from "react";
import { getDocs } from "./server";
import { useFullCart } from "./AddProductToCart";
import { CartPopup } from "./CartPopup";
import { ClientProductRender } from "./ClientProductRender";
import { useParams } from "react-router";
const PAGE_SIZE = 20;
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
  const isFullWidth = useTemp<boolean>("isFullWidth");
  const search = getFieldValue("search-prod");
  const filterProducts = useMemo(() => {
    if (!search) {
      return products.get;
    }
    return filterFuzzySearch(products.get, search, "name");
  }, [products.get, search]);
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
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-2">
        <div className="flex justify-center w-full">
          <Field
            className="rounded-2xl"
            placeholder="Search Product"
            inputName="search-prod"
          />
        </div>
        <div className="flex justify-center items-center gap-2">
          <div>
            <CircleTip
              icon={
                isFullWidth.get
                  ? allIcons.solid.faCompress
                  : allIcons.solid.faExpand
              }
              iconClassName={tw(
                "rotate-0 transition-transform duration-500",
                isFullWidth.get && "rotate-90"
              )}
              onClick={() => {
                isFullWidth.set(!isFullWidth.get);
              }}
            />
          </div>
        </div>
      </div>
      <Line />
      <Scroll>
        <div className="flex flex-wrap items-center gap-2 p-2">
          {filterProducts.map((product, index) => {
            return (
              <ClientProductRender
                index={index}
                product={product}
                key={product.id}
              />
            );
          })}
          {hasMore.get && (
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
          )}
          <div className="h-[200px]" />
        </div>
        {success && filterProducts.length === 0 && (
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
