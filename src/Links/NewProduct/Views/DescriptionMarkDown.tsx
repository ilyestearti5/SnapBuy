import { MarkDown } from "@biqpod/app/ui/components";
import { fieldHooks } from "@biqpod/app/ui/hooks";
export const PostDescriptionMarkDown = () => {
  const description = fieldHooks.getOneFeild(
    "product-form-description",
    "value"
  );
  return (
    <div className="p-3">
      <MarkDown value={description || "**No Description Provided**"} />
    </div>
  );
};
