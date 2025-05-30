import {
  Button,
  Card,
  CircleTip,
  EmptyComponent,
  Line,
  MultiScreenPage,
  Translate,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import {
  actionHooks,
  closePopup,
  execAction,
  fieldHooks,
  getFieldValue,
  isLoading,
  setFieldValue,
  setTemp,
  showToast,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { SettingValueType } from "@biqpod/app/ui/types";
import { range, tw } from "@biqpod/app/ui/utils";
import { ProductInfo } from "./Infor";
import { useEffect, useMemo } from "react";
import { ProductChoosThemeStyle } from "./Views/ChoiseTheme";
import { PostDataBeforePost } from "./Views/DataBeforePost";
import { ProductDescription } from "./Views/Description";
import { PostDescriptionMarkDown } from "./Views/DescriptionMarkDown";
import { ProductImages } from "./Views/Image";
import { PostMoreInfo } from "./Views/MoreInfors";
import { PostInforPrice } from "./Views/ProductInforPrice";
import { ProductPricingType } from "./Views/ProductType";
export interface ProductFormSectionProps {
  product?: Partial<SnapBuy.Product>;
}
export function useField(fieldId: string) {
  return fieldHooks.useOneFeild(fieldId, "value");
}
const buttonContents: Record<number, string | undefined> = {
  2: "accepte",
  // last one must be done
};
const pages = [
  { name: "Product Info", component: ProductInfo },
  { name: "Images", component: ProductImages },
  { name: "Type", component: ProductPricingType },
  { name: "Price Info", component: PostInforPrice },
  { name: "Description", component: ProductDescription },
  { name: "Description (Markdown)", component: PostDescriptionMarkDown },
  { name: "More Info", component: PostMoreInfo },
  { name: "Theme Choice", component: ProductChoosThemeStyle },
  { name: "Data Before Post", component: PostDataBeforePost },
];
const pagesOnly = pages.map((page) => page.component);
export interface PostNewProductProps {
  product?: Partial<SnapBuy.Product>;
}
export const PostNewProduct = ({ product }: PostNewProductProps) => {
  // fields
  const images = useTemp<string[]>("product-images");
  const price = useTemp<number | undefined>("product-price");
  const category = useTemp<string | undefined>("post-category");
  const limited = useTemp<boolean>("product-limited");
  const prices = useTemp<
    Required<SnapBuy.Product>["multiple"]["prices"] | undefined
  >("product-prices");
  const quantity = useTemp<number | undefined>("post-quantity");
  const description = getFieldValue("product-form-description");
  const name = getFieldValue("product-form-name");
  const theme = useTemp<SnapBuy.Product["theme"]>("product-choised-theme");
  const colorsState = useTemp<string[]>("post-colors");
  const sizesState = useTemp<SettingValueType["filter"]>("post-sizes");
  const keysState = useTemp<SettingValueType["array"]>("post-keys");
  const isAvailable = useTemp<boolean>("product-form-available");
  const type = useTemp<"single" | "multiple">("post-type");
  const postMarketAction = actionHooks.getOne("post-market");
  const postActionStatus = actionHooks.getOneFeild("post-market", "status");
  const postIsLoading = isLoading(postMarketAction);
  useEffect(() => {
    if (postMarketAction?.status === "success") {
      showToast("Posted Successfully", "success");
    }
  }, [postMarketAction?.status]);
  const focusedSection = useTemp<number>("post-focused");
  const focused = useMemo(() => focusedSection.get || 0, [focusedSection.get]);
  useEffect(() => {
    focusedSection.set(0);
  }, []);

  useEffect(() => {
    setFieldValue("product-form-name", product?.name || "");
    setFieldValue("product-form-description", product?.description || "");
    setTemp("product-images", product?.photos || []);
    setTemp("product-limited", product?.limited || false);
    setTemp("post-colors", product?.colors || []);
    setTemp("post-sizes", product?.sizes || []);
    setTemp("post-keys", product?.keys || []);
    setTemp("post-quantity", product?.quantity || 0);
    setTemp("product-form-available", product?.available || false);
    setTemp("post-type", product?.type || "single");
    setTemp("post-category", product?.category || "");
    setTemp("product-price", product?.single?.price || 0);
    setTemp("product-prices", product?.multiple?.prices || []);
  }, [product]);

  return (
    <EmptyComponent>
      {product !== null && postActionStatus != "loading" && (
        <Card className="relative justify-between max-md:border-none max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:h-[70vh] overflow-hidden">
          <div className="flex justify-between items-center p-2">
            <h1 className="text-2xl capitalize">
              {product ? (
                <Translate content="modifie product" />
              ) : (
                <Translate content="add product" />
              )}
            </h1>
            <div className="flex">
              <CircleTip
                icon={allIcons.solid.faXmark}
                onClick={() => {
                  closePopup();
                }}
              />
            </div>
          </div>
          <Line />
          <div className="relative h-full overflow-hidden">
            <MultiScreenPage
              focused={focused || 0}
              pages={pagesOnly.map((Page, index) => (
                <Page key={index} product={product} />
              ))}
            />
          </div>
          <Line />
          <div className="flex justify-center gap-1 p-2">
            {range(pages.length).map((index) => {
              const isPassed = index - 1 <= focused;
              var page = pages.at(index);
              return (
                <span
                  onClick={() => {
                    focusedSection.set(index - 1);
                  }}
                  title={page?.name}
                  className={tw(
                    "inline-block w-[30px] cursor-pointer rounded-full transition-[background] h-[30px] bg-[--biqpod-gray-opacity]",
                    isPassed && "bg-[--biqpod-primary]"
                  )}
                />
              );
            })}
          </div>
          <Line />
          <div className="flex justify-between gap-2 p-2">
            <div>
              <Button
                onClick={() => {
                  if (0 >= focused) {
                    return;
                  }
                  focusedSection.set(focused - 1);
                }}
                className={tw(
                  "bg-[--biqpod-gray-opacity] w-fit max-md:w-full text-[--biqpod-text-color]",
                  focused <= 0 && "cursor-not-allowed"
                )}
                icon={allIcons.solid.faArrowLeft}
              >
                <Translate content={"back"} />
              </Button>
            </div>
            {focused < pages.length - 1 && (
              <Button
                onClick={() => {
                  if (focused < pages.length - 1) {
                    focusedSection.set(focused + 1);
                  }
                }}
                className={tw(
                  "w-fit",
                  focused >= pages.length - 1 && "cursor-not-allowed"
                )}
                icon={allIcons.solid.faArrowRight}
              >
                <Translate content={buttonContents[focused] || "continue"} />
              </Button>
            )}
            {focused == pages.length - 1 && (
              <Button
                onClick={async () => {
                  const options = {
                    ...product,
                    category: category.get || null,
                    photos: images.get || [],
                    multiple: {
                      prices: prices.get || [],
                    },
                    single: {
                      price: price.get || null,
                    },
                    name,
                    description: description,
                    quantity: quantity.get || null,
                    colors: colorsState.get || null,
                    sizes: sizesState.get || null,
                    keys: keysState.get || null,
                    theme: theme.get || null,
                    type: type.get || null,
                    limited: limited.get || null,
                    available: isAvailable.get || null,
                  };
                  if (!product?.id) {
                    options.id = encodeURIComponent(crypto.randomUUID());
                  }
                  execAction(
                    "add-products",
                    product?.id
                      ? {
                          exists: [options],
                        }
                      : {
                          news: [options],
                        }
                  );
                }}
                className="w-fit"
                icon={allIcons.solid.faCheck}
              >
                <Translate content={product ? "modify" : "add"} />
              </Button>
            )}
          </div>
        </Card>
      )}
      {postIsLoading && (
        <Card>
          <div className="p-2 max-md:text-lg text-2xl capitalize">
            <Translate content="waiting for moment to upload previous product" />
          </div>
        </Card>
      )}
    </EmptyComponent>
  );
};
