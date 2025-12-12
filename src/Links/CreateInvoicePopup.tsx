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
  Image,
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
  getFieldValue,
  openMenu,
  setFieldValue,
} from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { AddProductPopup } from "./AddProductPopup";
import { AddProductInformation } from "./AddProductInformation";
import { Icon } from "@biqpod/app/ui/shared";
import { useEffect } from "react";
interface UpsertInvoiceProps {
  invoice?: Biqpod.Snapbuy.Invoice;
}
export const UpsertInvoice = ({ invoice }: UpsertInvoiceProps) => {
  useEffect(() => {
    setFieldValue("customerName", invoice?.customerName || "");
    setFieldValue("customerEmail", invoice?.customerEmail || "");
    setFieldValue("invoiceNotes", invoice?.notes || "");
  }, [invoice]);
  const storeId = useStoreId();
  const customerName = getFieldValue("customerName");
  const customerEmail = getFieldValue("customerEmail");
  const products = useTemp<Record<string, { count: number; price: number }>>(
    "selected-products-for-invoice"
  );
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
  const createInvoice = async () => {
    if (
      !storeId ||
      !customerName ||
      Object.keys(products.get || {}).length === 0
    ) {
      showToast(
        "please fill in required fields and add at least one product",
        "error"
      );
      return;
    }
    await snapbuyApi.invoice.create({
      id: invoice?.id,
      storeId,
      customerName,
      customerEmail,
      products: products.get || {},
      tax: tax.get,
      discount: discount.get,
      status: "draft",
      notes: notes.get || "",
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
        <div className="flex flex-col">
          <div className="flex flex-col gap-2 p-2">
            <Field
              className="rounded-xl"
              inputName="customerName"
              placeholder="Customer Name"
            />
            <Field
              className="rounded-xl"
              inputName="customerEmail"
              placeholder="Customer Email"
            />
          </div>
          <Line />
          <div className="flex justify-between items-center p-2">
            <h3 className="font-medium">
              <Translate content="products" />
            </h3>
            <Button
              icon={allIcons.solid.faPlus}
              className="rounded-full w-fit"
              disabled={!productsList.get || productsList.get.length === 0}
              onClick={() => {
                showPopup(<AddProductPopup />, {
                  id: "add-product-popup",
                });
              }}
            >
              <Translate content="add product" />
            </Button>
          </div>
          <Line />
          {/* Products Section */}
          <div>
            {Object.keys(products.get || {}).length === 0 ? (
              <div className="text-[--biqpod-gray-opacity-2] py-4 text-center">
                <Translate content="no products added yet" />
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(products.get || {}).map(([prodId, product]) => {
                  const productInfo = productsList.get?.find(
                    (p) => p.id === prodId
                  );
                  return (
                    <div
                      key={prodId}
                      className="flex justify-between items-center bg-[--biqpod-primary-background] p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={productInfo?.photos?.at(0)}
                          alt={
                            <Icon
                              icon={allIcons.solid.faBoxOpen}
                              className="text-[--biqpod-gray-opacity-2] text-2xl"
                            />
                          }
                          className="bg-[--biqpod-gray-opacity] rounded-lg w-12 h-12"
                        />
                        <div>
                          <div className="font-medium">
                            {productInfo?.name || `Product ${prodId}`}
                          </div>
                          {productInfo?.brandId &&
                            brands.get &&
                            brands.get[productInfo.brandId] && (
                              <div className="text-[--biqpod-gray-opacity-2] text-sm">
                                {brands.get[productInfo.brandId]}
                              </div>
                            )}
                          <div className="text-[--biqpod-gray-opacity-2] text-sm">
                            {product.count} × {product.price}DA ={" "}
                            {product.count * product.price}DA
                          </div>
                        </div>
                      </div>
                      <CircleTip
                        icon={allIcons.solid.faEllipsisV}
                        onClick={({ clientY, clientX }) => {
                          openMenu({
                            x: clientX,
                            y: clientY,
                            menu: [
                              {
                                label: "edit",
                                defaultIcon: allIcons.solid.faEdit,
                                async click() {
                                  if (productInfo)
                                    showPopup(({ id }) => {
                                      return (
                                        <AddProductInformation
                                          product={productInfo}
                                          id={id}
                                        />
                                      );
                                    });
                                },
                              },
                              {
                                label: "delete",
                                defaultIcon: allIcons.solid.faTrash,
                                click: () => {
                                  products.set((prev) => {
                                    const newProducts = { ...prev };
                                    delete newProducts[prodId];
                                    return newProducts;
                                  });
                                },
                              },
                            ],
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Scroll>
      <Line />
      <div className="p-2">
        <Button
          onClick={createInvoice}
          disabled={isLoading("create-invoice")}
          icon={allIcons.solid.faPlus}
        >
          <Translate content="create" />
        </Button>
      </div>
    </Card>
  );
};
