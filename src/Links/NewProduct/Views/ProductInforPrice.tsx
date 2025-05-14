import React, { useEffect, useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  BooleanFeild,
  CircleTip,
  EmptyComponent,
  Icon,
  Line,
  NumberFeild,
  Tip,
  TitleView,
  Translate,
} from "@biqpod/app/ui/components";
import { getTemp, useColorMerge, useTemp } from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
export const PostInforPrice = () => {
  const postType = getTemp<"multiple" | "single">("post-type");
  const quantity = useTemp<number | null | undefined>("post-quantity");
  const tempPrice = useTemp<number | null | undefined>("temp-price");
  const tempQuantity = useTemp<number | null | undefined>("temp-quantity");
  const limited = useTemp<boolean>("product-limited");
  const price = useTemp<number | undefined>("product-price");
  const colorMerge = useColorMerge();
  const [isSingle, isMultiple] = useMemo(() => {
    var isSingle = postType === "single";
    return [isSingle, !isSingle];
  }, [postType]);
  const pricesList =
    useTemp<Required<SnapBuy.Product>["multiple"]["prices"]>("product-prices");
  const maxCount = useMemo(() => {
    return Math.min(
      ...(pricesList.get?.map(({ quantity }) => {
        return quantity;
      }) || [1])
    );
  }, [pricesList.get]);
  return (
    <EmptyComponent>
      <div className="flex flex-col">
        <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
          <label
            className="w-full md:text-right capitalize"
            htmlFor="product-limited"
          >
            <Translate content="limited" /> :
          </label>
          <div className="w-full">
            <BooleanFeild
              state={limited}
              config={{
                style: "switch",
              }}
              id="product-limited"
            />
          </div>
        </div>
        <div>
          <div
            className={tw(
              "h-[0px] transition-[height] overflow-hidden",
              limited.get && "h-[60px] max-md:h-[80px]"
            )}
          >
            <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
              <label
                className="w-full md:text-right capitalize"
                htmlFor="post-qunatity"
              >
                <Translate content="quantity" /> :
              </label>
              <div className="relative w-full">
                <NumberFeild
                  state={quantity}
                  config={{
                    placeholder: "Enter Quantity",
                    autoChange: true,
                  }}
                  id="post-qunatity"
                />
              </div>
            </div>
          </div>
        </div>
        <Line />
        {isSingle && (
          <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
            <label
              className="w-full md:text-right capitalize"
              htmlFor="product-price"
            >
              <Translate content="price" /> :
            </label>
            <div className="relative w-full">
              <NumberFeild
                state={price}
                config={{
                  placeholder: "Enter Price",
                  autoChange: true,
                }}
                id="product-price"
              />
              <div
                style={{
                  ...colorMerge({
                    color: "primary",
                  }),
                }}
                className="top-1/2 right-3 absolute -translate-y-1/2 pointer-events-none transform"
              >
                DA
              </div>
            </div>
          </div>
        )}
        {isMultiple && (
          <EmptyComponent>
            <div className="flex flex-wrap p-2">
              {pricesList.get?.map(({ price, quantity }, index) => {
                return (
                  <div
                    key={index}
                    className="flex justify-between items-center gap-2 px-2 py-1 border border-transparent border-solid rounded-2xl"
                    style={{
                      ...colorMerge("gray.opacity"),
                    }}
                  >
                    <span>
                      {price}
                      <span>DA</span>{" "}
                      <sub>
                        <Icon icon={allIcons.solid.faChevronRight} /> {quantity}
                      </sub>
                    </span>
                    <Tip
                      className="rounded-full w-[20px] h-[20px]"
                      icon={allIcons.solid.faTimes}
                      onClick={() => {
                        pricesList.set((pricesList) => {
                          return (
                            pricesList?.filter((_price, i) => i !== index) || []
                          );
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex max-md:items-end md:items-center">
              <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
                <label
                  className="w-full md:text-right capitalize"
                  htmlFor="temp-quantity"
                >
                  <Translate content="quantity" /> :
                </label>
                <div className="relative w-full">
                  <NumberFeild
                    state={tempQuantity}
                    config={{
                      autoChange: true,
                      placeholder: "Enter Quantity",
                      min: maxCount,
                    }}
                    id="temp-quantity"
                  />
                </div>
              </div>
              <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
                <label
                  className="w-full md:text-right capitalize"
                  htmlFor="temp-price"
                >
                  <Translate content="price for one" /> :
                </label>
                <div className="relative w-full">
                  <NumberFeild
                    state={tempPrice}
                    config={{
                      placeholder: "Enter Price",
                      autoChange: true,
                    }}
                    id="post-temp-price"
                  />
                  <div
                    style={{
                      ...colorMerge({
                        color: "primary",
                      }),
                    }}
                    className="top-1/2 right-3 absolute -translate-y-1/2 pointer-events-none transform"
                  >
                    DA
                  </div>
                </div>
              </div>
              <div className="p-2">
                <TitleView title="Add">
                  <CircleTip
                    icon={allIcons.solid.faPlus}
                    onClick={() => {
                      pricesList.set((pricesList) => {
                        return [
                          ...(pricesList || []),
                          {
                            price: tempPrice.get || 0,
                            quantity: tempQuantity.get || 0,
                          },
                        ];
                      });
                      tempPrice.set(undefined);
                      tempQuantity.set(undefined);
                    }}
                  />
                </TitleView>
              </div>
            </div>
          </EmptyComponent>
        )}
      </div>
    </EmptyComponent>
  );
};
