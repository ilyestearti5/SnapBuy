import React, { useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  ArrayFeild,
  CircleTip,
  EmptyComponent,
  FilterFeild,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { useColorMerge, useCopyState, useTemp } from "@biqpod/app/ui/hooks";
import { SettingValueType } from "@biqpod/app/ui/types";
import { delay } from "@biqpod/app/ui/utils";
export const PostMoreInfo = () => {
  const exts = useTemp<SettingValueType["filter"]>("post-extrainformation");
  const extraInformation = React.useMemo(
    () => (exts.get ? exts.get : []),
    [exts.get]
  );
  const colorsState = useTemp<string[]>("post-colors");
  const sizesState = useTemp<SettingValueType["filter"]>("post-sizes");
  const keysState = useTemp<SettingValueType["array"]>("post-keys");
  const colors = useMemo(() => colorsState.get || [], [colorsState.get]);
  const colorMerge = useColorMerge();
  const choisedColor = useCopyState<string | null>(null);
  const inputColorElement = React.createRef<HTMLInputElement>();
  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex flex-col gap-1 p-1">
        <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
          <label
            className="w-full md:text-right capitalize"
            htmlFor="post-extra-information"
          >
            <Translate content="extra information" /> :
          </label>
          <div className="relative w-full">
            <FilterFeild
              state={exts}
              config={{
                list: [
                  {
                    content: "Colors",
                    value: "colors",
                  },
                  {
                    content: "Sizes",
                    value: "sizes",
                  },
                  {
                    content: "Keys",
                    value: "keys",
                  },
                ],
              }}
              id="post-extra-information"
            />
          </div>
        </div>
      </div>
      <Scroll>
        {extraInformation.includes("colors") && (
          <EmptyComponent>
            <Line />
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
                          className="rounded-full outline-1 outline-solid outline-offset-2 max-md:w-[12px] md:w-[20px] max-md:h-[12px] md:h-[20px] cursor-pointer"
                          style={{
                            ...colorMerge({
                              outlineColor: "borders",
                            }),
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
                          ...colorMerge({
                            borderColor: "borders",
                          }),
                        }}
                        className="border border-transparent border-solid rounded-md w-[30px] h-[30px]"
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
          </EmptyComponent>
        )}
        {/* sizes of Market */}
        {extraInformation.includes("sizes") && (
          <EmptyComponent>
            <Line />
            <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
              <label
                className="w-full md:text-right capitalize"
                htmlFor="post-sizes"
              >
                <Translate content="Sizes" /> :
              </label>
              <div className="relative w-full">
                <FilterFeild
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
          </EmptyComponent>
        )}
        {/* keys of Market */}
        {extraInformation.includes("keys") && (
          <EmptyComponent>
            <Line />
            <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
              <label
                className="w-full md:text-right capitalize"
                htmlFor="post-keys"
              >
                <Translate content="Keys" /> :
              </label>
              <div className="relative w-full h-fit">
                <ArrayFeild state={keysState} config={{}} id="post-keys" />
              </div>
            </div>
          </EmptyComponent>
        )}
        {!extraInformation.length && (
          <div className="p-2 text-center">No Extra Infromations 💤</div>
        )}
      </Scroll>
    </div>
  );
};
