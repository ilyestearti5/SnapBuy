import { allIcons } from "biqpod/ui/apis";
import {
  Button,
  Card,
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
  showToast,
  useAction,
  useCopyState,
  useUser,
} from "biqpod/ui/hooks";
import { addToCart, removeCart, useCart, useFullCart } from "./ProductPopup";
import { api, useCategorys, useCurrentClient } from "./apis";
import { mapAsync } from "biqpod/ui/utils";
import { useEffect, useMemo } from "react";
interface ProductMore {
  product: SnapBuy.Product;
  count: number;
}

// card line for load products easily
const CartLine = () => {
  const photo = record?.product?.photos?.at(0);
  return (
    <div
      key={record?.product.id!}
      className="flex justify-between items-center odd:bg-[--biqpod-primary-background] p-2"
    >
      <div className="flex items-center gap-2">
        <div>
          <Image
            className="bg-[--biqpod-gray-opacity] w-[40px] h-[40px]"
            src={photo}
            alt={<Icon icon={allIcons.solid.faImage} />}
          />
        </div>
        <div>{record?.product?.name}</div>
      </div>
      <div className="flex gap-1">
        <div className="flex items-center gap-2 bg-[--biqpod-gray-opacity] p-1 rounded-full">
          <CircleTip
            icon={allIcons.solid.faMinus}
            onClick={() => {
              if (record?.count && record.count > 1) {
                addToCart(record?.product.id!, record.count - 1);
              } else {
                addToCart(record?.product.id!, 0);
              }
            }}
          />
          <div>{record?.count}</div>
          <CircleTip
            icon={allIcons.solid.faPlus}
            onClick={() => {
              addToCart(record?.product.id!, (record?.count || 0) + 1);
            }}
          />
        </div>
        <div>
          <CircleTip
            icon={allIcons.solid.faTrashCan}
            onClick={() => {
              removeCart(record?.product.id!);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const CartPopup = () => {
  const carts = useCart();
  const fullCart = useFullCart();
  const list = useCopyState<ProductMore[]>([]);
  const user = useUser();
  const currentClient = useCurrentClient();
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
        list.set(result);
      }
    },
    [fullCart, user]
  );
  useEffect(() => {
    execAction("get-products-of-cart");
  }, [fullCart, user]);
  const total = useMemo(() => {
    return list.get.reduce((acc, item) => {
      return acc + (item.product?.price || 0) * item.count;
    }, 0);
  }, [list.get]);
  useAction(
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
      await api.createOrder({
        id,
        createdAt,
        status: "pending",
        products: carts,
      });
      showToast("Order Created");
    },
    [currentClient]
  );
  return (
    <Card className="relative max-md:rounded-none w-1/2 max-md:w-full max-md:h-full">
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
          {list.get?.map((record, index) => {
            return <CartLine key={index} />;
          })}
        </div>
        {list.get?.length === 0 && (
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
      {!!list.get?.length && (
        <EmptyComponent>
          <Line />
          <div className="flex justify-end items-center gap-1 p-2">
            <Button
              onClick={async () => {
                execAction("creater-order");
              }}
              className="w-full"
              icon={allIcons.solid.faCartPlus}
            >
              <Translate content="send" /> {total}
            </Button>
          </div>
        </EmptyComponent>
      )}
    </Card>
  );
};
