import { allIcons } from "@biqpod/app/ui/apis";
import {
  Scroll,
  Card,
  Translate,
  Line,
  Icon,
  EmptyComponent,
  Button,
  CircleTip,
  CardWait,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  isLoading,
  showPopup,
  useAction,
  useAsyncMemo,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { useMemo } from "react";
import { api, Duration, Plan, PlanRecord } from "./apis";
import { Nothing } from "@biqpod/app/ui/types";
import { range, tw } from "@biqpod/app/ui/utils";
import { useIsSubed } from "./HeaderContent";
interface SelectedPlanProps {
  name: string;
  plan: PlanRecord;
}
const SelectedPlan = ({ plan, name }: SelectedPlanProps) => {
  const choosiedPlan = useCopyState<string | Nothing>(null);
  const loading = isLoading("upgrade-plan");
  return (
    <Card>
      <div className="flex items-center gap-2 p-2">
        <h1 className="text-2xl capitalize">
          <Translate content="upgrade plan" /> {name}
        </h1>
        <div>
          <CircleTip
            icon={allIcons.solid.faXmark}
            onClick={() => {
              closePopup();
            }}
          />
        </div>
      </div>
      <Line />
      {Object.entries(plan.duration).map(([key, value]) => {
        const isSelected = choosiedPlan.get === key;
        return (
          <div
            onClick={() => {
              choosiedPlan.set(key);
            }}
            className={tw(
              "flex justify-between transition-[padding,color,background] duration-500 items-center pl-2 pr-2 py-2 text-2xl cursor-pointer",
              isSelected &&
                "pl-4 text-[--biqpod-primary] bg-[--biqpod-gray-opacity]"
            )}
            key={key}
          >
            <span className="capitalize">{key}</span>
            <span className="text-[--biqpod-success]">{value}DA</span>
          </div>
        );
      })}
      {choosiedPlan.get && (
        <EmptyComponent>
          <Line />
          <div className="p-2">
            <Button
              className={tw("rounded-full", loading && "pointer-events-none")}
              icon={
                loading
                  ? allIcons.solid.faSpinner
                  : allIcons.solid.faArrowRightToBracket
              }
              iconClassName={tw(loading && "animate-spin")}
              onClick={async () => {
                execAction("upgrade-plan", {
                  duration: choosiedPlan.get,
                  plan: name,
                });
              }}
            >
              <Translate content="upgrade" />
            </Button>
          </div>
        </EmptyComponent>
      )}
    </Card>
  );
};
interface UpgradePlanProps {
  plan: keyof Plan;
  duration: Duration;
}
export const Plans = () => {
  const plans = useAsyncMemo(async () => {
    return api.getPlans();
  }, []);
  useAction(
    "upgrade-plan",
    async ({ duration, plan }: UpgradePlanProps) => {
      await api.subscribe(plan, duration);
      closePopup();
    },
    []
  );
  const isSubed = useIsSubed();
  return (
    <Scroll>
      <div className="flex flex-wrap gap-2 p-2">
        {plans &&
          Object.entries(plans).map(
            ([name, plan]: [string, Plan[keyof Plan]]) => {
              return (
                <Card
                  key={name}
                  className="flex flex-col max-md:w-full md:w-[calc(50%-4px)] h-full"
                >
                  <div className="p-2 text-2xl capitalize">
                    <Translate content={name} />
                  </div>
                  <Line />
                  <div className="flex justify-center items-center p-2">
                    <span className="flex justify-center items-center bg-[--biqpod-gray-opacity] rounded-full w-[80px] h-[80px] text-3xl">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <Line />
                  <div className="flex flex-col gap-2 p-2">
                    {plan.features.map((value) => {
                      return (
                        <div key={value} className="flex items-center gap-2">
                          <Icon
                            icon={allIcons.solid.faCheck}
                            iconClassName="text-[--biqpod-primary] text-xl"
                          />
                          <span className="text-lg capitalize">
                            <Translate content={value} />
                          </span>
                        </div>
                      );
                    })}
                    {plan.features.length === 0 && (
                      <div className="flex items-center gap-2">
                        <Icon
                          icon={allIcons.solid.faXmark}
                          iconClassName="text-[--biqpod-primary] text-xl"
                        />
                        <span className="text-lg capitalize">
                          <Translate content="no features" />
                        </span>
                      </div>
                    )}
                  </div>
                  {isSubed === false && (
                    <EmptyComponent>
                      <Line />
                      <div className="p-2">
                        <Button
                          icon={allIcons.solid.faArrowRightToBracket}
                          onClick={() => {
                            showPopup(<SelectedPlan plan={plan} name={name} />);
                          }}
                        >
                          <Translate content="upgrade plan" />
                        </Button>
                      </div>
                    </EmptyComponent>
                  )}
                </Card>
              );
            }
          )}
        {plans === null &&
          range(3).map((index) => {
            return (
              <CardWait
                className="rounded-2xl w-[calc(50%-4px)] max-md:w-full h-[150px]"
                key={index}
              />
            );
          })}
      </div>
    </Scroll>
  );
};
