import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  CircleTip,
  EmptyComponent,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import { useCopyState } from "@biqpod/app/ui/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export interface FilterOption {
  key: string;
  label: string;
  component: ReactNode;
}

interface SlidingFilterProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value?: T;
  onChange: (value: T) => void;
  options: FilterOption[];
  onClear?: () => void;
}

export function SlidingFilter<T extends Record<string, any>>({
  isOpen,
  onClose,
  title,
  value,
  onChange,
  options,
  onClear,
}: SlidingFilterProps<T>) {
  const filterStates = options.reduce((acc, option) => {
    acc[option.key] = useCopyState<string | null>(value?.[option.key] || null);
    return acc;
  }, {} as Record<string, any>);

  const handleClear = () => {
    options.forEach((option) => {
      filterStates[option.key].set(null);
    });
    onChange({} as T);
    if (onClear) onClear();
    onClose();
  };

  const handleApply = () => {
    const newValue = options.reduce((acc, option) => {
      acc[option.key] = filterStates[option.key].get;
      return acc;
    }, {} as any);
    onChange(newValue);
    onClose();
  };

  return (
    <EmptyComponent>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-[1000] absolute inset-0"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      {/* Sliding Filter Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? 0 : "100%" }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="top-0 right-0 z-[1001] absolute flex flex-col shadow-2xl backdrop-blur-md border-[--biqpod-borders] border-l border-solid w-96 max-w-[90vw] h-full overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="font-semibold text-xl capitalize">
            <Translate content={title} />
          </h1>
          <CircleTip icon={allIcons.solid.faXmark} onClick={onClose} />
        </div>
        <Line />
        <div className="flex flex-col flex-1 gap-6 p-6 h-full overflow-y-auto">
          {options.map((option) => (
            <div key={option.key} className="flex flex-col gap-3">
              <label className="font-semibold text-sm capitalize">
                <Translate content={option.label} />
              </label>
              {option.component}
            </div>
          ))}
        </div>
        {/* Action Buttons */}
        <div className="flex gap-3 bg-[--biqpod-background] p-6 border-t">
          <Button
            onClick={handleClear}
            className="flex-1 bg-[--biqpod-gray-opacity] hover:bg-[--biqpod-gray-opacity-2] rounded-xl text-[--biqpod-text-color]"
          >
            <Translate content="clear filters" />
          </Button>
          <Button onClick={handleApply} className="flex-1 rounded-xl">
            <Translate content="apply filters" />
          </Button>
        </div>
      </motion.div>
    </EmptyComponent>
  );
}
