import { useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  CircleTip,
  EmptyComponent,
  Icon,
  Line,
  NumberField,
  Tip,
  TitleView,
  Translate,
} from "@biqpod/app/ui/components";
import { showToast, useTemp } from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import {
  getFormLimited,
  getFormType,
  useFormClientPrice,
  useFormCustomerPrice,
  useFormPrices,
  useFormQuantity,
} from "../../../apis/getFns";
export const PostInforPrice = () => {
  const postType = getFormType();
  const quantity = useFormQuantity();
  const tempPrice = useTemp<number | null | undefined>("temp-price");
  const tempQuantity = useTemp<number | null | undefined>("temp-quantity");
  const clientPrice = useFormClientPrice();
  const customerPrice = useFormCustomerPrice();
  const pricesList = useFormPrices();
  const [isSingle, isMultiple] = useMemo(() => {
    var isSingle = postType === "single";
    return [isSingle, !isSingle];
  }, [postType]);
  const maxCount = useMemo(() => {
    if (!pricesList.get?.length) {
      return 1;
    }
    return Math.min(...pricesList.get.map(({ quantity }) => quantity));
  }, [pricesList.get]);
  const limited = getFormLimited();
  return (
    <div className="flex flex-col">
      <div>
        <div
          className={tw(
            "h-[0px] transition-[height] overflow-hidden",
            limited && "h-[60px] max-md:h-[80px]"
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
              <NumberField
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
      {limited && <Line />}
      {isSingle && (
        <EmptyComponent>
          <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
            <label
              className="w-full md:text-right capitalize"
              htmlFor="product-client"
            >
              <Translate content="client price" /> :
            </label>
            <div className="relative w-full">
              <NumberField
                state={clientPrice}
                config={{
                  placeholder: "Enter Client Price",
                  autoChange: true,
                }}
                id="product-client-price"
              />
              <div className="top-1/2 right-3 absolute text-[--biqpod-primary] -translate-y-1/2 pointer-events-none transform">
                DA
              </div>
            </div>
          </div>
          <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
            <label
              className="w-full md:text-right capitalize"
              htmlFor="product-customer-price"
            >
              <Translate content="customer price" /> :
            </label>
            <div className="relative w-full">
              <NumberField
                state={customerPrice}
                config={{
                  placeholder: "Enter Customer Price",
                  autoChange: true,
                }}
                id="product-customer-price"
              />
              <div className="top-1/2 right-3 absolute text-[--biqpod-primary] -translate-y-1/2 pointer-events-none transform">
                DA
              </div>
            </div>
          </div>
        </EmptyComponent>
      )}
      {isMultiple && (
        <EmptyComponent>
          <div className="flex flex-wrap p-2">
            {pricesList.get?.map(({ price, quantity }, index) => {
              return (
                <div
                  key={index}
                  className="flex justify-between items-center gap-2 bg-[--biqpod-gray-opacity] px-2 py-1 border border-transparent border-solid rounded-2xl"
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
                <NumberField
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
                <NumberField
                  state={tempPrice}
                  config={{
                    placeholder: "Enter Price",
                    autoChange: true,
                  }}
                  id="post-temp-price"
                />
                <div className="top-1/2 right-3 absolute text-[--biqpod-primary] -translate-y-1/2 pointer-events-none transform">
                  DA
                </div>
              </div>
            </div>
            {![tempQuantity.get, tempPrice.get].includes(null) && (
              <div className="p-2">
                <TitleView title="Add">
                  <CircleTip
                    icon={allIcons.solid.faPlus}
                    onClick={() => {
                      if (
                        pricesList.get?.find(
                          (price) => price.quantity === tempQuantity.get
                        )
                      ) {
                        showToast(
                          `quantity ${tempQuantity.get} is used!`,
                          "error"
                        );
                        return;
                      }
                      pricesList.set((pricesList) => {
                        return [
                          ...(pricesList || []),
                          {
                            price: tempPrice.get || 0,
                            quantity: tempQuantity.get || 0,
                          },
                        ];
                      });
                      tempPrice.set(null);
                      tempQuantity.set(null);
                    }}
                  />
                </TitleView>
              </div>
            )}
          </div>
        </EmptyComponent>
      )}
    </div>
  );
};
