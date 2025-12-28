import { BooleanField } from "@biqpod/app/ui/components";
import { useCopyState } from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { useEffect } from "react";

interface KeyLineProps {
  prodKey: keyof Biqpod.Snapbuy.Product;
  value: boolean;
  onChange: (value: boolean) => void;
}
export const KeyLine = ({ prodKey, onChange, value }: KeyLineProps) => {
  const state = useCopyState<Biqpod.System.Setting.Value["boolean"]>(value);
  useEffect(() => {
    if (state.get != value) {
      onChange(!!state.get);
    }
  }, [state.get]);
  return (
    <div className="flex items-center gap-2 p-2">
      <BooleanField state={state} id={`${prodKey}-key`} />
      <span className="text-xl capitalize">{prodKey}</span>
    </div>
  );
};
