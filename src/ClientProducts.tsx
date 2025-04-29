import { allIcons, and, where } from "biqpod/ui/apis";
import { include } from "biqpod/ui/utils";
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
} from "biqpod/ui/components";
import {
  execAction,
  getFieldValue,
  isSuccess,
  setTemp,
  showPopup,
  useAction,
  useCopyState,
  useTemp,
  useUser,
} from "biqpod/ui/hooks";
import { useEffect, useMemo } from "react";
import { api, useCurrentClient } from "./apis";
import { getDocs } from "./server";
import { useFullCart } from "./ProductPopup";
import { CartPopup } from "./CartPopup";
import { ClientProductRender } from "./ClientProductRender";
import { fuzzyRankedSearch } from "./utils";
export const ClientProducts = () => {
  const user = useUser();
  const products = useCopyState<SnapBuy.Product[]>([]); // Replace with your actual product data
  const currentClient = useCurrentClient();
  const action = useAction(
    "get-client-products",
    async () => {
      if (import.meta.env.DEV) {
        if (!user?.uid) return;
        const snapshot = await getDocs<SnapBuy.Product>([
          "projects",
          import.meta.env.VITE_PROJECT_ID,
          "products",
        ]);
        const productsData = snapshot?.map((doc) => ({
          ...doc.data,
          id: doc.id,
        }));
        setTemp("client-productsList", productsData);
        setTemp("client-productsRecived", true);
        productsData && products.set(productsData);
        return;
      }
      if (!currentClient?.access!.uid) {
        return;
      }
      if (!user?.uid) return;
      const snapshot = await getDocs<SnapBuy.Product>(
        ["projects", import.meta.env.VITE_PROJECT_ID, "products"],
        {
          where: and(where("uid", "==", currentClient.access!.uid)),
        }
      );
      const productsData = snapshot?.map((doc) => ({
        ...doc.data,
        id: doc.id,
      }));
      setTemp("client-productsList", productsData);
      setTemp("client-productsRecived", true);
      productsData && products.set(productsData);
    },
    [user, currentClient]
  );
  const success = isSuccess(action);
  useEffect(() => {
    execAction("get-client-products");
  }, [currentClient]);
  const isFullWidth = useTemp("isFullWidth");
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
  const cart = useFullCart();
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-2">
        <div className="flex justify-center w-full">
          <Field
            className="rounded-2xl w-1/2 focus:w-full transition-[width] duration-500"
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
          {success && filterProducts.length === 0 && (
            <div className="flex justify-center items-center w-full h-full">
              <Card>
                <div className="flex justify-center items-center p-2 h-full">
                  <Icon
                    icon={allIcons.solid.faBoxOpen}
                    iconClassName="text-8xl text-[--biqpod-primary]"
                  />
                </div>
                <Line />
                <div className="flex justify-center items-center p-2 h-full">
                  <Translate content="no products found" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </Scroll>
      {!!cart.length && (
        <EmptyComponent>
          <Line />
          <div className="p-2">
            <Button
              className="rounded-full"
              icon={allIcons.solid.faShoppingCart}
              onClick={() => {
                showPopup(<CartPopup />);
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
