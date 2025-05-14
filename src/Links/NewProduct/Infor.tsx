import { useEffect } from "react";
import {
  BooleanFeild,
  EmptyComponent,
  EnumFeild,
  Field,
  Translate,
} from "@biqpod/app/ui/components";
import {
  setFieldValue,
  setTemp,
  useCopyState,
  useTemp,
  useUser,
} from "@biqpod/app/ui/hooks";
import { Nothing, SettingValueType } from "@biqpod/app/ui/types";
import { useCategories } from "../../apis";
import { ProductFormSectionProps } from "./NewProduct";
export const ProductInfo = ({ product }: ProductFormSectionProps) => {
  const category = useCopyState<string | Nothing>(null);
  const phone = useTemp<SettingValueType["pin"]>("post-phone");
  const user = useUser();
  useEffect(() => {
    phone.set(user?.phone || "");
  }, [user]);
  const categories = useCategories();
  const isAvailable = useTemp<SettingValueType["boolean"]>(
    "product-form-available"
  );
  useEffect(() => {
    category.set(product?.category);
    isAvailable.set(!!product?.available);
    setFieldValue("product-form-name", product?.name || "");
  }, []);

  useEffect(() => {
    setTemp("product-form-category", category.get);
  }, [category.get]);

  return (
    <EmptyComponent>
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label
          className="w-full md:text-right capitalize"
          htmlFor="product-form-name"
        >
          <Translate content="name" /> :
        </label>
        <Field
          className="text-md"
          inputName="product-form-name"
          placeholder="Enter Name"
        />
      </div>
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label
          className="w-full md:text-right capitalize"
          htmlFor="product-form-categorys"
        >
          <Translate content="category" /> :
        </label>
        <div className="w-full">
          <EnumFeild
            id="product-form-category"
            state={category}
            config={{
              list: (categories || []).map(({ category, emoji }) => {
                return {
                  value: category,
                  content: category + " " + emoji,
                };
              }),
              search: true,
            }}
          />
        </div>
      </div>
      <div className="flex justify-between items-center gap-2 p-2">
        <label
          className="w-full text-right capitalize"
          htmlFor="product-form-categorys"
        >
          <Translate content="avilable" /> :
        </label>
        <div className="w-full">
          <BooleanFeild id="product-form-available" state={isAvailable} />
        </div>
      </div>
    </EmptyComponent>
  );
};
