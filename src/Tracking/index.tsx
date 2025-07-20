import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  Field,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import { getFieldValue, useIdleStatus } from "@biqpod/app/ui/hooks";
import { betweenInt, delay, randomItem, tw } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
// import { useParams } from "react-router";
const robotId = crypto.randomUUID();
export interface RobotCheckingProps {
  onValidate: (value: boolean) => void;
}
const RobotChecking = () => {
  const b = useMemo(() => betweenInt(0, 10), []);
  const a = useMemo(() => betweenInt(b + 2, b + 10), []);
  const operator = useMemo(() => {
    return randomItem(["+", "-", "*"]).value;
  }, []);
  const fieldValue = getFieldValue("robot-value");
  const check = useIdleStatus(async () => {
    await delay(1000);
    const result: number = eval(`${a} ${operator} ${b}`);
    const int = parseInt(fieldValue || "", 10);
    if (isNaN(int)) {
      throw new Error("Invalid input");
    }
    return int === result;
  }, [fieldValue, a, b, operator]);
  return (
    <div className="flex items-center gap-2 font-bold text-xl" id={robotId}>
      <span>{a}</span>
      <span>{operator}</span>
      <span>{b}</span>
      <span>=</span>
      <span>
        <Field
          placeholder="Result"
          className="rounded-full w-[60px] text-center"
          inputName="robot-value"
          inputMode="numeric"
        />
      </span>
      <CircleTip
        onClick={() => {
          check.status.set("idle");
        }}
        className={tw(
          !check.data.get && "text-red-600",
          check.data.get && "text-green-600"
        )}
        icon={!check.data.get ? allIcons.solid.faXmark : allIcons.solid.faCheck}
      />
    </div>
  );
};
export const Tracking = () => {
  // const { trackingId } = useParams<{ trackingId: string }>();
  return (
    <div className="flex justify-center items-center w-full h-full">
      <Card className="w-[80vw]">
        <div className="flex justify-between items-center p-2">
          <h1 className="font-bold text-2xl capitalize">
            <Translate content="tracking" />
          </h1>
        </div>
        <Line />
        <div className="p-5">
          <Field
            className="rounded-xl text-center"
            placeholder="XXXX XXXX XXXX"
            inputName="tracking-value"
          />
        </div>
        <Line />
        <div className="p-3">
          <RobotChecking />
        </div>
        <Line />
        <div className="p-3">
          <Button onClick={() => {}}>
            <Translate content="validate" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
