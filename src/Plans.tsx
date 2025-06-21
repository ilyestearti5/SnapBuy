import { allIcons } from "@biqpod/app/ui/apis";
import { motion } from "framer-motion";
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
  useUser,
} from "@biqpod/app/ui/hooks";
import { snapbuyApi, Duration, Plan, PlanRecord } from "./apis";
import { Nothing } from "@biqpod/app/ui/types";
import { range, tw } from "@biqpod/app/ui/utils";
import { useSub } from "./store-init";
import { getStringTimeLeave } from "./utils";
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
    return snapbuyApi.getPlans();
  }, []);
  const user = useUser();
  useAction(
    "upgrade-plan",
    async ({ duration, plan }: UpgradePlanProps) => {
      await snapbuyApi.subscribe(plan, duration);
      closePopup();
    },
    []
  );
  const subed = useSub();
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
                  {user && subed?.isSubscribed === undefined && (
                    <EmptyComponent>
                      <Line />
                      <div className="p-2">
                        <Button
                          className="bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
                          icon={allIcons.solid.faCircleNotch}
                          iconClassName="animate-spin"
                        >
                          <Translate content="loading" />
                        </Button>
                      </div>
                    </EmptyComponent>
                  )}
                  {subed?.isSubscribed === false && (
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
                  {subed?.isSubscribed &&
                    subed.subscription?.label === name && (
                      <EmptyComponent>
                        <Line />
                        <div className="p-2">
                          <Button
                            onClick={() => {
                              if (
                                subed.subscription?.duration &&
                                subed.payedAt
                              ) {
                                const payedAtTimed = new Date(subed.payedAt!);
                                const doneAt = new Date(
                                  payedAtTimed.getTime() +
                                    subed.subscription.duration *
                                      1000 *
                                      60 *
                                      60 *
                                      24
                                );
                                const currentDate = new Date();
                                const timeDuration =
                                  doneAt.getTime() - payedAtTimed.getTime();
                                const timeLeaved =
                                  doneAt.getTime() - currentDate.getTime();
                                const percent =
                                  100 -
                                  Math.floor((timeLeaved / timeDuration) * 100);
                                showPopup(
                                  <Card className="w-[300px] min-h-[200px]">
                                    <div className="flex justify-between items-center p-2">
                                      <h1 className="text-2xl">
                                        {payedAtTimed.toLocaleDateString()}
                                      </h1>
                                      <CircleTip
                                        icon={allIcons.solid.faXmark}
                                        onClick={() => {
                                          closePopup();
                                        }}
                                      />
                                    </div>
                                    <Line />
                                    <div className="flex flex-col items-center gap-2 p-2">
                                      <span>
                                        {payedAtTimed.toLocaleDateString()}
                                      </span>
                                      <div className="flex flex-col">
                                        <div className="relative">
                                          <div className="relative bg-[--biqpod-gray-opacity] rounded-full w-[20px] h-[230px]">
                                            <motion.div
                                              className="top-0 absolute inset-x-0 bg-[--biqpod-primary] rounded-full"
                                              style={{
                                                height: `${percent}%`,
                                              }}
                                              initial={{ height: 0 }}
                                              animate={{
                                                height: `${percent}%`,
                                                transition: {
                                                  duration: 0.5,
                                                  type: "spring",
                                                  bounce: 0.2,
                                                  stiffness: 100,
                                                  damping: 20,
                                                },
                                              }}
                                              exit={{
                                                height: 0,
                                                transition: {
                                                  duration: 0.5,
                                                  type: "spring",
                                                  bounce: 0.2,
                                                  stiffness: 100,
                                                  damping: 20,
                                                },
                                              }}
                                            >
                                              <span className="top-1/2 left-full absolute ml-3 text-nowrap -translate-y-1/2">
                                                {getStringTimeLeave(
                                                  payedAtTimed,
                                                  currentDate
                                                )}{" "}
                                                ago
                                              </span>
                                            </motion.div>
                                            <motion.div
                                              className="absolute inset-x-0"
                                              style={{
                                                top: `${percent}%`,
                                                height: `${100 - percent}%`,
                                              }}
                                              initial={{ height: 0 }}
                                              animate={{
                                                height: `${100 - percent}%`,
                                                transition: {
                                                  duration: 0.5,
                                                  type: "spring",
                                                  bounce: 0.2,
                                                  stiffness: 100,
                                                  damping: 20,
                                                },
                                              }}
                                              exit={{
                                                height: 0,
                                                transition: {
                                                  duration: 0.5,
                                                  type: "spring",
                                                  bounce: 0.2,
                                                  stiffness: 100,
                                                  damping: 20,
                                                },
                                              }}
                                            >
                                              <span className="top-1/2 right-full absolute mr-3 text-nowrap -translate-y-1/2">
                                                {getStringTimeLeave(
                                                  currentDate,
                                                  doneAt
                                                )}{" "}
                                                rest
                                              </span>
                                            </motion.div>
                                          </div>
                                        </div>
                                      </div>
                                      <span>{doneAt.toLocaleDateString()}</span>
                                    </div>
                                    <Line />
                                    <div className="p-2">
                                      <Button
                                        onClick={() => {
                                          closePopup();
                                        }}
                                      >
                                        <Translate content="done" />
                                      </Button>
                                    </div>
                                  </Card>,
                                  {
                                    type: "blur",
                                  }
                                );
                              }
                            }}
                            icon={allIcons.solid.faCheckCircle}
                            className="bg-[--biqpod-success]"
                          >
                            <Translate content="current plan" />
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
