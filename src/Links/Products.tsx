import { allIcons } from "@biqpod/app/ui/apis";
import { delay, filterFuzzySearch, range, tw } from "@biqpod/app/ui/utils";
import {
  Button,
  CardWait,
  CircleTip,
  Field,
  Icon,
  Line,
  PositionView,
} from "@biqpod/app/ui/components";
import {
  execAction,
  getFieldValue,
  getPosition,
  handelShadowColor,
  isLoading,
  isSuccess,
  showPopup,
  showToast,
  useAction,
  useColorMerge,
  useCopyState,
  useDeviceResolution,
  useMemoDelay,
  useTemp,
  confirm,
  openMenu,
  showBottomSheet,
} from "@biqpod/app/ui/hooks";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import { snapbuyApi } from "../apis";
import { ProductRender } from "./ProductRender";
import { ProductListItem } from "../components/ProductListItem";
import { motion } from "framer-motion";
import { useStoreId } from "../utils";
import { useIndexedDBProducts } from "../hooks/useIndexedDBProducts";
import {
  FilterOptionsForProduct,
  AdminFilterProducts,
} from "./AdminPopupFilter";
import { useUsedBy } from "../routes/Stores/Stores";
import { Biqpod } from "@biqpod/app/ui/types";
import { MergeFilesPopup } from "./MergeFilesPopup";
import { CreateFirstUI } from "../components/CreateFirstUI";
import { AddMetadataPopup } from "./AddMetadataPopup";
import { ToolsCard } from "./ToolsCard";
import { RemoveMetadataPopup } from "./RemoveMetadataPopup";
import { RemoveAllMetadataPopup } from "./RemoveAllMetadataPopup";
import { SetBrandPopup } from "./SetBrand";
import { UpsertProduct } from "./NewProduct/NewProduct";
import { ProductToolsBottomSheet } from "./ProductToolsBottomSheet";
export const Products = () => {
  const storeId = useStoreId();
  const usedBy = useUsedBy();
  const {
    products,
    isLoading: cacheLoading,
    setProducts,
  } = useIndexedDBProducts(storeId);
  const tabsPosition = getPosition("products-and-brands");
  const action = useAction(
    "fetch-products",
    async () => {
      if (!storeId) {
        return;
      }
      await delay(200);
      var result = await snapbuyApi.product.getProductsOf(storeId);
      if (!result) {
        return;
      }
      setProducts(
        result.sort((a, b) => {
          return a.name?.localeCompare(b.name || "") || 0;
        })
      );
    },
    [storeId]
  );
  const success = isSuccess(action);
  useEffect(() => {
    if (cacheLoading) return;
    if (products.length === 0) {
      execAction("fetch-products", false);
    }
  }, [cacheLoading, products.length]);
  const showTools = useCopyState(false);
  const selectedProducts = useTemp<string[]>("selected-products");
  const isSelectionMode = useTemp<boolean>("is-selection-mode");
  const viewMode = useCopyState<"grid" | "list">("grid");
  const bulkDeleteAction = useAction(
    "bulk-delete-products",
    async () => {
      const selectedProductIds = selectedProducts.get || [];
      if (selectedProductIds.length === 0) {
        showToast("No products selected for deletion", "error");
        return;
      }
      try {
        // Delete each selected product
        await Promise.all(selectedProductIds.map(snapbuyApi.product.delete));
        // Clear selection and exit selection mode
        selectedProducts.set([]);
        isSelectionMode.set(false);
        // Show success message
        const productCount = selectedProductIds.length;
        showToast(
          `Successfully deleted ${productCount} product${
            productCount > 1 ? "s" : ""
          }`,
          "success"
        );
        // Refresh the product list
        execAction("fetch-products", false);
      } catch (error) {
        console.error("Failed to delete products:", error);
        showToast("Failed to delete some products. Please try again.", "error");
        throw error; // Re-throw to mark action as failed
      }
    },
    [selectedProducts.get, isSelectionMode]
  );
  const bulkToggleAvailabilityAction = useAction(
    "bulk-toggle-availability",
    async (enable: boolean) => {
      const selectedProductIds = selectedProducts.get || [];
      if (selectedProductIds.length === 0) {
        showToast("No products selected", "error");
        return;
      }
      try {
        // Update availability for each selected product
        await Promise.all(
          selectedProductIds.map(async (productId) => {
            const product = await snapbuyApi.product.get(productId);
            if (product) {
              const updatedProduct: Partial<Biqpod.Snapbuy.Product> = {
                id: productId,
                available: enable,
              };
              await snapbuyApi.product.upsert(storeId!, [updatedProduct]);
            }
          })
        );
        // Clear selection and exit selection mode
        selectedProducts.set([]);
        isSelectionMode.set(false);
        // Show success message
        const productCount = selectedProductIds.length;
        const actionText = enable ? "enabled" : "disabled";
        showToast(
          `Successfully ${actionText} ${productCount} product${
            productCount > 1 ? "s" : ""
          }`,
          "success"
        );
        // Refresh the product list
        execAction("fetch-products", false);
      } catch (error) {
        console.error("Failed to update product availability:", error);
        showToast("Failed to update some products. Please try again.", "error");
        throw error; // Re-throw to mark action as failed
      }
    },
    [selectedProducts.get, isSelectionMode, storeId]
  );
  const bulkDeleteLoading = isLoading(bulkDeleteAction);
  const bulkToggleLoading = isLoading(bulkToggleAvailabilityAction);

  // Individual product action handlers
  const handleEditProduct = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        showPopup(<UpsertProduct product={product} />);
      }
    },
    [products]
  );

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const confirmed = await confirm({
        title: "Delete Product",
        message: `Are you sure you want to delete "${product.name}"?`,
        detail: "This action cannot be undone.",
        type: "warning",
      });

      if (confirmed) {
        try {
          await snapbuyApi.product.delete(productId);
          showToast("Product deleted successfully", "success");
          execAction("fetch-products", false);
        } catch (error) {
          console.error("Failed to delete product:", error);
          showToast("Failed to delete product", "error");
        }
      }
    },
    [products]
  );

  const handleToggleAvailability = useCallback(
    async (productId: string, available: boolean) => {
      try {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        await snapbuyApi.product.upsert(storeId!, [
          {
            ...product,
            available,
          },
        ]);
        showToast(
          `Product ${available ? "enabled" : "disabled"} successfully`,
          "success"
        );
        execAction("fetch-products", false);
      } catch (error) {
        console.error("Failed to toggle availability:", error);
        showToast("Failed to update product availability", "error");
      }
    },
    [products, storeId]
  );

  const handleDuplicateProduct = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        const duplicatedProduct = {
          ...product,
          id: undefined, // This will generate a new ID when creating
          name: `${product.name} (Copy)`,
        };
        showPopup(<UpsertProduct product={duplicatedProduct} />);
      }
    },
    [products]
  );

  const handleViewProductDetails = useCallback(
    (productId: string) => {
      // Open the product tools bottom sheet for details
      const product = products.find((p) => p.id === productId);
      const index = products.findIndex((p) => p.id === productId);
      if (product) {
        showBottomSheet(
          <ProductToolsBottomSheet
            index={index}
            product={product}
            usedBy={usedBy}
          />
        );
      }
    },
    [products, usedBy]
  );

  const options = useTemp<FilterOptionsForProduct>("filter-products-options");
  const search = getFieldValue("producer-search-product");
  const [_, filterProducts] = useMemoDelay(
    () => {
      let filteredProducts = products?.filter((prod) => {
        // Apply filter options with AND logic
        if (options.get) {
          // Filter by availability
          if (options.get.available && options.get.available !== "all") {
            const isAvailable = options.get.available === "true";
            if (prod.available !== isAvailable) {
              return false;
            }
          }
          // Filter by multiple brands
          if (options.get.brands && options.get.brands.length > 0) {
            if (!options.get.brands.includes(prod.brandId || "")) {
              return false;
            }
          }
          // Filter by keys
          if (options.get.keys && options.get.keys.length > 0) {
            // Assuming keys are metadata keys
            const hasKeys = options.get.keys.every(
              (key) => prod.metaData && key in prod.metaData
            );
            if (!hasKeys) {
              return false;
            }
          }
          // Filter by product type
          if (options.get.productType) {
            if (prod.type !== options.get.productType) {
              return false;
            }
          }
          // Filter by metadata
          if (
            options.get.metadata &&
            Object.keys(options.get.metadata).length > 0
          ) {
            const hasAllMetadata = Object.entries(options.get.metadata).every(
              ([key, field]) => {
                if (!field) return true; // Skip undefined fields
                if (!prod.metaData || !prod.metaData[key]) return false;
                // For now, just check if the key exists. In the future, we could check values too
                return true;
              }
            );
            if (!hasAllMetadata) {
              return false;
            }
          }
          // Filter by price range
          if (options.get.minPrice) {
            let productPrice = 0;
            if (prod.type === "single" && prod.single?.client) {
              productPrice = prod.single.client;
            } else if (
              prod.type === "multiple" &&
              prod.multiple?.prices?.length
            ) {
              // For multiple prices, use the minimum price
              productPrice = Math.min(
                ...prod.multiple.prices.map((p) => p.price)
              );
            }
            if (productPrice < options.get.minPrice) {
              return false;
            }
          }
          if (options.get.maxPrice) {
            let productPrice = 0;
            if (prod.type === "single" && prod.single?.client) {
              productPrice = prod.single.client;
            } else if (
              prod.type === "multiple" &&
              prod.multiple?.prices?.length
            ) {
              // For multiple prices, use the maximum price
              productPrice = Math.max(
                ...prod.multiple.prices.map((p) => p.price)
              );
            }
            if (productPrice > options.get.maxPrice) {
              return false;
            }
          }
        }
        return true;
      });
      // Apply search filter after other filters
      if (!search) {
        return filteredProducts;
      }
      return filterFuzzySearch(filteredProducts || [], search, "name");
    },
    [search, products, options.get],
    500
  );
  const loading = isLoading(action);
  // FastList related state and refs
  const listRef = useRef<any>(null);
  const [showShadow, setShowShadow] = useState(false);
  // Position and height calculation for FastList
  const position = getPosition("searching");
  const listHeight = useMemo(() => {
    const posHeight = position?.height || 0;
    const posTop = position?.top || 0;
    return (tabsPosition?.top || 0) - posHeight - posTop;
  }, [position, tabsPosition?.top]);
  const colorMerge = useColorMerge();
  // Helper: check if any product is selected
  // Stable toggle function for tools
  const toggleTools = useCallback(() => {
    showTools.set(!showTools.get);
  }, [showTools]);
  const startSelectionMode = useCallback(() => {
    isSelectionMode.set(true);
    showTools.set(false);
    // Initialize selectedProducts if null
    if (!selectedProducts.get) {
      selectedProducts.set([]);
    }
  }, [isSelectionMode, showTools, selectedProducts]);
  // Reset scroll when search changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem?.(0);
    }
  }, [search]);
  // Memoize the item data to prevent unnecessary re-renders
  const listItemData = useMemo(() => {
    // During loading or when no filters are active, use products directly to avoid delay
    if (loading || cacheLoading || (!search && !options.get)) {
      return products || [];
    }
    return filterProducts || [];
  }, [filterProducts, products, loading, cacheLoading, search, options.get]);
  const { isMobile, isDesktop, isTablet } = useDeviceResolution();
  const columns = useMemo(() => {
    if (viewMode.get === "list") return 1;
    if (isMobile) return 2;
    if (isTablet) return 3;
    if (isDesktop) return 4;
    return 2; // fallback
  }, [isMobile, isTablet, isDesktop, viewMode.get]);
  // Memoize the item count to prevent recalculation
  const itemCount = useMemo(() => {
    return Math.ceil((listItemData?.length || 0 + 1) / columns);
  }, [listItemData?.length, columns]);
  // Memoized render item function
  const RenderItem = useCallback(
    ({
      index,
      style,
      data,
    }: {
      index: number;
      style: React.CSSProperties;
      data: (Biqpod.Snapbuy.Product | number)[];
    }) => {
      const itsNumber = data.some((item) => typeof item === "number");
      if (itsNumber) {
        // Loading placeholder card
        if (viewMode.get === "list") {
          // List view loading placeholder
          return (
            <div style={style} className="flex items-center gap-2 p-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <CardWait className="flex items-center gap-4 p-4 rounded-2xl w-full h-[120px] overflow-hidden">
                  {/* Image placeholder */}
                  <div className="flex-shrink-0 rounded-xl w-20 h-20 overflow-hidden">
                    <CardWait className="w-full h-full" />
                  </div>
                  {/* Content placeholder */}
                  <div className="flex flex-col flex-1 justify-between min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardWait className="mb-2 rounded-xl w-3/4 h-5" />
                        <CardWait className="rounded-xl w-1/2 h-4" />
                      </div>
                      <CardWait className="ml-2 rounded-full w-8 h-8" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <CardWait className="rounded-2xl w-16 h-6" />
                        <CardWait className="rounded-2xl w-16 h-6" />
                      </div>
                      <CardWait className="rounded-full w-8 h-8" />
                    </div>
                  </div>
                </CardWait>
              </motion.div>
            </div>
          );
        } else {
          // Grid view loading placeholder
          return (
            <div style={style} className="flex items-center gap-2 p-2">
              {Array.from({ length: columns }, (_, colIndex) => (
                <motion.div
                  key={`loading-${index}-${colIndex}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-1 w-full h-[300px]"
                >
                  <CardWait className="flex flex-col justify-between rounded-2xl w-full h-full overflow-hidden">
                    {/* Image placeholder */}
                    <div className="relative flex justify-center items-center p-3 w-full h-[200px] overflow-hidden">
                      <CardWait className="rounded-xl w-full h-full" />
                    </div>
                    <Line />
                    {/* Title placeholder */}
                    <div className="p-2 max-md:p-1">
                      <CardWait className="rounded-xl w-3/4 h-6" />
                    </div>
                    <Line />
                    {/* Price placeholder */}
                    <div className="flex justify-between items-center px-2 max-md:py-1 md:py-2">
                      <div className="flex flex-col gap-2">
                        <CardWait className="rounded-2xl w-16 h-6" />
                        <CardWait className="rounded-2xl w-16 h-6" />
                      </div>
                      <CardWait className="rounded-full w-8 h-8" />
                    </div>
                  </CardWait>
                </motion.div>
              ))}
            </div>
          );
        }
      }
      return (
        <div style={style} className="flex items-center gap-2 p-2">
          {Array.from({ length: columns }, (_, colIndex) => {
            const product = data?.at(index * columns + colIndex);
            return (
              typeof product === "object" &&
              (viewMode.get === "list" ? (
                <div key={product.id} className="w-full">
                  <ProductListItem
                    product={product}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    onToggleAvailability={handleToggleAvailability}
                    onViewDetails={handleViewProductDetails}
                    onDuplicate={handleDuplicateProduct}
                  />
                </div>
              ) : (
                <ProductRender
                  index={index * columns + colIndex}
                  product={product}
                  key={product.id}
                />
              ))
            );
          })}
        </div>
      );
    },
    [columns, isSelectionMode.get, viewMode.get]
  );
  // Memoized main content section to prevent unnecessary re-renders
  const MainContent = useMemo(() => {
    const loadingItemsCount = viewMode.get === "list" ? 8 : columns * 8;
    const data =
      loading || cacheLoading
        ? [...listItemData, ...range(0, loadingItemsCount)]
        : listItemData;
    if (data.length > 0) {
      return (
        <motion.div
          className="relative h-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {showShadow && (
            <motion.div
              style={{
                ...colorMerge({
                  boxShadow: handelShadowColor([
                    {
                      x: 0,
                      y: 0,
                      blur: 20,
                      size: 5,
                      colorId: "shadow.color",
                    },
                  ]),
                }),
              }}
              className="top-[-30px] z-[10000] absolute inset-x-0 shadow-xl h-[30px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          <List
            ref={listRef}
            height={listHeight}
            itemCount={itemCount}
            itemSize={viewMode.get === "list" ? 120 : 250}
            width={"100%"}
            itemData={data}
            onScroll={(e) => {
              setShowShadow(e.scrollOffset > 10);
            }}
          >
            {RenderItem}
          </List>
        </motion.div>
      );
    }
    return (
      <CreateFirstUI
        photo="https://static.vecteezy.com/system/resources/previews/018/868/634/non_2x/3d-best-product-icon-free-png.png"
        title="No Products Found"
        description="You haven't added any products yet. Click the button below to create your first product."
      />
    );
  }, [
    loading,
    cacheLoading,
    success,
    products.length,
    showShadow,
    colorMerge,
    listHeight,
    itemCount,
    listItemData,
    RenderItem,
    viewMode.get,
  ]);
  return (
    <motion.div
      className="relative flex flex-col h-full overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <PositionView positionId="searching">
        <motion.div
          className="flex justify-between items-center gap-2 p-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="relative flex justify-center w-full">
            <Field
              inputName="producer-search-product"
              placeholder="Search Product"
              className="rounded-xl"
            />
            <span className="top-1/2 right-2 absolute font-bold text-[--biqpod-primary] -translate-y-1/2 transform">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                / {filterProducts?.length || 0}
              </motion.span>
            </span>
          </div>
          <motion.div
            className="flex gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CircleTip
              icon={
                viewMode.get === "grid"
                  ? allIcons.solid.faList
                  : allIcons.solid.faTh
              }
              onClick={() =>
                viewMode.set(viewMode.get === "grid" ? "list" : "grid")
              }
            />
            <CircleTip
              icon={allIcons.solid.faFilter}
              onClick={() => {
                showPopup(
                  <AdminFilterProducts
                    value={options.get}
                    onChange={options.set}
                  />
                );
              }}
            />
          </motion.div>
        </motion.div>
        <Line />
      </PositionView>
      {isSelectionMode.get && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="flex justify-between items-center gap-2 bg-[--biqpod-primary] p-2 text-[--biqpod-primary-content]"
        >
          <div className="flex items-center gap-2">
            <CircleTip
              icon={allIcons.solid.faXmark}
              onClick={() => {
                isSelectionMode.set(false);
                selectedProducts.set([]);
              }}
              className="text-[--biqpod-primary-content]"
            />
            <span>{selectedProducts.get?.length || 0} selected</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const allFilteredIds =
                  filterProducts
                    ?.map((p) => p.id)
                    .filter((id): id is string => id !== undefined) || [];
                selectedProducts.set(allFilteredIds);
                showToast(
                  `Selected all ${allFilteredIds.length} filtered products`
                );
              }}
              className="bg-[--biqpod-primary-content] hover:bg-[--biqpod-primary-content] w-fit text-[--biqpod-primary]"
            >
              <Icon icon={allIcons.solid.faCheckSquare} className="mr-2" />
              Select All Filtered ({filterProducts?.length || 0})
            </Button>
            {selectedProducts.get && selectedProducts.get.length > 0 && (
              <Button
                onClick={({ clientX, clientY }) => {
                  openMenu({
                    x: clientX,
                    y: clientY,
                    menu: [
                      {
                        label: "Enable",
                        defaultIcon: allIcons.solid.faEye,
                        click: async () => {
                          const productCount =
                            selectedProducts.get?.length || 0;
                          const response = await confirm({
                            title: "Enable Products",
                            message: `Are you sure you want to enable ${productCount} selected product${
                              productCount > 1 ? "s" : ""
                            }?`,
                          });
                          if (response) {
                            execAction("bulk-toggle-availability", true);
                          }
                        },
                      },
                      {
                        label: "Disable",
                        defaultIcon: allIcons.solid.faEyeSlash,
                        click: async () => {
                          const productCount =
                            selectedProducts.get?.length || 0;
                          const response = await confirm({
                            title: "Disable Products",
                            message: `Are you sure you want to disable ${productCount} selected product${
                              productCount > 1 ? "s" : ""
                            }?`,
                          });
                          if (response) {
                            execAction("bulk-toggle-availability", false);
                          }
                        },
                      },
                      {
                        type: "separator",
                      },
                      {
                        label: "Merge Photos",
                        defaultIcon: allIcons.solid.faImages,
                        click: () => {
                          showPopup(
                            <MergeFilesPopup
                              selectedProducts={selectedProducts.get || []}
                              onSuccess={() => {
                                isSelectionMode.set(false);
                                selectedProducts.set([]);
                                showToast("Photos merged successfully!");
                              }}
                            />
                          );
                        },
                      },
                      {
                        label: "Delete All",
                        defaultIcon: allIcons.solid.faTrash,
                        click: async () => {
                          const productCount =
                            selectedProducts.get?.length || 0;
                          const response = await confirm({
                            title: "Delete Products",
                            message: `Are you sure you want to delete ${productCount} selected product${
                              productCount > 1 ? "s" : ""
                            }?`,
                            detail: "This action cannot be undone.",
                          });
                          if (response) {
                            execAction("bulk-delete-products");
                          }
                        },
                      },
                      {
                        type: "separator",
                      },
                      {
                        label: "Add Metadata",
                        defaultIcon: allIcons.solid.faTags,
                        click: () => {
                          showPopup(
                            <AddMetadataPopup
                              selectedProducts={selectedProducts.get || []}
                              onSuccess={() => {
                                isSelectionMode.set(false);
                                selectedProducts.set([]);
                                showToast("Metadata added successfully!");
                              }}
                            />
                          );
                        },
                      },
                      {
                        label: "Remove Metadata",
                        defaultIcon: allIcons.solid.faTrash,
                        click: () => {
                          showPopup(
                            <RemoveMetadataPopup
                              selectedProducts={selectedProducts.get || []}
                              onSuccess={() => {
                                isSelectionMode.set(false);
                                selectedProducts.set([]);
                                showToast("Metadata removed successfully!");
                              }}
                            />
                          );
                        },
                      },
                      {
                        label: "Remove All Metadata",
                        defaultIcon: allIcons.solid.faTrashAlt,
                        click: () => {
                          showPopup(
                            <RemoveAllMetadataPopup
                              selectedProducts={selectedProducts.get || []}
                              onSuccess={() => {
                                isSelectionMode.set(false);
                                selectedProducts.set([]);
                                showToast("All metadata removed successfully!");
                              }}
                            />
                          );
                        },
                      },
                      {
                        type: "separator",
                      },
                      {
                        label: "Assign Brand",
                        defaultIcon: allIcons.solid.faTag,
                        click: () => {
                          showPopup(
                            <SetBrandPopup
                              selectedProducts={selectedProducts.get || []}
                              onSuccess={() => {
                                isSelectionMode.set(false);
                                selectedProducts.set([]);
                                showToast("Brand assigned successfully!");
                              }}
                            />
                          );
                        },
                      },
                      {
                        label: "Remove Brand",
                        defaultIcon: allIcons.solid.faTrash,
                        click: async () => {
                          const response = await confirm({
                            title: "Remove Brand from Products",
                            message: `Are you sure you want to remove the brand from ${
                              selectedProducts.get?.length || 0
                            } selected product${
                              (selectedProducts.get?.length || 0) > 1 ? "s" : ""
                            }?`,
                            type: "warning",
                            detail: "This action cannot be undone.",
                          });
                          if (response) {
                            const promises = selectedProducts.get?.map((s) => {
                              return snapbuyApi.product.upsert(storeId!, [
                                { id: s, brandId: null } as any,
                              ]);
                            });
                            showToast("Removing brand from products...");
                            await Promise.all(promises || []);
                            showToast("Brand removed successfully!");
                            execAction("fetch-products", false);
                          }
                        },
                      },
                    ],
                  });
                }}
                disabled={bulkDeleteLoading || bulkToggleLoading}
                className="bg-[--biqpod-primary-content] hover:bg-[--biqpod-primary-content] disabled:opacity-50 w-fit text-[--biqpod-primary] disabled:cursor-not-allowed"
              >
                <Icon
                  icon={
                    bulkDeleteLoading || bulkToggleLoading
                      ? allIcons.solid.faCircleNotch
                      : allIcons.solid.faBolt
                  }
                  className={tw(
                    (bulkDeleteLoading || bulkToggleLoading) && "animate-spin",
                    "mr-2"
                  )}
                />
                {bulkDeleteLoading || bulkToggleLoading
                  ? "Processing..."
                  : `Actions (${selectedProducts.get?.length || 0})`}
              </Button>
            )}
          </div>
        </motion.div>
      )}
      {MainContent}
      {usedBy !== "read" && (
        <ToolsCard
          showTools={showTools.get}
          onToggleTools={toggleTools}
          onStartSelection={startSelectionMode}
        />
      )}
    </motion.div>
  );
};
