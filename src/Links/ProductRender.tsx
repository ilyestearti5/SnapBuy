import { allIcons } from "@biqpod/app/ui/apis";
import {
  Mouseable,
  Card,
  EmptyComponent,
  CircleTip,
  Icon,
  Translate,
  Line,
  Button,
} from "@biqpod/app/ui/components";
import {
  getTemp,
  useCopyState,
  setTemp,
  openMenu,
  showToast,
  showPopup,
  execAction,
  showBottomSheet,
  closeBottomSheet,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { mapAsync, mergeObject, tw } from "@biqpod/app/ui/utils";
import { useMemo, useEffect } from "react";
import { snapbuyApi } from "../apis";
import { PostNewProduct } from "./NewProduct/NewProduct";
import { ImageSlider } from "./ImageSlider";
export interface ProductRenderProps {
  product: SnapBuy.Product;
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
  const available = useCopyState(false);
  var uri = new URL(location.href);
  uri.pathname = "/product/" + product.id;
  return (
    <EmptyComponent>
      <div className="p-2 font-bold text-3xl uppercase">
        <Translate content="actions" />
      </div>
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
        {/* {colors.map(({ name, color }) => {
          return (
            <div
              key={name}
              className="inline-flex items-center gap-2 active:bg-[--biqpod-gray-opacity] p-2 rounded-lg cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(color);
                showToast("Color Copied :)");
              }}
            >
              <div
                className="border-2 border-black rounded-full w-8 h-8"
                style={{
                  backgroundColor: color,
                }}
              />
            </div>
          );
        })}
        {colors.length == 0 && <Translate content="no colors ther is" />} */}
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
            await navigator.clipboard.writeText(uri.href);
            showToast("Link Copied :)");
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
          label: product.available ? "Set Unavailable" : "Set Available",
          click: async () => {
            var isAvailable = !available.get;
            await snapbuyApi.upsertProducts(product.storeId, [
              {
                id: product.id,
                available: isAvailable,
              },
            ]);
            available.set(isAvailable);
            showToast(
              isAvailable
                ? "Product Marked Unavailable"
                : "Product Marked Available"
            );
          },
          defaultIcon: allIcons.solid.faCheck,
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
            className="flex items-center gap-6 hover:bg-[--biqpod-gray-opacity] p-3 max-md:text-lg md:text-xl cursor-pointer"
            onClick={async () => {
              closeBottomSheet();
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
    </EmptyComponent>
  );
};
export const ProductRender = ({ product }: ProductRenderProps) => {
  const changePosition = useCopyState<Partial<Biqpod.Types.Axis>>({});
  const isStartChange = useMemo(() => {
    return (
      typeof changePosition.get.x == "number" &&
      typeof changePosition.get.y == "number"
    );
  }, [changePosition.get]);
  useEffect(() => {
    setTemp("canDeleteProduct", isStartChange ? product.id : null);
  }, [isStartChange]);
  const photos = product.photos || [];
  const prices = product.multiple?.prices || [];
  const price = product.single?.price || 0;
  const isFullWidth = getTemp<boolean>("isFullWidth");
  const isPromotion = product.type === "multiple";
  return (
    <Mouseable
      // onMoving={changePosition.set}
      onMovingEnd={() => {
        // changePosition.set({});
      }}
      style={{
        ...mergeObject(
          isStartChange && {
            left: changePosition.get.x,
            top: changePosition.get.y,
          }
        ),
      }}
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
      className={tw(
        "h-[300px] p-1 w-full transition-[width] duration-500",
        isFullWidth && "w-[calc(50%-4px)] ",
        isStartChange && "fixed"
      )}
    >
      <Card
        key={product.id}
        className="flex flex-col justify-between w-full h-full overflow-hidden"
      >
        <div className="relative flex justify-center items-center w-full h-[200px] overflow-hidden cursor-pointer">
          <ImageSlider photos={photos} />
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
          {product.type === "multiple" && (
            <div className="inline-flex top-0 left-0 absolute items-center gap-1 bg-red-700 px-3 py-1 rounded-ee-2xl text-white capitalize">
              <Icon icon={allIcons.solid.faTag} />
              <span>
                <Translate content="promoted" />
              </span>
            </div>
          )}
        </div>
        <Line />
        <div className="p-2 max-md:p-1">{product.name}</div>
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
          <CircleTip
            icon={allIcons.solid.faEllipsisVertical}
            onClick={() => {
              showBottomSheet(<ProductToolsBottomSheet product={product} />);
            }}
          />
        </div>
      </Card>
    </Mouseable>
  );
};
