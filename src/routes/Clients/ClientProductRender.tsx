import React from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  Icon,
  Translate,
  Line,
  Button,
  CardHeaderForPopup,
  Key,
  CircleTip,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import {
  closeBottomSheet,
  openMenu,
  showBottomSheet,
  showPopup,
  showToast,
  useDeviceResolution,
  useUser,
  getFieldValue,
  showProfile,
  useAsyncMemo,
} from "@biqpod/app/ui/hooks";
import { mergeArray, tw } from "@biqpod/app/ui/utils";
import {
  useCartCount,
  removeCart,
  AddProductInCart,
  useSearchParams,
} from "./AddProductToCart";
import { ImageSlider } from "../../Links/ImageSlider";
import { MenuRecordProps } from "@biqpod/app/ui/types";
import { initPixels } from "../../Links/pixles";
import { snapbuyApi } from "../../apis";
export interface ProductRenderProps {
  product: SnapBuy.Product;
  index: number;
}
export function highlightMatch(text: string, search: string | undefined) {
  if (!search) return text;
  let searchIdx = 0;
  const searchLower = search.toLowerCase();
  return Array.from(text).map((char, i) => {
    if (
      searchIdx < searchLower.length &&
      char.toLowerCase() === searchLower[searchIdx]
    ) {
      searchIdx++;
      return (
        <span key={i} className="text-[--biqpod-primary] underline">
          {char}
        </span>
      );
    }
    return char;
  });
}
export const ClientProductRender = React.memo(
  ({ product }: ProductRenderProps) => {
    const storeId = product.storeId!;
    const cartCount = useCartCount(storeId, product.id!);
    const hasCart = cartCount > 0;
    const photos = Array.isArray(product.photos) ? product.photos : [];
    // pour promostion
    const isPromotion = product.type === "multiple";
    const prices = product.multiple?.prices || [];
    const price = product.single?.price || 0;
    const { isMobile } = useDeviceResolution();
    const user = useUser();
    const { showPhoto } = useSearchParams();
    const search = getFieldValue("search-prod");
    const store = useAsyncMemo(async () => {
      if (!product.storeId) return null;
      return snapbuyApi.getStore(product.storeId);
    }, []);
    const p = initPixels(store);
    return (
      <div className={tw("w-[calc(50%-4px)] transition-[width] duration-700")}>
        <Card key={product.id} className="w-full h-full overflow-hidden">
          {showPhoto && (
            <EmptyComponent>
              <div className="relative flex justify-center items-center w-full h-[150px] cursor-pointer">
                {photos.length > 0 ? (
                  <ImageSlider photos={photos} />
                ) : (
                  <div className="flex flex-col justify-center items-center text-[--biqpod-gray-opacity-2] w-full h-full">
                    <Icon
                      icon={allIcons.solid.faPhotoFilm}
                      iconClassName="text-5xl"
                    />
                    <span className="mt-2 text-sm">
                      <Translate content="no image available" />
                    </span>
                  </div>
                )}
                {isPromotion && (
                  <div className="inline-flex top-0 left-0 absolute items-center gap-2 bg-red-600 px-3 py-1 rounded-ee-2xl text-white capitalize">
                    <Icon icon={allIcons.solid.faTag} />
                    <span className="max-md:hidden">
                      <Translate content="promotion" />
                    </span>
                  </div>
                )}
              </div>
              <Line />
            </EmptyComponent>
          )}
          <div className="max-md:p-1 md:p-2">
            <span className="font-bold max-md:text-sm md:text-xl">
              {highlightMatch(product.name!, search)}
            </span>
          </div>
          <Line />
          <div className="max-md:p-1 md:p-2 text-right">
            {!isPromotion && (
              <span className="font-bold text-[--biqpod-success] max-md:text-lg md:text-2xl">
                {price} DA
              </span>
            )}
            {isPromotion && (
              <div className="flex flex-wrap gap-1">
                {prices
                  .sort((price1, price2) => {
                    return price1.quantity - price2.quantity;
                  })
                  .map((price, index) => {
                    return (
                      <Key key={index} className="max-md:text-md md:text-xl">
                        <span className="text-[--biqpod-success]">
                          {price.price} DA
                        </span>{" "}
                        <sub>
                          {"<"}
                          {price.quantity}
                        </sub>
                      </Key>
                    );
                  })}
              </div>
            )}
          </div>
          <Line />
          <div className="flex items-center gap-2 p-2 max-md:p-1">
            <div className="w-full">
              {hasCart && (
                <Button
                  onClick={() => {
                    removeCart(storeId, product.id!);
                  }}
                  className="bg-[--biqpod-gray-opacity] mb-2 max-md:p-[1.5px] rounded-2xl text-[--biqpod-text-color] max-md:text-xs"
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
                className="max-md:p-[1.5px] rounded-2xl max-md:text-xs truncate"
              >
                <Translate content={hasCart ? "modify" : "add"} />{" "}
                {hasCart && `(${cartCount})`}
              </Button>
            </div>
            <div>
              <CircleTip
                icon={allIcons.solid.faEllipsisV}
                onClick={({ clientX, clientY }) => {
                  const menu: MenuRecordProps[] = mergeArray(
                    showPhoto && {
                      label: "See Photo",
                      defaultIcon: allIcons.solid.faPhotoFilm,
                      click() {
                        showPopup(
                          <Card className="max-w-[90vw] max-h-[90vh] overflow-hidden">
                            <CardHeaderForPopup title={product.name} />
                            <Line />
                            <div className="relative flex justify-center items-center h-[400px] cursor-pointer">
                              <ImageSlider zoom photos={photos} />
                            </div>
                          </Card>
                        );
                      },
                    },
                    {
                      label: "Share",
                      defaultIcon: allIcons.solid.faShare,
                      click() {
                        const uri = `${location.origin}/product/${product.id}`;
                        if (navigator.share) {
                          navigator.share({
                            title: product.name,
                            text: `Check out this product: ${product.name}`,
                            url: uri,
                          });
                        } else {
                          // fallback: copy link
                          navigator.clipboard.writeText(uri);
                        }
                      },
                    },
                    {
                      label: "Copy Link",
                      defaultIcon: allIcons.regular.faCopy,
                      async click() {
                        const uri = `${location.origin}/product/${product.id}`;
                        await navigator.clipboard.writeText(uri);
                        showToast("Link copied to clipboard!");
                      },
                    },
                    user && {
                      label: "Add to Favorite",
                      defaultIcon: allIcons.solid.faHeart,
                      click() {
                        if (user) {
                          p?.favorite(product);
                          showPopup(
                            <Card className="max-md:w-[90vw]">
                              <CardHeaderForPopup title="Added to Favorite" />
                              <Line />
                              <div className="p-4 text-center">
                                <Icon
                                  icon={allIcons.solid.faHeart}
                                  iconClassName="mb-2 text-red-500 text-3xl"
                                />
                                <div>
                                  <Translate content="Product added to your favorites!" />
                                </div>
                              </div>
                            </Card>,
                            {
                              type: "blur",
                            }
                          );
                        } else {
                          showProfile();
                        }
                        // Implement your favorite logic here
                        // For now, just show a popup
                      },
                    }
                  );
                  if (isMobile) {
                    showBottomSheet(
                      <EmptyComponent>
                        <div className="p-2">
                          <h1 className="font-bold text-2xl uppercase">
                            <Translate content="actions" />
                          </h1>
                        </div>
                        <Line />
                        {menu.map((item, index) => {
                          if (item.type === "separator") {
                            return <Line key={index} />;
                          }
                          return (
                            <div
                              onClick={() => {
                                try {
                                  item.click?.();
                                } catch {}
                                closeBottomSheet();
                              }}
                              className="group flex justify-between items-center gap-2 hover:bg-[--biqpod-gray-opacity] active:bg-[--biqpod-gray-opacity-2] p-2 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <div>
                                  <Icon
                                    icon={
                                      item.defaultIcon ||
                                      allIcons.solid.faQuestion
                                    }
                                    iconClassName={tw(
                                      "invisible",
                                      item.defaultIcon && "visible"
                                    )}
                                  />
                                </div>
                                <span className="text-xl capitalize">
                                  <Translate content={item.label || ""} />
                                </span>
                              </div>
                              <div className="invisible group-hover:visible">
                                <CircleTip
                                  icon={allIcons.solid.faChevronRight}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </EmptyComponent>
                    );
                  } else {
                    openMenu({
                      x: clientX,
                      y: clientY,
                      menu,
                    });
                  }
                }}
              />
            </div>
          </div>
        </Card>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.product.id === nextProps.product.id &&
    prevProps.index === nextProps.index
);
