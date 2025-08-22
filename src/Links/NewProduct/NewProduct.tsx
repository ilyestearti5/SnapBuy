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
  closePopup,
  execAction,
  getAction,
  isLoading,
  showToast,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { range, tw } from "@biqpod/app/ui/utils";
import { ProductInfo } from "./Infor";
import { useEffect, useMemo } from "react";
import { ProductDataBeforeCreate } from "./Views/DataBeforePost";
import { ProductDescription } from "./Views/Description";
import { ProductImages } from "./Views/Image";
import { PostInforPrice } from "./Views/ProductInforPrice";
import { ProductPricingType } from "./Views/ProductType";
import { useFormProduct, setFormProduct } from "../../apis/getFns";
export interface ProductFormSectionProps {
  product?: Partial<SnapBuy.Product>;
}
const buttonContents: Record<number, string | undefined> = {
  2: "accepte",
  // last one must be done
};
const pages = [
  { name: "Images", component: ProductImages },
  { name: "Product Info", component: ProductInfo },
  { name: "Type", component: ProductPricingType },
  { name: "Price Info", component: PostInforPrice },
  { name: "Description", component: ProductDescription },
  { name: "Data Before Post", component: ProductDataBeforeCreate },
];
const pagesOnly = pages.map((page) => page.component);
export interface PostNewProductProps {
  product?: Partial<SnapBuy.Product>;
}
export const PostNewProduct = ({ product }: PostNewProductProps) => {
  const postMarketAction = getAction("post-market");
  const postIsInLoading = isLoading(postMarketAction);
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
    setFormProduct(product);
  }, [product]);
  const productForm = useFormProduct();
  return (
    <EmptyComponent>
      {product !== null && !postIsInLoading && (
        <Card className="relative justify-between max-md:border-none max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:h-[70vh] overflow-hidden">
          <div className="flex justify-between items-center p-2">
            <h1 className="text-2xl capitalize">
              <Translate
                content={product ? "modifie product" : "add product"}
              />
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
                <Page key={index} />
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
                    ...productForm,
                  };
                  if (product?.id) {
                    options.id = product.id;
                  } else {
                    options.id = encodeURIComponent(crypto.randomUUID());
                  }
                  options.uid = product?.uid || "";
                  options.storeId = product?.storeId || "";
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
