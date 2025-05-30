import { allIcons } from "@biqpod/app/ui/apis";
import { Icon, Translate } from "@biqpod/app/ui/components";
import { getTemp, setTemp, useColorMerge } from "@biqpod/app/ui/hooks";
import { tw } from "@biqpod/app/ui/utils";
import { ProductFormSectionProps } from "../NewProduct";
import { useEffect } from "react";

export const ProductPricingType = ({ product }: ProductFormSectionProps) => {
  const postType = getTemp<"multiple" | "single">("post-type");
  const colorMerge = useColorMerge();
  const isSingle = postType === "single";
  const isMultiple = postType === "multiple";
  useEffect(() => {
    setTemp("post-type", product?.type === "multiple" ? "multiple" : "single");
  }, []);
  return (
    <div className="flex justify-evenly items-center space-x-4 p-2 h-full">
      <label
        style={{
          ...colorMerge(
            isSingle && "gray.opacity",
            isSingle && {
              color: "primary",
              borderColor: "borders",
            }
          ),
        }}
        className={tw(
          "flex flex-col justify-evenly items-center gap-2 p-2 border border-transparent border-solid rounded-3xl w-[100px] h-[100px] text-2xl cursor-pointer"
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
          onChange={() => setTemp("post-type", "single")}
          hidden
        />
        <span>
          <Translate content="single" />
        </span>
      </label>
      <label
        style={{
          ...colorMerge(
            isMultiple && "gray.opacity",
            isMultiple && {
              color: "primary",
              borderColor: "borders",
            }
          ),
        }}
        className={tw(
          "flex flex-col justify-evenly items-center gap-2 p-2 border border-transparent border-solid rounded-3xl w-[100px] h-[100px] text-2xl cursor-pointer"
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
          onChange={() => setTemp("post-type", "multiple")}
          hidden
        />
        <span>
          <Translate content="multiple" />
        </span>
      </label>
    </div>
  );
};
