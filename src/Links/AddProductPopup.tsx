import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Line,
  Field,
  EmptyComponent,
  Translate,
  Icon,
  CircleTip,
  Scroll,
  Button,
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
    closePopup();
  };
  const removeProduct = (prodId: string) => {
    selectedProducts.set((prev) => {
      const newProducts = { ...prev };
      delete newProducts[prodId];
      return newProducts;
    });
  };
  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-3/4 max-h-[90vh] overflow-hidden">
      <CardHeaderForPopup title="add products to invoice" />
      <Line />
      <div className="flex p-4">
        <Field inputName="search-product" placeholder="search products" />
      </div>
      {Object.keys(selectedProducts.get || {}).length > 0 && (
        <EmptyComponent>
          <Line />
          <div className="p-3 border border-[--biqpod-borders] rounded-lg">
            <h3 className="mb-3 font-medium">
              <Translate content="selected products" /> (
              {Object.keys(selectedProducts.get || {}).length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(selectedProducts.get || {}).map(
                ([prodId, product]) => {
                  const productInfo =
                    productsList && productsList.find((p) => p.id === prodId);
                  return (
                    <div
                      key={prodId}
                      className="flex justify-between items-center bg-[--biqpod-secondary-background] p-2 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 bg-[--biqpod-gray-opacity] rounded w-8 h-8 overflow-hidden">
                          {productInfo?.photos &&
                          productInfo.photos.length > 0 ? (
                            <img
                              src={productInfo.photos[0]}
                              alt={productInfo.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex justify-center items-center w-full h-full">
                              <Icon
                                icon={allIcons.solid.faBoxOpen}
                                iconClassName="text-lg text-[--biqpod-gray-opacity-2]"
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {productInfo?.name || `Product ${prodId}`}
                            <sub className="ml-2">
                              <BrandInfo brandId={productInfo?.brandId} />
                            </sub>{" "}
                          </div>
                          <div className="text-[--biqpod-gray-opacity] text-xs">
                            {product.count} × {product.price}DA ={" "}
                            {product.count * product.price}DA
                          </div>
                        </div>
                      </div>
                      <CircleTip
                        icon={allIcons.solid.faTrash}
                        onClick={() => removeProduct(prodId)}
                      />
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </EmptyComponent>
      )}
      <Line />
      <Scroll>
        {/* Selected Products Section */}
        {filteredProducts.length === 0 ? (
          <div className="py-4 text-[--biqpod-gray-opacity] text-center">
            <Translate content="no products found" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className={tw(
                  `p-3 cursor-pointer`,
                  index % 2 && "bg-[--biqpod-primary-background]"
                )}
                onClick={() => {
                  showPopup(({ id }) => {
                    return <AddProductInformation product={product} id={id} />;
                  });
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 bg-[--biqpod-gray-opacity] rounded-lg w-12 h-12 overflow-hidden">
                    {product.photos && product.photos.length > 0 ? (
                      <img
                        src={product.photos[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex justify-center items-center w-full h-full">
                        <Icon
                          icon={allIcons.solid.faBoxOpen}
                          iconClassName="text-2xl text-[--biqpod-gray-opacity-2]"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      <span>{product.name}</span>
                      <sub className="ml-2">
                        <BrandInfo brandId={product.brandId} />
                      </sub>
                    </div>
                    {product.single?.customer && (
                      <div className="text-green-600 text-sm">
                        <Translate content="price" />: {product.single.customer}
                        DA
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Scroll>
      <Line />
      <div className="flex gap-2 p-4">
        <Button
          onClick={() => closePopup()}
          className="bg-[--biqpod-gray-opacity] hover:bg-[--biqpod-gray-opacity-2] text-[--biqpod-text-color]"
        >
          <Translate content="cancel" />
        </Button>
        <Button
          onClick={handleDone}
          disabled={Object.keys(selectedProducts.get || {}).length === 0}
          rightIcon={allIcons.solid.faCheck}
        >
          <Translate content="done" /> (
          {Object.keys(selectedProducts.get || {}).length})
        </Button>
      </div>
    </Card>
  );
};
