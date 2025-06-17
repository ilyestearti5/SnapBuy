import {
  ArrayField,
  BooleanField,
  EmptyComponent,
  EnumField,
  Field,
  Line,
  Translate,
} from "@biqpod/app/ui/components";
import {
  useCategories,
  useFormAvailable,
  useFormCategory,
  useFormKeys,
  useFormLimited,
} from "../../apis";
export const ProductInfo = () => {
  const category = useFormCategory();
  const limited = useFormLimited();
  const categories = useCategories();
  const isAvailable = useFormAvailable();
  const keysState = useFormKeys();
  return (
    <EmptyComponent>
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label
          className="w-full md:text-right capitalize"
          htmlFor="product-form-name"
        >
          <Translate content="name" /> :
        </label>
        <Field inputName="product-form-name" placeholder="Enter Name" />
      </div>
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label
          className="w-full md:text-right capitalize"
          htmlFor="product-form-categorys"
        >
          <Translate content="category" /> :
        </label>
        <div className="w-full">
          <EnumField
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
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label
          className="w-full md:text-right capitalize"
          htmlFor="product-limited"
        >
          <Translate content="limited" /> :
        </label>
        <div className="w-full">
          <BooleanField
            state={limited}
            config={{
              style: "switch",
            }}
            id="product-limited"
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
          <BooleanField id="product-form-available" state={isAvailable} />
        </div>
      </div>
      <Line />
      <div className="flex max-md:flex-col justify-between items-center gap-2 p-2">
        <label className="w-full md:text-right capitalize" htmlFor="post-keys">
          <Translate content="Keys" /> :
        </label>
        <div className="relative w-full h-fit">
          <ArrayField state={keysState} config={{}} id="post-keys" />
        </div>
      </div>
    </EmptyComponent>
  );
};
