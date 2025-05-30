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
import { useEffect } from "react";
import { delay, tw } from "@biqpod/app/ui/utils";
import { rolsInList } from "../utils";
export interface FilterAccountsProps {
  role?: string;
  time?: string;
  phone?: string;
  orderBy?: string;
}
export const useAccountFilterState = () => {
  return getTemp<FilterAccountsProps>("filter-accounts-state");
};
export const setAccountsFilterState = (
  state: FilterAccountsProps | null = null
) => {
  setTemp("filter-accounts-state", state);
};
export const updateFilterState = (
  state: Partial<FilterAccountsProps> | null = null
) => {
  const filterState = getTempFromStore<FilterAccountsProps>(
    "filter-accounts-state"
  );
  if (state) {
    setAccountsFilterState({
      ...filterState,
      ...state,
    });
  } else {
    setAccountsFilterState(null);
  }
};
export const FilterAccounts = () => {
  const filterRolesState = useCopyState<string | Nothing>(null);
  const filterTimeState = useCopyState<string | Nothing>(null);
  const filterPhoneState = useCopyState<string | Nothing>(null);
  const filterOrderByState = useCopyState<string | Nothing>(null);
  const filterState = useAccountFilterState();
  useEffect(() => {
    filterRolesState.set(filterState?.role);
    filterTimeState.set(filterState?.time || null);
    filterPhoneState.set(filterState?.phone || null);
    filterOrderByState.set(filterState?.orderBy || null);
  }, [filterState]);
  const action = useAction(
    "apply-filter-accounts",
    async () => {
      setAccountsFilterState({
        role: filterRolesState.get || undefined,
        time: filterTimeState.get || undefined,
        phone: filterPhoneState.get || undefined,
        orderBy: filterOrderByState.get || undefined,
      });
      await delay(1000);
      closePopup();
      execAction("get-accounts", false);
    },
    [
      filterRolesState.get,
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
              filterRolesState.set(null);
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
          <label className="text-xl capitalize" htmlFor="filter-accounts">
            <Translate content="roles" /> :
          </label>
          <EnumField
            config={{
              list: rolsInList,
            }}
            id="filter-accounts"
            state={filterRolesState}
          />
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
                const capitalizedName = time.name
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
          <label className="text-xl capitalize" htmlFor="filter-account-phone">
            <Translate content="phone" /> :
          </label>
          <div className="flex justify-center gap-2">
            <PinField
              id="filter-account-phone"
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
              setAccountsFilterState();
              execAction("fetch-orders", {});
            }}
            className="bg-[--biqpod-gray-opacity] rounded-full text-[--biqpod-text-color]"
          >
            <Translate content="cancel" />
          </Button>
        )}
        <Button
          onClick={async () => {
            await execAction("apply-filter-accounts");
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
