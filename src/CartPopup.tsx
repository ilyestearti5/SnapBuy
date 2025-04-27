import { allIcons } from "biqpod/ui/apis";
import {
  AsyncComponent,
  Button,
  Card,
  CardWait,
  CircleLoading,
  CircleTip,
  Icon,
  Image,
  Line,
  Scroll,
  Translate,
} from "biqpod/ui/components";
import {
  closePopup,
  execAction,
  showBottomSheet,
  showPopup,
  useAction,
  useCopyState,
  useUser,
} from "biqpod/ui/hooks";
import { ProductPopup, useFullCart } from "./ProductPopup";
import { api } from "./apis";
import { ProdInfo } from "./ProdInfo";
import { setDoc } from "./server";
import { mapAsync } from "biqpod/ui/utils";
import { useEffect, useMemo } from "react";
interface ProductMore {
  product: SnapBuy.Product;
  count: number;
}
export const CartPopup = () => {
  const fullCart = useFullCart();
  const loading = useCopyState(false);
  const products = useCopyState<ProductMore[]>([]);
  const user = useUser();
  useAction(
    "get-products-of-cart",
    async () => {
      if (user?.uid) {
        const result = await mapAsync(fullCart, async (item) => {
          const product = await api.getProduct(item.prodId);
          return {
            product: product!,
            count: item.count,
          };
        });
        products.set(result);
      }
    },
    [fullCart, user]
  );

  useEffect(() => {
    execAction("get-products-of-cart");
  }, [fullCart, user]);

  const total = useMemo(() => {
    return products.get.reduce((acc, item) => {
      return acc + (item.product?.price || 0) * item.count;
    }, 0);
  }, [products.get]);

  return (
    <Card className="relative max-md:rounded-none w-1/2 max-md:w-full max-md:h-full md:max-md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between gap-2 p-3">
        <h1 className="font-bold text-3xl">Cart</h1>
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
      <Scroll>
        <div className="flex flex-col gap-2 p-3">
          {products.get.map(({ product, ...item }, index) => {
            const total = (product?.price || 0) * item.count;
            return (
              <Card key={index} className="overflow-hidden cursor-pointer">
                <div
                  onClick={() => {
                    showBottomSheet(<ProdInfo product={product!} />);
                  }}
                  className="flex justify-between items-center px-4 h-[50px] max-md"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Image
                      src={product?.photo}
                      className="w-[40px] h-[40px]"
                      alt={<Icon icon={allIcons.solid.faBox} />}
                    />
                    <span className="font-bold">{product?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[--biqpod-success] text-xl">
                      {product?.price.toFixed(2)}
                    </span>
                    <span>
                      <span className="inline-block bg-[--biqpod-primary-background] p-2 border border-[--biqpod-borders] border-solid rounded-lg">
                        ({item.count})
                      </span>
                    </span>
                    <span className="font-bold text-[--biqpod-success] text-xl">
                      {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Scroll>
      <Line />
      <div className="p-3">
        <Button
          className="rounded-full"
          onClick={async () => {
            loading.set(true);
            try {
              const products: Record<string, number> = {};
              fullCart.forEach((item) => {
                products[item.prodId] = item.count;
              });
              await api.createOrder({
                id: crypto.randomUUID(),
                status: "pending",
                clientId: "1",
                products,
              });
            } catch {}
            loading.set(false);
          }}
        >
          <Translate content="send" /> {total.toFixed(2)}DA
        </Button>
      </div>
      {loading.get && (
        <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
