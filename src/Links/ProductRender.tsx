import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  EmptyComponent,
  CircleTip,
  Icon,
  Translate,
  Line,
  Button,
  Scroll,
  Key,
} from "@biqpod/app/ui/components";
import {
  getTemp,
  openMenu,
  showToast,
  showPopup,
  execAction,
  showBottomSheet,
  closeBottomSheet,
  setTemp,
  useCopyState,
  ColorIds,
  getFieldValue,
} from "@biqpod/app/ui/hooks";
import { mapAsync, tw } from "@biqpod/app/ui/utils";
import { snapbuyApi } from "../apis";
import { PostNewProduct } from "./NewProduct/NewProduct";
import { ImageSlider } from "./ImageSlider";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo } from "react";
import { colorIds } from "../utils";
import { BlockPicker as ColorPicker } from "react-color";
import { highlightMatch } from "../ClientProductRender";
export interface ProductRenderProps {
  product: SnapBuy.Product;
  index: number;
}
const sharSocialMedia = [
  {
    name: "Facebook",
    icon: allIcons.brands.faFacebook,
    link: "https://web.facebook.com/share_channel/?type=reshare&link={link}&app_id=87741124305&source_surface=external_reshare&display=popup&hashtag#",
  },
  {
    name: "Twitter",
    icon: allIcons.brands.faTwitter,
    link: "https://twitter.com/intent/tweet?url={link}",
  },
  {
    name: "LinkedIn",
    icon: allIcons.brands.faLinkedin,
    link: "https://www.linkedin.com/shareArticle?mini=true&url={link}",
  },
  {
    name: "WhatsApp",
    icon: allIcons.brands.faWhatsapp,
    link: "https://api.whatsapp.com/send?text={link}",
  },
  {
    name: "Telegram",
    icon: allIcons.brands.faTelegram,
    link: "https://t.me/share/url?url={link}",
  },
  {
    name: "Instagram",
    icon: allIcons.brands.faInstagram,
    link: "https://www.instagram.com/?url={link}",
  },
  {
    name: "Snapchat",
    icon: allIcons.brands.faSnapchatGhost,
    link: "https://snapchat.com/share?text={link}",
  },
  {
    name: "Pinterest",
    icon: allIcons.brands.faPinterest,
    link: "https://pinterest.com/pin/create/button/?url={link}",
  },
];
const ProductToolsBottomSheet = ({ product }: ProductRenderProps) => {
  const showCopyLayout = useCopyState(false);
  const selectedColorId = useCopyState<ColorIds | null>(null);
  const selectedColor = useCopyState<string | null>(null);
  const usedColor = useCopyState<Partial<Record<ColorIds, string>>>({});
  useEffect(() => {
    if (!showCopyLayout.get) {
      selectedColorId.set(null);
      selectedColor.set(null);
    }
  }, [showCopyLayout.get]);
  const uri = useMemo(() => {
    const uri = new URL(location.href);
    uri.pathname = "/product/" + product.id;
    Object.entries(usedColor.get).forEach(([colorId, color]) => {
      if (color) {
        uri.searchParams.set("color." + colorId, color);
      }
    });
    return uri;
  }, [usedColor.get]);
  return (
    <EmptyComponent>
      <div className="flex items-center gap-2 p-2">
        <CircleTip
          className={tw(
            "transition-transform",
            !showCopyLayout.get && "scale-0"
          )}
          icon={allIcons.solid.faArrowLeft}
          onClick={() => {
            showCopyLayout.set(false);
          }}
        />
        <h1 className="font-bold text-3xl uppercase">
          <Translate content="actions" />
        </h1>
      </div>
      <div className="relative">
        <Line />
        <div className="flex gap-2 p-2 overflow-x-auto">
          {sharSocialMedia.map(({ name, icon, link }) => {
            const u = link.replace("{link}", encodeURIComponent(uri.href));
            return (
              <div
                key={name}
                className="inline-flex justify-center items-center gap-2 bg-[--biqpod-primary-background] active:bg-[--biqpod-gray-opacity] border border-[--biqpod-borders] border-solid rounded-lg w-[50px] h-[50px] text-2xl cursor-pointer"
                onClick={() => {
                  window.open(u, "_blank");
                }}
              >
                <Icon icon={icon} />
              </div>
            );
          })}
        </div>
        <Line />
        {[
          {
            label: "Share",
            defaultIcon: allIcons.solid.faShare,
            async click() {
              await navigator.share({
                title: product.name,
                text: product.description || "",
                url: uri.href,
              });
            },
          },
          {
            label: "Link",
            defaultIcon: allIcons.regular.faCopy,
            click: async () => {
              showCopyLayout.set(true);
            },
          },
          {
            label: "Name",
            click: async () => {
              await navigator.clipboard.writeText(product.name);
              showToast("Name Copyed :)");
            },
            defaultIcon: allIcons.regular.faCopy,
          },
          {
            label: "Description",
            click: async () => {
              await navigator.clipboard.writeText(product.description || "");
              showToast("Description Copyed :)");
            },
            defaultIcon: allIcons.regular.faCopy,
          },
          {
            type: "separator",
          },
          {
            label: "Edit Product",
            click: () => {
              showPopup(<PostNewProduct product={product} />);
            },
            defaultIcon: allIcons.solid.faPen,
          },
          {
            label: "Delete Product",
            click: async () => {
              await snapbuyApi.deleteProduct(product.id);
              execAction("fetch-products");
              showToast("Product Deleted");
            },
            defaultIcon: allIcons.solid.faTrashCan,
          },
        ].map(({ label, type, click, defaultIcon }, index) => {
          if (type === "separator") {
            return <Line key={index} />;
          }
          return (
            <div
              key={index}
              className="flex items-center gap-6 hover:bg-[--biqpod-gray-opacity] p-3 max-md:text-lg md:text-xl capitalize cursor-pointer"
              onClick={async () => {
                label && !["Link"].includes(label) && closeBottomSheet();
                click?.();
              }}
            >
              <Icon
                icon={defaultIcon || allIcons.solid.faHiking}
                iconClassName={tw(!defaultIcon && "invisible")}
              />
              <span>
                <Translate content={label || ""} />
              </span>
            </div>
          );
        })}
        <Line />
        <div className="p-3">
          <Button
            onClick={() => {
              closeBottomSheet();
            }}
            className="bg-[--biqpod-gray-opacity] rounded-full w-full text-[--biqpod-text-color]"
          >
            <Translate content="cancel" />
          </Button>
        </div>
        <div
          className={tw(
            "absolute overflow-hidden flex flex-col bg-[--biqpod-primary-background] w-full inset-y-0 -right-full transition-[right] duration-300",
            showCopyLayout.get && "right-0"
          )}
        >
          <Line />
          <div className="flex items-stretch overflow-hidden">
            <Scroll>
              {colorIds.map((color) => {
                const normalizedColor = color.replace(".", " ");
                const selectedColor = usedColor.get[color] || null;
                return (
                  <div
                    onClick={() => {
                      selectedColorId.set(color);
                    }}
                    className="flex justify-between items-center active:bg-[--biqpod-gray-opacity] odd:bg-[--biqpod-secondary-background] max-md:p-2 md:p-3 cursor-pointer"
                  >
                    <h1 className="text-xl capitalize">{normalizedColor}</h1>
                    {selectedColor && (
                      <div
                        className="rounded-full w-[25px] h-[25px]"
                        style={{
                          backgroundColor: selectedColor,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </Scroll>
            <div className="bg-[--biqpod-borders] w-[1px] h-full" />
            <div className="w-full">
              <iframe
                className="w-full h-full"
                src={uri.href}
                title="Product Preview"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
          <Line />
          <div className="flex gap-2 p-2">
            <Button
              icon={allIcons.regular.faCopy}
              className="rounded-full"
              onClick={async () => {
                closeBottomSheet();
                await navigator.clipboard.writeText(uri.href);
              }}
            >
              <Translate content="copy & close" />
            </Button>
          </div>
          {selectedColorId.get && (
            <div className="absolute inset-0 flex justify-center items-center bg-[--biqpod-gray-opacity]">
              <Card className="w-1/2 overflow-hidden">
                <ColorPicker
                  color={selectedColor.get || "#ffffff"}
                  onChange={(color) => {
                    selectedColor.set(color.hex);
                  }}
                  styles={{
                    default: {
                      card: {
                        backgroundColor: "var(--biqpod-secondary-background)",
                        boxShadow: "none",
                        width: "100%",
                      },
                      input: {
                        backgroundColor: "var(--biqpod-field-background)",
                        color: "var(--biqpod-text-color)",
                      },
                    },
                  }}
                />
                <Line />
                <div className="flex justify-between items-center gap-2 p-2">
                  <Button
                    onClick={() => {
                      selectedColorId.set(null);
                      selectedColor.set(null);
                    }}
                    className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
                  >
                    <Translate content="cancel" />
                  </Button>
                  {selectedColor.get && (
                    <Button
                      onClick={() => {
                        if (selectedColorId.get === null) {
                          return;
                        }
                        const color = selectedColor.get;
                        if (color) {
                          usedColor.set({
                            ...usedColor.get,
                            [selectedColorId.get]: color,
                          });
                          showToast("Color saved!");
                        } else {
                          showToast("Please select a color first.");
                        }
                        selectedColorId.set(null);
                        selectedColor.set(null);
                      }}
                    >
                      <Translate content="set" />
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </EmptyComponent>
  );
};
let longPressTimer: NodeJS.Timeout | null = null;
export const ProductRender = ({ product, index }: ProductRenderProps) => {
  const photos = product.photos || [];
  const search = getFieldValue("producer-search-product");
  const prices = Array.from(product.multiple?.prices || []);
  const price = product.single?.price || 0;
  const isFullWidth = getTemp<boolean>("isFullWidth");
  const isPromotion = product.type === "multiple";
  const selectedProducts = getTemp<string[]>("selected-products");
  // Helper: check if any product is selected
  const anyProductSelected = !!selectedProducts?.length;
  const handleLongPressStart = useCallback(() => {
    longPressTimer = setTimeout(() => {
      setTemp("selected-products", [...(selectedProducts || []), product.id]);
    }, 500); // 500ms for long press
  }, []);
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, []);
  const isSelected = useMemo(() => {
    return selectedProducts?.includes(product.id);
  }, [selectedProducts]);
  // New: handle click to select if any product is already selected
  const handleClick = () => {
    if (anyProductSelected && !isSelected) {
      // If any product is selected, add this product to the selection
      setTemp("selected-products", [...(selectedProducts || []), product.id]);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={tw(
        "h-[300px] p-1 w-full transition-[width] duration-500",
        isFullWidth && "w-[calc(50%-4px)] "
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu({
          x: e.clientX,
          y: e.clientY,
          menu: [
            {
              label: "Paste New Photos",
              defaultIcon: allIcons.solid.faImage,
              click: async () => {
                const files = await navigator.clipboard.read();
                const blobs = await mapAsync(files, async (file) => {
                  const blob = await file.getType("image/png");
                  return blob;
                });
                await execAction("add-products", {
                  exists: {
                    id: product.id,
                    photos: [
                      ...product.photos,
                      ...blobs.map((blob) => URL.createObjectURL(blob)),
                    ],
                  },
                });
              },
            },
          ],
        });
      }}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchCancel={handleLongPressEnd}
      onClick={anyProductSelected ? handleClick : undefined} // <-- add click handler
    >
      <Card
        key={product.id}
        className={tw(
          "flex flex-col justify-between w-full h-full overflow-hidden",
          isSelected &&
            "outline outline-2 -outline-offset-2 outline-[--biqpod-primary] bg-[--biqpod-gray-opacity]"
        )}
      >
        <div className="relative flex justify-center items-center w-full h-[200px] overflow-hidden cursor-pointer">
          {!!photos.length && <ImageSlider photos={photos} />}
          {photos.length == 0 && (
            <div className="flex justify-center items-center w-full h-full">
              <Icon
                iconClassName="text-8xl text-[--biqpod-gray-opacity]"
                icon={allIcons.solid.faBoxOpen}
              />
            </div>
          )}
          {!!product.available && (
            <div className="top-0 right-0 absolute bg-[--biqpod-primary] px-3 py-1 rounded-es-2xl text-[--biqpod-primary-content] capitalize">
              <Translate content="available" />
            </div>
          )}
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
        <div className="p-2 max-md:p-1">
          {highlightMatch(product.name, search)}
        </div>
        <Line />
        <div className="flex justify-between items-center px-2 max-md:py-1 md:py-2">
          {!isPromotion && (
            <span className="font-bold text-[--biqpod-success] max-md:text-lg text-2xl">
              {price} DA
            </span>
          )}
          {isPromotion && (
            <div className="flex flex-wrap gap-2">
              {prices
                ?.sort((price1, price2) => {
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
          {!anyProductSelected && (
            <CircleTip
              icon={allIcons.solid.faEllipsisVertical}
              onClick={() => {
                showBottomSheet(
                  <ProductToolsBottomSheet index={index} product={product} />
                );
              }}
            />
          )}
        </div>
      </Card>
    </motion.div>
  );
};
