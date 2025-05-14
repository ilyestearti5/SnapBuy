import { allIcons } from "@biqpod/app/ui/apis";
import {
  EmptyComponent,
  Card,
  Icon,
  Line,
  CircleTip,
  CardWait,
  Image,
} from "@biqpod/app/ui/components";
import { useAsyncMemo, setTemp, openDialog } from "@biqpod/app/ui/hooks";
import { useMemo, useEffect } from "react";
import { api } from "./apis";
import { getPrice } from "./CartPopup";
import { FullCartResult, addToCart, removeCart } from "./AddProductToCart";
import { useParams } from "react-router";
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
  const [price, total] = useMemo(() => {
    var price = getPrice(product!, count);
    var total = price * count;
    return [price, total];
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
              <span className="font-bold text-[--biqpod-success]">{price}</span>
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
                      addToCart(product.uid!, product.id!, count - 1);
                    }
                  }}
                />
                <div>{count}</div>
                <CircleTip
                  icon={allIcons.solid.faPlus}
                  onClick={() => {
                    addToCart(product.uid!, product.id!, (count || 0) + 1);
                  }}
                />
              </div>
              <div>
                <CircleTip
                  icon={allIcons.solid.faTrashCan}
                  onClick={async () => {
                    const isChecked =
                      localStorage.getItem("checkboxChecked") === "true";
                    if (!isChecked) {
                      var { response, checkboxChecked } = await openDialog({
                        title: "Remove Product",
                        message:
                          "Are you sure you want to remove this product?",
                        buttons: ["Yes", "No"],
                        defaultId: 0,
                        checkboxLabel: "Don't ask again",
                        checkboxChecked: false,
                      });
                      localStorage.setItem(
                        "checkboxChecked",
                        checkboxChecked ? "true" : "false"
                      );
                      if (response) {
                        return;
                      }
                    }
                    removeCart(product.uid!, product.id!);
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
