import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Line,
  Field,
  Translate,
  Icon,
  Scroll,
  Button,
  Image,
  EmptyComponent,
} from "@biqpod/app/ui/components";
import {
  getFieldValue,
  useTemp,
  getTemp,
  showToast,
  closePopup,
  showPopup,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { include, tw } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { BrandInfo } from "./BrandInfo";
import { AddProductInformation } from "./AddProductInformation";

export const AddProductPopup = () => {
  const searchProduct = getFieldValue("search-product");
  const selectedProducts = useTemp<
    Record<string, { count: number; price: number }>
  >("selected-products-for-invoice");
  const productsList = getTemp<Biqpod.Snapbuy.Product[]>("products-list");
  const filteredProducts = useMemo(() => {
    if (!productsList) return [];
    return productsList.filter((product) =>
      include(`${product.name} ${product.description}`, searchProduct)
    );
  }, [searchProduct, productsList]);
  const handleDone = () => {
    if (Object.keys(selectedProducts.get || {}).length === 0) {
      showToast("please add at least one product", "error");
      return;
    }
    closePopup("add-product-popup");
  };
  const total = Object.values(selectedProducts.get || {}).reduce(
    (sum, product) => sum + product.count * product.price,
    0
  );
  return (
    <Card className="max-md:w-11/12 md:w-3/4 max-h-[90vh] overflow-hidden">
      <CardHeaderForPopup
        title="add products to invoice"
        popupId="add-product-popup"
      />
      <Line />
      <div className="flex p-2">
        <Field
          className="rounded-xl"
          inputName="search-product"
          placeholder="search products"
        />
      </div>
      <Line />
      <Scroll>
        {/* Selected Products Section */}
        {filteredProducts.length === 0 ? (
          <div className="py-4 text-[--biqpod-gray-opacity] text-center">
            <Translate content="no products found" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product, index) => {
              const prices =
                product.type === "single"
                  ? [product.single?.customer, product.single?.client]
                  : product.multiple?.prices?.map((p) => p.price) || [];
              const productExists = product.id
                ? selectedProducts.get?.[product.id]
                : undefined;
              return (
                <div
                  key={product.id}
                  className={tw(
                    `p-3 cursor-pointer flex items-center justify-between`,
                    index % 2 && "bg-[--biqpod-primary-background]",
                    "hover:bg-[--biqpod-gray-opacity]"
                  )}
                  onClick={() => {
                    showPopup(({ id }) => {
                      return (
                        <AddProductInformation product={product} id={id} />
                      );
                    });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={product.photos?.at(0)}
                      alt={
                        <Icon
                          icon={allIcons.solid.faBoxOpen}
                          className="text-[--biqpod-gray-opacity-2] text-2xl"
                        />
                      }
                      className="bg-[--biqpod-gray-opacity] rounded-lg w-12 h-12"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        <span>{product.name}</span>
                        <sub className="ml-2">
                          <BrandInfo brandId={product.brandId} />
                        </sub>
                      </div>
                      <div className="flex gap-2">
                        {prices.filter(Boolean).map((price) => {
                          return (
                            <div
                              className="inline-block pr-2 border-[--biqpod-primary] border-r last:border-r-0 border-solid text-green-600 text-sm"
                              key={price}
                            >
                              {price?.toLocaleString("fr-DZ", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              DA
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!!productExists && (
                      <EmptyComponent>
                        <span className="font-bold text-[--biqpod-success]">
                          {productExists?.price.toLocaleString("fr-DZ", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          DA
                        </span>
                        <div className="inline-flex justify-center items-center bg-[--biqpod-gray-opacity] rounded-full w-6 h-6">
                          {productExists.count}
                        </div>
                      </EmptyComponent>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Scroll>
      <Line />
      <div className="p-3 font-bold text-[--biqpod-success] text-xl text-center">
        {total.toLocaleString("fr-DZ", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        DA
      </div>
      <Line />
      <div className="flex gap-2 p-4">
        <Button
          onClick={() => closePopup("add-product-popup")}
          className="bg-[--biqpod-gray-opacity] hover:bg-[--biqpod-gray-opacity-2] text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={handleDone}
          disabled={Object.keys(selectedProducts.get || {}).length === 0}
          rightIcon={allIcons.solid.faCheck}
        >
          <Translate content="save" /> (
          {Object.keys(selectedProducts.get || {}).length})
        </Button>
      </div>
    </Card>
  );
};
