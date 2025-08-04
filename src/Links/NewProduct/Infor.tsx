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
  snapbuyApi,
  useCategories,
  useFormAvailable,
  useFormCategory,
  useFormCollection,
  useFormKeys,
  useFormLimited,
} from "../../apis";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { useStoreId } from "../../utils";
export const ProductInfo = () => {
  const category = useFormCategory();
  const limited = useFormLimited();
  const categories = useCategories();
  const isAvailable = useFormAvailable();
  const keysState = useFormKeys();
  const collection = useFormCollection();
  const storeId = useStoreId();
  const ordersCollections = useAsyncMemo(async () => {
    if (storeId) return snapbuyApi.forms.getCollections("order");
    return [];
  }, [storeId]);
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
          htmlFor="product-collection"
        >
          <Translate content="collection" /> :
        </label>
        <div className="w-full">
          {ordersCollections && (
            <EnumField
              state={collection}
              config={{
                list: ordersCollections.map((collection) => {
                  return {
                    value: collection.id!,
                    content: collection.name,
                  };
                }),
                search: ordersCollections.length >= 6,
              }}
              id="product-collection"
            />
          )}
        </div>
      </div>
      <div className="flex justify-between items-center gap-2 p-2">
        <label
          className="w-full text-right capitalize"
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
          htmlFor="product-form-available"
        >
          <Translate content="available" /> :
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
