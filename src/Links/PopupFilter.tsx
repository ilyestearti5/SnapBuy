import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  EnumField,
  Icon,
  Line,
  NumberField,
  Scroll,
  TabContent,
  Translate,
} from "@biqpod/app/ui/components";
import { closePopup, getTab, setTab, useCopyState } from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { useEffect } from "react";
const filterFields = [
  {
    label: "Available",
    value: "available",
    icon: allIcons.solid.faCheck,
    description: "Is For Getting The Available Product",
  },
  {
    label: "Promoted",
    value: "promoted",
    icon: allIcons.solid.faTag,
    description: "Is For Getting The Promoted Product",
  },
  {
    label: "Price Range",
    value: "price-range",
    icon: allIcons.solid.faMoneyBill1Wave,
    description: "Is For Getting Product With Specific Price Range",
  },
];
export interface FilterOptionsForProduct {
  available: string | null;
  promoted?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
}
interface PopupFilterProps {
  onChange?: (props: FilterOptionsForProduct | null) => void;
  value: FilterOptionsForProduct | null;
}
export const PopupFilter = ({ onChange, value }: PopupFilterProps) => {
  const isAvailable = useCopyState<string | Nothing>(false);
  const promoted = useCopyState<string | Nothing>("");
  const minPriceState = useCopyState<number | null | undefined>(0);
  const maxPriceState = useCopyState<number | null | undefined>(0);
  useEffect(() => {
    if (value) {
      isAvailable.set(value.available);
      promoted.set(value.promoted || "");
      minPriceState.set(value.minPrice || 0);
      maxPriceState.set(value.maxPrice || 0);
    }
  }, []);
  const tab = getTab("filter-products");
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <div className="flex items-center gap-2">
          {tab && (
            <CircleTip
              icon={allIcons.solid.faChevronLeft}
              onClick={() => {
                setTab("filter-products", null);
              }}
            />
          )}
          <h1 className="font-bold text-2xl">
            <Translate content="Filter Products" />
          </h1>
        </div>
        <div>
          <CircleTip
            onClick={() => {
              closePopup();
            }}
            icon={allIcons.solid.faXmark}
          />
        </div>
      </div>
      <Line />
      <div className="relative flex flex-col h-full">
        <Scroll>
          <div className="flex flex-col gap-2 p-2">
            {filterFields.map((field) => {
              return (
                <Card
                  className="active:bg-[--biqpod-gray-opacity] cursor-pointer"
                  onClick={() => {
                    setTab("filter-products", field.value);
                  }}
                  key={field.value}
                >
                  <div className="flex justify-between items-center gap-x-2 p-2 text-xl">
                    <div className="flex items-center gap-x-2 text-xl">
                      <Icon icon={field.icon} />
                      <h1>{field.label}</h1>
                    </div>
                    <CircleTip icon={allIcons.solid.faChevronRight} />
                  </div>
                </Card>
              );
            })}
          </div>
        </Scroll>
        <div
          className={tw(
            "absolute inset-y-0 bg-[--biqpod-primary-background] border-y-[--biqpod-borders] border-l-transparent border-r-[--biqpod-borders] border-l border-solid w-full transition-transform translate-x-full duration-500",
            tab && "translate-x-[0%]"
          )}
        >
          <TabContent
            identifier="filter-products"
            value="available"
            className="flex flex-col justify-center items-center gap-2 h-full"
          >
            <Card>
              <div className="p-2 text-center">
                <h1 className="font-bold text-2xl capitalize">
                  <Translate content="available" />
                </h1>
              </div>
              <Line />
              <div className="flex justify-center items-center p-2">
                <EnumField
                  state={isAvailable}
                  config={{
                    list: [
                      { value: "available", content: "Available ✅" },
                      { value: "unavailable", content: "Not Available ❌" },
                      { value: "alll", content: "All Products 📋" },
                    ],
                    search: true,
                  }}
                  id="available"
                />
              </div>
              <Line />
              <div className="p-2 capitalize">
                <Translate content="is for getting the available product" />
              </div>
            </Card>
          </TabContent>
          <TabContent
            identifier="filter-products"
            value="promoted"
            className="flex flex-col justify-center items-center gap-2 h-full"
          >
            <Card>
              <div className="p-2 text-center">
                <h1 className="font-bold text-2xl capitalize">
                  <Translate content="promoted" />
                </h1>
              </div>
              <Line />
              <div className="p-2">
                <EnumField
                  state={promoted}
                  config={{
                    list: ["promoted", "no promoted", "all"].map((status) => {
                      const emojie =
                        status === "promoted"
                          ? "📢"
                          : status === "no promoted"
                          ? "🚫"
                          : "📋";
                      return {
                        value: status,
                        content: status.toUpperCase() + " " + emojie,
                      };
                    }),
                  }}
                  id="promoted"
                />
              </div>
              <Line />
              <div className="p-2 capitalize">
                <Translate content="is for getting the promoted product" />
              </div>
            </Card>
          </TabContent>
          <TabContent
            identifier="filter-products"
            value="price-range"
            className="flex flex-col justify-center items-center gap-2 h-full"
          >
            <Card>
              <div className="p-2 text-center">
                <h1 className="font-bold text-2xl capitalize">
                  <Translate content="price range" />
                </h1>
              </div>
              <Line />
              <div className="p-2">
                <Translate content="is for getting product with specific price range" />
              </div>
              <Line />
              <div className="flex flex-col gap-2 p-2">
                <div className="flex max-md:flex-col items-center gap-2">
                  <label
                    htmlFor="min-price"
                    className="block w-full md:text-right"
                  >
                    <Translate content="min price" />
                  </label>
                  <div className="w-full">
                    <NumberField
                      id="min-price"
                      state={minPriceState}
                      config={{
                        min: 0,
                        max: 1000000,
                        autoChange: true,
                        placeholder: "Enter Min Price",
                      }}
                    />
                  </div>
                </div>
                <div className="flex max-md:flex-col items-center gap-2">
                  <label
                    htmlFor="max-price"
                    className="block w-full md:text-right"
                  >
                    <Translate content="max price" />
                  </label>
                  <div className="w-full">
                    <NumberField
                      id="max-price"
                      state={maxPriceState}
                      config={{
                        min: 0,
                        max: 1000000,
                        autoChange: true,
                        placeholder: "Enter Max Price",
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabContent>
        </div>
      </div>
      <Line />
      <div className="flex justify-between items-center gap-2 p-2">
        {value && (
          <Button
            onClick={() => {
              onChange?.(null);
              setTab("filter-products", null);
              closePopup();
            }}
            className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          >
            <Translate content="reset" />
          </Button>
        )}
        <Button
          onClick={() => {
            onChange?.({
              available: isAvailable.get || null,
              promoted: promoted.get || null,
              minPrice: minPriceState.get || null,
              maxPrice: maxPriceState.get || null,
            });
            isAvailable.set(false);
            promoted.set("");
            minPriceState.set(0);
            maxPriceState.set(0);
            setTab("filter-products", null);
            closePopup();
          }}
          icon={allIcons.solid.faArrowRightLong}
        >
          <Translate content="apply" />
        </Button>
      </div>
    </Card>
  );
};
