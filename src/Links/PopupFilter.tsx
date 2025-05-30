import { allIcons } from "@biqpod/app/ui/apis";
import {
  BooleanField,
  Button,
  Card,
  CircleTip,
  EnumField,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { closePopup, useCopyState } from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { useEffect, useMemo } from "react";
import { useCategories } from "../apis";
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
  {
    label: "Promoted",
    value: "promoted",
    icon: allIcons.solid.faTag,
    description: "Is For Getting The Promoted Product",
  },
];
interface P {
  category: string | null;
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
  const promoted = useCopyState<string | Nothing>("");
  const categories = useCategories();
  useEffect(() => {
    if (value) {
      category.set(value.category);
      isAvailable.set(value.available);
    }
  }, []);
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
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
            "absolute inset-y-0 bg-[--biqpod-primary-background] border-y-[--biqpod-borders] border-l-transparent border-r-[--biqpod-borders] border-l border-solid w-full transition-transform translate-x-full duration-500",
            view && "translate-x-[0%]"
          )}
        >
          {view?.value === "available" && (
            <div className="flex flex-col justify-center items-center gap-2 h-full">
              <Card>
                <div className="p-2 text-center">
                  <h1 className="font-bold text-2xl capitalize">
                    <Translate content="available" />
                  </h1>
                </div>
                <Line />
                <div className="flex justify-center items-center p-2">
                  <BooleanField
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
                  <h1 className="font-bold text-2xl capitalize">
                    <Translate content="market" />
                  </h1>
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
                  <h1 className="font-bold text-2xl capitalize">
                    <Translate content="category" />
                  </h1>
                </div>
                <Line />
                <div className="p-2">
                  <EnumField
                    state={category}
                    config={{
                      list: (categories || []).map(({ category, emoji }) => {
                        return {
                          value: category,
                          content: category + " " + emoji,
                        };
                      }),
                      search: !!(categories?.length && categories?.length > 10),
                    }}
                    id="category"
                  />
                </div>
                <Line />
                <div className="p-2">{view.description}</div>
              </Card>
            </div>
          )}
          {view?.value === "promoted" && (
            <div className="flex flex-col justify-center items-center gap-2 h-full">
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
              available: isAvailable.get || null,
            });
            category.set("");
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
