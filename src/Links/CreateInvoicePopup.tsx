import { allIcons } from "@biqpod/app/ui/apis";
import {
  Card,
  CardHeaderForPopup,
  Line,
  Scroll,
  Field,
  Translate,
  Button,
  CircleTip,
} from "@biqpod/app/ui/components";
import {
  useCopyState,
  useTemp,
  useAsyncEffect,
  showToast,
  closePopup,
  execAction,
  showPopup,
  isLoading,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { useMemo } from "react";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { AddProductPopup } from "./AddProductPopup";

export const CreateInvoicePopup = () => {
  const storeId = useStoreId();
  const customerName = useCopyState("");
  const customerEmail = useCopyState("");
  const products = useCopyState<
    Record<string, { count: number; price: number }>
  >({});
  const tax = useCopyState(0);
  const discount = useCopyState(0);
  const notes = useCopyState("");
  const productsList = useTemp<Biqpod.Snapbuy.Product[]>("products-list");
  const brands = useTemp<Record<string, string>>("brands-list");
  useAsyncEffect(async () => {
    if (!storeId) return;
    try {
      const fetchedProducts = await snapbuyApi.product.getProductsOf(storeId);
      if (fetchedProducts) productsList.set(fetchedProducts);
      const fetchedBrands = await snapbuyApi.brands.getAll(storeId);
      brands.set(
        Object.fromEntries(fetchedBrands.map((b: any) => [b.id, b.name]))
      );
    } catch (error) {
      console.error("Failed to fetch products or brands:", error);
      // Set dummy products for testing
      productsList.set([
        {
          id: "test-1",
          name: "Test Product 1",
          description: "A test product",
          photos: [],
          single: { customer: 100 },
          brandId: "test-brand-1",
        },
        {
          id: "test-2",
          name: "Test Product 2",
          description: "Another test product",
          photos: [],
          single: { customer: 200 },
          brandId: "test-brand-2",
        },
      ]);
      brands.set({
        "test-brand-1": "Test Brand 1",
        "test-brand-2": "Test Brand 2",
      });
    }
  }, [storeId]);
  const total = useMemo(() => {
    const subtotal = Object.values(products.get).reduce(
      (sum: number, product: { count: number; price: number }) =>
        sum + product.count * product.price,
      0
    );
    return subtotal + tax.get - discount.get;
  }, [products.get, tax.get, discount.get]);
  const createInvoice = async () => {
    if (
      !storeId ||
      !customerName.get ||
      Object.keys(products.get).length === 0
    ) {
      showToast(
        "please fill in required fields and add at least one product",
        "error"
      );
      return;
    }
    await snapbuyApi.invoice.create({
      storeId,
      customerName: customerName.get,
      customerEmail: customerEmail.get,
      products: products.get,
      tax: tax.get,
      discount: discount.get,
      status: "draft",
      notes: notes.get,
    });
    showToast("invoice created successfully", "success");
    closePopup();
    // Refresh invoices list
    execAction("fetch-invoices", {});
  };
  return (
    <Card className="w-3/4 md:w-2/3 max-h-[90vh]">
      <CardHeaderForPopup title="create invoice" />
      <Line />
      <Scroll className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          <Field
            inputName="customerName"
            placeholder="customer name"
            value={customerName.get}
            onChange={(e) => customerName.set(e.target.value)}
          />
          <Field
            inputName="customerEmail"
            placeholder="customer email"
            value={customerEmail.get}
            onChange={(e) => customerEmail.set(e.target.value)}
          />
          {/* Products Section */}
          <div className="p-3 border border-[--biqpod-borders] rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">
                <Translate content="products" />
              </h3>
              <Button
                icon={allIcons.solid.faPlus}
                className="w-fit"
                disabled={!productsList.get || productsList.get.length === 0}
                onClick={() => {
                  showPopup(<AddProductPopup />);
                }}
              >
                <Translate content="add product" />
              </Button>
            </div>
            {Object.keys(products.get).length === 0 ? (
              <div className="py-4 text-[--biqpod-gray-opacity] text-center">
                <Translate content="no products added yet" />
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(products.get).map(([prodId, product]) => {
                  const productInfo = productsList.get?.find(
                    (p) => p.id === prodId
                  );
                  return (
                    <div
                      key={prodId}
                      className="flex justify-between items-center bg-[--biqpod-secondary-background] p-2 rounded"
                    >
                      <div>
                        <div className="font-medium">
                          {productInfo?.name || `Product ${prodId}`}
                        </div>
                        {productInfo?.brandId &&
                          brands.get &&
                          brands.get[productInfo.brandId] && (
                            <div className="text-[--biqpod-gray-opacity] text-sm">
                              {brands.get[productInfo.brandId]}
                            </div>
                          )}
                        <div className="text-[--biqpod-gray-opacity] text-sm">
                          {product.count} × {product.price}DA ={" "}
                          {product.count * product.price}DA
                        </div>
                      </div>
                      <CircleTip
                        icon={allIcons.solid.faTrash}
                        onClick={() => {
                          products.set((prev) => {
                            const newProducts = { ...prev };
                            delete newProducts[prodId];
                            return newProducts;
                          });
                        }}
                        className="text-red-500"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <Field
            inputName="tax"
            placeholder="tax"
            value={tax.get.toString()}
            onChange={(e) => tax.set(parseFloat(e.target.value) || 0)}
          />
          <Field
            inputName="discount"
            placeholder="discount"
            value={discount.get.toString()}
            onChange={(e) => discount.set(parseFloat(e.target.value) || 0)}
          />
          <Field
            inputName="total"
            placeholder="total"
            value={total.toString()}
            disabled
          />
          <Field
            inputName="notes"
            placeholder="notes"
            value={notes.get}
            onChange={(e) => notes.set(e.target.value)}
          />
        </div>
      </Scroll>
      <Line />
      <div className="p-4">
        <Button
          onClick={createInvoice}
          disabled={isLoading("create-invoice")}
          rightIcon={allIcons.solid.faSave}
        >
          <Translate content="create" />
        </Button>
      </div>
    </Card>
  );
};
