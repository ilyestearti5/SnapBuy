import {
  Button,
  Card,
  CircleTip,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { closePopup, execAction } from "@biqpod/app/ui/hooks";
import { ProductInfo } from "./Infor";
import { useEffect } from "react";
import { ProductDataBeforeCreate } from "./Views/DataBeforePost";
import { ProductDescription } from "./Views/Description";
import { ProductFiles } from "./Views/Files";
import { PostInforPrice } from "./Views/ProductInforPrice";
import { ProductPricingType } from "./Views/ProductType";
import {
  useFormProduct,
  setFormProduct,
  clearFormProduct,
} from "../../apis/getFns";
import { ProductMetadata } from "./Views/ProductMetadata";
import { Biqpod } from "@biqpod/app/ui/types";
export interface ProductFormSectionProps {
  product?: Partial<Biqpod.Snapbuy.Product>;
}
const pages = [
  { name: "Files", component: ProductFiles },
  { name: "Information", component: ProductInfo },
  { name: "Pricing Type", component: ProductPricingType },
  { name: "Pricing", component: PostInforPrice },
  {
    name: "Metadata",
    component: ProductMetadata,
  },
  { name: "Description", component: ProductDescription },
  { name: "Final Data", component: ProductDataBeforeCreate },
];
export interface PostNewProductProps {
  product?: Partial<Biqpod.Snapbuy.Product>;
}
export const UpsertProduct = ({ product }: PostNewProductProps) => {
  useEffect(() => {
    if (product) {
      setFormProduct(product);
    } else {
      clearFormProduct();
    }
  }, [product]);
  const productForm = useFormProduct();
  return (
    <Card className="relative justify-between max-md:border-none max-md:rounded-none max-md:w-full md:w-2/3 max-md:h-full md:h-[70vh] overflow-hidden">
      <div className="flex justify-between items-center p-2">
        <h1 className="text-2xl capitalize">
          <Translate content={product ? "modifie product" : "add product"} />
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
      <Scroll className="h-full">
        <div>
          {pages.map((page, index) => {
            const Component = page.component;
            return (
              <div key={index}>
                <Line />
                <div className="p-2">
                  <h1 className="font-bold text-2xl uppercase">
                    <Translate content={page.name} />
                  </h1>
                </div>
                <Line />
                <Component />
              </div>
            );
          })}
        </div>
      </Scroll>
      <Line />
      <div className="flex justify-end gap-2 p-2">
        <Button
          onClick={async () => {
            const options = productForm;
            if (product?.id) {
              options.id = product.id;
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
      </div>
    </Card>
  );
};
