import { createRef, useEffect, useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  ArrayField,
  CircleTip,
  EmptyComponent,
  Line,
  Scroll,
  Translate,
  FilterField,
} from "@biqpod/app/ui/components";
import { useColorMerge, useCopyState, useTemp } from "@biqpod/app/ui/hooks";
import { SettingValueType } from "@biqpod/app/ui/types";
import { delay } from "@biqpod/app/ui/utils";
import { ProductFormSectionProps } from "../NewProduct";
export const PostMoreInfo = ({ product }: ProductFormSectionProps) => {
  const exts = useTemp<SettingValueType["filter"]>("post-extrainformation");
  const extraInformation = useMemo(
    () => (exts.get ? exts.get : []),
    [exts.get]
  );
  const colorsState = useTemp<string[]>("post-colors");
  const sizesState = useTemp<SettingValueType["filter"]>("post-sizes");
  const keysState = useTemp<SettingValueType["array"]>("post-keys");
  const colors = useMemo(() => colorsState.get || [], [colorsState.get]);
  const colorMerge = useColorMerge();
  const choisedColor = useCopyState<string | null>(null);
  const inputColorElement = createRef<HTMLInputElement>();
  useEffect(() => {
    var fullListFilter: string[] = [];
    if (product?.colors?.length) {
      colorsState.set(product.colors);
      fullListFilter.push("colors");
    } else {
      colorsState.set([]);
    }
    if (product?.sizes?.length) {
      sizesState.set(product.sizes);
      fullListFilter.push("sizes");
    } else {
      sizesState.set([]);
    }
    if (product?.keys?.length) {
      keysState.set(product.keys);
      fullListFilter.push("keys");
    } else {
      keysState.set([]);
    }
    exts.set(fullListFilter);
  }, []);
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
            <FilterField
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
                <ArrayField state={keysState} config={{}} id="post-keys" />
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
