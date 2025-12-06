import {
  BooleanField,
  EmptyComponent,
  EnumField,
  Field,
  Translate,
} from "@biqpod/app/ui/components";
import { snapbuyApi } from "../../apis";
import {
  useFormAvailable,
  useFormBrand,
  useFormLimited,
} from "../../apis/getFns";
import { useAsyncMemo } from "@biqpod/app/ui/hooks";
import { useStoreId } from "../../utils";
export const ProductInfo = () => {
  const limited = useFormLimited();
  const isAvailable = useFormAvailable();
  const brand = useFormBrand();
  const storeId = useStoreId();
  const brands = useAsyncMemo(async () => {
    if (storeId) return snapbuyApi.brands.getAll(storeId);
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
          htmlFor="product-brand"
        >
          <Translate content="brand" />{" "}
          <span className="text-[--biqpod-gray-opacity]">
            (<Translate content="optional" />)
          </span>{" "}
          :
        </label>
        <div className="w-full">
          {brands && (
            <EnumField
              state={brand}
              config={{
                list: [
                  {
                    value: "",
                    content: "No Brand",
                  },
                  ...brands.map((brand) => {
                    return {
                      value: brand.id!,
                      content: brand.name || "Unnamed Brand",
                    };
                  }),
                ],
                search: brands.length >= 6,
              }}
              id="product-brand"
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
    </EmptyComponent>
  );
};
