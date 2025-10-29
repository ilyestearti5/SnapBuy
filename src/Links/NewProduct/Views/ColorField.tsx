import React, { useCallback } from "react";
import { ChromePicker as Picker, ColorResult } from "react-color";
import { Button, Card, CircleTip, Icon, Line } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  getMagicField,
  setMagicField,
  useCopyState,
} from "@biqpod/app/ui/hooks";
interface ColorFieldProps {
  fieldId: string;
  placeholder?: string;
  hint?: string;
}
export const ColorField: React.FC<ColorFieldProps> = ({
  fieldId,
  placeholder = "Select colors using the color picker",
  hint = "Use the color picker to add colors",
}) => {
  const showPicker = useCopyState(false);
  // Get current colors from temp storage
  const currentColors = getMagicField<string[]>(fieldId) || [];
  const addColor = useCallback(
    (color: string) => {
      if (!color.trim()) return;
      const normalizedColor = color.trim().toLowerCase();
      const updatedColors = [...currentColors];
      // Avoid duplicates
      if (!updatedColors.includes(normalizedColor)) {
        updatedColors.push(normalizedColor);
        setMagicField(fieldId, updatedColors);
      }
    },
    [currentColors, fieldId]
  );
  const removeColor = useCallback(
    (index: number) => {
      setMagicField(
        fieldId,
        currentColors.filter((_, i) => i !== index)
      );
    },
    [currentColors, fieldId]
  );
  const handleColorPickerChange = useCallback(
    (color: ColorResult) => {
      addColor(color.hex);
      showPicker.set(false);
      colorState.set(null);
    },
    [addColor]
  );
  const clearAllColors = useCallback(() => {
    setMagicField(fieldId, []);
  }, [fieldId]);
  const colorState = useCopyState<ColorResult | null>(null);
  return (
    <div className="space-y-3">
      <style>{`
        .chrome-picker > div:last-child > div:last-child {
          display: none !important;
        }
      `}</style>
      {/* Hint */}
      {hint && <p className="text-[--biqpod-gray-opacity-2] text-sm">{hint}</p>}
      {/* Header with Clear All button */}
      {currentColors.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="font-medium text-gray-700 text-sm">
            Selected Colors ({currentColors.length})
          </p>
          <button
            onClick={clearAllColors}
            className="font-medium text-red-500 hover:text-red-700 text-xs transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
      {/* Current Colors Display */}
      <div className="flex flex-wrap gap-2 bg-[--biqpod-field-background] p-3 border border-[--biqpod-borders] border-solid rounded-lg min-h-[50px]">
        {currentColors.length === 0 ? (
          <span className="self-center text-[--biqpod-gray-opacity] text-sm">
            {placeholder}
          </span>
        ) : (
          currentColors.map((color, index) => {
            // Display the color as is since we removed predefined colors
            const displayName = color;
            return (
              <div
                key={index}
                className="flex items-center gap-2 bg-white shadow-sm hover:shadow-md px-3 py-2 border border-gray-200 rounded-full transition-shadow"
              >
                <div
                  className="shadow-inner border border-gray-300 rounded-full w-5 h-5"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-gray-700 text-sm">
                  {displayName}
                </span>
                <button
                  onClick={() => removeColor(index)}
                  className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove color"
                >
                  <Icon icon={allIcons.solid.faTimes} iconClassName="text-xs" />
                </button>
              </div>
            );
          })
        )}
      </div>
      {/* Add Color Controls */}
      <div className="space-y-2">
        {/* Color Picker Button */}
        <div>
          <p className="mb-2 font-medium text-gray-700 text-sm">
            Color Picker:
          </p>
          <div className="relative w-fit">
            <Button
              onClick={() => {
                showPicker.set(!showPicker.get);
                // Initialize with red color if no color is selected
                if (!showPicker.get && !colorState.get) {
                  colorState.set({ hex: "#ff0000" } as ColorResult);
                }
              }}
              className="flex items-center gap-2 shadow-sm px-4 py-2 border border-[--biqpod-borders] rounded-lg w-fit transition-colors"
              rightIcon={allIcons.solid.faChevronDown}
            >
              <span className="font-medium text-sm">Open Color Picker</span>
            </Button>
            {/* Color Picker Popup */}
            {showPicker.get && (
              <Card className="mt-2 w-[calc(100%+40px)] overflow-hidden">
                <Picker
                  color={colorState.get ? colorState.get.hex : "#ff0000"}
                  onChange={colorState.set}
                  styles={{
                    default: {
                      picker: {
                        width: "100%",
                        background: "var(--biqpod-primary-background)",
                      },
                    },
                  }}
                />
                <Line />
                <div className="flex justify-between items-center bg-[--biqpod-primary-background] p-2">
                  <span />
                  <CircleTip
                    onClick={() => {
                      handleColorPickerChange(colorState.get!);
                    }}
                    icon={allIcons.solid.faCheck}
                  />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
