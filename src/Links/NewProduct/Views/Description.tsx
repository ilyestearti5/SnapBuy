import { allIcons } from "@biqpod/app/ui/apis";
import { CircleTip, Field } from "@biqpod/app/ui/components";
import {
  execAction,
  isLoading,
  setFieldValue,
  useAction,
  useAllWord,
} from "@biqpod/app/ui/hooks";
import { delay, tw } from "@biqpod/app/ui/utils";
import { snapbuyApi } from "../../../apis";
import { useFormProduct } from "../../../apis/getFns";
export const ProductDescription = () => {
  const product = useFormProduct();
  const generateDescriptionAction = useAction(
    "generate-product-form-description",
    async () => {
      await delay(1000);
      const result = await snapbuyApi.generateProductDescription(product);
      setFieldValue(
        "product-form-description",
        result || "No description generated"
      );
    },
    [product]
  );
  const generateLoading = isLoading(generateDescriptionAction);
  const allWords = useAllWord();
  return (
    <div className="relative p-2 w-full h-full">
      <Field
        inputName="product-form-description"
        multiLines
        placeholder="Enter Description"
        propositions={allWords}
        rows={10}
        className="rounded-2xl h-full min-h-[150px]"
      />
      <span className="top-4 right-4 absolute">
        <CircleTip
          onClick={async () => {
            if (generateLoading) {
              return;
            }
            execAction("generate-product-form-description");
          }}
          iconClassName={tw(generateLoading && "animate-spin")}
          icon={
            generateLoading ? allIcons.solid.faRotate : allIcons.solid.faBrain
          }
          className={tw(
            "rounded-full min-w-[40px] h-[40px] transition-[width]",
            generateLoading &&
              "bg-[--biqpod-gray-opacity] text-[--biqpod-text-color]"
          )}
        />
      </span>
    </div>
  );
};
