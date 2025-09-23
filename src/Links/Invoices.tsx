import { allIcons } from "@biqpod/app/ui/apis";
import {
  Button,
  Card,
  CardHeaderForPopup,
  CircleTip,
  EmptyComponent,
  Field,
  Icon,
  Line,
  NumberField,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import {
  closePopup,
  execAction,
  getFieldValue,
  isLoading,
  setTemp,
  showPopup,
  showToast,
  useAsyncEffect,
  useCopyState,
  useDeviceResolution,
  useTemp,
} from "@biqpod/app/ui/hooks";
import { include } from "@biqpod/app/ui/utils";
import { useMemo } from "react";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { motion } from "framer-motion";
import { AnimatedList, AnimatedListItem, ScaleIn } from "../animations";

const NoInvoicesFound = () => {
  return (
    <motion.div className="flex justify-center items-center h-full min-h-[400px]">
      <ScaleIn delay={0.2}>
        <Card className="relative mx-auto max-w-md overflow-hidden text-center">
          <div className="z-10 relative">
            <motion.div
              className="p-5"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon
                  icon={allIcons.solid.faFileInvoice}
                  iconClassName="text-8xl text-[--biqpod-gray-opacity]"
                />
              </motion.div>
            </motion.div>
            <Line />
            <motion.div
              className="flex flex-col gap-2 p-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.h3
                className="font-semibold text-[--biqpod-text-color] text-xl uppercase"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                  background:
                    "linear-gradient(90deg, var(--biqpod-text-color), var(--biqpod-primary), var(--biqpod-text-color))",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                <Translate content="no invoices found" />
              </motion.h3>
              <motion.p
                className="text-[--biqpod-gray-opacity-2]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Translate content="there are no invoices matching your criteria" />
              </motion.p>
            </motion.div>
            <Line />
            <motion.div
              className="p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <Button
                icon={allIcons.solid.faPlus}
                onClick={() => showPopup(<CreateInvoicePopup />)}
              >
                <Translate content="create invoice" />
              </Button>
            </motion.div>
          </div>
        </Card>
      </ScaleIn>
    </motion.div>
  );
};

const AddProductPopup = ({
  onAdd,
  productsList,
}: {
  onAdd: (prodId: string, product: { count: number; price: number }) => void;
  productsList: SnapBuy.Product[];
}) => {
  const searchProduct = getFieldValue("search-product");
  const selectedProductId = useCopyState<string>("");
  const count = useCopyState<number | null | undefined>(1);
  const price = useCopyState<number | null | undefined>(0);

  const filteredProducts = useMemo(() => {
    if (!productsList) return [];
    return productsList.filter((product) =>
      include(`${product.name} ${product.description}`, searchProduct)
    );
  }, [searchProduct, productsList]);

  const handleAdd = () => {
    if (
      !selectedProductId.get ||
      !count.get ||
      count.get <= 0 ||
      !price.get ||
      price.get <= 0
    ) {
      showToast(
        "Please select a product and enter valid count and price",
        "error"
      );
      return;
    }
    onAdd(selectedProductId.get, { count: count.get, price: price.get });
  };

  return (
    <Card className="max-md:rounded-none max-md:w-full md:w-1/2 max-md:h-full md:max-h-[80vh] overflow-hidden">
      <CardHeaderForPopup title="Add Product to Invoice" />
      <Line />
      <Scroll className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          <Field inputName="search-product" placeholder="Search products..." />

          {filteredProducts.length === 0 ? (
            <div className="py-4 text-[--biqpod-gray-opacity] text-center">
              No products found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProductId.get === product.id
                      ? "border-[--biqpod-primary] bg-[--biqpod-primary-background]"
                      : "border-[--biqpod-borders] hover:border-[--biqpod-primary]"
                  }`}
                  onClick={() => {
                    selectedProductId.set(product.id!);
                    // Set default price from product if available
                    if (product.single?.customer) {
                      price.set(product.single.customer);
                    }
                  }}
                >
                  <div className="font-medium">{product.name}</div>
                  {product.description && (
                    <div className="text-[--biqpod-gray-opacity] text-sm">
                      {product.description}
                    </div>
                  )}
                  {product.single?.customer && (
                    <div className="text-green-600 text-sm">
                      Price: {product.single.customer}DA
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedProductId.get && (
            <div className="space-y-3 p-3 border border-[--biqpod-borders] rounded-lg">
              <h3 className="font-medium">Product Details</h3>
              <NumberField
                state={count}
                config={{
                  placeholder: "Count",
                  autoChange: true,
                }}
                id="product-count"
              />
              <NumberField
                state={price}
                config={{
                  placeholder: "Price per unit",
                  autoChange: true,
                }}
                id="product-price"
              />
            </div>
          )}
        </div>
      </Scroll>
      <Line />
      <div className="p-4">
        <Button
          onClick={handleAdd}
          disabled={
            !selectedProductId.get ||
            !count.get ||
            count.get <= 0 ||
            !price.get ||
            price.get <= 0
          }
          rightIcon={allIcons.solid.faPlus}
        >
          Add to Invoice
        </Button>
      </div>
    </Card>
  );
};

const CreateInvoicePopup = () => {
  const storeId = useStoreId();
  const customerName = useCopyState("");
  const customerEmail = useCopyState("");
  const products = useCopyState<
    Record<string, { count: number; price: number }>
  >({});
  const tax = useCopyState(0);
  const discount = useCopyState(0);
  const notes = useCopyState("");
  const productsList = useTemp<SnapBuy.Product[]>("invoice-products");

  useAsyncEffect(async () => {
    if (!storeId) return;
    try {
      const fetchedProducts = await snapbuyApi.getProductsOf(storeId);
      setTemp("invoice-products", fetchedProducts || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
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
        "Please fill in required fields and add at least one product",
        "error"
      );
      return;
    }

    const invoiceData = {
      storeId,
      customerName: customerName.get,
      customerEmail: customerEmail.get,
      products: products.get,
      tax: tax.get,
      discount: discount.get,
      status: "draft" as const,
      notes: notes.get,
    };

    await snapbuyApi.createInvoice(invoiceData);
    showToast("Invoice created successfully", "success");
    closePopup();
    // Refresh invoices list
    execAction("fetch-invoices", {});
  };

  return (
    <Card className="max-md:rounded-none max-md:w-full max-md:h-full">
      <CardHeaderForPopup title="Create Invoice" />
      <Line />
      <Scroll className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          <Field
            inputName="customerName"
            placeholder="Customer Name"
            value={customerName.get}
            onChange={(e) => customerName.set(e.target.value)}
          />
          <Field
            inputName="customerEmail"
            placeholder="Customer Email"
            value={customerEmail.get}
            onChange={(e) => customerEmail.set(e.target.value)}
          />

          {/* Products Section */}
          <div className="p-3 border border-[--biqpod-borders] rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Products</h3>
              <Button
                icon={allIcons.solid.faPlus}
                onClick={() =>
                  showPopup(
                    <AddProductPopup
                      onAdd={(prodId, product) => {
                        products.set((prev) => ({
                          ...prev,
                          [prodId]: product,
                        }));
                        closePopup();
                      }}
                      productsList={productsList.get || []}
                    />
                  )
                }
              >
                Add Product
              </Button>
            </div>

            {Object.keys(products.get).length === 0 ? (
              <div className="py-4 text-[--biqpod-gray-opacity] text-center">
                No products added yet
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
            placeholder="Tax"
            value={tax.get.toString()}
            onChange={(e) => tax.set(parseFloat(e.target.value) || 0)}
          />
          <Field
            inputName="discount"
            placeholder="Discount"
            value={discount.get.toString()}
            onChange={(e) => discount.set(parseFloat(e.target.value) || 0)}
          />
          <Field
            inputName="total"
            placeholder="Total"
            value={total.toString()}
            disabled
          />
          <Field
            inputName="notes"
            placeholder="Notes"
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

const InvoiceStatusBadge = ({
  status,
}: {
  status: SnapBuy.Invoice["status"];
}) => {
  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}
    >
      <Translate content={status} />
    </span>
  );
};

export const Invoices = () => {
  const searchInvoice = getFieldValue("search-invoice");
  const invoices = useTemp<SnapBuy.Invoice[]>("invoices-list");
  const storeId = useStoreId();

  useAsyncEffect(async () => {
    execAction("fetch-invoices", {});
  }, [storeId]);

  const filteredInvoices = useMemo(() => {
    if (!invoices.get) return [];
    return invoices.get.filter((invoice) =>
      include(
        `${invoice.id} ${invoice.customerName} ${invoice.status}`,
        searchInvoice
      )
    );
  }, [searchInvoice, invoices.get]);

  const { isMobile, isTablet } = useDeviceResolution();
  const isSmallView = isMobile || isTablet;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center gap-2 p-2">
        <Field
          inputName="search-invoice"
          placeholder="Search Invoices"
          className="flex-1 rounded-xl"
        />
      </div>
      <Line />
      {!isSmallView && (
        <EmptyComponent>
          <div className="flex justify-between items-center gap-2 p-2">
            <span className="w-full font-medium capitalize">
              <Translate content="customer" />
            </span>
            <span className="w-full font-medium capitalize">
              <Translate content="amount" />
            </span>
            <span className="w-full font-medium capitalize">
              <Translate content="status" />
            </span>
            <span className="w-full font-medium capitalize">
              <Translate content="created at" />
            </span>
            <div className="invisible">
              <CircleTip icon={allIcons.solid.faEllipsisV} />
            </div>
          </div>
          <Line />
          <Scroll>
            {filteredInvoices.length === 0 && !isLoading("fetch-invoices") && (
              <NoInvoicesFound />
            )}
            <AnimatedList staggerDelay={0.05}>
              {filteredInvoices.map((invoice, index) => (
                <AnimatedListItem key={invoice.id} index={index}>
                  <div className="flex justify-between items-center gap-2 odd:bg-[--biqpod-secondary-background] p-2 rounded-lg">
                    <div className="w-full">
                      <div className="font-medium">{invoice.customerName}</div>
                      {invoice.customerEmail && (
                        <div className="text-[--biqpod-gray-opacity] text-sm">
                          {invoice.customerEmail}
                        </div>
                      )}
                    </div>
                    <div className="w-full font-medium">{invoice.total}DA</div>
                    <div className="w-full">
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <div className="w-full text-[--biqpod-gray-opacity] text-sm">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <CircleTip
                        icon={allIcons.solid.faEllipsisV}
                        onClick={() => {
                          // TODO: Add invoice actions menu
                        }}
                      />
                    </div>
                  </div>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          </Scroll>
        </EmptyComponent>
      )}
      {isSmallView && (
        <Scroll>
          {filteredInvoices.length === 0 && !isLoading("fetch-invoices") && (
            <NoInvoicesFound />
          )}
          <AnimatedList className="flex flex-col gap-4 p-2" staggerDelay={0.05}>
            {filteredInvoices.map((invoice, index) => (
              <AnimatedListItem key={invoice.id} index={index}>
                <Card className="overflow-hidden">
                  <div className="flex justify-between items-center p-4">
                    <div>
                      <div className="font-medium text-lg">
                        {invoice.customerName}
                      </div>
                      {invoice.customerEmail && (
                        <div className="text-[--biqpod-gray-opacity] text-sm">
                          {invoice.customerEmail}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600 text-xl">
                        {invoice.total}DA
                      </div>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                  </div>
                  <Line />
                  <div className="flex justify-between items-center p-4">
                    <div className="text-[--biqpod-gray-opacity] text-sm">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </div>
                    <CircleTip
                      icon={allIcons.solid.faEllipsisV}
                      onClick={() => {
                        // TODO: Add invoice actions menu
                      }}
                    />
                  </div>
                </Card>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        </Scroll>
      )}
      <div className="p-4 border-[--biqpod-borders] border-t">
        <Button
          icon={allIcons.solid.faPlus}
          onClick={() => showPopup(<CreateInvoicePopup />)}
          className="w-full"
        >
          <Translate content="create invoice" />
        </Button>
      </div>
    </div>
  );
};
