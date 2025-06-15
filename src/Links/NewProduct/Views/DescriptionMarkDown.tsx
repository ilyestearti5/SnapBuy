import { MarkDown } from "@biqpod/app/ui/components";
import { getFormDescription } from "../../../apis";
export const PostDescriptionMarkDown = () => {
  const description = getFormDescription();
  return (
    <div className="p-3">
      <MarkDown value={description || "**No Description Provided**"} />
    </div>
  );
};
