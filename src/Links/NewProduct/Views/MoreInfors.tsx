import { createRef, useEffect, useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  ArrayField,
  CircleTip,
  Line,
  Scroll,
  Translate,
  FilterField,
} from "@biqpod/app/ui/components";
import { useCopyState } from "@biqpod/app/ui/hooks";
import { delay } from "@biqpod/app/ui/utils";
import { useFormColors, useFormKeys, useFormSizes } from "../../../apis";
export const PostMoreInfo = () => {
  const colorsState = useFormColors();
  const sizesState = useFormSizes();
  const keysState = useFormKeys();
  const colors = useMemo(() => colorsState.get || [], [colorsState.get]);
  const choisedColor = useCopyState<string | null>(null);
  const inputColorElement = createRef<HTMLInputElement>();
  useEffect(() => {}, [colorsState.get, sizesState.get, keysState.get]);
  return (
    <Scroll>
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label
          className="w-full md:text-right capitalize"
          htmlFor="post-colors"
        >
          <Translate content="colors" /> :
        </label>
        <div className="relative flex justify-between w-full">
          <div className="flex items-center gap-1">
            {colorsState.get?.map((color, index) => {
              return (
                <div key={index}>
                  <div
                    onClick={() => {
                      colorsState.set(colors.filter((c) => c != color));
                    }}
                    className="rounded-full outline-[--biqpod-borders] outline-1 outline-solid outline-offset-2 max-md:w-[12px] md:w-[20px] max-md:h-[12px] md:h-[20px] cursor-pointer"
                    style={{
                      backgroundColor: color,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            {choisedColor.get &&
              !colorsState.get?.includes(choisedColor.get) && (
                <div
                  style={{
                    backgroundColor: choisedColor.get,
                  }}
                  className="border border-[--biqpod-borders] border-solid rounded-md w-[30px] h-[30px]"
                />
              )}
            <CircleTip
              onClick={() => {
                inputColorElement.current?.click();
              }}
              icon={
                choisedColor.get
                  ? allIcons.solid.faRotate
                  : allIcons.solid.faAdd
              }
            >
              <input
                type="color"
                ref={inputColorElement}
                onChange={async ({ currentTarget }) => {
                  await delay(500);
                  choisedColor.set(currentTarget.value);
                }}
                className="invisible absolute w-0 h-0 pointer-events-none"
              />
            </CircleTip>
            {choisedColor.get &&
              !colorsState.get?.includes(choisedColor.get) && (
                <CircleTip
                  onClick={() => {
                    if (choisedColor.get) {
                      colorsState.set([...colors, choisedColor.get]);
                      choisedColor.set(null);
                    }
                  }}
                  icon={allIcons.solid.faCheck}
                />
              )}
          </div>
        </div>
      </div>
      {/* sizes of Market */}
      <Line />
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label className="w-full md:text-right capitalize" htmlFor="post-sizes">
          <Translate content="Sizes" /> :
        </label>
        <div className="relative w-full">
          <FilterField
            state={sizesState}
            id="post-sizes"
            config={{
              list: [
                {
                  content: "SM",
                  value: "sm",
                },
                {
                  content: "MD",
                  value: "md",
                },
                {
                  content: "LG",
                  value: "lg",
                },
                {
                  content: "XL",
                  value: "xl",
                },
                {
                  content: "2XL",
                  value: "2xl",
                },
                {
                  content: "3XL",
                  value: "3xl",
                },
              ],
            }}
          />
        </div>
      </div>
      {/* keys of Market */}
      <Line />
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label className="w-full md:text-right capitalize" htmlFor="post-keys">
          <Translate content="Keys" /> :
        </label>
        <div className="relative w-full h-fit">
          <ArrayField state={keysState} config={{}} id="post-keys" />
        </div>
      </div>
    </Scroll>
  );
};
