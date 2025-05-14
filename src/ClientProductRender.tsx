import { allIcons } from "@biqpod/app/ui/apis";
import { Card, Icon, Translate, Line, Button } from "@biqpod/app/ui/components";
import { getTemp, showPopup } from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { useCartCount, removeCart, AddProductInCart } from "./AddProductToCart";
import { ImageSlider } from "./Links/ImageSlider";
export interface ProductRenderProps {
  product: SnapBuy.Product;
}
export const ClientProductRender = ({ product }: ProductRenderProps) => {
  const uid = product.uid!;
  const isFullWidth = getTemp<boolean>("isFullWidth");
  const cartCount = useCartCount(uid, product.id);
  const hasCart = cartCount > 0;
  const photos = product.photos || [];
  // pour promostion
  const isPromotion = product.type === "multiple";
  const prices = product.multiple?.prices || [];
  const price = product.single?.price || 0;
  return (
    <Card
      key={product.id}
      className={tw(
        "w-[calc(50%-4px)] transition-[width] duration-700 overflow-hidden",
        isFullWidth && "w-full"
      )}
    >
      <div className="relative flex justify-center items-center w-full h-[200px] cursor-pointer">
        <ImageSlider photos={photos} />
        {isPromotion && (
          <div className="inline-flex top-0 left-0 absolute items-center gap-2 bg-red-600 px-3 py-1 rounded-ee-2xl text-white capitalize">
            <Icon icon={allIcons.solid.faTag} />
            <span>
              <Translate content="promotion" />
            </span>
          </div>
        )}
      </div>
      <Line />
      <div className="max-md:p-1 md:p-2">
        <span className="font-bold max-md:text-sm md:text-xl">
          {product.name}
        </span>
      </div>
      <Line />
      <div className="max-md:p-1 md:p-2 text-right">
        {!isPromotion && (
          <span className="font-bold text-[--biqpod-success] max-md:text-lg text-2xl">
            {price} DA
          </span>
        )}
        {isPromotion && (
          <div className="flex flex-wrap gap-2">
            {prices
              .sort((price1, price2) => {
                return price1.quantity - price2.quantity;
              })
              .map((price, index) => {
                return (
                  <div
                    key={index}
                    className="bg-[--biqpod-gray-opacity] px-3 py-1 rounded-full max-md:text-md text-xl"
                  >
                    <span className="text-[--biqpod-success]">
                      {price.price} DA
                    </span>{" "}
                    <sub>
                      {"<"}
                      {price.quantity}
                    </sub>
                  </div>
                );
              })}
          </div>
        )}
      </div>
      <Line />
      <div className="flex gap-2 p-2 max-md:p-1">
        {hasCart && (
          <Button
            onClick={() => {
              removeCart(uid, product.id);
            }}
            className="bg-[--biqpod-gray-opacity] max-md:p-[1.5px] rounded-2xl text-[--biqpod-text-color]"
            icon={allIcons.solid.faTrash}
          >
            <Translate content="remove" />
          </Button>
        )}
        <Button
          onClick={() => {
            showPopup(<AddProductInCart product={product} />);
          }}
          icon={allIcons.solid.faShoppingCart}
          className="max-md:p-[1.5px] rounded-2xl"
        >
          <Translate content={hasCart ? "modify" : "add"} />{" "}
          {hasCart && `(${cartCount})`}
        </Button>
      </div>
    </Card>
  );
};
