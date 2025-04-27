import { allIcons, and, where } from "biqpod/ui/apis";
import { include, tw } from "biqpod/ui/utils";
import {
  Button,
  Card,
  CircleTip,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "biqpod/ui/components";
import {
  execAction,
  getFieldValue,
  getTemp,
  isSuccess,
  setTemp,
  showBottomSheet,
  showPopup,
  useAction,
  useColorMerge,
  useCopyState,
  useTemp,
  useUser,
} from "biqpod/ui/hooks";
import { useEffect, useMemo } from "react";
import { api, useCurrentClient } from "./apis";
import { getDocs } from "./server";
import {
  ProductPopup,
  removeCart,
  useCartCount,
  useFullCart,
} from "./ProductPopup";
import { CartPopup } from "./CartPopup";
import { ProdInfo } from "./ProdInfo";
interface ProductRenderProps {
  product: SnapBuy.Product;
}
const ClientProductRender = ({ product }: ProductRenderProps) => {
  const isFullWidth = getTemp<boolean>("isFullWidth");
  const cartCount = useCartCount(product.id);
  const hasCart = cartCount > 0;
  const colorMerge = useColorMerge();
  return (
    <Card
      key={product.id}
      className={tw(
        "w-[calc(50%-4px)] overflow-hidden",
        isFullWidth && "w-full"
      )}
    >
      <div
        onClick={() => {
          showBottomSheet(<ProdInfo product={product} />);
        }}
        className="relative flex justify-center items-center h-[200px] overflow-hidden cursor-pointer"
      >
        <img
          draggable="false"
          src={product.photo}
          className="absolute inset-0 opacity-20 blur-lg object-cover"
        />
        <img
          draggable="false"
          src={product.photo}
          className="w-full h-full object-contain"
        />
      </div>
      <Line />
      <div className="flex justify-between items-center p-2">
        <span className="font-bold text-xl">{product.name}</span>
        <span className="font-bold text-[--biqpod-success] text-2xl italic">
          {product.price}DA
        </span>
      </div>
      <Line />
      <div className="flex gap-2 p-2">
        {hasCart && (
          <Button
            style={{
              ...colorMerge("gray.opacity", {
                color: "text.color",
              }),
            }}
            onClick={() => {
              removeCart(product.id);
            }}
            className="rounded-full"
            icon={allIcons.solid.faTrash}
          >
            <Translate content="remove" />
          </Button>
        )}
        <Button
          onClick={() => {
            showPopup(<ProductPopup product={product} />);
          }}
          icon={allIcons.solid.faShoppingCart}
          className="rounded-full"
        >
          <Translate content={hasCart ? "modify" : "add"} />
        </Button>
      </div>
    </Card>
  );
};
export const ClientProducts = () => {
  const user = useUser();
  const products = useCopyState<SnapBuy.Product[]>([]); // Replace with your actual product data
  const currentClient = useCurrentClient();
  const action = useAction(
    "get-client-products",
    async () => {
      console.log({
        currentClient,
      });
      if (!currentClient) {
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
    if (currentClient) {
      execAction("get-client-products");
    }
  }, [currentClient]);
  const isFullWidth = useTemp("isFullWidth");
  useEffect(() => {
    if (user?.uid) return api.onCategoryAndMarketChange(user?.uid);
  }, [user]);
  const search = getFieldValue("search-prod");
  const filterProducts = useMemo(() => {
    return products.get.filter((product) => {
      const fullData = `${product.name}`;
      return include(fullData, search);
    });
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
          {!!cart.length && (
            <Button
              className="rounded-full"
              icon={allIcons.solid.faShoppingCart}
              onClick={() => {
                showPopup(<CartPopup />);
              }}
            >
              <Translate content="cart" />
            </Button>
          )}
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
        <div className="flex flex-wrap gap-2 p-2">
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
    </div>
  );
};
