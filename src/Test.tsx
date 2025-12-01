import { Button } from "@biqpod/app/ui/components";
import { memo } from "react";
export const TestGrid = memo(() => {
  return (
    <div className="flex justify-center items-center w-full h-full">
      <Button onClick={async () => {}} className="w-fit">
        Start Validate
      </Button>
    </div>
  );
});
