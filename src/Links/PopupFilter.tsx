import { allIcons } from "biqpod/ui/apis";
import {
  BooleanFeild,
  Button,
  Card,
  CircleTip,
  EmptyComponent,
  EnumFeild,
  Icon,
  Line,
  Scroll,
  Translate,
} from "biqpod/ui/components";
import { closePopup, useCopyState } from "biqpod/ui/hooks";
import { Nothing } from "biqpod/ui/types";
import { tw } from "biqpod/ui/utils";
import { useEffect, useMemo } from "react";
import { useCategorys, useMarkets } from "../apis";
const filterFields = [
  {
    label: "Category",
    value: "category",
    icon: allIcons.solid.faTag,
    description: "Is For Getting Product With Specific Category",
  },
  {
    label: "Market",
    value: "market",
    icon: allIcons.solid.faStore,
    description: "Is For Getting Product With Specific Market",
  },
  {
    label: "Available",
    value: "available",
    icon: allIcons.solid.faCheck,
    description: "Is For Getting The Available Product",
  },
];
interface P {
  category: string | null;
  market: string | null;
  available: boolean | null;
}
interface PopupFilterProps {
  onChange?: (props: P) => void;
  value?: P;
}
export const PopupFilter = ({ onChange, value }: PopupFilterProps) => {
  const viewId = useCopyState<string | null>(null);
  const view = useMemo(() => {
    return filterFields.find((field) => field.value === viewId.get);
  }, [viewId.get]);
  const isAvailable = useCopyState<boolean | null>(false);
  const category = useCopyState<string | Nothing>("");
  const market = useCopyState<string | Nothing>("");
  const markets = useMarkets();
  const categorys = useCategorys();
  useEffect(() => {
    if (value) {
      category.set(value.category);
      market.set(value.market);
      isAvailable.set(value.available);
    }
  }, []);
  return (
    <Card className="max-md:rounded-none max-md:w-full max-md:h-full">
      <div className="flex justify-between items-center p-2">
        <div className="flex items-center gap-2">
          {view && (
            <CircleTip
              icon={allIcons.solid.faChevronLeft}
              onClick={() => {
                viewId.set(null);
              }}
            />
          )}
          <h1 className="font-bold text-2xl">Filter Products</h1>
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
                  className="cursor-pointer"
                  onClick={() => {
                    viewId.set(field.value);
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
            "absolute inset-y-0 bg-[--biqpod-primary-background] border-[--biqpod-borders] border-l border-solid w-full transition-transform translate-x-full duration-500",
            view && "translate-x-[0%]"
          )}
        >
          {view?.value === "available" && (
            <div className="flex flex-col justify-center items-center gap-2 h-full">
              <Card>
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl">Available</h1>
                </div>
                <Line />
                <div className="flex justify-center items-center p-2">
                  <BooleanFeild
                    state={isAvailable}
                    config={{
                      style: "checkbox",
                    }}
                    id="available"
                  />
                </div>
                <Line />
                <div className="p-2">{view.description}</div>
              </Card>
            </div>
          )}
          {view?.value === "market" && (
            <div className="flex flex-col justify-center items-center gap-2 h-full">
              <Card>
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl">Market</h1>
                </div>
                <Line />
                <div className="p-2">
                  <EnumFeild
                    state={market}
                    config={{
                      list: markets?.map((market) => ({
                        value: market,
                        content: market,
                      })),
                      search: !!(markets?.length && markets?.length > 10),
                    }}
                    id="market"
                  />
                </div>
                <Line />
                <div className="p-2">{view.description}</div>
              </Card>
            </div>
          )}
          {view?.value === "category" && (
            <div className="flex flex-col justify-center items-center gap-2 h-full">
              <Card>
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl">Category</h1>
                </div>
                <Line />
                <div className="p-2">
                  <EnumFeild
                    state={category}
                    config={{
                      list: categorys?.map((category) => ({
                        value: category,
                        content: category,
                      })),
                      search: !!(categorys?.length && categorys?.length > 10),
                    }}
                    id="category"
                  />
                </div>
                <Line />
                <div className="p-2">{view.description}</div>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Line />
      <div className="flex justify-between items-center p-2">
        <Button
          onClick={() => {
            onChange?.({
              category: category.get || null,
              market: market.get || null,
              available: isAvailable.get || null,
            });
            category.set("");
            market.set("");
            isAvailable.set(false);
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
