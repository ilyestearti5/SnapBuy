import { allIcons, and, orderBy, where } from "@biqpod/app/ui/apis";
import { mergeArray, tw } from "@biqpod/app/ui/utils";
import {
  Button,
  Card,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Image,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  handelShadowColor,
  isLoading,
  isSuccess,
  showPopup,
  useAction,
  useAsyncMemo,
  useColorMerge,
  useCopyState,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo } from "react";
import { api } from "./apis";
import { getDoc, getDocs } from "./server";
import { useFullCart } from "./AddProductToCart";
import { CartPopup } from "./CartPopup";
import { ClientProductRender } from "./ClientProductRender";
import { fuzzyRankedSearch } from "./utils";
import { useParams } from "react-router";
import { Biqpod } from "@biqpod/app/ui/types";
var PAGE_SIZE = 20;
export const ClientProducts = () => {
  var uid = useParams<{ uid: string }>().uid;
  const user = useUser();
  const products = useCopyState<SnapBuy.Product[]>([]); // Replace with your actual product data
  var lastDoc = useCopyState<SnapBuy.Product | null>(null);
  const hasMore = useCopyState(false);
  const action = useAction(
    "fetch-user-products",
    async (next = false) => {
      if (!uid) {
        return;
      }
      const newProducts = await getDocs<SnapBuy.Product>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products"],
        {
          where: and(where("available", "==", true), where("uid", "==", uid)),
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
    [uid, lastDoc.get]
  );
  const success = isSuccess(action);
  useEffect(() => {
    if (uid) {
      execAction("fetch-user-products");
    }
  }, [uid]);
  const isFullWidth = useTemp<boolean>("isFullWidth");
  useEffect(() => {
    if (user?.uid) return api.onCategoryAndMarketChange(user?.uid);
  }, [user]);
  const search = getFieldValue("search-prod");
  const filterProducts = useMemo(() => {
    if (!search) {
      return products.get;
    }
    return fuzzyRankedSearch(search, products.get, "name");
  }, [products.get, search]);
  const cart = useFullCart(uid);
  const loading = isLoading(action);
  const storeUser = useAsyncMemo(async () => {
    return getDoc<Biqpod.Account.User>(["users", uid]);
  }, [uid]);
  const colorMerge = useColorMerge();
  useEffect(() => {
    if (user?.uid && storeUser?.uid) {
      api.isFollowing(storeUser.uid).then((isYes) => {
        if (!isYes) {
          showPopup(
            <Card
              style={{
                ...colorMerge({
                  boxShadow: handelShadowColor([
                    {
                      colorId: "shadow.color",
                      x: 0,
                      y: 0,
                      blur: 30,
                      size: 10,
                    },
                  ]),
                }),
              }}
              className="w-1/2 min-w-[200px] max-w-[300px]"
            >
              <div className="flex justify-between items-center p-2">
                <span className="font-bold text-2xl capitalize">
                  <Translate content="follow" />
                </span>
                <div>
                  <CircleTip
                    icon={allIcons.solid.faXmark}
                    onClick={() => {
                      closePopup();
                    }}
                  />
                </div>
              </div>
              <Line />
              <div className="flex flex-col justify-center items-center gap-2 p-2">
                <Image
                  className="w-[100px] h-[100px]"
                  src={storeUser.photo ?? undefined}
                  alt={<Icon icon={allIcons.solid.faUser} />}
                />
                <span>
                  {storeUser.firstname} {storeUser.lastname}
                </span>
              </div>
              <Line />
              <div className="p-2">
                <Button
                  className="rounded-full"
                  onClick={async () => {
                    closePopup();
                    await api.follow(storeUser?.uid!);
                  }}
                >
                  <Translate content="follow" />
                </Button>
              </div>
            </Card>,
            {
              type: "blur",
            }
          );
        }
      });
    }
  }, [user?.uid, storeUser]);
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
          {filterProducts.map((product) => {
            return <ClientProductRender product={product} key={product.id} />;
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
                  execAction("fetch-user-products", true);
                }}
              />
            </Card>
          )}
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
                showPopup(<CartPopup uid={uid} />);
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
