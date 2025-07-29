import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  Field,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import {
  getFieldValue,
  setFieldValue,
  useIdleStatus,
} from "@biqpod/app/ui/hooks";
import { betweenInt, delay, randomItem, tw } from "@biqpod/app/ui/utils";
import { useEffect, useMemo } from "react";
import { useLocation } from "react-router";
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
          placeholder="R"
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
          check.status.get === "ready"
            ? "text-[--biqpod-primary]"
            : !check.data.get
            ? "text-red-600"
            : "text-green-600"
        )}
        icon={
          check.status.get === "ready"
            ? allIcons.solid.faCheck
            : !check.data.get
            ? allIcons.solid.faXmark
            : allIcons.solid.faCheck
        }
      />
    </div>
  );
};
export const Tracking = () => {
  const loc = useLocation();
  const trackingId = useMemo(() => {
    const trackingId = new URLSearchParams(loc.search).get("id");
    return trackingId;
  }, [loc.pathname]);
  const value = getFieldValue("tracking-value");
  const id = useMemo(() => {
    const id = value?.replaceAll(/ +/gi, "-");
    return id;
  }, [value]);
  useEffect(() => {
    const id = trackingId?.replaceAll(/ +/gi, "-");
    if (id?.match(/^[a-zA-Z0-9]+(-([a-zA-Z0-9]+)){3}$/)) {
      setFieldValue("tracking-value", id);
    }
  }, [trackingId]);
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
            className="rounded-xl font-bold text-2xl text-center"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            inputName="tracking-value"
          />
        </div>
        <Line />
        <div className="p-3">
          <RobotChecking />
        </div>
        <Line />
        <div className="p-3">
          <Button rightIcon={allIcons.solid.faChevronRight} onClick={() => {}}>
            <Translate content="validate" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
