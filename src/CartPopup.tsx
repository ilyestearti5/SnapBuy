import { allIcons } from "biqpod/ui/apis";
import {
  Button,
  Card,
  CardWait,
  CircleLoading,
  CircleTip,
  EmptyComponent,
  Icon,
  Image,
  Line,
  Scroll,
  Translate,
} from "biqpod/ui/components";
import {
  closePopup,
  execAction,
  getTemp,
  isLoading,
  setTemp,
  showToast,
  useAction,
  useAsyncMemo,
} from "biqpod/ui/hooks";
import {
  deleteCart,
  FullCartResult,
  removeCart,
  useCart,
  useFullCart,
} from "./ProductPopup";
import { addToCart } from "./addToCart";
import { api, useCurrentClient } from "./apis";
import { useEffect, useMemo } from "react";
import { mapAsync } from "biqpod/ui/utils";
export interface ProductMore {
  product: SnapBuy.Product;
  count: number;
}
export interface CartLineProps {
  data: FullCartResult;
}
// card line for load products easily
export const CartLine = ({ data }: CartLineProps) => {
  const product = useAsyncMemo(async () => {
    var prod = await api.getProduct(data.prodId);
    return prod;
  }, []);
  const photo = product?.photos?.at(0);
  const count = data.count;
  const total = useMemo(() => {
    return data.count * (product?.price! || 0);
  }, [product]);
  useEffect(() => {
    setTemp("cart-count-prices." + data.prodId, total);
  }, [total]);
  return (
    <EmptyComponent>
      {product && (
        <Card className="odd:bg-[--biqpod-primary-background] mx-1 mt-1 h-[120px]">
          <div className="flex items-center gap-2 px-4 py-2">
            <div>
              <Image
                className="bg-[--biqpod-gray-opacity] w-[40px] h-[40px]"
                src={photo}
                alt={<Icon icon={allIcons.solid.faImage} />}
              />
            </div>
            <div>{product.name}</div>
          </div>
          <div>
            <Line />
          </div>
          <div className="flex justify-between items-center px-4 py-2">
            <span>
              (
              <span className="font-bold text-[--biqpod-success]">
                {product.price}
              </span>
              ) / (
              <span className="font-bold text-[--biqpod-success]">{total}</span>
              )
            </span>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2 bg-[--biqpod-gray-opacity] p-1 rounded-full">
                <CircleTip
                  icon={allIcons.solid.faMinus}
                  onClick={() => {
                    if (count && count > 1) {
                      addToCart(product.id!, count - 1);
                    } else {
                      addToCart(product.id!, 0);
                    }
                  }}
                />
                <div>{count}</div>
                <CircleTip
                  icon={allIcons.solid.faPlus}
                  onClick={() => {
                    addToCart(product.id!, (count || 0) + 1);
                  }}
                />
              </div>
              <div>
                <CircleTip
                  icon={allIcons.solid.faTrashCan}
                  onClick={() => {
                    removeCart(product.id!);
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}
      {!product && (
        <div className="flex justify-between items-center odd:bg-[--biqpod-primary-background] mx-1 mt-1 h-[120px]">
          <CardWait className="rounded-xl h-[80px]" />
        </div>
      )}
    </EmptyComponent>
  );
};
export const CartPopup = () => {
  const carts = useCart();
  const fullCart = useFullCart();
  const currentClient = useCurrentClient();
  const counts = getTemp<Record<string, number>>("cart-count-prices");
  const total = useMemo(() => {
    return Object.values(counts || {}).reduce((acc, total) => {
      return acc + total;
    }, 0);
  }, [counts]);
  const orderCreationAction = useAction(
    "creater-order",
    async () => {
      if (!carts) {
        showToast("Cart Is Empty!");
        return;
      }
      if (!currentClient) {
        showToast("Client Need To Be Signin", "warning");
        return;
      }
      const id = crypto.randomUUID();
      const createdAt = Date.now();
      var products: SnapBuy.Order["products"] = {};
      await mapAsync(Object.entries(carts), async ([prodId, value]) => {
        const prod = await api.getProduct(prodId);
        if (prod && products) {
          products[prodId] = {
            count: value?.count,
            price: prod.price,
          };
        }
      });
      await api.createOrder({
        id,
        createdAt,
        status: "pending",
        products,
      });
      closePopup();
      showToast("Order Created");
      deleteCart();
    },
    [currentClient]
  );
  const loading = isLoading(orderCreationAction);
  return (
    <Card className="relative max-md:rounded-none w-1/2 max-md:w-full max-md:h-full overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h1 className="font-bold text-3xl uppercase">
          <Translate content="cart" />
        </h1>
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
        <div className="flex flex-col gap-2">
          {fullCart?.map((record, index) => {
            return <CartLine key={index} data={record} />;
          })}
        </div>
        {fullCart.length === 0 && (
          <div className="flex flex-col justify-center items-center gap-y-5 text-[--biqpod-gray-opacity-2] p-3 h-full">
            <Icon
              icon={allIcons.solid.faCartShopping}
              iconClassName="text-7xl "
            />
            <div>
              <h1 className="text-4xl capitalize">
                <Translate content="empty cart" />
              </h1>
            </div>
          </div>
        )}
      </Scroll>
      {!!fullCart.length && (
        <EmptyComponent>
          <Line />
          <div className="flex justify-end items-center gap-1 p-2">
            <Button
              onClick={async () => {
                execAction("creater-order");
              }}
              className="bg-[--biqpod-success] w-full text-[--biqpod-primary-content]"
              icon={allIcons.solid.faCartPlus}
            >
              <Translate content="send" /> {total}DA
            </Button>
          </div>
        </EmptyComponent>
      )}
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center">
          <CircleLoading />
        </div>
      )}
    </Card>
  );
};
