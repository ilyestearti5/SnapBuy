import { allIcons } from "biqpod/ui/apis";
import {
  Card,
  MultiScreenPage,
  EmptyComponent,
  CircleTip,
  Icon,
  Translate,
  Line,
  Button,
} from "biqpod/ui/components";
import {
  getTemp,
  useColorMerge,
  useCopyState,
  showPopup,
  showToast,
} from "biqpod/ui/hooks";
import { tw } from "biqpod/ui/utils";
import { useCartCount, removeCart, ProductPopup } from "./ProductPopup";
export interface ProductRenderProps {
  product: SnapBuy.Product;
}
export const ClientProductRender = ({ product }: ProductRenderProps) => {
  const isFullWidth = getTemp<boolean>("isFullWidth");
  const cartCount = useCartCount(product.id);
  const hasCart = cartCount > 0;
  const colorMerge = useColorMerge();
  const focused = useCopyState(0);
  const photos = product.photos || [];
  return (
    <Card
      key={product.id}
      className={tw(
        "w-[calc(50%-4px)] transition-[width] duration-700 overflow-hidden",
        isFullWidth && "w-full"
      )}
    >
      <div className="relative flex justify-center items-center w-full h-[200px] cursor-pointer">
        <MultiScreenPage
          pages={photos.map((photo) => {
            return (
              <div className="relative flex justify-center items-center h-full overflow-hidden cursor-pointer">
                <img
                  draggable="false"
                  src={photo}
                  className="absolute inset-0 opacity-20 blur-lg object-cover"
                />
                <img
                  draggable="false"
                  src={photo}
                  className="w-full h-full object-contain"
                />
              </div>
            );
          })}
          focused={focused.get}
        />
        {photos.length > 1 && (
          <EmptyComponent>
            <div className="top-1/2 left-2 absolute -translate-y-1/2 transform">
              <CircleTip
                icon={allIcons.solid.faChevronLeft}
                onClick={() => {
                  if (focused.get <= 0) {
                    focused.set(photos.length - 1);
                    return;
                  }
                  focused.set(focused.get - 1);
                }}
              />
            </div>
            <div className="top-1/2 right-2 absolute -translate-y-1/2 transform">
              <CircleTip
                icon={allIcons.solid.faChevronRight}
                onClick={() => {
                  if (focused.get >= photos.length - 1) {
                    focused.set(0);
                    return;
                  }
                  focused.set(focused.get + 1);
                }}
              />
            </div>
            <div className="bottom-2 left-1/2 absolute text-black -translate-x-1/2 transform">
              {focused.get + 1} / {photos.length}
            </div>
          </EmptyComponent>
        )}
        {photos.length === 0 && (
          <Icon iconClassName="text-6xl" icon={allIcons.solid.faImage} />
        )}
        {!!product.available && (
          <div className="top-0 right-0 absolute bg-[--biqpod-primary] px-3 py-1 rounded-es-2xl text-[--biqpod-primary-content] capitalize">
            <Translate content="available" />
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
      <div className="max-md:p-1 md:p-2 font-bold text-[--biqpod-success] max-md:text-lg text-2xl text-right">
        {product.price} DA
      </div>
      <Line />
      <div className="flex gap-2 p-2 max-md:p-1">
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
            className="max-md:p-[1.5px] rounded-2xl"
            icon={allIcons.solid.faTrash}
          >
            <Translate content="remove" />
          </Button>
        )}
        <Button
          onClick={() => {
            if (!product.available) {
              showToast("Product Not Available", "warning");
              return;
            }
            showPopup(<ProductPopup product={product} />);
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
