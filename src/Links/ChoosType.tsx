import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CircleTip,
  Icon,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  showToast,
  useColorMerge,
  useCopyState,
} from "@biqpod/app/ui/hooks";
import { Nothing } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
export interface ChoosTypeProps {
  onDone: (type: "multiple" | "single") => void;
}
export const ChoosType = ({ onDone }: ChoosTypeProps) => {
  const type = useCopyState<"multiple" | "single" | Nothing>(null);
  const isSingle = type.get === "single";
  const isMultiple = type.get === "multiple";
  return (
    <Card>
      <div className="flex justify-between items-center p-2">
        <span>
          <Translate content="select type" />
        </span>
        <div>
          <CircleTip icon={allIcons.solid.faXmark} />
        </div>
      </div>
      <Line />
      <div className="flex justify-evenly items-center space-x-4 p-2 h-full">
        <label
          className={tw(
            "flex flex-col justify-evenly items-center gap-2 p-2 border border-transparent border-solid rounded-3xl w-[100px] h-[100px] text-2xl cursor-pointer",
            isSingle &&
              "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color] border-[--biqpod-borders-color]"
          )}
        >
          <div>
            <Icon icon={allIcons.solid.faDollarSign} />
          </div>
          <input
            type="radio"
            name="postType"
            value="single"
            checked={isSingle}
            onChange={() => {
              type.set("single");
            }}
            hidden
          />
          <span>
            <Translate content="single" />
          </span>
        </label>
        <label
          className={tw(
            "flex flex-col justify-evenly items-center gap-2 p-2 border border-transparent border-solid rounded-3xl w-[100px] h-[100px] text-2xl cursor-pointer",
            isMultiple &&
              "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color] border-[--biqpod-borders-color]"
          )}
        >
          <div>
            <Icon icon={allIcons.solid.faTags} />
          </div>
          <input
            type="radio"
            name="postType"
            value="multiple"
            checked={isMultiple}
            hidden
            onClick={() => {
              type.set("multiple");
            }}
          />
          <span>
            <Translate content="multiple" />
          </span>
        </label>
      </div>
      <Line />
      <div className="p-2">
        <Button
          onClick={() => {
            if (!type.get) {
              showToast("please select type", "warning");
              return;
            }
            closePopup();
            onDone(type.get);
          }}
          icon={allIcons.solid.faCheckCircle}
        >
          <Translate content="select" />
        </Button>
      </div>
    </Card>
  );
};
