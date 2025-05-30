import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  EnumField,
  Line,
  PinField,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getTemp,
  getTempFromStore,
  isLoading,
  setTemp,
  useAction,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { allStatus } from "../ChangeStatus";
import { useEffect } from "react";
import { delay, tw } from "@biqpod/app/ui/utils";
export interface FilterOrdersProps {
  status?: string;
  time?: string;
  phone?: string;
  orderBy?: string;
}
export const useFilterState = () => {
  return getTemp<FilterOrdersProps>("filter-orders-state");
};
export const setFilterState = (state: FilterOrdersProps | null = null) => {
  setTemp("filter-orders-state", state);
};
export const updateFilterState = (
  state: Partial<FilterOrdersProps> | null = null
) => {
  const filterState = getTempFromStore<FilterOrdersProps>(
    "filter-orders-state"
  );
  if (state) {
    setTemp("filter-orders-state", { ...filterState, ...state });
  } else {
    setTemp("filter-orders-state", null);
  }
};
export const FilterOrders = () => {
  const filterStatusState = useCopyState<string | Nothing>(null);
  const filterTimeState = useCopyState<string | Nothing>(null);
  const filterPhoneState = useCopyState<string | Nothing>(null);
  const filterOrderByState = useCopyState<string | Nothing>(null);
  const filterState = useFilterState();
  useEffect(() => {
    filterStatusState.set(filterState?.status);
    filterTimeState.set(filterState?.time || null);
    filterPhoneState.set(filterState?.phone || null);
    filterOrderByState.set(filterState?.orderBy || null);
  }, [filterState]);
  const action = useAction(
    "apply-filter-orders",
    async () => {
      setFilterState({
        status: filterStatusState.get || undefined,
        time: filterTimeState.get || undefined,
        phone: filterPhoneState.get || undefined,
        orderBy: filterOrderByState.get || undefined,
      });
      await delay(1000);
      closePopup();
      execAction("fetch-orders", {});
    },
    [
      filterStatusState.get,
      filterTimeState.get,
      filterPhoneState.get,
      filterOrderByState.get,
    ]
  );
  const loading = isLoading(action);
  return (
    <Card className="max-md:w-11/12 md:w-2/3 overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <h1 className="text-2xl uppercase">
          <Translate content="filter" />
        </h1>
        <div className="flex">
          <CircleTip
            icon={allIcons.solid.faRotateBack}
            onClick={() => {
              filterOrderByState.set(null);
              filterPhoneState.set(null);
              filterStatusState.set(null);
              filterTimeState.set(null);
            }}
          />
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-col gap-2">
          <label className="text-xl capitalize" htmlFor="filter-orders">
            <Translate content="status" /> :
          </label>
          <EnumField
            config={{
              list: allStatus.map((status) => {
                return {
                  content: status
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" "),
                  value: status,
                };
              }),
            }}
            id="filter-orders"
            state={filterStatusState}
          />
          {/* <FilterFeild
            state={filterStatusState}
            id="filter-orders"
            config={{
              list: allStatus.map((status) => {
                var capitalizedName = status
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
                return { content: capitalizedName, value: status };
              }),
            }}
          /> */}
        </div>
        <div className="flex flex-col gap-4">
          <label className="text-xl capitalize" htmlFor="filter-time">
            <Translate content="time" /> :
          </label>
          <EnumField
            state={filterTimeState}
            id="filter-time"
            config={{
              placeholder: "select time",
              nullable: true,
              list: [
                { name: "all time", emojie: "⏳" },
                { name: "today", emojie: "📅" },
                { name: "this week", emojie: "🗓️" },
                { name: "this month", emojie: "📆" },
                { name: "this year", emojie: "🎉" },
                { name: "last week", emojie: "⏪🗓️" },
                { name: "last month", emojie: "⏪📆" },
                { name: "last year", emojie: "⏪🎉" },
              ].map((time) => {
                var capitalizedName = time.name
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
                return {
                  content: `${capitalizedName} ${time.emojie}`,
                  value: time.name,
                };
              }),
            }}
          />
        </div>
        <div className="flex flex-col gap-4">
          <label className="text-xl capitalize" htmlFor="filter-time">
            <Translate content="order by" /> :
          </label>
          <EnumField
            state={filterOrderByState}
            id="filter-order-by"
            config={{
              placeholder: "select order by",
              nullable: true,
              list: [
                {
                  name: "Ascending",
                  emojie: "⬆️",
                },
                {
                  name: "Descending",
                  emojie: "⬇️",
                },
              ].map((time) => {
                var capitalizedName = time.name
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
                return {
                  content: `${capitalizedName} ${time.emojie}`,
                  value: time.name,
                };
              }),
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xl capitalize" htmlFor="filter-order-phone">
            <Translate content="phone" /> :
          </label>
          <div className="flex justify-center gap-2">
            <PinField
              id="filter-order-phone"
              config={{
                match: "..-....-....",
                separator: "-",
                size: 30,
              }}
              state={filterPhoneState}
            />
          </div>
        </div>
      </div>
      <Line />
      <div className="flex justify-between items-center gap-2 p-2">
        {filterState && (
          <Button
            onClick={() => {
              setFilterState();
              execAction("fetch-orders", {});
            }}
            className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
          >
            <Translate content="cancel" />
          </Button>
        )}
        <Button
          onClick={async () => {
            await execAction("apply-filter-orders");
          }}
          icon={loading ? allIcons.solid.faSpinner : allIcons.solid.faCheck}
          iconClassName={tw(loading && "animate-spin")}
          className="rounded-full"
        >
          <Translate content="apply" />
        </Button>
      </div>
    </Card>
  );
};
