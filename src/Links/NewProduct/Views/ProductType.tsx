import { allIcons } from "@biqpod/app/ui/apis";
import { Icon, Translate } from "@biqpod/app/ui/components";
import { tw } from "@biqpod/app/ui/utils";
import { getFormType, setFormType } from "../../../apis";
export const ProductPricingType = () => {
  const postType = getFormType();
  const isSingle = postType === "single";
  const isMultiple = postType === "multiple";
  return (
    <div className="flex justify-evenly items-center space-x-4 p-2 h-full">
      <label
        className={tw(
          "flex flex-col justify-evenly items-center gap-2 p-2 border border-transparent border-solid rounded-3xl w-[100px] h-[100px] text-2xl cursor-pointer",
          isSingle &&
            "bg-[--biqpod-gray-opacity] text-[--biqpod-primary] border-[--biqpod-borders]"
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
            setFormType("single");
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
            "bg-[--biqpod-gray-opacity] text-[--biqpod-primary] border-[--biqpod-borders]"
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
          onChange={() => {
            setFormType("multiple");
          }}
          hidden
        />
        <span>
          <Translate content="multiple" />
        </span>
      </label>
    </div>
  );
};
