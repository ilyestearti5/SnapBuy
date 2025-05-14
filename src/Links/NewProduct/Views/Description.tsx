import { useEffect, useMemo } from "react";
import { allIcons } from "@biqpod/app/ui/apis";
import { CircleTip, Field } from "@biqpod/app/ui/components";
import {
  execAction,
  getFieldValue,
  isLoading,
  setFieldValue,
  useAction,
  useAllWord,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { delay, mergeObject, tw } from "@biqpod/app/ui/utils";
import { ProductFormSectionProps } from "../NewProduct";
import { ai } from "../../../server";
export const ProductDescription = ({ product }: ProductFormSectionProps) => {
  const name = getFieldValue("product-form-name");
  const colorsState = useTemp<string[]>("post-colors");
  const sizesState = useTemp<string[]>("post-sizes");
  const keysState = useTemp<string[]>("post-keys");
  const price = useTemp<number | undefined>("product-price");
  const quantity = useTemp<number | undefined>("post-quantity");
  const category = useTemp<string | undefined>("post-category");
  const props = useMemo(() => {
    return mergeObject(
      {
        title: name,
        price,
      },
      quantity.get && {
        quantity: quantity.get,
      },
      category.get && {
        category: category.get,
      },
      colorsState.get && {
        colors: colorsState.get,
      },
      sizesState.get && {
        sizes: sizesState.get,
      },
      keysState.get && {
        keys: keysState.get,
      }
    );
  }, [
    name,
    quantity.get,
    category.get,
    colorsState.get,
    sizesState.get,
    keysState.get,
    price,
  ]);
  const generateDescriptionAction = useAction(
    "generate-product-form-description",
    async () => {
      await delay(1000);
      const result = await ai.sendMessage(
        "generate a description for a post haves this props (make sure insert emojiyes) : " +
          Object.entries(props)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
      );
      setFieldValue(
        "product-form-description",
        result?.message || "No description generated"
      );
    },
    [props]
  );
  const generateLoading = isLoading(generateDescriptionAction);
  const allWords = useAllWord();
  useEffect(() => {
    setFieldValue("product-form-description", product?.description || "");
  }, []);
  return (
    <div className="relative p-2 w-full h-full">
      <Field
        inputName="product-form-description"
        multiLines
        placeholder="Enter Description"
        propositions={allWords}
        className="rounded-2xl h-full"
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
