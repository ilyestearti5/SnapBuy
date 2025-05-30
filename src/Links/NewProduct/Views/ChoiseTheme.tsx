import { Icon, Line, Translate } from "@biqpod/app/ui/components";
import {
  ColorIds,
  useColorMerge,
  useCopyState,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { allIcons } from "@biqpod/app/ui/apis";
import { mergeObject } from "@biqpod/app/ui/utils";
import { ChromePicker as ColorPicker } from "react-color";
import { ProductFormSectionProps } from "../NewProduct";
import { useEffect } from "react";
export interface Colors {
  colorId: ColorIds;
  name: string;
}
export var colors: Colors[] = [
  {
    colorId: "primary",
    name: "Primary",
  },
  {
    colorId: "secondary",
    name: "Secondary",
  },
  {
    colorId: "primary.background",
    name: "Background",
  },
  {
    colorId: "secondary.background",
    name: "Sec Background",
  },
  {
    colorId: "text.color",
    name: "Text",
  },
];
interface ChoosColorProps {
  onChange: (color: string) => void;
  color?: string;
  colorId: ColorIds;
}
export const ChoosColor = ({ color, colorId, onChange }: ChoosColorProps) => {
  const colorMerge = useColorMerge();
  const show = useCopyState(false);
  return (
    <div className="inline-block relative w-[30px] h-[30px]">
      <div
        className="border border-[--biqpod-borders] border-solid rounded-md w-full h-full"
        style={{
          ...colorMerge(colorId),
          ...mergeObject(
            color && {
              backgroundColor: color,
            }
          ),
        }}
        onClick={() => {
          show.set(!show.get);
        }}
      />
      {show.get && (
        <ColorPicker
          className="top-full left-full z-[10] absolute"
          color={color}
          onChange={(updatedColor) => {
            onChange(updatedColor.hex);
          }}
          styles={{
            default: {
              picker: colorMerge("primary.background"),
            },
          }}
        />
      )}
    </div>
  );
};
export const ProductChoosThemeStyle = ({
  product,
}: ProductFormSectionProps) => {
  const colorMerge = useColorMerge();
  const colorsState = useTemp<SnapBuy.Product["theme"]>(
    "product-choised-theme"
  );
  useEffect(() => {
    if (product?.theme) {
      colorsState.set(product.theme);
    }
  }, []);
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        style={{
          ...colorMerge("primary.background", {
            color: "primary",
          }),
        }}
        className="flex justify-center items-center gap-2 p-3 max-md:text-xl md:text-3xl capitalize"
      >
        <span style={{ color: "orange" }}>
          <Icon icon={allIcons.solid.faZap} />
        </span>
        <Translate content="additionally post configuration" />
      </div>
      <Line />
      <div>
        {colors.map(({ colorId, name }) => {
          const selectedColor = colorsState.get?.[colorId];
          const id = colorId.replace(".", "_");
          return (
            <div className="flex items-center gap-4 p-3" key={id}>
              <div className="w-full text-right">{name} : </div>
              <div className="relative w-full">
                <ChoosColor
                  color={selectedColor}
                  colorId={colorId}
                  onChange={(color) => {
                    colorsState.set((prev) => {
                      return {
                        ...prev,
                        [colorId]: color,
                      };
                    });
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
