import {
  getTemp,
  setTemp,
  useTemp,
  getFieldValue,
  setFieldValue,
  useFieldValue,
} from "@biqpod/app/ui/hooks";
import { Nothing, Biqpod } from "@biqpod/app/ui/types";
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
} = getFns<Required<Biqpod.Snapbuy.Product>["multiple"]["prices"] | undefined>(
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
} = getFns<Biqpod.System.Setting.Value["array"]>("post-keys");
export const {
  get: getFormAvailable,
  set: setFormAvailable,
  use: useFormAvailable,
} = getFns<Biqpod.System.Setting.Value["boolean"]>("product-form-available");
export const {
  get: getFormType,
  set: setFormType,
  use: useFormType,
} = getFns<"single" | "multiple">("post-type");
export const {
  get: getFormPhotos,
  set: setFormPhotos,
  use: useFormPhotos,
} = getFns<Biqpod.Snapbuy.Product["photos"]>("product-images");
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
} = getFns<Biqpod.System.Setting.Value["boolean"]>("product-limited");
export const {
  get: getFormBrand,
  set: setFormBrand,
  use: useFormBrand,
} = getFns<string | Nothing>("product-brand");
export const {
  get: getFormMetadata,
  set: setFormMetadata,
  use: useFormMetadata,
} = getFns<Partial<Record<string, Biqpod.Snapbuy.MetadataField>>>(
  "product-metadata"
);
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
  const metadata = getFormMetadata();
  const product = useMemo(() => {
    // Convert metadata array to object format
    const result: Partial<Biqpod.Snapbuy.Product> = {
      photos: photos || [],
      type: type || "single",
      name: name || "",
      available: isAvailable ?? true,
      keys: keys || [],
      quantity: quantity || 0,
      description: description || "",
      limited: limited || false,
      metaData: metadata || {},
    };
    if (type === "multiple") {
      result.multiple = {
        prices: prices || [],
      };
    } else {
      const options: Required<Biqpod.Snapbuy.Product>["single"] = {};
      if (clientPrice) {
        options.client = clientPrice;
      }
      if (customerPrice) {
        options.customer = customerPrice;
      }
      result.single = options;
    }
    if (brandId && brandId !== "") {
      result.brandId = brandId;
    }
    return result;
  }, [
    photos,
    clientPrice,
    customerPrice,
    limited,
    prices,
    quantity,
    description,
    name,
    keys,
    isAvailable,
    type,
    brandId,
    metadata,
  ]);
  return product;
};
export const setFormProduct = (value?: Partial<Biqpod.Snapbuy.Product>) => {
  // Always set all form fields, using the provided value or appropriate defaults
  setFormAvailable(value?.available ?? true);
  setFormKeys(value?.keys ?? []);
  setFormQuantity(value?.quantity ?? 0);
  setFormDescription(value?.description ?? "");
  setFormName(value?.name ?? "");
  setFormPhotos(value?.photos ?? []);
  setFormClientPrice(value?.single?.client ?? undefined);
  setFormCustomerPrice(value?.single?.customer ?? undefined);
  setFormLimited(value?.limited ?? false);
  setFormBrand(value?.brandId ?? "");
  setFormType(value?.type ?? "single");

  // Handle multiple prices
  if (value?.type === "multiple" && value?.multiple?.prices) {
    setFormPrices(value.multiple.prices);
  } else {
    setFormPrices(undefined);
  }

  // Convert metaData object back to array format for form
  if (value?.metaData) {
    setFormMetadata(value?.metaData);
  } else {
    // Clear metadata if not provided
    setFormMetadata({});
  }
};

// Function to clear all form data (useful for creating new products)
export const clearFormProduct = () => {
  setFormAvailable(true); // Default to available for new products
  setFormKeys([]);
  setFormQuantity(0);
  setFormDescription("");
  setFormName("");
  setFormPhotos([]);
  setFormClientPrice(undefined);
  setFormCustomerPrice(undefined);
  setFormLimited(false);
  setFormBrand("");
  setFormType("single");
  setFormPrices(undefined);
  setFormMetadata({});
};
