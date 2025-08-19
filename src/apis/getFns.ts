import {
  getTemp,
  setTemp,
  useTemp,
  getFieldValue,
  setFieldValue,
  useFieldValue,
} from "@biqpod/app/ui/hooks";
import { SettingValueType, Nothing } from "@biqpod/app/ui/types";
import { useMemo } from "react";
function getFns<T>(fieldId: string) {
  const get = () => getTemp<T>(fieldId);
  const set = (value: T) => {
    setTemp(fieldId, value);
  };
  const use = () => {
    return useTemp<T>(fieldId);
  };
  return {
    get,
    use,
    set,
  };
}
export const useMarkets = () => {
  return getTemp<string[]>("markets");
};
export const useFocused = () => {
  return getTemp<string>("input.focused");
};
export const {
  get: getFormPrices,
  use: useFormPrices,
  set: setFormPrices,
} = getFns<Required<SnapBuy.Product>["multiple"]["prices"] | undefined>(
  "product-prices"
);
export const {
  get: getFormQuantity,
  set: setFormQuantity,
  use: useFormQuantity,
} = getFns<number | undefined>("post-quantity");
export const getFormDescription = () => {
  return getFieldValue("product-form-description");
};
export const setFormDescription = (value: string) => {
  setFieldValue("product-form-description", value);
};
export const useFormDescription = () => {
  return useFieldValue("product-form-description");
};
export const getFormName = () => {
  return getFieldValue("product-form-name");
};
export const setFormName = (value: string) => {
  setFieldValue("product-form-name", value);
};
export const useFormName = () => {
  return useFieldValue("product-form-name");
};
export const {
  get: getFormKeys,
  set: setFormKeys,
  use: useFormKeys,
} = getFns<SettingValueType["array"]>("post-keys");
export const {
  get: getFormAvailable,
  set: setFormAvailable,
  use: useFormAvailable,
} = getFns<boolean>("product-form-available");
export const {
  get: getFormType,
  set: setFormType,
  use: useFormType,
} = getFns<"single" | "multiple">("post-type");
export const {
  get: getFormPhotos,
  set: setFormPhotos,
  use: useFormPhotos,
} = getFns<SnapBuy.Product["photos"]>("product-images");
export const {
  get: getFormClientPrice,
  set: setFormClientPrice,
  use: useFormClientPrice,
} = getFns<number | undefined>("product-client-price");
export const {
  get: getFormCustomerPrice,
  set: setFormCustomerPrice,
  use: useFormCustomerPrice,
} = getFns<number | undefined>("product-customer-price");
export const {
  get: getFormLimited,
  use: useFormLimited,
  set: setFormLimited,
} = getFns<boolean>("product-limited");
export const {
  get: getFormBrand,
  set: setFormBrand,
  use: useFormBrand,
} = getFns<string | Nothing>("product-brand");
export const {
  get: getFormVarient,
  set: setFormVarient,
  use: useFormVarient,
} = getFns<string | Nothing>("product-varient");
export const useFormProduct = () => {
  const photos = getFormPhotos();
  const clientPrice = getFormClientPrice();
  const customerPrice = getFormCustomerPrice();
  const limited = getFormLimited();
  const prices = getFormPrices();
  const quantity = getFormQuantity();
  const description = getFormDescription();
  const name = getFormName();
  const keys = getFormKeys();
  const isAvailable = getFormAvailable();
  const type = getFormType();
  const brandId = getFormBrand();
  const varient = getFormVarient();
  const product = useMemo(() => {
    const result: Partial<SnapBuy.Product> = {
      photos: photos || [],
      type: type || "single",
      name: name || "",
      available: isAvailable || false,
      keys: keys || [],
      quantity: quantity || 0,
      description: description || "",
      limited: limited || false,
    };
    if (type === "multiple") {
      result.multiple = {
        prices: prices || [],
      };
    } else {
      const options: Required<SnapBuy.Product>["single"] = {};
      if (clientPrice) {
        options.client = clientPrice;
      }
      if (customerPrice) {
        options.customer = customerPrice;
      }
      result.single = options;
    }
    if (brandId && brandId !== "no-varient") {
      result.brandId = brandId;
    }
    if (varient && varient !== "no-varient") {
      result.varientId = varient;
    }
    return result;
  }, [
    photos,
    clientPrice,
    limited,
    prices,
    quantity,
    description,
    name,
    keys,
    isAvailable,
    type,
    brandId,
  ]);
  return product;
};
