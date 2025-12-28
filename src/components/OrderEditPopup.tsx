import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  CircleTip,
  Field,
  Icon,
  Line,
  Scroll,
  Translate,
} from "@biqpod/app/ui/components";
import { closePopup, showToast } from "@biqpod/app/ui/hooks";
import { allIcons } from "@biqpod/app/ui/apis";
import { snapbuyApi } from "../apis";
import { useStoreId } from "../utils";
import { motion } from "framer-motion";
import { TabsView } from "./TabsView";
import { Biqpod } from "@biqpod/app/ui/types";
interface OrderEditPopupProps {
  order: Biqpod.Snapbuy.Order;
  onSave?: () => void;
}
export const OrderEditPopup: React.FC<OrderEditPopupProps> = ({
  order,
  onSave,
}) => {
  const storeId = useStoreId();
  const [products, setProducts] = useState<Biqpod.Snapbuy.Product[]>([]);
  const [packs, setPacks] = useState<Biqpod.Snapbuy.Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedProducts, setEditedProducts] = useState<
    Partial<Record<string, { count?: number; price?: number }>>
  >(order.products || {});
  const [editedPacks, setEditedPacks] = useState<
    Partial<Record<string, { count?: number; price?: number }>>
  >(order.packs || {});
  const [productSearch, setProductSearch] = useState("");
  const [packSearch, setPackSearch] = useState("");
  const [editedProductSearch, setEditedProductSearch] = useState("");
  const [editedPackSearch, setEditedPackSearch] = useState("");
  // Store original order data for change tracking
  const originalProducts = useMemo(() => order.products || {}, []);
  const originalPacks = useMemo(() => order.packs || {}, []);
  const filteredProducts = useMemo(() => {
    if (!productSearch)
      return products.filter((product) => !editedProducts[product.id!]);
    return products.filter(
      (product) =>
        !editedProducts[product.id!] &&
        product.name?.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, editedProducts, productSearch]);
  const filteredPacks = useMemo(() => {
    if (!packSearch) return packs.filter((pack) => !editedPacks[pack.id!]);
    return packs.filter(
      (pack) =>
        !editedPacks[pack.id!] &&
        pack.name?.toLowerCase().includes(packSearch.toLowerCase())
    );
  }, [packs, editedPacks, packSearch]);
  const filteredEditedProducts = useMemo(() => {
    const editedEntries = Object.entries(editedProducts);
    const removedEntries = Object.entries(originalProducts).filter(
      ([productId]) => !editedProducts[productId]
    );
    const allEntries = [
      ...editedEntries,
      ...removedEntries.map(([id, data]) => [id, data] as const),
    ];
    if (allEntries.length <= 5 || !editedProductSearch) {
      return allEntries;
    }
    return allEntries.filter(([productId]) => {
      const product = products.find((p) => p.id === productId);
      return product?.name
        ?.toLowerCase()
        .includes(editedProductSearch.toLowerCase());
    });
  }, [editedProducts, originalProducts, products, editedProductSearch]);
  const filteredEditedPacks = useMemo(() => {
    const editedEntries = Object.entries(editedPacks);
    const removedEntries = Object.entries(originalPacks).filter(
      ([packId]) => !editedPacks[packId]
    );
    const allEntries = [
      ...editedEntries,
      ...removedEntries.map(([id, data]) => [id, data] as const),
    ];
    if (allEntries.length <= 5 || !editedPackSearch) {
      return allEntries;
    }
    return allEntries.filter(([packId]) => {
      const pack = packs.find((p) => p.id === packId);
      return pack?.name?.toLowerCase().includes(editedPackSearch.toLowerCase());
    });
  }, [editedPacks, originalPacks, packs, editedPackSearch]);
  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return;
      try {
        const [productsData, packsData] = await Promise.all([
          snapbuyApi.product.getProductsOf(storeId),
          snapbuyApi.packs.getAll(storeId),
        ]);
        setProducts(productsData || []);
        setPacks(packsData || []);
      } catch (error) {
        showToast("Failed to load products and packs", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);
  const handleSave = async () => {
    setSaving(true);
    try {
      await snapbuyApi.order.edit(order.id!, {
        products: editedProducts,
        packs: editedPacks,
      });
      showToast("Order updated successfully", "success");
      onSave?.();
      closePopup();
    } catch (error) {
      showToast("Failed to update order", "error");
    } finally {
      setSaving(false);
    }
  };
  const addProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    let defaultPrice = 0;
    if (product?.type === "single") {
      defaultPrice = product.single?.client || 0;
    } else if (product?.type === "multiple" && product.multiple?.prices) {
      defaultPrice = Math.min(...product.multiple.prices.map((p) => p.price));
    }
    setEditedProducts((prev) => ({
      ...prev,
      [productId]: { count: 1, price: defaultPrice },
    }));
  };
  const removeProduct = (productId: string) => {
    setEditedProducts((prev) => {
      const newProducts = { ...prev };
      delete newProducts[productId];
      return newProducts;
    });
  };
  const updateProduct = (
    productId: string,
    field: "count" | "price",
    value: number
  ) => {
    setEditedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };
  const addPack = (packId: string) => {
    setEditedPacks((prev) => ({
      ...prev,
      [packId]: { count: 1, price: 0 },
    }));
  };
  const removePack = (packId: string) => {
    setEditedPacks((prev) => {
      const newPacks = { ...prev };
      delete newPacks[packId];
      return newPacks;
    });
  };
  const updatePack = (
    packId: string,
    field: "count" | "price",
    value: number
  ) => {
    setEditedPacks((prev) => ({
      ...prev,
      [packId]: {
        ...prev[packId],
        [field]: value,
      },
    }));
  };
  if (loading) {
    return (
      <Card className="w-full max-w-2xl max-h-[80vh]">
        <div className="flex justify-center items-center p-8">
          <Icon icon={allIcons.solid.faCircleNotch} className="animate-spin" />
        </div>
      </Card>
    );
  }
  return (
    <Card className="max-md:rounded-none w-full md:max-w-2xl h-full md:max-h-[80vh] overflow-hidden">
      <div className="flex justify-between items-center p-3">
        <h2 className="font-bold text-2xl">
          <Translate content="Edit Order" />
        </h2>
        <CircleTip
          onClick={() => {
            closePopup();
          }}
        >
          <Icon icon={allIcons.solid.faXmark} />
        </CircleTip>
      </div>
      <Line />
      <Scroll className="flex-1">
        <div className="p-4">
          {/* Edited Products Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                <Translate content="Edited Products" />
              </h3>
              {Object.keys(editedProducts).length > 5 && (
                <Field
                  className="rounded-2xl w-48"
                  inputName="edited-product-search"
                  placeholder="Search edited products..."
                  value={editedProductSearch}
                  onChange={(e) => setEditedProductSearch(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-4">
              {filteredEditedProducts.map(([productId, data], index) => {
                const product = products.find((p) => p.id === productId);
                const originalData = originalProducts[productId];
                const isRemoved = !editedProducts[productId] && !!originalData;
                const isAdded = !originalData && !!editedProducts[productId];
                const isModified =
                  !!originalData && !!editedProducts[productId];
                const countChanged =
                  isModified &&
                  (data?.count || 0) !== (originalData?.count || 0);
                const priceChanged =
                  isModified &&
                  (data?.price || 0) !== (originalData?.price || 0);
                return (
                  <motion.div
                    key={productId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-4 p-2 border rounded-lg`}
                    style={{
                      borderColor: isRemoved
                        ? "rgba(239, 68, 68, 0.3)"
                        : isAdded
                        ? "rgba(34, 197, 94, 0.3)"
                        : undefined,
                      backgroundColor: isRemoved
                        ? "rgba(239, 68, 68, 0.1)"
                        : isAdded
                        ? "rgba(34, 197, 94, 0.1)"
                        : undefined,
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {product?.files?.[0] && (
                          <img
                            src={product.files[0].url}
                            alt={product.name}
                            className="rounded-lg w-12 h-12 object-cover"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">
                              <span className="mr-2 text-gray-500">
                                {index + 1} -
                              </span>
                              {product?.name || "Unknown Product"}
                            </div>
                            {isAdded && (
                              <div
                                className="rounded-full w-3 h-3"
                                style={{ backgroundColor: "#22c55e" }}
                                title="New item"
                              ></div>
                            )}
                            {isRemoved && (
                              <div
                                className="rounded-full w-3 h-3"
                                style={{ backgroundColor: "#ef4444" }}
                                title="Removed item"
                              ></div>
                            )}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {product?.description}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        {countChanged && (
                          <div className="text-gray-500 text-xs">
                            Was: {originalData?.count || 0}
                          </div>
                        )}
                        <input
                          type="number"
                          placeholder="Count"
                          value={
                            isRemoved
                              ? originalData?.count === 0
                                ? ""
                                : originalData?.count || 0
                              : data?.count === 0
                              ? ""
                              : data?.count || 0
                          }
                          onChange={(e) =>
                            updateProduct(
                              productId,
                              "count",
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isRemoved}
                          className={`bg-[var(--biqpod-field-background)] p-2 border border-[var(--biqpod-borders)] focus:border-blue-500 border-solid rounded-lg focus:ring-1 focus:ring-blue-500 w-20`}
                          style={
                            countChanged
                              ? { borderColor: "#22c55e" }
                              : undefined
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        {priceChanged && (
                          <div className="text-gray-500 text-xs">
                            Was: ${originalData?.price || 0}
                          </div>
                        )}
                        <input
                          type="number"
                          placeholder="Price"
                          value={
                            isRemoved
                              ? originalData?.price === 0
                                ? ""
                                : originalData?.price || 0
                              : data?.price === 0
                              ? ""
                              : data?.price || 0
                          }
                          onChange={(e) =>
                            updateProduct(
                              productId,
                              "price",
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isRemoved}
                          className={`bg-[var(--biqpod-field-background)] p-2 border border-[var(--biqpod-borders)] focus:border-blue-500 border-solid rounded-lg focus:ring-1 focus:ring-blue-500 w-24`}
                          style={
                            priceChanged
                              ? { borderColor: "#22c55e" }
                              : undefined
                          }
                        />
                      </div>
                      {!isRemoved && (
                        <CircleTip onClick={() => removeProduct(productId)}>
                          <Icon icon={allIcons.solid.faTrash} />
                        </CircleTip>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          {/* Edited Packs Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                <Translate content="Edited Packs" />
              </h3>
              {Object.keys(editedPacks).length > 5 && (
                <Field
                  className="rounded-2xl w-48"
                  inputName="edited-pack-search"
                  placeholder="Search edited packs..."
                  value={editedPackSearch}
                  onChange={(e) => setEditedPackSearch(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-4">
              {filteredEditedPacks.map(([packId, data], index) => {
                const pack = packs.find((p) => p.id === packId);
                const originalData = originalPacks[packId];
                const isRemoved = !editedPacks[packId] && !!originalData;
                const isAdded = !originalData && !!editedPacks[packId];
                const isModified = !!originalData && !!editedPacks[packId];
                const countChanged =
                  isModified &&
                  (data?.count || 0) !== (originalData?.count || 0);
                const priceChanged =
                  isModified &&
                  (data?.price || 0) !== (originalData?.price || 0);
                return (
                  <motion.div
                    key={packId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-4 p-2 border rounded-lg`}
                    style={{
                      borderColor: isRemoved
                        ? "rgba(239, 68, 68, 0.3)"
                        : isAdded
                        ? "rgba(34, 197, 94, 0.3)"
                        : undefined,
                      backgroundColor: isRemoved
                        ? "rgba(239, 68, 68, 0.1)"
                        : isAdded
                        ? "rgba(34, 197, 94, 0.1)"
                        : undefined,
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="mr-2 text-gray-500">
                            {index + 1} -
                          </span>
                          <span>{pack?.name || "Unknown Pack"}</span>
                          {isAdded && (
                            <div
                              className="rounded-full w-3 h-3"
                              style={{ backgroundColor: "#22c55e" }}
                              title="New item"
                            ></div>
                          )}
                          {isRemoved && (
                            <div
                              className="rounded-full w-3 h-3"
                              style={{ backgroundColor: "#ef4444" }}
                              title="Removed item"
                            ></div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        {countChanged && (
                          <div className="text-gray-500 text-xs">
                            Was: {originalData?.count || 0}
                          </div>
                        )}
                        <input
                          type="number"
                          placeholder="Count"
                          value={
                            isRemoved
                              ? originalData?.count === 0
                                ? ""
                                : originalData?.count || 0
                              : data?.count === 0
                              ? ""
                              : data?.count || 0
                          }
                          onChange={(e) =>
                            updatePack(
                              packId,
                              "count",
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isRemoved}
                          className={`bg-[var(--biqpod-field-background)] p-2 border border-[var(--biqpod-borders)] focus:border-blue-500 border-solid rounded-lg focus:ring-1 focus:ring-blue-500 w-20`}
                          style={
                            countChanged
                              ? { borderColor: "#22c55e" }
                              : undefined
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        {priceChanged && (
                          <div className="text-gray-500 text-xs">
                            Was: ${originalData?.price || 0}
                          </div>
                        )}
                        <input
                          type="number"
                          placeholder="Price"
                          value={
                            isRemoved
                              ? originalData?.price === 0
                                ? ""
                                : originalData?.price || 0
                              : data?.price === 0
                              ? ""
                              : data?.price || 0
                          }
                          onChange={(e) =>
                            updatePack(
                              packId,
                              "price",
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={isRemoved}
                          className={`bg-[var(--biqpod-field-background)] p-2 border border-[var(--biqpod-borders)] focus:border-blue-500 border-solid rounded-lg focus:ring-1 focus:ring-blue-500 w-24`}
                          style={
                            priceChanged
                              ? { borderColor: "#22c55e" }
                              : undefined
                          }
                        />
                      </div>
                      {!isRemoved && (
                        <CircleTip onClick={() => removePack(packId)}>
                          <Icon icon={allIcons.solid.faTrash} />
                        </CircleTip>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
        <Line />
        {/* Tabs for Adding Items */}
        <TabsView
          tabs={[
            {
              id: "products",
              label: "Add Products",
              icon: allIcons.solid.faBox,
              content: (
                <div>
                  <div className="p-3">
                    <Field
                      className="rounded-2xl"
                      inputName="product-search"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  <Line />
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-2 border rounded-lg transition-colors duration-200 cursor-pointer"
                        style={{
                          borderColor: "var(--biqpod-borders)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(0, 0, 0, 0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        {product.files?.[0] && (
                          <img
                            src={product.files[0].url}
                            alt={product.name}
                            className="rounded w-8 h-8 object-cover"
                          />
                        )}
                        <div className="flex-1 font-medium text-sm">
                          {product.name}
                        </div>
                        <CircleTip onClick={() => addProduct(product.id!)}>
                          <Icon icon={allIcons.solid.faPlus} />
                        </CircleTip>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ),
            },
            {
              id: "packs",
              label: "Add Packs",
              icon: allIcons.solid.faCubes,
              content: (
                <div>
                  <div className="p-3">
                    <Field
                      inputName="pack-search"
                      placeholder="Search packs..."
                      className="rounded-2xl"
                      value={packSearch}
                      onChange={(e) => setPackSearch(e.target.value)}
                    />
                  </div>
                  <Line />
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredPacks.map((pack) => (
                      <motion.div
                        key={pack.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-2 border rounded-lg transition-colors duration-200 cursor-pointer"
                        style={{
                          borderColor: "var(--biqpod-borders)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(0, 0, 0, 0.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div className="flex-1 font-medium text-sm">
                          {pack.name}
                        </div>
                        <CircleTip onClick={() => addPack(pack.id!)}>
                          <Icon icon={allIcons.solid.faPlus} />
                        </CircleTip>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ),
            },
          ]}
          id="order-edit-tabs"
        />
      </Scroll>
      <Line />
      <div className="flex justify-end gap-2 p-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Icon
              icon={allIcons.solid.faCircleNotch}
              className="animate-spin"
            />
          ) : (
            <Translate content="Save" />
          )}
        </Button>
      </div>
    </Card>
  );
};
